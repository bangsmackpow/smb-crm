import { Hono } from 'hono';
import type { JWTPayload } from './lib/auth';
interface Env {
  DB: D1Database;
  BUCKET: R2Bucket;
  ENVIRONMENT: string;
  LOG_LEVEL: string;
}
declare const app: Hono<
  {
    Bindings: Env;
    Variables: {
      user: JWTPayload;
    };
  },
  import('hono/types').BlankSchema,
  '/'
>;
export default app;
//# sourceMappingURL=index.d.ts.map
