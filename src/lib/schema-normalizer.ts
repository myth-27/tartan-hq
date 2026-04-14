import type { HRMSSource, NormalizedEmployeeData, RawHRMSData, EmploymentType } from '@/types';

export function normalizeHRMSData(source: HRMSSource, rawData: RawHRMSData): NormalizedEmployeeData {
  const normalized: NormalizedEmployeeData = {
    employeeId: '',
    employerName: '',
    ctcAnnual: 0,
    dateOfJoining: '',
    employmentType: 'UNKNOWN',
    pfAccount: '',
    jobTitle: '',
    payslipCount: 0,
    lastPayslipDate: '',
    rawSource: source
  };

  try {
    switch (source) {
      case 'workday':
        normalized.employeeId = rawData.worker_id || '';
        normalized.employerName = rawData.company_name || '';
        normalized.ctcAnnual = rawData.annual_base_pay || 0;
        normalized.dateOfJoining = rawData.hire_date || '';
        normalized.employmentType = mapEmploymentType(rawData.worker_type?.toUpperCase());
        normalized.jobTitle = rawData.business_title || '';
        normalized.pfAccount = rawData.custom_fields?.pf_number || '';
        normalized.payslipCount = rawData.payroll_history?.length || 0;
        normalized.lastPayslipDate = rawData.payroll_history?.[0]?.pay_period_end || '';
        break;

      case 'keka':
        normalized.employeeId = rawData.employeeNumber || '';
        normalized.employerName = rawData.legalEntity || '';
        normalized.ctcAnnual = rawData.salaryDetails?.annualCtc || 0;
        normalized.dateOfJoining = rawData.joiningDate || '';
        normalized.employmentType = rawData.isPermanent ? 'FTE' : 'CONTRACT';
        normalized.jobTitle = rawData.jobTitle || '';
        normalized.pfAccount = rawData.statutory?.pfNumber || '';
        normalized.payslipCount = rawData.payslips?.length || 0;
        normalized.lastPayslipDate = rawData.payslips?.[0]?.generatedOn || '';
        break;

      case 'greythr':
        normalized.employeeId = rawData.emp_no || '';
        normalized.employerName = rawData.comp_name || '';
        normalized.ctcAnnual = (rawData.monthly_gross || 0) * 12; // assuming monthly
        normalized.dateOfJoining = rawData.doj || '';
        normalized.employmentType = rawData.emp_type === '01' ? 'FTE' : rawData.emp_type === '02' ? 'CONTRACT' : 'UNKNOWN';
        normalized.jobTitle = rawData.designation || '';
        normalized.pfAccount = rawData.uan_no || '';
        normalized.payslipCount = rawData.slip_count || 0;
        normalized.lastPayslipDate = rawData.last_slip_date || '';
        break;
        
      case 'darwinbox':
        normalized.employeeId = rawData.emp_id || '';
        normalized.employerName = rawData.company_name || '';
        normalized.ctcAnnual = rawData.annual_ctc || 0;
        normalized.dateOfJoining = rawData.doj || '';
        normalized.employmentType = mapEmploymentType(rawData.employee_type);
        normalized.jobTitle = rawData.designation || '';
        normalized.pfAccount = rawData.pf_no || '';
        normalized.payslipCount = rawData.payslips_generated || 0;
        normalized.lastPayslipDate = rawData.recent_payslip || '';
        break;

      case 'sap':
        normalized.employeeId = rawData.persNo || '';
        normalized.employerName = rawData.orgUnit || '';
        normalized.ctcAnnual = rawData.annualSalary || 0;
        normalized.dateOfJoining = rawData.startDate || '';
        normalized.employmentType = rawData.employeeGroup === '1' ? 'FTE' : 'CONTRACT';
        normalized.jobTitle = rawData.position || '';
        normalized.pfAccount = rawData.pfAccountNo || '';
        normalized.payslipCount = rawData.payrollResults || 0;
        normalized.lastPayslipDate = rawData.lastPayrollDate || '';
        break;
        
      default:
        // basic fallback mapping
        normalized.employeeId = rawData.id || '';
        normalized.employerName = rawData.company || '';
        normalized.ctcAnnual = rawData.salary || 0;
        normalized.dateOfJoining = rawData.doj || rawData.startDate || '';
        break;
    }
  } catch (e) {
    console.error(`Error normalizing data for source ${source}:`, e);
  }

  return normalized;
}

function mapEmploymentType(raw: string): EmploymentType {
  if (!raw) return 'UNKNOWN';
  raw = String(raw).toUpperCase();
  if (raw.includes('REGULAR') || raw.includes('FULL TIME') || raw.includes('FTE')) return 'FTE';
  if (raw.includes('CONTRACT') || raw.includes('TEMP') || raw.includes('CONTINGENT')) return 'CONTRACT';
  if (raw.includes('INTERN')) return 'INTERN';
  if (raw.includes('GIG') || raw.includes('FREELANCE')) return 'GIG';
  return 'UNKNOWN';
}
