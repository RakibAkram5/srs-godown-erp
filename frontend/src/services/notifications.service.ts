import { api, unwrap } from './api';

export type NotificationType = 'OUT_OF_STOCK' | 'LOW_STOCK' | 'PENDING_SALE' | 'RECEIVABLE' | 'PAYABLE';
export type NotificationSeverity = 'critical' | 'warning' | 'info';

export interface NotificationItem {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  severity: NotificationSeverity;
  link: string;
  amount?: number;
}

export const notificationsApi = {
  list(): Promise<NotificationItem[]> {
    return unwrap<NotificationItem[]>(api.get('/notifications'));
  },
};
