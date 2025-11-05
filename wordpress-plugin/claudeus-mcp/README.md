# Claudeus MCP - WordPress AI Assistant Plugin

Plugin WordPress MCP (Model Context Protocol) permettant à l'assistant AI Claudeus de gérer votre site WordPress et WooCommerce via API REST sécurisée.

## 🚀 Fonctionnalités

- **Authentification JWT sécurisée** - Protection de toutes les requêtes API
- **47+ Outils MCP** - Gestion complète de WordPress et WooCommerce
- **API REST moderne** - Endpoints standardisés et documentés
- **Support WooCommerce** - Gestion des produits, commandes, clients et catégories
- **Interface d'administration** - Page de configuration et documentation intégrée
- **CORS configuré** - Compatible avec les applications SaaS externes

## 📋 Prérequis

- WordPress 6.0 ou supérieur
- PHP 7.4 ou supérieur
- HTTPS recommandé (obligatoire en production)
- WooCommerce 5.0+ (optionnel, pour les outils e-commerce)

## 🔧 Installation

### Via Upload WordPress

1. Téléchargez le dossier `claudeus-mcp`
2. Compressez-le en fichier ZIP : `claudeus-mcp.zip`
3. Dans WordPress, allez dans **Extensions → Ajouter**
4. Cliquez sur **Téléverser une extension**
5. Sélectionnez le fichier ZIP et cliquez sur **Installer maintenant**
6. Activez le plugin

### Via FTP

1. Téléchargez le dossier `claudeus-mcp`
2. Uploadez-le dans `/wp-content/plugins/`
3. Activez le plugin depuis **Extensions** dans WordPress

## 🔑 Configuration

### 1. Générer un token JWT

Pour vous authentifier, envoyez une requête POST à :

```bash
POST https://votre-site.com/wp-json/claudeus-mcp/v1/auth/token
Content-Type: application/json

{
  "username": "votre_username",
  "password": "votre_mot_de_passe"
}
```

Réponse :

```json
{
  "success": true,
  "token": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...",
  "user": {
    "id": 1,
    "username": "admin",
    "email": "admin@example.com",
    "roles": ["administrator"]
  },
  "expires_at": 1234567890
}
```

### 2. Utiliser le token

Incluez le token dans toutes les requêtes vers les outils MCP :

```bash
Authorization: Bearer {votre_token_jwt}
```

## 📚 Outils MCP Disponibles

### 📝 Articles (Posts) - 5 outils

| Endpoint | Description |
|----------|-------------|
| `POST /tools/wordpress_list_posts` | Lister les articles |
| `POST /tools/wordpress_get_post` | Consulter un article |
| `POST /tools/wordpress_create_post` | Créer un article |
| `POST /tools/wordpress_update_post` | Modifier un article |
| `POST /tools/wordpress_delete_post` | Supprimer un article |

### 📄 Pages - 5 outils

| Endpoint | Description |
|----------|-------------|
| `POST /tools/wordpress_list_pages` | Lister les pages |
| `POST /tools/wordpress_get_page` | Consulter une page |
| `POST /tools/wordpress_create_page` | Créer une page |
| `POST /tools/wordpress_update_page` | Modifier une page |
| `POST /tools/wordpress_delete_page` | Supprimer une page |

### 🖼️ Médias - 4 outils

| Endpoint | Description |
|----------|-------------|
| `POST /tools/wordpress_list_media` | Lister les médias |
| `POST /tools/wordpress_get_media` | Consulter un média |
| `POST /tools/wordpress_upload_media` | Télécharger un média (base64) |
| `POST /tools/wordpress_delete_media` | Supprimer un média |

### 👥 Utilisateurs - 5 outils

| Endpoint | Description |
|----------|-------------|
| `POST /tools/wordpress_list_users` | Lister les utilisateurs |
| `POST /tools/wordpress_get_user` | Consulter un utilisateur |
| `POST /tools/wordpress_create_user` | Créer un utilisateur |
| `POST /tools/wordpress_update_user` | Modifier un utilisateur |
| `POST /tools/wordpress_delete_user` | Supprimer un utilisateur |

### 💬 Commentaires - 5 outils

| Endpoint | Description |
|----------|-------------|
| `POST /tools/wordpress_list_comments` | Lister les commentaires |
| `POST /tools/wordpress_get_comment` | Consulter un commentaire |
| `POST /tools/wordpress_approve_comment` | Approuver un commentaire |
| `POST /tools/wordpress_spam_comment` | Marquer comme spam |
| `POST /tools/wordpress_delete_comment` | Supprimer un commentaire |

### 🧩 Extensions - 4 outils

| Endpoint | Description |
|----------|-------------|
| `POST /tools/wordpress_list_plugins` | Lister les extensions |
| `POST /tools/wordpress_get_plugin` | Consulter une extension |
| `POST /tools/wordpress_activate_plugin` | Activer une extension |
| `POST /tools/wordpress_deactivate_plugin` | Désactiver une extension |

### 🎨 Thèmes - 3 outils

| Endpoint | Description |
|----------|-------------|
| `POST /tools/wordpress_list_themes` | Lister les thèmes |
| `POST /tools/wordpress_get_theme` | Consulter un thème |
| `POST /tools/wordpress_activate_theme` | Activer un thème |

### ⚙️ Réglages - 3 outils

| Endpoint | Description |
|----------|-------------|
| `POST /tools/wordpress_get_site_info` | Informations du site |
| `POST /tools/wordpress_update_settings` | Modifier les réglages |
| `POST /tools/wordpress_get_site_health` | État de santé du site |

### 🛒 WooCommerce - 13 outils

