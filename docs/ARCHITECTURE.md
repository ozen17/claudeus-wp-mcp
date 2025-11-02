# Claudeus WordPress AI Assistant SaaS - Architecture

## 🎯 Vue d'ensemble

Plateforme SaaS permettant aux utilisateurs d'avoir un assistant WordPress/WooCommerce alimenté par IA (OpenAI/Anthropic) via une interface Web et CLI.

## 🏗️ Architecture Microservices

```
┌─────────────────────────────────────────────────────────────┐
│                         USERS                                │
└─────────────────┬───────────────────────┬───────────────────┘
                  │                       │
         ┌────────▼────────┐     ┌───────▼────────┐
         │   Web Dashboard │     │   CLI Client    │
         │    (Next.js)    │     │   (Node.js)     │
         └────────┬────────┘     └───────┬─────────┘
                  │                      │
                  └──────────┬───────────┘
                             │
                    ┌────────▼─────────┐
                    │   API Gateway     │
                    │   (Express.js)    │
                    │  - Auth (JWT)     │
                    │  - Rate Limiting  │
                    │  - Subscription   │
                    └────────┬──────────┘
                             │
         ┌───────────────────┼───────────────────┐
         │                   │                   │
    ┌────▼─────┐      ┌─────▼──────┐     ┌─────▼──────┐
    │   MCP    │      │  AI Proxy   │     │  WordPress │
    │  Service │      │  Service    │     │   Proxy    │
    │          │      │ - OpenAI    │     │  Service   │
    │ 145 Tools│      │ - Anthropic │     │            │
    └────┬─────┘      └─────┬──────┘     └─────┬──────┘
         │                  │                   │
         └──────────────────┼───────────────────┘
                            │
                   ┌────────▼─────────┐
                   │   PostgreSQL DB   │
                   │  - Users          │
                   │  - Sites          │
                   │  - Subscriptions  │
                   │  - Usage Logs     │
                   └───────────────────┘
```

## 📦 Composants

### 1. **Frontend Web** (`packages/frontend`)
- **Tech**: Next.js 14, TypeScript, Tailwind CSS, Shadcn/ui
- **Features**:
  - Dashboard utilisateur
  - Gestion des sites WordPress
  - Configuration des clés API (OpenAI/Anthropic)
  - Interface chat avec l'assistant IA
  - Historique des conversations
  - Gestion de l'abonnement
  - Statistiques d'utilisation

### 2. **CLI Client** (`packages/cli`)
- **Tech**: Node.js, TypeScript, Commander.js, Inquirer.js
- **Features**:
  - Authentification via token
  - Interface conversationnelle
  - Gestion multi-sites
  - Commandes WordPress/WooCommerce
  - Mode interactif et script

### 3. **Backend API** (`packages/backend`)
- **Tech**: Express.js, TypeScript, Prisma ORM
- **Services**:
  - **Auth Service**: JWT, refresh tokens, session management
  - **User Service**: CRUD utilisateurs, profils
  - **Subscription Service**: 3 tiers, billing, limites
  - **Site Service**: Gestion sites WordPress
  - **AI Proxy Service**: Routing vers OpenAI/Anthropic
  - **MCP Gateway**: Communication avec serveur MCP
  - **Usage Tracking**: Logs, analytics, quotas

### 4. **MCP Server** (`packages/mcp-server`)
- **Tech**: Serveur MCP existant (145 tools)
- **Exposition**: API interne pour le backend
- **Features**: Tous les outils WordPress existants

### 5. **Database** (PostgreSQL)
- **Schema**:
  - `users` - Utilisateurs avec auth
  - `sites` - Sites WordPress configurés
  - `subscriptions` - Plans d'abonnement
  - `api_keys` - Clés OpenAI/Anthropic chiffrées
  - `usage_logs` - Tracking utilisation API
  - `conversations` - Historique des conversations
  - `sessions` - Sessions actives

## 💎 Plans d'Abonnement

### Free Tier
- 1 site WordPress
- 50 requêtes IA/mois
- Accès CLI basique
- Accès Web Dashboard
- Support communautaire

### Pro Tier ($29/mois)
- 5 sites WordPress
- 500 requêtes IA/mois
- Accès CLI complet
- Historique 30 jours
- Support email
- API REST access

### Enterprise Tier ($99/mois)
- Sites WordPress illimités
- Requêtes IA illimitées
- Priority CLI & Web
- Historique illimité
- Support prioritaire
- White-label option
- SSO support
- SLA 99.9%

## 🔐 Sécurité

### Authentication
- JWT tokens avec refresh mechanism
- Password hashing (bcrypt)
- 2FA optionnel (TOTP)
- Rate limiting per IP et per user

### API Keys Management
- Chiffrement AES-256 des clés API
- Clés stockées avec encryption-at-rest
- Jamais exposées en clair
- Rotation automatique possible

### Data Protection
- HTTPS obligatoire
- CORS configuré
- Helmet.js pour headers security
- Input validation (Zod)
- SQL injection protection (Prisma)

## 🚀 Déploiement Docker

### Services Docker
```yaml
services:
  - postgres (Database)
  - redis (Cache & Sessions)
  - backend (API Gateway)
  - mcp-server (MCP Service)
  - frontend (Web UI)
  - nginx (Reverse Proxy)
```

### Environnements
- **Development**: Docker Compose local
- **Staging**: Docker Swarm ou Kubernetes
- **Production**: Kubernetes avec auto-scaling

## 📊 Monitoring & Observability

- **Logs**: Winston + ELK Stack
- **Metrics**: Prometheus + Grafana
- **Tracing**: OpenTelemetry
- **Alerts**: PagerDuty / Slack
- **Uptime**: UptimeRobot

## 🔄 CI/CD Pipeline

```
GitHub Actions:
  1. Lint & Tests
  2. Build Docker images
  3. Push to registry
  4. Deploy to staging
  5. Automated tests
  6. Manual approval
  7. Deploy to production
```

## 📝 API Endpoints Structure

### Auth
- `POST /api/v1/auth/register`
- `POST /api/v1/auth/login`
- `POST /api/v1/auth/refresh`
- `POST /api/v1/auth/logout`

### Sites
- `GET /api/v1/sites`
- `POST /api/v1/sites`
- `PUT /api/v1/sites/:id`
- `DELETE /api/v1/sites/:id`

### AI Assistant
- `POST /api/v1/chat` (Stream SSE)
- `GET /api/v1/conversations`
- `GET /api/v1/conversations/:id`

### Subscriptions
- `GET /api/v1/subscription`
- `POST /api/v1/subscription/upgrade`
- `GET /api/v1/usage`

## 🎯 Roadmap

### Phase 1 - MVP (4 semaines)
- ✅ Backend API avec auth
- ✅ Base de données
- ✅ Web Dashboard basique
- ✅ CLI client
- ✅ Intégration MCP
- ✅ Docker setup

### Phase 2 - Beta (4 semaines)
- Plans d'abonnement
- Paiements (Stripe)
- Usage tracking
- Email notifications
- Documentation complète

### Phase 3 - Launch (4 semaines)
- Landing page
- SEO optimization
- Analytics
- Support système
- Marketing automation

### Phase 4 - Scaling
- Kubernetes
- Multi-region
- CDN
- Advanced analytics
- White-label
