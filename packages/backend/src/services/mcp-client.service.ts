import axios, { AxiosInstance } from 'axios';
import { prisma } from '../utils/database.js';
import { AppError } from '../middleware/errorHandler.js';
import { logger } from '../utils/logger.js';
import { decrypt } from '../utils/encryption.js';

interface McpToolCall {
  tool: string;
  params: Record<string, any>;
}

interface McpToolResult {
  success: boolean;
  data?: any;
  error?: string;
}

interface McpHealthStatus {
  isHealthy: boolean;
  version?: string;
  availableTools?: string[];
  lastChecked: Date;
}

/**
 * MCP Client Service
 * Communicates with WordPress MCP plugin via HTTP transport
 *
 * The WordPress MCP plugin (@automattic/wordpress-mcp) exposes MCP tools
 * via HTTP endpoints with JWT authentication.
 */
export class McpClientService {
  /**
   * Create an authenticated axios client for a site
   */
  private async createClient(siteId: string): Promise<AxiosInstance> {
    const site = await prisma.site.findUnique({
      where: { id: siteId },
    });

    if (!site) {
      throw new AppError('Site not found', 404);
    }

    if (!site.isActive) {
      throw new AppError('Site is not active', 403);
    }

    // Decrypt JWT token
    let jwtToken: string;
    if (site.mcpJwtToken && site.mcpJwtTokenIv) {
      jwtToken = decrypt(site.mcpJwtToken, site.mcpJwtTokenIv);
    } else if (site.username && site.passwordEncrypted && site.passwordIv) {
      // Fallback to Basic auth for legacy sites
      const password = decrypt(site.passwordEncrypted, site.passwordIv);
      const basicAuth = Buffer.from(`${site.username}:${password}`).toString(
        'base64'
      );
      jwtToken = basicAuth;
    } else {
      throw new AppError(
        'Site authentication not configured. Please set up the WordPress MCP plugin.',
        401
      );
    }

    // Create axios client with authentication
    const client = axios.create({
      baseURL: `${site.url}/wp-json/mcp/v1`,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
        Authorization: site.mcpJwtToken
          ? `Bearer ${jwtToken}`
          : `Basic ${jwtToken}`,
      },
    });

    // Add response interceptor for error handling
    client.interceptors.response.use(
      (response) => response,
      (error) => {
        logger.error('MCP API call failed', {
          siteId,
          url: error.config?.url,
          status: error.response?.status,
          message: error.response?.data?.message || error.message,
        });

        if (error.response?.status === 401) {
          throw new AppError(
            'WordPress authentication failed. Please check your MCP plugin configuration.',
            401
          );
        } else if (error.response?.status === 403) {
          throw new AppError(
            'Permission denied. This action is not allowed by the WordPress MCP plugin.',
            403
          );
        } else if (error.response?.status === 404) {
          throw new AppError(
            'WordPress MCP plugin endpoint not found. Is the plugin installed and activated?',
            404
          );
        } else {
          throw new AppError(
            error.response?.data?.message ||
              'Failed to communicate with WordPress site',
            error.response?.status || 500
          );
        }
      }
    );

