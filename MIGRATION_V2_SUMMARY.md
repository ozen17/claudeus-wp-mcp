# Migration v2 - Architecture OpenAI Agent + MCP Plugin

## 📋 Résumé des changements

Cette v2 représente une refonte architecturale majeure du SaaS Claudeus WordPress AI Assistant.

### Changements conceptuels

| Aspect | v1 (Ancien) | v2 (Nouveau) |
|--------|-------------|--------------|
| **Clés API** | Chaque utilisateur fournit ses propres clés OpenAI/Anthropic | Une seule clé OpenAI centralisée (côté SaaS) |
| **LLM** | Appels directs à OpenAI/Anthropic | Agent OpenAI avec system prompt robuste |
| **Gestion des outils** | 145 outils individuels (toggles un par un) | 7 catégories avec actions (READ/CREATE/UPDATE/DELETE/PUBLISH) |
| **Communication WP** | Appels REST API directs | Plugin WordPress MCP + auth JWT |
| **Architecture** | User → Backend → OpenAI → WP REST API | User → Backend → Agent OpenAI → MCP Client → WP Plugin MCP |

---

## 🚀 Avantages de la v2

### 1. Simplicité utilisateur
- ❌ Plus besoin de clés API OpenAI/Anthropic
- ✅ Onboarding simplifié: URL WP + JWT token

### 2. Coûts maîtrisés
- ✅ Un seul compte OpenAI (facturation centralisée)
- ✅ Contrôle total sur l'usage
- ✅ Possibilité de tarification au forfait

### 3. Sécurité renforcée
- ✅ System prompt validé et sécurisé
- ✅ Permissions par catégories + actions
- ✅ Audit trail complet
- ✅ Confirmations obligatoires pour actions destructrices

### 4. Expérience utilisateur
- ✅ Chat 100% en langage naturel
- ✅ L'utilisateur ne voit jamais de syntaxe technique
- ✅ Messages d'erreur compréhensibles
- ✅ Suggestions contextuelles

---

## 📦 Nouveaux fichiers créés

### Backend Services
```
packages/backend/src/services/
├── agent.service.ts         ✨ Gestion de l'Agent OpenAI
├── mcp-client.service.ts    ✨ Communication avec plugin WP MCP
├── policy.service.ts        ✨ Gestion des permissions par catégories
└── chat.service.ts          🔄 Refactorisé pour utiliser Agent
```

### Backend Routes
```
packages/backend/src/routes/
├── policies.ts              ✨ API pour gérer les toggles
├── audit.ts                 ✨ API pour consulter les logs
└── chat.ts                  🔄 Simplifié (plus de provider selection)
```

### Documentation
```
├── REFACTORING_PLAN_V2.md           📖 Plan détaillé de refactoring
├── WORDPRESS_MCP_PLUGIN_SETUP.md    📖 Guide d'installation plugin
└── MIGRATION_V2_SUMMARY.md          📖 Ce document
```

### Schéma Prisma
```
packages/backend/prisma/
└── schema.prisma           🔄 Refactorisé avec nouveaux models
```

---

## 🗄️ Changements base de données

### Models supprimés
```prisma
❌ ApiKey          // Plus de clés API par utilisateur
❌ McpTool         // Remplacé par catégories
❌ UserMcpTool     // Remplacé par PolicyRule
```

### Models ajoutés
```prisma
✅ SitePolicy      // Politique globale par site
✅ PolicyRule      // Règles par catégorie (CONTENT, MEDIA, etc.)
✅ AuditLog        // Trail complet des actions
```

### Models modifiés
```prisma
🔄 Site
   + mcpJwtToken (encrypted)
   + mcpPluginVersion
   + relation SitePolicy
   + relation AuditLog[]

🔄 Conversation
   - provider (toujours OpenAI)
   + agentId (thread OpenAI)

🔄 User
   - apiKeys (supprimé)
   - mcpTools (supprimé)
   + auditLogs (ajouté)
```

---

## 🎯 Nouvelles catégories d'outils

