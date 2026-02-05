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
Object.defineProperty(exports, "__esModule", { value: true });
exports.HealthController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const cache_service_1 = require("../cache/cache.service");
const typeorm_1 = require("typeorm");
const rabbitmq_service_1 = require("../notifications/rabbitmq/rabbitmq.service");
let HealthController = class HealthController {
    cacheService;
    rabbitMQService;
    dataSource;
    constructor(cacheService, rabbitMQService, dataSource) {
        this.cacheService = cacheService;
        this.rabbitMQService = rabbitMQService;
        this.dataSource = dataSource;
    }
    async check() {
        const [redis, rabbitmq, postgres] = await Promise.all([
            this.checkRedis(),
            this.checkRabbitMQ(),
            this.checkPostgres(),
        ]);
        const allHealthy = redis.status === 'up' &&
            rabbitmq.status === 'up' &&
            postgres.status === 'up';
        return {
            status: allHealthy ? 'healthy' : 'degraded',
            timestamp: new Date().toISOString(),
            services: {
                redis,
                rabbitmq,
                postgres,
            },
        };
    }
    async live() {
        return { status: 'ok' };
    }
    async ready() {
        const health = await this.check();
        return {
            ready: health.status === 'healthy',
            ...health,
        };
    }
    async checkRedis() {
        try {
            const start = Date.now();
            const isConnected = await this.cacheService.ping();
            const latency = Date.now() - start;
            return {
                status: isConnected ? 'up' : 'down',
                latency,
            };
        }
        catch {
            return { status: 'down' };
        }
    }
    async checkRabbitMQ() {
        try {
            const isConnected = await this.rabbitMQService.checkConnection();
            return { status: isConnected ? 'up' : 'down' };
        }
        catch {
            return { status: 'down' };
        }
    }
    async checkPostgres() {
        try {
            const start = Date.now();
            await this.dataSource.query('SELECT 1');
            const latency = Date.now() - start;
            return { status: 'up', latency };
        }
        catch {
            return { status: 'down' };
        }
    }
};
exports.HealthController = HealthController;
__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({ summary: 'Vérifier l\'état de tous les services' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], HealthController.prototype, "check", null);
__decorate([
    (0, common_1.Get)('live'),
    (0, swagger_1.ApiOperation)({ summary: 'Liveness probe' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], HealthController.prototype, "live", null);
__decorate([
    (0, common_1.Get)('ready'),
    (0, swagger_1.ApiOperation)({ summary: 'Readiness probe' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], HealthController.prototype, "ready", null);
exports.HealthController = HealthController = __decorate([
    (0, swagger_1.ApiTags)('health'),
    (0, common_1.Controller)('health'),
    __metadata("design:paramtypes", [cache_service_1.CacheService,
        rabbitmq_service_1.RabbitMQService,
        typeorm_1.DataSource])
], HealthController);
//# sourceMappingURL=health.controller.js.map