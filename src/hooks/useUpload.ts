'use client';

import { useState } from 'react';

interface UploadResult {
  url: string;
  name: string;
  id: string;
}

export function useUpload(folderPath: string[]) {
  const [isUploading, setIsUploading] = useState(false);

  async function startUpload(files: File[]): Promise<UploadResult[]> {
    setIsUploading(true);
    try {
      const results: UploadResult[] = [];
      for (const file of files) {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('folderPath', JSON.stringify(folderPath));

        const res = await fetch('/api/upload', { method: 'POST', body: formData });
        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.error || 'Upload failed');
        }
        results.push(await res.json());
      }
      return results;
    } finally {
      setIsUploading(false);
    }
  }

  return { startUpload, isUploading };
}
