export interface Property {
  id: string;
  name: string;
  type: PropertyType;
  address: string;
  city: string;
  province: string;
  zipCode: string;
  barangay: string;
  units: Unit[];
  image?: string;
  monthlyTarget: number;
  createdAt: string;
}

export type PropertyType =
  | 'Apartment'
  | 'Condominium'
  | 'Townhouse'
  | 'House'
  | 'Commercial'
  | 'Boarding House'
  | 'Dormitory';

export interface Unit {
  id: string;
  propertyId: string;
  name: string;
  floor?: string;
  bedrooms: number;
  bathrooms: number;
  areaSqm: number;
  monthlyRent: number;
  status: UnitStatus;
}

export type UnitStatus = 'Vacant' | 'Occupied' | 'Under Maintenance' | 'Reserved';

export interface Tenant {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  emergencyContact: string;
  emergencyPhone: string;
  idType: string;
  idNumber: string;
  occupation: string;
  employer: string;
  avatar?: string;
  notes: string;
  dateOfBirth: string;
  tenantType: 'Person' | 'Company';
  createdAt: string;
}

export interface Lease {
  id: string;
  propertyId: string;
  unitId: string;
  tenantId: string;
  startDate: string;
  endDate: string;
  monthlyRent: number;
  securityDeposit: number;
  advancePayment: number;
  paymentDueDay: number;
  status: LeaseStatus;
  notes: string;
  createdAt: string;
}

export type LeaseStatus = 'Active' | 'Expired' | 'Terminated' | 'Pending';

export interface IncomeRecord {
  id: string;
  propertyId: string;
  unitId: string | null;
  tenantId: string | null;
  leaseId: string | null;
  category: IncomeCategory;
  amount: number;
  dueDate: string;
  paidDate: string | null;
  paymentMethod: PaymentMethod | null;
  status: PaymentStatus;
  referenceNo: string;
  notes: string;
  createdAt: string;
  property?: { id: string; name: string; address: string };
  unit?: { id: string; name: string };
  tenant?: { id: string; firstName: string; lastName: string };
  lease?: { id: string };
}

export type IncomeCategory =
  | 'Rent'
  | 'Parking'
  | 'Utilities Reimbursement'
  | 'Association Dues'
  | 'Late Fee'
  | 'Security Deposit'
  | 'Advance Payment'
  | 'Other Income';

export type PaymentMethod =
  | 'Cash'
  | 'Bank Transfer'
  | 'GCash'
  | 'Maya'
  | 'Check';

export type PaymentStatus = 'Paid' | 'Partially Paid' | 'Unpaid' | 'Overdue' | 'Pending';

export interface ExpenseRecord {
  id: string;
  propertyId: string;
  unitId: string | null;
  category: ExpenseCategory;
  amount: number;
  date: string;
  vendor: string;
  description: string;
  receiptUrl?: string;
  notes: string;
  createdAt: string;
  property?: { id: string; name: string; address: string };
  unit?: { id: string; name: string };
}

export type ExpenseCategory =
  | 'Maintenance'
  | 'Repairs'
  | 'Utilities'
  | 'Insurance'
  | 'Property Tax'
  | 'HOA/Association Dues'
  | 'Management Fee'
  | 'Cleaning'
  | 'Pest Control'
  | 'Landscaping'
  | 'Legal Fees'
  | 'Advertising'
  | 'Supplies'
  | 'Other Expense';

export interface MaintenanceRequest {
  id: string;
  propertyId: string;
  unitId: string;
  tenantId: string | null;
  title: string;
  description: string;
  category: MaintenanceCategory;
  priority: Priority;
  status: MaintenanceStatus;
  dateReported: string;
  dateCompleted: string | null;
  estimatedCost: number;
  actualCost: number | null;
  contractor: string;
  contractorPhone: string;
  notes: string;
  createdAt: string;
  property?: { id: string; name: string; address: string };
  unit?: { id: string; name: string };
  tenant?: { id: string; firstName: string; lastName: string };
}

export type MaintenanceCategory =
  | 'Plumbing'
  | 'Electrical'
  | 'HVAC'
  | 'Appliance'
  | 'Structural'
  | 'Painting'
  | 'Pest Control'
  | 'Cleaning'
  | 'Security'
  | 'Other';

export type Priority = 'Low' | 'Medium' | 'High' | 'Urgent';
export type MaintenanceStatus = 'Open' | 'In Progress' | 'Completed' | 'On Hold' | 'Cancelled';

export interface ChartDataPoint {
  month: string;
  income: number;
  expenses: number;
  net: number;
}

export type ViewMode = 'table' | 'card';
export type ThemeMode = 'light' | 'dark';

/* ---- Organization sub-entities ---- */

export type ReminderCategory = string;

export interface OrgReminder {
  id: string;
  propertyId: string;
  propertyName?: string;
  dateTime: string;
  category: ReminderCategory;
  notes: string;
  isRecurring: boolean;
  createdAt: string;
}

export interface OrgMileage {
  id: string;
  propertyId?: string;
  propertyName?: string;
  date: string;
  startLocation: string;
  endLocation: string;
  purpose: string;
  distance: number;
  createdAt: string;
}

export interface OrgNote {
  id: string;
  date: string;
  content: string;
  createdAt: string;
}

export interface OrgDocument {
  id: string;
  name: string;
  url: string;
  dateUploaded: string;
  description: string;
}

/* ---- Utility Readings ---- */

export type UtilityType = 'Electricity' | 'Water';

export interface UtilityReading {
  id: string;
  propertyId: string;
  unitId: string | null;
  utilityType: UtilityType;
  readingDate: string;
  previousReading: number;
  currentReading: number;
  consumption: number;
  ratePerUnit: number;
  amount: number;
  isPaid: boolean;
  paidDate: string | null;
  notes: string;
  createdAt: string;
  property?: { id: string; name: string };
  unit?: { id: string; name: string };
}

export interface PropertyOwner {
  id: string;
  name: string;
  email: string;
  phone: string;
}

/* ---- Contracts ---- */

export type ContractStatus = 'Draft' | 'Final' | 'Signed';

export interface Contract {
  id: string;
  leaseId: string;
  content: string;
  status: ContractStatus;
  signedDate: string | null;
  notes: string;
  createdAt: string;
  lease?: Lease & {
    property?: { id: string; name: string; address: string; city: string; province: string; barangay: string };
    unit?: { id: string; name: string };
    tenant?: { id: string; firstName: string; lastName: string; email: string; phone: string };
  };
}
