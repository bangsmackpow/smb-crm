import { SignJWT, jwtVerify } from 'jose';
// import { hash, verify } from 'argon2'; // Temporarily disabled for Cloudflare Workers compatibility

export interface JWTPayload {
  userId: string;
  tenantId: string;
  email: string;
  role: string;
  type?: string;
  iat?: number;
  exp?: number;
}

const JWT_SECRET = 'your-secret-key-change-in-production'; // Will be overridden by env
const JWT_EXPIRY = 86400; // 24 hours default
const JWT_REFRESH_EXPIRY = 604800; // 7 days

// Helper function to get env value
function getEnvValue(env: any, key: string, defaultValue: string): string {
  return env[key] || defaultValue;
}

/**
 * Generate JWT access token
 */
export async function generateAccessToken(
  payload: Omit<JWTPayload, 'iat' | 'exp'>,
  env?: any
): Promise<string> {
  const secretKey = getEnvValue(env, 'JWT_SECRET', JWT_SECRET);
  const secret = new TextEncoder().encode(secretKey);
  const expiry = parseInt(getEnvValue(env, 'JWT_EXPIRY', JWT_EXPIRY.toString()), 10);

  return await new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(Math.floor(Date.now() / 1000) + expiry)
    .sign(secret);
}

/**
 * Generate JWT refresh token (longer expiry)
 */
export async function generateRefreshToken(
  userId: string,
  tenantId: string,
  env?: any
): Promise<string> {
  const secretKey = getEnvValue(env, 'JWT_SECRET', JWT_SECRET);
  const secret = new TextEncoder().encode(secretKey);
  const refreshExpiry = parseInt(
    getEnvValue(env, 'JWT_REFRESH_EXPIRY', JWT_REFRESH_EXPIRY.toString()),
    10
  );

  return await new SignJWT({
    userId,
    tenantId,
    type: 'refresh',
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(Math.floor(Date.now() / 1000) + refreshExpiry)
    .sign(secret);
}

/**
 * Verify and decode JWT token
 */
export async function verifyToken(token: string, env?: any): Promise<JWTPayload | null> {
  try {
    const secretKey = getEnvValue(env, 'JWT_SECRET', JWT_SECRET);
    const secret = new TextEncoder().encode(secretKey);
    const { payload } = await jwtVerify(token, secret);
    return payload as unknown as JWTPayload;
  } catch (error) {
    console.error('[JWT Error]', error);
    return null;
  }
}

/**
 * Extract token from Authorization header
 */
export function extractToken(authHeader: string | null | undefined): string | null {
  if (!authHeader) return null;

  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    return null;
  }

  return parts[1];
}

/**
 * Hash password using Web Crypto API (placeholder - replace with proper implementation)
 */
export async function hashPassword(password: string): Promise<string> {
  // TODO: Implement proper password hashing compatible with Cloudflare Workers
  // For now, using a simple hash for development
  const encoder = new TextEncoder();
  const data = encoder.encode(password + 'salt');
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Compare password using Web Crypto API (placeholder - replace with proper implementation)
 */
export async function comparePassword(password: string, hash: string): Promise<boolean> {
  // TODO: Implement proper password verification compatible with Cloudflare Workers
  const hashedPassword = await hashPassword(password);
  return hashedPassword === hash;
}

/**
 * Validate password strength
 */
export function isValidPassword(password: string): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (password.length < 8) {
    errors.push('Password must be at least 8 characters');
  }
  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain uppercase letter');
  }
  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain lowercase letter');
  }
  if (!/[0-9]/.test(password)) {
    errors.push('Password must contain number');
  }
  if (!/[^A-Za-z0-9]/.test(password)) {
    errors.push('Password must contain special character');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Validate email format
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}
