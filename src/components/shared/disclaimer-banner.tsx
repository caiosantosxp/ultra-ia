import { Info } from 'lucide-react';

import { cn } from '@/lib/utils';

interface DisclaimerBannerProps {
  className?: string;
}

export function DisclaimerBanner({ className }: DisclaimerBannerProps) {
  return (
    <div
      role="complementary"
      aria-label="Aviso legal"
      className={cn(
        'flex items-center gap-2 border-t bg-muted/50 px-4 py-2',
        className
      )}
    >
      <Info className="h-3 w-3 shrink-0 text-muted-foreground" aria-hidden="true" />
      <p className="text-xs text-muted-foreground">
        Je suis une IA spécialisée et ne remplace pas un professionnel certifié.
      </p>
    </div>
  );
}
