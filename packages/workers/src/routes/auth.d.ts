import { Hono } from 'hono';
type Env = {
    DB: D1Database;
};
declare const authRouter: Hono<{
    Bindings: Env;
}, import("hono/types").BlankSchema, "/">;
export default authRouter;
//# sourceMappingURL=auth.d.ts.map