# SMB CRM

A modern, multi-tenant CRM for freelancers, SMBs, and non-profits built on Cloudflare's edge infrastructure.

## Features

- **Multi-tenant Architecture**: Secure tenant isolation with D1 database
- **Multi-user Support**: Role-based access control (RBAC)
- **Contacts Management**: Store and organize contact information
- **Sales Pipeline**: Track deals and opportunities
- **Task Management**: Assign and track tasks
- **Activity Logging**: Full audit trail of all changes
- **Real-time Performance**: Built on Cloudflare Workers for edge computing
- **Scalable Storage**: R2 for secure file storage

## Technology Stack

### Frontend
- **React 18** with TypeScript
- **Vite** for fast development and optimized builds
- **React Router** for navigation

### Backend
- **Hono.js** - Lightweight web framework for edge runtime
- **Cloudflare Workers** - Edge computing
- **Cloudflare D1** - SQLite at the edge
- **Cloudflare R2** - Object storage

### Infrastructure
- **Cloudflare Pages** - Static hosting with serverless functions
- **GitHub Actions** - CI/CD automation

## Project Structure

```
smb-crm/
├── packages/
│   ├── frontend/          # React web application
│   │   ├── src/
│   │   ├── vite.config.ts
│   │   └── tsconfig.json
│   └── workers/           # Hono API backend
│       ├── src/
│       ├── wrangler.toml
│       └── tsconfig.json
├── database/
│   └── migrations/        # D1 SQL migrations
├── .github/
│   └── workflows/         # GitHub Actions
└── package.json           # Monorepo configuration
```

## Getting Started

### Prerequisites
- Node.js 18+ 
- npm or yarn
- [Wrangler CLI](https://developers.cloudflare.com/workers/wrangler/) (`npm install -g wrangler`)

### Installation

1. Clone the repository
```bash
git clone https://github.com/bangsmackpow/smb-crm.git
cd smb-crm
```

2. Install dependencies
```bash
npm install
```

3. Configure environment variables
Create `.env.local` in the root directory:
```
CLOUDFLARE_ACCOUNT_ID=your_account_id
CLOUDFLARE_API_TOKEN=your_api_token
```

### Development

Run both the frontend and workers in development mode:
```bash
npm run dev
```

This will:
- Start Vite dev server (frontend) on `http://localhost:5173`
- Start Wrangler dev server (API) on `http://localhost:8787`

### Building

Build all packages:
```bash
npm run build
```

Build individual packages:
```bash
npm run build --workspace=packages/frontend
npm run build --workspace=packages/workers
```

### Database

Initialize D1 database:
```bash
npm run db:init
```

Run migrations:
```bash
npm run db:migrate
```

## GitHub Actions Workflow

The project includes automated CI/CD that:

1. **Runs on every push** to `main` or `staging` branches
2. **Tests** - Type checking, linting, building across Node 18 & 20
3. **Deploys Workers** - API backend to Cloudflare Workers
4. **Deploys Pages** - Frontend to Cloudflare Pages
5. **Environment-aware** - Automatically deploys to production on `main`, staging on other branches

### Setup GitHub Secrets

Add these secrets to your GitHub repository:
- `CLOUDFLARE_API_TOKEN` - Cloudflare API token (generate in Dashboard > Account > API Tokens)
- `CLOUDFLARE_ACCOUNT_ID` - Your Cloudflare account ID

## Architecture Overview

### Multi-tenant Design
- Each tenant has isolated data in D1
- Row-level security with `tenant_id` on all tables
- Automatic tenant context in requests

### Authentication
- JWT-based authentication
- Custom implementation in D1 for full control
- Future: Support for additional auth methods (OAuth, SAML)

### Security Considerations
- All requests validated by tenant_id
- Passwords hashed with bcrypt
- CORS configured for trusted origins
- Rate limiting via Cloudflare
- Data encrypted at rest in R2

## Roadmap

- [ ] Complete authentication system (register, login, JWT)
- [ ] Implement contact management CRUD
- [ ] Build sales pipeline features
- [ ] Task assignment and tracking
- [ ] Activity/audit logging
- [ ] File upload to R2
- [ ] Real-time WebSocket updates
- [ ] Analytics dashboard
- [ ] Mobile app
- [ ] Subscription management
- [ ] Advanced reporting

## Contributing

We welcome contributions! Please:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For issues, questions, or suggestions, please open an issue on GitHub.
