import type { VerificationCase } from '@/types';
import { normalizeHRMSData } from '@/lib/schema-normalizer';
import { detectAnomalies } from '@/lib/anomaly-detector';
import { calculateConfidence } from '@/lib/scoring-engine';

const casesData = [
  {
    id: 'c-1',
    applicant: { name: 'Arjun Mehta', role: 'Senior Software Engineer', company: 'Infosys' },
    hrmsSource: 'workday' as const,
    rawData: {
      worker_id: 'W-9281',
      company_name: 'Infosys Ltd',
      annual_base_pay: 1840000,
      hire_date: '2019-03-15T00:00:00Z',
      worker_type: 'Regular',
      business_title: 'Senior Software Engineer',
      custom_fields: { pf_number: 'MH/BAN/1234567/000/9876543' },
      payroll_history: Array(12).fill({ pay_period_end: new Date().toISOString() })
    },
    declaredData: { ctcAnnual: 1850000, dateOfJoining: '2019-03-15T00:00:00Z', employmentType: 'FTE' as const }
  },
  {
    id: 'c-2',
    applicant: { name: 'Priya Sharma', role: 'Product Manager', company: 'Razorpay' },
    hrmsSource: 'keka' as const,
    rawData: {
      employeeNumber: 'K-4421',
      legalEntity: 'Razorpay Software Pvt Ltd',
      salaryDetails: { annualCtc: 3120000 },
      joiningDate: '2022-06-01T00:00:00Z',
      isPermanent: true,
      jobTitle: 'Product Manager',
      statutory: { pfNumber: null }, // Missing PF
      payslips: Array(8).fill({ generatedOn: new Date().toISOString() })
    },
    declaredData: { ctcAnnual: 3500000, dateOfJoining: '2022-06-01T00:00:00Z', employmentType: 'FTE' as const }
  },
  {
    id: 'c-3',
    applicant: { name: 'Rohan Desai', role: 'Sales Executive', company: 'Urban Ladder' },
    hrmsSource: 'greythr' as const,
    rawData: {
      emp_no: 'UL-882',
      comp_name: 'Urban Ladder',
      monthly_gross: 70000, // 8.4 LPA
      doj: '2023-10-10T00:00:00Z',
      emp_type: '02', // CONTRACT
      designation: 'Sales Executive',
      uan_no: null,
      slip_count: 0,
      last_slip_date: null
    },
    declaredData: { ctcAnnual: 1200000, dateOfJoining: '2021-01-15T00:00:00Z', employmentType: 'FTE' as const }
  },
  {
    id: 'c-4',
    applicant: { name: 'Kavitha Reddy', role: 'HR Business Partner', company: 'Swiggy' },
    hrmsSource: 'darwinbox' as const,
    rawData: {
      emp_id: 'SW-112',
      company_name: 'Bundl Technologies (Swiggy)',
      annual_ctc: 1420000,
      doj: '2021-01-20T00:00:00Z',
      employee_type: 'FULL TIME',
      designation: 'HRBP',
      pf_no: 'KAR/KA/88888/000/11111',
      payslips_generated: 12,
      recent_payslip: new Date().toISOString()
    },
    declaredData: { ctcAnnual: 1500000, dateOfJoining: '2021-01-20T00:00:00Z', employmentType: 'FTE' as const }
  },
  {
    id: 'c-5',
    applicant: { name: 'Anika Patel', role: 'Engineering Manager', company: 'TCS' },
    hrmsSource: 'sap' as const,
    rawData: {
      persNo: '11223344',
      orgUnit: 'Tata Consultancy Services',
      annualSalary: 2500000,
      startDate: '2020-07-01T00:00:00Z',
      employeeGroup: '1',
      position: 'Engineering Manager',
      pfAccountNo: 'MH/BAN/55555/000/22222',
      payrollResults: 12,
      lastPayrollDate: new Date().toISOString()
    },
    declaredData: { ctcAnnual: 2500000, dateOfJoining: '2020-07-01T00:00:00Z', employmentType: 'FTE' as const }
  }
];

export const MOCK_CASES: VerificationCase[] = casesData.map(c => {
  const normalizedData = normalizeHRMSData(c.hrmsSource, c.rawData);
  const anomalies = detectAnomalies(normalizedData, c.rawData, c.declaredData);
  const result = calculateConfidence(normalizedData, c.hrmsSource, anomalies);

  return {
    id: c.id,
    applicant: c.applicant,
    hrmsSource: c.hrmsSource,
    rawData: c.rawData,
    declaredData: c.declaredData,
    normalizedData,
    result,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
});
