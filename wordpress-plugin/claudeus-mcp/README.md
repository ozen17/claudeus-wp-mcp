# Claudeus MCP - Complete WordPress AI Assistant Plugin v2.0

Plugin WordPress MCP (Model Context Protocol) ultra-complet avec **200+ outils** pour une gestion totale de WordPress et WooCommerce via API REST sécurisée.

## 🚀 Caractéristiques

- **200+ Outils MCP** organisés en 18 catégories
- **Découverte automatique** des endpoints WordPress REST API natifs
- **Extensions personnalisées** pour fonctionnalités avancées
- **Authentification JWT** sécurisée
- **Interface d'administration interactive** - Tools Explorer
- **Support WooCommerce complet** (50+ endpoints)
- **Architecture modulaire** et extensible
- **Documentation exhaustive** intégrée
- **✨ Lovable AI Pipeline Compatible** - Adaptateur intégré pour Lovable ([voir guide](LOVABLE-INTEGRATION.md))

## 📊 Outils Disponibles par Catégorie

### 1. Content Management (30+ outils)
**Gestion complète des contenus WordPress**

- **Posts** : list, get, create, update, delete, revisions, autosaves
- **Pages** : list, get, create, update, delete, revisions, autosaves
- **Reusable Blocks** : list, get, create, update, delete, revisions

**Endpoints natifs exposés**:
- `GET /wp/v2/posts` - Liste des articles
- `POST /wp/v2/posts` - Créer un article
- `GET /wp/v2/posts/{id}` - Obtenir un article
- `POST /wp/v2/posts/{id}` - Mettre à jour
- `DELETE /wp/v2/posts/{id}` - Supprimer
- `GET /wp/v2/posts/{id}/revisions` - Révisions
- ... et 20+ autres endpoints

**Extensions custom**:
- `claudeus_wp_content__bulk_trash` - Déplacer plusieurs posts à la corbeille
- `claudeus_wp_content__bulk_restore` - Restaurer depuis la corbeille
- `claudeus_wp_content__duplicate_post` - Dupliquer un post/page
- `claudeus_wp_content__export_content` - Exporter en JSON/XML

### 2. Media Library (4+ outils)
**Gestion de la bibliothèque de médias**

- Get, upload, update, delete media files
- Support des images, vidéos, PDF, documents

**Endpoints**:
- `GET /wp/v2/media` - Liste des médias
- `POST /wp/v2/media` - Upload d'un fichier
- `GET /wp/v2/media/{id}` - Détails d'un média
- `POST /wp/v2/media/{id}` - Mettre à jour
- `DELETE /wp/v2/media/{id}` - Supprimer

### 3. WooCommerce Shop (50+ outils)
**Gestion e-commerce complète**

#### Products (15+ outils)
- List, create, update, delete products
- Product variations management
- Product attributes
- Stock management
- Bulk operations

**Endpoints**:
- `GET /wc/v3/products`
- `POST /wc/v3/products`
- `GET /wc/v3/products/{id}`
- `GET /wc/v3/products/{id}/variations`
- `POST /wc/v3/products/batch` - Bulk operations

**Custom**:
- `claudeus_wp_wc__get_low_stock_products`
- `claudeus_wp_wc__bulk_update_stock`

#### Orders (10+ outils)
- List, get, create, update orders
- Order notes
- Refunds management

**Endpoints**:
- `GET /wc/v3/orders`
- `POST /wc/v3/orders`
- `GET /wc/v3/orders/{id}`
- `POST /wc/v3/orders/{id}/refunds`

#### Customers (8+ outils)
- Customer CRUD operations
- Customer orders history
- Download permissions

**Endpoints**:
- `GET /wc/v3/customers`
- `POST /wc/v3/customers`
- `GET /wc/v3/customers/{id}`

#### Coupons (6+ outils)
- Create, update, delete coupons
- Coupon validation

**Endpoints**:
- `GET /wc/v3/coupons`
- `POST /wc/v3/coupons`

#### Shipping (8+ outils)
- Shipping zones and methods
- Shipping classes

