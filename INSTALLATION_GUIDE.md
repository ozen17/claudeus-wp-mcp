# Guide d'installation - Claudeus WordPress AI Assistant v2

Ce guide vous explique comment installer et démarrer le SaaS Claudeus sur Docker Desktop.

---

## 📋 Prérequis

### 1. Docker Desktop

Téléchargez et installez Docker Desktop pour votre système:

- **Windows**: https://docs.docker.com/desktop/install/windows-install/
- **Mac**: https://docs.docker.com/desktop/install/mac-install/
- **Linux**: https://docs.docker.com/desktop/install/linux-install/

**Version minimale**: Docker 20.10+ et Docker Compose v2+

Vérifiez l'installation:
```bash
docker --version
docker compose version
```

### 2. Clé API OpenAI

Vous avez besoin d'une clé API OpenAI (requise pour l'architecture v2):

1. Créez un compte sur https://platform.openai.com/
2. Allez dans **API Keys**: https://platform.openai.com/api-keys
3. Cliquez sur **Create new secret key**
4. Copiez la clé (format: `sk-proj-...`)

**Coût estimé**: ~$0.01 à $0.10 par conversation selon le modèle (gpt-4o).

### 3. Site WordPress

Vous devez avoir un site WordPress avec:
- WordPress 6.0+
- PHP 8.0+
- HTTPS activé (recommandé)
- Accès administrateur

---

## 🚀 Installation rapide

### Étape 1: Cloner le projet

```bash
git clone https://github.com/votre-repo/claudeus-wp-mcp.git
cd claudeus-wp-mcp
```

### Étape 2: Configurer les variables d'environnement

Créez un fichier `.env` à la racine du projet:

```bash
cp .env.example .env
```

Éditez le fichier `.env` et configurez **au minimum**:

```env
# OBLIGATOIRE: Votre clé API OpenAI
OPENAI_API_KEY="sk-proj-VOTRE_CLE_ICI"

# OBLIGATOIRE: Générer des secrets sécurisés
JWT_ACCESS_SECRET="votre-secret-jwt-access-au-moins-32-caracteres"
JWT_REFRESH_SECRET="votre-secret-jwt-refresh-au-moins-32-caracteres"
ENCRYPTION_KEY="exactement32caracteresici1234"
```

**💡 Générer des secrets sécurisés:**

Sur Linux/Mac:
```bash
# JWT secrets
openssl rand -base64 32

# Encryption key (32 caractères)
openssl rand -hex 16
```

Sur Windows (PowerShell):
```powershell
# Générer une chaîne aléatoire
[Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Maximum 256 }))
```

### Étape 3: Démarrer les services Docker

```bash
docker compose up -d
```

Cette commande va:
1. Télécharger les images Docker (PostgreSQL, Redis, etc.)
2. Construire les images du backend et frontend
3. Démarrer tous les services
4. Exécuter les migrations de base de données

**⏱️ Durée**: 5-10 minutes au premier démarrage.

### Étape 4: Vérifier que tout fonctionne

Ouvrez votre navigateur:

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:3001/health (devrait retourner `{"status":"ok"}`)

### Étape 5: Créer votre compte

1. Allez sur http://localhost:3000
2. Cliquez sur **Sign Up**
3. Créez votre compte avec email/mot de passe
4. Connectez-vous

---

## 🔧 Configuration WordPress

Pour que le SaaS puisse gérer votre site WordPress, vous devez installer le **plugin WordPress MCP**.

### Option A: Installation automatique (recommandé)

Le plugin sera bientôt disponible sur le répertoire WordPress. En attendant, suivez l'option B.

### Option B: Installation manuelle

1. Téléchargez le plugin depuis: https://github.com/Automattic/wordpress-mcp
2. Dézippez et uploadez dans `/wp-content/plugins/`
3. Activez le plugin dans **Extensions**
4. Allez dans **Réglages > WordPress MCP**
5. Cliquez sur **Générer un token JWT**
6. Copiez le token généré

### Connecter votre site au SaaS

1. Dans le SaaS, allez dans **Sites > Ajouter un site**
2. Remplissez:
   - **Nom**: Nom de votre site
   - **URL**: https://votre-site.com
   - **JWT Token**: Collez le token copié depuis WordPress
3. Cliquez sur **Tester la connexion**
4. Si succès ✅, cliquez sur **Enregistrer**

---

## 🎯 Configuration des permissions

Par défaut, toutes les catégories d'outils sont activées avec des actions de base (lecture, création, modification).

Pour personnaliser:

1. Allez dans **Permissions** dans le menu
2. Sélectionnez votre site
3. Pour chaque catégorie, vous pouvez:
   - ✅ **Activer/désactiver** la catégorie entière
   - 🎛️ **Choisir les actions** autorisées (Lire, Créer, Modifier, Supprimer)
   - 📊 **Définir des contraintes** (limites quotidiennes, prix min/max pour WooCommerce)
   - ⚠️ **Demander confirmation** avant chaque action

**Exemples de configuration:**

**Configuration prudente:**
- ✅ CONTENT: Lecture, Création
- ✅ MEDIA: Lecture
- ✅ WOOCOMMERCE: Lecture uniquement
- ❌ USERS: Désactivé
- ❌ SETTINGS: Désactivé

