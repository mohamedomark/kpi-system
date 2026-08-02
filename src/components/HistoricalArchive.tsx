import React, { useState } from 'react';
import { DepartmentCode, Employee, KPI, Evaluation } from '../types';
import { calculateEmployeePerformance, getGradeBadgeConfig } from '../utils/kpiCalculator';
import {
  Search,
  Download,
  Printer,
  ChevronDown,
  ChevronRight,
  Award,
  TrendingUp,
  UserCheck,
  Building,
  FileSpreadsheet,
  PieChart,
  BarChart2,
} from 'lucide-react';

interface HistoricalArchiveProps {
  departmentId: DepartmentCode;
  month: number;
  year: number;
  employees: Employee[]; // Includes all employees (active + deactivated)
  kpis: KPI[];
  evaluations: Evaluation[];
}

export const HistoricalArchive: React.FC<HistoricalArchiveProps> = ({
  departmentId,
  month,
  year,
  employees,
  kpis,
  evaluations,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedEmpId, setExpandedEmpId] = useState<string | null>(null);
  const [activeDeptTab, setActiveDeptTab] = useState<DepartmentCode>(departmentId);

  // Compute performance record for employees in selected activeDeptTab
  const deptEmployees = employees.filter((e) => e.departmentId === activeDeptTab);
  const deptKpis = kpis.filter((k) => k.departmentId === activeDeptTab);

  const performanceRecords = deptEmployees.map((emp) => {
    const empEvals = evaluations.filter(
      (ev) => ev.employeeId === emp.id && ev.month === month && ev.year === year
    );
    const evalsMap = new Map<string, Evaluation>();
    empEvals.forEach((ev) => evalsMap.set(ev.kpiId, ev));

    return calculateEmployeePerformance(emp, deptKpis, evalsMap, month, year);
  });

  // Filter records by search query
  const filteredRecords = performanceRecords.filter((rec) =>
    rec.employee.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Department Stats
  const totalEmployees = performanceRecords.length;
  const avgDepartmentScore =
    totalEmployees > 0
      ? Number(
          (
            performanceRecords.reduce((sum, r) => sum + r.totalScore, 0) / totalEmployees
          ).toFixed(1)
        )
      : 0;

  const topPerformer = [...performanceRecords].sort((a, b) => b.totalScore - a.totalScore)[0];

  // Grade breakdown distribution counts
  const gradeDistribution = {
    'A+': performanceRecords.filter((r) => r.performanceGrade === 'A+').length,
    'A': performanceRecords.filter((r) => r.performanceGrade === 'A').length,
    'B': performanceRecords.filter((r) => r.performanceGrade === 'B').length,
    'C': performanceRecords.filter((r) => r.performanceGrade === 'C').length,
    'Needs Improvement': performanceRecords.filter((r) => r.performanceGrade === 'Needs Improvement').length,
  };

  // CSV Export
  const handleExportCsv = () => {
    const rows = [
      ['Department', 'Employee', 'Status', 'Month', 'Year', 'Total Score (100)', 'Grade'],
    ];

    performanceRecords.forEach((rec) => {
      rows.push([
        activeDeptTab,
        rec.employee.name,
        rec.employee.isActive ? 'Active' : 'Deactivated',
        String(month),
        String(year),
        String(rec.totalScore),
        rec.performanceGrade,
      ]);
    });

    const csvContent = 'data:text/csv;charset=utf-8,' + rows.map((e) => e.join(',')).join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `KPI_Archive_${activeDeptTab}_M${month}_${year}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      
      {/* Department Selector Tabs inside Archive */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold uppercase text-slate-400 mr-2">Department Report:</span>
          {(['DEV', 'QA', 'PO'] as DepartmentCode[]).map((dept) => (
            <button
              key={dept}
              onClick={() => setActiveDeptTab(dept)}
              className={`px-4 py-2 text-xs font-bold rounded-xl transition-all border ${
                activeDeptTab === dept
                  ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
                  : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
              }`}
            >
              {dept} Department
            </button>
          ))}
        </div>

        <div className="text-xs font-semibold text-slate-500">
          Showing archive for Month {month}, Year {year}
        </div>
      </div>

      {/* Archive Header & Statistics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        
        {/* Department Avg Score Card */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center gap-4">
          <div className="p-3.5 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-100">
            <TrendingUp className="h-6 w-6" />
          </div>
          <div>
            <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              {activeDeptTab} Average Score
            </div>
            <div className="text-2xl font-black text-slate-900 mt-0.5">
              {avgDepartmentScore} <span className="text-xs font-normal text-slate-400">/ 100</span>
            </div>
          </div>
        </div>

        {/* Top Performer Card */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center gap-4">
          <div className="p-3.5 rounded-xl bg-amber-50 text-amber-600 border border-amber-100">
            <Award className="h-6 w-6" />
          </div>
          <div>
            <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Top Performer ({activeDeptTab})
            </div>
            <div className="text-base font-black text-slate-900 mt-0.5 truncate max-w-[180px]">
              {topPerformer ? topPerformer.employee.name : 'N/A'}
            </div>
            {topPerformer && (
              <span className="text-xs font-bold text-emerald-600">
                {topPerformer.totalScore} pts ({topPerformer.performanceGrade})
              </span>
            )}
          </div>
        </div>

        {/* Total Evaluated Employees */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center gap-4">
          <div className="p-3.5 rounded-xl bg-indigo-50 text-indigo-600 border border-indigo-100">
            <UserCheck className="h-6 w-6" />
          </div>
          <div>
            <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Employees Tracked
            </div>
            <div className="text-2xl font-black text-slate-900 mt-0.5">
              {totalEmployees}
            </div>
          </div>
        </div>
      </div>

      {/* Grade Distribution Breakdown Bar */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
            <BarChart2 className="h-4 w-4 text-emerald-600" /> Grade Distribution Breakdown
          </h3>
          <span className="text-xs text-slate-400">Total {totalEmployees} employees</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          {(['A+', 'A', 'B', 'C', 'Needs Improvement'] as const).map((g) => {
            const count = gradeDistribution[g];
            const cfg = getGradeBadgeConfig(g);
            return (
              <div
                key={g}
                className={`p-3 rounded-xl border ${cfg.bg} ${cfg.border} text-center flex flex-col justify-between`}
              >
                <div className={`text-xs font-black ${cfg.text}`}>{g}</div>
                <div className="text-xl font-black text-slate-900 my-1">{count}</div>
                <div className="text-[10px] text-slate-500 font-medium">
                  {totalEmployees > 0 ? Math.round((count / totalEmployees) * 100) : 0}% of team
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Main Historical Table Card */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        
        {/* Controls Toolbar */}
        <div className="p-4 border-b border-slate-200/80 bg-slate-50/80 flex flex-col sm:flex-row items-center justify-between gap-4">
          
          {/* Search Box */}
          <div className="relative w-full sm:w-72">
            <Search className="h-4 w-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search employee by name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            />
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <button
              onClick={handleExportCsv}
              className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold bg-white border border-slate-300 text-slate-700 rounded-xl hover:bg-slate-100 transition-colors shadow-xs"
            >
              <Download className="h-3.5 w-3.5 text-slate-500" />
              Export CSV
            </button>
            <button
              onClick={() => window.print()}
              className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold bg-slate-900 text-white rounded-xl hover:bg-slate-800 transition-colors shadow-xs"
            >
              <Printer className="h-3.5 w-3.5" />
              Print Report
            </button>
          </div>
        </div>

        {/* Performance Archive Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-100 border-b border-slate-200 text-slate-700 text-xs font-extrabold uppercase tracking-wider">
                <th className="py-3.5 px-4 w-10"></th>
                <th className="py-3.5 px-4">Employee Name</th>
                <th className="py-3.5 px-3">Status</th>
                <th className="py-3.5 px-3">Department</th>
                <th className="py-3.5 px-3 text-center">KPIs Rated</th>
                <th className="py-3.5 px-4 text-right">Total Score</th>
                <th className="py-3.5 px-4 text-center">Grade</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200/80 text-xs text-slate-800">
              {filteredRecords.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400">
                    No historical evaluation records found for this department.
                  </td>
                </tr>
              ) : (
                filteredRecords.map((rec) => {
                  const isExpanded = expandedEmpId === rec.employee.id;
                  const cfg = getGradeBadgeConfig(rec.performanceGrade);

                  return (
                    <React.Fragment key={rec.employee.id}>
                      <tr
                        onClick={() => setExpandedEmpId(isExpanded ? null : rec.employee.id)}
                        className="hover:bg-slate-50/90 cursor-pointer transition-colors"
                      >
                        <td className="py-3.5 px-4 text-slate-400">
                          {isExpanded ? (
                            <ChevronDown className="h-4 w-4 text-emerald-600" />
                          ) : (
                            <ChevronRight className="h-4 w-4" />
                          )}
                        </td>

                        <td className="py-3.5 px-4 font-black text-slate-900 text-sm">
                          {rec.employee.name}
                        </td>

                        <td className="py-3.5 px-3">
                          <span
                            className={`px-2.5 py-0.5 text-[10px] font-bold rounded-full border ${
                              rec.employee.isActive
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                : 'bg-slate-100 text-slate-500 border-slate-200'
                            }`}
                          >
                            {rec.employee.isActive ? 'Active' : 'Deactivated'}
                          </span>
                        </td>

                        <td className="py-3.5 px-3 font-semibold text-slate-600">
                          {rec.employee.departmentId}
                        </td>

                        <td className="py-3.5 px-3 text-center text-slate-600 font-mono">
                          {rec.completedKpisCount} / {rec.totalKpisCount}
                        </td>

                        <td className="py-3.5 px-4 text-right font-black text-base text-slate-900">
                          {rec.totalScore}{' '}
                          <span className="text-[10px] text-slate-400 font-normal">/ 100</span>
                        </td>

                        <td className="py-3.5 px-4 text-center">
                          <span
                            className={`inline-block px-3 py-1 text-xs font-black rounded-lg border ${cfg.bg} ${cfg.text} ${cfg.border}`}
                          >
                            {rec.performanceGrade}
                          </span>
                        </td>
                      </tr>

                      {/* Expanded Detail Accordion Row */}
                      {isExpanded && (
                        <tr className="bg-slate-50/90 border-b border-slate-200">
                          <td colSpan={7} className="p-4">
                            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-inner space-y-3">
                              <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                                <FileSpreadsheet className="h-4 w-4 text-emerald-600" /> Detailed
                                KPI Score Breakdown for {rec.employee.name}
                              </h4>

                              <table className="w-full text-left border-collapse text-xs">
                                <thead>
                                  <tr className="border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[10px] bg-slate-50">
                                    <th className="py-2.5 px-3">KPI Title</th>
                                    <th className="py-2.5 px-3">Evaluator</th>
                                    <th className="py-2.5 px-2 text-center">Weight</th>
                                    <th className="py-2.5 px-2 text-center">W1 %</th>
                                    <th className="py-2.5 px-2 text-center">W2 %</th>
                                    <th className="py-2.5 px-2 text-center">W3 %</th>
                                    <th className="py-2.5 px-2 text-center">W4 %</th>
                                    <th className="py-2.5 px-3 text-right">Monthly Score</th>
                                    <th className="py-2.5 px-3">Notes</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                  {rec.kpiScores.map((ks) => (
                                    <tr key={ks.kpiId} className="hover:bg-slate-50">
                                      <td className="py-2.5 px-3 font-bold text-slate-800">
                                        {ks.kpiName}
                                      </td>
                                      <td className="py-2.5 px-3 text-slate-500 font-medium">
                                        {ks.evaluatorRole}
                                      </td>
                                      <td className="py-2.5 px-2 text-center font-bold">{ks.weight}</td>
                                      <td className="py-2.5 px-2 text-center font-mono text-slate-600">
                                        {ks.w1Pct !== null ? `${ks.w1Pct}%` : '-'}
                                      </td>
                                      <td className="py-2.5 px-2 text-center font-mono text-slate-600">
                                        {ks.w2Pct !== null ? `${ks.w2Pct}%` : '-'}
                                      </td>
                                      <td className="py-2.5 px-2 text-center font-mono text-slate-600">
                                        {ks.w3Pct !== null ? `${ks.w3Pct}%` : '-'}
                                      </td>
                                      <td className="py-2.5 px-2 text-center font-mono text-slate-600">
                                        {ks.w4Pct !== null ? `${ks.w4Pct}%` : '-'}
                                      </td>
                                      <td className="py-2.5 px-3 text-right font-black text-emerald-700">
                                        {ks.monthlyTotalScore.toFixed(2)}
                                      </td>
                                      <td className="py-2.5 px-3 text-slate-500 italic max-w-xs truncate">
                                        {ks.notes || '-'}
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