| Endpoint | Description |
|----------|-------------|
| `POST /tools/wc_list_products` | Lister les produits |
| `POST /tools/wc_create_product` | Créer un produit |
| `POST /tools/wc_update_product` | Modifier un produit |
| `POST /tools/wc_delete_product` | Supprimer un produit |
| `POST /tools/wc_list_orders` | Lister les commandes |
| `POST /tools/wc_get_order` | Consulter une commande |
| `POST /tools/wc_update_order` | Modifier une commande |
| `POST /tools/wc_list_customers` | Lister les clients |
| `POST /tools/wc_create_customer` | Créer un client |
| `POST /tools/wc_update_customer` | Modifier un client |
| `POST /tools/wc_list_categories` | Lister les catégories |
| `POST /tools/wc_create_category` | Créer une catégorie |
| `POST /tools/wc_update_category` | Modifier une catégorie |

## 📖 Exemples d'utilisation

### Créer un article

```bash
POST https://votre-site.com/wp-json/claudeus-mcp/v1/tools/wordpress_create_post
Authorization: Bearer {votre_token}
Content-Type: application/json

{
  "title": "Mon premier article",
  "content": "<p>Contenu de l'article...</p>",
  "status": "publish",
  "categories": [1, 3],
  "tags": ["test", "demo"]
}
```

### Lister les produits WooCommerce

```bash
POST https://votre-site.com/wp-json/claudeus-mcp/v1/tools/wc_list_products
Authorization: Bearer {votre_token}
Content-Type: application/json

{
  "per_page": 10,
  "page": 1,
  "status": "publish"
}
```

### Télécharger un média

```bash
POST https://votre-site.com/wp-json/claudeus-mcp/v1/tools/wordpress_upload_media
Authorization: Bearer {votre_token}
Content-Type: application/json

{
  "filename": "image.jpg",
  "file_data": "base64_encoded_image_data...",
  "title": "Mon image",
  "alt_text": "Description de l'image"
}
```

## 🔒 Sécurité

### Bonnes pratiques

- ✅ **Utilisez HTTPS** - Obligatoire en production
- ✅ **Protégez vos tokens** - Ne les partagez jamais
- ✅ **Permissions appropriées** - Utilisez des comptes avec les bonnes permissions
- ✅ **Tokens expirables** - Les tokens JWT expirent après 24 heures
- ✅ **Validation des données** - Toutes les données sont sanitizées

### Permissions WordPress requises

Les outils MCP respectent les permissions natives de WordPress :

- **Posts/Pages** : `edit_posts`, `edit_pages`
- **Media** : `upload_files`
- **Users** : `list_users`, `create_users`, `edit_users`, `delete_users`
- **Comments** : `moderate_comments`
- **Plugins/Themes** : `activate_plugins`, `switch_themes`
- **Settings** : `manage_options`
- **WooCommerce** : `manage_woocommerce`

## 🛠️ Développement

### Structure du plugin

```
claudeus-mcp/
├── claudeus-mcp.php          # Fichier principal
├── includes/
│   ├── class-auth.php        # Authentification JWT
│   ├── class-api.php         # Gestionnaire API REST
│   ├── admin-page.php        # Page d'administration
│   └── endpoints/
│       ├── posts.php         # Endpoints articles
│       ├── pages.php         # Endpoints pages
│       ├── media.php         # Endpoints médias
│       ├── users.php         # Endpoints utilisateurs
│       ├── comments.php      # Endpoints commentaires
│       ├── plugins.php       # Endpoints extensions
│       ├── themes.php        # Endpoints thèmes
│       ├── settings.php      # Endpoints réglages
│       └── woocommerce.php   # Endpoints WooCommerce
├── assets/
│   ├── css/
│   │   └── admin.css         # Styles admin
│   └── js/
│       └── admin.js          # Scripts admin
└── README.md                 # Documentation
```

### Hooks et Filtres

Le plugin expose plusieurs hooks pour personnalisation :

```php
// Activer/désactiver CORS
add_filter('claudeus_mcp_enable_cors', function($enabled) {
    return true; // ou false pour désactiver
});

// Personnaliser la durée de validité des tokens (en secondes)
add_filter('claudeus_mcp_token_expiration', function($expiration) {
    return 86400; // 24 heures
});
```

## ❓ FAQ

### Le plugin fonctionne-t-il sans WooCommerce ?

Oui ! Les outils WooCommerce sont simplement désactivés si WooCommerce n'est pas installé. Tous les autres outils fonctionnent normalement.

### Puis-je utiliser ce plugin sur plusieurs sites ?

Oui, le plugin peut être installé sur autant de sites WordPress que vous le souhaitez.

### Les tokens JWT sont-ils sécurisés ?

Oui, les tokens sont signés avec une clé secrète générée automatiquement lors de l'activation du plugin. Ils expirent après 24 heures.

### Comment désactiver temporairement l'API ?

Désactivez simplement le plugin depuis **Extensions** dans WordPress.

## 🐛 Support et Contribution

- **Issues** : [GitHub Issues](https://github.com/ozen17/claudeus-wp-mcp/issues)
- **Documentation** : [GitHub Repository](https://github.com/ozen17/claudeus-wp-mcp)

## 📄 Licence

MIT License - Voir le fichier LICENSE pour plus de détails.

## 👨‍💻 Auteur

Développé par l'équipe **Claudeus** pour le SaaS WordPress AI Assistant.

## 🔄 Changelog

### Version 1.0.0 (2024-11-05)

- 🎉 Version initiale
- ✅ 47 outils MCP implémentés
- ✅ Authentification JWT
- ✅ Support WordPress complet
- ✅ Support WooCommerce complet
- ✅ Interface d'administration
- ✅ Documentation complète
