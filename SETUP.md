# Setup Instructions for Local Development & Cloudflare Deployment

## 1. Cloudflare Account Setup

### Create Cloudflare Account & Get API Token
1. Go to [Cloudflare Dashboard](https://dash.cloudflare.com)
2. Navigate to **Account > API Tokens**
3. Click **Create Token**
4. Use "Edit Cloudflare Workers" template
5. Add permissions for:
   - Workers Scripts (Edit)
   - Cloudflare Pages (Edit)
   - D1 (Edit)
   - R2 (Edit)
6. Copy the token and save in GitHub Secrets as `CLOUDFLARE_API_TOKEN`

### Get Account ID
1. In Cloudflare Dashboard, go to **Home** or any page
2. Find Account ID in the right sidebar
3. Save as GitHub Secret `CLOUDFLARE_ACCOUNT_ID`

## 2. Local Development Setup

### Install Dependencies
```bash
npm install
```

### Create Local Environment File
Create `.env.local`:
```
CLOUDFLARE_ACCOUNT_ID=your_account_id
CLOUDFLARE_API_TOKEN=your_token
```

### Create D1 Database
```bash
npm run db:init
```

This creates a local SQLite database and a production database in Cloudflare.

### Run Development Servers
```bash
npm run dev
```

Two servers start:
- Frontend: http://localhost:5173
- API: http://localhost:8787

## 3. GitHub Setup

### Update Wrangler Configuration
Edit `packages/workers/wrangler.toml`:
```toml
account_id = "YOUR_CLOUDFLARE_ACCOUNT_ID"
```

Edit `wrangler.toml`:
```toml
account_id = "YOUR_CLOUDFLARE_ACCOUNT_ID"
```

### Update Domain Names (if you have a custom domain)
1. Edit `packages/workers/wrangler.toml`:
   ```toml
   [env.production]
   route = "api.yourdomain.com/*"
   zone_id = "YOUR_ZONE_ID"
   ```

2. Edit `wrangler.toml`:
   ```toml
   [env.production]
   routes = [
     { pattern = "yourdomain.com", zone_name = "yourdomain.com" }
   ]
   ```

3. Add Zone ID as a GitHub Secret

### Add GitHub Secrets
Go to **Repository Settings > Secrets and variables > Actions**:

| Secret Name | Value |
|---|---|
| `CLOUDFLARE_API_TOKEN` | Your API token from step 1 |
| `CLOUDFLARE_ACCOUNT_ID` | Your account ID from step 1 |

## 4. First Deployment

### Option A: Via GitHub Actions (Automated)
1. Push code to `main` branch
2. GitHub Actions automatically runs
3. Check **Actions** tab for deployment status
4. Workers deployed to `smb-crm-api.workers.dev`
5. Pages deployed to `smb-crm.pages.dev`

### Option B: Manual Deployment
```bash
# Deploy Workers
npm run deploy --workspace=packages/workers

# Deploy Pages (requires GitHub/GitLab integration)
wrangler pages publish packages/frontend/dist
```

## 5. Database Migrations

### Create Migration
```bash
wrangler d1 migrations create smb-crm-db add_new_table
```

This creates a new file in `database/migrations/`.

### Apply Migrations
```bash
npm run db:migrate
```

### Backup Database
```bash
npm run db:backup
```

## 6. Testing the Deployment

### Verify Workers Deployment
```bash
curl https://smb-crm-api.workers.dev/health
```

Expected response:
```json
{
  "status": "ok",
  "environment": "production"
}
```

### Verify Pages Deployment
Open `https://smb-crm.pages.dev` in browser

### Check Database Connection
The API should be able to query D1. Test with database operations in routes.

## 7. Production Checklist

- [ ] Cloudflare API token created and secured
- [ ] Account ID configured in wrangler.toml
- [ ] GitHub secrets added (CLOUDFLARE_API_TOKEN, CLOUDFLARE_ACCOUNT_ID)
- [ ] D1 database created in Cloudflare
- [ ] Database migrations applied
- [ ] R2 bucket created for file storage
- [ ] Custom domain configured (if applicable)
- [ ] SSL/TLS enabled
- [ ] CORS configured for your domain
- [ ] Environment variables set in wrangler.toml
- [ ] Rate limiting configured
- [ ] Monitoring/logging set up

## 8. Troubleshooting

### "Account ID not found"
- Verify `wrangler.toml` has correct `account_id`
- Run `wrangler whoami` to verify logged in

### "D1 database not found"
```bash
# List databases
wrangler d1 list

# Check if database_id in wrangler.toml matches
```

### GitHub Actions failing
- Check GitHub Secrets are set correctly
- Verify Cloudflare API token has correct permissions
- Check workflow logs in **Actions** tab

### Local dev not connecting to API
- Ensure both servers are running (`npm run dev`)
- Check vite.config.ts proxy is pointing to `http://localhost:8787`
- Check browser console for CORS errors

## Environment Variables

### Development
Frontend can access API at `http://localhost:8787` via Vite proxy

### Production
Frontend must be configured to use production Workers URL:
```
https://api.yourdomain.com (or smb-crm-api.workers.dev)
```

Update in `packages/frontend/src/` (when building auth/API calls):
```typescript
const API_URL = process.env.VITE_API_URL || 'http://localhost:8787';
```

## Next Steps

1. Implement authentication (register/login)
2. Build contact management features
3. Create sales pipeline views
4. Add task management
5. Implement real-time updates
6. Set up monitoring and analytics
