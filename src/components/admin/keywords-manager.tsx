'use client';

import { useState, useTransition } from 'react';
import { Plus, X } from 'lucide-react';

import { addKeyword, removeKeyword, updateKeywordWeight } from '@/actions/expert-panel-actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

interface Keyword {
  id: string;
  name: string;
  weight: number;
}

interface KeywordsManagerProps {
  specialistId: string;
  initialKeywords: Keyword[];
  maxKeywords?: number;
}

const MULTIPLIERS = [1, 1.25, 1.5, 2, 3] as const;
type Multiplier = (typeof MULTIPLIERS)[number];

const MULTIPLIER_STYLES: Record<string, string> = {
  '1': 'bg-blue-100 text-blue-700 border-blue-200',
  '1.25': 'bg-yellow-100 text-yellow-700 border-yellow-200',
  '1.5': 'bg-orange-100 text-orange-700 border-orange-200',
  '2': 'bg-red-100 text-red-700 border-red-200',
  '3': 'bg-red-200 text-red-800 border-red-300',
};

const MULTIPLIER_EMOJIS: Record<string, string> = {
  '1': '',
  '1.25': '🔥',
  '1.5': '🔥',
  '2': '🔥',
  '3': '🔥',
};

function getStyle(weight: number) {
  return MULTIPLIER_STYLES[String(weight)] ?? MULTIPLIER_STYLES['1'];
}

/** Simple 2-D tag-cloud visualization */
function KeywordCloud({ keywords }: { keywords: Keyword[] }) {
  if (keywords.length === 0) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-sm text-muted-foreground">Adicione palavras-chave para visualizar</p>
      </div>
    );
  }

  return (
    <div className="relative h-full w-full overflow-hidden">
      {/* Decorative dots background */}
      <svg className="absolute inset-0 h-full w-full opacity-10" aria-hidden>
        {Array.from({ length: 300 }, (_, i) => (
          <circle
            key={i}
            cx={`${(i * 137.5) % 100}%`}
            cy={`${(i * 79.3) % 100}%`}
            r="1.5"
            fill="currentColor"
          />
        ))}
      </svg>

      {/* Keywords scattered */}
      <div className="relative h-full w-full">
        {keywords.map((kw, i) => {
          const angle = (i / keywords.length) * 2 * Math.PI;
          const radius = 30 + (i % 3) * 12;
          const x = 50 + radius * Math.cos(angle);
          const y = 50 + radius * Math.sin(angle) * 0.6;
          const fontSize = kw.weight >= 2 ? 'text-sm' : kw.weight >= 1.5 ? 'text-xs' : 'text-[11px]';
          return (
            <span
              key={kw.id}
              className={cn('absolute -translate-x-1/2 -translate-y-1/2 whitespace-nowrap font-medium', fontSize)}
              style={{ left: `${Math.min(90, Math.max(10, x))}%`, top: `${Math.min(85, Math.max(10, y))}%` }}
            >
              {kw.weight > 1 && (
                <span className="mr-0.5 text-[10px] text-orange-500">x{kw.weight} 🔥</span>
              )}
              {kw.name}
            </span>
          );
        })}
      </div>
    </div>
  );
}

