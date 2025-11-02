import { prisma } from '../utils/database.js';
import { AppError } from '../middleware/errorHandler.js';
import { logger } from '../utils/logger.js';
import { McpClientService } from './mcp-client.service.js';

type ToolCategoryType =
  | 'APPEARANCE_THEMES'
  | 'MENUS'
  | 'CONTENT'
  | 'MEDIA'
  | 'WOOCOMMERCE'
  | 'USERS'
  | 'SETTINGS';

type PolicyAction = 'READ' | 'CREATE' | 'UPDATE' | 'DELETE' | 'PUBLISH';

interface PolicyRuleData {
  category: ToolCategoryType;
  isEnabled: boolean;
  allowedActions: PolicyAction[];
  maxOpsPerDay?: number;
  minPrice?: number;
  maxPrice?: number;
  maxPublishPerDay?: number;
  requireConfirm?: boolean;
  metadata?: Record<string, any>;
}

interface CategoryInfo {
  category: ToolCategoryType;
  displayName: string;
  description: string;
  icon: string;
  availableActions: PolicyAction[];
}

/**
 * Policy Service
 * Manages category-based permissions and constraints
 */
export class PolicyService {
  private mcpClient: McpClientService;

  constructor() {
    this.mcpClient = new McpClientService();
  }

  /**
   * Get category information (for UI)
   */
  getCategoryInfo(): CategoryInfo[] {
    return [
      {
        category: 'APPEARANCE_THEMES',
        displayName: 'Apparence & Thèmes',
        description:
          'Gérer les thèmes, le customizer et les templates Full Site Editing',
        icon: 'Paintbrush',
        availableActions: ['READ', 'UPDATE'],
      },
      {
        category: 'MENUS',
        displayName: 'Menus',
        description: 'Créer et modifier les menus de navigation',
        icon: 'Menu',
        availableActions: ['READ', 'CREATE', 'UPDATE', 'DELETE'],
      },
      {
        category: 'CONTENT',
        displayName: 'Contenu',
        description: 'Gérer les articles, pages, catégories et tags',
        icon: 'FileText',
        availableActions: ['READ', 'CREATE', 'UPDATE', 'DELETE', 'PUBLISH'],
      },
      {
        category: 'MEDIA',
        displayName: 'Médias',
        description: 'Uploader et gérer les images et fichiers',
        icon: 'Image',
        availableActions: ['READ', 'CREATE', 'UPDATE', 'DELETE'],
      },
      {
        category: 'WOOCOMMERCE',
        displayName: 'WooCommerce',
        description: 'Gérer les produits, commandes et clients',
        icon: 'ShoppingCart',
        availableActions: ['READ', 'CREATE', 'UPDATE', 'DELETE'],
      },
      {
        category: 'USERS',
        displayName: 'Utilisateurs',
        description: 'Administrer les utilisateurs et leurs rôles',
        icon: 'Users',
        availableActions: ['READ', 'CREATE', 'UPDATE', 'DELETE'],
      },
      {
        category: 'SETTINGS',
        displayName: 'Réglages',
        description: 'Modifier les options et configuration du site',
        icon: 'Settings',
        availableActions: ['READ', 'UPDATE'],
      },
    ];
  }

  /**
   * Get or create site policy
   */
  async getSitePolicy(siteId: string) {
    // Check if site exists
    const site = await prisma.site.findUnique({
      where: { id: siteId },
    });

    if (!site) {
      throw new AppError('Site not found', 404);
    }

    // Get existing policy or create default
    let policy = await prisma.sitePolicy.findUnique({
      where: { siteId },
      include: { rules: true },
    });

    if (!policy) {
      // Create default policy with all categories enabled
      policy = await this.createDefaultPolicy(siteId);
    }

    return policy;
  }

  /**
   * Create default policy for a site
   * By default, all categories are enabled with READ and CREATE actions
   */
  private async createDefaultPolicy(siteId: string) {
    const categories: ToolCategoryType[] = [
      'APPEARANCE_THEMES',
      'MENUS',
      'CONTENT',
      'MEDIA',
      'WOOCOMMERCE',
      'USERS',
      'SETTINGS',
    ];

    const policy = await prisma.sitePolicy.create({
      data: {
        siteId,
        requireConfirmDelete: true,
        defaultEnabled: true,
        rules: {
          create: categories.map((category) => {
            // Default actions per category
            let defaultActions: PolicyAction[] = ['READ'];

            if (category === 'CONTENT') {
              defaultActions = ['READ', 'CREATE', 'UPDATE', 'PUBLISH'];
            } else if (category === 'APPEARANCE_THEMES') {
              defaultActions = ['READ', 'UPDATE'];
            } else if (category === 'SETTINGS') {
              defaultActions = ['READ', 'UPDATE'];
            } else {
              defaultActions = ['READ', 'CREATE', 'UPDATE'];
            }

            return {
              category,
              isEnabled: true,
              allowedActions: defaultActions,
              requireConfirm: category === 'USERS', // Require confirm for user actions
            };
          }),
        },
      },
      include: { rules: true },
    });

    logger.info('Created default policy for site', { siteId });
    return policy;
  }

