/**
 * Communication routes for SMB CRM
 * Implements communication logging, email sending, and template management
 */

import { Hono, type Context } from 'hono';
import type { JWTPayload } from '../lib/auth';
import type { APIResponse, PaginatedResponse } from '../types';

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
  metadata?: string; // JSON string
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
  variables?: string; // JSON array
  is_default: boolean;
  created_by_id: string;
  created_at: number;
  updated_at: number;
}

const communicationRouter = new Hono<{
  Bindings: Env;
  Variables: { user: JWTPayload };
}>();

// POST /api/v1/communications - Log a new communication
communicationRouter.post('/', async (c: any) => {
  try {
    const user = c.get('user');
    console.log('User from auth:', user);
    console.log('Request body:', await c.req.text());
    const body = await c.req.json();

    const {
      contact_id,
      deal_id,
      type,
      direction,
      subject,
      content,
      metadata,
      status = 'sent',
      scheduled_at,
    } = body;

    // Validate required fields
    if (!contact_id || !type || !content) {
      return c.json(
        {
          success: false,
          error: 'Missing required fields: contact_id, type, content',
        } as APIResponse,
        400
      );
    }

    // Validate type
    const validTypes = ['email', 'call', 'sms', 'meeting', 'note'];
    if (!validTypes.includes(type)) {
      return c.json(
        {
          success: false,
          error: 'Invalid type. Must be one of: ' + validTypes.join(', '),
        } as APIResponse,
        400
      );
    }

    const db = c.env.DB;
    const now = Date.now();
    const id = `comm_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Insert communication
    await db
      .prepare(
        `INSERT INTO communications (
          id, tenant_id, contact_id, deal_id, type, direction, subject, content,
          metadata, status, scheduled_at, sent_at, created_by_id, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      )
      .bind(
        id,
        user.tenantId,
        contact_id,
        deal_id || null,
        type,
        direction || null,
        subject || null,
        content,
        metadata ? JSON.stringify(metadata) : null,
        status,
        scheduled_at || null,
        status === 'sent' ? now : null,
        user.userId,
        now,
        now
      )
      .run();

    // If it's an email, update/create email thread
    if (type === 'email') {
      await updateEmailThread(db, user.tenantId, contact_id, deal_id, subject, id, now);
    }

    const response: APIResponse<Communication> = {
      success: true,
      data: {
        id,
        tenant_id: user.tenantId,
        contact_id,
        deal_id,
        type,
        direction,
        subject,
        content,
        metadata: metadata ? JSON.stringify(metadata) : undefined,
        status,
        scheduled_at,
        sent_at: status === 'sent' ? now : undefined,
        created_by_id: user.userId,
        created_at: now,
        updated_at: now,
      },
    };

    return c.json(response, 201);
  } catch (error) {
    console.error('Error creating communication:', error);
    return c.json(
      {
        success: false,
        error: 'Failed to create communication',
      } as APIResponse,
      500
    );
  }
});

// GET /api/v1/communications - Get communications with optional filters
communicationRouter.get('/', async (c: any) => {
  try {
    const user = c.get('user');
    const contactId = c.req.query('contactId');
    const dealId = c.req.query('dealId');
    const type = c.req.query('type');
    const page = parseInt(c.req.query('page') || '1', 10);
    const limit = parseInt(c.req.query('limit') || '20', 10);
    const offset = (page - 1) * limit;

    const db = c.env.DB;

    // Build WHERE clause
    let whereClause = 'tenant_id = ?';
    const params: any[] = [user.tenantId];

    if (contactId) {
      whereClause += ' AND contact_id = ?';
      params.push(contactId);
    }

    if (dealId) {
      whereClause += ' AND deal_id = ?';
      params.push(dealId);
    }

    if (type) {
      whereClause += ' AND type = ?';
      params.push(type);
    }

    // Get total count
    const countResult = await db
      .prepare(`SELECT COUNT(*) as count FROM communications WHERE ${whereClause}`)
      .bind(...params)
      .first();

    const total = Number(countResult?.count) || 0;

    // Get paginated results
    const results = await db
      .prepare(
        `SELECT * FROM communications
         WHERE ${whereClause}
         ORDER BY created_at DESC
         LIMIT ? OFFSET ?`
      )
      .bind(...params, limit, offset)
      .all();

    const response: PaginatedResponse<Communication> = {
      items: (results.results || []) as unknown as Communication[],
      total,
      page,
      limit,
      pages: Math.ceil(total / limit),
    };

    return c.json({ success: true, data: response });
  } catch (error) {
    console.error('Error fetching communications:', error);
    return c.json(
      {
        success: false,
        error: 'Failed to fetch communications',
      } as APIResponse,
      500
    );
  }
});

