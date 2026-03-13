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
  const filePath = path.join(process.cwd(), 'public', fileUrl);
  try {
    await fs.unlink(filePath);
  } catch {
    // Fichier peut ne pas exister, ignorer l'erreur
  }
}
