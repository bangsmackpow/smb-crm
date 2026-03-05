import { Hono } from 'hono';
import type { JWTPayload } from '../lib/auth';
type Env = {
  DB: D1Database;
  BUCKET: R2Bucket;
};
export interface Communication {
  id: string;
  tenant_id: string;
  contact_id: string;
  deal_id?: string;
  type: 'email' | 'call' | 'sms' | 'meeting' | 'note';
  direction?: 'inbound' | 'outbound' | 'internal';
  subject?: string;
  content: string;
  metadata?: string;
  status: 'sent' | 'delivered' | 'read' | 'failed' | 'scheduled';
  scheduled_at?: number;
  sent_at?: number;
  created_by_id: string;
  created_at: number;
  updated_at: number;
}
export interface CommunicationTemplate {
  id: string;
  tenant_id: string;
  name: string;
  type: 'email' | 'sms' | 'call_script';
  subject?: string;
  content: string;
  variables?: string;
  is_default: boolean;
  created_by_id: string;
  created_at: number;
  updated_at: number;
}
declare const communicationRouter: Hono<
  {
    Bindings: Env;
    Variables: {
      user: JWTPayload;
    };
  },
  import('hono/types').BlankSchema,
  '/'
>;
export default communicationRouter;
//# sourceMappingURL=communications.d.ts.map
