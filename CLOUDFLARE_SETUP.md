# Cloudflare API Token & Configuration Guide

## API Token Permissions Required

Your GitHub Actions workflow needs specific permissions to deploy to Cloudflare. Here's exactly what to set:

### Step 1: Create API Token

1. Go to [Cloudflare Dashboard](https://dash.cloudflare.com/account/api-tokens)
2. Click **"Create Token"** button
3. Select **"Edit Cloudflare Workers"** template (easier than custom)

### Step 2: Grant Specific Permissions

The template gives you these permissions (verify they're all checked):

| Permission | Level | Purpose |
|---|---|---|
| **Account.Cloudflare Workers Accounts** | Edit | Deploy Worker scripts |
| **Account.Cloudflare Pages** | Edit | Deploy Pages (frontend) |
| **Account.D1 Databases** | Edit | Manage database, run migrations |
| **Account.R2 Object Storage** | Edit | Store files from Workers |
| **Zone.Zone Settings** | Read | (Auto-included, optional) |

**Visual Checklist:**
```
✅ Zone - Workers Routes - Edit
✅ Zone - Durable Objects Namespace - Edit  
✅ Account - Workers KV - Edit
✅ Account - Cloudflare Pages - Edit
✅ Account - D1 - Edit
✅ Account - R2 - Edit
```

### Step 3: Set Scope

**All Accounts**
```
Account: [select your account]
Specific Zone: None (leave blank - not needed)
```

Or be restrictive:
```
Account: smb-crm-account
Specific Zones: yourdomain.com (if you have custom domain)
```

### Step 4: Name & Generate

- Name: `GitHub Actions - SMB CRM`
- TTL: 90 days (recommended)
- Click **"Create Token"**

### Step 5: Copy Token

Test it works:
```bash
curl https://api.cloudflare.com/client/v4/user/tokens/verify \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

Should return:
```json
{
  "success": true,
  "errors": [],
  "messages": [],
  "result": {
    "id": "token_id",
    "status": "active"
  }
}
```

---

## Account ID

Get your **Account ID** for the configuration files:

1. Go to [Cloudflare Dashboard](https://dash.cloudflare.com)
2. Look at **right sidebar** - you'll see:
   ```
   Account
   Account ID: xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
   ```
3. Copy that value

Or via API:
```bash
curl https://api.cloudflare.com/client/v4/accounts \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" | jq '.result[0].id'
```

---

## GitHub Setup

### Add Secrets to Repository

Go to: **GitHub Repo > Settings > Secrets and variables > Actions**

Create 2 secrets:

| Name | Value |
|---|---|
| `CLOUDFLARE_API_TOKEN` | (paste your token from step 4) |
| `CLOUDFLARE_ACCOUNT_ID` | (paste your account ID) |

**Verify they're set:**
```bash
git clone https://github.com/bangsmackpow/smb-crm.git
# Should deploy without asking for credentials
```

---

## Update Wrangler Configuration

Both `wrangler.toml` files need your Account ID:

### `packages/workers/wrangler.toml`

```toml
name = "smb-crm-api"
type = "javascript"
account_id = "YOUR_ACCOUNT_ID"  # ← UPDATE THIS
workers_dev = true

[env.production]
name = "smb-crm-api-production"
route = "api.yourdomain.com/*"  # Change to your domain
zone_id = "YOUR_ZONE_ID"        # Optional - only if custom domain

[build]
command = "npm run build"
cwd = "./packages/workers"
main = "src/index.ts"

[[d1_databases]]
binding = "DB"
database_name = "smb-crm-db"
database_id = "YOUR_DATABASE_ID"  # Get from: npm run db:init

[[r2_buckets]]
binding = "BUCKET"
bucket_name = "smb-crm-storage"
```

### Root `wrangler.toml`

```toml
name = "smb-crm"
account_id = "YOUR_ACCOUNT_ID"  # ← UPDATE THIS
pages_build_output_dir = "dist"

[env.production]
name = "smb-crm-production"
routes = [
  { pattern = "yourdomain.com", zone_name = "yourdomain.com" }
]
```

---

## D1 Database ID

After running `npm run db:init`, you'll get a database ID.

Get it again with:
```bash
wrangler d1 list
```

Output:
```
┌────────────────┬──────────────────────────────────────┬──────────┐
│ name           │ id                                   │ created  │
├────────────────┼──────────────────────────────────────┼──────────┤
│ smb-crm-db     │ xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx │ 2 mins   │
└────────────────┴──────────────────────────────────────┴──────────┘
```

Copy the ID and add to `packages/workers/wrangler.toml`:
```toml
[[d1_databases]]
binding = "DB"
database_name = "smb-crm-db"
database_id = "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"  # ← PASTE HERE
```

---

## Environment Variables (Wrangler)

Add to `packages/workers/wrangler.toml` under `[vars]`:

```toml
[vars]
ENVIRONMENT = "development"
LOG_LEVEL = "info"
JWT_SECRET = "generate-with-openssl-rand-hex-32"
JWT_EXPIRY = "86400"
JWT_REFRESH_EXPIRY = "604800"

[env.production.vars]
ENVIRONMENT = "production"
LOG_LEVEL = "warn"
JWT_SECRET = "different-secret-for-production"
```

**Generate JWT_SECRET:**

```bash
# Mac/Linux
openssl rand -hex 32

# Windows PowerShell
[System.Convert]::ToHexString([System.Security.Cryptography.RandomNumberGenerator]::GetBytes(32))
```

Or use: https://randomkeygen.com/

---

## Deployment URLs

After deployment, your app will be available at:

### Development
- Frontend: `http://localhost:5173` (Vite dev server)
- API: `http://localhost:8787` (Wrangler dev server)

### Staging (branch: staging)
- Frontend: `https://smb-crm.pages.dev`
- API: `https://smb-crm-api.staging.workers.dev` (or custom)

### Production (branch: main)
- Frontend: `https://yourdomain.com` (if custom domain)
- API: `https://api.yourdomain.com` (if custom domain)

Or without custom domain:
- Frontend: `https://smb-crm-public.pages.dev`
- API: `https://smb-crm-api.workers.dev`

---

## Custom Domain (Optional)

If you have a custom domain (yourdomain.com):

### Add to Cloudflare

1. Go to **Dashboard > Websites > yourdomain.com**
2. Copy the 2 nameservers Cloudflare provides
3. Go to your domain registrar
4. Update nameservers to Cloudflare ones
5. Wait 24-48 hours for propagation

### Update Wrangler Config

```toml
# packages/workers/wrangler.toml
[env.production]
route = "api.yourdomain.com/*"
zone_id = "YOUR_ZONE_ID"  # From Cloudflare dashboard

# Root wrangler.toml
[env.production]
routes = [
  { pattern = "yourdomain.com", zone_name = "yourdomain.com" },
  { pattern = "www.yourdomain.com", zone_name = "yourdomain.com" }
]
```

Get Zone ID:
1. Go to **Dashboard > yourdomain.com > Overview**
2. Right side: **Zone ID**

---

## Testing the Workflow

### 1. Push to GitHub
```bash
git add .
git commit -m "feat: add authentication"
git push origin main
```

### 2. Monitor Deployment

Go to your repo > **Actions** tab

You'll see:
```
Test ✅
├─ Type Check
├─ Lint
└─ Build (Node 18 & 20)

Deploy Workers ✅
└─ Deploy to smb-crm-api.workers.dev

Deploy Pages ✅
└─ Deploy to smb-crm.pages.dev
```

### 3. Verify Deployment

Test the API:
```bash
curl https://smb-crm-api.workers.dev/health
```

Should return:
```json
{
  "status": "ok",
  "environment": "production"
}
```

---

## Troubleshooting

### "Unauthorized" Error in GitHub Actions

1. Verify secrets are set correctly
2. Check token hasn't expired (regenerate if > 90 days old)
3. Ensure token has all required permissions
4. Test token manually:
   ```bash
   curl https://api.cloudflare.com/client/v4/user/tokens/verify \
     -H "Authorization: Bearer TOKEN"
   ```

### Deployment Takes Long Time

Give it 5-10 minutes. Cloudflare:
- Builds projects
- Runs migrations
- Propagates globally (edge network)

Check progress in **Actions** tab.

### "Database not found" Error

1. Run `npm run db:init` locally
2. Copy database_id to wrangler.toml
3. Run `npm run db:migrate` locally
4. Push to GitHub
5. GitHub Actions will apply migrations on deploy

### Workers showing old code

1. Check your account_id is correct
2. Manually deploy: `npm run deploy --workspace=packages/workers`
3. Clear Cloudflare cache: Dashboard > Caching > Purge Cache

---

## Summary Checklist

```
□ Create API Token (dash.cloudflare.com/account/api-tokens)
  ├─ Permissions: Workers, Pages, D1, R2
  └─ Copy token

□ Get Account ID (dash.cloudflare.com, right sidebar)
  └─ Copy account ID

□ Add GitHub Secrets
  ├─ CLOUDFLARE_API_TOKEN
  └─ CLOUDFLARE_ACCOUNT_ID

□ Update Configuration Files
  ├─ packages/workers/wrangler.toml (account_id)
  ├─ wrangler.toml (account_id)
  └─ .env.local (JWT_SECRET, etc)

□ Initialize Database
  ├─ npm run db:init
  ├─ Copy database_id to wrangler.toml
  └─ npm run db:migrate

□ Push to GitHub
  ├─ git push origin main
  └─ Monitor Actions tab

□ Verify Deployment
  └─ curl https://smb-crm-api.workers.dev/health
```

Done! Your application is now live on Cloudflare with automated CI/CD from GitHub. 🚀
