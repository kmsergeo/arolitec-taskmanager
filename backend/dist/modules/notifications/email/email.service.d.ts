import { ConfigService } from '@nestjs/config';
import { NotificationMessage } from '../rabbitmq/rabbitmq.service';
export declare class EmailService {
    private configService;
    private readonly logger;
    private transporter;
    constructor(configService: ConfigService);
    sendTaskOverdueEmail(to: string, taskTitle: string, taskId: string): Promise<void>;
    sendTaskAssignedEmail(to: string, taskTitle: string, taskId: string, assignedBy: string): Promise<void>;
    sendTaskCompletedEmail(to: string, taskTitle: string, taskId: string, completedBy: string): Promise<void>;
    processNotification(notification: NotificationMessage): Promise<void>;
}