**Custom**:
- `claudeus_wp_wc__get_shipping_zones`
- `claudeus_wp_wc__configure_shipping_zone`

#### Payment Gateways (5+ outils)
**Custom**:
- `claudeus_wp_wc__get_payment_gateways`
- `claudeus_wp_wc__configure_payment_gateway`

#### Reports (8+ outils)
**Custom**:
- `claudeus_wp_wc__get_reports_sales`
- `claudeus_wp_wc__get_reports_top_products`
- `claudeus_wp_wc__get_reports_customers`
- `claudeus_wp_wc__get_abandoned_carts`

### 4. Taxonomy Management (12+ outils)
**Categories, tags et taxonomies personnalisées**

- Categories CRUD
- Tags CRUD
- Custom taxonomies
- Terms management

**Endpoints**:
- `GET /wp/v2/categories`
- `POST /wp/v2/categories`
- `GET /wp/v2/tags`
- `POST /wp/v2/tags`
- `GET /wp/v2/taxonomies`
- `GET /wp/v2/{taxonomy}/{id}`

### 5. User Management (10+ outils)
**Gestion des utilisateurs et permissions**

- Users CRUD
- Roles and capabilities
- Application passwords
- User meta

**Endpoints**:
- `GET /wp/v2/users`
- `POST /wp/v2/users`
- `GET /wp/v2/users/{id}`
- `GET /wp/v2/users/me`
- `POST /wp/v2/users/{id}/application-passwords`
- `GET /wp/v2/users/{id}/application-passwords`
- `DELETE /wp/v2/users/{id}/application-passwords/{uuid}`

### 6. Comment Management (8+ outils)
**Modération des commentaires**

- Comments CRUD
- Approve, spam, trash
- Comment replies

**Endpoints**:
- `GET /wp/v2/comments`
- `POST /wp/v2/comments`
- `GET /wp/v2/comments/{id}`
- `POST /wp/v2/comments/{id}` (approve/spam)
- `DELETE /wp/v2/comments/{id}`

### 7. Menu Management (10+ outils)
**Menus de navigation**

- Classic menus CRUD
- Menu items CRUD
- Menu locations

**Endpoints**:
- `GET /wp/v2/menus`
- `POST /wp/v2/menus`
- `GET /wp/v2/menu-items`
- `POST /wp/v2/menu-items`
- `GET /wp/v2/menu-locations`

### 8. Block Templates (10+ outils)
**Full Site Editing (FSE)**

- Templates CRUD
- Template parts CRUD
- Block patterns

**Endpoints**:
- `GET /wp/v2/templates`
- `POST /wp/v2/templates`
- `GET /wp/v2/template-parts`
- `POST /wp/v2/template-parts`

### 9. Global Styles (6+ outils)
**Theme.json et styles globaux**

- Get/update global styles
- Theme variations
- Revisions

**Endpoints**:
- `GET /wp/v2/global-styles/{id}`
- `POST /wp/v2/global-styles/{id}`
- `GET /wp/v2/global-styles/{id}/revisions`
- `GET /wp/v2/themes/{stylesheet}/global-styles/variations`

### 10. Block Patterns (3+ outils)
**Motifs de blocs**

- Get local patterns
- Pattern categories
- Pattern directory search

**Endpoints**:
- `GET /wp/v2/block-patterns/patterns`
- `GET /wp/v2/block-patterns/categories`
- `GET /wp/v2/pattern-directory/patterns`

### 11. Theme Management (7+ outils)
**Gestion des thèmes**

- List themes
- Get active theme
- Activate theme
- Theme customization
- Custom CSS

**Endpoints**:
- `GET /wp/v2/themes`
- `GET /wp/v2/themes/{stylesheet}`

### 12. Plugin Management (5+ outils)
**Gestion des extensions**

- List plugins
- Get plugin details
- Activate/Deactivate
- Delete plugins

**Endpoints**:
- `GET /wp/v2/plugins`
- `POST /wp/v2/plugins`
- `GET /wp/v2/plugins/{plugin}`
- `POST /wp/v2/plugins/{plugin}` (activate)
- `DELETE /wp/v2/plugins/{plugin}`