export function KeywordsManager({
  specialistId,
  initialKeywords,
  maxKeywords = 50,
}: KeywordsManagerProps) {
  const [keywords, setKeywords] = useState<Keyword[]>(initialKeywords);
  const [newKw, setNewKw] = useState('');
  const [selectedMultiplier, setSelectedMultiplier] = useState<Multiplier>(1);
  const [urlInput, setUrlInput] = useState('');
  const [isPending, startTransition] = useTransition();

  function handleAdd() {
    const name = newKw.trim();
    if (!name || keywords.length >= maxKeywords) return;
    if (keywords.some((k) => k.name.toLowerCase() === name.toLowerCase())) return;

    const optimisticId = `temp-${Date.now()}`;
    setKeywords((prev) => [
      ...prev,
      { id: optimisticId, name, weight: selectedMultiplier },
    ]);
    setNewKw('');

    startTransition(async () => {
      await addKeyword(specialistId, name, selectedMultiplier);
    });
  }

  function handleRemove(id: string, name: string) {
    setKeywords((prev) => prev.filter((k) => k.id !== id));
    startTransition(async () => {
      if (!id.startsWith('temp-')) {
        await removeKeyword(id, specialistId);
      } else {
        // If still temp (race condition), just remove from UI
      }
    });
  }

  function handleWeightChange(id: string, weight: number) {
    setKeywords((prev) =>
      prev.map((k) => (k.id === id ? { ...k, weight } : k))
    );
    if (!id.startsWith('temp-')) {
      startTransition(async () => {
        await updateKeywordWeight(id, weight, specialistId);
      });
    }
  }

  return (
    <div className="flex h-full gap-0 overflow-hidden rounded-xl border bg-card">
      {/* Left panel */}
      <div className="flex w-[360px] shrink-0 flex-col border-r">
        {/* Header */}
        <div className="flex items-start justify-between border-b px-5 py-4">
          <div>
            <h3 className="text-sm font-semibold">Suas palavras-chave</h3>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Gerencie as palavras-chave para geração de leads
            </p>
          </div>
          <span className="text-xs text-muted-foreground">
            {keywords.length}/{maxKeywords}
            <br />
            <span className="text-[10px]">palavras-chave</span>
          </span>
        </div>

        {/* Keyword tags */}
        <div className="flex-1 overflow-y-auto p-4">
          <div className="flex flex-wrap gap-1.5">
            {keywords.map((kw) => (
              <span
                key={kw.id}
                className={cn(
                  'inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-medium transition-colors',
                  getStyle(kw.weight)
                )}
              >
                {kw.weight > 1 && (
                  <span className="text-[10px]">x{kw.weight} {MULTIPLIER_EMOJIS[String(kw.weight)]}</span>
                )}
                {kw.name}
                <button
                  onClick={() => handleRemove(kw.id, kw.name)}
                  className="ml-0.5 rounded-full hover:opacity-70 transition-opacity"
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            ))}
          </div>
        </div>

        {/* URL analyzer */}
        <div className="border-t px-4 py-3 space-y-2">
          <div className="flex gap-2">
            <Input
              placeholder="Analisar uma página web para extrair..."
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              className="h-8 text-xs"
            />
            <Button size="sm" variant="default" className="h-8 px-3 text-xs shrink-0">
              Analisar
            </Button>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-px flex-1 bg-border" />
            <span className="text-xs text-muted-foreground">ou</span>
            <div className="h-px flex-1 bg-border" />
          </div>
          {/* Manual add */}
          <div className="flex gap-2">
            <Input
              placeholder="Adicionar uma palavra-chave..."
              value={newKw}
              onChange={(e) => setNewKw(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
              className="h-8 text-xs"
            />
            <Button
              size="sm"
              onClick={handleAdd}
              disabled={!newKw.trim() || keywords.length >= maxKeywords || isPending}
              className="h-8 px-3 text-xs shrink-0 gap-1"
            >
              <Plus className="h-3 w-3" />
              Adicionar
            </Button>
          </div>
          {/* Multiplier selector */}
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] text-muted-foreground">Multiplicador:</span>
            {MULTIPLIERS.map((m) => (
              <button
                key={m}
                onClick={() => setSelectedMultiplier(m)}
                className={cn(
                  'rounded-md px-2 py-0.5 text-[10px] font-medium border transition-colors',
                  selectedMultiplier === m
                    ? getStyle(m)
                    : 'border-border text-muted-foreground hover:bg-muted'
                )}
              >
                x{m}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Right panel — keyword cloud */}
      <div className="flex-1 relative">
        <KeywordCloud keywords={keywords} />
      </div>
    </div>
  );
}
