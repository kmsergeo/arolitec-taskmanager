import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { CacheService } from '../cache/cache.service';
import { DataSource } from 'typeorm';
import { RabbitMQService } from '../notifications/rabbitmq/rabbitmq.service';

@ApiTags('health')
@Controller('health')
export class HealthController {
  constructor(
    private cacheService: CacheService,
    private rabbitMQService: RabbitMQService,
    private dataSource: DataSource,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Vérifier l\'état de tous les services' })
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

  @Get('live')
  @ApiOperation({ summary: 'Liveness probe' })
  async live() {
    return { status: 'ok' };
  }

  @Get('ready')
  @ApiOperation({ summary: 'Readiness probe' })
  async ready() {
    const health = await this.check();
    return {
      ready: health.status === 'healthy',
      ...health,
    };
  }

  private async checkRedis(): Promise<{ status: string; latency?: number }> {
    try {
      const start = Date.now();
      const isConnected = await this.cacheService.ping();
      const latency = Date.now() - start;
      return { 
        status: isConnected ? 'up' : 'down',
        latency,
      };
    } catch {
      return { status: 'down' };
    }
  }

  private async checkRabbitMQ(): Promise<{ status: string }> {
    try {
      const isConnected = await this.rabbitMQService.checkConnection();
      return { status: isConnected ? 'up' : 'down' };
    } catch {
      return { status: 'down' };
    }
  }

  private async checkPostgres(): Promise<{ status: string; latency?: number }> {
    try {
      const start = Date.now();
      await this.dataSource.query('SELECT 1');
      const latency = Date.now() - start;
      return { status: 'up', latency };
    } catch {
      return { status: 'down' };
    }
  }
}
