import React, { useRef, useState } from 'react';
import { DepartmentCode } from '../types';
import {
  Calendar,
  Users,
  Target,
  FileSpreadsheet,
  RotateCcw,
  CheckCircle2,
  Database,
  Download,
  Upload,
  ShieldCheck,
  Server,
} from 'lucide-react';

interface HeaderProps {
  activeTab: 'evaluation' | 'archive' | 'employees' | 'kpis';
  setActiveTab: (tab: 'evaluation' | 'archive' | 'employees' | 'kpis') => void;
  selectedDept: DepartmentCode;
  setSelectedDept: (dept: DepartmentCode) => void;
  selectedMonth: number;
  setSelectedMonth: (m: number) => void;
  selectedYear: number;
  setSelectedYear: (y: number) => void;
  onResetDb: () => void;
  onExportDb: () => void;
  onImportDb: (json: any) => Promise<void>;
  isSaving?: boolean;
}

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  selectedDept,
  setSelectedDept,
  selectedMonth,
  setSelectedMonth,
  selectedYear,
  setSelectedYear,
  onResetDb,
  onExportDb,
  onImportDb,
  isSaving,
}) => {
  const [showDbMenu, setShowDbMenu] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const content = event.target?.result as string;
        const parsed = JSON.parse(content);
        await onImportDb(parsed);
        setShowDbMenu(false);
      } catch (err: any) {
        alert(`Failed to parse database file: ${err.message}`);
      }
    };
    reader.readAsText(file);
    // Reset file input
    e.target.value = '';
  };

  return (
    <header className="bg-slate-900 border-b border-slate-800 text-slate-100 sticky top-0 z-30 shadow-md">
      {/* Hidden File Input for Database Import */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept=".json"
        className="hidden"
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between py-3.5 gap-4">
          
          {/* Brand & Title */}
          <div className="flex items-center space-x-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-700 flex items-center justify-center font-bold text-white shadow-md shadow-emerald-900/20 shrink-0">
              <FileSpreadsheet className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-base sm:text-lg font-black tracking-tight text-white flex items-center gap-2">
                Employee KPI Performance and Management System
                <span className="hidden sm:inline-flex text-[10px] font-bold tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 uppercase">
                  Standalone DB
                </span>
              </h1>
              <p className="text-xs text-slate-400 flex items-center gap-1.5 mt-0.5">
                <Server className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                <span>Isolated Performance & KPI Matrix Database</span>
              </p>
            </div>
          </div>

          {/* Department & Date Filter Controls */}
          <div className="flex flex-wrap items-center gap-2.5">
            
            {/* Department selector */}
            <div className="flex items-center bg-slate-800/90 p-1 rounded-xl border border-slate-700/80 shadow-inner">
              {(['DEV', 'QA', 'PO'] as DepartmentCode[]).map((dept) => (
                <button
                  key={dept}
                  onClick={() => setSelectedDept(dept)}
                  className={`px-3.5 py-1.5 text-xs font-bold rounded-lg transition-all ${
                    selectedDept === dept
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'text-slate-300 hover:text-white hover:bg-slate-700/60'
                  }`}
                >
                  {dept}
                </button>
              ))}
            </div>

            {/* Date Picker (Month & Year) */}
            <div className="flex items-center gap-2 bg-slate-800/90 px-3 py-1.5 rounded-xl border border-slate-700/80 text-xs shadow-inner">
              <Calendar className="h-4 w-4 text-emerald-400 shrink-0" />
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(Number(e.target.value))}
                className="bg-transparent text-slate-200 font-semibold focus:outline-none cursor-pointer"
              >
                {MONTHS.map((m, idx) => (
                  <option key={m} value={idx + 1} className="bg-slate-900 text-slate-200">
                    {m}
                  </option>
                ))}
              </select>
              <span className="text-slate-600">/</span>
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(Number(e.target.value))}
                className="bg-transparent text-slate-200 font-semibold focus:outline-none cursor-pointer"
              >
                {[2025, 2026, 2027].map((y) => (
                  <option key={y} value={y} className="bg-slate-900 text-slate-200">
                    {y}
                  </option>
                ))}
              </select>
            </div>

            {/* Save Status & DB Actions Dropdown */}
            <div className="flex items-center gap-2 ml-auto md:ml-0 relative">
              {isSaving ? (
                <span className="text-xs bg-amber-500/10 text-amber-400 border border-amber-500/20 px-2.5 py-1 rounded-lg flex items-center gap-1.5 font-medium animate-pulse">
                  <span className="h-2 w-2 rounded-full bg-amber-400"></span> Saving...
                </span>
              ) : (
                <span className="text-xs text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-lg flex items-center gap-1.5 font-medium">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" /> Auto-Saved
                </span>
              )}

              {/* Database Actions Button */}
              <div className="relative">
                <button
                  onClick={() => setShowDbMenu(!showDbMenu)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 text-slate-200 hover:bg-slate-700 border border-slate-700/80 transition-colors text-xs font-bold shadow-xs"
                >
                  <Database className="h-3.5 w-3.5 text-emerald-400" />
                  <span>Database</span>
                </button>

                {/* Dropdown Menu */}
                {showDbMenu && (
                  <div className="absolute right-0 mt-2 w-64 bg-slate-800 border border-slate-700 rounded-2xl shadow-xl p-2 z-50 text-xs space-y-1">
                    <div className="px-3 py-2 border-b border-slate-700/80 text-slate-400 font-bold text-[10px] uppercase tracking-wider">
                      Standalone DB Management
                    </div>

                    <button
                      onClick={() => {
                        onExportDb();
                        setShowDbMenu(false);
                      }}
                      className="w-full text-left px-3 py-2 rounded-xl hover:bg-slate-700/80 text-slate-200 flex items-center gap-2 font-semibold transition-colors"
                    >
                      <Download className="h-4 w-4 text-emerald-400 shrink-0" />
                      Export Database (JSON)
                    </button>

                    <button
                      onClick={() => {
                        fileInputRef.current?.click();
                      }}
                      className="w-full text-left px-3 py-2 rounded-xl hover:bg-slate-700/80 text-slate-200 flex items-center gap-2 font-semibold transition-colors"
                    >
                      <Upload className="h-4 w-4 text-indigo-400 shrink-0" />
                      Upload / Restore Database
                    </button>

                    <button
                      onClick={() => {
                        setShowDbMenu(false);
                        onResetDb();
                      }}
                      className="w-full text-left px-3 py-2 rounded-xl hover:bg-rose-900/30 text-rose-300 flex items-center gap-2 font-semibold transition-colors border-t border-slate-700/50 mt-1"
                    >
                      <RotateCcw className="h-4 w-4 text-rose-400 shrink-0" />
                      Reset to Default Seeds
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex space-x-1 border-t border-slate-800/80 pt-2 pb-1.5 overflow-x-auto scrollbar-none">
          <button
            onClick={() => setActiveTab('evaluation')}
            className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-xl transition-all whitespace-nowrap ${
              activeTab === 'evaluation'
                ? 'bg-emerald-600/20 text-emerald-400 border border-emerald-500/30 shadow-xs'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <FileSpreadsheet className="h-4 w-4" />
            Evaluation Sheet
          </button>

          <button
            onClick={() => setActiveTab('archive')}
            className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-xl transition-all whitespace-nowrap ${
              activeTab === 'archive'
                ? 'bg-emerald-600/20 text-emerald-400 border border-emerald-500/30 shadow-xs'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <Calendar className="h-4 w-4" />
            Historical Archive
          </button>

          <button
            onClick={() => setActiveTab('employees')}
            className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-xl transition-all whitespace-nowrap ${
              activeTab === 'employees'
                ? 'bg-emerald-600/20 text-emerald-400 border border-emerald-500/30 shadow-xs'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <Users className="h-4 w-4" />
            Employee Management
          </button>

          <button
            onClick={() => setActiveTab('kpis')}
            className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-xl transition-all whitespace-nowrap ${
              activeTab === 'kpis'
                ? 'bg-emerald-600/20 text-emerald-400 border border-emerald-500/30 shadow-xs'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <Target className="h-4 w-4" />
            KPI Structure & Weights
          </button>
        </div>
      </div>
    </header>
  );
};
