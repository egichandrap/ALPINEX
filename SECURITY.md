# Security Policy

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| 1.0.x   | :white_check_mark: |
| < 1.0   | :x:                |

## Responsible Load Testing & Target Egress

ALPINEX includes built-in safeguards to prevent unauthorized Denial of Service attacks and SSRF exploits:
- Private RFC 1918 addresses and Cloud Metadata endpoints (`169.254.169.254`) are blocked by default in production.
- All high-load executions require user authentication, target allowlist verification, and quota validation.
- Emergency stop switches allow instant cancellation across all workers.

## Reporting a Vulnerability

If you discover a security vulnerability within ALPINEX, please send an email to **security@alpinex.dev**. Do not open a public GitHub issue.

Please include:
- A description of the vulnerability and its potential impact.
- Steps or proof-of-concept to reproduce the issue.
- Details of affected versions and components.

We will acknowledge receipt within 48 hours and provide regular updates on remediation progress.
