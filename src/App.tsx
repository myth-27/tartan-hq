import { useState, useEffect } from 'react';
import type { VerificationCase } from '@/types';
import { MOCK_CASES } from '@/data/mock-cases';
import { QueuePanel } from '@/components/QueuePanel';
import { DetailPanel } from '@/components/DetailPanel';
import { AIPanel } from '@/components/AIPanel';
import { useAIChat } from '@/hooks/useAIChat';
import { ShieldCheck } from 'lucide-react';

function App() {
  const [cases, setCases] = useState<VerificationCase[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const { messages, isLoading, sendMessage, clearMessages } = useAIChat();

  useEffect(() => {
    // Load mock data
    setCases(MOCK_CASES);
    if (MOCK_CASES.length > 0) {
      setSelectedId(MOCK_CASES[0].id);
    }
  }, []);

  const selectedCase = cases.find(c => c.id === selectedId) || null;

  const handleSelectCase = (id: string) => {
    setSelectedId(id);
    clearMessages(); // Reset chat context when switching cases
  };

  return (
    <div className="h-screen flex flex-col bg-slate-50 overflow-hidden font-sans text-slate-800">
      {/* Top Navbar */}
      <header className="h-14 bg-indigo-900 text-white px-6 flex items-center shadow-sm z-20 flex-shrink-0">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-6 h-6 text-indigo-400" />
          <h1 className="font-bold tracking-wider">TARTAN <span className="font-medium opacity-80">HYPERVERIFY</span></h1>
        </div>
      </header>

      {/* Main Content Areas */}
      <main className="flex-1 flex overflow-hidden">
        {/* Left: Queue */}
        <QueuePanel 
          cases={cases} 
          selectedId={selectedId} 
          onSelect={handleSelectCase} 
        />

        {/* Center: Details */}
        <DetailPanel data={selectedCase} />

        {/* Right: AI Assistant */}
        <AIPanel 
          selectedCase={selectedCase}
          messages={messages}
          isLoading={isLoading}
          onSend={(msg) => sendMessage(msg, selectedCase)}
        />
      </main>
    </div>
  );
}

export default App;
