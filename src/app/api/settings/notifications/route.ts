import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireAuth, requireRole } from '@/lib/apiAuth';

const defaultNotifications = {
  paymentReminders: true,
  maintenanceAlerts: true,
  leaseExpiry: true,
};

export async function GET(request: NextRequest) {
  const authError = await requireAuth();
  if (authError instanceof NextResponse) return authError;

  const setting = await prisma.setting.findUnique({ where: { key: 'notifications' } });
  if (!setting) return NextResponse.json(defaultNotifications);
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
  const setting = await prisma.setting.upsert({
    where: { key: 'notifications' },
    create: { key: 'notifications', value: JSON.stringify(body) },
    update: { value: JSON.stringify(body) },
  });
  return NextResponse.json(JSON.parse(setting.value));
}
