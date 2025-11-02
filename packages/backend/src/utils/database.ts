import { PrismaClient } from '@prisma/client';
import { logger } from './logger.js';

declare global {
  // eslint-disable-next-line no-var
  var prisma: PrismaClient | undefined;
}

// Prevent multiple instances of Prisma Client in development
export const prisma = global.prisma || new PrismaClient({
  log: process.env.NODE_ENV === 'development'
    ? ['query', 'error', 'warn']
    : ['error'],
});

if (process.env.NODE_ENV !== 'production') {
  global.prisma = prisma;
}

/**
 * Initialize database connection
 */
export async function initializeDatabase() {
  try {
    await prisma.$connect();
    logger.info('✅ Database connected successfully');
  } catch (error) {
    logger.error('❌ Database connection failed:', error);
    throw error;
  }
}

/**
 * Graceful database shutdown
 */
export async function disconnectDatabase() {
  await prisma.$disconnect();
  logger.info('Database disconnected');
}

// Handle process termination
process.on('beforeExit', async () => {
  await disconnectDatabase();
});
