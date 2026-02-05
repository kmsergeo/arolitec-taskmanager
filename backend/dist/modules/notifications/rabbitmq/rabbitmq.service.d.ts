import { OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
export interface NotificationMessage {
    type: 'task_assigned' | 'task_overdue' | 'task_completed' | 'task_updated';
    userId: string;
    taskId: string;
    taskTitle: string;
    email?: string;
    metadata?: Record<string, any>;
}
export declare class RabbitMQService implements OnModuleInit, OnModuleDestroy {
    private configService;
    private readonly logger;
    private connection;
    private channel;
    private readonly exchangeName;
    private readonly queueName;
    private isConnected;
    private connectionPromise;
    constructor(configService: ConfigService);
    onModuleInit(): Promise<void>;
    onModuleDestroy(): Promise<void>;
    private connect;
    private disconnect;
    publishNotification(message: NotificationMessage): Promise<boolean>;
    consumeNotifications(handler: (message: NotificationMessage) => Promise<void>): Promise<void>;
    checkConnection(): Promise<boolean>;
}
