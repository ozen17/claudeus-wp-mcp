# 🐳 Installation Claudeus sur Docker Desktop

Guide complet pour installer et lancer Claudeus WordPress AI Assistant SaaS sur Docker Desktop.

## 📋 Prérequis

1. **Docker Desktop** installé et démarré
   - Windows/Mac: [Télécharger Docker Desktop](https://www.docker.com/products/docker-desktop/)
   - Linux: Docker Engine + Docker Compose

2. **Git** installé (pour cloner le projet)

3. **Clé OpenAI API** (obligatoire)
   - Créer un compte sur [OpenAI Platform](https://platform.openai.com/)
   - Générer une clé API dans [API Keys](https://platform.openai.com/api-keys)

---

## 🚀 Installation Rapide (5 minutes)

### Étape 1️⃣ : Cloner le Projet

```bash
git clone https://github.com/ozen17/claudeus-wp-mcp.git
cd claudeus-wp-mcp
```

Si vous travaillez sur une branche spécifique :
```bash
git checkout claude/wordpress-ai-assistant-saas-011CUijenpLA7D8P9bgVYLrQ
```

### Étape 2️⃣ : Configurer les Variables d'Environnement

**Créer le fichier `.env` à la racine du projet :**

```bash
cp .env.example .env
```

**Éditer le fichier `.env` et remplir AU MINIMUM :**

```bash
# ✅ OBLIGATOIRE - Votre clé OpenAI
OPENAI_API_KEY="sk-proj-VOTRE_CLE_OPENAI_ICI"

# ✅ OBLIGATOIRE - Générer des secrets sécurisés
# Sur Mac/Linux : openssl rand -base64 32
# Sur Windows PowerShell : voir plus bas
JWT_ACCESS_SECRET="votre-secret-access-jwt-32-caracteres-minimum"
JWT_REFRESH_SECRET="votre-secret-refresh-jwt-32-caracteres-minimum"

# ✅ OBLIGATOIRE - Exactement 32 caractères
# Sur Mac/Linux : openssl rand -hex 16
ENCRYPTION_KEY="changeme32charactersencryptionk"
```

**Générer des secrets sur Windows PowerShell :**
```powershell
# Pour JWT_ACCESS_SECRET et JWT_REFRESH_SECRET
[Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Maximum 256 }))

# Pour ENCRYPTION_KEY (exécuter 2 fois et prendre 32 chars)
-join ((48..57) + (97..102) | Get-Random -Count 32 | ForEach-Object {[char]$_})
```

### Étape 3️⃣ : Placer le Plugin WordPress MCP (Important!)

Le plugin WordPress est nécessaire pour que les utilisateurs puissent le télécharger.

**Option A : Si vous avez déjà le fichier `wordpress-mcp-plugin.zip`**

Placez-le dans :
```
packages/backend/src/public/downloads/wordpress-mcp-plugin.zip
```

**Option B : Si vous n'avez pas encore le plugin**

Créez le dossier :
```bash
mkdir -p packages/backend/src/public/downloads
```

Vous pourrez ajouter le plugin plus tard. Pour le moment, créez un fichier placeholder :
```bash
touch packages/backend/src/public/downloads/wordpress-mcp-plugin.zip
```

### Étape 4️⃣ : Lancer Docker Compose

**Démarrer tous les services :**

```bash
docker-compose up -d
```

Cette commande va :
- ✅ Télécharger les images Docker (PostgreSQL, Redis, Nginx)
- ✅ Construire le backend (Express + OpenAI Agent)
- ✅ Construire le frontend (Next.js)
- ✅ Créer la base de données PostgreSQL
- ✅ Configurer Redis pour le cache
- ✅ Lancer tous les services

**Première fois ? Ça prendra 5-10 minutes** ⏳

### Étape 5️⃣ : Initialiser la Base de Données

Une fois les conteneurs démarrés, initialiser Prisma :

```bash
# Accéder au conteneur backend
docker exec -it claudeus-backend sh

# À l'intérieur du conteneur :
npx prisma migrate deploy
npx prisma db seed  # Optionnel : données de test
exit
```

### Étape 6️⃣ : Accéder à l'Application

🎉 **C'est prêt !** Ouvrez votre navigateur :

- **Frontend (Interface utilisateur)** : [http://localhost:3002](http://localhost:3002)
- **Backend API** : [http://localhost:3003](http://localhost:3003)
- **Health Check** : [http://localhost:3003/health](http://localhost:3003/health)

---

## 📊 Vérifier que Tout Fonctionne

### Voir les logs en temps réel :

```bash
# Tous les services
docker-compose logs -f

# Juste le backend
docker-compose logs -f backend

# Juste le frontend
docker-compose logs -f frontend
```

### Vérifier l'état des conteneurs :

```bash
docker-compose ps
```

Vous devriez voir :
```
NAME                  STATUS    PORTS
claudeus-postgres     Up        0.0.0.0:5432->5432/tcp
claudeus-redis        Up        0.0.0.0:6379->6379/tcp
claudeus-backend      Up        0.0.0.0:3001->3001/tcp
claudeus-frontend     Up        0.0.0.0:3000->3000/tcp
claudeus-nginx        Up        0.0.0.0:80->80/tcp
```

---

## 🔧 Commandes Utiles

### Arrêter tous les services :
```bash
docker-compose down
```

### Redémarrer un service spécifique :
```bash
docker-compose restart backend
docker-compose restart frontend
```

### Voir les logs d'un service :
```bash
docker-compose logs backend
docker-compose logs frontend
```

### Reconstruire les images (après modification du code) :
```bash
docker-compose up -d --build
```

### Supprimer TOUT (⚠️ attention, supprime les données) :
```bash
docker-compose down -v  # -v = supprime les volumes (base de données)
```

### Accéder à la base de données PostgreSQL :
```bash
docker exec -it claudeus-postgres psql -U claudeus -d claudeus_wp_saas
```

### Accéder au shell du backend :
```bash
docker exec -it claudeus-backend sh
```

---

## 🎨 Visualiser les Pages HTML (Prévisualisations)

Le projet inclut des prévisualisations HTML statiques. Pour les voir :

```bash
# Option 1 : Ouvrir directement
open html-previews/index.html

# Option 2 : Serveur HTTP local
cd html-previews
python3 -m http.server 8000
# Puis ouvrir : http://localhost:8000
```

---

## 🔑 Premier Compte Admin

### Option 1 : Via l'interface (Inscription normale)

1. Aller sur [http://localhost:3002](http://localhost:3002)
2. Cliquer sur "S'inscrire"
3. Créer un compte

### Option 2 : Créer un admin directement en base

```bash
docker exec -it claudeus-postgres psql -U claudeus -d claudeus_wp_saas

# Dans psql :
UPDATE users SET "isAdmin" = true WHERE email = 'votre@email.com';
\q
```

---

## 🐛 Dépannage

### ❌ Erreur : "Port already in use"

Un service utilise déjà le port 3002 ou 3003.

**Solution :**
```bash
# Trouver le processus qui utilise le port
lsof -i :3002  # Mac/Linux
netstat -ano | findstr :3002  # Windows

# Ou changer les ports dans docker-compose.yml
ports:
  - "3005:3000"  # Utiliser 3005 au lieu de 3002
```

### ❌ Erreur : "Connection refused to database"

La base de données n'est pas prête.

**Solution :**
```bash
# Attendre que postgres soit "healthy"
docker-compose logs postgres

# Redémarrer si nécessaire
docker-compose restart postgres
sleep 10
docker-compose restart backend
```

### ❌ Erreur : "OpenAI API key not found"

Vous avez oublié de configurer `OPENAI_API_KEY` dans `.env`.

**Solution :**
1. Éditer `.env`
2. Ajouter votre clé OpenAI
3. Redémarrer : `docker-compose restart backend`

### ❌ Frontend : "Failed to fetch API"

Le backend n'est pas accessible.

**Solution :**
```bash
# Vérifier que le backend tourne
curl http://localhost:3003/health

# Vérifier les logs
docker-compose logs backend

# Redémarrer
docker-compose restart backend frontend
```

### ❌ "Prisma migration error"

La base de données n'est pas synchronisée.

**Solution :**
```bash
docker exec -it claudeus-backend sh
npx prisma migrate reset --force
npx prisma migrate deploy
exit
```

---

## 📦 Structure Docker

```
claudeus-wp-mcp/
├── docker-compose.yml           # Configuration Docker principale
├── .env                         # Variables d'environnement (à créer)
├── .env.example                 # Template des variables
├── docker/
│   ├── backend.Dockerfile       # Image backend
│   ├── frontend.Dockerfile      # Image frontend
│   └── nginx.conf               # Config Nginx (production)
├── packages/
│   ├── backend/                 # API Express
│   └── frontend/                # Interface Next.js
└── html-previews/               # Aperçus HTML statiques
```

---

## 🚀 Mode Production

Pour déployer en production avec Nginx :

```bash
docker-compose --profile production up -d
```

Cela lancera également le conteneur Nginx sur le port 80/443.

**N'oubliez pas de :**
- ✅ Changer tous les secrets dans `.env`
- ✅ Configurer un vrai certificat SSL
- ✅ Mettre à jour `FRONTEND_URL` avec votre domaine
- ✅ Configurer les backups de la base de données

---

## 💡 Conseils

1. **Toujours vérifier les logs** si quelque chose ne fonctionne pas :
   ```bash
   docker-compose logs -f
   ```

2. **Après modification du code**, reconstruire :
   ```bash
   docker-compose up -d --build
   ```

3. **Données de test** : Utilisez `npx prisma db seed` pour créer des données factices

4. **Sauvegarder la base** :
   ```bash
   docker exec claudeus-postgres pg_dump -U claudeus claudeus_wp_saas > backup.sql
   ```

---

## 📞 Besoin d'Aide ?

- 📖 Documentation : Voir `README.md`
- 🐛 Problème ? Vérifier la section "Dépannage" ci-dessus
- 💬 Logs : `docker-compose logs -f`

---

**Bon développement ! 🎉**
