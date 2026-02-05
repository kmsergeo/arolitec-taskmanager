import { OnModuleInit } from '@nestjs/common';
import { Repository } from 'typeorm';
import { Notification } from './entities/notification.entity';
import { NotificationMessage, RabbitMQService } from './rabbitmq/rabbitmq.service';
import { EmailService } from './email/email.service';
export declare class NotificationsService implements OnModuleInit {
    private notificationRepository;
    private rabbitMQService;
    private emailService;
    private readonly logger;
    constructor(notificationRepository: Repository<Notification>, rabbitMQService: RabbitMQService, emailService: EmailService);
    onModuleInit(): Promise<void>;
    private startConsumer;
    private createInAppNotification;
    private getNotificationTitle;
    private getNotificationMessage;
    getUserNotifications(userId: string, unreadOnly?: boolean): Promise<Notification[]>;
    getUnreadCount(userId: string): Promise<number>;
    markAsRead(notificationId: string, userId: string): Promise<Notification>;
    markAllAsRead(userId: string): Promise<void>;
    deleteNotification(notificationId: string, userId: string): Promise<void>;
    sendNotification(message: NotificationMessage): Promise<boolean>;
}
