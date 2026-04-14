import type { NormalizedEmployeeData, RawHRMSData, Anomaly } from '@/types';
import { ANOMALY_PENALTIES } from './constants';

export function detectAnomalies(
  normalized: NormalizedEmployeeData,
  _raw: RawHRMSData,
  declared?: Partial<NormalizedEmployeeData>
): Anomaly[] {
  const anomalies: Anomaly[] = [];

  // 1. CTC Variance
  if (declared?.ctcAnnual && normalized.ctcAnnual) {
    const variance = Math.abs(declared.ctcAnnual - normalized.ctcAnnual) / declared.ctcAnnual;
    if (variance > 0.1) {
      anomalies.push({
        id: crypto.randomUUID(),
        type: 'CTC_VARIANCE',
        severity: ANOMALY_PENALTIES.CTC_VARIANCE.severity,
        title: 'CTC Variance Detected',
        description: `Declared CTC varies by ${(variance * 100).toFixed(1)}% from HRMS data.`,
        rawValue: String(normalized.ctcAnnual),
        expectedValue: String(declared.ctcAnnual),
        penalty: ANOMALY_PENALTIES.CTC_VARIANCE.penalty
      });
    }
  }

  // 2. Payslip Gap
  if (normalized.lastPayslipDate) {
    const lastPayslip = new Date(normalized.lastPayslipDate);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - lastPayslip.getTime()) / (1000 * 60 * 60 * 24));
    if (diffDays > 60) {
      anomalies.push({
        id: crypto.randomUUID(),
        type: 'PAYSLIP_GAP',
        severity: ANOMALY_PENALTIES.PAYSLIP_GAP.severity,
        title: 'Payslip Gap Detected',
        description: `Last payslip is ${diffDays} days old (>60 days).`,
        rawValue: normalized.lastPayslipDate,
        penalty: ANOMALY_PENALTIES.PAYSLIP_GAP.penalty
      });
    }
  }

  // 3. Employment Type Conflict
  if (declared?.employmentType && normalized.employmentType !== 'UNKNOWN' && declared.employmentType !== normalized.employmentType) {
    anomalies.push({
      id: crypto.randomUUID(),
      type: 'EMP_TYPE_CONFLICT',
      severity: ANOMALY_PENALTIES.EMP_TYPE_CONFLICT.severity,
      title: 'Employment Type Conflict',
      description: `Declared employment type does not match HRMS data.`,
      rawValue: normalized.employmentType,
      expectedValue: declared.employmentType,
      penalty: ANOMALY_PENALTIES.EMP_TYPE_CONFLICT.penalty
    });
  }

  // 4. DOJ Conflict
  if (declared?.dateOfJoining && normalized.dateOfJoining) {
    const declaredDOJ = new Date(declared.dateOfJoining);
    const normalizedDOJ = new Date(normalized.dateOfJoining);
    const diffDays = Math.abs((declaredDOJ.getTime() - normalizedDOJ.getTime()) / (1000 * 60 * 60 * 24));
    if (diffDays > 30) {
      anomalies.push({
        id: crypto.randomUUID(),
        type: 'DOJ_CONFLICT',
        severity: ANOMALY_PENALTIES.DOJ_CONFLICT.severity,
        title: 'DOJ Conflict > 30 Days',
        description: `Date of joining differs by ${diffDays} days between records.`,
        rawValue: normalized.dateOfJoining,
        expectedValue: declared.dateOfJoining,
        penalty: ANOMALY_PENALTIES.DOJ_CONFLICT.penalty
      });
    }
  }

  // 5. PF Missing (For FTEs with >6 months tenure)
  if (normalized.employmentType === 'FTE' && normalized.dateOfJoining && !normalized.pfAccount) {
    const doj = new Date(normalized.dateOfJoining);
    const now = new Date();
    const tenureMonths = (now.getFullYear() - doj.getFullYear()) * 12 + (now.getMonth() - doj.getMonth());
    if (tenureMonths > 6) {
      anomalies.push({
        id: crypto.randomUUID(),
        type: 'PF_MISSING',
        severity: ANOMALY_PENALTIES.PF_MISSING.severity,
        title: 'Missing PF Account',
        description: `FTE employee with ${tenureMonths} months tenure is missing statutory PF details.`,
        penalty: ANOMALY_PENALTIES.PF_MISSING.penalty
      });
    }
  }

  return anomalies;
}
