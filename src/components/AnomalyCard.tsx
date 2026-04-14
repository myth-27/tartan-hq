import type { Anomaly } from '@/types';
import { AlertCircle, FileWarning, AlertTriangle } from 'lucide-react';
import clsx from 'clsx';

interface Props {
  anomaly: Anomaly;
}

export function AnomalyCard({ anomaly }: Props) {
  const isHigh = anomaly.severity === 'HIGH';
  const isMedium = anomaly.severity === 'MEDIUM';

  const Icon = isHigh ? AlertCircle : isMedium ? AlertTriangle : FileWarning;

  return (
    <div className={clsx(
      "p-4 rounded-lg border-l-4 bg-white shadow-sm flex flex-col gap-2",
      isHigh ? "border-l-red-600 border border-slate-200" :
      isMedium ? "border-l-amber-600 border border-slate-200" :
      "border-l-slate-500 border border-slate-200"
    )}>
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2">
          <Icon className={clsx(
            "w-5 h-5",
            isHigh ? "text-red-600" : isMedium ? "text-amber-600" : "text-slate-500"
          )} />
          <h4 className="font-semibold text-slate-800">{anomaly.title}</h4>
        </div>
        <span className={clsx(
          "text-xs px-2 py-0.5 rounded-full font-bold",
          isHigh ? "bg-red-100 text-red-700" :
          isMedium ? "bg-amber-100 text-amber-700" :
          "bg-slate-100 text-slate-700"
        )}>
          -{anomaly.penalty} PTS
        </span>
      </div>
      
      <p className="text-sm text-slate-600">{anomaly.description}</p>
      
      {(anomaly.rawValue || anomaly.expectedValue) && (
        <div className="mt-2 text-xs font-mono bg-slate-50 p-2 rounded border border-slate-100 flex flex-col gap-1">
          {anomaly.expectedValue && <div>Expected (Declared): <span className="text-slate-800">{anomaly.expectedValue}</span></div>}
          {anomaly.rawValue && <div>Actual (HRMS): <span className={isHigh ? "text-red-600" : "text-amber-600"}>{anomaly.rawValue}</span></div>}
        </div>
      )}
    </div>
  );
}
