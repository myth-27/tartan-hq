import type { HRMSSource, ConfidenceTier, Verdict } from '@/types';

export const FIELD_WEIGHTS: Record<string, { weight: number; displayName: string }> = {
  employerName: { weight: 20, displayName: 'Employer Name' },
  ctcAnnual: { weight: 20, displayName: 'CTC / Salary' },
  dateOfJoining: { weight: 15, displayName: 'Date of Joining' },
  employmentType: { weight: 15, displayName: 'Employment Type' },
  pfAccount: { weight: 12, displayName: 'PF/ESI Status' },
  jobTitle: { weight: 10, displayName: 'Job Title' },
  payslipCount: { weight: 8, displayName: 'Payslip Count' },
};

export const SOURCE_MULTIPLIERS: Record<HRMSSource, number> = {
  workday: 1.0,
  keka: 1.0,
  greythr: 1.0,
  darwinbox: 1.0,
  sap: 0.95,
  payslip_ocr: 0.70,
  self_declared: 0.50,
};

export const ANOMALY_PENALTIES = {
  CTC_VARIANCE: { penalty: 8, severity: 'MEDIUM' as const },
  PAYSLIP_GAP: { penalty: 12, severity: 'MEDIUM' as const },
  GRADE_SALARY_MISMATCH: { penalty: 10, severity: 'MEDIUM' as const },
  EMP_TYPE_CONFLICT: { penalty: 15, severity: 'HIGH' as const },
  DOJ_CONFLICT: { penalty: 20, severity: 'HIGH' as const },
  PF_MISSING: { penalty: 5, severity: 'LOW' as const },
};

export const VERDICT_THRESHOLDS = {
  AUTO_APPROVE: 80,
  REVIEW: 55,
  ESCALATE: 0,
};

export const TIER_COLORS: Record<ConfidenceTier, string> = {
  HIGH: '#0f7a4a',   // green
  MEDIUM: '#b45309', // amber
  LOW: '#b91c1c',    // red
};

export const getVerdictText = (verdict: Verdict): string => {
  switch (verdict) {
    case 'AUTO_APPROVE': return 'Auto Approve';
    case 'REVIEW': return 'Manual Review';
    case 'ESCALATE': return 'Escalate';
    default: return 'Unknown';
  }
};
