import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { Email, UserProfile } from '../types';
import { api } from '../services/api';
import type { BackendEmail, ScheduleCampaignPayload } from '../services/api';

interface AppContextType {
  isAuthenticated: boolean;
  user: UserProfile | null;
  isLoading: boolean;
  scheduledEmails: Email[];
  sentEmails: Email[];
  slackStatus: { isConnected: boolean; teamName?: string; channelName?: string };
  logout: () => Promise<void>;
  refreshData: () => Promise<void>;
  scheduleCampaign: (payload: ScheduleCampaignPayload) => Promise<boolean>;
  searchEmails: (query: string) => Promise<Email[]>;
  getEmailById: (id: string) => Email | undefined;
  disconnectSlack: () => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

function mapBackendEmailToFrontend(e: BackendEmail, tag: string = 'Campaign'): Email {
  const isSent = e.status === 'SENT';

  let displayTime = 'Scheduled';
  if (e.sentAt) {
    displayTime = new Date(e.sentAt).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  } else if (e.scheduledAt) {
    const scheduledDate = new Date(e.scheduledAt);
    const now = new Date();
    const isToday = scheduledDate.toDateString() === now.toDateString();
    const timeStr = scheduledDate.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
    displayTime = isToday ? `Today, ${timeStr}` : `${scheduledDate.toLocaleDateString()}, ${timeStr}`;
  }

  return {
    id: e.id,
    senderName: 'Oliver Brown',
    senderEmail: 'oliver.brown@domain.io',
    recipientEmail: e.recipientEmail,
    recipients: [e.recipientEmail],
    subject: e.subject,
    snippet: e.snippet || e.body.slice(0, 60),
    body: e.body,
    status: isSent ? 'sent' : 'scheduled',
    scheduledAt: displayTime,
    sentAt: e.sentAt ? new Date(e.sentAt).toLocaleString() : undefined,
    createdAt: e.createdAt,
    tags: [tag],
  };
}

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [scheduledEmails, setScheduledEmails] = useState<Email[]>([]);
  const [sentEmails, setSentEmails] = useState<Email[]>([]);
  const [slackStatus, setSlackStatus] = useState<{
    isConnected: boolean;
    teamName?: string;
    channelName?: string;
  }>({ isConnected: false });

  // 1. Refresh campaigns and emails from backend API
  const refreshData = useCallback(async () => {
    try {
      const response = await api.campaigns.list();
      if (response.success && Array.isArray(response.campaigns)) {
        const scheduledList: Email[] = [];
        const sentList: Email[] = [];

        response.campaigns.forEach((campaign) => {
          campaign.emails?.forEach((email) => {
            const mapped = mapBackendEmailToFrontend(email, campaign.name);
            if (email.status === 'SENT') {
              sentList.push(mapped);
            } else {
              scheduledList.push(mapped);
            }
          });
        });

        setScheduledEmails(scheduledList);
        setSentEmails(sentList);
      }
    } catch (error: any) {
      console.warn('⚠️ AppContext refreshData error:', error.message);
    }
  }, []);

  // 2. Refresh Slack status
  const refreshSlackStatus = useCallback(async () => {
    try {
      const res = await api.slack.status();
      if (res.success && res.status) {
        setSlackStatus(res.status);
      }
    } catch {
      setSlackStatus({ isConnected: false });
    }
  }, []);

  // 3. Initial Auth Session Check
  useEffect(() => {
    async function checkAuthSession() {
      setIsLoading(true);
      try {
        const res = await api.auth.getMe();
        if (res.success && res.user) {
          setIsAuthenticated(true);
          setUser({
            id: res.user.id,
            name: res.user.name,
            email: res.user.email,
            avatarUrl: res.user.avatar || undefined,
          });
          await refreshData();
          await refreshSlackStatus();
        } else {
          setIsAuthenticated(false);
          setUser(null);
        }
      } catch {
        setIsAuthenticated(false);
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    }

    checkAuthSession();
  }, [refreshData, refreshSlackStatus]);

  // Periodic Auto-Refresh to poll BullMQ worker email status updates
  useEffect(() => {
    if (!isAuthenticated) return;

    const interval = setInterval(() => {
      refreshData();
    }, 4000);

    return () => clearInterval(interval);
  }, [isAuthenticated, refreshData]);

  // Logout Handler
  const logout = async () => {
    try {
      await api.auth.logout();
    } catch {
      // Ignore network errors on logout
    } finally {
      setIsAuthenticated(false);
      setUser(null);
      setScheduledEmails([]);
      setSentEmails([]);
    }
  };

  // Schedule Campaign Handler
  const scheduleCampaign = async (payload: ScheduleCampaignPayload): Promise<boolean> => {
    try {
      const res = await api.campaigns.schedule(payload);
      if (res.success) {
        await refreshData();
        return true;
      }
      return false;
    } catch (error: any) {
      console.error('❌ Failed to schedule campaign:', error.message);
      throw error;
    }
  };

  // Search Emails Handler
  const searchEmails = async (query: string): Promise<Email[]> => {
    if (!query.trim()) return [];
    try {
      const res = await api.emails.search(query);
      if (res.success && Array.isArray(res.data)) {
        return res.data.map((e) => mapBackendEmailToFrontend(e));
      }
      return [];
    } catch (error: any) {
      console.warn('⚠️ Search error:', error.message);
      return [];
    }
  };

  // Disconnect Slack Handler
  const disconnectSlack = async () => {
    try {
      await api.slack.disconnect();
      setSlackStatus({ isConnected: false });
    } catch (error: any) {
      console.error('❌ Failed to disconnect Slack:', error.message);
    }
  };

  // Get Email By ID
  const getEmailById = (id: string): Email | undefined => {
    return (
      scheduledEmails.find((e) => e.id === id) ||
      sentEmails.find((e) => e.id === id)
    );
  };

  return (
    <AppContext.Provider
      value={{
        isAuthenticated,
        user,
        isLoading,
        scheduledEmails,
        sentEmails,
        slackStatus,
        logout,
        refreshData,
        scheduleCampaign,
        searchEmails,
        getEmailById,
        disconnectSlack,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
