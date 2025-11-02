# WordPress MCP Plugin - Guide d'installation

Ce guide explique comment installer et configurer le plugin WordPress MCP sur votre site WordPress pour l'intégrer avec le SaaS Claudeus.

---

## Prérequis

- WordPress 6.0 ou supérieur
- PHP 8.0 ou supérieur
- Accès administrateur au site WordPress
- npm installé (pour le développement)

---

## 1. Installation du plugin WordPress MCP

Le plugin WordPress MCP est développé par Automattic et expose les outils MCP via une API REST WordPress.

### Option A: Installation depuis GitHub (Recommandé)

```bash
# 1. Cloner le repository du plugin
cd /path/to/wordpress/wp-content/plugins
git clone https://github.com/Automattic/wordpress-mcp.git

# 2. Installer les dépendances et builder
cd wordpress-mcp
npm install
npm run build

# 3. Activer le plugin depuis WordPress Admin
```

### Option B: Installation manuelle

1. Télécharger le ZIP depuis: https://github.com/Automattic/wordpress-mcp/releases
2. Dans WordPress Admin: **Extensions > Ajouter**
3. Cliquer sur **Téléverser une extension**
4. Choisir le fichier ZIP et cliquer sur **Installer maintenant**
5. Activer l'extension

---

## 2. Configuration de l'authentification

Le plugin MCP supporte deux méthodes d'authentification:

### Option A: JWT Token (Recommandé)

