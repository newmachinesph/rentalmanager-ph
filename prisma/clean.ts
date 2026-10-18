/**
 * Database cleanup script — deletes ALL data except:
 *   - User table (keeps admin accounts)
 *   - Setting table (keeps app settings)
 *
 * Usage:  npx tsx prisma/clean.ts
 */

import { config } from 'dotenv';
config({ path: '.env.local' });

import { PrismaClient } from '../src/generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

async function clean() {
  console.log('🧹 Cleaning database (keeping Users + Settings)...\n');

  // Delete in reverse dependency order to avoid FK constraint violations
  const tables: { name: string; fn: () => Promise<{ count: number }> }[] = [
    // Children first (depend on parent tables)
    { name: 'Contract',          fn: () => prisma.contract.deleteMany() },
    { name: 'IncomeRecord',      fn: () => prisma.incomeRecord.deleteMany() },
    { name: 'ExpenseRecord',     fn: () => prisma.expenseRecord.deleteMany() },
    { name: 'MaintenanceRequest', fn: () => prisma.maintenanceRequest.deleteMany() },
    { name: 'UtilityReading',    fn: () => prisma.utilityReading.deleteMany() },
    { name: 'Lease',             fn: () => prisma.lease.deleteMany() },
    { name: 'PropertyDocument',  fn: () => prisma.propertyDocument.deleteMany() },
    { name: 'PropertyContact',   fn: () => prisma.propertyContact.deleteMany() },
    { name: 'PropertyMileage',   fn: () => prisma.propertyMileage.deleteMany() },
    { name: 'PropertyNote',      fn: () => prisma.propertyNote.deleteMany() },
    { name: 'OrgReminder',       fn: () => prisma.orgReminder.deleteMany() },
    { name: 'OrgMileage',        fn: () => prisma.orgMileage.deleteMany() },
    { name: 'OrgNote',           fn: () => prisma.orgNote.deleteMany() },
    { name: 'OrgDocument',       fn: () => prisma.orgDocument.deleteMany() },
    // Parents (after children are deleted)
    { name: 'Tenant',            fn: () => prisma.tenant.deleteMany() },
    { name: 'Unit',              fn: () => prisma.unit.deleteMany() },
    { name: 'Property',          fn: () => prisma.property.deleteMany() },
  ];

  for (const t of tables) {
    const result = await t.fn();
    console.log(`  ✓ ${t.name}: deleted ${result.count} rows`);
  }

  // Delete E2E test users — keep only the 2 seeded admin accounts
  const testUsers = await prisma.user.deleteMany({
    where: {
      email: { notIn: ['admin@rentalmanager.ph', 'manager@rentalmanager.ph', 'viewer@rentalmanager.ph'] },
    },
  });
  console.log(`  ✓ User (test accounts): deleted ${testUsers.count} rows`);

  // Reset settings to defaults (E2E CRUD tests may have modified them)
  const defaultSettings: Record<string, string> = {
    general: JSON.stringify({ ownerName: 'Juan Dela Cruz', ownerEmail: 'admin@rentalmanager.ph', ownerTitle: 'Chief Operation Officer', companyName: 'Example Holdings Inc.', companyAddress: '123 Example Street, Quezon City', companyDescription: 'a corporation duly organized and registered with the Philippine Securities Exchange Commission (SEC), existing under and by virtue of the laws of the Philippines', companyTin: '000-000-000-000', defaultCurrency: 'PHP', dateFormat: 'MM/DD/YYYY', timezone: 'Asia/Manila', defaultPaymentDueDay: 1, penaltyRatePerMonth: 3 }),
    notifications: JSON.stringify({ paymentReminders: true, maintenanceAlerts: true, leaseExpiry: true }),
    appearance: JSON.stringify({ theme: 'light' }),
    paymentCategories: JSON.stringify(['Damages', 'Deposit', 'Late Fee', 'Pro-Rata', 'Rent']),
    expenseCategories: JSON.stringify(["Accountant's Fees", 'Advertising', 'Agent Fees', 'Bank Fees', 'Cleaning Fees', 'Ground Rents', 'HOA', 'Insurance', 'Interest', 'Late Fees', 'Legal Fees', 'Maintenance and Repairs', 'Mortgage', 'Other', 'Property Tax', 'Software', 'Telephone', 'Travel', 'Utilities', 'Water']),
  };
  for (const [key, value] of Object.entries(defaultSettings)) {
    await prisma.setting.upsert({
      where: { key },
      update: { value },
      create: { key, value },
    });
  }
  console.log(`  ✓ Settings: reset ${Object.keys(defaultSettings).length} keys to defaults`);

  // Verify users remain
  const users = await prisma.user.findMany({ select: { email: true, role: true } });
  console.log(`\n✅ Done. ${users.length} user(s) preserved:`);
  for (const u of users) {
    console.log(`   - ${u.email} (${u.role})`);
  }

  // Verify settings remain
  const settings = await prisma.setting.findMany({ select: { key: true } });
  console.log(`   ${settings.length} setting(s) preserved: ${settings.map(s => s.key).join(', ')}`);
}

clean()
  .catch((e) => {
    console.error('❌ Cleanup failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
