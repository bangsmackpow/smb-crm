import { SignJWT, jwtVerify } from 'jose';
const JWT_SECRET = 'your-secret-key-change-in-production';
const JWT_EXPIRY = 86400;
const JWT_REFRESH_EXPIRY = 604800;
function getEnvValue(env, key, defaultValue) {
  return env[key] || defaultValue;
}
export async function generateAccessToken(payload, env) {
  const secretKey = getEnvValue(env, 'JWT_SECRET', JWT_SECRET);
  const secret = new TextEncoder().encode(secretKey);
  const expiry = parseInt(getEnvValue(env, 'JWT_EXPIRY', JWT_EXPIRY.toString()), 10);
  return await new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(Math.floor(Date.now() / 1000) + expiry)
    .sign(secret);
}
export async function generateRefreshToken(userId, tenantId, env) {
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
export async function verifyToken(token, env) {
  try {
    const secretKey = getEnvValue(env, 'JWT_SECRET', JWT_SECRET);
    const secret = new TextEncoder().encode(secretKey);
    const { payload } = await jwtVerify(token, secret);
    return payload;
  } catch (error) {
    console.error('[JWT Error]', error);
    return null;
  }
}
export function extractToken(authHeader) {
  if (!authHeader) return null;
  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    return null;
  }
  return parts[1];
}
export async function hashPassword(password) {
  const encoder = new TextEncoder();
  const data = encoder.encode(password + 'salt');
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}
export async function comparePassword(password, hash) {
  const hashedPassword = await hashPassword(password);
  return hashedPassword === hash;
}
export function isValidPassword(password) {
  const errors = [];
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
export function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}
//# sourceMappingURL=auth.js.map
