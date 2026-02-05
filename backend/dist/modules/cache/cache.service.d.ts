import { OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
export declare class CacheService implements OnModuleInit, OnModuleDestroy {
    private configService;
    private client;
    private readonly defaultTTL;
    constructor(configService: ConfigService);
    onModuleInit(): void;
    onModuleDestroy(): void;
    get<T>(key: string): Promise<T | null>;
    set(key: string, value: any, ttl?: number): Promise<void>;
    del(key: string): Promise<void>;
    delByPattern(pattern: string): Promise<void>;
    private getTaskKey;
    private getTaskListKey;
    getTask<T>(taskId: string): Promise<T | null>;
    setTask(taskId: string, task: any, ttl?: number): Promise<void>;
    invalidateTask(taskId: string): Promise<void>;
    getTaskList<T>(userId: string, filters: Record<string, any>): Promise<T | null>;
    setTaskList(userId: string, filters: Record<string, any>, tasks: any, ttl?: number): Promise<void>;
    invalidateUserTaskLists(userId: string): Promise<void>;
    invalidateAllTasks(): Promise<void>;
    ping(): Promise<boolean>;
}
