import type { NavItem } from '../types';

export const NAV_ITEMS: NavItem[] = [
  {
    id: 'scheduled',
    label: 'Scheduled',
    path: '/scheduled',
    icon: 'Clock',
    badge: 12,
  },
  {
    id: 'sent',
    label: 'Sent',
    path: '/sent',
    icon: 'Send',
    badge: 705,
  },
];