| Catégorie | Actions disponibles | Exemples d'outils MCP |
|-----------|--------------------|-----------------------|
| **APPEARANCE_THEMES** | READ, UPDATE | `list_themes`, `activate_theme`, `set_theme_mod` |
| **MENUS** | READ, CREATE, UPDATE, DELETE | `list_menus`, `create_menu`, `add_menu_item` |
| **CONTENT** | READ, CREATE, UPDATE, DELETE, PUBLISH | `get_posts`, `create_post`, `update_post` |
| **MEDIA** | READ, CREATE, UPDATE, DELETE | `list_media`, `upload_media`, `delete_media` |
| **WOOCOMMERCE** | READ, CREATE, UPDATE, DELETE | `wc.products.*`, `wc.orders.*` |
| **USERS** | READ, CREATE, UPDATE, DELETE | `list_users`, `create_user`, `delete_user` |
| **SETTINGS** | READ, UPDATE | `get_site_info`, `update_option` |

---

## 🔐 System Prompt Agent OpenAI

L'Agent est configuré avec un system prompt qui:

1. **Définit son rôle**: Assistant WordPress/WooCommerce expert
2. **Impose des règles de sécurité**:
   - Respecter `policyContext.allowedTools`
   - Demander confirmation avant suppression
   - Valider les contraintes (prix min/max, etc.)
3. **Style de communication**:
   - Langage naturel français
   - Jamais de syntaxe technique visible
   - Explications pédagogiques
4. **Gestion des erreurs**:
   - Messages d'erreur clairs
   - Propositions d'alternatives
   - Guidage vers la solution

### Exemple de dialogue

**❌ v1 (technique):**
```
User: "Crée un produit"
Assistant: "Erreur: tool wc.products.create requires params {name, price}"
```

**✅ v2 (naturel):**
```
User: "Crée un produit"
Assistant: "Avec plaisir ! Peux-tu me donner le nom du produit et son prix?"
User: "T-shirt à 20€"
Assistant: "Super ! J'ai créé le produit 'T-shirt' à 20€ dans ta boutique.
Il est en brouillon, veux-tu que je le publie maintenant?"
```

---

## 🛠️ Flux de données v2

```
┌─────────────┐
│   User      │ "Ajoute un produit T-shirt à 20€"
└──────┬──────┘
       │
       ▼
┌─────────────────────────────────────────────────┐
│           Frontend (Next.js)                    │
│  POST /api/v1/chat                              │
│  { message, siteId, conversationId }            │
└──────┬──────────────────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────────────────┐
│           Backend - ChatService                 │
│  1. Valider site et permissions                 │
│  2. Récupérer PolicyContext                     │
│  3. Appeler AgentService.processMessage()       │
└──────┬──────────────────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────────────────┐
│           AgentService                          │
│  1. Créer/récupérer thread OpenAI               │
│  2. Envoyer message avec PolicyContext          │
│  3. Agent comprend intent: créer produit WC     │
│  4. Agent appelle tool execute_wordpress_action │
└──────┬──────────────────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────────────────┐
│           ChatService.processToolCalls()        │
│  1. Vérifier permission (WOOCOMMERCE + CREATE)  │
│  2. Appliquer contraintes (minPrice/maxPrice)   │
│  3. Appeler McpClientService.callTool()         │
│  4. Logger AuditLog                             │
└──────┬──────────────────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────────────────┐
│           McpClientService                      │
│  HTTP POST to WordPress MCP Plugin              │
│  https://site.com/wp-json/mcp/v1/tools/wc...   │
│  Authorization: Bearer JWT_TOKEN                │
└──────┬──────────────────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────────────────┐
│     WordPress MCP Plugin (@automattic)          │
│  1. Valider JWT                                 │
│  2. Vérifier capacités utilisateur              │
│  3. Appeler WooCommerce API                     │
│  4. Retourner résultat                          │
└──────┬──────────────────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────────────────┐
│     Résultat remonté à l'Agent                  │
│     Agent reformule en français                 │
│     "J'ai créé le produit T-shirt à 20€"        │
└──────┬──────────────────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────────────────┐
│           Frontend - Streaming SSE              │
│  Affiche le message de l'Assistant              │
└─────────────────────────────────────────────────┘
```

