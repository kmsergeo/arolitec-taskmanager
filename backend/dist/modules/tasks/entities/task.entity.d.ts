import { User } from 'src/modules/users/entities/user.entity';
export declare enum TaskStatus {
    TODO = "todo",
    IN_PROGRESS = "in_progress",
    DONE = "done",
    CANCELLED = "cancelled"
}
export declare enum TaskPriority {
    LOW = "low",
    MEDIUM = "medium",
    HIGH = "high",
    URGENT = "urgent"
}
export declare class Task {
    [x: string]: any;
    id: string;
    title: string;
    description: string;
    status: TaskStatus;
    priority: TaskPriority;
    dueDate: Date;
    isOverdue: boolean;
    overdueNotificationSent: boolean;
    tags: string[];
    assignee: User;
    assigneeId: string;
    createdBy: User;
    createdById: string;
    createdAt: Date;
    updatedAt: Date;
    completedAt: Date;
}
