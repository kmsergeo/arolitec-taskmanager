import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

@Injectable()
export class CacheService implements OnModuleInit, OnModuleDestroy {
  private client: Redis;
  private readonly defaultTTL = 300; // 5 minutes

  constructor(private configService: ConfigService) {}

  onModuleInit() {
    this.client = new Redis({
      host: this.configService.get('REDIS_HOST', 'localhost'),
      port: this.configService.get<number>('REDIS_PORT', 6379),
      password: this.configService.get('REDIS_PASSWORD') || undefined,
      maxRetriesPerRequest: 3,
      lazyConnect: true,
    });

    this.client.connect().catch((err) => {
      console.error('Erreur de connexion Redis:', err);
    });

    this.client.on('connect', () => {
      console.log('Redis connecté');
    });

    this.client.on('error', (err) => {
      console.error('Erreur Redis:', err);
    });
  }

  onModuleDestroy() {
    this.client?.disconnect();
  }

  // Méthodes de cache génériques
  async get<T>(key: string): Promise<T | null> {
    const data = await this.client.get(key);
    if (!data) return null;
    try {
      return JSON.parse(data) as T;
    } catch {
      return data as unknown as T;
    }
  }

  async set(key: string, value: any, ttl: number = this.defaultTTL): Promise<void> {
    const serialized = typeof value === 'string' ? value : JSON.stringify(value);
    await this.client.setex(key, ttl, serialized);
  }

  async del(key: string): Promise<void> {
    await this.client.del(key);
  }

  async delByPattern(pattern: string): Promise<void> {
    const keys = await this.client.keys(pattern);
    if (keys.length > 0) {
      await this.client.del(...keys);
    }
  }

  // Méthodes de cache spécifiques aux tâches
  private getTaskKey(taskId: string): string {
    return `task:${taskId}`;
  }

  private getTaskListKey(userId: string, filters: string): string {
    return `tasks:${userId}:${filters}`;
  }

  async getTask<T>(taskId: string): Promise<T | null> {
    return this.get<T>(this.getTaskKey(taskId));
  }

  async setTask(taskId: string, task: any, ttl: number = 600): Promise<void> {
    await this.set(this.getTaskKey(taskId), task, ttl);
  }

  async invalidateTask(taskId: string): Promise<void> {
    await this.del(this.getTaskKey(taskId));
  }

  async getTaskList<T>(userId: string, filters: Record<string, any>): Promise<T | null> {
    const filterKey = Buffer.from(JSON.stringify(filters)).toString('base64');
    return this.get<T>(this.getTaskListKey(userId, filterKey));
  }

  async setTaskList(userId: string, filters: Record<string, any>, tasks: any, ttl: number = 120): Promise<void> {
    const filterKey = Buffer.from(JSON.stringify(filters)).toString('base64');
    await this.set(this.getTaskListKey(userId, filterKey), tasks, ttl);
  }

  // Invalider toutes les listes de tâches pour un utilisateur
  async invalidateUserTaskLists(userId: string): Promise<void> {
    await this.delByPattern(`tasks:${userId}:*`);
  }

  // Invalider tous les caches liés aux tâches
  async invalidateAllTasks(): Promise<void> {
    await this.delByPattern('task:*');
    await this.delByPattern('tasks:*');
  }

  // Vérifier la connexion Redis
  async ping(): Promise<boolean> {
    try {
      const result = await this.client.ping();
      return result === 'PONG';
    } catch {
      return false;
    }
  }
}
