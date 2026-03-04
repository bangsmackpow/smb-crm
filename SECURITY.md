# Security Policy

## Data Protection & Privacy

### GDPR Compliance
- User data is stored securely in Cloudflare D1
- All tenant data is isolated and encrypted
- Data deletion on demand available

### Authentication & Authorization
- Passwords hashed with bcrypt (minimum 12 rounds)
- JWT tokens with 24-hour expiry
- Role-based access control (RBAC)
- Row-level security enforced via tenant_id

### Storage Security
- Files stored in Cloudflare R2 (encrypted at rest)
- Signed URLs for controlled access
- Automatic deletion of sensitive data

### Infrastructure Security
- All traffic encrypted in transit (TLS 1.3)
- DDoS protection via Cloudflare
- API rate limiting enabled
- CORS restrictions in place

## Reporting Security Issues

Please do NOT open public issues for security vulnerabilities.

Email security issues to: [your-email@domain.com]

Include:
- Description of the vulnerability
- Steps to reproduce
- Potential impact
- Suggested fix (if any)

We'll acknowledge serious issues within 24 hours and work on a fix.

## Future Security Enhancements

- [ ] Two-factor authentication (2FA)
- [ ] API key authentication
- [ ] OAuth 2.0 support
- [ ] SAML enterprise SSO
- [ ] Advanced audit logging
- [ ] Encryption key management
- [ ] Regular security audits
- [ ] Penetration testing
