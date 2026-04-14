export type HRMSSource = 'workday' | 'keka' | 'greythr' | 'darwinbox' | 'sap' | 'payslip_ocr' | 'self_declared';
export type EmploymentType = 'FTE' | 'CONTRACT' | 'INTERN' | 'GIG' | 'UNKNOWN';
export type AnomalySeverity = 'HIGH' | 'MEDIUM' | 'LOW';
export type ConfidenceTier = 'HIGH' | 'MEDIUM' | 'LOW';
export type Verdict = 'AUTO_APPROVE' | 'REVIEW' | 'ESCALATE';
export type FieldFlag = 'ok' | 'warn' | 'err' | 'missing';

export interface NormalizedEmployeeData {
  employeeId: string;
  employerName: string;
  ctcAnnual: number;
  dateOfJoining: string; // ISO string
  employmentType: EmploymentType;
  pfAccount: string;
  jobTitle: string;
  payslipCount: number;
  lastPayslipDate: string; // ISO string
  rawSource: HRMSSource;
}

export type RawHRMSData = Record<string, any>;

export interface Anomaly {
  id: string;
  type: string;
  severity: AnomalySeverity;
  title: string;
  description: string;
  rawValue?: string;
  expectedValue?: string;
  penalty: number;
}

export interface FieldScore {
  field: string;
  displayName: string;
  weight: number;
  rawScore: number;
  sourceMultiplier: number;
  finalScore: number;
  flag: FieldFlag;
  displayValue: string;
}

export interface VerificationResult {
  score: number;
  tier: ConfidenceTier;
  verdict: Verdict;
  verdictText: string;
  fieldScores: FieldScore[];
  anomalies: Anomaly[];
  totalPenalty: number;
  narrative: string;
  calculatedAt: string;
}

export interface Applicant {
  name: string;
  role: string;
  company: string;
}

export interface VerificationCase {
  id: string;
  applicant: Applicant;
  hrmsSource: HRMSSource;
  rawData: RawHRMSData;
  declaredData?: Partial<NormalizedEmployeeData>;
  normalizedData: NormalizedEmployeeData;
  result: VerificationResult;
  createdAt: string;
  updatedAt: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}
