# Architecture Overview

## System Design

```
┌─────────────────────────────────────────────────────────────┐
│                     Cloudflare Edge                         │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌──────────────────────┐      ┌──────────────────────┐   │
│  │   Pages (Frontend)   │      │   Workers (API)      │   │
│  │   ├─ React App       │      │   ├─ Auth Routes    │   │
│  │   ├─ Vite Builder    │      │   ├─ Contact Routes │   │
│  │   └─ Static Assets   │      │   ├─ Deal Routes    │   │
│  └──────────────────────┘      │   ├─ Task Routes    │   │
│           │                    │   └─ Activity Logs  │   │
│           └────────────────────│────────┐            │   │
│                                └────────┼────────────┘   │
│  ┌──────────────────────┐      ┌────────▼────────────┐   │
│  │    R2 Storage        │      │   D1 Database       │   │
│  │   ├─ Documents       │      │   ├─ Tenants        │   │
│  │   ├─ Attachments     │      │   ├─ Users          │   │
│  │   └─ Exports         │      │   ├─ Contacts       │   │
│  └──────────────────────┘      │   ├─ Deals          │   │
│                                │   ├─ Tasks          │   │
│                                │   └─ Activities     │   │
│                                └─────────────────────┘   │
│                                                            │
│  ┌──────────────────────────────────────────────────────┐ │
│  │       Cloudflare Services                           │ │
│  │  ├─ DDoS Protection                                 │ │
│  │  ├─ Rate Limiting                                   │ │
│  │  ├─ Cache                                           │ │
│  │  ├─ Analytics                                       │ │
│  │  └─ Zero Trust Security                             │ │
│  └──────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
         │
         │
    ┌────▼─────────┐
    │ GitHub       │
    │ (Source)     │
    │              │
    │ ├─ Actions   │◄─── Triggers
    │ │  ├─ Tests  │    Deployment
    │ │  ├─ Build  │
    │ │  └─ Deploy │
    │ └─ Secrets   │
    └──────────────┘
```

## Multi-Tenant Architecture

### Tenant Isolation

Each tenant has:
1. **Data Isolation** - All queries filtered by `tenant_id`
2. **User Management** - Separate user records per tenant
3. **Storage Isolation** - Separate R2 paths per tenant
4. **Configuration** - Custom settings per tenant plan
5. **Billing** - Separate subscription tracking

### Data Flow

```
Request
  │
  ├─► Extract JWT Token
  │
  ├─► Verify User & Extract tenant_id
  │
  ├─► Validate Request Body
  │
  ├─► Query with tenant_id Filter
  │   (ALL queries include: WHERE tenant_id = ?)
  │
  ├─► Process Response
  │
  └─► Return to Client
```

## Authentication & Authorization

### Authentication Flow

```
1. Register
   ├─ Create Tenant
   ├─ Create User
   ├─ Hash Password
   └─ Return success

2. Login
   ├─ Find User by email
   ├─ Verify password
   ├─ Generate JWT
   └─ Return token

3. Request
   ├─ Extract token from header
   ├─ Verify JWT signature
   ├─ Check expiration
   ├─ Extract user data (userId, tenantId, role)
   └─ Allow/Deny access
```

### Role-Based Access Control (RBAC)

```
Roles:
├─ admin (full access within tenant)
├─ manager (manage users and data)
├─ member (full data access)
└─ guest (read-only access)
```

## Database Schema Design

### Multi-Tenant Tables

Every table has `tenant_id` for isolation:

```sql
CREATE TABLE contacts (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,  -- ALWAYS include
  email TEXT,
  ...
  FOREIGN KEY (tenant_id) REFERENCES tenants(id)
);

-- EVERY query must include:
WHERE tenant_id = ?
```

### Relationships

```
Tenant
  ├─► Users (1:many)
  │     └─► Tasks (1:many)
  │     └─► Activities (1:many)
  │
  ├─► Contacts (1:many)
  │     └─► Deals (1:many)
  │     └─► Activities (1:many)
  │
  └─► Deals (1:many)
        ├─► Tasks (1:many)
        └─► Activities (1:many)
```

## API Design

### Endpoint Structure

