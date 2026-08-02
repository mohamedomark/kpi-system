import { Department, Employee, KPI, Evaluation, DepartmentCode } from '../types';

async function fetchJson<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
    ...options,
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`API Error (${res.status}): ${errText}`);
  }

  return res.json();
}

export const api = {
  getDepartments: () => fetchJson<Department[]>('/api/departments'),
  
  getKpis: (departmentId?: DepartmentCode) =>
    fetchJson<KPI[]>(`/api/kpis${departmentId ? `?departmentId=${departmentId}` : ''}`),

  getEmployees: (departmentId?: DepartmentCode, includeInactive = false) => {
    const params = new URLSearchParams();
    if (departmentId) params.append('departmentId', departmentId);
    if (includeInactive) params.append('includeInactive', 'true');
    const query = params.toString();
    return fetchJson<Employee[]>(`/api/employees${query ? `?${query}` : ''}`);
  },

  addEmployee: (name: string, departmentId: DepartmentCode) =>
    fetchJson<Employee>('/api/employees', {
      method: 'POST',
      body: JSON.stringify({ name, departmentId }),
    }),

  updateEmployee: (id: string, updates: { name?: string; departmentId?: DepartmentCode; isActive?: boolean }) =>
    fetchJson<Employee>(`/api/employees/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    }),

  deactivateEmployee: (id: string) =>
    fetchJson<Employee>(`/api/employees/${id}`, {
      method: 'DELETE',
    }),

  reactivateEmployee: (id: string) =>
    fetchJson<Employee>(`/api/employees/${id}/reactivate`, {
      method: 'PATCH',
    }),

  getEvaluations: (month: number, year: number, departmentId?: DepartmentCode, employeeId?: string) => {
    const params = new URLSearchParams();
    params.append('month', String(month));
    params.append('year', String(year));
    if (departmentId) params.append('departmentId', departmentId);
    if (employeeId) params.append('employeeId', employeeId);
    return fetchJson<Evaluation[]>(`/api/evaluations?${params.toString()}`);
  },

  saveEvaluation: (data: Partial<Evaluation> & { employeeId: string; kpiId: string; month: number; year: number }) =>
    fetchJson<Evaluation>('/api/evaluations', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  saveBatchEvaluations: (data: Array<Partial<Evaluation> & { employeeId: string; kpiId: string; month: number; year: number }>) =>
    fetchJson<Evaluation[]>('/api/evaluations', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  resetDatabase: () =>
    fetchJson<{ message: string }>('/api/seed/reset', {
      method: 'POST',
    }),

  exportDatabaseDump: () => fetchJson<any>('/api/database/export'),

  importDatabaseDump: (jsonData: any) =>
    fetchJson<{ success: boolean; message: string; recordCounts?: Record<string, number> }>('/api/database/import', {
      method: 'POST',
      body: JSON.stringify(jsonData),
    }),
};
