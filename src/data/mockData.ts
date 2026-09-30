import type { Email } from '../types';

export const INITIAL_SCHEDULED_EMAILS: Email[] = [
  {
    id: 'email-1',
    senderName: 'Oliver Brown',
    senderEmail: 'oliver.brown@domain.io',
    recipientEmail: 'John Smith',
    subject: 'Meeting follow-up - Scheduled',
    snippet: 'Hi John, Just wanted to follow up on our meeting...',
    body: `Hey Oliver,

You've just RECEIVED something

⚡ Extremely Exclusive—Only 4 Spots Worldwide Per Year | $25,000 investment ⚡
To explore securing your private transformation, simply reply right now with "FLY OUT FIX".

Your coach for world class performance,
Grant

P.S. Always remember that you can develop world class technique! 🚀`,
    status: 'scheduled',
    scheduledAt: 'Tue 9:15:12 AM',
    createdAt: '2026-09-29T14:00:00Z',
    tags: ['Followup'],
  },
  {
    id: 'email-2',
    senderName: 'Oliver Brown',
    senderEmail: 'oliver.brown@domain.io',
    recipientEmail: 'Olive',
    subject: "Ramit, great to meet you - you'll love it",
    snippet: 'Hi Olive, just wanted to follow up on our meeting...',
    body: 'Hi Olive, just wanted to follow up on our meeting and check in regarding the campaign strategy.',
    status: 'scheduled',
    scheduledAt: 'Thu 8:15:12 PM',
    createdAt: '2026-09-29T15:00:00Z',
    tags: ['Outreach'],
  },
];

export const INITIAL_SENT_EMAILS: Email[] = [
  {
    id: 'email-3',
    senderName: 'Oliver Brown',
    senderEmail: 'oliver.brown@domain.io',
    recipientEmail: 'Sarah Wilson',
    subject: 'Re: Project Update',
    snippet: 'Thanks for the update, Sarah. Looks good!',
    body: 'Thanks for the update, Sarah. Looks good! We are ready to proceed to the next milestone.',
    status: 'sent',
    sentAt: 'Nov 3, 10:23 AM',
    createdAt: '2026-09-28T09:00:00Z',
    tags: ['Project'],
  },
  {
    id: 'email-4',
    senderName: 'Oliver Brown',
    senderEmail: 'oliver.brown@domain.io',
    recipientEmail: 'Support',
    subject: 'Issue with login',
    snippet: 'I am having trouble logging in to the dashboard...',
    body: 'I am having trouble logging in to the dashboard. Could you please check my account permissions?',
    status: 'sent',
    sentAt: 'Nov 2, 04:15 PM',
    createdAt: '2026-09-27T11:00:00Z',
    tags: ['Support'],
  },
];
