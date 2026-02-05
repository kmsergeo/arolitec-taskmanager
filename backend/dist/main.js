"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@nestjs/core");
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const app_module_1 = require("./app.module");
async function bootstrap() {
    const logger = new common_1.Logger('Bootstrap');
    const app = await core_1.NestFactory.create(app_module_1.AppModule);
    app.setGlobalPrefix('api');
    app.useGlobalPipes(new common_1.ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
        transformOptions: {
            enableImplicitConversion: true,
        },
        exceptionFactory: (errors) => {
            const messages = errors.map(error => {
                const constraints = error.constraints;
                return constraints ? Object.values(constraints)[0] : 'Validation error';
            });
            return new (require('@nestjs/common').BadRequestException)(messages);
        },
    }));
    app.enableCors({
        origin: true,
        credentials: true,
        methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
    });
    const config = new swagger_1.DocumentBuilder()
        .setTitle('TaskManager API')
        .setDescription(`
      API de gestion de tâches avec messagerie temps réel.
      
      ## Fonctionnalités
      - Authentification JWT (register, login, profile)
      - CRUD complet des tâches avec filtres et pagination
      - Gestion des utilisateurs
      - Notifications in-app et email
      - Statistiques des tâches
      - Cache Redis pour les performances
      - RabbitMQ pour les notifications asynchrones
      
      ## Compte de démonstration
      - Email: demo@taskmanager.com
      - Mot de passe: demo1234
    `)
        .setVersion('1.0')
        .addBearerAuth({
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'JWT',
        description: 'Enter JWT token',
        in: 'header',
    }, 'JWT-auth')
        .addTag('auth', 'Authentification et gestion de session')
        .addTag('tasks', 'Gestion des tâches')
        .addTag('users', 'Gestion des utilisateurs')
        .addTag('notifications', 'Notifications in-app')
        .addTag('health', 'Vérification de l\'état des services')
        .build();
    const document = swagger_1.SwaggerModule.createDocument(app, config);
    swagger_1.SwaggerModule.setup('api/docs', app, document, {
        swaggerOptions: {
            persistAuthorization: true,
        },
    });
    const port = process.env.PORT || 3333;
    await app.listen(port, '0.0.0.0');
    logger.log(`API TaskManager exécutée sur http://0.0.0.0:${port}`);
    logger.log(`Documents Swagger disponibles sur http://localhost:${port}/api/docs`);
    logger.log(`Etat de santé à http://localhost:${port}/api/health`);
    logger.log(`Compte démo: demo@taskmanager.com / demo1234`);
}
bootstrap();
//# sourceMappingURL=main.js.map