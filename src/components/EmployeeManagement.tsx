import React, { useState } from 'react';
import { DepartmentCode, Employee } from '../types';
import {
  UserPlus,
  Users,
  Search,
  UserX,
  UserCheck,
  Edit2,
  Trash2,
  CheckCircle,
  AlertCircle,
  Building,
  Shield,
  Briefcase,
} from 'lucide-react';

interface EmployeeManagementProps {
  employees: Employee[];
  selectedDept: DepartmentCode;
  onAddEmployee: (name: string, departmentId: DepartmentCode) => void;
  onUpdateEmployee: (id: string, updates: { name?: string; departmentId?: DepartmentCode; isActive?: boolean }) => void;
  onDeactivateEmployee: (id: string) => void;
  onReactivateEmployee: (id: string) => void;
}

export const EmployeeManagement: React.FC<EmployeeManagementProps> = ({
  employees,
  selectedDept,
  onAddEmployee,
  onUpdateEmployee,
  onDeactivateEmployee,
  onReactivateEmployee,
}) => {
  const [showAddModal, setShowAddModal] = useState(false);
  const [newEmpName, setNewEmpName] = useState('');
  const [newEmpDept, setNewEmpDept] = useState<DepartmentCode>(selectedDept);

  const [editingEmp, setEditingEmp] = useState<Employee | null>(null);
  const [editName, setEditName] = useState('');
  const [editDept, setEditDept] = useState<DepartmentCode>('DEV');

  const [deactivatingEmpId, setDeactivatingEmpId] = useState<string | null>(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [deptFilter, setDeptFilter] = useState<'ALL' | DepartmentCode>('ALL');
  const [showDeactivated, setShowDeactivated] = useState(true);

  // Statistics
  const activeCount = employees.filter((e) => e.isActive).length;
  const deactivatedCount = employees.filter((e) => !e.isActive).length;
  const devCount = employees.filter((e) => e.departmentId === 'DEV' && e.isActive).length;
  const qaCount = employees.filter((e) => e.departmentId === 'QA' && e.isActive).length;
  const poCount = employees.filter((e) => e.departmentId === 'PO' && e.isActive).length;

  const filteredEmployees = employees.filter((emp) => {
    if (!showDeactivated && !emp.isActive) return false;
    if (deptFilter !== 'ALL' && emp.departmentId !== deptFilter) return false;
    if (searchQuery && !emp.name.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEmpName.trim()) return;
    onAddEmployee(newEmpName, newEmpDept);
    setNewEmpName('');
    setShowAddModal(false);
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingEmp || !editName.trim()) return;
    onUpdateEmployee(editingEmp.id, { name: editName, departmentId: editDept });
    setEditingEmp(null);
  };

  const handleConfirmDeactivate = () => {
    if (deactivatingEmpId) {
      onDeactivateEmployee(deactivatingEmpId);
      setDeactivatingEmpId(null);
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .slice(0, 2)
      .join('')
      .toUpperCase();
  };

  return (
    <div className="space-y-6">
      
      {/* Top Banner & Stats Overview */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-5">
        <div>
          <h2 className="text-2xl font-black text-slate-900 flex items-center gap-2">
            <Users className="h-6 w-6 text-emerald-600" /> Employee Directory
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Manage active team members across DEV, QA, and PO. Deactivating employees preserves all historical KPI evaluations.
          </p>

          {/* Quick Stats Ticker */}
          <div className="flex flex-wrap items-center gap-2 mt-3">
            <span className="px-2.5 py-1 rounded-lg text-[11px] font-extrabold bg-emerald-50 text-emerald-800 border border-emerald-200">
              Active: {activeCount}
            </span>
            <span className="px-2.5 py-1 rounded-lg text-[11px] font-extrabold bg-indigo-50 text-indigo-800 border border-indigo-200">
              DEV: {devCount}
            </span>
            <span className="px-2.5 py-1 rounded-lg text-[11px] font-extrabold bg-teal-50 text-teal-800 border border-teal-200">
              QA: {qaCount}
            </span>
            <span className="px-2.5 py-1 rounded-lg text-[11px] font-extrabold bg-amber-50 text-amber-800 border border-amber-200">
              PO: {poCount}
            </span>
            {deactivatedCount > 0 && (
              <span className="px-2.5 py-1 rounded-lg text-[11px] font-extrabold bg-slate-100 text-slate-600 border border-slate-200">
                Deactivated: {deactivatedCount}
              </span>
            )}
          </div>
        </div>

        <button
          onClick={() => {
            setNewEmpDept(selectedDept);
            setShowAddModal(true);
          }}
          className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 text-white rounded-xl text-xs font-bold hover:bg-emerald-700 transition-colors shadow-xs shrink-0"
        >
          <UserPlus className="h-4 w-4" />
          Add New Employee
        </button>
      </div>

      {/* Filter and Search Toolbar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
        
        {/* Search Input */}
        <div className="relative w-full sm:w-80">
          <Search className="h-4 w-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search employee name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-300/80 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
          />
        </div>

        {/* Department Filter Tabs */}
        <div className="flex items-center gap-2">
          {(['ALL', 'DEV', 'QA', 'PO'] as const).map((dept) => (
            <button
              key={dept}
              onClick={() => setDeptFilter(dept)}
              className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-all border ${
                deptFilter === dept
                  ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                  : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
              }`}
            >
              {dept === 'ALL' ? 'All Depts' : dept}
            </button>
          ))}
        </div>

        <label className="flex items-center gap-2 text-xs font-semibold text-slate-600 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={showDeactivated}
            onChange={(e) => setShowDeactivated(e.target.checked)}
            className="h-4 w-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500"
          />
          Show Deactivated ({deactivatedCount})
        </label>
      </div>

      {/* Employee List Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-100/90 border-b border-slate-200 text-slate-700 text-xs font-extrabold uppercase tracking-wider">
                <th className="py-3.5 px-4 w-12 text-center">#</th>
                <th className="py-3.5 px-4">Employee Name</th>
                <th className="py-3.5 px-3">Department</th>
                <th className="py-3.5 px-3">Status</th>
                <th className="py-3.5 px-4">Created Date</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200/80 text-xs text-slate-800">
              {filteredEmployees.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400 font-medium">
                    No matching employees found in directory.
                  </td>
                </tr>
              ) : (
                filteredEmployees.map((emp, index) => (
                  <tr key={emp.id} className="hover:bg-slate-50/90 transition-colors">
                    <td className="py-3.5 px-4 text-slate-400 font-mono text-center">{index + 1}</td>

                    <td className="py-3.5 px-4 font-extrabold text-slate-900 flex items-center gap-3">
                      <div className="h-8 w-8 rounded-full bg-slate-900 text-white font-extrabold text-xs flex items-center justify-center shrink-0 shadow-xs">
                        {getInitials(emp.name)}
                      </div>
                      <span>{emp.name}</span>
                    </td>

                    <td className="py-3.5 px-3">
                      <span className="px-2.5 py-1 text-[10px] font-black rounded-lg bg-slate-900 text-white shadow-2xs">
                        {emp.departmentId}
                      </span>
                    </td>

                    <td className="py-3.5 px-3">
                      {emp.isActive ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 text-[11px] font-bold rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <CheckCircle className="h-3 w-3" /> Active
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 text-[11px] font-bold rounded-full bg-slate-100 text-slate-500 border border-slate-200">
                          <UserX className="h-3 w-3" /> Deactivated
                        </span>
                      )}
                    </td>

                    <td className="py-3.5 px-4 text-slate-500 text-[11px] font-medium">
                      {new Date(emp.createdAt).toLocaleDateString()}
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => {
                            setEditingEmp(emp);
                            setEditName(emp.name);
                            setEditDept(emp.departmentId);
                          }}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors border border-transparent hover:border-slate-200"
                          title="Edit details"
                        >
                          <Edit2 className="h-4 w-4" />
                        </button>

                        {emp.isActive ? (
                          <button
                            onClick={() => setDeactivatingEmpId(emp.id)}
                            className="px-2.5 py-1 text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200/80 rounded-lg hover:bg-rose-100 transition-colors flex items-center gap-1"
                            title="Deactivate employee"
                          >
                            <UserX className="h-3.5 w-3.5" /> Deactivate
                          </button>
                        ) : (
                          <button
                            onClick={() => onReactivateEmployee(emp.id)}
                            className="px-2.5 py-1 text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200/80 rounded-lg hover:bg-emerald-100 transition-colors flex items-center gap-1"
                            title="Reactivate employee"
                          >
                            <UserCheck className="h-3.5 w-3.5" /> Reactivate
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Employee Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 space-y-4 border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                <UserPlus className="h-5 w-5 text-emerald-600" /> Add New Employee
              </h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-slate-600 font-bold text-sm"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Hassan Mohamed"
                  value={newEmpName}
                  onChange={(e) => setNewEmpName(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Department Assignment
                </label>
                <select
                  value={newEmpDept}
                  onChange={(e) => setNewEmpDept(e.target.value as DepartmentCode)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none bg-white font-semibold text-slate-800"
                >
                  <option value="DEV">DEV (Development)</option>
                  <option value="QA">QA (Quality Assurance)</option>
                  <option value="PO">PO (Product Owners)</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-3 py-1.5 text-xs font-bold text-slate-600 bg-slate-100 rounded-xl hover:bg-slate-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 text-xs font-bold text-white bg-emerald-600 rounded-xl hover:bg-emerald-700 shadow-xs"
                >
                  Create Employee
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Employee Modal */}
      {editingEmp && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 space-y-4 border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                <Edit2 className="h-5 w-5 text-emerald-600" /> Edit Employee
              </h3>
              <button
                onClick={() => setEditingEmp(null)}
                className="text-slate-400 hover:text-slate-600 font-bold text-sm"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  required
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Department
                </label>
                <select
                  value={editDept}
                  onChange={(e) => setEditDept(e.target.value as DepartmentCode)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none bg-white font-semibold text-slate-800"
                >
                  <option value="DEV">DEV (Development)</option>
                  <option value="QA">QA (Quality Assurance)</option>
                  <option value="PO">PO (Product Owners)</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingEmp(null)}
                  className="px-3 py-1.5 text-xs font-bold text-slate-600 bg-slate-100 rounded-xl hover:bg-slate-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 text-xs font-bold text-white bg-emerald-600 rounded-xl hover:bg-emerald-700 shadow-xs"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Deactivation Confirmation Modal */}
      {deactivatingEmpId && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6 space-y-4 border border-slate-200">
            <div className="flex items-center gap-3 text-rose-600">
              <AlertCircle className="h-6 w-6 shrink-0" />
              <h3 className="text-base font-black text-slate-900">Deactivate Employee?</h3>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              This will mark the employee as deactivated. They will be hidden from new evaluation entry sheets, but all past KPI scores and historical archive records will remain fully intact.
            </p>
            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setDeactivatingEmpId(null)}
                className="px-3.5 py-1.5 text-xs font-bold text-slate-600 bg-slate-100 rounded-xl hover:bg-slate-200"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmDeactivate}
                className="px-4 py-1.5 text-xs font-bold text-white bg-rose-600 rounded-xl hover:bg-rose-700 shadow-xs"
              >
                Deactivate
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
