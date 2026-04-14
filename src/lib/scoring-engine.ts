import type { 
  NormalizedEmployeeData, 
  HRMSSource, 
  Anomaly, 
  VerificationResult, 
  FieldScore,
  ConfidenceTier,
  Verdict,
  FieldFlag
} from '@/types';
import { 
  FIELD_WEIGHTS, 
  SOURCE_MULTIPLIERS, 
  VERDICT_THRESHOLDS 
} from './constants';

export function calculateConfidence(
  data: NormalizedEmployeeData, 
  source: HRMSSource, 
  anomalies: Anomaly[]
): VerificationResult {
  const sourceMultiplier = SOURCE_MULTIPLIERS[source] || 0.5;
  
  const fieldScores: FieldScore[] = [];
  let baseScore = 0;

  // Evaluate fields
  for (const [key, config] of Object.entries(FIELD_WEIGHTS)) {
    const value = data[key as keyof NormalizedEmployeeData];
    let rawScore = 0;
    let flag: FieldFlag = 'missing';

    if (value !== undefined && value !== null && value !== '' && value !== 'UNKNOWN') {
      rawScore = 1;
      flag = 'ok';
    } else {
      rawScore = 0;
      flag = 'missing';
    }

    // Special logic: payslip count might be partial
    if (key === 'payslipCount' && typeof value === 'number') {
      if (value >= 12) rawScore = 1;
      else if (value >= 6) { rawScore = 0.5; flag = 'warn'; }
      else if (value > 0) { rawScore = 0.2; flag = 'warn'; }
      else { rawScore = 0; flag = 'err'; }
    }

    const finalScore = config.weight * rawScore * sourceMultiplier;
    baseScore += finalScore;

    // Check if anomalies apply to this field to update flag
    if (flag === 'ok') {
      const fieldAnomalies = anomalies.filter(a => {
        if (key === 'ctcAnnual' && a.type === 'CTC_VARIANCE') return true;
        if (key === 'dateOfJoining' && a.type === 'DOJ_CONFLICT') return true;
        if (key === 'jobTitle' && a.type === 'GRADE_SALARY_MISMATCH') return true;
        if (key === 'employmentType' && a.type === 'EMP_TYPE_CONFLICT') return true;
        if (key === 'pfAccount' && a.type === 'PF_MISSING') return true;
        return false;
      });

      if (fieldAnomalies.some(a => a.severity === 'HIGH')) {
        flag = 'err';
      } else if (fieldAnomalies.some(a => a.severity === 'MEDIUM' || a.severity === 'LOW')) {
        flag = 'warn';
      }
    }

    fieldScores.push({
      field: key,
      displayName: config.displayName,
      weight: config.weight,
      rawScore,
      sourceMultiplier,
      finalScore,
      flag,
      displayValue: String(value) || '-'
    });
  }

  // Calculate penalties
  const totalPenalty = anomalies.reduce((sum, a) => sum + a.penalty, 0);

  // Final score
  let score = Math.max(0, Math.min(100, Math.round(baseScore - totalPenalty)));

  // Determine tier and verdict
  let tier: ConfidenceTier = 'LOW';
  let verdict: Verdict = 'ESCALATE';

  if (score >= VERDICT_THRESHOLDS.AUTO_APPROVE) {
    tier = 'HIGH';
    verdict = 'AUTO_APPROVE';
  } else if (score >= VERDICT_THRESHOLDS.REVIEW) {
    tier = 'MEDIUM';
    verdict = 'REVIEW';
  }

  // Generate narrative
  let narrative = `Confidence score is ${score}% (${tier} tier). `;
  if (sourceMultiplier < 1) {
    narrative += `Data source (${source}) confidence is penalized by ${Math.round((1 - sourceMultiplier) * 100)}%. `;
  }
  if (anomalies.length > 0) {
    narrative += `Detected ${anomalies.length} anomal${anomalies.length > 1 ? 'ies' : 'y'} impacting score by -${totalPenalty} points.`;
  } else {
    narrative += `No anomalies detected in the provided data.`;
  }

  return {
    score,
    tier,
    verdict,
    verdictText: verdict.replace('_', ' '),
    fieldScores,
    anomalies,
    totalPenalty,
    narrative,
    calculatedAt: new Date().toISOString()
  };
}
