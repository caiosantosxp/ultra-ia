'use client';

import { useState } from 'react';

interface AvatarCardProps {
  avatarUrl: string | null;
  name: string;
  accentColor: string;
  insightsLabel: string;
}

export function AvatarCard({ avatarUrl, name, accentColor, insightsLabel }: AvatarCardProps) {
  const [imgError, setImgError] = useState(false);
  const showFallback = !avatarUrl || imgError;
  const initial = name.charAt(0).toUpperCase();

  return (
    <div className="relative overflow-hidden rounded-xl border bg-card h-64">
      {showFallback ? (
        <div
          className="flex h-full w-full items-center justify-center text-6xl font-bold text-white"
          style={{ backgroundColor: accentColor }}
        >
          {initial}
        </div>
      ) : (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={avatarUrl}
          alt={name}
          className="h-full w-full object-cover object-top"
          onError={() => setImgError(true)}
        />
      )}

      {/* Insights badge */}
      <div className="absolute bottom-3 left-3 right-3">
        <div className="flex items-center gap-2 rounded-xl bg-black/70 px-3 py-2 text-white backdrop-blur-sm">
          <span className="flex-1 text-xs font-medium">{insightsLabel}</span>
          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold">1</span>
        </div>
      </div>
    </div>
  );
}
