export interface CalendarEvent {
  id: string;
  title: string;
  description?: string;
  startTime: string; // ISO string
  endTime: string; // ISO string
  allDay: boolean;
  color?: string;
  userId: string;
  reminders?: Reminder[];
  createdAt: string;
  updatedAt: string;
}

export interface Reminder {
  type: 'email' | 'notification' | 'alarm';
  minutesBefore: number;
  status: 'pending' | 'sent' | 'failed';
}

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  settings: {
    theme: 'light' | 'dark' | 'system';
    defaultView: 'month' | 'week' | 'day';
  };
}
