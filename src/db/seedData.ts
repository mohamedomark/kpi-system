import { Department, Employee, KPI } from '../types';

export const INITIAL_DEPARTMENTS: Department[] = [
  { id: 'DEV', name: 'Development' },
  { id: 'QA', name: 'Quality Assurance' },
  { id: 'PO', name: 'Product Owners' },
];

export const INITIAL_EMPLOYEES: Omit<Employee, 'id' | 'createdAt'>[] = [
  // DEV Employees
  { name: 'Omar rezk', departmentId: 'DEV', isActive: true },
  { name: 'Mahmoud Eid', departmentId: 'DEV', isActive: true },
  { name: 'Ahmed Hider', departmentId: 'DEV', isActive: true },
  { name: 'Hossam', departmentId: 'DEV', isActive: true },
  { name: 'Hazem mohamed', departmentId: 'DEV', isActive: true },
  { name: 'Hazem Khalil', departmentId: 'DEV', isActive: true },
  { name: 'Mostafa Rady', departmentId: 'DEV', isActive: true },
  { name: 'Tarek Jammal', departmentId: 'DEV', isActive: true },
  { name: 'Shady Barkat', departmentId: 'DEV', isActive: true },
  { name: 'Mohamed Shrief', departmentId: 'DEV', isActive: true },
  { name: 'Manar Zain', departmentId: 'DEV', isActive: true },
  { name: 'Adham Elassal', departmentId: 'DEV', isActive: true },
  { name: 'mohamed Sharif', departmentId: 'DEV', isActive: true },

  // QA Employees
  { name: 'Ahmed Helmy', departmentId: 'QA', isActive: true },
  { name: 'Mohamed Ashraf', departmentId: 'QA', isActive: true },
  { name: 'Ahmed shiha', departmentId: 'QA', isActive: true },
  { name: 'Shimaa Nabil', departmentId: 'QA', isActive: true },
  { name: 'Naglaa', departmentId: 'QA', isActive: true },
  { name: 'Mostafa Elfooly', departmentId: 'QA', isActive: true },

  // PO Employees
  { name: 'ahmed zaghloul', departmentId: 'PO', isActive: true },
  { name: 'mohamed omar', departmentId: 'PO', isActive: true },
  { name: 'mohmoud Elsayed', departmentId: 'PO', isActive: true },
];

export const INITIAL_KPIS: Omit<KPI, 'id'>[] = [
  // DEV KPIs (Total = 100)
  { departmentId: 'DEV', name: 'Attendance & Punctuality KPI', evaluatorRole: 'HR', weight: 15 },
  { departmentId: 'DEV', name: 'Operating on Odoo', evaluatorRole: 'PO', weight: 15 },
  { departmentId: 'DEV', name: 'Attitude', evaluatorRole: 'PO/Team Lead', weight: 10 },
  { departmentId: 'DEV', name: 'Business Understanding', evaluatorRole: 'PO/CTO', weight: 10 },
  { departmentId: 'DEV', name: 'Being On Call', evaluatorRole: 'PO', weight: 10 },
  { departmentId: 'DEV', name: 'Ability to Learn Updates', evaluatorRole: 'CTO', weight: 5 },
  { departmentId: 'DEV', name: 'One Time Delivery', evaluatorRole: 'OM', weight: 20 },
  { departmentId: 'DEV', name: 'Closing Report', evaluatorRole: 'OM', weight: 5 },
  { departmentId: 'DEV', name: 'Using AI', evaluatorRole: 'CTO', weight: 10 },

  // QA KPIs (Total = 100)
  { departmentId: 'QA', name: 'Attendance & Punctuality KPI', evaluatorRole: 'HR', weight: 15 },
  { departmentId: 'QA', name: 'Operating on Odoo', evaluatorRole: 'PO', weight: 15 },
  { departmentId: 'QA', name: 'Attitude', evaluatorRole: 'PO', weight: 10 },
  { departmentId: 'QA', name: 'Business Understanding', evaluatorRole: 'PO/CTO', weight: 10 },
  { departmentId: 'QA', name: 'Being On Call', evaluatorRole: 'PO', weight: 10 },
  { departmentId: 'QA', name: 'Ability to Learn Updates', evaluatorRole: 'CTO', weight: 5 },
  { departmentId: 'QA', name: 'Effective Bugs', evaluatorRole: 'OM', weight: 15 },
  { departmentId: 'QA', name: 'Closing Reports', evaluatorRole: 'OM', weight: 5 },
  { departmentId: 'QA', name: 'Follow up & Closing Bugs', evaluatorRole: 'OM', weight: 15 },

  // PO KPIs (Total = 100)
  { departmentId: 'PO', name: 'Attendance & Punctuality KPI', evaluatorRole: 'HR', weight: 15 },
  { departmentId: 'PO', name: 'Operating on Odoo', evaluatorRole: 'CTO/OM', weight: 10 },
  { departmentId: 'PO', name: 'Business Understanding', evaluatorRole: 'CTO', weight: 10 },
  { departmentId: 'PO', name: 'Being On Call', evaluatorRole: 'OM', weight: 5 },
  { departmentId: 'PO', name: 'Ability to Learn Updates', evaluatorRole: 'CTO', weight: 5 },
  { departmentId: 'PO', name: 'One Time Delivery', evaluatorRole: 'CTO/OM', weight: 20 },
  { departmentId: 'PO', name: 'Client Satisfaction For POs', evaluatorRole: 'OM', weight: 10 },
  { departmentId: 'PO', name: 'daily rotine to devs', evaluatorRole: 'OM', weight: 5 },
  { departmentId: 'PO', name: 'daily rotine to testers', evaluatorRole: 'OM', weight: 5 },
  { departmentId: 'PO', name: 'Quality Of Traning', evaluatorRole: 'CTO', weight: 5 },
  { departmentId: 'PO', name: 'Workflow', evaluatorRole: 'OM', weight: 5 },
  { departmentId: 'PO', name: 'Presentation Skill', evaluatorRole: 'CTO', weight: 5 },
];
