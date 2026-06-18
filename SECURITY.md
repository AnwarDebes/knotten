# Security policy

## Reporting

To report a security issue, contact the developer directly rather than opening a public issue. Provide enough detail to reproduce the problem. Do not include real personal data in a report.

## Posture

This platform handles prospective-buyer contact data, which is treated as the most sensitive asset in the system. Security is addressed at every layer:

- Input validation and output encoding throughout; parameterised database access only.
- Admin access behind strong authentication with TOTP multi-factor, lockout and least-privilege roles.
- Strict Content Security Policy, HSTS and related response headers.
- CSRF protection on state-changing requests; rate limiting and bot mitigation on public forms and authentication.
- Secrets via environment and platform secret manager; dependency and secret scanning in CI.
- TLS in transit and encryption at rest; no personal data in logs; audit logging for admin and data actions.

A full threat model (mapped to the OWASP Top 10) and a GDPR Article 32 statement are maintained under `docs/security/` and `docs/privacy/`.
