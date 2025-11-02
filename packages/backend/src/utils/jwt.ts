import jwt from 'jsonwebtoken';
import { logger } from './logger.js';

const ACCESS_TOKEN_SECRET = process.env.JWT_ACCESS_SECRET || 'change-me-in-production';
const REFRESH_TOKEN_SECRET = process.env.JWT_REFRESH_SECRET || 'change-me-in-production';

const ACCESS_TOKEN_EXPIRY = '15m';
const REFRESH_TOKEN_EXPIRY = '7d';

export interface JWTPayload {
  userId: string;
  email: string;
  subscriptionTier?: string;
}

/**
 * Generate access token
 */
export function generateAccessToken(payload: JWTPayload): string {
  return jwt.sign(payload, ACCESS_TOKEN_SECRET, {
    expiresIn: ACCESS_TOKEN_EXPIRY,
  });
}

/**
 * Generate refresh token
 */
export function generateRefreshToken(payload: JWTPayload): string {
  return jwt.sign(payload, REFRESH_TOKEN_SECRET, {
    expiresIn: REFRESH_TOKEN_EXPIRY,
  });
}

/**
 * Verify access token
 */
export function verifyAccessToken(token: string): JWTPayload {
  try {
    return jwt.verify(token, ACCESS_TOKEN_SECRET) as JWTPayload;
  } catch (error) {
    logger.error('Access token verification failed:', error);
    throw new Error('Invalid or expired access token');
  }
}

/**
 * Verify refresh token
 */
export function verifyRefreshToken(token: string): JWTPayload {
  try {
    return jwt.verify(token, REFRESH_TOKEN_SECRET) as JWTPayload;
  } catch (error) {
    logger.error('Refresh token verification failed:', error);
    throw new Error('Invalid or expired refresh token');
  }
}

/**
 * Decode token without verification (for debugging)
 */
export function decodeToken(token: string): JWTPayload | null {
  try {
    return jwt.decode(token) as JWTPayload;
  } catch (error) {
    logger.error('Token decoding failed:', error);
    return null;
  }
}
