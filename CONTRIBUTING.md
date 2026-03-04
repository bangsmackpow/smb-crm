# Contributing to SMB CRM

Thank you for your interest in contributing! This document provides guidelines for contributing to the project.

## Code of Conduct

Be respectful, inclusive, and professional in all interactions.

## Getting Started

1. Fork the repository
2. Clone your fork locally
3. Create a feature branch: `git checkout -b feature/your-feature`
4. Install dependencies: `npm install`
5. Start development: `npm run dev`

## Commit Guidelines

Follow conventional commits format:

```
type(scope): description

[optional body]

[optional footer]
```

Types:
- `feat:` New feature
- `fix:` Bug fix
- `docs:` Documentation
- `style:` Code style (formatting, semicolons, etc.)
- `refactor:` Code refactoring
- `test:` Testing
- `chore:` Build, dependencies, etc.

Examples:
```
feat(auth): add JWT token refresh mechanism
fix(contacts): resolve duplicate contact creation
docs(setup): update installation instructions
```

## Pull Request Process

1. Update documentation related to your changes
2. Add tests for new features
3. Ensure all tests pass: `npm run type-check && npm run lint`
4. Create a clear PR description
5. Link relevant issues
6. Wait for review before merging

## Development Workflow

### Type Checking
```bash
npm run type-check
```

### Linting
```bash
npm run lint
```

### Formatting
```bash
npx prettier --write "packages/**/*.{ts,tsx}"
```

### Testing
```bash
npm test
```

### Building
```bash
npm run build
```

## Database Changes

For schema changes:

1. Create a new migration file:
   ```bash
   wrangler d1 migrations create smb-crm-db description_of_change
   ```

2. Write SQL in `database/migrations/XXX_description.sql`
3. Test locally: `npm run db:migrate`
4. Include migration in PR
5. Document schema changes in PR description

## Performance & Security

- Keep bundle size small (aim for <50KB gzipped for workers)
- Use TypeScript strict mode
- Validate and sanitize all user inputs
- Follow OWASP best practices
- Add tenant_id checks for all queries
- Use const instead of let

## Documentation

- Update README.md for user-facing changes
- Add JSDoc comments for public functions
- Include examples for complex features
- Document breaking changes clearly

## Reporting Issues

- Use clear, descriptive titles
- Include steps to reproduce
- Provide expected vs actual behavior
- Mention your environment (OS, Node version, etc.)
- Attach relevant logs or screenshots

## Questions?

Open a discussion or issue on GitHub. We're here to help!

Thank you for contributing to SMB CRM! 🚀
