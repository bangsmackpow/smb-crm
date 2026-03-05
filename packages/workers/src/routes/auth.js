import { Hono } from 'hono';
import { generateAccessToken, generateRefreshToken, verifyToken, extractToken, hashPassword, comparePassword, isValidPassword, isValidEmail, } from '../lib/auth';
import { generateId, now } from '../lib/db';
const authRouter = new Hono();
authRouter.post('/register', async (c) => {
    try {
        const body = await c.req.json();
        const { email, password, tenantName, firstName, lastName } = body;
        if (!email || !password || !tenantName) {
            return c.json({
                success: false,
                error: 'Email, password, and tenant name are required',
            }, 400);
        }
        if (!isValidEmail(email)) {
            return c.json({
                success: false,
                error: 'Invalid email format',
            }, 400);
        }
        const passwordValidation = isValidPassword(password);
        if (!passwordValidation.valid) {
            return c.json({
                success: false,
                error: 'Password does not meet requirements',
                details: passwordValidation.errors,
            }, 400);
        }
        const db = c.env.DB;
        const timestamp = now();
        const existingUser = await db
            .prepare('SELECT id FROM users WHERE email = ?')
            .bind(email)
            .first();
        if (existingUser) {
            return c.json({
                success: false,
                error: 'Email already registered',
            }, 409);
        }
        const tenantId = generateId('tenant');
        const tenantSlug = tenantName
            .toLowerCase()
            .replace(/[^a-z0-9]/g, '-')
            .replace(/-+/g, '-')
            .slice(0, 50);
        try {
            await db
                .prepare(`INSERT INTO tenants (id, name, slug, plan, status, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, ?, ?)`)
                .bind(tenantId, tenantName, tenantSlug, 'free', 'active', timestamp, timestamp)
                .run();
        }
        catch (error) {
            if (error.message.includes('UNIQUE constraint failed')) {
                return c.json({
                    success: false,
                    error: 'Tenant name already in use',
                }, 409);
            }
            throw error;
        }
        const userId = generateId('user');
        const passwordHash = await hashPassword(password);
        await db
            .prepare(`INSERT INTO users (id, tenant_id, email, password_hash, first_name, last_name, role, status, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`)
            .bind(userId, tenantId, email, passwordHash, firstName || null, lastName || null, 'admin', 'active', timestamp, timestamp)
            .run();
        const accessToken = await generateAccessToken({
            userId,
            tenantId,
            email,
            role: 'admin',
        }, c.env);
        const refreshToken = await generateRefreshToken(userId, tenantId, c.env);
        return c.json({
            success: true,
            data: {
                accessToken,
                refreshToken,
                user: {
                    id: userId,
                    email,
                    firstName: firstName || null,
                    lastName: lastName || null,
                    role: 'admin',
                },
                tenant: {
                    id: tenantId,
                    name: tenantName,
                    slug: tenantSlug,
                    plan: 'free',
                },
            },
        }, 201);
    }
    catch (error) {
        console.error('[Register Error]', error);
        return c.json({
            success: false,
            error: 'Failed to register',
        }, 500);
    }
});
authRouter.post('/login', async (c) => {
    try {
        const body = await c.req.json();
        const { email, password } = body;
        if (!email || !password) {
            return c.json({
                success: false,
                error: 'Email and password required',
            }, 400);
        }
        const db = c.env.DB;
        const user = await db
            .prepare('SELECT * FROM users WHERE email = ? AND status = ?')
            .bind(email, 'active')
            .first();
        if (!user) {
            return c.json({
                success: false,
                error: 'Invalid email or password',
            }, 401);
        }
        const passwordMatch = await comparePassword(password, user.password_hash);
        if (!passwordMatch) {
            return c.json({
                success: false,
                error: 'Invalid email or password',
            }, 401);
        }
        const tenant = await db
            .prepare('SELECT * FROM tenants WHERE id = ?')
            .bind(user.tenant_id)
            .first();
        const accessToken = await generateAccessToken({
            userId: user.id,
            tenantId: user.tenant_id,
            email: user.email,
            role: user.role,
        }, c.env);
        const refreshToken = await generateRefreshToken(user.id, user.tenant_id, c.env);
        await db
            .prepare('UPDATE users SET last_login_at = ? WHERE id = ?')
            .bind(now(), user.id)
            .run();
        return c.json({
            success: true,
            data: {
                accessToken,
                refreshToken,
                user: {
                    id: user.id,
                    email: user.email,
                    firstName: user.first_name,
                    lastName: user.last_name,
                    role: user.role,
                },
                tenant: {
                    id: tenant?.id,
                    name: tenant?.name,
                    slug: tenant?.slug,
                    plan: tenant?.plan,
                },
            },
        });
    }
    catch (error) {
        console.error('[Login Error]', error);
        return c.json({
            success: false,
            error: 'Authentication failed',
        }, 500);
    }
});
authRouter.post('/refresh', async (c) => {
    try {
        const body = await c.req.json();
        const { refreshToken } = body;
        if (!refreshToken) {
            return c.json({
                success: false,
                error: 'Refresh token required',
            }, 400);
        }
        const payload = await verifyToken(refreshToken, c.env);
        if (!payload || payload.type !== 'refresh') {
            return c.json({
                success: false,
                error: 'Invalid refresh token',
            }, 401);
        }
        const db = c.env.DB;
        const user = await db
            .prepare('SELECT * FROM users WHERE id = ? AND tenant_id = ?')
            .bind(payload.userId, payload.tenantId)
            .first();
        if (!user || user.status !== 'active') {
            return c.json({
                success: false,
                error: 'User account is inactive or deleted',
            }, 401);
        }
        const accessToken = generateAccessToken({
            userId: user.id,
            tenantId: user.tenant_id,
            email: user.email,
            role: user.role,
        });
        return c.json({
            success: true,
            data: {
                accessToken,
            },
        });
    }
    catch (error) {
        console.error('[Refresh Error]', error);
        return c.json({
            success: false,
            error: 'Token refresh failed',
        }, 500);
    }
});
authRouter.post('/logout', async (c) => {
    try {
        return c.json({
            success: true,
            message: 'Logged out successfully',
        });
    }
    catch (error) {
        console.error('[Logout Error]', error);
        return c.json({
            success: false,
            error: 'Logout failed',
        }, 500);
    }
});
authRouter.get('/me', async (c) => {
    try {
        const authHeader = c.req.header('Authorization');
        const token = extractToken(authHeader);
        if (!token) {
            return c.json({
                success: false,
                error: 'Not authenticated',
            }, 401);
        }
        const payload = await verifyToken(token, c.env);
        if (!payload) {
            return c.json({
                success: false,
                error: 'Invalid token',
            }, 401);
        }
        const db = c.env.DB;
        const user = await db
            .prepare('SELECT * FROM users WHERE id = ? AND tenant_id = ?')
            .bind(payload.userId, payload.tenantId)
            .first();
        if (!user) {
            return c.json({
                success: false,
                error: 'User not found',
            }, 404);
        }
        const tenant = await db
            .prepare('SELECT * FROM tenants WHERE id = ?')
            .bind(payload.tenantId)
            .first();
        return c.json({
            success: true,
            data: {
                user: {
                    id: user.id,
                    email: user.email,
                    firstName: user.first_name,
                    lastName: user.last_name,
                    role: user.role,
                },
                tenant: {
                    id: tenant?.id,
                    name: tenant?.name,
                    slug: tenant?.slug,
                    plan: tenant?.plan,
                },
            },
        });
    }
    catch (error) {
        console.error('[Me Error]', error);
        return c.json({
            success: false,
            error: 'Failed to get user info',
        }, 500);
    }
});
export default authRouter;
//# sourceMappingURL=auth.js.map