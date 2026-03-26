'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const COOKIE_CONSENT_KEY = 'cookie-consent';

export function CookieConsent() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(!localStorage.getItem(COOKIE_CONSENT_KEY));
  }, []);

  const dialogRef = useRef<HTMLDivElement>(null);

  // Focus trap: cycle Tab/Shift+Tab within the dialog
  useEffect(() => {
    if (!isVisible) return;

    const dialog = dialogRef.current;
    if (!dialog) return;

    const focusableSelectors =
      'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])';

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;

      const focusable = Array.from(
        dialog.querySelectorAll<HTMLElement>(focusableSelectors)
      );
      if (focusable.length === 0) return;

      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (e.shiftKey) {
        if (document.activeElement === first) {
          e.preventDefault();
          last.focus();
        }
      } else {
        if (document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isVisible]);

  const handleConsent = (value: 'accepted' | 'refused') => {
    localStorage.setItem(COOKIE_CONSENT_KEY, value);
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <div
      ref={dialogRef}
      role="dialog"
      aria-modal="true"
      aria-label="Gestion des cookies"
      aria-describedby="cookie-consent-description"
      className={cn(
        'fixed bottom-0 left-0 right-0 z-50',
        'border-t border-border bg-card shadow-lg',
        'animate-in slide-in-from-bottom duration-300'
      )}
    >
      <div className="mx-auto flex max-w-5xl flex-col gap-4 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:gap-6">
        <p
          id="cookie-consent-description"
          className="text-sm text-muted-foreground"
        >
          🍪 Nous utilisons des cookies fonctionnels pour améliorer votre expérience.{' '}
          <Link
            href="/privacy"
            className="underline hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          >
            En savoir plus
          </Link>
        </p>
        <div className="flex shrink-0 gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleConsent('refused')}
          >
            Refuser
          </Button>
          <Button
            size="sm"
            autoFocus
            onClick={() => handleConsent('accepted')}
          >
            Accepter
          </Button>
        </div>
      </div>
    </div>
  );
}
