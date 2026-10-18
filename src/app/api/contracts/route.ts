import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireAuth, requireRole } from '@/lib/apiAuth';
import { generateContractHtml, computeLeaseTerm, formatDateLong } from '@/lib/contractTemplate';

const INCLUDE_LEASE = {
  lease: {
    include: {
      property: { select: { id: true, name: true, address: true, city: true, province: true, barangay: true } },
      unit: { select: { id: true, name: true } },
      tenant: { select: { id: true, firstName: true, lastName: true, email: true, phone: true } },
    },
  },
};

export async function GET(request: NextRequest) {
  const authError = await requireAuth();
  if (authError instanceof NextResponse) return authError;

  const { searchParams } = new URL(request.url);
  const status = searchParams.get('status');
  const leaseId = searchParams.get('leaseId');

  const where: Record<string, unknown> = {};
  if (status && status !== 'All') where.status = status;
  if (leaseId) where.leaseId = leaseId;

  try {
    const data = await prisma.contract.findMany({
      where,
      include: INCLUDE_LEASE,
      orderBy: { createdAt: 'desc' },
    });
    return NextResponse.json({ data, total: data.length });
  } catch (error) {
    console.error('Failed to fetch contracts:', error);
    return NextResponse.json({ error: 'Failed to fetch contracts' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const authError = await requireRole('admin', 'manager');
  if (authError instanceof NextResponse) return authError;

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  if (!body.leaseId) {
    return NextResponse.json({ error: 'leaseId is required' }, { status: 400 });
  }

  try {
    // Fetch lease with relations
    const lease = await prisma.lease.findUnique({
      where: { id: body.leaseId },
      include: {
        property: true,
        unit: true,
        tenant: true,
      },
    });

    if (!lease) {
      return NextResponse.json({ error: 'Lease not found' }, { status: 404 });
    }

    // Fetch general settings for lessor defaults
    const generalSetting = await prisma.setting.findUnique({ where: { key: 'general' } });
    const settings = generalSetting ? JSON.parse(generalSetting.value) : {};

    const penaltyRate: number = settings.penaltyRatePerMonth ?? 3;
    const tenantName = `${lease.tenant.firstName} ${lease.tenant.lastName}`;
    const propertyAddr = [lease.property.address, lease.property.barangay, lease.property.city, lease.property.province]
      .filter(Boolean)
      .join(', ');

    const content = generateContractHtml({
      contractDate: body.contractDate || formatDateLong(new Date().toISOString().split('T')[0]),
      contractLocation: body.contractLocation || lease.property.city || 'Metro Manila',
      lessorCompany: body.lessorCompany || settings.companyName || 'Property Management Company',
      lessorDescription: body.lessorDescription || settings.companyDescription || 'a duly organized entity existing under the laws of the Philippines',
      lessorAddress: body.lessorAddress || settings.companyAddress || lease.property.address || '',
      lessorRepName: body.lessorRepName || settings.ownerName || '',
      lessorRepTitle: body.lessorRepTitle || settings.ownerTitle || 'Property Owner/Manager',
      lesseeName: body.lesseeName || tenantName,
      lesseeAddress: body.lesseeAddress || lease.tenant.email || '',
      propertyName: body.propertyName || lease.property.name,
      propertyFullAddress: body.propertyFullAddress || propertyAddr,
      unitName: body.unitName || lease.unit?.name || 'Unit',
      purpose: body.purpose || 'Residential',
      startDate: body.startDate || formatDateLong(lease.startDate),
      endDate: body.endDate || formatDateLong(lease.endDate),
      leaseTerm: body.leaseTerm || computeLeaseTerm(lease.startDate, lease.endDate),
      monthlyRent: body.monthlyRent ? Number(body.monthlyRent) : lease.monthlyRent,
      securityDeposit: body.securityDeposit ? Number(body.securityDeposit) : lease.securityDeposit,
      advancePayment: body.advancePayment ? Number(body.advancePayment) : lease.advancePayment,
      paymentDueDay: body.paymentDueDay ? Number(body.paymentDueDay) : lease.paymentDueDay,
      penaltyRate: body.penaltyRate ? Number(body.penaltyRate) : penaltyRate,
      witnessName1: body.witnessName1 || '',
      witnessName2: body.witnessName2 || '',
      lessorTin: body.lessorTin || settings.companyTin || '',
    });

    const contract = await prisma.contract.create({
      data: {
        leaseId: body.leaseId,
        content,
        status: 'Draft',
        notes: body.notes || '',
      },
      include: INCLUDE_LEASE,
    });

    return NextResponse.json(contract, { status: 201 });
  } catch (error) {
    console.error('Failed to create contract:', error);
    return NextResponse.json({ error: 'Failed to create contract' }, { status: 500 });
  }
}
