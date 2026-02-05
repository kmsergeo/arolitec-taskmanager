import { Module } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { RabbitMQService } from './rabbitmq/rabbitmq.service';
import { EmailService } from './email/email.service';
import { NotificationsController } from './notifications.controller';

@Module({
  providers: [NotificationsService, RabbitMQService, EmailService],
  controllers: [NotificationsController]
})
export class NotificationsModule {}
