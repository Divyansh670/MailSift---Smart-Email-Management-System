export type EmailFilter = 'all' | 'opportunities' | 'hackathons' | 'contests' | 'scholarships' | 'jobs' | 'events';

export interface EmailTag {
  label: string;
  category: string;
}

export interface EmailSender {
  name: string;
  email: string;
  avatar: string;
}

export interface Email {
  id: string;
  subject: string;
  sender: EmailSender;
  date: string;
  preview: string;
  isImportant: boolean;
  isRead: boolean;
  priority: 'high' | 'medium' | 'low';
  tags: EmailTag[];
}