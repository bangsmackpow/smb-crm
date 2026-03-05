import { Hono } from 'hono';
import { cors } from 'hono/cors';
import authRouter from './routes/auth';
import contactRouter from './routes/contacts';
import communicationRouter from './routes/communications';
import { extractToken, verifyToken } from './lib/auth';
const app = new Hono();
app.use(
  '*',
  cors({
    origin: '*',
    allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowHeaders: ['Content-Type', 'Authorization'],
  })
);
const authMiddleware = async (c, next) => {
  const authHeader = c.req.header('Authorization');
  const token = extractToken(authHeader);
  if (token) {
    const payload = await verifyToken(token, c.env);
    if (payload) {
      c.set('user', payload);
    }
  }
  await next();
};
app.get('/health', (c) => {
  return c.json({ status: 'ok', environment: c.env.ENVIRONMENT });
});
app.get('/api/v1/health', (c) => {
  return c.json({
    status: 'ok',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
  });
});
app.route('/api/v1/auth', authRouter);
app.use('/api/v1/*', authMiddleware);
app.use('/api/v1/contacts', async (c, next) => {
  const user = c.get('user');
  if (!user) {
    return c.json({ success: false, error: 'Not authenticated' }, 401);
  }
  await next();
});
app.route('/api/v1/contacts', contactRouter);
app.use('/api/v1/communications', async (c, next) => {
  const user = c.get('user');
  if (!user) {
    return c.json({ success: false, error: 'Not authenticated' }, 401);
  }
  await next();
});
app.route('/api/v1/communications', communicationRouter);
app.notFound((c) => {
  return c.json({ success: false, error: 'Not found' }, 404);
});
app.onError((err, c) => {
  console.error('[Error]', err);
  return c.json(
    {
      success: false,
      error: c.env.ENVIRONMENT === 'production' ? 'Internal server error' : err.message,
    },
    500
  );
});
export default app;
//# sourceMappingURL=index.js.map
