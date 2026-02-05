import { Injectable, OnApplicationBootstrap, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from './entities/user.entity';
import { TaskStatus, TaskPriority, Task } from '../tasks/entities/task.entity';
import { Notification, NotificationType } from '../notifications/entities/notification.entity';

@Injectable()
export class SeedService implements OnApplicationBootstrap {

  private readonly logger = new Logger(SeedService.name);

  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Task)
    private taskRepository: Repository<Task>,
    @InjectRepository(Notification)
    private notificationRepository: Repository<Notification>,
    private dataSource: DataSource,
  ) {}

  async onApplicationBootstrap() {
    // Attend que les tables de la base de données soient prêtes avant de lancer le seeding
    await this.waitForTables();
    await this.seedData();
  }

  private async waitForTables(): Promise<void> {
    let retries = 15;
    while (retries > 0) {
      try {
        // On vérifie que la table utilisateurs existe
        await this.dataSource.query(`SELECT 1 FROM information_schema.tables WHERE table_name = 'users'`);
        const result = await this.dataSource.query(`SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'users')`);
        
        if (result[0]?.exists) {
          this.logger.log('Les tables de la base de données sont prêtes');
          return;
        }
        throw new Error('Tableaux pas encore créés');
      } catch (error) {
        retries--;
        this.logger.warn(`En attente des tables de la base de données... (${retries} tentatives restantes)`);
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }
    this.logger.error('Les tables de base de données ne sont pas prêtes après les tentatives');
  }

  private async seedData(): Promise<void> {
    try {
      const userCount = await this.userRepository.count();
      if (userCount > 0) {
        this.logger.log('Données de démonstration déjà présentes');
        return;
      }

      this.logger.log('Création des données de démonstration...');

      // Create users
      const users = await this.seedUsers();
      
      // Create tasks
      await this.seedTasks(users);
      
      // Create notifications
      await this.seedNotifications(users);

      this.logger.log('Données de démonstration créées avec succès');
      this.logger.log('👤 Compte démo: demo@taskmanager.com / demo1234');
    } catch (error) {
      this.logger.error(`Erreur lors du seeding: ${error.message}`);
    }
  }

  private async seedUsers(): Promise<User[]> {
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash('demo1234', saltRounds);

    const usersData = [
      {
        email: 'demo@taskmanager.com',
        firstName: 'Demo',
        lastName: 'User',
        password: hashedPassword,
        role: 'admin' as const,
        isActive: true,
      },
      {
        email: 'alice@taskmanager.com',
        firstName: 'Alice',
        lastName: 'Yao',
        password: hashedPassword,
        role: 'user' as const,
        isActive: true,
      },
      {
        email: 'franck@taskmanager.com',
        firstName: 'Franck',
        lastName: 'Kouame',
        password: hashedPassword,
        role: 'user' as const,
        isActive: true,
      },
    ];

    const users: User[] = [];
    for (const userData of usersData) {
      const user = this.userRepository.create(userData);
      await this.userRepository.save(user);
      users.push(user);
      this.logger.log(`Utilisateur créé: ${userData.email}`);
    }

    return users;
  }

  private async seedTasks(users: User[]): Promise<void> {
    const [demoUser, alice, bob] = users;
    const now = new Date();
    
    const tasksData = [
      // Tâches à faire
      {
        title: 'Préparer la présentation client',
        description: 'Créer les slides pour la réunion de vendredi avec le client ABC. Inclure les métriques de performance et la roadmap Q2.',
        status: TaskStatus.TODO,
        priority: TaskPriority.HIGH,
        dueDate: new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000),
        tags: ['client', 'présentation', 'urgent'],
        createdById: demoUser.id,
        assigneeId: demoUser.id,
      },
      {
        title: 'Corriger le bug de connexion',
        description: 'Les utilisateurs signalent des déconnexions aléatoires sur mobile. Investiguer les logs et corriger.',
        status: TaskStatus.TODO,
        priority: TaskPriority.URGENT,
        dueDate: new Date(now.getTime() + 1 * 24 * 60 * 60 * 1000),
        tags: ['bug', 'mobile', 'authentification'],
        createdById: demoUser.id,
        assigneeId: bob.id,
      },
      {
        title: 'Rédiger la documentation API',
        description: 'Documenter les nouveaux endpoints REST avec des exemples de requêtes et réponses.',
        status: TaskStatus.TODO,
        priority: TaskPriority.MEDIUM,
        dueDate: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000),
        tags: ['documentation', 'api'],
        createdById: alice.id,
        assigneeId: demoUser.id,
      },
      {
        title: 'Mettre à jour les dépendances',
        description: 'Vérifier et mettre à jour les packages npm avec des vulnérabilités connues.',
        status: TaskStatus.TODO,
        priority: TaskPriority.LOW,
        dueDate: new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000),
        tags: ['maintenance', 'sécurité'],
        createdById: demoUser.id,
        assigneeId: alice.id,
      },

      // Tâches en cours
      {
        title: 'Implémenter le système de notifications',
        description: 'Ajouter les notifications push et email pour les événements importants.',
        status: TaskStatus.IN_PROGRESS,
        priority: TaskPriority.HIGH,
        dueDate: new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000),
        tags: ['feature', 'notifications'],
        createdById: demoUser.id,
        assigneeId: demoUser.id,
      },
      {
        title: 'Optimiser les requêtes SQL',
        description: 'Analyser les requêtes lentes avec EXPLAIN et ajouter les index nécessaires.',
        status: TaskStatus.IN_PROGRESS,
        priority: TaskPriority.MEDIUM,
        dueDate: new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000),
        tags: ['performance', 'database'],
        createdById: bob.id,
        assigneeId: bob.id,
      },
      {
        title: 'Créer les tests E2E',
        description: 'Écrire les tests end-to-end avec Playwright pour les parcours critiques.',
        status: TaskStatus.IN_PROGRESS,
        priority: TaskPriority.MEDIUM,
        dueDate: new Date(now.getTime() + 10 * 24 * 60 * 60 * 1000),
        tags: ['tests', 'qualité'],
        createdById: alice.id,
        assigneeId: alice.id,
      },

      // Tâches terminées
      {
        title: 'Configurer le pipeline CI/CD',
        description: 'Mettre en place GitHub Actions pour les tests automatiques et le déploiement.',
        status: TaskStatus.DONE,
        priority: TaskPriority.HIGH,
        dueDate: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000),
        tags: ['devops', 'ci-cd'],
        createdById: demoUser.id,
        assigneeId: demoUser.id,
        completedAt: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000),
      },
      {
        title: 'Refactoring du module d\'authentification',
        description: 'Améliorer la structure du code et ajouter le refresh token.',
        status: TaskStatus.DONE,
        priority: TaskPriority.MEDIUM,
        dueDate: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000),
        tags: ['refactoring', 'authentification'],
        createdById: alice.id,
        assigneeId: bob.id,
        completedAt: new Date(now.getTime() - 6 * 24 * 60 * 60 * 1000),
      },
      {
        title: 'Créer le design system',
        description: 'Définir les composants UI réutilisables avec Tailwind CSS.',
        status: TaskStatus.DONE,
        priority: TaskPriority.MEDIUM,
        dueDate: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000),
        tags: ['design', 'frontend'],
        createdById: bob.id,
        assigneeId: alice.id,
        completedAt: new Date(now.getTime() - 8 * 24 * 60 * 60 * 1000),
      },

      // Tâches en retard
      {
        title: 'Réviser les conditions générales',
        description: 'Mettre à jour les CGU avec les nouvelles réglementations RGPD.',
        status: TaskStatus.TODO,
        priority: TaskPriority.HIGH,
        dueDate: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000),
        tags: ['legal', 'rgpd'],
        createdById: demoUser.id,
        assigneeId: demoUser.id,
        isOverdue: true,
      },
      {
        title: 'Répondre aux tickets support',
        description: 'Traiter les 5 tickets en attente depuis la semaine dernière.',
        status: TaskStatus.IN_PROGRESS,
        priority: TaskPriority.URGENT,
        dueDate: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000),
        tags: ['support', 'client'],
        createdById: alice.id,
        assigneeId: bob.id,
        isOverdue: true,
      },

      // Tâche annulée
      {
        title: 'Intégration avec Slack (annulé)',
        description: 'Cette fonctionnalité a été reportée au Q3.',
        status: TaskStatus.CANCELLED,
        priority: TaskPriority.LOW,
        dueDate: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000),
        tags: ['intégration', 'slack'],
        createdById: demoUser.id,
        assigneeId: undefined,
      },
    ];

    for (const taskData of tasksData) {
      const task = this.taskRepository.create(taskData);
      await this.taskRepository.save(task);
    }

    this.logger.log(`${tasksData.length} tâches créées`);
  }

  private async seedNotifications(users: User[]): Promise<void> {
    const [demoUser, alice, bob] = users;
    const now = new Date();

    const notificationsData = [
      {
        userId: demoUser.id,
        type: NotificationType.TASK_ASSIGNED,
        title: 'Nouvelle tâche assignée',
        message: 'Alice vous a assigné la tâche "Rédiger la documentation API"',
        isRead: false,
        metadata: { taskTitle: 'Rédiger la documentation API' },
      },
      {
        userId: demoUser.id,
        type: NotificationType.TASK_OVERDUE,
        title: 'Tâche en retard',
        message: 'La tâche "Réviser les conditions générales" a dépassé son échéance',
        isRead: false,
        metadata: { taskTitle: 'Réviser les conditions générales' },
      },
      {
        userId: demoUser.id,
        type: NotificationType.TASK_COMPLETED,
        title: 'Tâche terminée',
        message: 'Franck a terminé la tâche "Refactorer le module d\'authentification"',
        isRead: true,
        metadata: { taskTitle: 'Refactorer le module d\'authentification' },
        readAt: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000),
      },
      {
        userId: demoUser.id,
        type: NotificationType.TASK_UPDATED,
        title: 'Tâche mise à jour',
        message: 'La priorité de "Corriger le bug de connexion" a été changée en Urgent',
        isRead: true,
        metadata: { taskTitle: 'Corriger le bug de connexion' },
        readAt: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000),
      },
      {
        userId: bob.id,
        type: NotificationType.TASK_ASSIGNED,
        title: 'Nouvelle tâche assignée',
        message: 'Demo User vous a assigné la tâche "Corriger le bug de connexion"',
        isRead: false,
        metadata: { taskTitle: 'Corriger le bug de connexion' },
      },
      {
        userId: alice.id,
        type: NotificationType.TASK_ASSIGNED,
        title: 'Nouvelle tâche assignée',
        message: 'Demo User vous a assigné la tâche "Mettre à jour les dépendances"',
        isRead: false,
        metadata: { taskTitle: 'Mettre à jour les dépendances' },
      },
    ];

    for (const notifData of notificationsData) {
      const notification = this.notificationRepository.create(notifData);
      await this.notificationRepository.save(notification);
    }

    this.logger.log(`${notificationsData.length} notifications créées`);
  }
}
