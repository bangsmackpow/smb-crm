import { Hono } from 'hono';
import type { JWTPayload } from '../lib/auth';
type Env = {
    DB: D1Database;
    BUCKET: R2Bucket;
};
declare const contactRouter: Hono<{
    Bindings: Env;
    Variables: {
        user: JWTPayload;
    };
}, import("hono/types").BlankSchema, "/">;
export default contactRouter;
//# sourceMappingURL=contacts.d.ts.map