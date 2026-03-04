# Development Guide

This guide walks you through building features for the SMB CRM.

## Prerequisites

- Node.js 18+
- npm
- Wrangler CLI
- A Cloudflare account

## Project Structure Quick Reference

```
smb-crm/
├── packages/
│   ├── frontend/          # React app
│   │   ├── src/
│   │   │   ├── main.tsx   # Entry point
│   │   │   ├── App.tsx    # Root component
│   │   │   ├── pages/     # Page components
│   │   │   ├── components/# Reusable components
│   │   │   ├── hooks/     # Custom React hooks
│   │   │   ├── services/  # API calls
│   │   │   └── types/     # TypeScript types
│   │   ├── vite.config.ts
│   │   └── tsconfig.json
│   └── workers/           # Hono backend
│       ├── src/
│       │   ├── index.ts   # Main app
│       │   ├── routes/    # API endpoints
│       │   ├── lib/       # Utilities (db, auth)
│       │   └── types/     # Shared types
│       ├── wrangler.toml
│       └── tsconfig.json
├── database/
│   └── migrations/        # D1 SQL migrations
└── .github/
    └── workflows/         # CI/CD pipelines
```

## Development Workflow

### 1. Start Development Servers

```bash
npm run dev
```

Browser will fail initially (API unavailable), but servers will be running.

### 2. Typical Feature Development Flow

1. **Plan the feature**
   - Database schema changes?
   - New API endpoints?
   - New UI pages?

2. **Backend (Workers)**
   - Create migration if needed
   - Create route/endpoint
   - Add database queries
   - Test with curl or Postman

3. **Frontend (React)**
   - Create API service
   - Create components
   - Connect to API
   - Test locally

4. **Commit & Deploy**
   - Git commit with conventional message
   - Push to feature branch
   - Create PR
   - GitHub Actions tests & deploys

## Building a Feature: Contact Management

Let's build a complete feature to understand the pattern.

### Step 1: Database Schema

Contact table already exists in `database/migrations/001_init.sql`:

```sql
CREATE TABLE contacts (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  company TEXT,
  job_title TEXT,
  status TEXT NOT NULL DEFAULT 'lead',
  source TEXT,
  notes TEXT,
  created_by_id TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  FOREIGN KEY (tenant_id) REFERENCES tenants(id),
  FOREIGN KEY (created_by_id) REFERENCES users(id)
);
```

### Step 2: API Routes

An example contact router is provided in `packages/workers/src/routes/contacts.ts`.

### Step 3: API Service (Frontend)

Create `packages/frontend/src/services/contactService.ts`:

