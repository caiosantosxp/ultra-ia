import { create } from 'zustand';

import type { SubscriptionStatus } from '@prisma/client';

interface SubscriptionState {
  status: SubscriptionStatus | 'none' | null;
  isPastDue: boolean;
  isLoading: boolean;
  setSubscription: (status: SubscriptionStatus | 'none', isPastDue: boolean) => void;
  setLoading: (loading: boolean) => void;
  reset: () => void;
}

export const useSubscriptionStore = create<SubscriptionState>((set) => ({
  status: null,
  isPastDue: false,
  isLoading: true,
  setSubscription: (status, isPastDue) => set({ status, isPastDue, isLoading: false }),
  setLoading: (isLoading) => set({ isLoading }),
  reset: () => set({ status: null, isPastDue: false, isLoading: true }),
}));
