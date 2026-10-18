import { randomUUID } from 'crypto';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';

/** Validate that a folder path contains only safe folder names (alphanumeric, spaces, hyphens, underscores) */
export function isValidFolderPath(folderPath: string[]): boolean {
  if (!Array.isArray(folderPath) || folderPath.length === 0 || folderPath.length > 5) return false;
  return folderPath.every((segment) => /^[a-zA-Z0-9 _-]+$/.test(segment) && segment.length <= 100);
}

const BUCKET = process.env.R2_BUCKET!;
// Public base URL for reads (R2 custom domain or r2.dev). Uploaded objects are world-readable.
const PUBLIC_URL = process.env.R2_PUBLIC_URL!;

let client: S3Client | null = null;
function getClient(): S3Client {
  if (client) return client;
  client = new S3Client({
    region: 'auto',
    endpoint: process.env.R2_ENDPOINT!,
    credentials: {
      accessKeyId: process.env.R2_ACCESS_KEY_ID!,
      secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
    },
  });
  return client;
}

/** Build the object key: RentalManager/<folderPath...>/<uuid>-<fileName>. UUID prevents clobbering same-named files. */
function buildKey(fileName: string, folderPath: string[]): string {
  const safeName = fileName.replace(/[^a-zA-Z0-9._-]/g, '_');
  return ['RentalManager', ...folderPath, `${randomUUID()}-${safeName}`].join('/');
}

export async function uploadToR2(
  fileBuffer: Buffer,
  fileName: string,
  mimeType: string,
  folderPath: string[]
): Promise<{ url: string; name: string; id: string }> {
  const key = buildKey(fileName, folderPath);

  await getClient().send(
    new PutObjectCommand({
      Bucket: BUCKET,
      Key: key,
      Body: fileBuffer,
      ContentType: mimeType,
    })
  );

  return {
    url: `${PUBLIC_URL.replace(/\/$/, '')}/${key}`,
    name: fileName,
    id: key,
  };
}
