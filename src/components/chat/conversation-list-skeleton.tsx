export function ConversationListSkeleton() {
  return (
    <ul className="space-y-2 px-3 py-2" aria-label="Carregando conversas" aria-busy="true">
      {Array.from({ length: 6 }).map((_, i) => (
        <li key={i} className="flex items-start gap-2.5 rounded-lg px-3 py-2.5">
          <div className="mt-0.5 h-4 w-4 shrink-0 rounded bg-[#e5e7eb] animate-pulse" />
          <div className="min-w-0 flex-1 space-y-2">
            <div className={`h-4 rounded bg-[#e5e7eb] animate-pulse ${['w-3/4', 'w-full', 'w-2/3', 'w-5/6', 'w-4/5', 'w-3/5'][i]}`} />
            <div className="h-3 w-1/3 rounded bg-[#f3f3f3] animate-pulse" />
          </div>
        </li>
      ))}
    </ul>
  );
}
