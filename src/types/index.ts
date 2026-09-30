export interface NavItem {
  id: string;
  label: string;
  path: string;
  icon: string;
  badge?: number | string;
}

export interface Email {
  id: string;
  threadId?: string;
  senderName: string;
  senderEmail: string;
  recipientEmail: string;
  recipients?: string[];
  subject: string;
  snippet: string;
  body: string;
  status: 'scheduled' | 'sent' | 'draft';
  scheduledAt?: string;
  sentAt?: string;
  createdAt: string;
  tags?: string[];
  delayBetweenEmails?: number;
  hourlyLimit?: number;
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string;
}
