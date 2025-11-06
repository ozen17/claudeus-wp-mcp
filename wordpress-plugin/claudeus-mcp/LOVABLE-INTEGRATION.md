# Lovable AI Pipeline Integration Guide

## 🎯 Overview

Le plugin Claudeus MCP v2 inclut maintenant un **adaptateur de compatibilité Lovable** qui permet l'intégration transparente avec le pipeline AI de Lovable.

## 🔧 Architecture Corrigée

### Endpoint Lovable-Compatible

Le plugin expose maintenant l'endpoint exact attendu par Lovable :

```
POST /wp-json/claudeus-mcp/v1/action
```

### Format de Requête

```json
{
  "action": "get_posts",
  "args": {
    "per_page": 10,
    "status": "publish"
  }
}
```

### Format de Réponse

```json
{
  "success": true,
  "action": "get_posts",
  "data": {
    // ... résultats WordPress REST API natifs
  }
}
```

## 📋 Actions Disponibles

### Content Management

#### Posts
- **`get_posts`** - Liste des posts avec filtres optionnels
  ```json
  {
    "action": "get_posts",
    "args": {
      "per_page": 10,
      "status": "publish",
      "orderby": "date",
      "order": "desc"
    }
  }
  ```

- **`get_post`** - Obtenir un post par ID
  ```json
  {
    "action": "get_post",
    "args": {"id": 123}
  }
  ```

- **`create_post`** - Créer un nouveau post
  ```json
  {
    "action": "create_post",
    "args": {
      "title": "Mon article",
      "content": "<p>Contenu HTML...</p>",
      "status": "publish",
      "categories": [1, 2],
      "tags": [5, 6]
    }
  }
  ```

- **`update_post`** - Mettre à jour un post
  ```json
  {
    "action": "update_post",
    "args": {
      "id": 123,
      "title": "Titre modifié",
      "content": "<p>Nouveau contenu...</p>"
    }
  }
  ```

- **`delete_post`** - Supprimer un post
  ```json
  {
    "action": "delete_post",
    "args": {"id": 123}
  }
  ```

#### Pages
- **`get_pages`** - Liste des pages
- **`get_page`** - Obtenir une page par ID
- **`create_page`** - Créer une page
- **`update_page`** - Mettre à jour une page
- **`delete_page`** - Supprimer une page

### Media Management

- **`get_media`** - Liste des fichiers media
  ```json
  {
    "action": "get_media",
    "args": {
      "per_page": 20,
      "media_type": "image"
    }
  }
  ```

- **`upload_media`** - Upload un fichier
  ```json
  {
    "action": "upload_media",
    "args": {
      "file": "base64_encoded_file_data",
      "title": "Mon image",
      "alt_text": "Description"
    }
  }
  ```

### User Management

- **`get_users`** - Liste des utilisateurs
- **`get_user`** - Obtenir un utilisateur par ID
- **`create_user`** - Créer un utilisateur
- **`update_user`** - Mettre à jour un utilisateur

### Taxonomy

- **`get_categories`** - Liste des catégories
- **`create_category`** - Créer une catégorie
- **`get_tags`** - Liste des tags
- **`create_tag`** - Créer un tag

### Comments

- **`get_comments`** - Liste des commentaires
- **`create_comment`** - Créer un commentaire
- **`update_comment`** - Mettre à jour un commentaire
- **`delete_comment`** - Supprimer un commentaire

### Settings

- **`get_settings`** - Obtenir les paramètres du site
- **`update_settings`** - Mettre à jour les paramètres

### WooCommerce

#### Products
- **`get_products`** - Liste des produits
- **`get_product`** - Obtenir un produit par ID
- **`create_product`** - Créer un produit
- **`update_product`** - Mettre à jour un produit
- **`delete_product`** - Supprimer un produit

#### Orders
- **`get_orders`** - Liste des commandes
- **`get_order`** - Obtenir une commande par ID
- **`create_order`** - Créer une commande
- **`update_order`** - Mettre à jour une commande

#### Customers
- **`get_customers`** - Liste des clients
- **`get_customer`** - Obtenir un client par ID
- **`create_customer`** - Créer un client

### Custom Actions

- **`get_site_health`** - Rapport de santé complet du site
- **`optimize_database`** - Optimiser la base de données

## 🔐 Authentification

Le plugin utilise JWT (JSON Web Token) pour l'authentification.

### 1. Générer un Token

```bash
POST /wp-json/claudeus-mcp/v1/auth/token
Content-Type: application/json

{
  "username": "admin",
  "password": "votre_mot_de_passe"
}
```

**Réponse** :
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "expires_in": 86400
}
```

### 2. Utiliser le Token

Incluez le token dans le header `Authorization` de chaque requête :

```bash
POST /wp-json/claudeus-mcp/v1/action
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json

{
  "action": "get_posts",
  "args": {"per_page": 10}
}
```

## 🚀 Intégration avec Edge Function

### Code Edge Function (TypeScript)

```typescript
// ai-chat/index.ts

