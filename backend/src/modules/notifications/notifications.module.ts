import { Module } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { RabbitmqService } from './rabbitmq/rabbitmq.service';
import { EmailService } from './email/email.service';

@Module({
  providers: [NotificationsService, RabbitmqService, EmailService]
})
export class NotificationsModule {}
