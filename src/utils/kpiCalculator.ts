import { Evaluation, KPI, KpiCalculatedScore, EmployeeMonthlyPerformance, Employee } from '../types';

/**
 * Safely parse a percentage value (0 to 100)
 */
export function sanitizePercentage(value: any): number | null {
  if (value === null || value === undefined || value === '') return null;
  const num = Number(value);
  if (isNaN(num)) return null;
  return Math.min(100, Math.max(0, num));
}

/**
 * Weekly Score Calculation:
 * Weekly Score = (Weekly Percentage / 100) * KPI Weight
 */
export function calculateWeeklyScore(pct: number | null | undefined, weight: number): number {
  const sanitized = sanitizePercentage(pct);
  if (sanitized === null) return 0;
  return Number(((sanitized / 100) * weight).toFixed(2));
}

/**
 * KPI Monthly Total Calculation:
 * KPI Monthly Total = (W1_Score + W2_Score + W3_Score + W4_Score) / 4
 */
export function calculateKpiMonthlyTotal(
  w1Score: number,
  w2Score: number,
  w3Score: number,
  w4Score: number
): number {
  const total = (w1Score + w2Score + w3Score + w4Score) / 4;
  return Number(total.toFixed(2));
}

/**
 * Calculates complete score breakdown for a single KPI evaluation
 */
export function calculateKpiScore(
  kpi: KPI,
  evaluation?: Partial<Evaluation>
): KpiCalculatedScore {
  const w1Pct = sanitizePercentage(evaluation?.w1Pct);
  const w2Pct = sanitizePercentage(evaluation?.w2Pct);
  const w3Pct = sanitizePercentage(evaluation?.w3Pct);
  const w4Pct = sanitizePercentage(evaluation?.w4Pct);

  const w1Score = calculateWeeklyScore(w1Pct, kpi.weight);
  const w2Score = calculateWeeklyScore(w2Pct, kpi.weight);
  const w3Score = calculateWeeklyScore(w3Pct, kpi.weight);
  const w4Score = calculateWeeklyScore(w4Pct, kpi.weight);

  const monthlyTotalScore = calculateKpiMonthlyTotal(w1Score, w2Score, w3Score, w4Score);

  return {
    kpiId: kpi.id,
    kpiName: kpi.name,
    evaluatorRole: kpi.evaluatorRole,
    weight: kpi.weight,
    w1Pct,
    w2Pct,
    w3Pct,
    w4Pct,
    w1Score,
    w2Score,
    w3Score,
    w4Score,
    monthlyTotalScore,
    notes: evaluation?.notes || '',
  };
}

/**
 * Employee Monthly Total Score:
 * Employee Total Score = SUM(All KPI Monthly Totals for that employee)
 */
export function calculateEmployeePerformance(
  employee: Employee,
  departmentKpis: KPI[],
  evaluationsMap: Map<string, Evaluation>, // map of kpiId -> Evaluation
  month: number,
  year: number
): EmployeeMonthlyPerformance {
  const kpiScores: KpiCalculatedScore[] = departmentKpis.map((kpi) => {
    const evalData = evaluationsMap.get(kpi.id);
    return calculateKpiScore(kpi, evalData);
  });

  const totalScore = Number(
    kpiScores
      .reduce((sum, item) => sum + item.monthlyTotalScore, 0)
      .toFixed(2)
  );

  let completedKpisCount = 0;
  kpiScores.forEach((s) => {
    if (s.w1Pct !== null || s.w2Pct !== null || s.w3Pct !== null || s.w4Pct !== null) {
      completedKpisCount++;
    }
  });

  let performanceGrade: 'A+' | 'A' | 'B' | 'C' | 'Needs Improvement' = 'Needs Improvement';
  if (totalScore >= 90) performanceGrade = 'A+';
  else if (totalScore >= 80) performanceGrade = 'A';
  else if (totalScore >= 70) performanceGrade = 'B';
  else if (totalScore >= 60) performanceGrade = 'C';

  return {
    employee,
    month,
    year,
    kpiScores,
    totalScore,
    completedKpisCount,
    totalKpisCount: departmentKpis.length,
    performanceGrade,
  };
}

/**
 * Returns eye-safe, high contrast visual styling for performance grades
 */
export function getGradeBadgeConfig(grade: string) {
  switch (grade) {
    case 'A+':
      return {
        bg: 'bg-emerald-50 dark:bg-emerald-950/40',
        text: 'text-emerald-700 dark:text-emerald-300',
        border: 'border-emerald-200 dark:border-emerald-800',
        badgeBg: 'bg-emerald-600',
        label: 'Outstanding Performance (90-100%)',
      };
    case 'A':
      return {
        bg: 'bg-teal-50 dark:bg-teal-950/40',
        text: 'text-teal-700 dark:text-teal-300',
        border: 'border-teal-200 dark:border-teal-800',
        badgeBg: 'bg-teal-600',
        label: 'Exceeds Expectations (80-89%)',
      };
    case 'B':
      return {
        bg: 'bg-indigo-50 dark:bg-indigo-950/40',
        text: 'text-indigo-700 dark:text-indigo-300',
        border: 'border-indigo-200 dark:border-indigo-800',
        badgeBg: 'bg-indigo-600',
        label: 'Meets Expectations (70-79%)',
      };
    case 'C':
      return {
        bg: 'bg-amber-50 dark:bg-amber-950/40',
        text: 'text-amber-700 dark:text-amber-300',
        border: 'border-amber-200 dark:border-amber-800',
        badgeBg: 'bg-amber-600',
        label: 'Satisfactory / Baseline (60-69%)',
      };
    default:
      return {
        bg: 'bg-rose-50 dark:bg-rose-950/40',
        text: 'text-rose-700 dark:text-rose-300',
        border: 'border-rose-200 dark:border-rose-800',
        badgeBg: 'bg-rose-600',
        label: 'Needs Immediate Improvement (<60%)',
      };
  }
}

