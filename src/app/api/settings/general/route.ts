import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireAuth, requireRole } from '@/lib/apiAuth';

const defaultGeneral = {
  ownerName: '',
  ownerEmail: '',
  ownerTitle: '',
  companyName: '',
  companyAddress: '',
  companyDescription: '',
  companyTin: '',
  orgAddress: '',
  orgPhone: '',
  defaultCurrency: 'PHP',
  dateFormat: 'MM/DD/YYYY',
  timezone: 'Asia/Manila',
  defaultPaymentDueDay: 1,
  penaltyRatePerMonth: 3,
};

export async function GET(request: NextRequest) {
  const authError = await requireAuth();
  if (authError instanceof NextResponse) return authError;

  const setting = await prisma.setting.findUnique({ where: { key: 'general' } });
  if (!setting) return NextResponse.json(defaultGeneral);
  return NextResponse.json(JSON.parse(setting.value));
}

export async function PUT(request: NextRequest) {
  const authError = await requireRole('admin');
  if (authError instanceof NextResponse) return authError;

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  // Merge with existing settings so partial updates don't wipe other fields
  const existing = await prisma.setting.findUnique({ where: { key: 'general' } });
  const current = existing ? JSON.parse(existing.value) : defaultGeneral;
  const merged = { ...current, ...body };

  const setting = await prisma.setting.upsert({
    where: { key: 'general' },
    create: { key: 'general', value: JSON.stringify(merged) },
    update: { value: JSON.stringify(merged) },
  });
  return NextResponse.json(JSON.parse(setting.value));
}
