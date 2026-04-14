import { useState, useCallback } from 'react';
import type { ChatMessage, VerificationCase } from '@/types';

export function useAIChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const sendMessage = useCallback(async (content: string, caseContext: VerificationCase | null) => {
    if (!content.trim() || !caseContext) return;

    const endpoint = import.meta.env.VITE_AZURE_CLAUDE_ENDPOINT;
    const apiKey = import.meta.env.VITE_AZURE_CLAUDE_API_KEY;

    // Add user message immediately
    const userMsg: ChatMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      content,
      timestamp: new Date().toISOString()
    };
    
    setMessages(prev => [...prev, userMsg]);

    if (!apiKey || !endpoint) {
      setMessages(prev => [...prev, {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: "Error: VITE_AZURE_CLAUDE_API_KEY or VITE_AZURE_CLAUDE_ENDPOINT is not set in your .env file.",
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

      // Transform history for Claude
      const claudeMessages = messages.map(m => ({
        role: m.role,
        content: m.content
      }));
      claudeMessages.push({ role: 'user', content });

      const payload = {
        model: 'claude-sonnet-4-6',
        max_tokens: 1024,
        system: systemPrompt,
        messages: claudeMessages
      };

      const res = await fetch(`${endpoint}/v1/messages`, {
        method: "POST",
        headers: {
          "x-api-key": apiKey,
          "anthropic-version": "2023-06-01",
          "content-type": "application/json"
        },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        const errText = await res.text();
        throw new Error(`API ${res.status}: ${errText}`);
      }

      const data = await res.json();
      const aiContent = data.content?.[0]?.text || 'No response generated.';

      setMessages(prev => [...prev, {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: aiContent,
        timestamp: new Date().toISOString()
      }]);
    } catch (error) {
      console.error("AI Chat Error:", error);
      let errMsg = error instanceof Error ? error.message : 'Unknown error';
      if (errMsg.includes('not subscribed')) {
        errMsg = "Azure Marketplace Subscription Error: Please ensure your Azure subscription for this model is active.";
      }
      setMessages(prev => [...prev, {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: `Connection Error: ${errMsg}`,
        timestamp: new Date().toISOString()
      }]);
    } finally {
      setIsLoading(false);
    }
  }, [messages]);

  const clearMessages = useCallback(() => setMessages([]), []);

  return { messages, isLoading, sendMessage, clearMessages };
}
