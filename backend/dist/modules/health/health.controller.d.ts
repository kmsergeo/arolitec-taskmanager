import { CacheService } from '../cache/cache.service';
import { DataSource } from 'typeorm';
import { RabbitMQService } from '../notifications/rabbitmq/rabbitmq.service';
export declare class HealthController {
    private cacheService;
    private rabbitMQService;
    private dataSource;
    constructor(cacheService: CacheService, rabbitMQService: RabbitMQService, dataSource: DataSource);
    check(): Promise<{
        status: string;
        timestamp: string;
        services: {
            redis: {
                status: string;
                latency?: number;
            };
            rabbitmq: {
                status: string;
            };
            postgres: {
                status: string;
                latency?: number;
            };
        };
    }>;
    live(): Promise<{
        status: string;
    }>;
    ready(): Promise<{
        status: string;
        timestamp: string;
        services: {
            redis: {
                status: string;
                latency?: number;
            };
            rabbitmq: {
                status: string;
            };
            postgres: {
                status: string;
                latency?: number;
            };
        };
        ready: boolean;
    }>;
    private checkRedis;
    private checkRabbitMQ;
    private checkPostgres;
}
