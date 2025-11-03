import express, { Request, Response } from 'express';
import path from 'path';
import fs from 'fs';
import { AppError } from '../utils/errors';
import { asyncHandler } from '../middleware/asyncHandler';
import { logger } from '../utils/logger';

const router = express.Router();

/**
 * Download WordPress MCP Plugin
 * GET /api/v1/download/wordpress-mcp-plugin
 * Public endpoint - no authentication required
 */
router.get(
  '/wordpress-mcp-plugin',
  asyncHandler(async (req: Request, res: Response) => {
    const pluginPath = path.join(
      __dirname,
      '..',
      'public',
      'downloads',
      'wordpress-mcp-plugin.zip'
    );

    // Check if file exists
    if (!fs.existsSync(pluginPath)) {
      logger.warn('WordPress MCP plugin file not found', { path: pluginPath });
      throw new AppError(
        'Plugin file not found. Please contact support.',
        404
      );
    }

    // Get file stats
    const stat = fs.statSync(pluginPath);

    // Set headers for download
    res.setHeader('Content-Type', 'application/zip');
    res.setHeader(
      'Content-Disposition',
      'attachment; filename="wordpress-mcp-plugin.zip"'
    );
    res.setHeader('Content-Length', stat.size);

    // Stream file to response
    const fileStream = fs.createReadStream(pluginPath);
    fileStream.pipe(res);

    logger.info('WordPress MCP plugin downloaded', {
      size: stat.size,
      ip: req.ip,
    });
  })
);

/**
 * Get plugin info (version, size, etc.)
 * GET /api/v1/download/wordpress-mcp-plugin/info
 * Public endpoint
 */
router.get(
  '/wordpress-mcp-plugin/info',
  asyncHandler(async (req: Request, res: Response) => {
    const pluginPath = path.join(
      __dirname,
      '..',
      'public',
      'downloads',
      'wordpress-mcp-plugin.zip'
    );

    if (!fs.existsSync(pluginPath)) {
      throw new AppError('Plugin file not found', 404);
    }

    const stat = fs.statSync(pluginPath);

    res.json({
      available: true,
      filename: 'wordpress-mcp-plugin.zip',
      size: stat.size,
      sizeFormatted: `${(stat.size / 1024 / 1024).toFixed(2)} MB`,
      lastModified: stat.mtime,
    });
  })
);

export default router;
