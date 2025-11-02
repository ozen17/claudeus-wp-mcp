# Plan de Refactoring - Architecture v2 (Agent OpenAI + MCP Plugin)

## Changements majeurs

### 1. Architecture conceptuelle
- **Avant**: Chaque utilisateur fournit ses propres clés API (OpenAI/Anthropic)
- **Après**: Une seule clé OpenAI centralisée côté SaaS + Agent OpenAI dédié

### 2. Gestion des outils MCP
- **Avant**: 145 outils individuels avec toggles un par un
- **Après**: Toggles par **catégories** + actions (read/create/update/delete) + contraintes

### 3. Communication WordPress
- **Avant**: Appels REST API directs au site WP
- **Après**: Plugin `@automattic/mcp-wordpress-remote` installé sur le site + auth JWT

## Modifications du schéma Prisma

### À supprimer
- ❌ `ApiKey` model (plus besoin de clés par utilisateur)
- ❌ `McpTool` model (remplacé par catégories)
- ❌ `UserMcpTool` model (remplacé par policies)
- ❌ `ApiProvider` enum (toujours OpenAI)

### À ajouter
```prisma
// Catégories d'outils
enum ToolCategoryType {
  APPEARANCE_THEMES
  MENUS
  CONTENT
  MEDIA
  WOOCOMMERCE
  USERS
  SETTINGS
}

// Actions autorisées
enum PolicyAction {
  READ
  CREATE
  UPDATE
  DELETE
  PUBLISH
}

// Règles de politique par catégorie
model PolicyRule {
  id              String            @id @default(cuid())
  sitePolicyId    String
  sitePolicy      SitePolicy        @relation(fields: [sitePolicyId], references: [id])

  category        ToolCategoryType
  actions         PolicyAction[]    // Actions autorisées

  // Contraintes optionnelles
  maxOpsPerDay    Int?              // Max opérations par jour
  minPrice        Decimal?          // Prix min (WooCommerce)
  maxPrice        Decimal?          // Prix max (WooCommerce)
  requireConfirm  Boolean           @default(false) // Demander confirmation

  createdAt       DateTime          @default(now())
  updatedAt       DateTime          @updatedAt

  @@unique([sitePolicyId, category])
}

// Politique par site
model SitePolicy {
  id          String       @id @default(cuid())
  siteId      String       @unique
  site        Site         @relation(fields: [siteId], references: [id])

  rules       PolicyRule[]

  createdAt   DateTime     @default(now())
  updatedAt   DateTime     @updatedAt
}

// Audit trail des actions
model AuditLog {
  id              String   @id @default(cuid())
  userId          String
  user            User     @relation(fields: [userId], references: [id])
  siteId          String
  site            Site     @relation(fields: [siteId], references: [id])

  category        ToolCategoryType
  action          PolicyAction
  toolName        String   // Nom de l'outil MCP appelé

  intent          String   @db.Text  // Ce que l'utilisateur a demandé
  result          String   @db.Text  // Résultat de l'action
  success         Boolean

  metadata        Json?    // Données supplémentaires

  createdAt       DateTime @default(now())

  @@index([userId, createdAt])
  @@index([siteId, createdAt])
}
```

### À modifier
```prisma
// Site - ajouter support MCP plugin
model Site {
  // ... existant ...

  // MCP Plugin authentication
  mcpJwtToken         String?   // Token JWT du plugin MCP
  mcpJwtTokenIv       String?   // IV pour chiffrement
  mcpPluginVersion    String?   // Version du plugin installé

  // Relations
  policy              SitePolicy?
  auditLogs           AuditLog[]
}

// User - supprimer relations API keys et MCP tools
model User {
  // ... existant sans apiKeys et mcpTools ...
  auditLogs           AuditLog[]
}

// Conversation - simplifier (toujours OpenAI)
model Conversation {
  // ... existant sans provider (toujours OPENAI) ...
  agentId     String?   // ID de l'Agent OpenAI utilisé
}
```

## Nouveaux services backend

### 1. `agent.service.ts` - Gestion Agent OpenAI
```typescript
- createAgent(): Créer l'Agent avec system prompt
- callAgent(conversationId, message, allowedTools): Appeler l'Agent
- getAgentResponse(): Parser la réponse
- handleToolCalls(): Gérer les appels d'outils
```

### 2. `mcp-client.service.ts` - Communication MCP WordPress
```typescript
- connectToSite(siteUrl, jwtToken): Établir connexion MCP
- callTool(toolName, params): Appeler un outil MCP
- healthCheck(siteId): Vérifier état du plugin
- listAvailableTools(siteId): Lister les outils disponibles
```

