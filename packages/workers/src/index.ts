import { Hono } from 'hono';
import { cors } from 'hono/cors';

// Import routes
import authRouter from './routes/auth';
import contactRouter from './routes/contacts';
import { extractToken, verifyToken } from './lib/auth';
import type { JWTPayload } from './lib/auth';

interface Env {
  DB: D1Database;
  BUCKET: R2Bucket;
  ENVIRONMENT: string;
  LOG_LEVEL: string;
}

const app = new Hono<{ Bindings: Env; Variables: { user: JWTPayload } }>();

// Middleware
app.use('*', cors({
  origin: '*',
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization'],
}));

// Auth middleware - validates JWT for protected routes
const auth = app.use(async (c, next) => {
  const authHeader = c.req.header('Authorization');
  const token = extractToken(authHeader);

  if (token) {
    const payload = verifyToken(token);
    if (payload) {
      c.set('user', payload);
    }
  }

  await next();
});

// Health check (no auth required)
app.get('/health', (c) => {
  return c.json({ status: 'ok', environment: c.env.ENVIRONMENT });
});

// API version info (no auth required)
app.get('/api/v1/health', (c) => {
  return c.json({
    status: 'ok',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
  });
});

// Public auth routes (no JWT required)
app.route('/api/v1/auth', authRouter);

// Protected routes - require auth below this point
app.use('/api/v1/*', auth);

// Contact routes (protected)
app.use('/api/v1/contacts', async (c, next) => {
  const user = c.get('user');
  if (!user) {
    return c.json({ success: false, error: 'Not authenticated' }, 401);
  }
  await next();
});
app.route('/api/v1/contacts', contactRouter);

// 404 handler
app.notFound((c) => {
  return c.json({ success: false, error: 'Not found' }, 404);
});

// Error handler
app.onError((err, c) => {
  console.error('[Error]', err);
  return c.json(
    {
      success: false,
      error:
        c.env.ENVIRONMENT === 'production'
          ? 'Internal server error'
          : err.message,
    },
    500
  );
});

export default app;
