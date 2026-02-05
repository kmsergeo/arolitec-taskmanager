import { NotificationsService } from './notifications.service';
import { User } from '../users/entities/user.entity';
export declare class NotificationsController {
    private readonly notificationsService;
    constructor(notificationsService: NotificationsService);
    getNotifications(user: User, unreadOnly?: boolean): Promise<void>;
    getUnreadCount(user: User): Promise<{
        unreadCount: void;
    }>;
    markAsRead(id: string, user: User): Promise<void>;
    markAllAsRead(user: User): Promise<{
        message: string;
    }>;
    deleteNotification(id: string, user: User): Promise<{
        message: string;
    }>;
}