### 13. Widget Management (7+ outils)
**Sidebars et widgets**

- Sidebars list
- Widgets CRUD
- Widget instances

**Endpoints**:
- `GET /wp/v2/sidebars`
- `GET /wp/v2/widgets`
- `POST /wp/v2/widgets`
- `GET /wp/v2/widgets/{id}`
- `POST /wp/v2/widgets/{id}`
- `DELETE /wp/v2/widgets/{id}`

### 14. Site Settings (5+ outils)
**Configuration du site**

- Get/update settings
- Post types list
- Post statuses
- Timezone, language, etc.

**Endpoints**:
- `GET /wp/v2/settings`
- `POST /wp/v2/settings`
- `GET /wp/v2/types`
- `GET /wp/v2/statuses`

### 15. Site Health (8+ outils)
**Diagnostics et santé du site**

- Run health tests
- Check updates
- Directory sizes
- Database optimization

**Endpoints**:
- `GET /wp-site-health/v1/tests/*`
- `GET /wp-site-health/v1/directory-sizes`

**Custom**:
- `claudeus_wp_health__get_full_report`
- `claudeus_wp_health__check_updates`
- `claudeus_wp_health__optimize_database`
- `claudeus_wp_health__clear_all_caches`

### 16. Search & oEmbed (5+ outils)
**Recherche et embeds**

- Universal search
- oEmbed provider
- URL details

**Endpoints**:
- `GET /wp/v2/search`
- `GET /oembed/1.0/embed`
- `GET /oembed/1.0/proxy`

### 17. Navigation API (10+ outils)
**Block-based navigation**

- Navigation menus (FSE)
- Navigation items

**Endpoints**:
- `GET /wp/v2/navigation`
- `POST /wp/v2/navigation`
- `GET /wp/v2/navigation/{id}`
- `POST /wp/v2/navigation/{id}`
- `DELETE /wp/v2/navigation/{id}`

### 18. API Discovery (2 outils)
**Découverte de l'API**

**Custom**:
- `claudeus_wp_discovery__list_endpoints` - Liste tous les endpoints disponibles
- `claudeus_wp_discovery__get_schema` - Obtient le schéma d'un endpoint

---

## 🔧 Installation

### Via WordPress Admin

1. Téléchargez le dossier `claudeus-mcp`
2. Compressez en ZIP
3. WordPress → Extensions → Ajouter → Téléverser
4. Activez le plugin

### Via FTP

```bash
# Uploader le dossier vers
/wp-content/plugins/claudeus-mcp/
```

## 🔑 Configuration

### 1. Génération de Token JWT

```bash
POST https://votre-site.com/wp-json/claudeus-mcp/v1/auth/token

{
  "username": "admin",
  "password": "votre_mot_de_passe"
}
```

### 2. Utiliser le Token

```bash
Authorization: Bearer {votre_token_jwt}
```

### 3. Accéder au Tools Explorer

WordPress Admin → **Claudeus MCP** → **Tools Explorer**

Interface interactive pour explorer les 200+ outils disponibles avec:
- 🔍 Recherche en temps réel
- 📁 Filtrage par catégorie
- 📊 Statistiques détaillées
- 📋 Copie facile des noms d'outils
- 📖 Documentation intégrée

## 📚 Architecture du Plugin

```
claudeus-mcp/
├── claudeus-mcp.php                # Fichier principal
├── includes/
│   ├── class-auth.php              # Authentification JWT
│   ├── class-api-registry.php      # Registre des routes API
│   ├── class-tool-registry.php     # Registre centralisé des outils
│   ├── class-rest-proxy.php        # Proxy vers REST API natif
│   ├── admin/
│   │   ├── dashboard.php           # Dashboard principal
│   │   └── tools-explorer.php      # Explorateur d'outils interactif
│   └── endpoints/
│       ├── content.php             # 30+ outils content
│       ├── shop.php                # 50+ outils WooCommerce
│       ├── health.php              # 8+ outils santé
│       ├── discovery.php           # 2 outils découverte
│       └── ... (18 catégories)
├── assets/
│   ├── css/admin.css
│   └── js/admin.js
└── README.md
```