// POST /api/v1/communications/email/send - Send email (placeholder for now)
communicationRouter.post('/email/send', async (c: any) => {
  try {
    const user = c.get('user');
    const body = await c.req.json();

    const { contact_id, subject, content, template_id } = body;

    if (!contact_id || !subject || !content) {
      return c.json(
        {
          success: false,
          error: 'Missing required fields: contact_id, subject, content',
        } as APIResponse,
        400
      );
    }

    // TODO: Implement actual email sending via service like SendGrid, Mailgun, etc.
    // For now, just log the communication

    const db = c.env.DB;
    const now = Date.now();
    const id = `comm_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Insert as sent email
    await db
      .prepare(
        `INSERT INTO communications (
          id, tenant_id, contact_id, type, direction, subject, content,
          status, sent_at, created_by_id, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      )
      .bind(
        id,
        user.tenantId,
        contact_id,
        'email',
        'outbound',
        subject,
        content,
        'sent',
        now,
        user.userId,
        now,
        now
      )
      .run();

    // Update email thread
    await updateEmailThread(db, user.tenantId, contact_id, null, subject, id, now);

    const response: APIResponse<{ id: string; status: string }> = {
      success: true,
      data: { id, status: 'sent' },
      message: 'Email queued for sending (implementation pending)',
    };

    return c.json(response);
  } catch (error) {
    console.error('Error sending email:', error);
    return c.json(
      {
        success: false,
        error: 'Failed to send email',
      } as APIResponse,
      500
    );
  }
});

// GET /api/v1/communications/templates - Get communication templates
communicationRouter.get('/templates', async (c: any) => {
  try {
    const user = c.get('user');
    const type = c.req.query('type'); // email, sms, call_script

    const db = c.env.DB;

    let query = 'SELECT * FROM communication_templates WHERE tenant_id = ?';
    const params: any[] = [user.tenantId];

    if (type) {
      query += ' AND type = ?';
      params.push(type);
    }

    query += ' ORDER BY is_default DESC, name ASC';

    const results = await db
      .prepare(query)
      .bind(...params)
      .all();

    const response: APIResponse<CommunicationTemplate[]> = {
      success: true,
      data: (results.results || []) as unknown as CommunicationTemplate[],
    };

    return c.json(response);
  } catch (error) {
    console.error('Error fetching templates:', error);
    return c.json(
      {
        success: false,
        error: 'Failed to fetch templates',
      } as APIResponse,
      500
    );
  }
});

// Helper function to update/create email threads
async function updateEmailThread(
  db: D1Database,
  tenantId: string,
  contactId: string,
  dealId: string | null,
  subject: string | null,
  messageId: string,
  timestamp: number
) {
  if (!subject) return;

  // Try to find existing thread
  const existingThread = await db
    .prepare(
      `SELECT id, message_ids FROM email_threads
       WHERE tenant_id = ? AND contact_id = ? AND subject = ?
       ORDER BY last_message_at DESC LIMIT 1`
    )
    .bind(tenantId, contactId, subject)
    .first();

  if (existingThread) {
    // Update existing thread
    const messageIds = JSON.parse(existingThread.message_ids as string);
    messageIds.push(messageId);

    await db
      .prepare(
        `UPDATE email_threads
         SET message_ids = ?, last_message_at = ?, updated_at = ?
         WHERE id = ?`
      )
      .bind(JSON.stringify(messageIds), timestamp, timestamp, existingThread.id)
      .run();
  } else {
    // Create new thread
    const threadId = `thread_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    await db
      .prepare(
        `INSERT INTO email_threads (
          id, tenant_id, contact_id, deal_id, subject, message_ids,
          last_message_at, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
      )
      .bind(
        threadId,
        tenantId,
        contactId,
        dealId || null,
        subject,
        JSON.stringify([messageId]),
        timestamp,
        timestamp,
        timestamp
      )
      .run();
  }
}

export default communicationRouter;
