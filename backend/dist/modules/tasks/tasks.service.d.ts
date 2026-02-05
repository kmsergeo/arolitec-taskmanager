import { Repository } from 'typeorm';
import { Task } from './entities/task.entity';
import { CreateTaskDto, UpdateTaskDto, TaskFilterDto, PaginatedTasksDto } from './dto/task.dto';
import { CacheService } from '../cache/cache.service';
import { NotificationsService } from '../notifications/notifications.service';
import { User } from '../users/entities/user.entity';
export declare class TasksService {
    private taskRepository;
    private userRepository;
    private cacheService;
    private notificationsService;
    constructor(taskRepository: Repository<Task>, userRepository: Repository<User>, cacheService: CacheService, notificationsService: NotificationsService);
    create(createTaskDto: CreateTaskDto, userId: string): Promise<Task>;
    findAll(filters: TaskFilterDto, userId: string): Promise<PaginatedTasksDto>;
    findOne(id: string): Promise<Task>;
    update(id: string, updateTaskDto: UpdateTaskDto, userId: string): Promise<Task>;
    remove(id: string, userId: string): Promise<void>;
    checkOverdueTasks(): Promise<void>;
    getTaskStats(userId: string): Promise<Record<string, number>>;
}
