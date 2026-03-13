import { Skeleton } from '@/components/ui/skeleton';

export function ConversationListSkeleton() {
  return (
    <ul className="space-y-1 px-2 py-1" aria-label="Carregando conversas" aria-busy="true">
      {Array.from({ length: 5 }).map((_, i) => (
        <li key={i} className="flex items-start gap-2 rounded-md px-2 py-2">
          <Skeleton className="mt-0.5 h-4 w-4 shrink-0" />
          <div className="min-w-0 flex-1 space-y-1">
            <Skeleton className={`h-4 ${['w-3/4', 'w-full', 'w-2/3', 'w-5/6', 'w-4/5'][i]}`} />
            <Skeleton className="h-3 w-1/3" />
          </div>
        </li>
      ))}
    </ul>
  );
}
