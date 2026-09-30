export interface UserPayload {
  id: string;
  email: string;
}

export interface EmailJobData {
  emailId: string;
  campaignId?: string;
  senderId?: string;
  recipientEmail: string;
  subject: string;
  body: string;
  scheduledAt?: string;
}
