import express, { Application } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import { createServer } from 'http';

// Load environment variables
dotenv.config();

// Import routes
import authRoutes from './routes/auth.js';
import userRoutes from './routes/user.js';
import siteRoutes from './routes/site.js';
import chatRoutes from './routes/chat.js';
import subscriptionRoutes from './routes/subscription.js';
import apiKeyRoutes from './routes/apiKey.js';
import usageRoutes from './routes/usage.js';

// Import middleware
import { errorHandler } from './middleware/errorHandler.js';
import { requestLogger } from './middleware/logger.js';
import { rateLimiter } from './middleware/rateLimiter.js';

// Import utilities
import { logger } from './utils/logger.js';
import { initializeDatabase } from './utils/database.js';

const app: Application = express();
const server = createServer(app);
const PORT = process.env.PORT || 3001;

// ============================================
// Middleware
// ============================================

// Security
app.use(helmet());

// CORS
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
}));

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Logging
app.use(requestLogger);

// Rate limiting
app.use(rateLimiter);

// ============================================
// Health Check
// ============================================

app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV,
  });
});

// ============================================
// API Routes
// ============================================

const API_PREFIX = '/api/v1';

app.use(`${API_PREFIX}/auth`, authRoutes);
app.use(`${API_PREFIX}/user`, userRoutes);
app.use(`${API_PREFIX}/sites`, siteRoutes);
app.use(`${API_PREFIX}/chat`, chatRoutes);
app.use(`${API_PREFIX}/subscription`, subscriptionRoutes);
app.use(`${API_PREFIX}/api-keys`, apiKeyRoutes);
app.use(`${API_PREFIX}/usage`, usageRoutes);

// ============================================
// Error Handling
// ============================================

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: 'Not Found',
    message: `Route ${req.method} ${req.path} not found`,
  });
});

// Global error handler
app.use(errorHandler);

// ============================================
// Server Startup
// ============================================

async function startServer() {
  try {
    // Initialize database connection
    await initializeDatabase();
    logger.info('Database connection established');

    // Start server
    server.listen(PORT, () => {
      logger.info(`🚀 Server running on port ${PORT}`);
      logger.info(`📊 Environment: ${process.env.NODE_ENV}`);
      logger.info(`🔗 API: http://localhost:${PORT}${API_PREFIX}`);
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Handle graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM signal received: closing HTTP server');
  server.close(() => {
    logger.info('HTTP server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  logger.info('SIGINT signal received: closing HTTP server');
  server.close(() => {
    logger.info('HTTP server closed');
    process.exit(0);
  });
});

// Start the server
startServer();

export { app, server };
