import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireAuth, requireRole } from '@/lib/apiAuth';

const defaults: Record<string, string[]> = {
  paymentCategories: ['Damages', 'Deposit', 'Late Fee', 'Pro-Rata', 'Rent'],
  expenseCategories: [
    "Accountant's Fees", 'Advertising', 'Agent Fees', 'Bank Fees', 'Cleaning Fees',
    'Ground Rents', 'HOA', 'Insurance', 'Interest', 'Late Fees',
    'Legal Fees', 'Maintenance and Repairs', 'Mortgage', 'Other', 'Property Tax',
    'Software', 'Telephone', 'Travel', 'Utilities', 'Water',
  ],
  reminderCategories: [
    'Electrical Safety Check', 'Fire Safety Check', 'Gas Safety Check',
    'Insurance Renewal', 'Lease Renewal', 'Other', 'Property Inspection', 'Tax Filing',
  ],
};

export async function GET(request: NextRequest, { params }: { params: Promise<{ name: string }> }) {
  const authError = await requireAuth();
  if (authError instanceof NextResponse) return authError;

  const { name } = await params;
  const setting = await prisma.setting.findUnique({ where: { key: name } });
  if (!setting) {
    return NextResponse.json(defaults[name] || []);
  }
  return NextResponse.json(JSON.parse(setting.value));
}

const ALLOWED_CATEGORY_KEYS = ['paymentCategories', 'expenseCategories', 'reminderCategories'];

export async function PUT(request: NextRequest, { params }: { params: Promise<{ name: string }> }) {
  const authError = await requireRole('admin');
  if (authError instanceof NextResponse) return authError;

  const { name } = await params;

  if (!ALLOWED_CATEGORY_KEYS.includes(name)) {
    return NextResponse.json({ error: 'Invalid category name' }, { status: 400 });
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }
  const setting = await prisma.setting.upsert({
    where: { key: name },
    create: { key: name, value: JSON.stringify(body) },
    update: { value: JSON.stringify(body) },
  });
  return NextResponse.json(JSON.parse(setting.value));
}
