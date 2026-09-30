const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

/**
 * Shared fetch helper with credentials: 'include' for HTTP-only cookie support.
 */
async function fetchAPI<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;

  const defaultHeaders: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  const response = await fetch(url, {
    ...options,
    credentials: 'include', // Crucial for HTTP-only cookies across CORS
    headers: {
      ...defaultHeaders,
      ...(options.headers as Record<string, string>),
    },
  });

  if (response.status === 401) {
    throw new Error('UNAUTHORIZED');
  }

  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({}));
    throw new Error(errorBody.error || errorBody.message || `HTTP error ${response.status}`);
  }

  return response.json();
}

export interface BackendUser {
  id: string;
  email: string;
  name: string;
  avatar?: string | null;
}

export interface BackendEmail {
  id: string;
  campaignId?: string;
  senderId?: string;
  recipientEmail: string;
  subject: string;
  snippet?: string;
  body: string;
  status: 'DRAFT' | 'SCHEDULED' | 'QUEUED' | 'PROCESSING' | 'SENT' | 'FAILED';
  scheduledAt?: string | null;
  sentAt?: string | null;
  attempts: number;
  messageId?: string | null;
  bullJobId?: string | null;
  createdAt: string;
}

export interface BackendCampaign {
  id: string;
  name: string;
  status: string;
  startTime?: string | null;
  minDelayBetweenEmails: number;
  hourlyLimit: number;
  createdAt: string;
  emails: BackendEmail[];
}

export interface ScheduleCampaignPayload {
  senderEmail?: string;
  senderName?: string;
  campaignName: string;
  recipients: string[];
  subject: string;
  body: string;
  startTime?: string;
  minDelayBetweenEmails?: number;
  hourlyLimit?: number;
}

export const api = {
  // Auth API
  auth: {
    getMe: () => fetchAPI<{ success: boolean; user: BackendUser }>('/auth/me'),
    logout: () => fetchAPI<{ success: boolean; message: string }>('/auth/logout', { method: 'POST' }),
  },

  // Campaign & Email API
  campaigns: {
    schedule: (payload: ScheduleCampaignPayload) =>
      fetchAPI<{ success: boolean; message: string; data: any }>('/campaigns/schedule', {
        method: 'POST',
        body: JSON.stringify(payload),
      }),
    list: () => fetchAPI<{ success: boolean; campaigns: BackendCampaign[] }>('/campaigns'),
  },

  // Email Search API
  emails: {
    search: (query: string) =>
      fetchAPI<{ success: boolean; source: string; count: number; data: BackendEmail[] }>(
        `/emails/search?q=${encodeURIComponent(query)}`
      ),
  },

  // Slack API
  slack: {
    status: () =>
      fetchAPI<{
        success: boolean;
        status: { isConnected: boolean; teamName?: string; channelName?: string };
      }>('/slack/status'),
    disconnect: () =>
      fetchAPI<{ success: boolean; result: { isConnected: boolean; message: string } }>(
        '/slack/disconnect',
        { method: 'POST' }
      ),
    connectUrl: 'http://localhost:5000/api/slack/connect',
  },
};
