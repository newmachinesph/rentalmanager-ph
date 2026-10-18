/**
 * Re-seed ONLY user accounts and settings (no other data touched).
 * Usage: npx tsx prisma/reseed-accounts.ts
 */
import { config } from 'dotenv';
config({ path: '.env.local' });

import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../src/generated/prisma/client';
import bcrypt from 'bcryptjs';

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

async function reseed() {
  console.log('Re-seeding accounts and settings...\n');

  const hash = await bcrypt.hash('admin123', 10);
  const mgrHash = await bcrypt.hash('manager123', 10);
  const viewHash = await bcrypt.hash('viewer123', 10);

  await prisma.user.upsert({ where: { email: 'admin@rentalmanager.ph' }, update: { password: hash, name: 'Admin', role: 'admin' }, create: { email: 'admin@rentalmanager.ph', password: hash, name: 'Admin', role: 'admin' } });
  await prisma.user.upsert({ where: { email: 'manager@rentalmanager.ph' }, update: { password: mgrHash, name: 'Manager', role: 'manager' }, create: { email: 'manager@rentalmanager.ph', password: mgrHash, name: 'Manager', role: 'manager' } });
  await prisma.user.upsert({ where: { email: 'viewer@rentalmanager.ph' }, update: { password: viewHash, name: 'Viewer', role: 'viewer' }, create: { email: 'viewer@rentalmanager.ph', password: viewHash, name: 'Viewer', role: 'viewer' } });
  console.log('  Users: 3 accounts upserted');

  const defaults: Record<string, string> = {
    general: JSON.stringify({ ownerName: 'Juan Dela Cruz', ownerEmail: 'admin@rentalmanager.ph', ownerTitle: 'Chief Operation Officer', companyName: 'Example Holdings Inc.', companyAddress: '123 Example Street, Quezon City', companyDescription: 'a corporation duly organized and registered with the Philippine Securities Exchange Commission (SEC), existing under and by virtue of the laws of the Philippines', companyTin: '000-000-000-000', defaultCurrency: 'PHP', dateFormat: 'MM/DD/YYYY', timezone: 'Asia/Manila', defaultPaymentDueDay: 1, penaltyRatePerMonth: 3 }),
    notifications: JSON.stringify({ paymentReminders: true, maintenanceAlerts: true, leaseExpiry: true }),
    appearance: JSON.stringify({ theme: 'light' }),
    paymentCategories: JSON.stringify(['Damages', 'Deposit', 'Late Fee', 'Pro-Rata', 'Rent']),
    expenseCategories: JSON.stringify(["Accountant's Fees", 'Advertising', 'Agent Fees', 'Bank Fees', 'Cleaning Fees', 'Ground Rents', 'HOA', 'Insurance', 'Interest', 'Late Fees', 'Legal Fees', 'Maintenance and Repairs', 'Mortgage', 'Other', 'Property Tax', 'Software', 'Telephone', 'Travel', 'Utilities', 'Water']),
  };
  for (const [key, value] of Object.entries(defaults)) {
    await prisma.setting.upsert({ where: { key }, update: { value }, create: { key, value } });
  }
  console.log('  Settings: 5 keys reset to defaults');

  console.log('\nDone!');
}

reseed()
  .catch((e) => { console.error('Failed:', e); process.exit(1); })
  .finally(() => prisma.$disconnect());
