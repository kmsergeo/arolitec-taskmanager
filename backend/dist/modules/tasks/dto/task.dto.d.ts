import { TaskStatus, TaskPriority } from '../entities/task.entity';
export declare class CreateTaskDto {
    title: string;
    description?: string;
    priority?: TaskPriority;
    dueDate?: string;
    tags?: string[];
    assigneeId?: string;
}
declare const UpdateTaskDto_base: import("@nestjs/common").Type<Partial<CreateTaskDto>>;
export declare class UpdateTaskDto extends UpdateTaskDto_base {
    status?: TaskStatus;
}
export declare class TaskFilterDto {
    status?: TaskStatus;
    priority?: TaskPriority;
    assigneeId?: string;
    search?: string;
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: 'ASC' | 'DESC';
    isOverdue?: boolean;
    tag?: string;
}
export declare class TaskResponseDto {
    id: string;
    title: string;
    description: string;
    status: TaskStatus;
    priority: TaskPriority;
    dueDate: Date;
    isOverdue: boolean;
    tags: string[];
    assigneeId: string;
    createdById: string;
    createdAt: Date;
    updatedAt: Date;
    completedAt: Date;
}
export declare class PaginatedTasksDto {
    data: TaskResponseDto[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
}
export {};