```
/api/v1
├─ /auth
│  ├─ POST /register
│  ├─ POST /login
│  ├─ POST /refresh
│  └─ POST /logout
│
├─ /contacts
│  ├─ GET / (list)
│  ├─ GET /:id
│  ├─ POST / (create)
│  ├─ PUT /:id (update)
│  └─ DELETE /:id
│
├─ /deals
│  └─ ... (similar CRUD)
│
├─ /tasks
│  └─ ... (similar CRUD)
│
└─ /activity
   └─ GET / (audit log)
```

### Response Format

```tsx
// Success
{
  "success": true,
  "data": { ... }
}

// Error
{
  "success": false,
  "error": "Error message"
}

// Paginated
{
  "success": true,
  "data": {
    "items": [...],
    "total": 100,
    "page": 1,
    "limit": 20,
    "pages": 5
  }
}
```

## File Storage Strategy

### R2 Storage Structure

```
smb-crm-storage/
├─ tenants/
│  └─ {tenant_id}/
│     ├─ contacts/
│     │  └─ {contact_id}/
│     │     ├─ avatar.jpg
│     │     └─ documents/
│     ├─ deals/
│     │  └─ {deal_id}/
│     │     └─ attachments/
│     └─ exports/
│        └─ {export_id}.csv
```

### File Upload Process

1. Generate signed URL from API
2. Upload directly to R2 from browser
3. Store reference in D1
4. Return accessible URL

## Performance Optimization

### Caching Strategy

```
Browser Cache
  └─► Static assets (CSS, JS) - 1 year
      API responses - 5 minutes
      DB queries - with D1 query optimization

Cloudflare Cache
  └─► Static assets - aggressive
      API - minimal (mostly dynamic)
      
D1 Database
  └─► Indexes on all foreign keys
      Indexes on frequently filtered columns
```

### Query Optimization

```sql
-- Create indexes for common queries
CREATE INDEX idx_contacts_tenant_created 
ON contacts(tenant_id, created_at);

CREATE INDEX idx_deals_tenant_status 
ON deals(tenant_id, status);
```

## Deployment Pipeline

### GitHub Actions Workflow

```
On: Push to main or staging

1. Setup
   ├─ Node 18/20
   └─ Cache dependencies

2. Test (Parallel)
   ├─ Type Check
   ├─ Lint
   └─ Build

3. Deploy (Sequential)
   ├─ Deploy Workers
   │  └─ Apply migrations if needed
   └─ Deploy Pages
      └─ Deploy frontend assets

4. Notify
   └─ Deployment complete
```

## Security Implementation

### Data Protection

```
Frontend              Workers               Database
   │                    │                      │
   ├─ TLS 1.3          ├─ JWT validate        ├─ tenant_id check
   ├─ CORS             ├─ Input sanitize      ├─ Row security
   ├─ CSRF token       ├─ Rate limit          └─ Encryption
   └─ XSS protection   └─ Error handling
```

### Authentication Security

- JWT tokens signed with HS256
- Token expiry: 24 hours (configurable)
- Refresh tokens: 7 days
- Password hashing: bcrypt (12 rounds)
- Credentials stored in Cloudflare secrets

## Monitoring & Observability

### Logging

```
Frontend
  └─ Browser console
     Console errors
     API errors

Workers
  └─ Cloudflare Logs
     Request/response
     Errors
     Database queries
     Performance metrics
```

### Alerts

- Failed deployments
- High error rate (>1%)
- Database connection errors
- Rate limit exceeded
- Suspicious activities

## Scaling Considerations

### Horizontal

- D1: SQLite with replication ready
- R2: Unlimited storage, geo-distributed
- Workers: Auto-scales globally
- Pages: Cached, geo-distributed

### Vertical

- Optimize database queries
- Cache frequently accessed data
- Compress assets
- Lazy load features

## Future Enhancements

### Short Term
- WebSocket for real-time updates
- Advanced search/filters
- Bulk operations
- Export to CSV/PDF

### Medium Term
- Analytics dashboard
- Integrations (Slack, Zapier, etc.)
- Custom fields per tenant
- Advanced reporting

### Long Term
- Mobile app
- Machine learning insights
- Marketplace for integrations
- Enterprise SSO/SAML