1. Accéder à **Réglages > WordPress MCP** dans l'admin WordPress
2. Cliquer sur **Générer un nouveau token JWT**
3. Copier le token généré (format: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`)
4. Coller ce token dans le SaaS Claudeus lors de l'ajout du site

**Avantages JWT:**
- Sécurité renforcée
- Tokens révocables
- Expiration configurable
- Audit trail intégré

### Option B: Application Password (Alternative)

1. Accéder à **Utilisateurs > Profil**
2. Descendre jusqu'à **Mots de passe d'application**
3. Entrer un nom (ex: "Claudeus SaaS")
4. Cliquer sur **Ajouter un nouveau mot de passe d'application**
5. Copier le mot de passe généré (format: `xxxx xxxx xxxx xxxx xxxx xxxx`)
6. Dans le SaaS Claudeus, utiliser:
   - Username: votre nom d'utilisateur WordPress
   - Password: le mot de passe d'application (sans espaces)

---

## 3. Vérification de l'installation

### Test via cURL

```bash
# Remplacer les valeurs
SITE_URL="https://votre-site.com"
JWT_TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."

# Test health check
curl -X GET "${SITE_URL}/wp-json/mcp/v1/health" \
  -H "Authorization: Bearer ${JWT_TOKEN}"

# Réponse attendue:
# {
#   "status": "ok",
#   "version": "1.0.0",
#   "tools": ["get_posts", "create_post", "wc.products.list", ...]
# }
```

### Test via le SaaS

1. Dans le SaaS Claudeus: **Dashboard > Sites > Ajouter un site**
2. Entrer:
   - Nom: Nom de votre site
   - URL: https://votre-site.com
   - JWT Token: coller le token
3. Cliquer sur **Tester la connexion**
4. Si succès ✅: **Enregistrer le site**

---

## 4. Configuration WooCommerce (optionnel)

Si vous souhaitez gérer WooCommerce via le SaaS:

1. Installer et activer **WooCommerce**
2. Le plugin MCP détectera automatiquement WooCommerce
3. Les outils WooCommerce seront disponibles: `wc.products.*`, `wc.orders.*`, etc.

### Permissions WooCommerce

Assurez-vous que l'utilisateur associé au token a les capacités:
- `manage_woocommerce`
- `edit_products`
- `edit_shop_orders`

---

## 5. Endpoints MCP disponibles

Une fois installé, le plugin expose:

### Base URL
```
https://votre-site.com/wp-json/mcp/v1
```

### Endpoints principaux

| Endpoint | Méthode | Description |
|----------|---------|-------------|
| `/health` | GET | Vérifier l'état du plugin |
| `/tools` | GET | Lister tous les outils disponibles |
| `/tools/{tool_name}` | POST | Exécuter un outil MCP |

### Exemples d'outils

**Contenu:**
- `get_posts` - Récupérer les articles
- `create_post` - Créer un article
- `update_post` - Modifier un article
- `delete_post` - Supprimer un article

**WooCommerce:**
- `wc.products.list` - Lister les produits
- `wc.products.create` - Créer un produit
- `wc.products.update` - Modifier un produit
- `wc.orders.list` - Lister les commandes

**Médias:**
- `list_media` - Lister les médias
- `upload_media` - Uploader un fichier
- `delete_media` - Supprimer un média

**Menus:**
- `list_menus` - Lister les menus
- `create_menu` - Créer un menu
- `add_menu_item` - Ajouter un élément de menu

---

## 6. Sécurité

### Bonnes pratiques

1. **Utiliser JWT plutôt qu'Application Passwords**
2. **Révoquer les tokens inutilisés**
3. **Définir une expiration courte** (30 jours recommandé)
4. **Audit régulier des logs**
5. **HTTPS obligatoire** en production

### Logs et audit

Le plugin MCP enregistre toutes les actions dans:
- **WordPress Admin > Outils > Logs MCP**
- Voir: qui a appelé quel outil, quand, résultat

---

## 7. Troubleshooting

### Erreur 404: Endpoint not found

**Cause:** Permaliens non régénérés

**Solution:**
```bash
# Via WP-CLI
wp rewrite flush

# Ou via Admin
# Réglages > Permaliens > Enregistrer
```

### Erreur 401: Unauthorized

**Cause:** Token JWT invalide ou expiré

**Solution:**
1. Régénérer un nouveau token dans WordPress Admin
2. Mettre à jour le token dans le SaaS

### Erreur 403: Forbidden

**Cause:** Permissions insuffisantes

**Solution:**
1. Vérifier les capacités de l'utilisateur
2. S'assurer que l'utilisateur est administrateur
3. Ou ajouter les capacités nécessaires:
```php
$user = get_user_by('login', 'username');
$user->add_cap('manage_mcp_tools');
```

### Erreur 500: Internal Server Error

**Cause:** Erreur PHP côté serveur

**Solution:**
1. Activer les logs WP: `define('WP_DEBUG_LOG', true);`
2. Consulter `/wp-content/debug.log`
3. Vérifier la compatibilité PHP (>= 8.0)

---

## 8. Configuration avancée

### Personnaliser les outils autorisés

Dans `wp-config.php`:

```php
// Désactiver certains outils
define('MCP_DISABLED_TOOLS', [
    'delete_user',
    'delete_site',
    'update_core',
]);

// Limiter le rate limiting
define('MCP_RATE_LIMIT', 100); // requêtes par heure
```

### Hook WordPress

Filtrer les outils avant exécution:

```php
add_filter('mcp_before_tool_execution', function($tool_name, $params) {
    // Votre logique de validation
    if ($tool_name === 'delete_post' && $params['force']) {
        return new WP_Error('forbidden', 'Force delete not allowed');
    }
    return true;
}, 10, 2);
```

---

## 9. Mise à jour du plugin

### Via Git

```bash
cd wp-content/plugins/wordpress-mcp
git pull origin main
npm install
npm run build
```

### Via l'admin WordPress

Si installé depuis ZIP, WordPress notifiera les mises à jour automatiquement.

---

## 10. Support

**Documentation officielle:**
https://github.com/Automattic/wordpress-mcp

**Issues GitHub:**
https://github.com/Automattic/wordpress-mcp/issues

**Support Claudeus SaaS:**
support@claudeus.com

---

## Prochaines étapes

Une fois le plugin installé et configuré:

1. ✅ Retourner au SaaS Claudeus
2. ✅ Ajouter votre site avec le JWT token
3. ✅ Configurer les permissions dans **Dashboard > Policies**
4. ✅ Commencer à chatter avec l'assistant AI