  /**
   * Update a policy rule
   */
  async updatePolicyRule(
    siteId: string,
    category: ToolCategoryType,
    ruleData: Partial<PolicyRuleData>
  ) {
    // Get or create policy
    const policy = await this.getSitePolicy(siteId);

    // Find existing rule
    const existingRule = policy.rules.find((r) => r.category === category);

    if (existingRule) {
      // Update existing rule
      return prisma.policyRule.update({
        where: { id: existingRule.id },
        data: {
          isEnabled: ruleData.isEnabled ?? existingRule.isEnabled,
          allowedActions:
            ruleData.allowedActions ?? existingRule.allowedActions,
          maxOpsPerDay: ruleData.maxOpsPerDay ?? existingRule.maxOpsPerDay,
          minPrice: ruleData.minPrice ?? existingRule.minPrice,
          maxPrice: ruleData.maxPrice ?? existingRule.maxPrice,
          maxPublishPerDay:
            ruleData.maxPublishPerDay ?? existingRule.maxPublishPerDay,
          requireConfirm:
            ruleData.requireConfirm ?? existingRule.requireConfirm,
          metadata: ruleData.metadata ?? existingRule.metadata,
        },
      });
    } else {
      // Create new rule
      return prisma.policyRule.create({
        data: {
          sitePolicyId: policy.id,
          category,
          isEnabled: ruleData.isEnabled ?? true,
          allowedActions: ruleData.allowedActions ?? ['READ'],
          maxOpsPerDay: ruleData.maxOpsPerDay,
          minPrice: ruleData.minPrice,
          maxPrice: ruleData.maxPrice,
          maxPublishPerDay: ruleData.maxPublishPerDay,
          requireConfirm: ruleData.requireConfirm ?? false,
          metadata: ruleData.metadata,
        },
      });
    }
  }

  /**
   * Check if an action is permitted
   */
  async checkPermission(
    siteId: string,
    category: ToolCategoryType,
    action: PolicyAction
  ): Promise<{ allowed: boolean; reason?: string }> {
    const policy = await this.getSitePolicy(siteId);
    const rule = policy.rules.find((r) => r.category === category);

    if (!rule) {
      return { allowed: false, reason: 'Catégorie non configurée' };
    }

    if (!rule.isEnabled) {
      return { allowed: false, reason: 'Catégorie désactivée' };
    }

    if (!rule.allowedActions.includes(action)) {
      return { allowed: false, reason: `Action "${action}" non autorisée` };
    }

    // Check daily limits
    if (rule.maxOpsPerDay) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const opsToday = await prisma.auditLog.count({
        where: {
          siteId,
          category,
          action,
          createdAt: { gte: today },
        },
      });

      if (opsToday >= rule.maxOpsPerDay) {
        return {
          allowed: false,
          reason: `Limite quotidienne atteinte (${rule.maxOpsPerDay} opérations)`,
        };
      }
    }

    return { allowed: true };
  }

  /**
   * Get all enabled tools for a site based on policies
   * This is used to filter what the Agent can access
   */
  async getEnabledTools(siteId: string): Promise<string[]> {
    const policy = await this.getSitePolicy(siteId);
    const enabledTools: string[] = [];

    for (const rule of policy.rules) {
      if (rule.isEnabled && rule.allowedActions.length > 0) {
        // Get MCP tools for this category
        const categoryTools = this.mcpClient.getCategoryTools(rule.category);
        enabledTools.push(...categoryTools);
      }
    }

    return enabledTools;
  }

  /**
   * Apply constraints to tool parameters
   * E.g., enforce min/max prices for WooCommerce
   */
  async applyConstraints(
    siteId: string,
    category: ToolCategoryType,
    params: Record<string, any>
  ): Promise<Record<string, any>> {
    const policy = await this.getSitePolicy(siteId);
    const rule = policy.rules.find((r) => r.category === category);

    if (!rule) return params;

    const constrainedParams = { ...params };

    // WooCommerce price constraints
    if (category === 'WOOCOMMERCE' && 'price' in params) {
      const price = parseFloat(params.price);

      if (rule.minPrice && price < rule.minPrice.toNumber()) {
        throw new AppError(
          `Prix minimum autorisé: ${rule.minPrice}€`,
          400
        );
      }

      if (rule.maxPrice && price > rule.maxPrice.toNumber()) {
        throw new AppError(
          `Prix maximum autorisé: ${rule.maxPrice}€`,
          400
        );
      }
    }

    return constrainedParams;
  }

  /**
   * Check if confirmation is required for an action
   */
  async requiresConfirmation(
    siteId: string,
    category: ToolCategoryType,
    action: PolicyAction
  ): Promise<boolean> {
    const policy = await this.getSitePolicy(siteId);
    const rule = policy.rules.find((r) => r.category === category);

    // Always require confirmation for DELETE
    if (action === 'DELETE') {
      return policy.requireConfirmDelete;
    }

    return rule?.requireConfirm ?? false;
  }

  /**
   * Get policy context for Agent
   * This is passed to the Agent to inform it of permissions
   */
  async getPolicyContext(siteId: string, userId: string) {
    const enabledTools = await this.getEnabledTools(siteId);
    const policy = await this.getSitePolicy(siteId);

    // Build constraints summary
    const constraints: Record<string, any> = {};

    for (const rule of policy.rules) {
      if (rule.minPrice || rule.maxPrice) {
        constraints.priceRange = {
          min: rule.minPrice?.toNumber(),
          max: rule.maxPrice?.toNumber(),
        };
      }
      if (rule.maxOpsPerDay) {
        constraints.maxOpsPerDay = rule.maxOpsPerDay;
      }
      if (rule.maxPublishPerDay) {
        constraints.maxPublishPerDay = rule.maxPublishPerDay;
      }
    }

    return {
      allowedTools: enabledTools,
      siteId,
      userId,
      constraints,
    };
  }
}