interface WordPressAction {
  action: string;
  args?: Record<string, any>;
}

async function executeWordPressAction(
  wordpressUrl: string,
  token: string,
  action: string,
  args: Record<string, any> = {}
): Promise<any> {
  const response = await fetch(`${wordpressUrl}/wp-json/claudeus-mcp/v1/action`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      action,
      args
    })
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`WordPress action failed: ${error.message}`);
  }

  const result = await response.json();
  return result.data;
}

// Exemple d'utilisation avec LLM
async function handleAIChat(userMessage: string) {
  // 1. L'utilisateur demande : "Montre-moi les 5 derniers articles"

  // 2. Le LLM génère un tool_call
  const toolCall = {
    name: "get_posts",
    arguments: {
      per_page: 5,
      orderby: "date",
      order: "desc"
    }
  };

  // 3. Exécuter l'action WordPress
  const posts = await executeWordPressAction(
    process.env.WORDPRESS_URL,
    process.env.WORDPRESS_TOKEN,
    toolCall.name,
    toolCall.arguments
  );

  // 4. Retourner les résultats au LLM
  return {
    role: "function",
    name: toolCall.name,
    content: JSON.stringify(posts)
  };
}
```

### Configuration des Variables d'Environnement

```env
WORDPRESS_URL=https://votre-site.com
WORDPRESS_USERNAME=admin
WORDPRESS_PASSWORD=votre_mot_de_passe
```

### Génération Automatique du Token

```typescript
async function getWordPressToken(): Promise<string> {
  const response = await fetch(`${process.env.WORDPRESS_URL}/wp-json/claudeus-mcp/v1/auth/token`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      username: process.env.WORDPRESS_USERNAME,
      password: process.env.WORDPRESS_PASSWORD
    })
  });

  const result = await response.json();
  return result.token;
}
```

## 📖 Découverte des Actions

Pour obtenir la liste complète des actions disponibles :

```bash
GET /wp-json/claudeus-mcp/v1/actions
```

**Réponse** :
```json
{
  "total": 35,
  "actions": [
    {
      "name": "get_posts",
      "method": "GET",
      "endpoint": "wp/v2/posts",
      "description": "List WordPress posts with optional filters"
    },
    {
      "name": "create_post",
      "method": "POST",
      "endpoint": "wp/v2/posts",
      "description": "Create a new post"
    }
    // ... toutes les autres actions
  ]
}
```

## 🐛 Debugging

### Test Simple

```bash
# 1. Obtenir un token
curl -X POST https://votre-site.com/wp-json/claudeus-mcp/v1/auth/token \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"votre_mdp"}'

# 2. Tester une action
curl -X POST https://votre-site.com/wp-json/claudeus-mcp/v1/action \
  -H "Authorization: Bearer VOTRE_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"action":"get_posts","args":{"per_page":5}}'
```

### Erreurs Courantes

#### 1. "Action not supported"
**Cause** : L'action n'existe pas dans le mapping

**Solution** : Vérifier les actions disponibles via `/actions` endpoint

#### 2. "Unauthorized"
**Cause** : Token JWT invalide ou expiré

**Solution** : Régénérer un nouveau token

#### 3. "Invalid arguments"
**Cause** : Arguments incompatibles avec l'endpoint WordPress

**Solution** : Consulter la documentation WordPress REST API pour les paramètres acceptés

## 🔄 Mapping Action → Endpoint

L'adaptateur traduit automatiquement :

```
Action Lovable         → WordPress REST API Endpoint
-----------------------------------------------
get_posts              → GET /wp/v2/posts
create_post            → POST /wp/v2/posts
update_post            → POST /wp/v2/posts/{id}
delete_post            → DELETE /wp/v2/posts/{id}
get_products           → GET /wc/v3/products
create_order           → POST /wc/v3/orders
get_site_health        → GET /claudeus-mcp/v1/tools/health__get_full_report
```

## ✅ Avantages de l'Adaptateur

1. **Compatibilité Lovable** : Format exact attendu par Lovable
2. **Naming Convention** : Utilise les underscores standards (get_posts, create_post)
3. **Mapping Intelligent** : Traduit automatiquement vers WordPress REST API natif
4. **Extensible** : Facile d'ajouter de nouvelles actions
5. **Sans Overhead** : Proxy direct vers WordPress REST API (pas de duplication)

## 🎨 Personnalisation

Pour ajouter une action custom :

```php
// Dans lovable-adapter.php

private static $action_map = [
    // ... actions existantes ...

    // Votre action custom
    'my_custom_action' => [
        'method' => 'POST',
        'endpoint' => 'claudeus-mcp/v1/tools/custom__my_action'
    ],
];
```

## 📚 Ressources

- [WordPress REST API Handbook](https://developer.wordpress.org/rest-api/)
- [WooCommerce REST API](https://woocommerce.github.io/woocommerce-rest-api-docs/)
- [JWT Authentication](https://jwt.io/)

---

**Claudeus MCP v2.0** - WordPress AI Assistant Plugin avec Lovable Integration
