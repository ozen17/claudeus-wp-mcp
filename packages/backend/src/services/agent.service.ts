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
   * Get the configured WordPress AI Assistant (from admin settings)
   * The assistant must be created on platform.openai.com and its ID configured in admin dashboard
   */
  async getOrCreateAgent(): Promise<string> {
    // Return cached assistant ID if available
    if (this.agentId) {
      return this.agentId;
    }

    try {
      const client = await this.getClient();

      // Get assistant ID from system configuration
      const assistantId = await this.systemConfigService.getAssistantId();

      // Verify that the assistant exists on OpenAI
      try {
        await client.beta.assistants.retrieve(assistantId);
      } catch (retrieveError: any) {
        logger.error('Assistant ID not found on OpenAI', {
          assistantId,
          error: retrieveError.message,
        });
        throw new AppError(
          `Assistant ID "${assistantId}" not found on OpenAI. Please verify your configuration.`,
          500
        );
      }

      // Cache the assistant ID
      this.agentId = assistantId;
      logger.info('Using configured OpenAI Assistant', { assistantId });

      return assistantId;
    } catch (error: any) {
      if (error instanceof AppError) throw error;

      logger.error('Failed to retrieve Assistant', { error: error.message });

      if (error.message?.includes('not configured')) {
        throw new AppError(
          'OpenAI Assistant ID not configured. Please configure it in Admin Dashboard → Configuration.',
          500
        );
      }

      throw new AppError(
        'Failed to retrieve OpenAI Assistant. Please check your Assistant ID configuration.',
        500
      );
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
