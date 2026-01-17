# Security Policy

## Reporting a Vulnerability

We take security seriously at DropDeck. If you discover a security vulnerability, please report it responsibly.

### How to Report

1. **Do NOT** open a public GitHub issue for security vulnerabilities
2. Email security concerns to: [security@dropdeck.app](mailto:security@dropdeck.app)
3. Include as much detail as possible:
   - Description of the vulnerability
   - Steps to reproduce
   - Potential impact
   - Suggested fix (if any)

### What to Expect

- **Acknowledgment**: Within 48 hours of your report
- **Initial Assessment**: Within 5 business days
- **Resolution Timeline**: Depends on severity (critical: 7 days, high: 30 days, medium: 90 days)
- **Credit**: We'll credit you in our security acknowledgments (unless you prefer anonymity)

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| 1.x.x   | :white_check_mark: |
| < 1.0   | :x: (pre-release)  |

## Security Considerations

### Credential Handling

DropDeck handles sensitive credentials for multiple delivery platforms. Our security measures include:

- **Encryption at Rest**: All OAuth tokens and session data encrypted with AES-256-GCM
- **Per-Platform Isolation**: Separate credential storage per platform prevents cross-contamination
- **Minimal Retention**: Credentials are only stored as long as necessary
- **Secure Transmission**: All API communications use TLS 1.3

### Authentication

- NextAuth.js 5.x for secure session management
- Short-lived JWTs with secure refresh rotation
- CSRF protection on all state-changing operations
- Rate limiting on authentication endpoints

### Data Protection

- No plaintext storage of sensitive data
- Database-level encryption via Neon PostgreSQL
- Redis data encrypted in transit via Upstash
- Environment variables for all secrets (never in code)

### Third-Party Integrations

- OAuth 2.0 flows for platforms that support it
- Webhook signature verification for all incoming webhooks
- API request signing where required by platforms

## Security Headers

The application implements the following security headers:

```
Content-Security-Policy: default-src 'self'; ...
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
X-XSS-Protection: 1; mode=block
Referrer-Policy: strict-origin-when-cross-origin
Permissions-Policy: geolocation=(), microphone=(), camera=()
```

## Dependency Security

- Automated dependency scanning via GitHub Dependabot
- Regular security audits of npm packages
- Lockfile integrity verification in CI/CD

## Bug Bounty

We do not currently operate a formal bug bounty program, but we appreciate responsible disclosure and will acknowledge security researchers who report valid vulnerabilities.

---

Thank you for helping keep DropDeck secure!
