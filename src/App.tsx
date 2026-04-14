import { useState, useEffect } from 'react';
import type { VerificationCase } from '@/types';
import { MOCK_CASES } from '@/data/mock-cases';
import { QueuePanel } from '@/components/QueuePanel';
import { DetailPanel } from '@/components/DetailPanel';
import { AIPanel } from '@/components/AIPanel';
import { useAIChat } from '@/hooks/useAIChat';
import { ShieldCheck, List, FileText, Bot } from 'lucide-react';
import clsx from 'clsx';

type MobileTab = 'queue' | 'detail' | 'ai';

function App() {
  const [cases, setCases] = useState<VerificationCase[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [mobileTab, setMobileTab] = useState<MobileTab>('queue');

  const { messages, isLoading, sendMessage, clearMessages } = useAIChat();

  useEffect(() => {
    setCases(MOCK_CASES);
    if (MOCK_CASES.length > 0) {
      setSelectedId(MOCK_CASES[0].id);
    }
  }, []);

  const selectedCase = cases.find(c => c.id === selectedId) || null;

  const handleSelectCase = (id: string) => {
    setSelectedId(id);
    clearMessages();
    setMobileTab('detail'); // Auto-navigate to detail on mobile after selecting
  };

  const tabs = [
    { id: 'queue' as MobileTab, label: 'Queue', icon: List },
    { id: 'detail' as MobileTab, label: 'Details', icon: FileText },
    { id: 'ai' as MobileTab, label: 'AI', icon: Bot },
  ];

  return (
    <div className="h-screen flex flex-col bg-slate-50 overflow-hidden font-sans text-slate-800">
      {/* Top Navbar */}
      <header className="h-14 bg-indigo-900 text-white px-4 lg:px-6 flex items-center shadow-sm z-20 flex-shrink-0">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-6 h-6 text-indigo-400" />
          <h1 className="font-bold tracking-wider text-sm lg:text-base">TARTAN <span className="font-medium opacity-80">HYPERVERIFY</span></h1>
        </div>
      </header>

      {/* Desktop Layout: 3-column side-by-side */}
      <main className="hidden lg:flex flex-1 overflow-hidden">
        <QueuePanel cases={cases} selectedId={selectedId} onSelect={handleSelectCase} />
        <DetailPanel data={selectedCase} />
        <AIPanel
          selectedCase={selectedCase}
          messages={messages}
          isLoading={isLoading}
          onSend={(msg) => sendMessage(msg, selectedCase)}
        />
      </main>

      {/* Mobile Layout: Tab-based navigation */}
      <div className="flex lg:hidden flex-1 flex-col overflow-hidden">
        {/* Tab Content */}
        <div className="flex-1 overflow-hidden relative">
          <div className={clsx("absolute inset-0 overflow-y-auto", mobileTab === 'queue' ? 'block' : 'hidden')}>
            <QueuePanelMobile cases={cases} selectedId={selectedId} onSelect={handleSelectCase} />
          </div>
          <div className={clsx("absolute inset-0 overflow-y-auto", mobileTab === 'detail' ? 'block' : 'hidden')}>
            <DetailPanelMobile data={selectedCase} />
          </div>
          <div className={clsx("absolute inset-0 flex flex-col", mobileTab === 'ai' ? 'flex' : 'hidden')}>
            <AIPanelMobile
              selectedCase={selectedCase}
              messages={messages}
              isLoading={isLoading}
              onSend={(msg) => sendMessage(msg, selectedCase)}
            />
          </div>
        </div>

        {/* Bottom Tab Bar */}
        <nav className="flex-shrink-0 bg-white border-t border-slate-200 flex safe-pb">
          {tabs.map(tab => {
            const Icon = tab.icon;
            const isActive = mobileTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setMobileTab(tab.id)}
                className={clsx(
                  "flex-1 flex flex-col items-center justify-center py-2 gap-1 transition-colors",
                  isActive ? "text-indigo-600" : "text-slate-400"
                )}
              >
                <Icon className="w-5 h-5" />
                <span className="text-[10px] font-semibold tracking-wide uppercase">{tab.label}</span>
                {isActive && <div className="w-6 h-0.5 bg-indigo-600 rounded-full" />}
              </button>
            );
          })}
        </nav>
      </div>
    </div>
  );
}

// ── Mobile-optimized Queue Panel ─────────────────────────────────────────────
import type { VerificationCase as VC } from '@/types';
import { ConfidenceRing } from '@/components/ConfidenceRing';

