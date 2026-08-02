import React, { useState, useEffect, useCallback } from 'react';
import { DepartmentCode, Department, Employee, KPI, Evaluation } from './types';
import { api } from './services/api';
import { Header } from './components/Header';
import { EvaluationDashboard } from './components/EvaluationDashboard';
import { HistoricalArchive } from './components/HistoricalArchive';
import { EmployeeManagement } from './components/EmployeeManagement';
import { KpiStructureView } from './components/KpiStructureView';
import { AlertCircle, RefreshCw } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState<'evaluation' | 'archive' | 'employees' | 'kpis'>('evaluation');
  const [selectedDept, setSelectedDept] = useState<DepartmentCode>('DEV');
  
  const currentDate = new Date();
  const [selectedMonth, setSelectedMonth] = useState<number>(currentDate.getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState<number>(currentDate.getFullYear());

  const [departments, setDepartments] = useState<Department[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [kpis, setKpis] = useState<KPI[]>([]);
  const [evaluations, setEvaluations] = useState<Evaluation[]>([]);

  const [loading, setLoading] = useState<boolean>(true);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Load initial static data (departments & kpis)
  const loadBaseData = useCallback(async () => {
    try {
      const [deptsData, kpisData] = await Promise.all([
        api.getDepartments(),
        api.getKpis(),
      ]);
      setDepartments(deptsData);
      setKpis(kpisData);
    } catch (err: any) {
      console.error('Failed to load base metadata', err);
      setError(err.message || 'Failed to connect to backend server');
    }
  }, []);

  // Load employees (including inactive so archive & management tabs work)
  const loadEmployees = useCallback(async () => {
    try {
      const empsData = await api.getEmployees(undefined, true);
      setEmployees(empsData);
    } catch (err: any) {
      console.error('Failed to load employees', err);
    }
  }, []);

  // Load evaluations for current month & year
  const loadEvaluations = useCallback(async () => {
    try {
      const evalsData = await api.getEvaluations(selectedMonth, selectedYear);
      setEvaluations(evalsData);
    } catch (err: any) {
      console.error('Failed to load evaluations', err);
    }
  }, [selectedMonth, selectedYear]);

  // Initial load
  useEffect(() => {
    async function init() {
      setLoading(true);
      setError(null);
      await loadBaseData();
      await loadEmployees();
      await loadEvaluations();
      setLoading(false);
    }
    init();
  }, [loadBaseData, loadEmployees, loadEvaluations]);

  // Save single evaluation item
  const handleSaveEvaluation = async (
    data: Partial<Evaluation> & { employeeId: string; kpiId: string; month: number; year: number }
  ) => {
    setIsSaving(true);
    try {
      const saved = await api.saveEvaluation(data);
      setEvaluations((prev) => {
        const idx = prev.findIndex((ev) => ev.id === saved.id);
        if (idx >= 0) {
          const next = [...prev];
          next[idx] = saved;
          return next;
        } else {
          return [...prev, saved];
        }
      });
    } catch (err: any) {
      console.error('Error saving evaluation:', err);
    } finally {
      setTimeout(() => setIsSaving(false), 300);
    }
  };

  // Save batch evaluations
  const handleSaveBatch = async (
    dataBatch: Array<Partial<Evaluation> & { employeeId: string; kpiId: string; month: number; year: number }>
  ) => {
    setIsSaving(true);
    try {
      const savedBatch = await api.saveBatchEvaluations(dataBatch);
      setEvaluations((prev) => {
        const next = [...prev];
        savedBatch.forEach((saved) => {
          const idx = next.findIndex((ev) => ev.id === saved.id);
          if (idx >= 0) {
            next[idx] = saved;
          } else {
            next.push(saved);
          }
        });
        return next;
      });
    } catch (err: any) {
      console.error('Error batch saving evaluations:', err);
    } finally {
      setTimeout(() => setIsSaving(false), 300);
    }
  };

  // Add Employee
  const handleAddEmployee = async (name: string, departmentId: DepartmentCode) => {
    try {
      const newEmp = await api.addEmployee(name, departmentId);
      setEmployees((prev) => [...prev, newEmp]);
    } catch (err: any) {
      alert(`Failed to add employee: ${err.message}`);
    }
  };

  // Update Employee
  const handleUpdateEmployee = async (
    id: string,
    updates: { name?: string; departmentId?: DepartmentCode; isActive?: boolean }
  ) => {
    try {
      const updated = await api.updateEmployee(id, updates);
      setEmployees((prev) => prev.map((e) => (e.id === id ? updated : e)));
    } catch (err: any) {
      alert(`Failed to update employee: ${err.message}`);
    }
  };

  // Deactivate Employee (soft delete)
  const handleDeactivateEmployee = async (id: string) => {
    try {
      const deactivated = await api.deactivateEmployee(id);
      setEmployees((prev) => prev.map((e) => (e.id === id ? deactivated : e)));
    } catch (err: any) {
      alert(`Failed to deactivate employee: ${err.message}`);
    }
  };

  // Reactivate Employee
  const handleReactivateEmployee = async (id: string) => {
    try {
      const reactivated = await api.reactivateEmployee(id);
      setEmployees((prev) => prev.map((e) => (e.id === id ? reactivated : e)));
    } catch (err: any) {
      alert(`Failed to reactivate employee: ${err.message}`);
    }
  };

  // Reset database to seed data
  const handleResetDb = async () => {
    if (window.confirm('Reset database to default seed data? All custom entries will be restored.')) {
      setLoading(true);
      try {
        await api.resetDatabase();
        await loadBaseData();
        await loadEmployees();
        await loadEvaluations();
      } catch (err: any) {
        alert(`Reset failed: ${err.message}`);
      } finally {
        setLoading(false);
      }
    }
  };

  // Export full standalone database JSON
  const handleExportDb = async () => {
    try {
      const dump = await api.exportDatabaseDump();
      const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(JSON.stringify(dump, null, 2))}`;
      const downloadAnchor = document.createElement('a');
      downloadAnchor.setAttribute('href', jsonString);
      downloadAnchor.setAttribute('download', 'Employee_KPI_Performance_and_Management_System_DB.json');
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
    } catch (err: any) {
      alert(`Export failed: ${err.message}`);
    }
  };

  // Import full standalone database JSON
  const handleImportDb = async (jsonData: any) => {
    setLoading(true);
    try {
      const result = await api.importDatabaseDump(jsonData);
      await loadBaseData();
      await loadEmployees();
      await loadEvaluations();
      alert(result.message || 'Database imported successfully!');
    } catch (err: any) {
      alert(`Import failed: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const activeEmployees = employees.filter((e) => e.departmentId === selectedDept && e.isActive);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 text-slate-100 flex items-center justify-center">
        <div className="text-center space-y-4 p-8">
          <RefreshCw className="h-10 w-10 text-emerald-500 animate-spin mx-auto" />
          <p className="text-sm font-semibold tracking-wide text-slate-300">
            Initializing KPI Performance System...
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-900 text-slate-100 flex items-center justify-center p-4">
        <div className="bg-slate-800 border border-rose-500/30 rounded-xl p-6 max-w-md text-center space-y-4">
          <AlertCircle className="h-12 w-12 text-rose-500 mx-auto" />
          <h2 className="text-lg font-bold text-white">System Loading Error</h2>
          <p className="text-xs text-slate-300">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-xs font-semibold hover:bg-emerald-500"
          >
            Retry Connection
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 flex flex-col font-sans">
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        selectedDept={selectedDept}
        setSelectedDept={setSelectedDept}
        selectedMonth={selectedMonth}
        setSelectedMonth={setSelectedMonth}
        selectedYear={selectedYear}
        setSelectedYear={setSelectedYear}
        onResetDb={handleResetDb}
        onExportDb={handleExportDb}
        onImportDb={handleImportDb}
        isSaving={isSaving}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'evaluation' && (
          <EvaluationDashboard
            departmentId={selectedDept}
            month={selectedMonth}
            year={selectedYear}
            employees={activeEmployees}
            kpis={kpis.filter((k) => k.departmentId === selectedDept)}
            evaluations={evaluations}
            onSaveEvaluation={handleSaveEvaluation}
            onSaveBatch={handleSaveBatch}
          />
        )}

        {activeTab === 'archive' && (
          <HistoricalArchive
            departmentId={selectedDept}
            month={selectedMonth}
            year={selectedYear}
            employees={employees}
            kpis={kpis}
            evaluations={evaluations}
          />
        )}

        {activeTab === 'employees' && (
          <EmployeeManagement
            employees={employees}
            selectedDept={selectedDept}
            onAddEmployee={handleAddEmployee}
            onUpdateEmployee={handleUpdateEmployee}
            onDeactivateEmployee={handleDeactivateEmployee}
            onReactivateEmployee={handleReactivateEmployee}
          />
        )}

        {activeTab === 'kpis' && (
          <KpiStructureView
            kpis={kpis}
            selectedDept={selectedDept}
            onSelectDept={setSelectedDept}
          />
        )}
      </main>

      <footer className="bg-slate-900 border-t border-slate-800 py-6 text-center text-xs text-slate-500">
        <p>Employee KPI Performance and Management System &copy; {selectedYear}</p>
        <p className="mt-1 text-[11px] text-slate-600">
          Standalone Isolated Database &bull; Replicating Google Sheets formulas &bull; Scalable Matrix Architecture
        </p>
      </footer>
    </div>
  );
}
