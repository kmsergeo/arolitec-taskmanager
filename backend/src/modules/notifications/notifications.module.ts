import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Notification } from './entities/notification.entity';
import { NotificationsService } from './notifications.service';
import { NotificationsController } from './notifications.controller';
import { RabbitMQService } from './rabbitmq/rabbitmq.service';
import { EmailService } from './email/email.service';


@Module({
  imports: [TypeOrmModule.forFeature([Notification])],
  controllers: [NotificationsController],
  providers: [NotificationsService, RabbitMQService, EmailService],
  exports: [NotificationsService, RabbitMQService],
})
export class NotificationsModule {}
