import { useState, useRef, useEffect } from 'react';
import type { VerificationCase, ChatMessage } from '@/types';
import { Bot, Send, User, ChevronDown, ChevronUp, Sparkles } from 'lucide-react';
import clsx from 'clsx';

interface Props {
  selectedCase: VerificationCase | null;
  messages: ChatMessage[];
  isLoading: boolean;
  onSend: (message: string) => void;
}

export function AIPanel({ selectedCase, messages, isLoading, onSend }: Props) {
  const [isOpen, setIsOpen] = useState(true);
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const suggestedQuestions = [
    "Explain the CTC variance anomaly.",
    "Should I verify these payslips manually?",
    "Why is the source multiplier 0.70x?"
  ];

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  if (!selectedCase) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;
    onSend(input);
    setInput('');
  };

  return (
    <div className={clsx(
      "border-t lg:border-t-0 lg:border-l border-slate-200 bg-white shadow-xl transition-all duration-300 flex flex-col z-10 lg:h-full lg:max-h-none",
      isOpen ? "h-[500px] lg:w-[420px]" : "h-14 lg:w-14"
    )}>
      {/* Header Banner */}
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="h-14 px-4 flex items-center justify-between bg-indigo-50 hover:bg-indigo-100 transition-colors w-full border-b border-indigo-100 flex-shrink-0"
      >
        <div className="flex items-center gap-3 text-indigo-900 overflow-hidden whitespace-nowrap">
          <Bot className="w-5 h-5 text-indigo-600 flex-shrink-0" />
          {isOpen && (
            <span className="font-bold tracking-wide text-sm flex gap-2 items-center text-indigo-900">
              AI ASSISTANT
              <Sparkles className="w-4 h-4 text-amber-500" />
            </span>
          )}
        </div>
        <div className="text-indigo-400 flex-shrink-0">
          {isOpen ? <ChevronDown className="w-5 h-5 -rotate-90" /> : <ChevronUp className="w-5 h-5 -rotate-90" />}
        </div>
      </button>

      {isOpen && (
        <div className="flex-1 flex flex-col min-h-0 bg-slate-50/50">
          {/* Chat Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-slate-500 text-sm p-4">
                <Bot className="w-10 h-10 text-slate-300 mb-3" />
                <p>Ask a question comparing HRMS data vs declared data.</p>
                <div className="mt-4 flex flex-wrap gap-2 justify-center">
                  {suggestedQuestions.map((q, i) => (
                    <button key={i} onClick={() => onSend(q)} className="bg-white border border-slate-200 px-3 py-1.5 rounded-full shadow-sm hover:border-indigo-300 hover:text-indigo-700 transition">
                      {q}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              messages.map(msg => (
                <div key={msg.id} className={clsx(
                  "flex gap-3 max-w-[85%]",
                  msg.role === 'user' ? "ml-auto flex-row-reverse" : "mr-auto"
                )}>
                  <div className={clsx(
                    "flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center",
                    msg.role === 'user' ? "bg-indigo-600 text-white" : "bg-slate-200 text-slate-600"
                  )}>
                    {msg.role === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                  </div>
                  <div className={clsx(
                    "px-4 py-3 rounded-2xl text-sm whitespace-pre-wrap shadow-sm",
                    msg.role === 'user' 
                      ? "bg-indigo-600 text-white rounded-tr-none" 
                      : "bg-white border border-slate-200 text-slate-700 rounded-tl-none font-medium leading-relaxed"
                  )}>
                    {msg.content}
                  </div>
                </div>
              ))
            )}
            
            {isLoading && (
              <div className="flex gap-3 mr-auto max-w-[85%] animate-pulse">
                <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-slate-600">
                  <Bot className="w-4 h-4" />
                </div>
                <div className="px-4 py-3 rounded-2xl bg-white border border-slate-200 rounded-tl-none flex gap-1 items-center">
                  <div className="w-2 h-2 bg-slate-300 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <div className="w-2 h-2 bg-slate-300 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <div className="w-2 h-2 bg-slate-300 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="p-3 bg-white border-t border-slate-200">
            <form onSubmit={handleSubmit} className="flex items-end gap-2 relative">
              <textarea
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSubmit(e); }
                }}
                placeholder="Ask AI for insights..."
                className="flex-1 max-h-32 min-h-[44px] resize-none bg-slate-100 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                rows={1}
              />
              <button
                type="submit"
                disabled={!input.trim() || isLoading}
                className="flex-shrink-0 w-[44px] h-[44px] bg-indigo-600 text-white rounded-xl flex items-center justify-center disabled:opacity-50 disabled:bg-slate-300 transition-colors"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
