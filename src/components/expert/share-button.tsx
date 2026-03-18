'use client';

import { Share2, Check } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';

interface ShareButtonProps {
  slug: string;
  label: string;
  copiedLabel: string;
}

export function ShareButton({ slug, label, copiedLabel }: ShareButtonProps) {
  const [copied, setCopied] = useState(false);

  async function handleShare() {
    const url = `${window.location.origin}/specialist/${slug}`;
    await navigator.clipboard.writeText(url);
    setCopied(true);
    toast.success(copiedLabel);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <Button variant="outline" size="sm" className="gap-1.5" onClick={handleShare}>
      {copied ? <Check className="h-3.5 w-3.5" /> : <Share2 className="h-3.5 w-3.5" />}
      {label}
    </Button>
  );
}
