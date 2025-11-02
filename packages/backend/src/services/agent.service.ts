import OpenAI from 'openai';
import { AppError } from '../middleware/errorHandler.js';
import { logger } from '../utils/logger.js';
import { SystemConfigService } from './systemConfig.service.js';

/**
 * System prompt for the WordPress AI Assistant Agent
 */
const SYSTEM_PROMPT = `Tu es un assistant WordPress/WooCommerce expert qui aide les utilisateurs à gérer leur site web.

## TES CAPACITÉS

Tu as accès à des outils MCP (Model Context Protocol) qui te permettent de:
- Gérer le contenu (articles, pages, catégories)
- Administrer les menus de navigation
- Gérer les médias (images, fichiers)
- Configurer l'apparence et les thèmes
- Gérer WooCommerce (produits, commandes, clients)
- Administrer les utilisateurs
- Modifier les réglages du site

## RÈGLES DE SÉCURITÉ STRICTES

1. **Respecter les permissions**: Tu DOIS vérifier que l'action demandée est autorisée dans policyContext.allowedTools
2. **Confirmations obligatoires**: Avant TOUTE suppression ou action destructrice, tu DOIS:
   - Résumer clairement l'impact de l'action
   - Lister ce qui sera supprimé/modifié
   - Attendre une confirmation explicite de l'utilisateur
3. **WooCommerce**:
   - Ne JAMAIS créer de produit avec un prix négatif
   - Respecter les contraintes minPrice et maxPrice si définies
   - Ne pas modifier les commandes déjà payées sans confirmation
4. **Contenu**:
   - Ne pas publier de contenu sans relecture si requireConfirm est activé
   - Respecter les limites maxPublishPerDay
5. **Utilisateurs**:
   - Ne JAMAIS supprimer le compte admin principal
   - Demander confirmation avant suppression d'utilisateur

## STYLE DE COMMUNICATION

- **Langage naturel**: Parle en français conversationnel, comme un collègue bienveillant
- **Transparence**: Explique ce que tu vas faire AVANT de le faire
- **Simplicité**: Évite le jargon technique, utilise des termes simples
- **Pédagogie**: Explique brièvement pourquoi tu fais certaines actions
- **JAMAIS de syntaxe technique**: Ne montre JAMAIS de noms d'outils, de commandes, de code ou de JSON à l'utilisateur

## EXEMPLES DE BONNES RÉPONSES

❌ MAUVAIS: "Je vais appeler l'outil wc.products.create avec les paramètres {name: 'T-shirt', price: 20}"
✅ BON: "Je vais créer un nouveau produit T-shirt à 20€ dans ta boutique."

❌ MAUVAIS: "Erreur: tool wc.products.create retourné 403"
✅ BON: "Je n'ai pas pu créer le produit car tu n'as pas activé la gestion des produits WooCommerce. Veux-tu que je t'explique comment l'activer?"

❌ MAUVAIS: "Succès: post_id 123 créé"
✅ BON: "Super ! J'ai créé ton article 'Guide du débutant'. Il est en brouillon, veux-tu que je le publie maintenant?"

## GESTION DES ERREURS

Quand un outil n'est pas autorisé ou échoue:
1. Explique clairement ce qui s'est passé en langage simple
2. Propose une alternative si possible
3. Guide l'utilisateur vers la solution (activer la permission, corriger une erreur)

## FLUX DE TRAVAIL

1. Comprendre l'intention de l'utilisateur
2. Vérifier les permissions (policyContext)
3. Si action destructrice → demander confirmation
4. Exécuter l'action via les outils MCP
5. Reformuler le résultat en français naturel
6. Proposer la prochaine étape logique

Rappelle-toi: tu es un assistant amical et compétent, pas un terminal technique. L'utilisateur ne doit JAMAIS voir de syntaxe, de noms d'outils ou de messages d'erreur bruts.`;

interface ToolCall {
  id: string;
  type: 'function';
  function: {
    name: string;
    arguments: string;
  };
}

interface ToolResult {
  tool_call_id: string;
  output: string;
}

interface PolicyContext {
  allowedTools: string[];
  siteId: string;
  userId: string;
  category?: string;
  constraints?: Record<string, any>;
}

export class AgentService {
  private client: OpenAI | null = null;
  private agentId: string | null = null;
  private systemConfigService: SystemConfigService;

  constructor() {
    this.systemConfigService = new SystemConfigService();
  }

  /**
   * Get OpenAI client (lazy initialization with API key from DB)
   */
  private async getClient(): Promise<OpenAI> {
    if (this.client) {
      return this.client;
    }

    // Get API key from database or environment
    const apiKey = await this.systemConfigService.getOpenAIKey();

    this.client = new OpenAI({ apiKey });
    return this.client;
  }

