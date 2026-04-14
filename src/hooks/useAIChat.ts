import { useState, useCallback } from 'react';
import type { ChatMessage, VerificationCase } from '@/types';

export function useAIChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const sendMessage = useCallback(async (content: string, caseContext: VerificationCase | null) => {
    if (!content.trim() || !caseContext) return;

    // Add user message immediately to the UI
    const userMsg: ChatMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      content,
      timestamp: new Date().toISOString()
    };
    setMessages(prev => [...prev, userMsg]);

    setIsLoading(true);

    const apiKey = import.meta.env.VITE_NVIDIA_API_KEY;

    if (!apiKey) {
      setMessages(prev => [...prev, {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: "Error: VITE_NVIDIA_API_KEY is not set in your .env file.",
        timestamp: new Date().toISOString()
      }]);
      setIsLoading(false);
      return;
    }

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

      // Now calling our secure local proxy instead of direct NVIDIA API
      const url = '/api/chat';
      
      const payload = {
        model: 'meta/llama-3.1-8b-instruct',
        messages: [
          { role: 'system', content: systemPrompt },
          ...messages.map(m => ({
            role: m.role,
            content: m.content
          })),
          { role: 'user', content }
        ],
        max_tokens: 500,
        temperature: 0.2,
      };

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const errorDetail = await response.text();
        throw new Error(`Proxy Error (${response.status}): ${errorDetail}`);
      }

      const data = await response.json();
      const aiContent = data.choices?.[0]?.message?.content || 'No response generated.';

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
        content: `Connection Issue: ${error instanceof Error ? error.message : 'Unknown error'}. This usually means the backend is starting up. Please try again in a few seconds.`,
        timestamp: new Date().toISOString()
      }]);
    } finally {
      setIsLoading(false);
    }
  }, [messages]);

  const clearMessages = useCallback(() => setMessages([]), []);

  return { messages, isLoading, sendMessage, clearMessages };
}
