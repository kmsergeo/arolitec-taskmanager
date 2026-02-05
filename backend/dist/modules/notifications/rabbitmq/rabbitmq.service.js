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
var RabbitMQService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.RabbitMQService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const amqp = __importStar(require("amqplib"));
let RabbitMQService = RabbitMQService_1 = class RabbitMQService {
    configService;
    logger = new common_1.Logger(RabbitMQService_1.name);
    connection = null;
    channel = null;
    exchangeName = 'taskflow.notifications';
    queueName = 'notifications.queue';
    isConnected = false;
    connectionPromise = null;
    constructor(configService) {
        this.configService = configService;
    }
    async onModuleInit() {
        this.connectionPromise = this.connect();
        await this.connectionPromise;
    }
    async onModuleDestroy() {
        await this.disconnect();
    }
    async connect() {
        try {
            const url = this.configService.get('RABBITMQ_URL', 'amqp://guest:guest@localhost:5672');
            this.logger.log(`Connecting to RabbitMQ at ${url}...`);
            this.connection = await amqp.connect(url);
            this.channel = await this.connection.createChannel();
            await this.channel.assertExchange(this.exchangeName, 'topic', {
                durable: true,
            });
            await this.channel.assertQueue(this.queueName, {
                durable: true,
            });
            await this.channel.bindQueue(this.queueName, this.exchangeName, 'notification.*');
            this.isConnected = true;
            this.logger.log('RabbitMQ connecté avec succès');
            this.connection.on('close', () => {
                this.logger.warn('Connexion RabbitMQ fermée, reconnexion...');
                this.isConnected = false;
                setTimeout(() => this.connect(), 5000);
            });
            this.connection.on('error', (err) => {
                this.logger.error('RabbitMQ erreur de connection:', err);
                this.isConnected = false;
            });
        }
        catch (error) {
            this.logger.error('RabbitMQ connection échouée:', error);
            this.isConnected = false;
            setTimeout(() => this.connect(), 5000);
        }
    }
    async disconnect() {
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
        }
        catch (error) {
            this.logger.error('Erreur de déconnexion de RabbitMQ :', error);
        }
    }
    async publishNotification(message) {
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
        }
        catch (error) {
            this.logger.error('Notification d\'erreur de publication :', error);
            return false;
        }
    }
    async consumeNotifications(handler) {
        if (this.connectionPromise) {
            await this.connectionPromise;
        }
        if (!this.isConnected || !this.channel) {
            this.logger.warn('RabbitMQ n\'est pas connecté, impossible de démarrer le consumer');
            return;
        }
        try {
            await this.channel.consume(this.queueName, async (msg) => {
                if (msg && this.channel) {
                    try {
                        const content = JSON.parse(msg.content.toString());
                        await handler(content);
                        this.channel.ack(msg);
                    }
                    catch (error) {
                        this.logger.error('Notification d\'erreur de traitement :', error);
                        if (this.channel) {
                            this.channel.nack(msg, false, true);
                        }
                    }
                }
            }, { noAck: false });
            this.logger.log('Le consommateur RabbitMQ a démarré avec succès');
        }
        catch (error) {
            this.logger.error('Erreur lors du démarrage du consommateur :', error);
        }
    }
    async checkConnection() {
        return this.isConnected && this.channel !== null;
    }
};
exports.RabbitMQService = RabbitMQService;
exports.RabbitMQService = RabbitMQService = RabbitMQService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], RabbitMQService);
//# sourceMappingURL=rabbitmq.service.js.map