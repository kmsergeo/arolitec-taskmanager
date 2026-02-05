import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TasksService } from './tasks.service';
import { Task, TaskStatus, TaskPriority } from './entities/task.entity';
import { User } from '../users/entities/user.entity';
import { CacheService } from '../cache/cache.service';
import { NotificationsService } from '../notifications/notifications.service';

describe('TasksService', () => {
  let service: TasksService;
  let taskRepository: jest.Mocked<Repository<Task>>;
  let userRepository: jest.Mocked<Repository<User>>;
  let cacheService: jest.Mocked<CacheService>;
  let notificationsService: jest.Mocked<NotificationsService>;

  const mockUser: Partial<User> = {
    id: 'user-123',
    email: 'test@example.com',
    firstName: 'Test',
    lastName: 'User',
  };

  const mockTask: Partial<Task> = {
    id: 'task-123',
    title: 'Test Task',
    description: 'Test Description',
    status: TaskStatus.TODO,
    priority: TaskPriority.MEDIUM,
    createdById: 'user-123',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    const mockTaskRepository = {
      create: jest.fn(),
      save: jest.fn(),
      findOne: jest.fn(),
      find: jest.fn(),
      remove: jest.fn(),
      createQueryBuilder: jest.fn(() => ({
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        getManyAndCount: jest.fn().mockResolvedValue([[mockTask], 1]),
        select: jest.fn().mockReturnThis(),
        addSelect: jest.fn().mockReturnThis(),
        groupBy: jest.fn().mockReturnThis(),
        getRawMany: jest.fn().mockResolvedValue([]),
      })),
      count: jest.fn().mockResolvedValue(0),
    };

    const mockUserRepository = {
      findOne: jest.fn().mockResolvedValue(mockUser),
    };

    const mockCacheService = {
      getTask: jest.fn().mockResolvedValue(null),
      setTask: jest.fn().mockResolvedValue(undefined),
      invalidateTask: jest.fn().mockResolvedValue(undefined),
      getTaskList: jest.fn().mockResolvedValue(null),
      setTaskList: jest.fn().mockResolvedValue(undefined),
      invalidateUserTaskLists: jest.fn().mockResolvedValue(undefined),
      invalidateAllTasks: jest.fn().mockResolvedValue(undefined),
    };

    const mockNotificationsService = {
      sendNotification: jest.fn().mockResolvedValue(true),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TasksService,
        {
          provide: getRepositoryToken(Task),
          useValue: mockTaskRepository,
        },
        {
          provide: getRepositoryToken(User),
          useValue: mockUserRepository,
        },
        {
          provide: CacheService,
          useValue: mockCacheService,
        },
        {
          provide: NotificationsService,
          useValue: mockNotificationsService,
        },
      ],
    }).compile();

    service = module.get<TasksService>(TasksService);
    taskRepository = module.get(getRepositoryToken(Task));
    userRepository = module.get(getRepositoryToken(User));
    cacheService = module.get(CacheService);
    notificationsService = module.get(NotificationsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a task successfully', async () => {
      const createDto = {
        title: 'New Task',
        description: 'Description',
        priority: TaskPriority.HIGH,
      };

      taskRepository.create.mockReturnValue(mockTask as Task);
      taskRepository.save.mockResolvedValue(mockTask as Task);

      const result = await service.create(createDto, 'user-123');

      expect(taskRepository.create).toHaveBeenCalledWith({
        ...createDto,
        dueDate: undefined,
        createdById: 'user-123',
      });
      expect(taskRepository.save).toHaveBeenCalled();
      expect(cacheService.invalidateUserTaskLists).toHaveBeenCalledWith('user-123');
      expect(result).toEqual(mockTask);
    });

    it('should send notification when task is assigned', async () => {
      const createDto = {
        title: 'New Task',
        assigneeId: 'assignee-123',
      };

      taskRepository.create.mockReturnValue({ ...mockTask, assigneeId: 'assignee-123' } as Task);
      taskRepository.save.mockResolvedValue({ ...mockTask, assigneeId: 'assignee-123' } as Task);

      await service.create(createDto, 'user-123');

      expect(notificationsService.sendNotification).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'task_assigned',
          userId: 'assignee-123',
        }),
      );
    });
  });

  describe('findOne', () => {
    it('should return cached task if available', async () => {
      cacheService.getTask.mockResolvedValue(mockTask as Task);

      const result = await service.findOne('task-123');

      expect(cacheService.getTask).toHaveBeenCalledWith('task-123');
      expect(taskRepository.findOne).not.toHaveBeenCalled();
      expect(result).toEqual(mockTask);
    });

    it('should fetch from database and cache if not in cache', async () => {
      cacheService.getTask.mockResolvedValue(null);
      taskRepository.findOne.mockResolvedValue(mockTask as Task);

      const result = await service.findOne('task-123');

      expect(taskRepository.findOne).toHaveBeenCalled();
      expect(cacheService.setTask).toHaveBeenCalledWith('task-123', mockTask);
      expect(result).toEqual(mockTask);
    });

    it('should throw NotFoundException if task not found', async () => {
      cacheService.getTask.mockResolvedValue(null);
      taskRepository.findOne.mockResolvedValue(null);

      await expect(service.findOne('nonexistent')).rejects.toThrow();
    });
  });

  describe('findAll', () => {
    it('should return paginated tasks', async () => {
      const filters = { page: 1, limit: 10 };

      const result = await service.findAll(filters, 'user-123');

      expect(result).toHaveProperty('data');
      expect(result).toHaveProperty('total');
      expect(result).toHaveProperty('page');
      expect(result).toHaveProperty('limit');
      expect(result).toHaveProperty('totalPages');
    });

    it('should return cached list if available', async () => {
      const cachedResult = {
        data: [mockTask],
        total: 1,
        page: 1,
        limit: 10,
        totalPages: 1,
      };
      cacheService.getTaskList.mockResolvedValue(cachedResult);

      const filters = { page: 1, limit: 10 };
      const result = await service.findAll(filters, 'user-123');

      expect(cacheService.getTaskList).toHaveBeenCalled();
      expect(result).toEqual(cachedResult);
    });
  });

  describe('update', () => {
    it('should update task successfully', async () => {
      const updateDto = { title: 'Updated Title' };
      const updatedTask = { ...mockTask, title: 'Updated Title' };

      cacheService.getTask.mockResolvedValue(null);
      taskRepository.findOne.mockResolvedValue(mockTask as Task);
      taskRepository.save.mockResolvedValue(updatedTask as Task);

      const result = await service.update('task-123', updateDto, 'user-123');

      expect(taskRepository.save).toHaveBeenCalled();
      expect(cacheService.invalidateTask).toHaveBeenCalledWith('task-123');
      expect(result.title).toBe('Updated Title');
    });
  });

  describe('remove', () => {
    it('should delete task successfully', async () => {
      cacheService.getTask.mockResolvedValue(null);
      taskRepository.findOne.mockResolvedValue(mockTask as Task);

      await service.remove('task-123', 'user-123');

      expect(taskRepository.remove).toHaveBeenCalled();
      expect(cacheService.invalidateTask).toHaveBeenCalledWith('task-123');
    });
  });

  describe('getTaskStats', () => {
    it('should return task statistics', async () => {
      const result = await service.getTaskStats('user-123');

      expect(result).toHaveProperty('total');
      expect(result).toHaveProperty('todo');
      expect(result).toHaveProperty('in_progress');
      expect(result).toHaveProperty('done');
      expect(result).toHaveProperty('overdue');
    });
  });
});