**Configuration avancée:**
- ✅ CONTENT: Toutes actions, max 10 publications/jour
- ✅ MEDIA: Toutes actions
- ✅ WOOCOMMERCE: Toutes actions, prix entre 5€ et 1000€
- ✅ USERS: Lecture, Création (avec confirmation)
- ✅ SETTINGS: Lecture, Modification (avec confirmation)

---

## 💬 Utiliser le chat

1. Allez dans **Chat**
2. Sélectionnez votre site WordPress
3. Commencez à parler en français naturel !

**Exemples de commandes:**

```
"Crée-moi un article sur l'intelligence artificielle"
"Ajoute un produit T-shirt à 25€ dans ma boutique"
"Montre-moi les 5 dernières commandes"
"Change le titre du site en 'Mon Super Site'"
"Upload l'image que je viens de te donner"
```

**Important**: Le chat comprend le français naturel. Pas besoin de syntaxe technique ou de commandes spéciales !

---

## 📊 Consulter les logs

Pour voir toutes les actions effectuées:

1. Allez dans **Journal**
2. Filtrez par:
   - Site
   - Catégorie (Contenu, WooCommerce, etc.)
   - Action (Création, Modification, Suppression)
   - Période (7, 14, 30 jours)

Chaque log affiche:
- ✅ Succès ou ❌ Échec
- 📝 Intent (ce que vous avez demandé)
- 🔧 Outil MCP utilisé
- 📅 Date et heure
- 🌐 Site concerné

---

## 🛑 Arrêter les services

```bash
docker compose down
```

Pour supprimer également les volumes (⚠️ supprime la base de données):

```bash
docker compose down -v
```

---

## 🔄 Redémarrer les services

```bash
docker compose restart
```

Ou redémarrer un service spécifique:

```bash
docker compose restart backend
docker compose restart frontend
```

---

## 📝 Voir les logs

Pour suivre les logs en temps réel:

```bash
# Tous les services
docker compose logs -f

# Backend uniquement
docker compose logs -f backend

# Frontend uniquement
docker compose logs -f frontend

# PostgreSQL
docker compose logs -f postgres
```

---

## 🐛 Résolution de problèmes

### Erreur: "Port already in use"

Si les ports 3000, 3001, 5432 ou 6379 sont déjà utilisés:

```bash
# Trouver le processus sur le port
lsof -i :3000  # Mac/Linux
netstat -ano | findstr :3000  # Windows

# Arrêter le processus ou changer le port dans docker-compose.yml
```

### Erreur: "OpenAI API key invalid"

Vérifiez que:
1. Votre clé API est valide et commence par `sk-proj-`
2. Votre compte OpenAI a des crédits
3. La clé est correctement configurée dans `.env`

Rechargez la configuration:
```bash
docker compose down
docker compose up -d
```

### Erreur: "Connection to WordPress failed"

1. Vérifiez que le plugin WordPress MCP est installé et activé
2. Vérifiez que le token JWT est correct
3. Vérifiez que votre site WordPress est accessible via HTTPS
4. Testez la connexion dans **Sites > Tester la connexion**

### Base de données corrompue

Réinitialisez la base:

```bash
docker compose down -v
docker compose up -d
```

⚠️ Ceci supprimera toutes les données (utilisateurs, sites, conversations).

### Frontend ne charge pas

```bash
# Reconstruire le frontend
docker compose up -d --build frontend

# Vérifier les logs
docker compose logs frontend
```

---

## 🔐 Sécurité en production

Si vous déployez en production:

1. **Changez tous les secrets** dans `.env`
2. **Utilisez HTTPS** pour le frontend (certificat SSL)
3. **Configurez un pare-feu** (n'exposez que les ports 80 et 443)
4. **Activez Nginx** avec le profil production:
   ```bash
   docker compose --profile production up -d
   ```
5. **Sauvegardez régulièrement** la base de données:
   ```bash
   docker exec claudeus-postgres pg_dump -U claudeus claudeus_wp_saas > backup.sql
   ```

---

## 📚 Documentation supplémentaire

- [Architecture v2](./MIGRATION_V2_SUMMARY.md) - Détails techniques de la v2
- [Plugin WordPress MCP](./WORDPRESS_MCP_PLUGIN_SETUP.md) - Guide complet du plugin
- [Plan de refactoring](./REFACTORING_PLAN_V2.md) - Changements techniques

---

## 🆘 Support

En cas de problème:

1. Consultez les logs: `docker compose logs`
2. Vérifiez la [FAQ](#-résolution-de-problèmes)
3. Ouvrez une issue sur GitHub

---

## ✅ Checklist de démarrage

- [ ] Docker Desktop installé et démarré
- [ ] Clé API OpenAI obtenue
- [ ] Fichier `.env` configuré
- [ ] Services Docker démarrés (`docker compose up -d`)
- [ ] Frontend accessible sur http://localhost:3000
- [ ] Compte utilisateur créé
- [ ] Plugin WordPress MCP installé sur votre site
- [ ] JWT Token WordPress copié
- [ ] Site connecté au SaaS
- [ ] Permissions configurées
- [ ] Premier test de chat réussi ✨

---

**Bon usage de Claudeus ! 🚀**
