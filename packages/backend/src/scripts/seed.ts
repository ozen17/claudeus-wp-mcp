import { PrismaClient } from '@prisma/client';
import { McpToolsService } from '../services/mcpTools.service.js';
import { logger } from '../utils/logger.js';

const prisma = new PrismaClient();
const mcpToolsService = new McpToolsService();

async function seedDatabase() {
  try {
    logger.info('🌱 Starting database seed...');

    // Seed MCP tools
    logger.info('📦 Seeding MCP tools catalog...');
    await mcpToolsService.seedTools();

    logger.info('✅ Database seeded successfully!');
    logger.info('');
    logger.info('Next steps:');
    logger.info('1. Users can now manage tools at /dashboard/tools');
    logger.info('2. Tools are ready to use in chat');
    logger.info('3. Check tool stats at /api/v1/mcp-tools/stats');

  } catch (error) {
    logger.error('❌ Seed failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

seedDatabase();