function QueuePanelMobile({ cases, selectedId, onSelect }: { cases: VC[], selectedId: string | null, onSelect: (id: string) => void }) {
  const sorted = [...cases].sort((a, b) => b.result.score - a.result.score);
  return (
    <div className="bg-white min-h-full">
      <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between sticky top-0 bg-white z-10">
        <h2 className="font-bold text-slate-800">Verification Queue</h2>
        <span className="bg-indigo-100 text-indigo-700 text-xs font-bold px-2.5 py-1 rounded-full">{cases.length} pending</span>
      </div>
      <div>
        {sorted.map(c => {
          const isSelected = selectedId === c.id;
          return (
            <button key={c.id} onClick={() => onSelect(c.id)}
              className={clsx("w-full text-left px-4 py-3 border-b border-slate-100 flex items-center gap-3 active:bg-slate-50 transition-colors",
                isSelected && "bg-indigo-50 border-l-4 border-l-indigo-500"
              )}
            >
              <ConfidenceRing score={c.result.score} tier={c.result.tier} size="sm" />
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-slate-900 truncate text-sm">{c.applicant.name}</div>
                <div className="text-xs text-slate-500 truncate">{c.applicant.role} · {c.applicant.company}</div>
              </div>
              <div className={clsx("w-2.5 h-2.5 rounded-full flex-shrink-0",
                c.result.tier === 'HIGH' ? 'bg-green-500' : c.result.tier === 'MEDIUM' ? 'bg-amber-500' : 'bg-red-500'
              )} />
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ── Mobile-optimized Detail Panel (simplified) ──────────────────────────────
import { CheckCircle2, AlertTriangle, AlertCircle } from 'lucide-react';
import { AnomalyCard } from '@/components/AnomalyCard';

function DetailPanelMobile({ data }: { data: VC | null }) {
  if (!data) return (
    <div className="flex items-center justify-center h-full text-slate-400 text-sm text-center p-8">
      <div>
        <FileText className="w-10 h-10 mb-3 mx-auto opacity-40" />
        <p>Select a case from the Queue tab to view details.</p>
      </div>
    </div>
  );
  const { applicant, result, hrmsSource } = data;
  const BadgeIcon = result.tier === 'HIGH' ? CheckCircle2 : result.tier === 'MEDIUM' ? AlertTriangle : AlertCircle;
  return (
    <div className="pb-4">
      {/* Profile Card */}
      <div className="bg-white border-b border-slate-200 p-4 flex items-center gap-4">
        <ConfidenceRing score={result.score} tier={result.tier} size="lg" />
        <div className="flex-1 min-w-0">
          <h2 className="font-bold text-slate-900 text-base truncate">{applicant.name}</h2>
          <p className="text-xs text-slate-500 truncate">{applicant.role} · {applicant.company}</p>
          <div className="flex flex-wrap gap-2 mt-2">
            <span className={clsx("flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded-md border",
              result.tier === 'HIGH' ? 'bg-green-50 text-green-700 border-green-200' :
              result.tier === 'MEDIUM' ? 'bg-amber-50 text-amber-700 border-amber-200' : 'bg-red-50 text-red-700 border-red-200'
            )}>
              <BadgeIcon className="w-3 h-3" /> {result.verdictText}
            </span>
            <span className="text-xs font-medium px-2 py-0.5 bg-slate-100 text-slate-600 rounded-md border border-slate-200 uppercase tracking-wide">
              {hrmsSource.replace('_', ' ')}
            </span>
          </div>
        </div>
      </div>

      {/* Summary */}
      <div className="px-4 pt-4">
        <h3 className="font-semibold text-slate-800 text-sm mb-2">Summary</h3>
        <p className="text-sm bg-indigo-50 text-indigo-900 rounded-lg p-3 border border-indigo-100 leading-relaxed">{result.narrative}</p>
      </div>

      {/* Field Scores as Cards */}
      <div className="px-4 pt-4">
        <h3 className="font-semibold text-slate-800 text-sm mb-2">Verification Data</h3>
        <div className="space-y-2">
          {result.fieldScores.map((score, i) => (
            <div key={i} className="bg-white rounded-lg border border-slate-200 px-3 py-2 flex items-center justify-between">
              <div>
                <div className="text-sm font-medium text-slate-800 capitalize">{score.displayName}</div>
                <div className="text-xs text-slate-400">{score.weight}% weight</div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-mono text-slate-700">
                  {score.field === 'ctcAnnual' && score.displayValue !== '-' ? `₹${(Number(score.displayValue) / 100000).toFixed(1)}L` : score.displayValue}
                </span>
                {score.flag === 'ok' ? <CheckCircle2 className="w-4 h-4 text-green-500" /> :
                 score.flag === 'warn' ? <AlertTriangle className="w-4 h-4 text-amber-500" /> :
                 score.flag === 'err' ? <AlertCircle className="w-4 h-4 text-red-500" /> :
                 <span className="text-slate-300 text-sm">—</span>}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Anomalies */}
      {result.anomalies.length > 0 && (
        <div className="px-4 pt-4">
          <h3 className="font-semibold text-slate-800 text-sm mb-2 flex items-center gap-2">
            Anomalies
            <span className="bg-red-100 text-red-700 text-xs px-1.5 py-0.5 rounded-full font-bold">{result.anomalies.length}</span>
          </h3>
          <div className="space-y-3">
            {result.anomalies.map(a => <AnomalyCard key={a.id} anomaly={a} />)}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Mobile-optimized AI Panel (full height conversational) ──────────────────
import { useState as useStateLocal, useRef, useEffect as useEffectLocal } from 'react';
import type { ChatMessage } from '@/types';
import { Send, User } from 'lucide-react';
import { Sparkles } from 'lucide-react';

function AIPanelMobile({ selectedCase, messages, isLoading, onSend }: {
  selectedCase: VC | null;
  messages: ChatMessage[];
  isLoading: boolean;
  onSend: (msg: string) => void;
}) {
  const [input, setInput] = useStateLocal('');
  const bottomRef = useRef<HTMLDivElement>(null);
  const suggestedQuestions = [
    "Explain the CTC variance anomaly.",
    "Should I verify these payslips manually?",
    "Why is the source multiplier 0.70x?"
  ];

  useEffectLocal(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;
    onSend(input);
    setInput('');
  };

  if (!selectedCase) return (
    <div className="flex-1 flex items-center justify-center text-slate-400 text-sm text-center p-8">
      <div>
        <Bot className="w-10 h-10 mb-3 mx-auto opacity-40" />
        <p>Select a case from the Queue tab first.</p>
      </div>
    </div>
  );

  return (
    <>
      {/* Header */}
      <div className="px-4 py-3 border-b border-indigo-100 bg-indigo-50 flex items-center gap-2 flex-shrink-0">
        <Bot className="w-5 h-5 text-indigo-600" />
        <span className="font-bold text-indigo-900 text-sm tracking-wide">AI ASSISTANT</span>
        <Sparkles className="w-4 h-4 text-amber-500" />
        <span className="ml-auto text-xs text-indigo-400 font-medium truncate max-w-[120px]">{selectedCase.applicant.name}</span>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-slate-400 text-sm text-center gap-4 py-8">
            <Bot className="w-10 h-10 text-slate-300" />
            <p>Ask a question about this candidate's verification data.</p>
            <div className="flex flex-col gap-2 w-full">
              {suggestedQuestions.map((q, i) => (
                <button key={i} onClick={() => onSend(q)}
                  className="bg-white border border-slate-200 px-4 py-2.5 rounded-xl shadow-sm text-left text-sm text-slate-600 hover:border-indigo-300 hover:text-indigo-700 transition active:bg-slate-50">
                  {q}
                </button>
              ))}
            </div>
          </div>
        ) : messages.map(msg => (
          <div key={msg.id} className={clsx("flex gap-2 max-w-[90%]",
            msg.role === 'user' ? 'ml-auto flex-row-reverse' : 'mr-auto'
          )}>
            <div className={clsx("flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-xs",
              msg.role === 'user' ? 'bg-indigo-600 text-white' : 'bg-white border border-slate-200 text-slate-500'
            )}>
              {msg.role === 'user' ? <User className="w-3.5 h-3.5" /> : <Bot className="w-3.5 h-3.5" />}
            </div>
            <div className={clsx("px-3 py-2.5 rounded-2xl text-sm whitespace-pre-wrap shadow-sm leading-relaxed",
              msg.role === 'user' ? 'bg-indigo-600 text-white rounded-tr-none' : 'bg-white border border-slate-200 text-slate-700 rounded-tl-none'
            )}>
              {msg.content}
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex gap-2 mr-auto">
            <div className="w-7 h-7 rounded-full bg-white border border-slate-200 flex items-center justify-center">
              <Bot className="w-3.5 h-3.5 text-slate-500" />
            </div>
            <div className="px-3 py-2.5 rounded-2xl bg-white border border-slate-200 rounded-tl-none flex gap-1 items-center">
              <div className="w-2 h-2 bg-slate-300 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
              <div className="w-2 h-2 bg-slate-300 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
              <div className="w-2 h-2 bg-slate-300 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="p-3 bg-white border-t border-slate-200 flex-shrink-0">
        <form onSubmit={handleSubmit} className="flex items-end gap-2">
          <textarea
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSubmit(e); } }}
            placeholder="Ask AI for insights..."
            className="flex-1 max-h-28 min-h-[44px] resize-none bg-slate-100 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
            rows={1}
          />
          <button type="submit" disabled={!input.trim() || isLoading}
            className="flex-shrink-0 w-11 h-11 bg-indigo-600 text-white rounded-xl flex items-center justify-center disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </>
  );
}

export default App;
