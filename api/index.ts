import express from 'express';
import { dbStore } from '../server/store';
import { DepartmentCode } from '../src/types';

const app = express();

app.use(express.json());

// API Routes

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Departments
app.get('/api/departments', (req, res) => {
  try {
    const depts = dbStore.getDepartments();
    res.json(depts);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// KPIs
app.get('/api/kpis', (req, res) => {
  try {
    const departmentId = req.query.departmentId as DepartmentCode | undefined;
    const kpis = dbStore.getKpis(departmentId);
    res.json(kpis);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// Employees
app.get('/api/employees', (req, res) => {
  try {
    const departmentId = req.query.departmentId as DepartmentCode | undefined;
    const includeInactive = req.query.includeInactive === 'true';
    const employees = dbStore.getEmployees(departmentId, includeInactive);
    res.json(employees);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

app.post('/api/employees', (req, res) => {
  try {
    const { name, departmentId } = req.body;
    if (!name || !departmentId) {
      return res.status(400).json({ error: 'Name and departmentId are required' });
    }
    const newEmp = dbStore.addEmployee(name, departmentId);
    res.status(201).json(newEmp);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

app.put('/api/employees/:id', (req, res) => {
  try {
    const { id } = req.params;
    const { name, departmentId, isActive } = req.body;
    const updated = dbStore.updateEmployee(id, { name, departmentId, isActive });
    if (!updated) {
      return res.status(404).json({ error: 'Employee not found' });
    }
    res.json(updated);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

app.delete('/api/employees/:id', (req, res) => {
  try {
    const { id } = req.params;
    const deactivated = dbStore.deactivateEmployee(id);
    if (!deactivated) {
      return res.status(404).json({ error: 'Employee not found' });
    }
    res.json(deactivated);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

app.patch('/api/employees/:id/reactivate', (req, res) => {
  try {
    const { id } = req.params;
    const reactivated = dbStore.reactivateEmployee(id);
    if (!reactivated) {
      return res.status(404).json({ error: 'Employee not found' });
    }
    res.json(reactivated);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// Evaluations
app.get('/api/evaluations', (req, res) => {
  try {
    const month = Number(req.query.month) || new Date().getMonth() + 1;
    const year = Number(req.query.year) || new Date().getFullYear();
    const departmentId = req.query.departmentId as DepartmentCode | undefined;
    const employeeId = req.query.employeeId as string | undefined;

    const evaluations = dbStore.getEvaluations({ month, year, departmentId, employeeId });
    res.json(evaluations);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

app.post('/api/evaluations', (req, res) => {
  try {
    const body = req.body;
    if (Array.isArray(body)) {
      const savedBatch = dbStore.saveBatchEvaluations(body);
      return res.json(savedBatch);
    } else {
      const saved = dbStore.saveEvaluation(body);
      return res.json(saved);
    }
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// Seed Reset
app.post('/api/seed/reset', (req, res) => {
  try {
    dbStore.seedDefaults();
    res.json({ message: 'Database reset and seeded with initial employees and KPIs.' });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// Standalone Database Backup & Restore API
app.get('/api/database/export', (req, res) => {
  try {
    const dump = dbStore.exportFullDatabase();
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', 'attachment; filename="Employee_KPI_Performance_and_Management_System_DB.json"');
    res.json(dump);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

app.post('/api/database/import', (req, res) => {
  try {
    const body = req.body;
    const result = dbStore.importFullDatabase(body);
    res.json(result);
  } catch (e: any) {
    res.status(400).json({ error: e.message || 'Failed to import database file.' });
  }
});

export default app;
