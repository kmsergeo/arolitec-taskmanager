"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var EmailService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.EmailService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const nodemailer = __importStar(require("nodemailer"));
let EmailService = EmailService_1 = class EmailService {
    configService;
    logger = new common_1.Logger(EmailService_1.name);
    transporter;
    constructor(configService) {
        this.configService = configService;
        const smtpUser = this.configService.get('SMTP_USER');
        const smtpPass = this.configService.get('SMTP_PASS');
        const transportConfig = {
            host: this.configService.get('SMTP_HOST', 'localhost'),
            port: this.configService.get('SMTP_PORT', 1025),
            secure: this.configService.get('SMTP_SECURE') === 'true',
        };
        if (smtpUser && smtpPass) {
            transportConfig.auth = {
                user: smtpUser,
                pass: smtpPass,
            };
        }
        this.transporter = nodemailer.createTransport(transportConfig);
        this.logger.log(`Email service configured with SMTP host: ${transportConfig.host}:${transportConfig.port}`);
    }
    async sendTaskOverdueEmail(to, taskTitle, taskId) {
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
    async sendTaskAssignedEmail(to, taskTitle, taskId, assignedBy) {
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
    async sendTaskCompletedEmail(to, taskTitle, taskId, completedBy) {
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
    async processNotification(notification) {
        if (!notification.email) {
            this.logger.log('Aucune adresse e-mail fournie, notification par courriel ignorée');
            return;
        }
        try {
            switch (notification.type) {
                case 'task_overdue':
                    await this.sendTaskOverdueEmail(notification.email, notification.taskTitle, notification.taskId);
                    break;
                case 'task_assigned':
                    await this.sendTaskAssignedEmail(notification.email, notification.taskTitle, notification.taskId, notification.metadata?.assignedBy || 'Quelqu\'un');
                    break;
                case 'task_completed':
                    await this.sendTaskCompletedEmail(notification.email, notification.taskTitle, notification.taskId, notification.metadata?.completedBy || '');
                    break;
                default:
                    this.logger.log(`E-mail non implémenté pour le type de notification: ${notification.type}`);
            }
        }
        catch (error) {
            this.logger.error(`Échec de l'envoi de la notification par e-mail : ${error.message}`);
        }
    }
};
exports.EmailService = EmailService;
exports.EmailService = EmailService = EmailService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], EmailService);
//# sourceMappingURL=email.service.js.map