---

## 📝 Checklist de migration

### Backend
- [x] Nouveau schema Prisma avec SitePolicy, PolicyRule, AuditLog
- [x] Services: agent.service, mcp-client.service, policy.service
- [x] Chat service refactorisé
- [x] Routes policies et audit
- [x] Suppression routes apiKey et mcpTools
- [x] .env.example mis à jour avec OPENAI_API_KEY

### Frontend (À faire)
- [ ] Supprimer page `/dashboard/api-keys`
- [ ] Créer page `/dashboard/policies` avec toggles par catégories
- [ ] Créer page `/dashboard/audit` pour consulter les logs
- [ ] Modifier page Sites pour ajouter setup MCP plugin
- [ ] Simplifier page Chat (supprimer sélection provider)

### Documentation
- [x] REFACTORING_PLAN_V2.md
- [x] WORDPRESS_MCP_PLUGIN_SETUP.md
- [x] MIGRATION_V2_SUMMARY.md

### Infrastructure
- [ ] Générer migration Prisma
- [ ] Tester end-to-end
- [ ] Déployer

---

## 🔄 Comment tester localement

### 1. Setup base de données
```bash
cd packages/backend
npx prisma generate
npx prisma migrate dev --name v2-agent-architecture
```

### 2. Configurer .env
```bash
# Copier .env.example
cp .env.example .env

# Ajouter votre clé OpenAI
OPENAI_API_KEY="sk-proj-..."
```

### 3. Installer plugin WordPress MCP
Suivre: `WORDPRESS_MCP_PLUGIN_SETUP.md`

### 4. Lancer le backend
```bash
npm run dev
```

### 5. Tester les endpoints

**Ajouter un site:**
```bash
POST /api/v1/sites
{
  "name": "Mon site",
  "url": "https://monsite.com",
  "mcpJwtToken": "eyJhbGc..."
}
```

**Récupérer la politique:**
```bash
GET /api/v1/policies/sites/{siteId}
```

**Mettre à jour une règle:**
```bash
PUT /api/v1/policies/sites/{siteId}/rules/CONTENT
{
  "isEnabled": true,
  "allowedActions": ["READ", "CREATE", "UPDATE", "PUBLISH"],
  "maxPublishPerDay": 10
}
```

**Chatter:**
```bash
POST /api/v1/chat
{
  "message": "Crée un article sur l'IA",
  "siteId": "..."
}
```

**Voir les logs:**
```bash
GET /api/v1/audit?siteId=...&limit=20
```

---

## ⚠️ Breaking Changes

### Pour les utilisateurs existants
- ❌ Les clés API stockées seront supprimées
- ❌ Les configurations d'outils individuels seront perdues
- ✅ Migration: créer des policies par défaut pour chaque site

### Pour les développeurs
- ❌ API `/api/v1/api-keys` supprimée
- ❌ API `/api/v1/mcp-tools` supprimée
- ✅ Nouvelles API: `/api/v1/policies` et `/api/v1/audit`
- ✅ Chat: `provider` supprimé, `siteId` requis

---

## 🎯 Prochaines étapes

1. **Frontend refactoring** (pages policies, audit, sites)
2. **Tests end-to-end** (Playwright)
3. **Documentation utilisateur** (guides, vidéos)
4. **Déploiement staging**
5. **Migration données prod** (si applicable)
6. **Déploiement production**

---

## 📚 Ressources

- [OpenAI Assistants API](https://platform.openai.com/docs/assistants/overview)
- [WordPress MCP Plugin](https://github.com/Automattic/wordpress-mcp)
- [Model Context Protocol](https://modelcontextprotocol.io/)
- [WooCommerce REST API](https://woocommerce.github.io/woocommerce-rest-api-docs/)

---

**Date de migration**: 2025-11-02
**Version**: 2.0.0
**Architecture**: OpenAI Agent + MCP WordPress Plugin
