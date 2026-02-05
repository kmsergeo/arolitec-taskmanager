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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var NotificationsService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotificationsService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const notification_entity_1 = require("./entities/notification.entity");
const rabbitmq_service_1 = require("./rabbitmq/rabbitmq.service");
const email_service_1 = require("./email/email.service");
let NotificationsService = NotificationsService_1 = class NotificationsService {
    notificationRepository;
    rabbitMQService;
    emailService;
    logger = new common_1.Logger(NotificationsService_1.name);
    constructor(notificationRepository, rabbitMQService, emailService) {
        this.notificationRepository = notificationRepository;
        this.rabbitMQService = rabbitMQService;
        this.emailService = emailService;
    }
    async onModuleInit() {
        this.startConsumer().catch((err) => {
            this.logger.error('Échec de démarrage du consommateur de notification :', err);
        });
    }
    async startConsumer() {
        await this.rabbitMQService.consumeNotifications(async (message) => {
            this.logger.log(`Notification de traitement : ${message.type}`);
            await this.createInAppNotification(message);
            await this.emailService.processNotification(message);
        });
    }
    async createInAppNotification(message) {
        const notification = this.notificationRepository.create({
            userId: message.userId,
            type: message.type,
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
    getNotificationTitle(type) {
        const titles = {
            task_assigned: 'Nouvelle tâche assignée',
            task_overdue: 'Tâche en retard',
            task_completed: 'Tâche terminée',
            task_updated: 'Tâche mise à jour',
        };
        return titles[type] || 'Notification';
    }
    getNotificationMessage(message) {
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
    async getUserNotifications(userId, unreadOnly = false) {
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
    async getUnreadCount(userId) {
        return this.notificationRepository.count({
            where: { userId, isRead: false },
        });
    }
    async markAsRead(notificationId, userId) {
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
    async markAllAsRead(userId) {
        await this.notificationRepository.update({ userId, isRead: false }, { isRead: true, readAt: new Date() });
    }
    async deleteNotification(notificationId, userId) {
        await this.notificationRepository.delete({ id: notificationId, userId });
    }
    async sendNotification(message) {
        return this.rabbitMQService.publishNotification(message);
    }
};
exports.NotificationsService = NotificationsService;
exports.NotificationsService = NotificationsService = NotificationsService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(notification_entity_1.Notification)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        rabbitmq_service_1.RabbitMQService,
        email_service_1.EmailService])
], NotificationsService);
//# sourceMappingURL=notifications.service.js.map