"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TasksService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const schedule_1 = require("@nestjs/schedule");
const task_entity_1 = require("./entities/task.entity");
const cache_service_1 = require("../cache/cache.service");
const notifications_service_1 = require("../notifications/notifications.service");
const user_entity_1 = require("../users/entities/user.entity");
let TasksService = class TasksService {
    taskRepository;
    userRepository;
    cacheService;
    notificationsService;
    constructor(taskRepository, userRepository, cacheService, notificationsService) {
        this.taskRepository = taskRepository;
        this.userRepository = userRepository;
        this.cacheService = cacheService;
        this.notificationsService = notificationsService;
    }
    async create(createTaskDto, userId) {
        const task = this.taskRepository.create({
            ...createTaskDto,
            dueDate: createTaskDto.dueDate ? new Date(createTaskDto.dueDate) : undefined,
            createdById: userId,
        });
        const savedTask = await this.taskRepository.save(task);
        await this.cacheService.invalidateUserTaskLists(userId);
        if (createTaskDto.assigneeId) {
            await this.cacheService.invalidateUserTaskLists(createTaskDto.assigneeId);
            const assignee = await this.userRepository.findOne({
                where: { id: createTaskDto.assigneeId },
            });
            const creator = await this.userRepository.findOne({ where: { id: userId } });
            if (assignee) {
                await this.notificationsService.sendNotification({
                    type: 'task_assigned',
                    userId: assignee.id,
                    taskId: savedTask.id,
                    taskTitle: savedTask.title,
                    email: assignee.email,
                    metadata: { assignedBy: creator?.fullName || 'Unknown' },
                });
            }
        }
        return savedTask;
    }
    async findAll(filters, userId) {
        const cached = await this.cacheService.getTaskList(userId, filters);
        if (cached) {
            console.log('Cache HIT pour la liste des tâches');
            return cached;
        }
        console.log('Cache MISS pour la liste des tâches');
        const { page = 1, limit = 10, sortBy = 'createdAt', sortOrder = 'DESC' } = filters;
        const skip = (page - 1) * limit;
        const query = this.taskRepository
            .createQueryBuilder('task')
            .leftJoinAndSelect('task.assignee', 'assignee')
            .leftJoinAndSelect('task.createdBy', 'createdBy');
        if (filters.status) {
            query.andWhere('task.status = :status', { status: filters.status });
        }
        if (filters.priority) {
            query.andWhere('task.priority = :priority', { priority: filters.priority });
        }
        if (filters.assigneeId) {
            query.andWhere('task.assigneeId = :assigneeId', { assigneeId: filters.assigneeId });
        }
        if (filters.isOverdue !== undefined) {
            query.andWhere('task.isOverdue = :isOverdue', { isOverdue: filters.isOverdue });
        }
        if (filters.search) {
            query.andWhere('(task.title ILIKE :search OR task.description ILIKE :search)', { search: `%${filters.search}%` });
        }
        if (filters.tag) {
            query.andWhere(':tag = ANY(task.tags)', { tag: filters.tag });
        }
        const allowedSortFields = ['createdAt', 'updatedAt', 'dueDate', 'priority', 'status', 'title'];
        const sortField = allowedSortFields.includes(sortBy) ? sortBy : 'createdAt';
        query.orderBy(`task.${sortField}`, sortOrder);
        const [tasks, total] = await query.skip(skip).take(limit).getManyAndCount();
        const result = {
            data: tasks,
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit),
        };
        await this.cacheService.setTaskList(userId, filters, result);
        return result;
    }
    async findOne(id) {
        const cached = await this.cacheService.getTask(id);
        if (cached) {
            console.log(`Mettre en cache HIT pour la tâche ${id}`);
            return cached;
        }
        console.log(`Cache MISS pour la tâche ${id}`);
        const task = await this.taskRepository.findOne({
            where: { id },
            relations: ['assignee', 'createdBy'],
        });
        if (!task) {
            throw new common_1.NotFoundException(`Tâche avec ID ${id} pas trouvée`);
        }
        await this.cacheService.setTask(id, task);
        return task;
    }
    async update(id, updateTaskDto, userId) {
        const task = await this.findOne(id);
        if (task.createdById !== userId && task.assigneeId !== userId) {
            throw new common_1.ForbiddenException('Vous n\'êtes pas autorisé à modifier cette tâche');
        }
        const previousAssigneeId = task.assigneeId;
        const previousStatus = task.status;
        Object.assign(task, updateTaskDto);
        if (updateTaskDto.dueDate) {
            task.dueDate = new Date(updateTaskDto.dueDate);
        }
        if (updateTaskDto.status === task_entity_1.TaskStatus.DONE && previousStatus !== task_entity_1.TaskStatus.DONE) {
            task.completedAt = new Date();
            task.isOverdue = false;
        }
        if (updateTaskDto.dueDate && new Date(updateTaskDto.dueDate) > new Date()) {
            task.isOverdue = false;
            task.overdueNotificationSent = false;
        }
        const savedTask = await this.taskRepository.save(task);
        await this.cacheService.invalidateTask(id);
        await this.cacheService.invalidateUserTaskLists(userId);
        if (updateTaskDto.assigneeId && updateTaskDto.assigneeId !== previousAssigneeId) {
            const assignee = await this.userRepository.findOne({
                where: { id: updateTaskDto.assigneeId },
            });
            const updater = await this.userRepository.findOne({ where: { id: userId } });
            if (assignee) {
                await this.notificationsService.sendNotification({
                    type: 'task_assigned',
                    userId: assignee.id,
                    taskId: savedTask.id,
                    taskTitle: savedTask.title,
                    email: assignee.email,
                    metadata: { assignedBy: updater?.fullName || 'Unknown' },
                });
                await this.cacheService.invalidateUserTaskLists(assignee.id);
            }
        }
        if (updateTaskDto.status === task_entity_1.TaskStatus.DONE && previousStatus !== task_entity_1.TaskStatus.DONE) {
            if (task.createdById !== userId) {
                const creator = await this.userRepository.findOne({ where: { id: task.createdById } });
                if (creator) {
                    await this.notificationsService.sendNotification({
                        type: 'task_completed',
                        userId: creator.id,
                        taskId: savedTask.id,
                        taskTitle: savedTask.title,
                        email: creator.email,
                    });
                }
            }
        }
        return savedTask;
    }
    async remove(id, userId) {
        const task = await this.findOne(id);
        if (task.createdById !== userId) {
            throw new common_1.ForbiddenException('Seul le créateur de la tâche peut la supprimer');
        }
        await this.taskRepository.remove(task);
        await this.cacheService.invalidateTask(id);
        await this.cacheService.invalidateUserTaskLists(userId);
        if (task.assigneeId) {
            await this.cacheService.invalidateUserTaskLists(task.assigneeId);
        }
    }
    async checkOverdueTasks() {
        console.log('Vérification des tâches en retard...');
        const now = new Date();
        const overdueTasks = await this.taskRepository.find({
            where: {
                dueDate: (0, typeorm_2.LessThan)(now),
                isOverdue: false,
                status: (0, typeorm_2.In)([task_entity_1.TaskStatus.TODO, task_entity_1.TaskStatus.IN_PROGRESS]),
            },
            relations: ['assignee', 'createdBy'],
        });
        for (const task of overdueTasks) {
            task.isOverdue = true;
            if (!task.overdueNotificationSent) {
                const targetUser = task.assignee || task.createdBy;
                if (targetUser) {
                    await this.notificationsService.sendNotification({
                        type: 'task_overdue',
                        userId: targetUser.id,
                        taskId: task.id,
                        taskTitle: task.title,
                        email: targetUser.email,
                    });
                    task.overdueNotificationSent = true;
                }
            }
            await this.taskRepository.save(task);
            await this.cacheService.invalidateTask(task.id);
        }
        if (overdueTasks.length > 0) {
            console.log(`${overdueTasks.length} tâches en retard trouvées`);
            await this.cacheService.invalidateAllTasks();
        }
    }
    async getTaskStats(userId) {
        const stats = await this.taskRepository
            .createQueryBuilder('task')
            .select('task.status', 'status')
            .addSelect('COUNT(*)', 'count')
            .where('task.createdById = :userId OR task.assigneeId = :userId', { userId })
            .groupBy('task.status')
            .getRawMany();
        const overdueCount = await this.taskRepository.count({
            where: [
                { createdById: userId, isOverdue: true },
                { assigneeId: userId, isOverdue: true },
            ],
        });
        const result = {
            total: 0,
            todo: 0,
            in_progress: 0,
            done: 0,
            cancelled: 0,
            overdue: overdueCount,
        };
        stats.forEach((stat) => {
            result[stat.status] = parseInt(stat.count, 10);
            result.total += parseInt(stat.count, 10);
        });
        return result;
    }
};
exports.TasksService = TasksService;
__decorate([
    (0, schedule_1.Cron)(schedule_1.CronExpression.EVERY_5_MINUTES),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], TasksService.prototype, "checkOverdueTasks", null);
exports.TasksService = TasksService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(task_entity_1.Task)),
    __param(1, (0, typeorm_1.InjectRepository)(user_entity_1.User)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        cache_service_1.CacheService,
        notifications_service_1.NotificationsService])
], TasksService);
//# sourceMappingURL=tasks.service.js.map