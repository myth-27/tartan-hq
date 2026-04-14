import { useState, useCallback } from 'react';
import type { ChatMessage, VerificationCase } from '@/types';

export function useAIChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const sendMessage = useCallback(async (content: string, caseContext: VerificationCase | null) => {
    if (!content.trim() || !caseContext) return;

    const apiKey = import.meta.env.VITE_GEMINI_API_KEY;

    // Add user message immediately
    const userMsg: ChatMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      content,
      timestamp: new Date().toISOString()
    };
    
    setMessages(prev => [...prev, userMsg]);

    if (!apiKey) {
      setMessages(prev => [...prev, {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: "Error: VITE_GEMINI_API_KEY is not set in your .env file.",
        timestamp: new Date().toISOString()
      }]);
      return;
    }

    setIsLoading(true);

    try {
      const systemPrompt = `You are Tartan's HyperVerify AI Confidence Engine — an analyst embedded in an enterprise verification platform.
CURRENT CASE:
- Applicant: ${caseContext.applicant.name} (${caseContext.applicant.role})
- Confidence Score: ${caseContext.result.score}% [${caseContext.result.tier}]
- Verdict: ${caseContext.result.verdictText}
- Source: ${caseContext.hrmsSource}
- Anomalies Detected: ${caseContext.result.anomalies.map(a => a.title).join(', ') || 'None'}

YOUR ROLE: Help underwriters interpret verification results. 
- Explain WHY a confidence score is what it is.
- Guide on manual checks if requested.
- Reference missing data points impacting the score.
- Be concise (3-4 sentences), precise, and decisive. Enterprise risk depends on it.`;

      // Construct Gemini request payload
      // Using gemini-2.5-flash as the standard model
      const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;
      
      const payload = {
        systemInstruction: {
          parts: [{ text: systemPrompt }]
        },
        contents: [
          ...messages.map(m => ({
            role: m.role === 'user' ? 'user' : 'model',
            parts: [{ text: m.content }]
          })),
          {
            role: 'user',
            parts: [{ text: content }]
          }
        ],
        generationConfig: {
          maxOutputTokens: 500,
          temperature: 0.3, // low temp for analytical responses
        }
      };

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        throw new Error(`API returned ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      const aiContent = data.candidates?.[0]?.content?.parts?.[0]?.text || 'No response generated.';

      setMessages(prev => [...prev, {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: aiContent,
        timestamp: new Date().toISOString()
      }]);
    } catch (error) {
      console.error("AI Chat Error:", error);
      setMessages(prev => [...prev, {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: `Error connecting to Gemini API: ${error instanceof Error ? error.message : 'Unknown error'}. Please check your console.`,
        timestamp: new Date().toISOString()
      }]);
    } finally {
      setIsLoading(false);
    }
  }, [messages]);

  const clearMessages = useCallback(() => setMessages([]), []);

  return { messages, isLoading, sendMessage, clearMessages };
}
