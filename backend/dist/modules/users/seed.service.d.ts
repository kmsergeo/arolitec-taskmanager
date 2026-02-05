import { OnApplicationBootstrap } from '@nestjs/common';
import { Repository, DataSource } from 'typeorm';
import { User } from './entities/user.entity';
import { Task } from '../tasks/entities/task.entity';
export declare class SeedService implements OnApplicationBootstrap {
    private userRepository;
    private taskRepository;
    private notificationRepository;
    private dataSource;
    private readonly logger;
    constructor(userRepository: Repository<User>, taskRepository: Repository<Task>, notificationRepository: Repository<Notification>, dataSource: DataSource);
    onApplicationBootstrap(): Promise<void>;
    private waitForTables;
    private seedData;
    private seedUsers;
    private seedTasks;
    private seedNotifications;
}
