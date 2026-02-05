# arolitec-askmanager

Application web full-stack de gestion de tâches avec système de messagerie en temps réel, notifications automatiques et cache intelligent.

📋 Table des Matières

  • Fonctionnalités
  • Architecture
  • Techno utilisées
  • Installation
  • Utilisation
  • API Documentation
  • Tests
  • Structure du Projet

✨ Fonctionnalités

  Backend

    ✅ API REST complète - CRUD complet pour les tâches
    ✅ Authentification JWT - Inscription, connexion, gestion des sessions
    ✅ Filtrage et pagination - Recherche avancée avec filtres multiples
    ✅ Validation des données - DTOs avec class-validator
    ✅ Cache Redis - Cache intelligent avec invalidation automatique
    ✅ Notifications RabbitMQ - Notifications in-app et email asynchrones
    ✅ Cron Jobs - Détection automatique des tâches en retard
    ✅ Documentation Swagger - API documentée automatiquement

  Frontend

    ✅ Interface moderne - Design responsive avec Tailwind CSS
    ✅ Dashboard interactif - Vue d'ensemble des tâches
    ✅ Filtres avancés - Recherche, tri, filtrage par statut/priorité
    ✅ Notifications temps réel - Centre de notifications
    ✅ Gestion utilisateurs - Profil et préférences
    ✅ Tests complets - Tests unitaires et E2E

🏛️ Architecture

┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│                 │     │                 │     │                 │
│    Frontend     │────▶│     Backend     │────▶│   PostgreSQL    │
│  React + Vite   │     │     NestJS      │     │                 │
│                 │     │                 │     └─────────────────┘
└─────────────────┘     └────────┬────────┘
                                 │
                    ┌────────────┴────────────┐
                    │                         │
              ┌─────▼─────┐           ┌───────▼───────┐
              │           │           │               │
              │   Redis   │           │   RabbitMQ    │
              │  (Cache)  │           │ (Messaging)   │
              │           │           │               │
              └───────────┘           └───────────────┘

🛠️ Technos utilisées

    Composant           Techno          Version   
    -------------------------------------------
    Backend             NestJS          10.x
    Frontend            React           18.x
    Language            TypeScript      5.x
    Database            PostgreSQL      16
    Cache               Redis           7.x
    Message Queue       RabbitMQ        3.x
    ORM                 TypeORM         0.3.x
    Containerisation    Docker          24.x

🚀 Installation

  Outils

    Docker et Docker Compose installés
    Node.js 20+ (pour le développement local)
    Git

  Démarrage Rapide

    # Clonage du repo
    git clone https://github.com/kmsergeo/arolitec-taskmanager.git
    cd arolitec-taskmanager

    # Démarrer l'application avec Docker Compose
    docker compose up -d

    # accès service/application :
    • Frontend:         http://localhost:3000
    • Backend API:      http://localhost:3333
    • Swagger:          http://localhost:3333/api/docs
    • RabbitMQ Manager: http://localhost:15672 (guest)
    • MailHog (emails): http://localhost:8025
