# Claudeus - Aperçus HTML des Pages du SaaS

Ce dossier contient des **aperçus HTML statiques** de toutes les pages principales du SaaS Claudeus. Ces pages permettent de visualiser le design et l'interface utilisateur sans avoir besoin de lancer l'application complète.

## 📁 Pages Disponibles

### Pages Principales

| Page | Fichier | Description |
|------|---------|-------------|
| **Index** | `index.html` | Page d'accueil avec liens vers toutes les pages |
| **Connexion** | `login.html` | Formulaire de connexion |
| **Dashboard** | `dashboard.html` | Page d'accueil après connexion avec statistiques |
| **Sites** | `sites.html` | Gestion des sites WordPress |
| **Setup Wizard** | `setup-wizard.html` | Assistant de configuration en 4 étapes ⭐ |
| **Chat** | `chat.html` | Interface de conversation avec l'assistant IA ✨ |
| **Permissions** | `policies.html` | Gestion des permissions par catégories |
| **Administration** | `admin.html` | Configuration système et OpenAI |
| **FAQ** | `faq.html` | Foire aux questions |

## 🚀 Comment Utiliser

### Méthode 1 : Ouvrir Directement dans le Navigateur

1. Ouvrez le fichier `index.html` dans votre navigateur :
   ```bash
   # Depuis le terminal (Linux/Mac)
   open html-previews/index.html

   # Ou (Windows)
   start html-previews/index.html
   ```

2. Cliquez sur les cartes pour naviguer entre les différentes pages

### Méthode 2 : Serveur HTTP Local

Pour une meilleure expérience (notamment pour les liens relatifs) :

```bash
# Avec Python
cd html-previews
python -m http.server 8000

# Avec Node.js (npx)
cd html-previews
npx serve

# Avec PHP
cd html-previews
php -S localhost:8000
```

Puis ouvrez : http://localhost:8000

## 🎨 Technologies Utilisées

- **HTML5** - Structure
- **Tailwind CSS** (via CDN) - Styling
- **Font Awesome** (via CDN) - Icônes

Toutes les dépendances sont chargées via CDN, aucune installation requise.

## ✨ Fonctionnalités Présentées

### Setup Wizard (Configuration Guidée) ⭐
- Progression visuelle en 4 étapes
- Instructions détaillées pour débutants
- Diagrammes ASCII pour guider l'utilisateur
- Validation en temps réel (visuelle)
- Messages d'encouragement
- FAQ intégrée ("C'est quoi JWT ?")

### Chat avec Assistant IA ✨
- Questions d'exemple cliquables par catégorie :
  - Articles (bleu)
  - WooCommerce (vert)
  - Produits (violet)
  - Utilisateurs (orange)
  - Création (rose)
  - Commentaires (indigo)
- Interface moderne avec avatar IA
- Cartes de fonctionnalités
- Tooltips d'aide

### Permissions (Policies)
- 7 catégories de permissions
- Actions granulaires (READ, CREATE, UPDATE, DELETE, PUBLISH)
- Contraintes configurables
- Interface expand/collapse

### Administration
- Configuration OpenAI API key
- Statistiques de la plateforme
- Statut de l'agent IA
- Guide de configuration intégré

### FAQ
- Barre de recherche
- Questions organisées par catégories
- Expand/collapse des réponses
- Section contact support

## 🎯 Points Forts du Design

### Pour Utilisateurs Amateurs/Débutants

1. **Tout en Français** - Aucun terme technique non expliqué
2. **Emojis Partout** - Guide visuel intuitif
3. **Instructions Pas à Pas** - Chaque action est expliquée
4. **Validation Visuelle** - Feedback immédiat (✅ ❌)
5. **Messages d'Encouragement** - "Bravo !", "Parfait !", "Super !"
6. **Tooltips** - Aide contextuelle sur survol
7. **Exemples Concrets** - Questions pré-remplies dans le chat
8. **Diagrammes Visuels** - Navigation WordPress en ASCII art

### Design Moderne

- **Style Vercel** - Interface propre et professionnelle
- **Dégradés** - De gray-900 → blue-900 → purple-900
- **Cartes Arrondies** - rounded-lg, rounded-xl avec shadow
- **Transitions Fluides** - hover:scale-105, hover effects
- **Responsive** - Grid adaptatif (mobile → desktop)
- **Icônes Font Awesome** - Visuellement attractif

## 📊 Structure du Projet Réel

Ces pages HTML sont des aperçus. Le projet réel utilise :

```
claudeus-wp-mcp/
├── packages/
│   ├── frontend/          # Next.js 14 + TypeScript
│   │   ├── app/
│   │   │   ├── dashboard/
│   │   │   │   ├── page.tsx           → dashboard.html
│   │   │   │   ├── sites/
│   │   │   │   │   ├── page.tsx       → sites.html
│   │   │   │   │   └── setup/
│   │   │   │   │       └── page.tsx   → setup-wizard.html
│   │   │   │   ├── chat/
│   │   │   │   │   └── page.tsx       → chat.html
│   │   │   │   ├── policies/
│   │   │   │   │   └── page.tsx       → policies.html
│   │   │   │   ├── admin/
│   │   │   │   │   └── page.tsx       → admin.html
│   │   │   │   └── faq/
│   │   │   │       └── page.tsx       → faq.html
│   │   │   └── login/
│   │   │       └── page.tsx           → login.html
│   │   └── components/
│   └── backend/           # Express + TypeScript
│       └── src/
│           └── routes/
```

## 🔧 Modifications

Pour modifier les aperçus :

1. Ouvrez le fichier HTML dans votre éditeur
2. Modifiez le HTML/classes Tailwind
3. Rafraîchissez le navigateur
4. Les modifications sont visibles immédiatement

Classes Tailwind utiles :
- `bg-blue-500` - Fond bleu
- `text-white` - Texte blanc
- `rounded-lg` - Coins arrondis
- `shadow-xl` - Ombre portée
- `hover:scale-105` - Zoom au survol
- `transition-all` - Transition fluide

## 📝 Notes

- Ces pages sont **statiques** (pas de JavaScript fonctionnel)
- Les formulaires **ne soumettent pas** de données
- Les boutons **ne font rien** (sauf navigation entre pages)
- C'est uniquement pour **visualiser le design**

## 🌐 Compatibilité Navigateurs

- ✅ Chrome/Edge (recommandé)
- ✅ Firefox
- ✅ Safari
- ✅ Opera

## 📧 Support

Pour questions sur le projet réel : support@claudeus.com

---

**Créé avec ❤️ pour Claudeus WordPress AI Assistant**
