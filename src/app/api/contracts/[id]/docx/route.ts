import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireAuth } from '@/lib/apiAuth';
import { contractHtmlToDocx } from '@/lib/contractDocx';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const authError = await requireAuth();
  if (authError instanceof NextResponse) return authError;

  const { id } = await params;

  const contract = await prisma.contract.findUnique({
    where: { id },
    include: {
      lease: {
        include: {
          tenant: true,
          property: true,
          unit: true,
        },
      },
    },
  });

  if (!contract) {
    return NextResponse.json({ error: 'Contract not found' }, { status: 404 });
  }

  try {
    const buffer = await contractHtmlToDocx(contract.content);

    const tenant = contract.lease?.tenant;
    const tenantName = tenant
      ? `${tenant.firstName}-${tenant.lastName}`.replace(/\s+/g, '-')
      : 'contract';
    const fileName = `Contract-${tenantName}-${contract.status}.docx`;

    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'Content-Disposition': `attachment; filename="${fileName}"`,
      },
    });
  } catch (error) {
    console.error('DOCX generation failed:', error);
    return NextResponse.json(
      { error: 'Failed to generate DOCX', details: String(error) },
      { status: 500 },
    );
  }
}
