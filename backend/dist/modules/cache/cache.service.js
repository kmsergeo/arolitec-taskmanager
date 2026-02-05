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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CacheService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const ioredis_1 = __importDefault(require("ioredis"));
let CacheService = class CacheService {
    configService;
    client;
    defaultTTL = 300;
    constructor(configService) {
        this.configService = configService;
    }
    onModuleInit() {
        this.client = new ioredis_1.default({
            host: this.configService.get('REDIS_HOST', 'localhost'),
            port: this.configService.get('REDIS_PORT', 6379),
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
    async get(key) {
        const data = await this.client.get(key);
        if (!data)
            return null;
        try {
            return JSON.parse(data);
        }
        catch {
            return data;
        }
    }
    async set(key, value, ttl = this.defaultTTL) {
        const serialized = typeof value === 'string' ? value : JSON.stringify(value);
        await this.client.setex(key, ttl, serialized);
    }
    async del(key) {
        await this.client.del(key);
    }
    async delByPattern(pattern) {
        const keys = await this.client.keys(pattern);
        if (keys.length > 0) {
            await this.client.del(...keys);
        }
    }
    getTaskKey(taskId) {
        return `task:${taskId}`;
    }
    getTaskListKey(userId, filters) {
        return `tasks:${userId}:${filters}`;
    }
    async getTask(taskId) {
        return this.get(this.getTaskKey(taskId));
    }
    async setTask(taskId, task, ttl = 600) {
        await this.set(this.getTaskKey(taskId), task, ttl);
    }
    async invalidateTask(taskId) {
        await this.del(this.getTaskKey(taskId));
    }
    async getTaskList(userId, filters) {
        const filterKey = Buffer.from(JSON.stringify(filters)).toString('base64');
        return this.get(this.getTaskListKey(userId, filterKey));
    }
    async setTaskList(userId, filters, tasks, ttl = 120) {
        const filterKey = Buffer.from(JSON.stringify(filters)).toString('base64');
        await this.set(this.getTaskListKey(userId, filterKey), tasks, ttl);
    }
    async invalidateUserTaskLists(userId) {
        await this.delByPattern(`tasks:${userId}:*`);
    }
    async invalidateAllTasks() {
        await this.delByPattern('task:*');
        await this.delByPattern('tasks:*');
    }
    async ping() {
        try {
            const result = await this.client.ping();
            return result === 'PONG';
        }
        catch {
            return false;
        }
    }
};
exports.CacheService = CacheService;
exports.CacheService = CacheService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], CacheService);
//# sourceMappingURL=cache.service.js.map