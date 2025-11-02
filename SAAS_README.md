# 🚀 Claudeus WordPress AI Assistant SaaS

> Plateforme SaaS permettant aux utilisateurs d'avoir un assistant WordPress/WooCommerce alimenté par IA (OpenAI/Anthropic)

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Docker](https://img.shields.io/badge/Docker-Ready-blue.svg)](https://www.docker.com/)
[![TypeScript](https://img.shields.io/badge/TypeScript-100%25-blue.svg)](https://www.typescriptlang.org/)

---

## 📋 Table des Matières

- [Vue d'ensemble](#vue-densemble)
- [Architecture](#architecture)
- [Installation](#installation)
- [Configuration](#configuration)
- [Utilisation](#utilisation)
- [API Documentation](#api-documentation)
- [Plans d'Abonnement](#plans-dabonnement)

---

## 🎯 Vue d'ensemble

Claudeus WordPress AI Assistant SaaS est une plateforme complète qui permet aux utilisateurs de :

✅ **Gérer plusieurs sites WordPress** via une interface web ou CLI
✅ **Utiliser leurs propres clés API** OpenAI ou Anthropic
✅ **Automatiser les tâches WordPress** avec 145 outils MCP
✅ **Discuter avec un assistant IA** pour gérer leur contenu
✅ **Choisir leur plan d'abonnement** (Free, Pro, Enterprise)

### Stack Technique

| Composant | Technologies |
|-----------|-------------|
| **Backend** | Node.js, Express, TypeScript, Prisma ORM |
| **Frontend** | Next.js 14, React, Tailwind CSS, Shadcn/ui |
| **CLI** | Node.js, Commander.js, Inquirer.js |
| **Database** | PostgreSQL 16 |
| **Cache** | Redis 7 |
| **MCP Server** | Serveur MCP WordPress (145 outils) |
| **AI** | OpenAI SDK, Anthropic SDK |
| **Payment** | Stripe |
| **Deployment** | Docker, Docker Compose |

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────┐
│          USERS (Web + CLI)              │
└─────────────┬───────────────────────────┘
              │
     ┌────────▼────────┐
     │  Nginx (Proxy)  │
     └────────┬────────┘
              │
    ┌─────────┴──────────┐
    │                    │
┌───▼─────┐      ┌──────▼──────┐
│Frontend │      │   Backend   │
│Next.js  │      │  Express    │
└─────────┘      └──────┬──────┘
                        │
         ┌──────────────┼──────────────┐
         │              │              │
    ┌────▼─────┐  ┌────▼────┐  ┌─────▼─────┐
    │PostgreSQL│  │  Redis  │  │MCP Server │
    └──────────┘  └─────────┘  └───────────┘
```

### Composants

1. **Frontend** (Next.js) - Interface web pour les utilisateurs
2. **Backend** (Express) - API REST avec authentification JWT
3. **CLI** - Client en ligne de commande
4. **MCP Server** - Serveur MCP WordPress (145 outils)
5. **PostgreSQL** - Base de données principale
6. **Redis** - Cache et gestion des sessions
7. **Nginx** - Reverse proxy et load balancer

---

## 📦 Installation

### Prérequis

- Node.js ≥ 22.0.0
- pnpm (recommandé) ou npm
- Docker et Docker Compose
- PostgreSQL 16 (si non Docker)

### Option 1: Installation avec Docker (Recommandée)

```bash
# Cloner le repository
git clone https://github.com/deus-h/claudeus-wp-mcp.git
cd claudeus-wp-mcp

# Copier et configurer les variables d'environnement
cp .env.example .env
# Éditer .env avec vos valeurs

# Démarrer tous les services
docker-compose up -d

# Vérifier que tout fonctionne
docker-compose ps
```

**Services disponibles :**
- Frontend: http://localhost:3000
- Backend API: http://localhost:3001
- MCP Server: http://localhost:3002
- PostgreSQL: localhost:5432
- Redis: localhost:6379

### Option 2: Installation Manuelle (Développement)

```bash
# 1. Cloner le repository
git clone https://github.com/deus-h/claudeus-wp-mcp.git
cd claudeus-wp-mcp

# 2. Installer les dépendances
pnpm install

# 3. Configurer les variables d'environnement
cp .env.example .env
# Éditer .env avec vos valeurs

# 4. Démarrer PostgreSQL et Redis (via Docker ou manuellement)
docker run -d -p 5432:5432 -e POSTGRES_PASSWORD=password postgres:16
docker run -d -p 6379:6379 redis:7-alpine

# 5. Initialiser la base de données
cd packages/backend
pnpm prisma:migrate
pnpm prisma:generate

# 6. Démarrer les services
# Terminal 1 - Backend
cd packages/backend
pnpm dev

# Terminal 2 - Frontend (à créer)
cd packages/frontend
pnpm dev

# Terminal 3 - MCP Server
pnpm dev
```

---

## ⚙️ Configuration

### 1. Variables d'Environnement

Éditez le fichier `.env` :

```bash
# JWT Secrets (GÉNÉRER DES VALEURS SÉCURISÉES!)
JWT_ACCESS_SECRET="votre-secret-access-32-caracteres-minimum"
JWT_REFRESH_SECRET="votre-secret-refresh-32-caracteres-minimum"

# Encryption Key (EXACTEMENT 32 CARACTÈRES!)
ENCRYPTION_KEY="votre-cle-de-32-caracteres-ici"

# Database
DATABASE_URL="postgresql://user:password@localhost:5432/claudeus_wp_saas"

# Stripe (obtenir sur https://dashboard.stripe.com)
STRIPE_SECRET_KEY="sk_test_..."
STRIPE_WEBHOOK_SECRET="whsec_..."
```

### 2. Générer des Secrets Sécurisés

```bash
# Générer JWT secrets
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"

# Générer encryption key (32 caractères)
node -e "console.log(require('crypto').randomBytes(16).toString('hex'))"
```

### 3. Stripe Configuration

1. Créer un compte sur [Stripe](https://stripe.com)
2. Obtenir les clés API dans Dashboard → Developers → API keys
3. Configurer les webhooks pour `/api/v1/webhooks/stripe`

---

## 🎮 Utilisation

### Interface Web

1. Accéder à http://localhost:3000
2. Créer un compte
3. Ajouter vos clés API (OpenAI/Anthropic)
4. Configurer vos sites WordPress
5. Commencer à discuter avec l'assistant IA

### CLI (À venir)

```bash
# Installer le CLI
npm install -g @claudeus-wp/cli

# S'authentifier
claudeus-wp login

# Ajouter un site WordPress
claudeus-wp site add

# Démarrer une conversation
claudeus-wp chat

# Lister les sites
claudeus-wp site list
```

---

## 📚 API Documentation

### Authentification

#### POST /api/v1/auth/register
Créer un nouveau compte utilisateur.

**Request:**
```json
{
  "email": "user@example.com",
  "password": "SecurePass123!",
  "name": "John Doe"
}
```

**Response:**
```json
{
  "message": "User registered successfully",
  "data": {
    "user": {
      "id": "cuid...",
      "email": "user@example.com",
      "name": "John Doe"
    },
    "accessToken": "eyJhbG...",
    "refreshToken": "eyJhbG..."
  }
}
```

#### POST /api/v1/auth/login
Se connecter et obtenir des tokens JWT.

#### POST /api/v1/auth/refresh
Rafraîchir le token d'accès.

#### POST /api/v1/auth/logout
Se déconnecter.

### Sites WordPress

#### GET /api/v1/sites
Lister tous les sites WordPress de l'utilisateur.

#### POST /api/v1/sites
Ajouter un nouveau site WordPress.

**Request:**
```json
{
  "name": "Mon Site WordPress",
  "url": "https://monsite.com",
  "username": "admin",
  "password": "xxxx xxxx xxxx xxxx xxxx",
  "authType": "basic"
}
```

#### POST /api/v1/sites/:id/test
Tester la connexion à un site WordPress.

### Clés API

#### GET /api/v1/api-keys
Lister les clés API de l'utilisateur.

#### POST /api/v1/api-keys
Ajouter une clé API OpenAI ou Anthropic.

**Request:**
```json
{
  "provider": "ANTHROPIC",
  "key": "sk-ant-...",
  "name": "Ma clé Anthropic"
}
```

### Chat

#### POST /api/v1/chat
Envoyer un message à l'assistant IA (streaming SSE).

**Request:**
```json
{
  "message": "Liste tous les articles de blog",
  "siteId": "site-id",
  "provider": "ANTHROPIC",
  "conversationId": "conv-id" // optionnel
}
```

**Response:** Server-Sent Events stream

```
data: {"text":"Je vais lister..."}
data: {"text":" tous les articles"}
data: [DONE]
```

#### GET /api/v1/chat/conversations
Obtenir l'historique des conversations.

### Abonnement

#### GET /api/v1/subscription
Obtenir l'abonnement actuel.

#### POST /api/v1/subscription/upgrade
Mettre à niveau l'abonnement.

**Request:**
```json
{
  "tier": "PRO",
  "paymentMethodId": "pm_..."
}
```

### Usage

#### GET /api/v1/usage
Obtenir les statistiques d'utilisation.

#### GET /api/v1/usage/quota
Obtenir le quota restant.

---

## 💎 Plans d'Abonnement

### Free Tier (Gratuit)
- ✅ 1 site WordPress
- ✅ 50 requêtes IA/mois
- ✅ Accès CLI basique
- ✅ Accès Web Dashboard
- ✅ Support communautaire

### Pro Tier ($29/mois)
- ✅ 5 sites WordPress
- ✅ 500 requêtes IA/mois
- ✅ Accès CLI complet
- ✅ Historique 30 jours
- ✅ Support email
- ✅ API REST access

### Enterprise Tier ($99/mois)
- ✅ Sites WordPress illimités
- ✅ Requêtes IA illimitées
- ✅ Priority CLI & Web
- ✅ Historique illimité
- ✅ Support prioritaire
- ✅ White-label option
- ✅ SSO support
- ✅ SLA 99.9%

---

## 🔐 Sécurité

- **Chiffrement**: Toutes les clés API et mots de passe WordPress sont chiffrés avec AES-256
- **JWT**: Authentification avec access tokens (15min) et refresh tokens (7 jours)
- **Rate Limiting**: Protection contre les abus avec limits par IP et par utilisateur
- **Validation**: Validation stricte des entrées avec Zod
- **HTTPS**: Recommandé pour la production
- **2FA**: Support optionnel (à venir)

---

## 📊 Monitoring

### Logs

Les logs sont disponibles dans `packages/backend/logs/`:
- `combined.log` - Tous les logs
- `error.log` - Logs d'erreurs uniquement

### Health Checks

```bash
# Backend
curl http://localhost:3001/health

# Response
{
  "status": "ok",
  "timestamp": "2024-11-02T...",
  "uptime": 3600,
  "environment": "production"
}
```

---

## 🧪 Tests

```bash
# Backend tests
cd packages/backend
pnpm test

# Frontend tests (à venir)
cd packages/frontend
pnpm test
```

---

## 🚀 Déploiement en Production

### 1. Préparer l'environnement

```bash
# Générer des secrets sécurisés
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

### 2. Configurer le domaine

Modifier `docker/nginx.conf` pour votre domaine.

### 3. Obtenir un certificat SSL

```bash
# Avec certbot (Let's Encrypt)
certbot certonly --standalone -d yourdomain.com
```

### 4. Déployer

```bash
# Build et démarrer
docker-compose -f docker-compose.prod.yml up -d

# Vérifier
docker-compose ps
```

---

## 📖 Documentation Complète

- **[Architecture](docs/ARCHITECTURE.md)** - Architecture détaillée
- **[API Reference](docs/API.md)** - Documentation complète de l'API (à créer)
- **[Database Schema](docs/DATABASE.md)** - Schéma de la base de données (à créer)

---

## 🤝 Support

- **Email**: deus.h@outlook.com
- **GitHub Issues**: [Report a bug](https://github.com/deus-h/claudeus-wp-mcp/issues)

---

## 📝 License

MIT License - See [LICENSE](LICENSE) file

---

> Made with 🤘❤️ by [Deusware AB](https://deusware.se)

**Transform WordPress Management with AI** 🚀
