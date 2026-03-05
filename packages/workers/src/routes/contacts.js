import { Hono } from 'hono';
const contactRouter = new Hono();
contactRouter.get('/', async (c) => {
  try {
    const user = c.get('user');
    const page = parseInt(c.query('page') || '1', 10);
    const limit = parseInt(c.query('limit') || '20', 10);
    const offset = (page - 1) * limit;
    const db = c.env.DB;
    const countResult = await db
      .prepare('SELECT COUNT(*) as count FROM contacts WHERE tenant_id = ?')
      .bind(user.tenantId)
      .first();
    const total = Number(countResult?.count) || 0;
    const results = await db
      .prepare(
        `SELECT * FROM contacts 
         WHERE tenant_id = ? 
         ORDER BY updated_at DESC 
         LIMIT ? OFFSET ?`
      )
      .bind(user.tenantId, limit, offset)
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
    console.error('[Contact List Error]', error);
    return c.json({ success: false, error: 'Failed to fetch contacts' }, 500);
  }
});
contactRouter.get('/:id', async (c) => {
  try {
    const user = c.get('user');
    const contactId = c.param('id');
    const db = c.env.DB;
    const contact = await db
      .prepare('SELECT * FROM contacts WHERE id = ? AND tenant_id = ?')
      .bind(contactId, user.tenantId)
      .first();
    if (!contact) {
      return c.json({ success: false, error: 'Contact not found' }, 404);
    }
    return c.json({ success: true, data: contact });
  } catch (error) {
    console.error('[Contact Get Error]', error);
    return c.json({ success: false, error: 'Failed to fetch contact' }, 500);
  }
});
contactRouter.post('/', async (c) => {
  try {
    const user = c.get('user');
    const body = await c.req.json();
    const { first_name, last_name, email, phone, company, job_title } = body;
    if (!first_name || !last_name) {
      return c.json({ success: false, error: 'First and last name required' }, 400);
    }
    const db = c.env.DB;
    const contactId = `contact_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const now = Math.floor(Date.now() / 1000);
    await db
      .prepare(
        `INSERT INTO contacts (
          id, tenant_id, first_name, last_name, email, phone, 
          company, job_title, status, created_by_id, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      )
      .bind(
        contactId,
        user.tenantId,
        first_name,
        last_name,
        email || null,
        phone || null,
        company || null,
        job_title || null,
        'lead',
        user.userId,
        now,
        now
      )
      .run();
    const newContact = await db
      .prepare('SELECT * FROM contacts WHERE id = ?')
      .bind(contactId)
      .first();
    return c.json({ success: true, data: newContact }, 201);
  } catch (error) {
    console.error('[Contact Create Error]', error);
    return c.json({ success: false, error: 'Failed to create contact' }, 500);
  }
});
contactRouter.put('/:id', async (c) => {
  try {
    const user = c.get('user');
    const contactId = c.param('id');
    const body = await c.req.json();
    const db = c.env.DB;
    const existing = await db
      .prepare('SELECT * FROM contacts WHERE id = ? AND tenant_id = ?')
      .bind(contactId, user.tenantId)
      .first();
    if (!existing) {
      return c.json({ success: false, error: 'Contact not found' }, 404);
    }
    const now = Math.floor(Date.now() / 1000);
    const updates = {
      ...existing,
      ...body,
      updated_at: now,
    };
    await db
      .prepare(
        `UPDATE contacts 
         SET first_name = ?, last_name = ?, email = ?, phone = ?, 
             company = ?, job_title = ?, status = ?, notes = ?, updated_at = ?
         WHERE id = ?`
      )
      .bind(
        updates.first_name,
        updates.last_name,
        updates.email,
        updates.phone,
        updates.company,
        updates.job_title,
        updates.status,
        updates.notes,
        now,
        contactId
      )
      .run();
    const updated = await db.prepare('SELECT * FROM contacts WHERE id = ?').bind(contactId).first();
    return c.json({ success: true, data: updated });
  } catch (error) {
    console.error('[Contact Update Error]', error);
    return c.json({ success: false, error: 'Failed to update contact' }, 500);
  }
});
contactRouter.delete('/:id', async (c) => {
  try {
    const user = c.get('user');
    const contactId = c.param('id');
    const db = c.env.DB;
    const existing = await db
      .prepare('SELECT * FROM contacts WHERE id = ? AND tenant_id = ?')
      .bind(contactId, user.tenantId)
      .first();
    if (!existing) {
      return c.json({ success: false, error: 'Contact not found' }, 404);
    }
    await db.prepare('DELETE FROM contacts WHERE id = ?').bind(contactId).run();
    return c.json({ success: true, message: 'Contact deleted' });
  } catch (error) {
    console.error('[Contact Delete Error]', error);
    return c.json({ success: false, error: 'Failed to delete contact' }, 500);
  }
});
export default contactRouter;
//# sourceMappingURL=contacts.js.map
