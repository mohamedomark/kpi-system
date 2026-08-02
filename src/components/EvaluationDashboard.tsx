import React, { useState, useEffect, useRef } from 'react';
import { DepartmentCode, Employee, KPI, Evaluation } from '../types';
import { calculateKpiScore, sanitizePercentage, getGradeBadgeConfig } from '../utils/kpiCalculator';
import {
  User,
  Award,
  MessageSquare,
  Sparkles,
  Zap,
  Filter,
  Save,
  CheckCircle,
  HelpCircle,
  ChevronLeft,
  ChevronRight,
  Copy,
  BarChart2,
  Tag,
} from 'lucide-react';

interface EvaluationDashboardProps {
  departmentId: DepartmentCode;
  month: number;
  year: number;
  employees: Employee[];
  kpis: KPI[];
  evaluations: Evaluation[];
  onSaveEvaluation: (data: Partial<Evaluation> & { employeeId: string; kpiId: string; month: number; year: number }) => void;
  onSaveBatch: (data: Array<Partial<Evaluation> & { employeeId: string; kpiId: string; month: number; year: number }>) => void;
}

const PRESET_NOTE_TAGS = [
  'Exceeded weekly target',
  'Delivered high quality output',
  'Minor delay in sub-task',
  'Requires additional mentoring',
  'Exceptional team collaboration',
  'Proactive problem solving',
];

