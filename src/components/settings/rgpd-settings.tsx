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

export function RgpdSettings() {
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

      toast.success('Vos données ont été téléchargées');
    } catch {
      toast.error("Erreur lors de l'export. Veuillez réessayer.");
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
      // Toast shown before push so it persists in sessionStorage for the landing page
      toast.success('Votre compte a été supprimé');
      router.push('/');
    } catch {
      toast.error('Erreur lors de la suppression. Veuillez réessayer.');
      setIsDeleting(false);
      setIsDeleteDialogOpen(false);
    }
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Données &amp; Confidentialité</CardTitle>
          <CardDescription>
            Gérez vos données personnelles conformément au RGPD.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Export Section */}
          <div className="space-y-2">
            <h3 className="text-sm font-medium">Exporter mes données</h3>
            <p className="text-sm text-muted-foreground">
              Téléchargez une copie de toutes vos données personnelles, conversations et abonnements.
            </p>
            <Button variant="outline" onClick={handleExport} disabled={isExporting}>
              {isExporting ? 'Exportation...' : 'Télécharger mes données'}
            </Button>
          </div>

          <Separator />

          {/* Danger Zone */}
          <div className="space-y-2 rounded-lg border border-destructive/50 p-4">
            <h3 className="text-sm font-medium text-destructive">Zone de danger</h3>
            <p className="text-sm text-muted-foreground">
              La suppression de votre compte est irréversible. Toutes vos données, conversations
              et abonnements seront définitivement supprimés.
            </p>
            <Button
              variant="destructive"
              onClick={() => setIsDeleteDialogOpen(true)}
              disabled={isDeleting}
            >
              Supprimer mon compte
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={(open) => !isDeleting && setIsDeleteDialogOpen(open)}>
        <DialogContent showCloseButton={false}>
          <DialogHeader>
            <DialogTitle>Supprimer définitivement votre compte ?</DialogTitle>
            <DialogDescription>
              Cette action est irréversible. Toutes vos données seront définitivement supprimées,
              incluant votre profil, toutes vos conversations et vos abonnements actifs.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsDeleteDialogOpen(false)}
              disabled={isDeleting}
            >
              Annuler
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={isDeleting}>
              {isDeleting ? 'Suppression...' : 'Supprimer définitivement'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
