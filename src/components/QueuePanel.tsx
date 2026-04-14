import type { VerificationCase } from '@/types';
import { ConfidenceRing } from './ConfidenceRing';
import clsx from 'clsx';

interface Props {
  cases: VerificationCase[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}

export function QueuePanel({ cases, selectedId, onSelect }: Props) {
  // Sort by score desc
  const sortedCases = [...cases].sort((a, b) => b.result.score - a.result.score);

  return (
    <div className="w-full lg:w-80 border-b lg:border-b-0 lg:border-r border-slate-200 bg-white max-h-64 lg:max-h-none lg:h-full flex flex-col flex-shrink-0">
      <div className="p-4 border-b border-slate-200 flex items-center justify-between">
        <h2 className="font-semibold text-slate-800 tracking-tight">Verification Queue</h2>
        <span className="bg-indigo-100 text-indigo-700 text-xs font-bold px-2 py-1 rounded-full">
          {cases.length} pending
        </span>
      </div>
      
      <div className="flex-1 overflow-y-auto">
        {sortedCases.map(c => {
          const isSelected = selectedId === c.id;
          return (
            <button
              key={c.id}
              onClick={() => onSelect(c.id)}
              className={clsx(
                "w-full text-left p-4 border-b border-slate-100 hover:bg-slate-50 transition-colors flex items-center gap-4",
                isSelected && "bg-indigo-50 border-indigo-100"
              )}
            >
              <div className="flex-shrink-0">
                <ConfidenceRing score={c.result.score} tier={c.result.tier} size="sm" />
              </div>
              <div className="flex-1 overflow-hidden">
                <div className="font-semibold text-slate-900 truncate">{c.applicant.name}</div>
                <div className="text-xs text-slate-500 truncate">{c.applicant.role}</div>
                <div className="text-xs text-slate-500 truncate">{c.applicant.company}</div>
              </div>
              <div className={clsx(
                "w-2 h-2 rounded-full",
                c.result.tier === 'HIGH' ? "bg-green-500" :
                c.result.tier === 'MEDIUM' ? "bg-amber-500" : "bg-red-500"
              )} />
            </button>
          );
        })}
      </div>
    </div>
  );
}