export const EvaluationDashboard: React.FC<EvaluationDashboardProps> = ({
  departmentId,
  month,
  year,
  employees,
  kpis,
  evaluations,
  onSaveEvaluation,
  onSaveBatch,
}) => {
  // Active selected employee
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>('');
  
  // Evaluator Role Filter (All, HR, PO, CTO, OM, etc.)
  const [evaluatorFilter, setEvaluatorFilter] = useState<string>('ALL');

  // Active notes popover/modal
  const [activeNotesKpiId, setActiveNotesKpiId] = useState<string | null>(null);

  // Local draft state for quick typing feedback before auto-sync
  const [localDrafts, setLocalDrafts] = useState<Record<string, { w1Pct: any; w2Pct: any; w3Pct: any; w4Pct: any; notes: string }>>({});

  // Refs for grid keyboard navigation
  const inputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  // When employee or department changes, default to first employee
  useEffect(() => {
    if (employees.length > 0) {
      if (!selectedEmployeeId || !employees.some((e) => e.id === selectedEmployeeId)) {
        setSelectedEmployeeId(employees[0].id);
      }
    } else {
      setSelectedEmployeeId('');
    }
  }, [departmentId, employees]);

  // Sync evaluations from props into localDrafts for the current employee
  useEffect(() => {
    if (!selectedEmployeeId) return;

    const drafts: Record<string, { w1Pct: any; w2Pct: any; w3Pct: any; w4Pct: any; notes: string }> = {};

    kpis.forEach((kpi) => {
      const match = evaluations.find(
        (ev) => ev.employeeId === selectedEmployeeId && ev.kpiId === kpi.id && ev.month === month && ev.year === year
      );
      drafts[kpi.id] = {
        w1Pct: match?.w1Pct ?? '',
        w2Pct: match?.w2Pct ?? '',
        w3Pct: match?.w3Pct ?? '',
        w4Pct: match?.w4Pct ?? '',
        notes: match?.notes ?? '',
      };
    });

    setLocalDrafts(drafts);
  }, [selectedEmployeeId, month, year, evaluations, kpis]);

  const activeEmployee = employees.find((e) => e.id === selectedEmployeeId);
  const currentEmpIndex = employees.findIndex((e) => e.id === selectedEmployeeId);

  // Filter KPIs by evaluator if needed
  const availableEvaluatorRoles = Array.from(new Set(kpis.map((k) => k.evaluatorRole)));
  const filteredKpis = evaluatorFilter === 'ALL' ? kpis : kpis.filter((k) => k.evaluatorRole === evaluatorFilter);

  // Navigation handlers
  const handlePrevEmployee = () => {
    if (employees.length === 0) return;
    const prevIdx = (currentEmpIndex - 1 + employees.length) % employees.length;
    setSelectedEmployeeId(employees[prevIdx].id);
  };

  const handleNextEmployee = () => {
    if (employees.length === 0) return;
    const nextIdx = (currentEmpIndex + 1) % employees.length;
    setSelectedEmployeeId(employees[nextIdx].id);
  };

  // Helper to handle percentage input change
  const handlePctChange = (kpiId: string, weekKey: 'w1Pct' | 'w2Pct' | 'w3Pct' | 'w4Pct', rawVal: string) => {
    let cleanVal: any = rawVal;
    if (rawVal !== '') {
      const num = Number(rawVal);
      if (isNaN(num)) return;
      cleanVal = Math.min(100, Math.max(0, num));
    }

    const currentDraft = localDrafts[kpiId] || { w1Pct: '', w2Pct: '', w3Pct: '', w4Pct: '', notes: '' };
    const updatedDraft = {
      ...currentDraft,
      [weekKey]: cleanVal,
    };

    setLocalDrafts((prev) => ({
      ...prev,
      [kpiId]: updatedDraft,
    }));

    // Trigger save to backend
    if (selectedEmployeeId) {
      onSaveEvaluation({
        employeeId: selectedEmployeeId,
        kpiId,
        month,
        year,
        w1Pct: updatedDraft.w1Pct === '' ? null : Number(updatedDraft.w1Pct),
        w2Pct: updatedDraft.w2Pct === '' ? null : Number(updatedDraft.w2Pct),
        w3Pct: updatedDraft.w3Pct === '' ? null : Number(updatedDraft.w3Pct),
        w4Pct: updatedDraft.w4Pct === '' ? null : Number(updatedDraft.w4Pct),
        notes: updatedDraft.notes,
      });
    }
  };

  // Keyboard navigation across score cells (Arrow keys / Enter)
  const handleKeyDown = (e: React.KeyboardEvent, kpiIndex: number, weekIndex: number) => {
    const weeks = ['w1Pct', 'w2Pct', 'w3Pct', 'w4Pct'];
    let targetKpiIndex = kpiIndex;
    let targetWeekIndex = weekIndex;

    if (e.key === 'ArrowDown' || e.key === 'Enter') {
      e.preventDefault();
      targetKpiIndex = Math.min(filteredKpis.length - 1, kpiIndex + 1);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      targetKpiIndex = Math.max(0, kpiIndex - 1);
    } else if (e.key === 'ArrowRight') {
      if (weekIndex < 3) {
        e.preventDefault();
        targetWeekIndex = weekIndex + 1;
      }
    } else if (e.key === 'ArrowLeft') {
      if (weekIndex > 0) {
        e.preventDefault();
        targetWeekIndex = weekIndex - 1;
      }
    }

    if (targetKpiIndex !== kpiIndex || targetWeekIndex !== weekIndex) {
      const targetKpi = filteredKpis[targetKpiIndex];
      const targetKey = `${targetKpi.id}_${weeks[targetWeekIndex]}`;
      const el = inputRefs.current[targetKey];
      if (el) {
        el.focus();
        el.select();
      }
    }
  };

  const handleNotesChange = (kpiId: string, notes: string) => {
    const currentDraft = localDrafts[kpiId] || { w1Pct: '', w2Pct: '', w3Pct: '', w4Pct: '', notes: '' };
    const updatedDraft = { ...currentDraft, notes };

    setLocalDrafts((prev) => ({
      ...prev,
      [kpiId]: updatedDraft,
    }));

    if (selectedEmployeeId) {
      onSaveEvaluation({
        employeeId: selectedEmployeeId,
        kpiId,
        month,
        year,
        w1Pct: updatedDraft.w1Pct === '' ? null : Number(updatedDraft.w1Pct),
        w2Pct: updatedDraft.w2Pct === '' ? null : Number(updatedDraft.w2Pct),
        w3Pct: updatedDraft.w3Pct === '' ? null : Number(updatedDraft.w3Pct),
        w4Pct: updatedDraft.w4Pct === '' ? null : Number(updatedDraft.w4Pct),
        notes,
      });
    }
  };

  // Quick preset tool: fill specified % across all weeks for visible KPIs
  const handleQuickFill = (pct: number) => {
    if (!selectedEmployeeId) return;

    const batch: Array<Partial<Evaluation> & { employeeId: string; kpiId: string; month: number; year: number }> = [];
    const updatedDrafts = { ...localDrafts };

    filteredKpis.forEach((kpi) => {
      const draft = {
        w1Pct: pct,
        w2Pct: pct,
        w3Pct: pct,
        w4Pct: pct,
        notes: updatedDrafts[kpi.id]?.notes || '',
      };
      updatedDrafts[kpi.id] = draft;
      batch.push({
        employeeId: selectedEmployeeId,
        kpiId: kpi.id,
        month,
        year,
        w1Pct: pct,
        w2Pct: pct,
        w3Pct: pct,
        w4Pct: pct,
        notes: draft.notes,
      });
    });

    setLocalDrafts(updatedDrafts);
    onSaveBatch(batch);
  };

  // Quick preset tool: Copy W1 percentage across W2, W3, W4 for each KPI
  const handleCopyW1ToAll = () => {
    if (!selectedEmployeeId) return;

    const batch: Array<Partial<Evaluation> & { employeeId: string; kpiId: string; month: number; year: number }> = [];
    const updatedDrafts = { ...localDrafts };

    filteredKpis.forEach((kpi) => {
      const currentW1 = updatedDrafts[kpi.id]?.w1Pct;
      const w1Val = currentW1 !== '' && currentW1 !== null && currentW1 !== undefined ? Number(currentW1) : 100;

      const draft = {
        w1Pct: w1Val,
        w2Pct: w1Val,
        w3Pct: w1Val,
        w4Pct: w1Val,
        notes: updatedDrafts[kpi.id]?.notes || '',
      };
      updatedDrafts[kpi.id] = draft;
      batch.push({
        employeeId: selectedEmployeeId,
        kpiId: kpi.id,
        month,
        year,
        w1Pct: w1Val,
        w2Pct: w1Val,
        w3Pct: w1Val,
        w4Pct: w1Val,
        notes: draft.notes,
      });
    });

    setLocalDrafts(updatedDrafts);
    onSaveBatch(batch);
  };

  // Calculate live scores for current employee
  const calculatedRows = kpis.map((kpi) => {
    const draft = localDrafts[kpi.id] || { w1Pct: '', w2Pct: '', w3Pct: '', w4Pct: '', notes: '' };
    return {
      kpi,
      score: calculateKpiScore(kpi, {
        w1Pct: sanitizePercentage(draft.w1Pct),
        w2Pct: sanitizePercentage(draft.w2Pct),
        w3Pct: sanitizePercentage(draft.w3Pct),
        w4Pct: sanitizePercentage(draft.w4Pct),
        notes: draft.notes,
      }),
    };
  });

  const grandTotal = Number(
    calculatedRows.reduce((sum, r) => sum + r.score.monthlyTotalScore, 0).toFixed(2)
  );

  const totalPossibleWeight = kpis.reduce((sum, k) => sum + k.weight, 0);

  // Completion calculation
  let ratedKpisCount = 0;
  kpis.forEach((kpi) => {
    const draft = localDrafts[kpi.id];
    if (draft && (draft.w1Pct !== '' || draft.w2Pct !== '' || draft.w3Pct !== '' || draft.w4Pct !== '')) {
      ratedKpisCount++;
    }
  });
  const completionPercentage = Math.round((ratedKpisCount / Math.max(1, kpis.length)) * 100);

  // Performance grade
  let grade: 'A+' | 'A' | 'B' | 'C' | 'Needs Improvement' = 'Needs Improvement';
  if (grandTotal >= 90) grade = 'A+';
  else if (grandTotal >= 80) grade = 'A';
  else if (grandTotal >= 70) grade = 'B';
  else if (grandTotal >= 60) grade = 'C';

  const gradeConfig = getGradeBadgeConfig(grade);

  if (!activeEmployee) {
    return (
      <div className="p-12 text-center bg-white rounded-2xl border border-slate-200/80 shadow-sm my-6">
        <User className="h-12 w-12 text-slate-300 mx-auto mb-3" />
        <h3 className="text-lg font-bold text-slate-800">No Active Employees in {departmentId}</h3>
        <p className="text-xs text-slate-500 max-w-md mx-auto mt-1">
          Select or add active team members to the {departmentId} department in Employee Management to perform evaluations.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      
      {/* Employee Selector Bar & Evaluator Filter */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-5">
        
        {/* Employee Switcher Pills with Prev/Next Controls */}
        <div className="flex-1">
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <User className="h-3.5 w-3.5 text-slate-500" />
              Active Team Members ({employees.length} in {departmentId})
            </label>
            
            {/* Prev / Next Employee arrows */}
            <div className="flex items-center gap-1">
              <button
                onClick={handlePrevEmployee}
                title="Previous Employee"
                className="p-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors border border-slate-200 text-xs font-medium flex items-center gap-1 px-2"
              >
                <ChevronLeft className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Prev</span>
              </button>
              <span className="text-xs font-mono text-slate-500 px-1">
                {currentEmpIndex + 1} / {employees.length}
              </span>
              <button
                onClick={handleNextEmployee}
                title="Next Employee"
                className="p-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors border border-slate-200 text-xs font-medium flex items-center gap-1 px-2"
              >
                <span className="hidden sm:inline">Next</span>
                <ChevronRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            {employees.map((emp) => {
              const empEvals = evaluations.filter(
                (ev) => ev.employeeId === emp.id && ev.month === month && ev.year === year
              );
              let empTotal = 0;
              kpis.forEach((k) => {
                const match = empEvals.find((ev) => ev.kpiId === k.id);
                const s = calculateKpiScore(k, match);
                empTotal += s.monthlyTotalScore;
              });
              empTotal = Number(empTotal.toFixed(1));

              const isSelected = emp.id === selectedEmployeeId;

              return (
                <button
                  key={emp.id}
                  onClick={() => setSelectedEmployeeId(emp.id)}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-2 border ${
                    isSelected
                      ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
                      : 'bg-slate-50 text-slate-700 border-slate-200/80 hover:bg-slate-100 hover:border-slate-300'
                  }`}
                >
                  <span>{emp.name}</span>
                  <span
                    className={`px-1.5 py-0.5 rounded-md text-[10px] font-extrabold ${
                      isSelected ? 'bg-emerald-500 text-white' : 'bg-slate-200 text-slate-700'
                    }`}
                  >
                    {empTotal} pts
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Evaluator Role Filter & Quick Presets */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 border-t md:border-t-0 md:border-l border-slate-200/80 pt-4 md:pt-0 md:pl-6">
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5 block flex items-center gap-1">
              <Filter className="h-3.5 w-3.5 text-slate-500" /> Filter Evaluator
            </label>
            <select
              value={evaluatorFilter}
              onChange={(e) => setEvaluatorFilter(e.target.value)}
              className="text-xs font-semibold bg-slate-50 border border-slate-300 rounded-xl px-3 py-1.5 text-slate-800 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            >
              <option value="ALL">All Evaluator Roles</option>
              {availableEvaluatorRoles.map((role) => (
                <option key={role} value={role}>
                  {role} Evaluated KPIs
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5 block flex items-center gap-1">
              <Zap className="h-3.5 w-3.5 text-amber-500" /> Quick Fill Tools
            </label>
            <div className="flex flex-wrap gap-1">
              <button
                onClick={() => handleQuickFill(100)}
                className="px-2.5 py-1 text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200/80 rounded-lg hover:bg-emerald-100 transition-colors"
                title="Fill 100% across all weeks"
              >
                100%
              </button>
              <button
                onClick={() => handleQuickFill(80)}
                className="px-2.5 py-1 text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-200/80 rounded-lg hover:bg-indigo-100 transition-colors"
                title="Fill 80% across all weeks"
              >
                80%
              </button>
              <button
                onClick={handleCopyW1ToAll}
                className="px-2.5 py-1 text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200/80 rounded-lg hover:bg-amber-100 transition-colors flex items-center gap-1"
                title="Copy Week 1 percentage to Week 2, 3, and 4"
              >
                <Copy className="h-3 w-3" /> W1→All
              </button>
              <button
                onClick={() => handleQuickFill(0)}
                className="px-2.5 py-1 text-xs font-bold bg-slate-100 text-slate-600 border border-slate-200/80 rounded-lg hover:bg-slate-200 transition-colors"
                title="Clear all percentages"
              >
                Reset
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main KPI Evaluation Grid Container */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        
        {/* Table Top Header Summary Banner */}
        <div className="p-5 sm:p-6 bg-slate-900 text-white flex flex-col md:flex-row items-start md:items-center justify-between gap-5">
          <div>
            <div className="flex items-center gap-2.5">
              <span className="text-xs font-black uppercase tracking-widest px-2.5 py-1 rounded-lg bg-emerald-500 text-white shadow-xs">
                {activeEmployee.departmentId}
              </span>
              <h2 className="text-2xl font-black text-white tracking-tight">{activeEmployee.name}</h2>
            </div>
            
            {/* Completion Progress Bar */}
            <div className="mt-3 flex items-center gap-3 max-w-md">
              <div className="flex-1 bg-slate-800 h-2 rounded-full overflow-hidden border border-slate-700">
                <div
                  className="bg-gradient-to-r from-emerald-500 to-teal-400 h-full rounded-full transition-all duration-300"
                  style={{ width: `${completionPercentage}%` }}
                ></div>
              </div>
              <span className="text-xs font-semibold text-slate-300 whitespace-nowrap">
                {ratedKpisCount} / {kpis.length} Rated ({completionPercentage}%)
              </span>
            </div>
          </div>

          {/* Grand Total Score & Letter Grade Badge */}
          <div className="flex items-center gap-3.5 bg-slate-800/90 border border-slate-700/80 px-5 py-3 rounded-2xl shadow-inner">
            <Award className="h-8 w-8 text-emerald-400 shrink-0" />
            <div className="pr-3 border-r border-slate-700">
              <div className="text-[10px] uppercase tracking-wider font-bold text-slate-400">
                Monthly Score
              </div>
              <div className="text-2xl font-black text-emerald-400 leading-none mt-0.5">
                {grandTotal} <span className="text-xs text-slate-400 font-normal">/ {totalPossibleWeight}</span>
              </div>
            </div>

            {/* Performance Grade Pill */}
            <div className="text-center">
              <div className="text-[10px] uppercase tracking-wider font-bold text-slate-400">
                Grade
              </div>
              <span
                className={`inline-block mt-0.5 px-2.5 py-0.5 text-xs font-black rounded-lg ${gradeConfig.badgeBg} text-white shadow-xs`}
              >
                {grade}
              </span>
            </div>
          </div>
        </div>

        {/* Mathematical Formula Banner */}
        <div className="bg-slate-50 border-b border-slate-200/80 px-5 py-2.5 text-xs text-slate-600 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <HelpCircle className="h-4 w-4 text-emerald-600 shrink-0" />
            <span>
              <strong>Formulas:</strong> Weekly Score = (W% / 100) × Weight | Monthly KPI Total = Average(W1, W2, W3, W4) | Total = Sum(KPI Totals)
            </span>
          </div>
          <span className="text-[11px] text-slate-500 font-medium">
            💡 Tip: Use Arrow keys or Enter to move focus between rating cells.
          </span>
        </div>

        {/* Data Entry Grid Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-100/90 border-b border-slate-200 text-slate-700 text-xs font-extrabold uppercase tracking-wider">
                <th className="py-3.5 px-4 w-12 text-center">#</th>
                <th className="py-3.5 px-4 min-w-[220px]">KPI Title</th>
                <th className="py-3.5 px-3 min-w-[120px]">Evaluator</th>
                <th className="py-3.5 px-3 w-20 text-center">Weight</th>
                <th className="py-3.5 px-3 text-center min-w-[105px] bg-slate-200/40">W1 (%)</th>
                <th className="py-3.5 px-3 text-center min-w-[105px] bg-slate-200/40">W2 (%)</th>
                <th className="py-3.5 px-3 text-center min-w-[105px] bg-slate-200/40">W3 (%)</th>
                <th className="py-3.5 px-3 text-center min-w-[105px] bg-slate-200/40">W4 (%)</th>
                <th className="py-3.5 px-4 text-right min-w-[130px] bg-emerald-50 text-emerald-950">
                  Monthly Total
                </th>
                <th className="py-3.5 px-3 text-center w-20">Notes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200/80 text-xs text-slate-800">
              {filteredKpis.map((kpi, kpiIndex) => {
                const draft = localDrafts[kpi.id] || { w1Pct: '', w2Pct: '', w3Pct: '', w4Pct: '', notes: '' };
                const score = calculateKpiScore(kpi, {
                  w1Pct: sanitizePercentage(draft.w1Pct),
                  w2Pct: sanitizePercentage(draft.w2Pct),
                  w3Pct: sanitizePercentage(draft.w3Pct),
                  w4Pct: sanitizePercentage(draft.w4Pct),
                  notes: draft.notes,
                });

                const hasNotes = Boolean(draft.notes && draft.notes.trim() !== '');

                return (
                  <tr key={kpi.id} className="hover:bg-slate-50/90 transition-colors">
                    
                    {/* Index */}
                    <td className="py-3.5 px-4 text-center font-mono text-slate-400">
                      {kpiIndex + 1}
                    </td>

                    {/* KPI Title */}
                    <td className="py-3.5 px-4 font-bold text-slate-900">
                      {kpi.name}
                    </td>

                    {/* Evaluator Role */}
                    <td className="py-3.5 px-3">
                      <span className="inline-block px-2.5 py-0.5 rounded-lg text-[11px] font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                        {kpi.evaluatorRole}
                      </span>
                    </td>

                    {/* Weight */}
                    <td className="py-3.5 px-3 text-center font-black text-slate-800 text-sm">
                      {kpi.weight}
                    </td>

                    {/* Week 1 Input & Score */}
                    <td className="py-2.5 px-2 text-center bg-slate-50/40 border-x border-slate-100">
                      <div className="flex flex-col items-center">
                        <input
                          ref={(el) => (inputRefs.current[`${kpi.id}_w1Pct`] = el)}
                          type="number"
                          min="0"
                          max="100"
                          placeholder="0-100"
                          value={draft.w1Pct !== null && draft.w1Pct !== undefined ? draft.w1Pct : ''}
                          onChange={(e) => handlePctChange(kpi.id, 'w1Pct', e.target.value)}
                          onKeyDown={(e) => handleKeyDown(e, kpiIndex, 0)}
                          className="w-16 text-center font-black bg-white border border-slate-300/90 rounded-lg px-1.5 py-1 text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 focus:outline-none shadow-2xs"
                        />
                        <span className="text-[10px] text-slate-500 mt-1 font-mono">
                          ={score.w1Score.toFixed(2)} pts
                        </span>
                      </div>
                    </td>

                    {/* Week 2 Input & Score */}
                    <td className="py-2.5 px-2 text-center bg-slate-50/40 border-x border-slate-100">
                      <div className="flex flex-col items-center">
                        <input
                          ref={(el) => (inputRefs.current[`${kpi.id}_w2Pct`] = el)}
                          type="number"
                          min="0"
                          max="100"
                          placeholder="0-100"
                          value={draft.w2Pct !== null && draft.w2Pct !== undefined ? draft.w2Pct : ''}
                          onChange={(e) => handlePctChange(kpi.id, 'w2Pct', e.target.value)}
                          onKeyDown={(e) => handleKeyDown(e, kpiIndex, 1)}
                          className="w-16 text-center font-black bg-white border border-slate-300/90 rounded-lg px-1.5 py-1 text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 focus:outline-none shadow-2xs"
                        />
                        <span className="text-[10px] text-slate-500 mt-1 font-mono">
                          ={score.w2Score.toFixed(2)} pts
                        </span>
                      </div>
                    </td>

                    {/* Week 3 Input & Score */}
                    <td className="py-2.5 px-2 text-center bg-slate-50/40 border-x border-slate-100">
                      <div className="flex flex-col items-center">
                        <input
                          ref={(el) => (inputRefs.current[`${kpi.id}_w3Pct`] = el)}
                          type="number"
                          min="0"
                          max="100"
                          placeholder="0-100"
                          value={draft.w3Pct !== null && draft.w3Pct !== undefined ? draft.w3Pct : ''}
                          onChange={(e) => handlePctChange(kpi.id, 'w3Pct', e.target.value)}
                          onKeyDown={(e) => handleKeyDown(e, kpiIndex, 2)}
                          className="w-16 text-center font-black bg-white border border-slate-300/90 rounded-lg px-1.5 py-1 text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 focus:outline-none shadow-2xs"
                        />
                        <span className="text-[10px] text-slate-500 mt-1 font-mono">
                          ={score.w3Score.toFixed(2)} pts
                        </span>
                      </div>
                    </td>

                    {/* Week 4 Input & Score */}
                    <td className="py-2.5 px-2 text-center bg-slate-50/40 border-x border-slate-100">
                      <div className="flex flex-col items-center">
                        <input
                          ref={(el) => (inputRefs.current[`${kpi.id}_w4Pct`] = el)}
                          type="number"
                          min="0"
                          max="100"
                          placeholder="0-100"
                          value={draft.w4Pct !== null && draft.w4Pct !== undefined ? draft.w4Pct : ''}
                          onChange={(e) => handlePctChange(kpi.id, 'w4Pct', e.target.value)}
                          onKeyDown={(e) => handleKeyDown(e, kpiIndex, 3)}
                          className="w-16 text-center font-black bg-white border border-slate-300/90 rounded-lg px-1.5 py-1 text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 focus:outline-none shadow-2xs"
                        />
                        <span className="text-[10px] text-slate-500 mt-1 font-mono">
                          ={score.w4Score.toFixed(2)} pts
                        </span>
                      </div>
                    </td>

                    {/* Monthly Total Score */}
                    <td className="py-3.5 px-4 text-right bg-emerald-50/50 font-black text-sm text-emerald-950">
                      {score.monthlyTotalScore.toFixed(2)}
                      <span className="text-[10px] text-emerald-700 block font-normal">
                        out of {kpi.weight}
                      </span>
                    </td>

                    {/* Notes Trigger & Popover */}
                    <td className="py-3.5 px-3 text-center relative">
                      <button
                        onClick={() => setActiveNotesKpiId(activeNotesKpiId === kpi.id ? null : kpi.id)}
                        className={`p-2 rounded-xl border transition-all ${
                          hasNotes
                            ? 'bg-amber-100 border-amber-300 text-amber-800 hover:bg-amber-200'
                            : 'bg-slate-100 border-slate-200 text-slate-400 hover:text-slate-700 hover:bg-slate-200'
                        }`}
                        title={hasNotes ? draft.notes : 'Add qualitative note'}
                      >
                        <MessageSquare className="h-4 w-4" />
                      </button>

                      {/* Notes Popover Drawer */}
                      {activeNotesKpiId === kpi.id && (
                        <div className="absolute right-2 top-12 z-20 w-80 bg-white p-4 rounded-2xl shadow-2xl border border-slate-300 text-left space-y-3">
                          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                            <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                              <Tag className="h-3.5 w-3.5 text-emerald-600" />
                              Note: {kpi.name}
                            </span>
                            <button
                              onClick={() => setActiveNotesKpiId(null)}
                              className="text-xs text-slate-400 hover:text-slate-600 font-bold"
                            >
                              ✕
                            </button>
                          </div>

                          {/* Quick note presets */}
                          <div>
                            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                              Quick Tag Suggestions
                            </div>
                            <div className="flex flex-wrap gap-1">
                              {PRESET_NOTE_TAGS.map((tag) => (
                                <button
                                  key={tag}
                                  type="button"
                                  onClick={() => {
                                    const current = draft.notes || '';
                                    const nextNotes = current ? `${current}; ${tag}` : tag;
                                    handleNotesChange(kpi.id, nextNotes);
                                  }}
                                  className="text-[10px] font-medium bg-slate-100 text-slate-700 hover:bg-emerald-50 hover:text-emerald-800 hover:border-emerald-300 px-2 py-0.5 rounded-lg border border-slate-200 transition-colors"
                                >
                                  + {tag}
                                </button>
                              ))}
                            </div>
                          </div>

                          <textarea
                            rows={3}
                            placeholder="Add qualitative feedback or explanation..."
                            value={draft.notes || ''}
                            onChange={(e) => handleNotesChange(kpi.id, e.target.value)}
                            className="w-full text-xs p-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                          />
                          
                          <div className="flex justify-end">
                            <button
                              onClick={() => setActiveNotesKpiId(null)}
                              className="px-3 py-1.5 text-xs font-bold bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 shadow-xs"
                            >
                              Save Note
                            </button>
                          </div>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>

            {/* Bottom Grand Total Footer */}
            <tfoot>
              <tr className="bg-slate-900 text-white font-black text-sm border-t-2 border-slate-800">
                <td colSpan={3} className="py-4 px-4 text-right uppercase tracking-wider text-xs text-slate-400 font-bold">
                  Total Weight & Monthly Score:
                </td>
                <td className="py-4 px-3 text-center text-amber-400 text-base">
                  {totalPossibleWeight}
                </td>
                <td colSpan={4} className="py-4 px-3 text-center text-xs text-slate-400 font-normal">
                  Average across 4 weeks
                </td>
                <td className="py-4 px-4 text-right text-xl text-emerald-400 font-black">
                  {grandTotal} <span className="text-xs text-slate-400 font-normal">/ {totalPossibleWeight}</span>
                </td>
                <td></td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  );
};
