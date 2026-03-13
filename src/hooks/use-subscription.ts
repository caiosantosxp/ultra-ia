'use client';

import { useEffect } from 'react';

import { useSubscriptionStore } from '@/stores/subscription-store';

export function useSubscription() {
  const { status, isPastDue, isLoading, setSubscription, setLoading } = useSubscriptionStore();

  useEffect(() => {
    const controller = new AbortController();

    async function fetchStatus() {
      try {
        setLoading(true);
        const res = await fetch('/api/subscription', { signal: controller.signal });
        if (res.ok) {
          const data = await res.json();
          if (data.success && data.data?.subscription) {
            const sub = data.data.subscription;
            setSubscription(sub.status, sub.status === 'PAST_DUE');
          } else {
            setSubscription('none', false);
          }
        } else {
          setLoading(false);
        }
      } catch (err) {
        if ((err as Error).name !== 'AbortError') {
          setLoading(false);
        }
        // Silently fail — server-side gating is the source of truth
      }
    }

    fetchStatus();

    return () => controller.abort();
  }, [setSubscription, setLoading]);

  const hasAccess = status === 'ACTIVE' || status === 'PAST_DUE';

  return { status, isPastDue, isLoading, hasAccess };
}