    return client;
  }

  /**
   * Call an MCP tool on a WordPress site
   */
  async callTool(
    siteId: string,
    toolCall: McpToolCall
  ): Promise<McpToolResult> {
    try {
      const client = await this.createClient(siteId);

      logger.info('Calling MCP tool', {
        siteId,
        tool: toolCall.tool,
        params: toolCall.params,
      });

      // Call the MCP tool endpoint
      // The WordPress MCP plugin exposes tools at /wp-json/mcp/v1/tools/{tool_name}
      const response = await client.post(`/tools/${toolCall.tool}`, {
        params: toolCall.params,
      });

      logger.info('MCP tool call succeeded', {
        siteId,
        tool: toolCall.tool,
        success: response.data.success,
      });

      return {
        success: true,
        data: response.data,
      };
    } catch (error: any) {
      logger.error('MCP tool call failed', {
        siteId,
        tool: toolCall.tool,
        error: error.message,
      });

      return {
        success: false,
        error: error.message || 'Tool call failed',
      };
    }
  }

  /**
   * Health check - verify the MCP plugin is accessible and responding
   */
  async healthCheck(siteId: string): Promise<McpHealthStatus> {
    try {
      const client = await this.createClient(siteId);

      // Call the health endpoint
      const response = await client.get('/health');

      // Update site health status in database
      await prisma.site.update({
        where: { id: siteId },
        data: {
          isHealthy: true,
          lastChecked: new Date(),
          mcpPluginVersion: response.data.version || null,
        },
      });

      return {
        isHealthy: true,
        version: response.data.version,
        availableTools: response.data.tools || [],
        lastChecked: new Date(),
      };
    } catch (error: any) {
      logger.error('MCP health check failed', { siteId, error: error.message });

      // Update site health status
      await prisma.site.update({
        where: { id: siteId },
        data: {
          isHealthy: false,
          lastChecked: new Date(),
        },
      });

      return {
        isHealthy: false,
        lastChecked: new Date(),
      };
    }
  }

  /**
   * List available tools on a WordPress site
   */
  async listAvailableTools(siteId: string): Promise<string[]> {
    try {
      const client = await this.createClient(siteId);

      // Get list of tools from the plugin
      const response = await client.get('/tools');

      return response.data.tools || [];
    } catch (error) {
      logger.error('Failed to list MCP tools', { siteId, error });
      return [];
    }
  }

  /**
   * Test connection to a WordPress site with MCP plugin
   * Used during site onboarding
   */
  async testConnection(
    url: string,
    jwtToken: string
  ): Promise<{ success: boolean; version?: string; error?: string }> {
    try {
      const client = axios.create({
        baseURL: `${url}/wp-json/mcp/v1`,
        timeout: 10000,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${jwtToken}`,
        },
      });

      const response = await client.get('/health');

      return {
        success: true,
        version: response.data.version,
      };
    } catch (error: any) {
      logger.error('MCP connection test failed', {
        url,
        error: error.message,
      });

      return {
        success: false,
        error:
          error.response?.data?.message ||
          error.message ||
          'Connection failed',
      };
    }
  }

  /**
   * Map tool categories to specific MCP tool names
   * This helps translate high-level categories to actual MCP tools
   */
  getCategoryTools(category: string): string[] {
    const toolMap: Record<string, string[]> = {
      APPEARANCE_THEMES: [
        'list_themes',
        'activate_theme',
        'get_theme_mods',
        'set_theme_mod',
        'list_fse_templates',
        'get_fse_template',
        'update_fse_template',
      ],
      MENUS: [
        'list_menus',
        'create_menu',
        'update_menu',
        'delete_menu',
        'add_menu_item',
        'update_menu_item',
        'delete_menu_item',
      ],
      CONTENT: [
        'get_posts',
        'get_post',
        'create_post',
        'update_post',
        'delete_post',
        'get_pages',
        'create_page',
        'update_page',
        'delete_page',
        'get_categories',
        'create_category',
        'get_tags',
        'create_tag',
      ],
      MEDIA: [
        'list_media',
        'upload_media',
        'get_media',
        'update_media',
        'delete_media',
      ],
      WOOCOMMERCE: [
        'wc.products.list',
        'wc.products.get',
        'wc.products.create',
        'wc.products.update',
        'wc.products.delete',
        'wc.product_categories.list',
        'wc.product_categories.create',
        'wc.orders.list',
        'wc.orders.get',
        'wc.orders.update',
        'wc.customers.list',
        'wc.customers.get',
      ],
      USERS: [
        'list_users',
        'get_user',
        'create_user',
        'update_user',
        'delete_user',
        'list_roles',
      ],
      SETTINGS: [
        'get_site_info',
        'update_site_title',
        'update_site_description',
        'get_option',
        'update_option',
        'get_permalink_structure',
        'update_permalink_structure',
      ],
    };

    return toolMap[category] || [];
  }

  /**
   * Check if a specific tool is available for a category
   */
  isToolAllowedForCategory(tool: string, category: string): boolean {
    const categoryTools = this.getCategoryTools(category);
    return categoryTools.includes(tool);
  }
}
