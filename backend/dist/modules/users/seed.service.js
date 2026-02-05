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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var SeedService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.SeedService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const bcrypt = __importStar(require("bcrypt"));
const user_entity_1 = require("./entities/user.entity");
const task_entity_1 = require("../tasks/entities/task.entity");
let SeedService = SeedService_1 = class SeedService {
    userRepository;
    taskRepository;
    notificationRepository;
    dataSource;
    logger = new common_1.Logger(SeedService_1.name);
    constructor(userRepository, taskRepository, notificationRepository, dataSource) {
        this.userRepository = userRepository;
        this.taskRepository = taskRepository;
        this.notificationRepository = notificationRepository;
        this.dataSource = dataSource;
    }
    async onApplicationBootstrap() {
        await this.waitForTables();
        await this.seedData();
    }
    async waitForTables() {
        let retries = 15;
        while (retries > 0) {
            try {
                await this.dataSource.query(`SELECT 1 FROM information_schema.tables WHERE table_name = 'users'`);
                const result = await this.dataSource.query(`SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'users')`);
                if (result[0]?.exists) {
                    this.logger.log('Les tables de la base de données sont prêtes');
                    return;
                }
                throw new Error('Tableaux pas encore créés');
            }
            catch (error) {
                retries--;
                this.logger.warn(`En attente des tables de la base de données... (${retries} tentatives restantes)`);
                await new Promise(resolve => setTimeout(resolve, 2000));
            }
        }
        this.logger.error('Les tables de base de données ne sont pas prêtes après les tentatives');
    }
    async seedData() {
        try {
            const userCount = await this.userRepository.count();
            if (userCount > 0) {
                this.logger.log('Données de démonstration déjà présentes');
                return;
            }
            this.logger.log('Création des données de démonstration...');
            const users = await this.seedUsers();
            await this.seedTasks(users);
            await this.seedNotifications(users);
            this.logger.log('Données de démonstration créées avec succès');
            this.logger.log('👤 Compte démo: demo@taskmanager.com / demo1234');
        }
        catch (error) {
            this.logger.error(`Erreur lors du seeding: ${error.message}`);
        }
    }
    async seedUsers() {
        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash('demo1234', saltRounds);
        const usersData = [
            {
                email: 'demo@taskmanager.com',
                firstName: 'Demo',
                lastName: 'User',
                password: hashedPassword,
                role: 'admin',
                isActive: true,
            },
            {
                email: 'alice@taskmanager.com',
                firstName: 'Alice',
                lastName: 'Yao',
                password: hashedPassword,
                role: 'user',
                isActive: true,
            },
            {
                email: 'franck@taskmanager.com',
                firstName: 'Franck',
                lastName: 'Kouame',
                password: hashedPassword,
                role: 'user',
                isActive: true,
            },
        ];
        const users = [];
        for (const userData of usersData) {
            const user = this.userRepository.create(userData);
            await this.userRepository.save(user);
            users.push(user);
            this.logger.log(`Utilisateur créé: ${userData.email}`);
        }
        return users;
    }
    async seedTasks(users) {
        const [demoUser, alice, bob] = users;
        const now = new Date();
        const tasksData = [
            {
                title: 'Préparer la présentation client',
                description: 'Créer les slides pour la réunion de vendredi avec le client ABC. Inclure les métriques de performance et la roadmap Q2.',
                status: task_entity_1.TaskStatus.TODO,
                priority: task_entity_1.TaskPriority.HIGH,
                dueDate: new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000),
                tags: ['client', 'présentation', 'urgent'],
                createdById: demoUser.id,
                assigneeId: demoUser.id,
            },
            {
                title: 'Corriger le bug de connexion',
                description: 'Les utilisateurs signalent des déconnexions aléatoires sur mobile. Investiguer les logs et corriger.',
                status: task_entity_1.TaskStatus.TODO,
                priority: task_entity_1.TaskPriority.URGENT,
                dueDate: new Date(now.getTime() + 1 * 24 * 60 * 60 * 1000),
                tags: ['bug', 'mobile', 'authentification'],
                createdById: demoUser.id,
                assigneeId: bob.id,
            },
            {
                title: 'Rédiger la documentation API',
                description: 'Documenter les nouveaux endpoints REST avec des exemples de requêtes et réponses.',
                status: task_entity_1.TaskStatus.TODO,
                priority: task_entity_1.TaskPriority.MEDIUM,
                dueDate: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000),
                tags: ['documentation', 'api'],
                createdById: alice.id,
                assigneeId: demoUser.id,
            },
            {
                title: 'Mettre à jour les dépendances',
                description: 'Vérifier et mettre à jour les packages npm avec des vulnérabilités connues.',
                status: task_entity_1.TaskStatus.TODO,
                priority: task_entity_1.TaskPriority.LOW,
                dueDate: new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000),
                tags: ['maintenance', 'sécurité'],
                createdById: demoUser.id,
                assigneeId: alice.id,
            },
            {
                title: 'Implémenter le système de notifications',
                description: 'Ajouter les notifications push et email pour les événements importants.',
                status: task_entity_1.TaskStatus.IN_PROGRESS,
                priority: task_entity_1.TaskPriority.HIGH,
                dueDate: new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000),
                tags: ['feature', 'notifications'],
                createdById: demoUser.id,
                assigneeId: demoUser.id,
            },
            {
                title: 'Optimiser les requêtes SQL',
                description: 'Analyser les requêtes lentes avec EXPLAIN et ajouter les index nécessaires.',
                status: task_entity_1.TaskStatus.IN_PROGRESS,
                priority: task_entity_1.TaskPriority.MEDIUM,
                dueDate: new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000),
                tags: ['performance', 'database'],
                createdById: bob.id,
                assigneeId: bob.id,
            },
            {
                title: 'Créer les tests E2E',
                description: 'Écrire les tests end-to-end avec Playwright pour les parcours critiques.',
                status: task_entity_1.TaskStatus.IN_PROGRESS,
                priority: task_entity_1.TaskPriority.MEDIUM,
                dueDate: new Date(now.getTime() + 10 * 24 * 60 * 60 * 1000),
                tags: ['tests', 'qualité'],
                createdById: alice.id,
                assigneeId: alice.id,
            },
            {
                title: 'Configurer le pipeline CI/CD',
                description: 'Mettre en place GitHub Actions pour les tests automatiques et le déploiement.',
                status: task_entity_1.TaskStatus.DONE,
                priority: task_entity_1.TaskPriority.HIGH,
                dueDate: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000),
                tags: ['devops', 'ci-cd'],
                createdById: demoUser.id,
                assigneeId: demoUser.id,
                completedAt: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000),
            },
            {
                title: 'Refactoring du module d\'authentification',
                description: 'Améliorer la structure du code et ajouter le refresh token.',
                status: task_entity_1.TaskStatus.DONE,
                priority: task_entity_1.TaskPriority.MEDIUM,
                dueDate: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000),
                tags: ['refactoring', 'authentification'],
                createdById: alice.id,
                assigneeId: bob.id,
                completedAt: new Date(now.getTime() - 6 * 24 * 60 * 60 * 1000),
            },
            {
                title: 'Créer le design system',
                description: 'Définir les composants UI réutilisables avec Tailwind CSS.',
                status: task_entity_1.TaskStatus.DONE,
                priority: task_entity_1.TaskPriority.MEDIUM,
                dueDate: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000),
                tags: ['design', 'frontend'],
                createdById: bob.id,
                assigneeId: alice.id,
                completedAt: new Date(now.getTime() - 8 * 24 * 60 * 60 * 1000),
            },
            {
                title: 'Réviser les conditions générales',
                description: 'Mettre à jour les CGU avec les nouvelles réglementations RGPD.',
                status: task_entity_1.TaskStatus.TODO,
                priority: task_entity_1.TaskPriority.HIGH,
                dueDate: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000),
                tags: ['legal', 'rgpd'],
                createdById: demoUser.id,
                assigneeId: demoUser.id,
                isOverdue: true,
            },
            {
                title: 'Répondre aux tickets support',
                description: 'Traiter les 5 tickets en attente depuis la semaine dernière.',
                status: task_entity_1.TaskStatus.IN_PROGRESS,
                priority: task_entity_1.TaskPriority.URGENT,
                dueDate: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000),
                tags: ['support', 'client'],
                createdById: alice.id,
                assigneeId: bob.id,
                isOverdue: true,
            },
            {
                title: 'Intégration avec Slack (annulé)',
                description: 'Cette fonctionnalité a été reportée au Q3.',
                status: task_entity_1.TaskStatus.CANCELLED,
                priority: task_entity_1.TaskPriority.LOW,
                dueDate: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000),
                tags: ['intégration', 'slack'],
                createdById: demoUser.id,
                assigneeId: null,
            },
        ];
        for (const taskData of tasksData) {
            const task = this.taskRepository.create(taskData);
            await this.taskRepository.save(task);
        }
        this.logger.log(`${tasksData.length} tâches créées`);
    }
    async seedNotifications(users) {
        const [demoUser, alice, bob] = users;
        const now = new Date();
    }
};
exports.SeedService = SeedService;
exports.SeedService = SeedService = SeedService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(user_entity_1.User)),
    __param(1, (0, typeorm_1.InjectRepository)(task_entity_1.Task)),
    __param(2, (0, typeorm_1.InjectRepository)(Notification)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.DataSource])
], SeedService);
//# sourceMappingURL=seed.service.js.map