### 3. `policy.service.ts` - Gestion des politiques
```typescript
- getSitePolicy(siteId): Récupérer politique du site
- updatePolicyRule(siteId, category, rule): MAJ règle
- checkPermission(siteId, category, action): Vérifier autorisation
- getEnabledTools(siteId, category): Filtrer outils autorisés
- applyConstraints(siteId, category, params): Appliquer contraintes
```

### 4. Modifier `chat.service.ts`
```typescript
// Remplacer les appels directs OpenAI/Anthropic par:
- Appel à agent.service
- Filtrage des tools via policy.service
- Relay des tool calls via mcp-client.service
- Streaming de la réponse Agent
```

### 5. Supprimer
- ❌ `apiKey.service.ts`
- ❌ `mcpTools.service.ts`

## Modifications frontend

### Pages à supprimer
- ❌ `/dashboard/api-keys` (plus nécessaire)

### Pages à modifier
- ✏️ `/dashboard/sites` - Ajouter setup du plugin MCP
- ✏️ `/dashboard/chat` - Supprimer sélection provider
- ✏️ `/dashboard/tools` → `/dashboard/policies` - Refaire avec catégories

### Nouvelle page
- ➕ `/dashboard/audit` - Journal des actions

### Composants
- Supprimer `ApiKeyManager`
- Créer `PolicyManager` avec toggles par catégories
- Créer `SiteSetupWizard` pour installation plugin MCP

## Configuration Agent OpenAI

### System Prompt (extrait)
```
Tu es un assistant WordPress/WooCommerce expert. Tu aides les utilisateurs à gérer leur site via des outils MCP.

RÈGLES DE SÉCURITÉ:
1. Toujours respecter policyContext.allowedTools
2. Si un outil n'est pas autorisé, expliquer pourquoi et proposer alternative
3. Avant SUPPRESSION, résumer l'impact et demander confirm:true
4. Pour WooCommerce: ne jamais mettre prix < 0
5. Rester naturel, ne jamais montrer de syntaxe technique

STYLE:
- Parler naturellement en français
- Reformuler les actions techniques en langage simple
- Demander confirmation pour actions sensibles
```

### Tools déclarés
- Chaque catégorie = un "super-tool" qui relaie vers le backend
- Le backend filtre les outils MCP réels selon les policies

## Flux de données (nouveau)

```
User: "Ajoute un produit T-shirt à 20€"
  ↓
Frontend → POST /api/v1/chat
  ↓
Backend chat.service:
  1. Récupère sitePolicy
  2. Filtre allowedTools (WOOCOMMERCE + CREATE autorisé?)
  3. Appelle agent.service.callAgent(msg, allowedTools)
  ↓
Agent OpenAI:
  1. Comprend l'intent: créer produit WC
  2. Appelle tool "woocommerce_action" avec params
  ↓
Backend agent.service:
  1. Reçoit tool_call
  2. Vérifie policy.checkPermission(WOOCOMMERCE, CREATE)
  3. Appelle mcp-client.callTool("wc.products.create", {...})
  ↓
Plugin MCP WordPress (site client):
  1. Reçoit requête HTTP avec JWT
  2. Exécute WooCommerce API
  3. Retourne résultat
  ↓
Backend:
  1. Log AuditLog
  2. Retourne résultat à l'Agent
  3. Agent reformule en français
  ↓
Frontend: Affiche "J'ai créé le produit T-shirt à 20€"
```

## Migration

### Étapes
1. ✅ Créer nouveau schema.prisma
2. ✅ Générer migration: `npx prisma migrate dev --name v2-agent-architecture`
3. ✅ Créer script de migration des données (si prod)
4. ✅ Implémenter nouveaux services
5. ✅ Modifier chat.service
6. ✅ Refactoriser frontend
7. ✅ Tester end-to-end
8. ✅ Documentation

### Script de migration (données existantes)
```typescript
// Convertir McpTool → PolicyRule par catégorie
// Supprimer ApiKey (informer utilisateurs)
// Migrer Conversation (supprimer provider)
```

## Documentation à créer

1. **PLUGIN_SETUP.md** - Installation du plugin WordPress MCP
2. **AGENT_CONFIGURATION.md** - Configuration de l'Agent OpenAI
3. **POLICY_GUIDE.md** - Guide des toggles et contraintes
4. **MCP_INTEGRATION.md** - Architecture technique MCP

## Tests à ajouter

- [ ] Policy filtering
- [ ] MCP client communication
- [ ] Agent tool calls
- [ ] Audit logging
- [ ] Constraints validation

## Timeline estimé

- Migration schema: 1h
- Services backend: 4h
- Frontend refactoring: 3h
- Tests & debug: 2h
- Documentation: 1h

**Total: ~11h de dev**
