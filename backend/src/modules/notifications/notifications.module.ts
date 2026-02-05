import { Module } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { RabbitmqService } from './rabbitmq/rabbitmq.service';

@Module({
  providers: [NotificationsService, RabbitmqService]
})
export class NotificationsModule {}