```typescript
import type { Contact, APIResponse, PaginatedResponse } from '../../../workers/src/types';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8787';

export const contactService = {
  async list(page = 1, limit = 20): Promise<PaginatedResponse<Contact>> {
    const response = await fetch(
      `${API_URL}/api/v1/contacts?page=${page}&limit=${limit}`,
      {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      }
    );
    
    if (!response.ok) throw new Error('Failed to fetch contacts');
    
    const data = await response.json() as APIResponse;
    return data.data as PaginatedResponse<Contact>;
  },

  async getById(id: string): Promise<Contact> {
    const response = await fetch(`${API_URL}/api/v1/contacts/${id}`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
      },
    });
    
    if (!response.ok) throw new Error('Failed to fetch contact');
    
    const data = await response.json() as APIResponse;
    return data.data as Contact;
  },

  async create(contact: Partial<Contact>): Promise<Contact> {
    const response = await fetch(`${API_URL}/api/v1/contacts`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
      },
      body: JSON.stringify(contact),
    });
    
    if (!response.ok) throw new Error('Failed to create contact');
    
    const data = await response.json() as APIResponse;
    return data.data as Contact;
  },

  async update(id: string, updates: Partial<Contact>): Promise<Contact> {
    const response = await fetch(`${API_URL}/api/v1/contacts/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
      },
      body: JSON.stringify(updates),
    });
    
    if (!response.ok) throw new Error('Failed to update contact');
    
    const data = await response.json() as APIResponse;
    return data.data as Contact;
  },

  async delete(id: string): Promise<void> {
    const response = await fetch(`${API_URL}/api/v1/contacts/${id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
      },
    });
    
    if (!response.ok) throw new Error('Failed to delete contact');
  },
};
```

### Step 4: React Hook (Frontend)

Create `packages/frontend/src/hooks/useContacts.ts`:

```typescript
import { useState, useEffect } from 'react';
import { contactService } from '../services/contactService';
import type { Contact, PaginatedResponse } from '../../../workers/src/types';

export function useContacts(page = 1) {
  const [data, setData] = useState<PaginatedResponse<Contact> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const result = await contactService.list(page);
        setData(result);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [page]);

  return { data, loading, error };
}
```

### Step 5: React Component (Frontend)

Create `packages/frontend/src/pages/Contacts.tsx`:

```typescript
import { useState } from 'react';
import { useContacts } from '../hooks/useContacts';
import { contactService } from '../services/contactService';
import type { Contact } from '../../../workers/src/types';

export function ContactsPage() {
  const [page, setPage] = useState(1);
  const { data, loading, error } = useContacts(page);
  const [isCreating, setIsCreating] = useState(false);

  const handleCreate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    const formData = new FormData(e.currentTarget);
    const newContact: Partial<Contact> = {
      first_name: formData.get('firstName') as string,
      last_name: formData.get('lastName') as string,
      email: formData.get('email') as string,
      phone: formData.get('phone') as string,
      company: formData.get('company') as string,
      job_title: formData.get('jobTitle') as string,
    };

    try {
      setIsCreating(true);
      await contactService.create(newContact);
      // Reload list
      window.location.reload();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to create contact');
    } finally {
      setIsCreating(false);
    }
  };

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div>
      <h1>Contacts</h1>
      
      <form onSubmit={handleCreate}>
        <input name="firstName" placeholder="First Name" required />
        <input name="lastName" placeholder="Last Name" required />
        <input name="email" type="email" placeholder="Email" />
        <input name="phone" placeholder="Phone" />
        <input name="company" placeholder="Company" />
        <input name="jobTitle" placeholder="Job Title" />
        <button type="submit" disabled={isCreating}>
          {isCreating ? 'Creating...' : 'Add Contact'}
        </button>
      </form>

      <table>
        <thead>
          <tr>
            <th>Name</th>
            <th>Email</th>
            <th>Company</th>
            <th>Job Title</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {data?.items.map((contact) => (
            <tr key={contact.id}>
              <td>{contact.first_name} {contact.last_name}</td>
              <td>{contact.email}</td>
              <td>{contact.company}</td>
              <td>{contact.job_title}</td>
              <td>{contact.status}</td>
              <td>
                <button onClick={() => window.location.href = `/contacts/${contact.id}`}>
                  View
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <div>
        <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>
          Previous
        </button>
        <span>Page {data?.page} of {data?.pages}</span>
        <button onClick={() => setPage(p => p + 1)} disabled={page === data?.pages}>
          Next
        </button>
      </div>
    </div>
  );
}
```

## Common Development Tasks

### Add a New Database Table

1. Create migration:
   ```bash
   wrangler d1 migrations create smb-crm-db add_new_table
   ```

2. Write SQL in `database/migrations/XXX_add_new_table.sql`

3. Apply migration:
   ```bash
   npm run db:migrate
   ```

### Add a New API Endpoint

1. Create route file: `packages/workers/src/routes/myfeature.ts`
2. Export router from main index.ts
3. Mount in Hono app: `app.route('/api/v1/myfeature', myfeatureRouter)`

### Add a New Page

1. Create file: `packages/frontend/src/pages/MyPage.tsx`
2. Export component
3. Add route in App.tsx (using React Router)
4. Create navigation link

### Type Sharing

Both frontend and workers use the same types from `packages/workers/src/types/index.ts`.

When adding a new type:
1. Add to `packages/workers/src/types/index.ts`
2. Import in frontend: `import type { MyType } from '../../../workers/src/types'`

### Testing API Locally

Use curl:

```bash
# Get contacts
curl http://localhost:8787/api/v1/contacts \
  -H "Authorization: Bearer YOUR_TOKEN"

# Create contact
curl http://localhost:8787/api/v1/contacts \
  -X POST \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "first_name": "John",
    "last_name": "Doe",
    "email": "john@example.com"
  }'
```

## Best Practices

### 1. Always Check Tenant ID

```typescript
// ✅ Good - includes tenant_id
WHERE tenant_id = ? AND id = ?

// ❌ Bad - could expose other tenant's data
WHERE id = ?
```

### 2. Use Transactions for Multi-Step Operations

```typescript
await db.transaction(async (db) => {
  // Multiple operations
  // Auto-rollback on error
});
```

### 3. Error Handling

```typescript
try {
  // operation
} catch (error) {
  console.error('[Feature Name Error]', error);
  return c.json({ success: false, error: 'User-friendly message' }, 500);
}
```

### 4. Type Everything

```typescript
// ✅ Good
const getContact = async (id: string): Promise<Contact> => { ... }

// ❌ Bad
const getContact = async (id) => { ... }
```

### 5. Use Consistent Naming

- Tables: singular lowercase (contact, deal, task)
- Columns: snake_case (first_name, created_at)
- Functions: camelCase (getContact, createDeal)
- Constants: UPPER_SNAKE_CASE (JWT_EXPIRY)

## Git Workflow

1. Create feature branch:
   ```bash
   git checkout -b feature/add-contact-search
   ```

2. Make changes following conventional commits:
   ```bash
   git commit -m "feat(contacts): add search functionality"
   ```

3. Push and create PR:
   ```bash
   git push origin feature/add-contact-search
   ```

4. GitHub Actions will:
   - Run tests
   - Type check
   - Build
   - Apply migrations (if any)
   - Deploy to staging

5. Once merged to main, auto-deploys to production

## Debugging

### Frontend

- Open DevTools (F12)
- Check Console for errors
- Check Network tab for API calls
- Use React DevTools extension

### Backend

- Check Cloudflare Worker logs
- Use `console.log()` (appears in logs)
- Check database queries in Activity section
- Use `wrangler tail` to stream logs:
  ```bash
  wrangler tail
  ```

## Performance Tips

1. **Use Indexes** - Add indexes on frequently filtered columns
2. **Pagination** - Always paginate list endpoints
3. **Caching** - Use browser cache for static assets
4. **Lazy Loading** - Load components/features on demand
5. **Compression** - Vite automatically optimizes builds

## Reference

- [Hono.js Docs](https://hono.dev)
- [React Docs](https://react.dev)
- [Vite Docs](https://vitejs.dev)
- [Cloudflare Workers Docs](https://developers.cloudflare.com/workers/)
- [D1 Docs](https://developers.cloudflare.com/d1/)
- [Wrangler Docs](https://developers.cloudflare.com/workers/wrangler/)