  /**
   * Get or create the WordPress AI Assistant Agent
   */
  async getOrCreateAgent(): Promise<string> {
    // En production, on pourrait stocker l'agent ID en base de données
    // Pour le MVP, on crée un nouvel agent à chaque démarrage
    if (this.agentId) {
      return this.agentId;
    }

    try {
      const client = await this.getClient();

      // Créer un nouvel assistant avec le system prompt
      const assistant = await client.beta.assistants.create({
        name: 'WordPress AI Assistant',
        description:
          'Expert WordPress/WooCommerce assistant that helps users manage their websites through natural conversation',
        model: 'gpt-4o',
        instructions: SYSTEM_PROMPT,
        tools: [
          {
            type: 'function',
            function: {
              name: 'execute_wordpress_action',
              description:
                'Execute a WordPress/WooCommerce action via MCP tools. This function relays to the backend which will call the appropriate MCP tool on the user\'s WordPress site.',
              parameters: {
                type: 'object',
                properties: {
                  category: {
                    type: 'string',
                    enum: [
                      'APPEARANCE_THEMES',
                      'MENUS',
                      'CONTENT',
                      'MEDIA',
                      'WOOCOMMERCE',
                      'USERS',
                      'SETTINGS',
                    ],
                    description: 'The category of action to perform',
                  },
                  action: {
                    type: 'string',
                    enum: ['READ', 'CREATE', 'UPDATE', 'DELETE', 'PUBLISH'],
                    description: 'The type of action to perform',
                  },
                  tool: {
                    type: 'string',
                    description:
                      'The specific MCP tool to call (e.g., "get_posts", "wc.products.create")',
                  },
                  params: {
                    type: 'object',
                    description:
                      'Parameters to pass to the MCP tool (varies by tool)',
                  },
                  requireConfirm: {
                    type: 'boolean',
                    description:
                      'Whether this action requires user confirmation (true for destructive operations)',
                  },
                },
                required: ['category', 'action', 'tool', 'params'],
              },
            },
          },
        ],
        temperature: 0.7,
        top_p: 1,
      });

      this.agentId = assistant.id;
      logger.info(`Created OpenAI Assistant: ${this.agentId}`);
      return this.agentId;
    } catch (error) {
      logger.error('Failed to create OpenAI Assistant', { error });
      throw new AppError('Failed to initialize AI Assistant', 500);
    }
  }

  /**
   * Process a message with the Agent
   */
  async* processMessage(
    threadId: string | null,
    message: string,
    policyContext: PolicyContext
  ): AsyncGenerator<string | ToolCall[], void, unknown> {
    try {
      const client = await this.getClient();
      const agentId = await this.getOrCreateAgent();

      // Create or use existing thread
      let thread;
      if (threadId) {
        thread = { id: threadId };
      } else {
        thread = await client.beta.threads.create();
      }

      // Add user message to thread
      await client.beta.threads.messages.create(thread.id, {
        role: 'user',
        content: message,
      });

      // Create a run with policy context in additional instructions
      const run = await client.beta.threads.runs.create(thread.id, {
        assistant_id: agentId,
        additional_instructions: `
CONTEXTE DE PERMISSIONS pour cette requête:
- Outils autorisés: ${policyContext.allowedTools.join(', ')}
- Site ID: ${policyContext.siteId}
- Catégorie: ${policyContext.category || 'Toutes'}
${policyContext.constraints ? `- Contraintes: ${JSON.stringify(policyContext.constraints)}` : ''}

Si l'utilisateur demande une action qui nécessite un outil non listé dans les outils autorisés, explique-lui gentiment qu'il doit d'abord activer cette permission dans les réglages de son site.
        `,
      });

      // Poll for run completion and stream results
      yield* this.streamRunResults(thread.id, run.id);

      // Return thread ID for conversation continuity
      return thread.id;
    } catch (error: any) {
      logger.error('Agent processing error', { error, message });
      throw new AppError(`Agent error: ${error.message}`, 500);
    }
  }

  /**
   * Stream run results (text and tool calls)
   */
  private async* streamRunResults(
    threadId: string,
    runId: string
  ): AsyncGenerator<string | ToolCall[], void, unknown> {
    const client = await this.getClient();
    let run = await client.beta.threads.runs.retrieve(threadId, runId);

    while (run.status === 'queued' || run.status === 'in_progress') {
      await new Promise((resolve) => setTimeout(resolve, 500));
      run = await client.beta.threads.runs.retrieve(threadId, runId);
    }

    if (run.status === 'completed') {
      // Get messages added by the assistant
      const messages = await client.beta.threads.messages.list(threadId, {
        order: 'asc',
        after: run.id,
      });

      for (const message of messages.data) {
        if (message.role === 'assistant') {
          for (const content of message.content) {
            if (content.type === 'text') {
              yield content.text.value;
            }
          }
        }
      }
    } else if (run.status === 'requires_action') {
      // Agent wants to call tools
      const toolCalls =
        run.required_action?.submit_tool_outputs?.tool_calls || [];
      yield toolCalls as ToolCall[];
    } else if (run.status === 'failed') {
      throw new AppError(`Agent run failed: ${run.last_error?.message}`, 500);
    } else if (run.status === 'cancelled') {
      throw new AppError('Agent run was cancelled', 500);
    }
  }

  /**
   * Submit tool outputs back to the agent
   */
  async submitToolOutputs(
    threadId: string,
    runId: string,
    toolOutputs: ToolResult[]
  ): Promise<void> {
    try {
      const client = await this.getClient();
      await client.beta.threads.runs.submitToolOutputs(threadId, runId, {
        tool_outputs: toolOutputs,
      });

      // Wait for completion
      let run = await client.beta.threads.runs.retrieve(threadId, runId);
      while (run.status === 'queued' || run.status === 'in_progress') {
        await new Promise((resolve) => setTimeout(resolve, 500));
        run = await client.beta.threads.runs.retrieve(threadId, runId);
      }
    } catch (error: any) {
      logger.error('Failed to submit tool outputs', { error, threadId, runId });
      throw new AppError(`Tool submission error: ${error.message}`, 500);
    }
  }

  /**
   * Delete a thread (cleanup)
   */
  async deleteThread(threadId: string): Promise<void> {
    try {
      const client = await this.getClient();
      await client.beta.threads.del(threadId);
    } catch (error) {
      logger.warn('Failed to delete thread', { error, threadId });
      // Non-critical error, just log it
    }
  }
}
