import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Notification, NotificationType } from './entities/notification.entity';
import { NotificationMessage, RabbitMQService } from './rabbitmq/rabbitmq.service';
import { EmailService } from './email/email.service';


@Injectable()
export class NotificationsService implements OnModuleInit {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(
    @InjectRepository(Notification)
    private notificationRepository: Repository<Notification>,
    private rabbitMQService: RabbitMQService,
    private emailService: EmailService,
  ) {}

  async onModuleInit() {
    // Consommer les notifications de RabbitMQ (non bloquantes)
    this.startConsumer().catch((err) => {
      this.logger.error('Échec de démarrage du consommateur de notification :', err);
    });
  }

  private async startConsumer() {
    await this.rabbitMQService.consumeNotifications(async (message) => {
      this.logger.log(`Notification de traitement : ${message.type}`);

      // Créer une notification dans l'application
      await this.createInAppNotification(message);

      // Envoyer une notification par e-mail
      await this.emailService.processNotification(message);
    });
  }

  private async createInAppNotification(message: NotificationMessage): Promise<Notification> {
    const notification = this.notificationRepository.create({
      userId: message.userId,
      type: message.type as NotificationType,
      title: this.getNotificationTitle(message.type),
      message: this.getNotificationMessage(message),
      metadata: {
        taskId: message.taskId,
        taskTitle: message.taskTitle,
        ...message.metadata,
      },
    });

    return this.notificationRepository.save(notification);
  }

  private getNotificationTitle(type: string): string {
    const titles: Record<string, string> = {
      task_assigned: 'Nouvelle tâche assignée',
      task_overdue: 'Tâche en retard',
      task_completed: 'Tâche terminée',
      task_updated: 'Tâche mise à jour',
    };
    return titles[type] || 'Notification';
  }

  private getNotificationMessage(message: NotificationMessage): string {
    switch (message.type) {
      case 'task_assigned':
        return `La tâche "${message.taskTitle}" vous a été assignée.`;
      case 'task_overdue':
        return `La tâche "${message.taskTitle}" a dépassé son échéance.`;
      case 'task_completed':
        return `La tâche "${message.taskTitle}" a été marquée comme terminée.`;
      case 'task_updated':
        return `La tâche "${message.taskTitle}" a été mise à jour.`;
      default:
        return message.taskTitle;
    }
  }

  // On récupères les notifications
  async getUserNotifications(
    userId: string,
    unreadOnly: boolean = false,
  ): Promise<Notification[]> {
    const query = this.notificationRepository
      .createQueryBuilder('notification')
      .where('notification.userId = :userId', { userId })
      .orderBy('notification.createdAt', 'DESC')
      .take(50);

    if (unreadOnly) {
      query.andWhere('notification.isRead = :isRead', { isRead: false });
    }

    return query.getMany();
  }

  async getUnreadCount(userId: string): Promise<number> {
    return this.notificationRepository.count({
      where: { userId, isRead: false },
    });
  }

  async markAsRead(notificationId: string, userId: string): Promise<Notification> {
    const notification = await this.notificationRepository.findOne({
      where: { id: notificationId, userId },
    });

    if (!notification) {
      throw new Error('Notification not found');
    }

    notification.isRead = true;
    notification.readAt = new Date();
    return this.notificationRepository.save(notification);
  }

  async markAllAsRead(userId: string): Promise<void> {
    await this.notificationRepository.update(
      { userId, isRead: false },
      { isRead: true, readAt: new Date() },
    );
  }

  async deleteNotification(notificationId: string, userId: string): Promise<void> {
    await this.notificationRepository.delete({ id: notificationId, userId });
  }

  // Méthode pour publier des notifications sur RabbitMQ
  async sendNotification(message: NotificationMessage): Promise<boolean> {
    return this.rabbitMQService.publishNotification(message);
  }
}
