export declare class NotificationsService {
    getUserNotifications(id: string, unreadOnly: boolean | undefined): void;
    getUnreadCount(id: string): void;
    markAsRead(id: string, id1: string): void;
    markAllAsRead(id: string): void;
    deleteNotification(id: string, id1: string): void;
}
