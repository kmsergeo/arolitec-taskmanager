import { TasksService } from './tasks.service';
import { CreateTaskDto, UpdateTaskDto, TaskFilterDto, PaginatedTasksDto } from './dto/task.dto';
import { User } from '../users/entities/user.entity';
export declare class TasksController {
    private readonly tasksService;
    constructor(tasksService: TasksService);
    create(createTaskDto: CreateTaskDto, user: User): Promise<import("./entities/task.entity").Task>;
    findAll(filters: TaskFilterDto, user: User): Promise<PaginatedTasksDto>;
    getStats(user: User): Promise<Record<string, number>>;
    findOne(id: string): Promise<import("./entities/task.entity").Task>;
    update(id: string, updateTaskDto: UpdateTaskDto, user: User): Promise<import("./entities/task.entity").Task>;
    remove(id: string, user: User): Promise<{
        message: string;
    }>;
}
