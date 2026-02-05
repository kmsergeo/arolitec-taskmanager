import { Injectable } from '@nestjs/common';

@Injectable()
export class NotificationsService {
    getUserNotifications(id: string, unreadOnly: boolean | undefined) {
        throw new Error('Method not implemented.');
    }
    getUnreadCount(id: string) {
        throw new Error('Method not implemented.');
    }
    markAsRead(id: string, id1: string) {
        throw new Error('Method not implemented.');
    }
    markAllAsRead(id: string) {
        throw new Error('Method not implemented.');
    }
    deleteNotification(id: string, id1: string) {
        throw new Error('Method not implemented.');
    }
}
