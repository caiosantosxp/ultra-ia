'use client';

import { useRef, useState, useCallback, useMemo } from 'react';
import { Trash2, UploadIcon, CalendarDays, FileText } from 'lucide-react';
import { toast } from 'sonner';
import { format, startOfMonth, subMonths, startOfYear } from 'date-fns';
import type { DateRange } from 'react-day-picker';

import { uploadKnowledgeDocument, deleteKnowledgeDocument } from '@/actions/admin-actions';
import { Button, buttonVariants } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import { useT } from '@/lib/i18n/use-t';

type KnowledgeDoc = {
  id: string;
  fileName: string;
  fileUrl: string;
  mimeType: string;
  fileSize: number;
  createdAt: Date;
};

type PeriodFilter = 'all' | 'this_month' | 'last_month' | 'last_3_months' | 'last_6_months' | 'this_year' | 'custom';

const ACCEPTED_TYPES = [
  'application/pdf',
  'text/plain',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
];
const MAX_SIZE = 5 * 1024 * 1024;

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} Ko`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} Mo`;
}

function getFileTypeBadge(mimeType: string) {
  if (mimeType === 'application/pdf')
    return { label: 'PDF', cls: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' };
  if (mimeType === 'text/plain')
    return { label: 'TXT', cls: 'bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400' };
  return { label: 'DOC', cls: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' };
}

function getPeriodStart(period: PeriodFilter): Date | null {
  const now = new Date();
  switch (period) {
    case 'this_month': return startOfMonth(now);
    case 'last_month': return startOfMonth(subMonths(now, 1));
    case 'last_3_months': return subMonths(now, 3);
    case 'last_6_months': return subMonths(now, 6);
    case 'this_year': return startOfYear(now);
    default: return null;
  }
}

interface KnowledgeUploadProps {
  specialistId: string;
  initialDocuments: KnowledgeDoc[];
}

export function KnowledgeUpload({ specialistId, initialDocuments }: KnowledgeUploadProps) {
  const t = useT();
  const ku = t.knowledgeUpload;
  const [documents, setDocuments] = useState<KnowledgeDoc[]>(initialDocuments);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  // Date filter state
  const [open, setOpen] = useState(false);
  const [period, setPeriod] = useState<PeriodFilter>('all');
  const [range, setRange] = useState<DateRange | undefined>(undefined);

  const filtered = useMemo(() => {
    if (period === 'all') return documents;
    if (period === 'custom') {
      return documents.filter((d) => {
        const date = new Date(d.createdAt);
        if (range?.from && date < range.from) return false;
        if (range?.to && date > range.to) return false;
        return true;
      });
    }
    const start = getPeriodStart(period);
    if (!start) return documents;
    if (period === 'last_month') {
      const end = startOfMonth(new Date());
      return documents.filter((d) => {
        const date = new Date(d.createdAt);
        return date >= start && date < end;
      });
    }
    return documents.filter((d) => new Date(d.createdAt) >= start);
  }, [documents, period, range]);

  const totalSize = useMemo(() => filtered.reduce((sum, d) => sum + d.fileSize, 0), [filtered]);

  const periodOptions: { value: PeriodFilter; label: string }[] = [
    { value: 'all', label: ku.periodAll },
    { value: 'this_month', label: ku.periodThisMonth },
    { value: 'last_month', label: ku.periodLastMonth },
    { value: 'last_3_months', label: ku.periodLast3Months },
    { value: 'last_6_months', label: ku.periodLast6Months },
    { value: 'this_year', label: ku.periodThisYear },
  ];

  const periodLabel =
    period === 'custom' && range?.from
      ? `${format(range.from, 'dd/MM/yy')}${range.to ? ` → ${format(range.to, 'dd/MM/yy')}` : ''}`
      : (periodOptions.find((o) => o.value === period)?.label ?? ku.periodAll);

  function validateFile(file: File): string | null {
    if (!ACCEPTED_TYPES.includes(file.type)) return ku.acceptedFormats;
    if (file.size > MAX_SIZE) return ku.maxSize;
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
        {
          id: result.data!.id,
          fileName: result.data!.fileName,
          fileUrl: result.data!.fileUrl,
          mimeType: file.type,
          fileSize: file.size,
          createdAt: result.data!.createdAt,
        },
        ...prev,
      ]);
      toast.success(ku.uploadSuccess);
    } else {
      toast.error(result.error?.message ?? ku.uploadFailed);
    }
    setUploading(false);
    setProgress(0);
    if (inputRef.current) inputRef.current.value = '';
  }

  async function handleDelete(docId: string) {
    if (!confirm(ku.deleteConfirm)) return;
    const result = await deleteKnowledgeDocument(docId);
    if (result.success) {
      setDocuments((prev) => prev.filter((d) => d.id !== docId));
      toast.success(ku.deleteSuccess);
    } else {
      toast.error(result.error?.message ?? ku.deleteFailed);
    }
  }

  const applyCustomRange = useCallback(() => {
    if (!range?.from) return;
    setPeriod('custom');
    setOpen(false);
  }, [range]);

  const clearFilter = useCallback(() => {
    setRange(undefined);
    setPeriod('all');
    setOpen(false);
  }, []);

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex items-center gap-3 flex-wrap">
        <input
          ref={inputRef}
          type="file"
          accept=".pdf,.txt,.docx"
          onChange={handleFileChange}
          disabled={uploading}
          className="hidden"
          id={`knowledge-upload-${specialistId}`}
          aria-label={ku.selectFile}
        />
        <Button
          type="button"
          variant="outline"
          disabled={uploading}
          className="gap-2"
          onClick={() => inputRef.current?.click()}
          aria-label={ku.uploadDocumentAria}
        >
          <UploadIcon className="h-4 w-4" />
          {uploading ? ku.uploading : ku.addDocument}
        </Button>
        <span className="text-xs text-muted-foreground">{ku.formats}</span>

        {/* Date filter */}
        <div className="ml-auto">
          <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger
              className={cn(buttonVariants({ variant: 'outline', size: 'sm' }), 'h-8 text-sm gap-1.5')}
            >
              <CalendarDays className="h-3.5 w-3.5" />
              {periodLabel}
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="end">
              <div className="p-2 border-b space-y-0.5">
                {periodOptions.map((o) => (
                  <button
                    key={o.value}
                    onClick={() => { setPeriod(o.value); setRange(undefined); setOpen(false); }}
                    className={`w-full text-left px-3 py-1.5 rounded text-sm transition-colors ${
                      period === o.value
                        ? 'bg-primary text-primary-foreground'
                        : 'hover:bg-muted text-foreground'
                    }`}
                  >
                    {o.label}
                  </button>
                ))}
              </div>
              <Calendar
                mode="range"
                selected={range}
                onSelect={setRange}
                numberOfMonths={2}
                disabled={{ after: new Date() }}
              />
              <div className="flex items-center justify-end gap-2 p-3 border-t">
                <Button variant="ghost" size="sm" onClick={clearFilter}>
                  {ku.periodClear}
                </Button>
                <Button size="sm" onClick={applyCustomRange} disabled={!range?.from}>
                  {ku.periodApply}
                </Button>
              </div>
            </PopoverContent>
          </Popover>
        </div>
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

      {/* Stats */}
      {documents.length > 0 && (
        <p className="text-xs text-muted-foreground">
          {filtered.length === documents.length
            ? `${documents.length} ${ku.documentsCount} · ${formatBytes(totalSize)}`
            : `${filtered.length} / ${documents.length} ${ku.documentsCount} · ${formatBytes(totalSize)}`}
        </p>
      )}

      {/* Documents list */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed py-14 text-center">
          <FileText className="h-8 w-8 text-muted-foreground/40" />
          <p className="text-sm text-muted-foreground">{ku.noDocuments}</p>
        </div>
      ) : (
        <ul className="divide-y rounded-lg border overflow-hidden">
          {filtered.map((doc) => {
            const badge = getFileTypeBadge(doc.mimeType);
            return (
              <li
                key={doc.id}
                className="flex items-center gap-3 px-4 py-3 bg-card hover:bg-muted/40 transition-colors"
              >
                <span
                  className={cn(
                    'shrink-0 rounded px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide',
                    badge.cls,
                  )}
                >
                  {badge.label}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium truncate">{doc.fileName}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatBytes(doc.fileSize)}
                    {' · '}
                    {new Date(doc.createdAt).toLocaleString(t.dateLocale, {
                      day: '2-digit',
                      month: '2-digit',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 shrink-0 text-muted-foreground hover:text-destructive"
                  onClick={() => handleDelete(doc.id)}
                  aria-label={`${ku.deleteAria} ${doc.fileName}`}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
