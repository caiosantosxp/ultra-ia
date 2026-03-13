import { BarChart, Bot, LayoutDashboard, Settings, Users } from 'lucide-react';

import type { AdminNavItem } from '@/types/admin';

export const adminNavItems: AdminNavItem[] = [
  { label: 'Dashboard', href: '/admin/dashboard', icon: LayoutDashboard },
  { label: 'Agentes', href: '/admin/agents', icon: Bot },
  { label: 'Usuários', href: '/admin/users', icon: Users },
  { label: 'Analytics', href: '/admin/analytics', icon: BarChart },
  { label: 'Config', href: '/admin/settings', icon: Settings },
];
