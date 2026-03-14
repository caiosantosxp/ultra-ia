import { Mic } from 'lucide-react';

export default function VozPage() {
  return (
    <div className="space-y-4 max-w-3xl">
      <div>
        <h2 className="text-lg font-semibold">Voix</h2>
        <p className="text-sm text-muted-foreground">
          Configurez la voix et le ton de votre expert IA
        </p>
      </div>
      <div className="flex h-64 items-center justify-center rounded-xl border border-dashed bg-card">
        <div className="flex flex-col items-center gap-3 text-muted-foreground">
          <Mic className="h-10 w-10" />
          <p className="text-sm font-medium">Configuration de voix</p>
          <p className="text-xs">Disponible prochainement</p>
        </div>
      </div>
    </div>
  );
}
