import { User } from '../../users/entities/user.entity';
export declare enum NotificationType {
    TASK_ASSIGNED = "task_assigned",
    TASK_OVERDUE = "task_overdue",
    TASK_COMPLETED = "task_completed",
    TASK_UPDATED = "task_updated",
    MENTION = "mention",
    SYSTEM = "system"
}
export declare class Notification {
    id: string;
    type: NotificationType;
    title: string;
    message: string;
    isRead: boolean;
    metadata: Record<string, any>;
    user: User;
    userId: string;
    createdAt: Date;
    readAt: Date;
}
