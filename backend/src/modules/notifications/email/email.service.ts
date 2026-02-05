import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import { NotificationMessage } from '../rabbitmq/rabbitmq.service';


@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private transporter: nodemailer.Transporter;

  constructor(private configService: ConfigService) {
    const smtpUser = this.configService.get('SMTP_USER');
    const smtpPass = this.configService.get('SMTP_PASS');

    const transportConfig: any = {
      host: this.configService.get('SMTP_HOST', 'localhost'),
      port: this.configService.get<number>('SMTP_PORT', 1025),
      secure: this.configService.get('SMTP_SECURE') === 'true',
    };

    // Ajoute l'authentification uniquement si les informations d'identification sont fournies
    if (smtpUser && smtpPass) {
      transportConfig.auth = {
        user: smtpUser,
        pass: smtpPass,
      };
    }

    this.transporter = nodemailer.createTransport(transportConfig);
    this.logger.log(`Email service configured with SMTP host: ${transportConfig.host}:${transportConfig.port}`);
  }

  async sendTaskOverdueEmail(
    to: string,
    taskTitle: string,
    taskId: string,
  ): Promise<void> {
    const frontendUrl = this.configService.get('FRONTEND_URL', 'http://localhost:3000');

    await this.transporter.sendMail({
      from: this.configService.get('SMTP_FROM', 'TaskFlow <noreply@taskmanager.local>'),
      to,
      subject: `Tâche en retard: ${taskTitle}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; border-radius: 10px 10px 0 0; }
            .content { background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px; }
            .button { display: inline-block; background: #667eea; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin-top: 20px; }
            .warning { background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>TaskFlow</h1>
            </div>
            <div class="content">
              <div class="warning">
                <strong>Attention!</strong> La tâche suivante a dépassé son échéance.
              </div>
              <h2>${taskTitle}</h2>
              <p>Cette tâche nécessite votre attention immédiate.</p>
              <a href="${frontendUrl}/tasks/${taskId}" class="button">Voir la tâche</a>
            </div>
          </div>
        </body>
        </html>
      `,
    });

    console.log(`E-mail en retard envoyé à ${to} pour la tâche: ${taskTitle}`);
  }

  async sendTaskAssignedEmail(
    to: string,
    taskTitle: string,
    taskId: string,
    assignedBy: string,
  ): Promise<void> {
    const frontendUrl = this.configService.get('FRONTEND_URL', 'http://localhost:3000');

    await this.transporter.sendMail({
      from: this.configService.get('SMTP_FROM', 'TaskFlow <noreply@taskmanager.local>'),
      to,
      subject: `Nouvelle tâche assignée: ${taskTitle}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; border-radius: 10px 10px 0 0; }
            .content { background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px; }
            .button { display: inline-block; background: #667eea; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin-top: 20px; }
            .info { background: #d1ecf1; border-left: 4px solid #17a2b8; padding: 15px; margin: 20px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>TaskFlow</h1>
            </div>
            <div class="content">
              <div class="info">
                <strong>Nouvelle tâche!</strong> ${assignedBy} vous a assigné une tâche.
              </div>
              <h2>${taskTitle}</h2>
              <p>Cliquez sur le bouton ci-dessous pour voir les détails.</p>
              <a href="${frontendUrl}/tasks/${taskId}" class="button">Voir la tâche</a>
            </div>
          </div>
        </body>
        </html>
      `,
    });

    console.log(`E-mail de mission envoyé à ${to} pour la tâche: ${taskTitle}`);
  }

  async sendTaskCompletedEmail(
    to: string,
    taskTitle: string,
    taskId: string,
    completedBy: string,
  ): Promise<void> {
    const frontendUrl = this.configService.get('FRONTEND_URL', 'http://localhost:3000');

    await this.transporter.sendMail({
      from: this.configService.get('SMTP_FROM', 'TaskFlow <noreply@taskmanager.local>'),
      to,
      subject: `Tâche terminée: ${taskTitle}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; border-radius: 10px 10px 0 0; }
            .content { background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px; }
            .button { display: inline-block; background: #667eea; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin-top: 20px; }
            .success { background: #d4edda; border-left: 4px solid #28a745; padding: 15px; margin: 20px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>TaskFlow</h1>
            </div>
            <div class="content">
              <div class="success">
                <strong>Bonne nouvelle!</strong> Une tâche a été complétée${completedBy ? ` par ${completedBy}` : ''}.
              </div>
              <h2>${taskTitle}</h2>
              <p>Cette tâche est maintenant terminée.</p>
              <a href="${frontendUrl}/tasks/${taskId}" class="button">Voir la tâche</a>
            </div>
          </div>
        </body>
        </html>
      `,
    });

    this.logger.log(`E-mail de finalisation envoyé à ${to} pour la tâche: ${taskTitle}`);
  }

  async processNotification(notification: NotificationMessage): Promise<void> {
    if (!notification.email) {
      this.logger.log('Aucune adresse e-mail fournie, notification par courriel ignorée');
      return;
    }

    try {
      switch (notification.type) {
        case 'task_overdue':
          await this.sendTaskOverdueEmail(
            notification.email,
            notification.taskTitle,
            notification.taskId,
          );
          break;
        case 'task_assigned':
          await this.sendTaskAssignedEmail(
            notification.email,
            notification.taskTitle,
            notification.taskId,
            notification.metadata?.assignedBy || 'Quelqu\'un',
          );
          break;
        case 'task_completed':
          await this.sendTaskCompletedEmail(
            notification.email,
            notification.taskTitle,
            notification.taskId,
            notification.metadata?.completedBy || '',
          );
          break;
        default:
          this.logger.log(`E-mail non implémenté pour le type de notification: ${notification.type}`);
      }
    } catch (error) {
      this.logger.error(`Échec de l'envoi de la notification par e-mail : ${error.message}`);
    }
  }
}