## 🎯 Utilisation des Outils

### Exemple 1: Créer un Article

```bash
POST /wp/v2/posts
Authorization: Bearer {token}

{
  "title": "Mon article",
  "content": "<p>Contenu...</p>",
  "status": "publish"
}
```

### Exemple 2: Lister les Produits WooCommerce

```bash
GET /wc/v3/products?per_page=20
Authorization: Bearer {token}
```

### Exemple 3: Rapport de Santé du Site

```bash
GET /claudeus-mcp/v1/tools/health__get_full_report
Authorization: Bearer {token}
```

## 🔒 Sécurité

- ✅ JWT Authentication obligatoire
- ✅ Permissions WordPress natives respectées
- ✅ Sanitization de toutes les entrées
- ✅ CORS configuré
- ✅ Rate limiting (recommandé)
- ✅ HTTPS obligatoire en production

## 🚀 Performance

Le plugin utilise:
- **Découverte automatique** des endpoints (pas de duplication de code)
- **Proxy intelligent** vers l'API WordPress native
- **Cache** des définitions d'outils
- **Architecture modulaire** chargée à la demande

## 📖 Documentation

- **Tools Explorer** : Interface admin complète
- **API Reference** : Documentation inline des 200+ outils
- **Examples** : Exemples de requêtes pour chaque outil
- **WordPress REST API Handbook** : https://developer.wordpress.org/rest-api/

## 🛠️ Développement

### Ajouter un outil custom

```php
// Dans includes/class-tool-registry.php

$this->register_tool([
    'name' => 'claudeus_wp_custom__my_tool',
    'description' => 'Description de mon outil',
    'category' => 'custom',
    'endpoint' => 'custom',
    'handler' => 'My_Custom_Handler::handle'
]);
```

### Créer un endpoint custom

```php
// Dans includes/endpoints/custom.php

class My_Custom_Endpoint {
    public static function handle($request) {
        // Votre logique
        return new WP_REST_Response($data, 200);
    }
}
```

## ❓ FAQ

### Combien d'outils sont disponibles exactement ?

**200+** outils répartis en 18 catégories. Le nombre exact dépend:
- Des endpoints WordPress REST API natifs disponibles (varie selon la version)
- Des plugins installés (WooCommerce ajoute 50+ outils)
- Des extensions custom activées

### Le plugin fonctionne sans WooCommerce ?

Oui ! Les 50+ outils WooCommerce sont simplement désactivés si WooCommerce n'est pas installé. Les 150+ autres outils fonctionnent normalement.

### Comment voir tous les outils disponibles ?

Allez dans **WordPress Admin → Claudeus MCP → Tools Explorer**. Vous verrez une interface interactive avec tous les outils, leur catégorie, description, et endpoints.

### Les outils utilisent-ils l'API WordPress native ?

Oui ! Le plugin expose de manière sécurisée le REST API WordPress natif (qui contient déjà 150-200 endpoints) et ajoute des extensions custom pour les fonctionnalités manquantes.

## 🐛 Support

- **GitHub Issues**: [claudeus-wp-mcp/issues](https://github.com/ozen17/claudeus-wp-mcp/issues)
- **Documentation**: Intégrée dans le plugin
- **Tools Explorer**: Interface admin interactive

## 📄 Licence

MIT License

## 👨‍💻 Auteurs

Développé par l'équipe **Claudeus** pour le SaaS WordPress AI Assistant.

## 🔄 Changelog

### Version 2.0.0 (2024-11-05)

- 🎉 Architecture complètement repensée
- ✅ 200+ outils MCP (vs 47 en v1)
- ✅ Découverte automatique des endpoints WordPress natifs
- ✅ Interface Tools Explorer interactive
- ✅ Support WooCommerce complet (50+ outils)
- ✅ Extensions custom pour fonctionnalités avancées
- ✅ Documentation exhaustive intégrée
- ✅ Architecture modulaire et extensible
- ✅ Proxy intelligent REST API
- ✅ Registre centralisé des outils

---

**Total**: 200+ outils MCP pour une gestion complète de WordPress et WooCommerce 🚀
