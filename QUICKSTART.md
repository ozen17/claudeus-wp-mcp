# 🚀 Quick Start Guide

Ce guide vous permettra de démarrer Claudeus WordPress AI Assistant SaaS en 5 minutes.

## Option 1: Démarrage Rapide avec Docker (Recommandé) 🐳

### Prérequis
- Docker et Docker Compose installés
- Node.js ≥ 22.0.0 (pour le script de setup)

### Étapes

```bash
# 1. Cloner le projet
git clone https://github.com/deus-h/claudeus-wp-mcp.git
cd claudeus-wp-mcp

# 2. Exécuter le script de setup (génère les secrets automatiquement)
chmod +x scripts/setup.sh
./scripts/setup.sh

# 3. (Optionnel) Configurer Stripe dans .env
# Éditer .env et ajouter vos clés Stripe si vous voulez tester les paiements

# 4. Démarrer tous les services avec Docker
make docker-up

# 5. Attendez que tous les services soient prêts (30-60 secondes)
# Vérifiez les logs si nécessaire:
make docker-logs
```

**C'est tout ! Votre plateforme SaaS est maintenant disponible à :**
- 🌐 Frontend: http://localhost:3000
- 🔌 Backend API: http://localhost:3001
- 🛠️ MCP Server: http://localhost:3002

### Tester l'API

```bash
# Health check
curl http://localhost:3001/health

# Créer un compte
curl -X POST http://localhost:3001/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "SecurePass123!",
    "name": "Test User"
  }'
```

---

## Option 2: Installation Manuelle (Développement) 💻

### Prérequis
- Node.js ≥ 22.0.0
- pnpm installé (`npm install -g pnpm`)
- PostgreSQL 16 en cours d'exécution
- Redis 7 en cours d'exécution

### Étapes

```bash
# 1. Cloner le projet
git clone https://github.com/deus-h/claudeus-wp-mcp.git
cd claudeus-wp-mcp

# 2. Installer les dépendances
pnpm install

# 3. Créer et configurer .env
cp .env.example .env

# Générer des secrets sécurisés
node -e "console.log('JWT_ACCESS_SECRET=' + require('crypto').randomBytes(64).toString('hex'))"
node -e "console.log('JWT_REFRESH_SECRET=' + require('crypto').randomBytes(64).toString('hex'))"
node -e "console.log('ENCRYPTION_KEY=' + require('crypto').randomBytes(16).toString('hex'))"

# Copier les secrets générés dans .env

# 4. Configurer la base de données
# Assurez-vous que PostgreSQL est en cours d'exécution
# Modifier DATABASE_URL dans .env si nécessaire

# 5. Exécuter les migrations
cd packages/backend
pnpm prisma:generate
pnpm prisma:migrate

# 6. Démarrer le backend (dans un terminal)
cd packages/backend
pnpm dev

# 7. Démarrer le serveur MCP (dans un autre terminal)
cd ../../
pnpm dev

# Le frontend sera ajouté ultérieurement
```

---

## 📝 Prochaines Étapes

### 1. Créer un Compte

Via l'interface web (quand le frontend sera prêt) ou via l'API :

```bash
curl -X POST http://localhost:3001/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "votre@email.com",
    "password": "MotDePasse123!",
    "name": "Votre Nom"
  }'
```

### 2. Se Connecter

```bash
curl -X POST http://localhost:3001/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "votre@email.com",
    "password": "MotDePasse123!"
  }'
```

Vous recevrez un `accessToken` et un `refreshToken`.

### 3. Ajouter une Clé API

```bash
# Remplacer YOUR_ACCESS_TOKEN par le token reçu lors du login
curl -X POST http://localhost:3001/api/v1/api-keys \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -d '{
    "provider": "ANTHROPIC",
    "key": "sk-ant-votre-cle-api",
    "name": "Ma clé Anthropic"
  }'
```

### 4. Ajouter un Site WordPress

```bash
curl -X POST http://localhost:3001/api/v1/sites \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -d '{
    "name": "Mon Site WP",
    "url": "https://monsite.com",
    "username": "admin",
    "password": "xxxx xxxx xxxx xxxx",
    "authType": "basic"
  }'
```

### 5. Discuter avec l'Assistant IA

```bash
curl -X POST http://localhost:3001/api/v1/chat \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -d '{
    "message": "Liste tous mes articles WordPress",
    "siteId": "SITE_ID_FROM_PREVIOUS_STEP",
    "provider": "ANTHROPIC"
  }'
```

---

## 🛠️ Commandes Utiles

```bash
# Arrêter les services Docker
make docker-down

# Voir les logs
make docker-logs

# Reconstruire les images Docker
make docker-rebuild

# Ouvrir Prisma Studio (interface BD)
make db-studio

# Nettoyer le projet
make clean

# Lancer les tests
make test

# Voir toutes les commandes disponibles
make help
```

---

## 🔍 Vérification de l'Installation

### Vérifier les Services Docker

```bash
docker-compose ps
```

Tous les services doivent être "Up" :
- claudeus-postgres
- claudeus-redis
- claudeus-backend
- claudeus-mcp
- claudeus-frontend (quand disponible)
- claudeus-nginx

### Vérifier les Endpoints

```bash
# Backend health
curl http://localhost:3001/health

# Devrait retourner:
# {"status":"ok","timestamp":"...","uptime":...}
```

---

## ❓ Résolution de Problèmes

### Le backend ne démarre pas

```bash
# Vérifier les logs
docker-compose logs backend

# Vérifier que PostgreSQL est prêt
docker-compose logs postgres

# Recréer la base de données
make db-reset
```

### Erreur de connexion à la base de données

```bash
# Vérifier que PostgreSQL est en cours d'exécution
docker-compose ps postgres

# Vérifier DATABASE_URL dans .env
cat .env | grep DATABASE_URL
```

### Erreur "ENCRYPTION_KEY must be exactly 32 characters"

```bash
# Générer une nouvelle clé de 32 caractères
node -e "console.log(require('crypto').randomBytes(16).toString('hex'))"

# Copier la valeur dans .env
```

---

## 📚 Documentation Supplémentaire

- [Architecture complète](docs/ARCHITECTURE.md)
- [README SaaS](SAAS_README.md)
- [README MCP](readme.md)

---

## 💬 Support

Si vous rencontrez des problèmes :

1. Consultez les logs : `make docker-logs`
2. Vérifiez le fichier .env
3. Ouvrez une issue sur GitHub
4. Contactez : deus.h@outlook.com

---

**Bon développement ! 🚀**
