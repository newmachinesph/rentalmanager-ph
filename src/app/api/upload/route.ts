import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/apiAuth';
import { uploadToR2, isValidFolderPath } from '@/lib/r2';

const MAX_SIZE = 16 * 1024 * 1024; // 16 MB
const ALLOWED_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'application/pdf',
]);

export async function POST(req: NextRequest) {
  const auth = await requireRole('admin', 'manager');
  if (auth instanceof NextResponse) return auth;

  const formData = await req.formData();
  const file = formData.get('file') as File | null;
  const folderPathRaw = formData.get('folderPath') as string | null;

  if (!file) {
    return NextResponse.json({ error: 'No file provided' }, { status: 400 });
  }

  let folderPath: string[];
  try {
    folderPath = JSON.parse(folderPathRaw || '[]');
  } catch {
    return NextResponse.json({ error: 'Invalid folderPath' }, { status: 400 });
  }
  if (!isValidFolderPath(folderPath)) {
    return NextResponse.json({ error: 'Invalid folder path' }, { status: 400 });
  }
  if (file.size > MAX_SIZE) {
    return NextResponse.json({ error: 'File too large (max 16MB)' }, { status: 400 });
  }
  if (!ALLOWED_TYPES.has(file.type)) {
    return NextResponse.json({ error: 'File type not allowed' }, { status: 400 });
  }

  try {
    const buffer = Buffer.from(await file.arrayBuffer());
    const result = await uploadToR2(buffer, file.name, file.type, folderPath);
    return NextResponse.json(result);
  } catch (err) {
    console.error('Upload error:', err);
    const message = err instanceof Error ? err.message : 'Upload failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
