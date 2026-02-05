import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as amqp from 'amqplib';

export interface NotificationMessage {
  type: 'task_assigned' | 'task_overdue' | 'task_completed' | 'task_updated';
  userId: string;
  taskId: string;
  taskTitle: string;
  email?: string;
  metadata?: Record<string, any>;
}

@Injectable()
export class RabbitMQService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RabbitMQService.name);
  private connection: amqp.Connection | null = null;
  private channel: amqp.Channel | null = null;
  private readonly exchangeName = 'taskflow.notifications';
  private readonly queueName = 'notifications.queue';
  private isConnected = false;
  private connectionPromise: Promise<void> | null = null;

  constructor(private configService: ConfigService) {}

  async onModuleInit() {
    this.connectionPromise = this.connect();
    await this.connectionPromise;
  }

  async onModuleDestroy() {
    await this.disconnect();
  }

  private async connect(): Promise<void> {
    try {
      const url = this.configService.get(
        'RABBITMQ_URL',
        'amqp://guest:guest@localhost:5672',
      );

      this.logger.log(`Connecting to RabbitMQ at ${url}...`);
      
      this.connection = await amqp.connect(url);
      this.channel = await this.connection.createChannel();

      // Configuration exchange
      await this.channel.assertExchange(this.exchangeName, 'topic', {
        durable: true,
      });

      // Configuration fil d'attente
      await this.channel.assertQueue(this.queueName, {
        durable: true,
      });

      // Liaision queue à exchange
      await this.channel.bindQueue(
        this.queueName,
        this.exchangeName,
        'notification.*',
      );

      this.isConnected = true;
      this.logger.log('RabbitMQ connecté avec succès');

      // Handle connection close
      this.connection.on('close', () => {
        this.logger.warn('Connexion RabbitMQ fermée, reconnexion...');
        this.isConnected = false;
        setTimeout(() => this.connect(), 5000);
      });

      this.connection.on('error', (err) => {
        this.logger.error('RabbitMQ erreur de connection:', err);
        this.isConnected = false;
      });

    } catch (error) {
      this.logger.error('RabbitMQ connection échouée:', error);
      this.isConnected = false;
      // Réessayer la connexion après 5 secondes
      setTimeout(() => this.connect(), 5000);
    }
  }

  private async disconnect() {
    try {
      if (this.channel) {
        await this.channel.close();
        this.channel = null;
      }
      if (this.connection) {
        await this.connection.close();
        this.connection = null;
      }
      this.isConnected = false;
    } catch (error) {
      this.logger.error('Erreur de déconnexion de RabbitMQ :', error);
    }
  }

  async publishNotification(message: NotificationMessage): Promise<boolean> {
    if (!this.isConnected || !this.channel) {
      this.logger.warn('RabbitMQ n\'est pas connecté, impossible de publier la notification');
      return false;
    }

    try {
      const routingKey = `notification.${message.type}`;
      const messageBuffer = Buffer.from(JSON.stringify(message));

      this.channel.publish(this.exchangeName, routingKey, messageBuffer, {
        persistent: true,
        contentType: 'application/json',
        timestamp: Date.now(),
      });

      this.logger.log(`Notification publiée: ${message.type} pour la tâche ${message.taskId}`);
      return true;
    } catch (error) {
      this.logger.error('Notification d\'erreur de publication :', error);
      return false;
    }
  }

  async consumeNotifications(
    handler: (message: NotificationMessage) => Promise<void>,
  ): Promise<void> {
    // Attend la connexion avant de démarrer
    if (this.connectionPromise) {
      await this.connectionPromise;
    }

    if (!this.isConnected || !this.channel) {
      this.logger.warn('RabbitMQ n\'est pas connecté, impossible de démarrer le consumer');
      return;
    }

    try {
      await this.channel.consume(
        this.queueName,
        async (msg) => {
          if (msg && this.channel) {
            try {
              const content = JSON.parse(msg.content.toString()) as NotificationMessage;
              await handler(content);
              this.channel.ack(msg);
            } catch (error) {
              this.logger.error('Notification d\'erreur de traitement :', error);
              // Accusé de réception négatif - remettre le message en file d'attente
              if (this.channel) {
                this.channel.nack(msg, false, true);
              }
            }
          }
        },
        { noAck: false },
      );
      this.logger.log('Le consommateur RabbitMQ a démarré avec succès');
    } catch (error) {
      this.logger.error('Erreur lors du démarrage du consommateur :', error);
    }
  }

  // Verifie si la connexion est ok 
  async checkConnection(): Promise<boolean> {
    return this.isConnected && this.channel !== null;
  }
}
