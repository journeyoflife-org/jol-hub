# Security Policy

## Supported Versions

| Version | Supported |
|---------|-----------|
| 1.0.x   | ✅        |

## Reporting a Vulnerability

**Email:** security@journeyoflife.org

**Response time:** 72 hours (GDPR Art. 33 notification workflow)

Please include:
- Description of the vulnerability
- Steps to reproduce
- Potential impact
- Suggested fix (if any)

## Security Measures

- GPG-signed commits mandatory
- Dependency scanning via Dependabot
- Payment boundary guard (zero PSP SDK imports)
- Secret detection in pre-commit hooks
- SOPS/age encryption for all secrets at rest

## Bug Bounty

No bug bounty program at this time. All reports are handled per our security policy.
