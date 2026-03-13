'use client';

import { useRef, useState } from 'react';

import { FileIcon, Trash2, UploadIcon } from 'lucide-react';
import { toast } from 'sonner';

import { uploadKnowledgeDocument, deleteKnowledgeDocument } from '@/actions/admin-actions';
import { Button } from '@/components/ui/button';

type KnowledgeDoc = {
  id: string;
  fileName: string;
  fileUrl: string;
  mimeType: string;
  fileSize: number;
};

const ACCEPTED_TYPES = ['application/pdf', 'text/plain',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
const MAX_SIZE = 5 * 1024 * 1024; // 5 MB

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} Ko`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} Mo`;
}

interface KnowledgeUploadProps {
  specialistId: string;
  initialDocuments: KnowledgeDoc[];
}

export function KnowledgeUpload({ specialistId, initialDocuments }: KnowledgeUploadProps) {
  const [documents, setDocuments] = useState<KnowledgeDoc[]>(initialDocuments);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  function validateFile(file: File): string | null {
    if (!ACCEPTED_TYPES.includes(file.type)) {
      return 'Formats acceptés: PDF, TXT, DOCX';
    }
    if (file.size > MAX_SIZE) {
      return 'Taille maximum: 5 Mo';
    }
    return null;
  }

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    const error = validateFile(file);
    if (error) {
      toast.error(error);
      if (inputRef.current) inputRef.current.value = '';
      return;
    }

    setUploading(true);
    setProgress(30);

    const formData = new FormData();
    formData.append('file', file);

    setProgress(60);
    const result = await uploadKnowledgeDocument(specialistId, formData);
    setProgress(100);

    if (result.success && result.data) {
      setDocuments((prev) => [
        ...prev,
        {
          id: result.data!.id,
          fileName: result.data!.fileName,
          fileUrl: result.data!.fileUrl,
          mimeType: file.type,
          fileSize: file.size,
        },
      ]);
      toast.success('Document téléchargé avec succès');
    } else {
      toast.error(result.error?.message ?? "Échec de l'upload");
    }

    setUploading(false);
    setProgress(0);
    if (inputRef.current) inputRef.current.value = '';
  }

  async function handleDelete(docId: string) {
    if (!confirm('Supprimer ce document ?')) return;
    const result = await deleteKnowledgeDocument(docId);
    if (result.success) {
      setDocuments((prev) => prev.filter((d) => d.id !== docId));
      toast.success('Document supprimé');
    } else {
      toast.error(result.error?.message ?? 'Échec de la suppression');
    }
  }

  return (
    <div className="space-y-4">
      {/* Upload area */}
      <div className="flex items-center gap-3">
        <input
          ref={inputRef}
          type="file"
          accept=".pdf,.txt,.docx"
          onChange={handleFileChange}
          disabled={uploading}
          className="hidden"
          id={`knowledge-upload-${specialistId}`}
          aria-label="Sélectionner un fichier"
        />
        <label htmlFor={`knowledge-upload-${specialistId}`}>
          <Button
            type="button"
            variant="outline"
            disabled={uploading}
            className="gap-2 cursor-pointer"
            onClick={() => inputRef.current?.click()}
            aria-label="Télécharger un document"
          >
            <UploadIcon className="h-4 w-4" />
            {uploading ? 'Téléchargement...' : 'Ajouter un document'}
          </Button>
        </label>
        <span className="text-xs text-muted-foreground">PDF, TXT, DOCX — max 5 Mo</span>
      </div>

      {/* Progress bar */}
      {uploading && (
        <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
          <div
            className="h-full bg-primary transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      )}

      {/* Documents list */}
      {documents.length === 0 ? (
        <p className="text-sm text-muted-foreground py-3">
          Aucun document. Ajoutez des fichiers pour enrichir la base de connaissances.
        </p>
      ) : (
        <ul className="space-y-2">
          {documents.map((doc) => (
            <li
              key={doc.id}
              className="flex items-center justify-between gap-3 rounded-md border p-3"
            >
              <div className="flex items-center gap-3 min-w-0">
                <FileIcon className="h-4 w-4 shrink-0 text-muted-foreground" />
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">{doc.fileName}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatBytes(doc.fileSize)}
                  </p>
                </div>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-8 w-8 shrink-0 text-muted-foreground hover:text-destructive"
                onClick={() => handleDelete(doc.id)}
                aria-label={`Supprimer ${doc.fileName}`}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
