import { NotificationsService } from './notifications.service';
import { User } from '../users/entities/user.entity';
export declare class NotificationsController {
    private readonly notificationsService;
    constructor(notificationsService: NotificationsService);
    getNotifications(user: User, unreadOnly?: boolean): Promise<import("./entities/notification.entity").Notification[]>;
    getUnreadCount(user: User): Promise<{
        unreadCount: number;
    }>;
    markAsRead(id: string, user: User): Promise<import("./entities/notification.entity").Notification>;
    markAllAsRead(user: User): Promise<{
        message: string;
    }>;
    deleteNotification(id: string, user: User): Promise<{
        message: string;
    }>;
}
