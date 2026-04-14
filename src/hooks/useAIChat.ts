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

    const models = ['gemini-2.5-flash', 'gemini-2.0-flash', 'gemini-1.5-flash'];
    
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

    let aiContent = '';
    let lastError = '';

    for (const model of models) {
      try {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
        
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
            temperature: 0.3,
          }
        };

        const response = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(payload)
        });

        if (response.status >= 500) {
          // If server error, try the next model in the list
          console.warn(`Gemini ${model} returned ${response.status}. Trying next fallback...`);
          lastError = `API ${response.status}: ${response.statusText}`;
          continue;
        }

        if (!response.ok) {
          throw new Error(`API returned ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();
        aiContent = data.candidates?.[0]?.content?.parts?.[0]?.text || 'No response generated.';
        
        // If we got content, break the loop
        if (aiContent) break;

      } catch (error) {
        console.error(`Attempt with ${model} failed:`, error);
        lastError = error instanceof Error ? error.message : 'Unknown error';
        // Continue to next model on network/parse errors too
      }
    }

    if (aiContent) {
      setMessages(prev => [...prev, {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: aiContent,
        timestamp: new Date().toISOString()
      }]);
    } else {
      setMessages(prev => [...prev, {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: `Error connecting to Gemini API: ${lastError}. All fallback models exhausted. Please try again in 30 seconds.`,
        timestamp: new Date().toISOString()
      }]);
    }

    setIsLoading(false);
  }, [messages]);

  const clearMessages = useCallback(() => setMessages([]), []);

  return { messages, isLoading, sendMessage, clearMessages };
}
