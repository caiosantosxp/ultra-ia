import { promises as fs } from 'fs';
import path from 'path';

const UPLOAD_DIR = path.join(process.cwd(), 'public', 'uploads', 'knowledge');

export async function saveFile(buffer: Buffer, fileName: string): Promise<string> {
  await fs.mkdir(UPLOAD_DIR, { recursive: true });

  const uniqueName = `${Date.now()}-${fileName.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
  const filePath = path.join(UPLOAD_DIR, uniqueName);
  await fs.writeFile(filePath, buffer);

  return `/uploads/knowledge/${uniqueName}`;
}

export async function deleteFile(fileUrl: string): Promise<void> {
  // Validate path stays within uploads directory (prevent path traversal)
  if (!fileUrl.startsWith('/uploads/knowledge/')) return;
  const fileName = path.basename(fileUrl);
  const filePath = path.join(UPLOAD_DIR, fileName);
  if (!filePath.startsWith(UPLOAD_DIR)) return;
  try {
    await fs.unlink(filePath);
  } catch {
    // File may not exist, ignore error
  }
}
