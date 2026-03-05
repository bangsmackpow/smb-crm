import { Hono } from 'hono';
const communicationRouter = new Hono();
communicationRouter.post('/', async (c) => {
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
    if (!contact_id || !type || !content) {
      return c.json(
        {
          success: false,
          error: 'Missing required fields: contact_id, type, content',
        },
        400
      );
    }
    const validTypes = ['email', 'call', 'sms', 'meeting', 'note'];
    if (!validTypes.includes(type)) {
      return c.json(
        {
          success: false,
          error: 'Invalid type. Must be one of: ' + validTypes.join(', '),
        },
        400
      );
    }
    const db = c.env.DB;
    const now = Date.now();
    const id = `comm_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
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
    if (type === 'email') {
      await updateEmailThread(db, user.tenantId, contact_id, deal_id, subject, id, now);
    }
    const response = {
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
      },
      500
    );
  }
});
communicationRouter.get('/', async (c) => {
  try {
    const user = c.get('user');
    const contactId = c.req.query('contactId');
    const dealId = c.req.query('dealId');
    const type = c.req.query('type');
    const page = parseInt(c.req.query('page') || '1', 10);
    const limit = parseInt(c.req.query('limit') || '20', 10);
    const offset = (page - 1) * limit;
    const db = c.env.DB;
    let whereClause = 'tenant_id = ?';
    const params = [user.tenantId];
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
    const countResult = await db
      .prepare(`SELECT COUNT(*) as count FROM communications WHERE ${whereClause}`)
      .bind(...params)
      .first();
    const total = Number(countResult?.count) || 0;
    const results = await db
      .prepare(
        `SELECT * FROM communications
         WHERE ${whereClause}
         ORDER BY created_at DESC
         LIMIT ? OFFSET ?`
      )
      .bind(...params, limit, offset)
      .all();
    const response = {
      items: results.results || [],
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
      },
      500
    );
  }
});
communicationRouter.post('/email/send', async (c) => {
  try {
    const user = c.get('user');
    const body = await c.req.json();
    const { contact_id, subject, content, template_id } = body;
    if (!contact_id || !subject || !content) {
      return c.json(
        {
          success: false,
          error: 'Missing required fields: contact_id, subject, content',
        },
        400
      );
    }
    const db = c.env.DB;
    const now = Date.now();
    const id = `comm_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
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
    await updateEmailThread(db, user.tenantId, contact_id, null, subject, id, now);
    const response = {
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
      },
      500
    );
  }
});
communicationRouter.get('/templates', async (c) => {
  try {
    const user = c.get('user');
    const type = c.req.query('type');
    const db = c.env.DB;
    let query = 'SELECT * FROM communication_templates WHERE tenant_id = ?';
    const params = [user.tenantId];
    if (type) {
      query += ' AND type = ?';
      params.push(type);
    }
    query += ' ORDER BY is_default DESC, name ASC';
    const results = await db
      .prepare(query)
      .bind(...params)
      .all();
    const response = {
      success: true,
      data: results.results || [],
    };
    return c.json(response);
  } catch (error) {
    console.error('Error fetching templates:', error);
    return c.json(
      {
        success: false,
        error: 'Failed to fetch templates',
      },
      500
    );
  }
});
async function updateEmailThread(db, tenantId, contactId, dealId, subject, messageId, timestamp) {
  if (!subject) return;
  const existingThread = await db
    .prepare(
      `SELECT id, message_ids FROM email_threads
       WHERE tenant_id = ? AND contact_id = ? AND subject = ?
       ORDER BY last_message_at DESC LIMIT 1`
    )
    .bind(tenantId, contactId, subject)
    .first();
  if (existingThread) {
    const messageIds = JSON.parse(existingThread.message_ids);
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
//# sourceMappingURL=communications.js.map
