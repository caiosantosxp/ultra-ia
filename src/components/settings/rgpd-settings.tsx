'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { useT } from '@/lib/i18n/use-t';

export function RgpdSettings() {
  const t = useT();
  const router = useRouter();
  const [isExporting, setIsExporting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  async function handleExport() {
    setIsExporting(true);
    try {
      const response = await fetch('/api/user/data-export');
      if (response.status === 401) {
        router.push('/login');
        return;
      }
      if (!response.ok) throw new Error('Export failed');

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'ultra-ia-data-export.json';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast.success(t.settings.exportSuccess);
    } catch {
      toast.error(t.settings.exportError);
    } finally {
      setIsExporting(false);
    }
  }

  async function handleDelete() {
    setIsDeleting(true);
    try {
      const response = await fetch('/api/user/data-delete', { method: 'DELETE' });
      if (!response.ok) throw new Error('Delete failed');

      setIsDeleteDialogOpen(false);
      toast.success(t.settings.deleteSuccess);
      router.push('/');
    } catch {
      toast.error(t.settings.deleteError);
      setIsDeleting(false);
      setIsDeleteDialogOpen(false);
    }
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>{t.settings.privacyTitle}</CardTitle>
          <CardDescription>{t.settings.privacyDesc}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Export Section */}
          <div className="space-y-2">
            <h3 className="text-sm font-medium">{t.settings.exportTitle}</h3>
            <p className="text-sm text-muted-foreground">{t.settings.exportDesc}</p>
            <Button variant="outline" onClick={handleExport} disabled={isExporting}>
              {isExporting ? t.settings.exporting : t.settings.exportButton}
            </Button>
          </div>

          <Separator />

          {/* Danger Zone */}
          <div className="space-y-2 rounded-lg border border-destructive/50 p-4">
            <h3 className="text-sm font-medium text-destructive">{t.settings.dangerZone}</h3>
            <p className="text-sm text-muted-foreground">{t.settings.deleteDesc}</p>
            <Button
              variant="destructive"
              onClick={() => setIsDeleteDialogOpen(true)}
              disabled={isDeleting}
            >
              {t.settings.deleteButton}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={(open) => !isDeleting && setIsDeleteDialogOpen(open)}>
        <DialogContent showCloseButton={false}>
          <DialogHeader>
            <DialogTitle>{t.settings.deleteDialogTitle}</DialogTitle>
            <DialogDescription>{t.settings.deleteDialogDesc}</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsDeleteDialogOpen(false)}
              disabled={isDeleting}
            >
              {t.settings.cancel}
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={isDeleting}>
              {isDeleting ? t.settings.deleting : t.settings.deleteConfirm}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
