import { Task } from '../../tasks/entities/task.entity';
import { Notification } from '../../notifications/entities/notification.entity';
export declare class User {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    password: string;
    isActive: boolean;
    role: 'admin' | 'user';
    tasks: Task[];
    createdTasks: Task[];
    notifications: Notification[];
    createdAt: Date;
    updatedAt: Date;
    get fullName(): string;
}
