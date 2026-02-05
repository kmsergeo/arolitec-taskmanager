import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan, In } from 'typeorm';
import { Cron, CronExpression } from '@nestjs/schedule';
import { Task, TaskStatus } from './entities/task.entity';
import { CreateTaskDto, UpdateTaskDto, TaskFilterDto, PaginatedTasksDto } from './dto/task.dto';
import { CacheService } from '../cache/cache.service';
import { NotificationsService } from '../notifications/notifications.service';
import { User } from '../users/entities/user.entity';

@Injectable()
export class TasksService {
  constructor(
    @InjectRepository(Task)
    private taskRepository: Repository<Task>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private cacheService: CacheService,
    private notificationsService: NotificationsService,
  ) {}

  async create(createTaskDto: CreateTaskDto, userId: string): Promise<Task> {
    const task = this.taskRepository.create({
      ...createTaskDto,
      dueDate: createTaskDto.dueDate ? new Date(createTaskDto.dueDate) : undefined,
      createdById: userId,
    });

    const savedTask = await this.taskRepository.save(task);

    // Invalider le cache des listes de tâches de l'utilisateur
    await this.cacheService.invalidateUserTaskLists(userId);
    if (createTaskDto.assigneeId) {
      await this.cacheService.invalidateUserTaskLists(createTaskDto.assigneeId);

      // Envoyer une notification au destinataire
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

  async findAll(filters: TaskFilterDto, userId: string): Promise<PaginatedTasksDto> {
    // Essayez d'extraire du cache
    const cached = await this.cacheService.getTaskList<PaginatedTasksDto>(userId, filters);
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

    // Appliquer des filtres
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
      query.andWhere(
        '(task.title ILIKE :search OR task.description ILIKE :search)',
        { search: `%${filters.search}%` },
      );
    }

    if (filters.tag) {
      query.andWhere(':tag = ANY(task.tags)', { tag: filters.tag });
    }

    // Appliquer le tri
    const allowedSortFields = ['createdAt', 'updatedAt', 'dueDate', 'priority', 'status', 'title'];
    const sortField = allowedSortFields.includes(sortBy) ? sortBy : 'createdAt';
    query.orderBy(`task.${sortField}`, sortOrder);

    // Obtenez le nombre total et les résultats paginés
    const [tasks, total] = await query.skip(skip).take(limit).getManyAndCount();

    const result: PaginatedTasksDto = {
      data: tasks as any,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };

    // Cacher le résultat
    await this.cacheService.setTaskList(userId, filters, result);

    return result;
  }

  async findOne(id: string): Promise<Task> {
    // Essayez d'abord le cache
    const cached = await this.cacheService.getTask<Task>(id);
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
      throw new NotFoundException(`Tâche avec ID ${id} pas trouvée`);
    }

    // Cache the task
    await this.cacheService.setTask(id, task);

    return task;
  }

  async update(id: string, updateTaskDto: UpdateTaskDto, userId: string): Promise<Task> {
    const task = await this.findOne(id);

    // Vérifiez les autorisations 
    if (task.createdById !== userId && task.assigneeId !== userId) {
      throw new ForbiddenException('Vous n\'êtes pas autorisé à modifier cette tâche');
    }

    const previousAssigneeId = task.assigneeId;
    const previousStatus = task.status;

    // Tâche de mise à jour
    Object.assign(task, updateTaskDto);
    if (updateTaskDto.dueDate) {
      task.dueDate = new Date(updateTaskDto.dueDate);
    }

    // Gérer l'achèvement
    if (updateTaskDto.status === TaskStatus.DONE && previousStatus !== TaskStatus.DONE) {
      task.completedAt = new Date();
      task.isOverdue = false;
    }

    // Réinitialiser l'indicateur de retard si la date d'échéance est prolongée
    if (updateTaskDto.dueDate && new Date(updateTaskDto.dueDate) > new Date()) {
      task.isOverdue = false;
      task.overdueNotificationSent = false;
    }

    const savedTask = await this.taskRepository.save(task);

    // Invalider le cache
    await this.cacheService.invalidateTask(id);
    await this.cacheService.invalidateUserTaskLists(userId);

    // Notifier le nouveau responsable en cas de changement
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

    // Notifier l'achèvement de la tâche
    if (updateTaskDto.status === TaskStatus.DONE && previousStatus !== TaskStatus.DONE) {
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

  async remove(id: string, userId: string): Promise<void> {
    const task = await this.findOne(id);

    // Seul le créateur peut supprimer
    if (task.createdById !== userId) {
      throw new ForbiddenException('Seul le créateur de la tâche peut la supprimer');
    }

    await this.taskRepository.remove(task);

    // Invalider le cache
    await this.cacheService.invalidateTask(id);
    await this.cacheService.invalidateUserTaskLists(userId);
    if (task.assigneeId) {
      await this.cacheService.invalidateUserTaskLists(task.assigneeId);
    }
  }

  // Pour vérifier les tâches en retard toutes les 5 minutes
  @Cron(CronExpression.EVERY_5_MINUTES)
  async checkOverdueTasks(): Promise<void> {
    console.log('Vérification des tâches en retard...');

    const now = new Date();

    // Recherche les tâches en retard qui n'ont pas encore été marquées
    const overdueTasks = await this.taskRepository.find({
      where: {
        dueDate: LessThan(now),
        isOverdue: false,
        status: In([TaskStatus.TODO, TaskStatus.IN_PROGRESS]),
      },
      relations: ['assignee', 'createdBy'],
    });

    for (const task of overdueTasks) {
      task.isOverdue = true;

      // Envoyer une notification si ce n'est pas déjà fait
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

  // Récupérer les statistiques de tâches pour un utilisateur
  async getTaskStats(userId: string): Promise<Record<string, number>> {
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

    const result: Record<string, number> = {
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
}
