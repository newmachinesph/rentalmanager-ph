import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireAuth } from '@/lib/apiAuth';

const defaultPaymentCategories = ['Damages', 'Deposit', 'Late Fee', 'Pro-Rata', 'Rent'];
const defaultExpenseCategories = [
  "Accountant's Fees", 'Advertising', 'Agent Fees', 'Bank Fees', 'Cleaning Fees',
  'Ground Rents', 'HOA', 'Insurance', 'Interest', 'Late Fees',
  'Legal Fees', 'Maintenance and Repairs', 'Mortgage', 'Other', 'Property Tax',
  'Software', 'Telephone', 'Travel', 'Utilities', 'Water',
];

export async function GET(request: NextRequest) {
  const authError = await requireAuth();
  if (authError instanceof NextResponse) return authError;

  const [paymentSetting, expenseSetting] = await Promise.all([
    prisma.setting.findUnique({ where: { key: 'paymentCategories' } }),
    prisma.setting.findUnique({ where: { key: 'expenseCategories' } }),
  ]);

  return NextResponse.json({
    paymentCategories: paymentSetting ? JSON.parse(paymentSetting.value) : defaultPaymentCategories,
    expenseCategories: expenseSetting ? JSON.parse(expenseSetting.value) : defaultExpenseCategories,
  });
}
