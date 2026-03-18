import type { LucideIcon } from 'lucide-react';

export interface AdminNavItem {
  label: string;
  href: string;
  icon: LucideIcon;
}

export interface PlatformMetrics {
  activeSubscribers: number;
  activeSubscribersTrend: number;
  messagesToday: number;
  messagesTodayTrend: number;
  mrr: number;
  mrrTrend: number;
  retentionRate: number;
  retentionRateTrend: number;
  totalUsers: number;
  totalExperts: number;
  totalAgents: number;
  newUsersThisPeriod: number;
  newSubscribersThisPeriod: number;
  newSubscribersTrend: number;
  totalConversationsThisPeriod: number;
  totalMessagesThisPeriod: number;
  avgMessagesPerConversation: number;
  dailySubscriptions: Array<{ date: string; count: number }>;
  dailyMessages: Array<{ date: string; count: number }>;
}
