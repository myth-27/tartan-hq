import type { VerificationCase } from '@/types';
import { ConfidenceRing } from './ConfidenceRing';
import { AnomalyCard } from './AnomalyCard';
import { CheckCircle2, AlertTriangle, AlertCircle, HelpCircle } from 'lucide-react';
import clsx from 'clsx';

interface Props {
  data: VerificationCase | null;
}

export function DetailPanel({ data }: Props) {
  if (!data) {
    return (
      <div className="flex-1 flex items-center justify-center bg-slate-50">
        <div className="text-slate-400 text-center">
          <HelpCircle className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p>Select a case from the queue to view details</p>
        </div>
      </div>
    );
  }

  const { applicant, result, hrmsSource } = data;

  const BadgeIcon = result.tier === 'HIGH' ? CheckCircle2 :
                    result.tier === 'MEDIUM' ? AlertTriangle : AlertCircle;

  return (
    <div className="flex-1 flex flex-col bg-slate-50 overflow-y-auto">
      {/* Header Profile Info */}
      <div className="bg-white border-b border-slate-200 p-8 flex gap-8 items-center shadow-sm z-10">
        <ConfidenceRing score={result.score} tier={result.tier} size="lg" />
        
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-slate-900">{applicant.name}</h1>
          <p className="text-slate-500 text-lg">{applicant.role} at {applicant.company}</p>
          
          <div className="mt-4 flex gap-3">
            <div className={clsx(
              "flex items-center gap-1.5 px-3 py-1 rounded-md text-sm font-bold border",
              result.tier === 'HIGH' ? "bg-green-50 text-green-700 border-green-200" :
              result.tier === 'MEDIUM' ? "bg-amber-50 text-amber-700 border-amber-200" :
              "bg-red-50 text-red-700 border-red-200"
            )}>
              <BadgeIcon className="w-4 h-4" />
              {result.verdictText}
            </div>
            
            <div className="flex items-center px-3 py-1 bg-slate-100 text-slate-600 rounded-md text-sm font-medium border border-slate-200 uppercase tracking-wide">
              Source: {hrmsSource.replace('_', ' ')}
            </div>
          </div>
        </div>
      </div>

      <div className="p-8 max-w-5xl flex gap-8">
        {/* Left Column: Field Data */}
        <div className="flex-1 space-y-6">
          <section>
            <h3 className="text-lg font-semibold text-slate-800 mb-4 tracking-tight">Verified Employment Data</h3>
            <div className="bg-white rounded-lg border border-slate-200 overflow-hidden shadow-sm">
              <table className="w-full text-left">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Field</th>
                    <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Weight</th>
                    <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Value</th>
                    <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 uppercase tracking-wide font-mono text-sm leading-none">
                  {result.fieldScores.map((score, i) => (
                    <tr key={i} className="hover:bg-slate-50/50">
                      <td className="px-4 py-4 text-slate-700 font-sans tracking-normal capitalize">{score.displayName}</td>
                      <td className="px-4 py-4 text-slate-400">{score.weight}%</td>
                      <td className="px-4 py-4 text-slate-900 font-medium">
                        {score.field === 'ctcAnnual' && score.displayValue !== '-' ? `₹${(Number(score.displayValue) / 100000).toFixed(1)}L` : score.displayValue}
                      </td>
                      <td className="px-4 py-4 text-right">
                        {score.flag === 'ok' ? <CheckCircle2 className="w-5 h-5 ml-auto text-green-500" /> :
                         score.flag === 'warn' ? <AlertTriangle className="w-5 h-5 ml-auto text-amber-500" /> :
                         score.flag === 'err' ? <AlertCircle className="w-5 h-5 ml-auto text-red-500" /> :
                         <span className="text-slate-300">-</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </div>

        {/* Right Column: Narrative & Anomalies */}
        <div className="w-96 space-y-6">
          {/* Narrative Overview */}
          <section>
            <h3 className="text-lg font-semibold text-slate-800 mb-4 tracking-tight">Summary</h3>
            <div className="p-4 bg-indigo-50 text-indigo-900 rounded-lg border border-indigo-100 text-sm leading-relaxed font-medium">
              {result.narrative}
            </div>
          </section>

          {/* Anomalies List */}
          {result.anomalies.length > 0 && (
            <section>
              <h3 className="text-lg font-semibold text-slate-800 mb-4 tracking-tight flex items-center gap-2">
                Detected Anomalies
                <span className="bg-red-100 text-red-700 text-xs px-2 py-0.5 rounded-full font-bold">
                  {result.anomalies.length}
                </span>
              </h3>
              <div className="space-y-4">
                {result.anomalies.map(anomaly => (
                  <AnomalyCard key={anomaly.id} anomaly={anomaly} />
                ))}
              </div>
            </section>
          )}
        </div>
      </div>
    </div>
  );
}
