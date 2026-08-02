export type DepartmentCode = 'DEV' | 'QA' | 'PO';

export interface Department {
  id: string; // e.g. 'DEV', 'QA', 'PO'
  name: string; // 'Development', 'Quality Assurance', 'Product Owners'
}

export interface Employee {
  id: string;
  name: string;
  departmentId: DepartmentCode;
  isActive: boolean;
  createdAt: string;
}

export interface KPI {
  id: string;
  departmentId: DepartmentCode;
  name: string;
  evaluatorRole: string; // e.g., 'HR', 'PO', 'CTO', 'OM', 'PO/Team Lead'
  weight: number; // e.g., 15
}

export interface Evaluation {
  id: string;
  employeeId: string;
  kpiId: string;
  month: number; // 1-12
  year: number; // e.g., 2026
  w1Pct: number | null; // 0-100 or null if unrated
  w2Pct: number | null;
  w3Pct: number | null;
  w4Pct: number | null;
  notes?: string;
  updatedAt?: string;
}

// Calculated results for UI & reports
export interface KpiCalculatedScore {
  kpiId: string;
  kpiName: string;
  evaluatorRole: string;
  weight: number;
  w1Pct: number | null;
  w2Pct: number | null;
  w3Pct: number | null;
  w4Pct: number | null;
  w1Score: number;
  w2Score: number;
  w3Score: number;
  w4Score: number;
  monthlyTotalScore: number; // Average of W1..W4 scores
  notes: string;
}

export interface EmployeeMonthlyPerformance {
  employee: Employee;
  month: number;
  year: number;
  kpiScores: KpiCalculatedScore[];
  totalScore: number; // Sum of all kpi monthlyTotalScores (out of 100 max)
  completedKpisCount: number;
  totalKpisCount: number;
  performanceGrade: 'A+' | 'A' | 'B' | 'C' | 'Needs Improvement';
}
