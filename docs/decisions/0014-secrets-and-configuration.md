# ADR-0014: Secrets via environment and platform secret manager

## Status

Accepted, 2026-06-18

## Context

No secret may enter the repository or git history. This covers database credentials, SMTP and transactional email keys, API tokens for third-party services (Plausible is cookieless and needs no key, but other integrations may), signing keys, and any future provider credentials. The constraint is absolute: once a secret is committed, it is present in the history of every clone and on every machine that has ever fetched, so the only safe response to a leak is rotation, not deletion. Treating "remove the file" as a fix is a known and recurring mistake; the value is already compromised the moment it lands in a tracked object.

The deployment target exposes a platform secret manager, and the application reads its configuration from environment variables at runtime. Data residency is constrained to the EU/EEA (email and database), so any secret store in scope must respect that boundary. The repository is the source of truth for code and infrastructure definitions, not for credentials.

Two failure modes need to be designed against, not just discouraged:

1. A developer commits a real value into a config file or a `.env` by accident.
2. A committed value sits undetected until an audit or an incident surfaces it.

Both are addressed by automation rather than by convention alone, because convention does not survive deadlines.

## Decision

Keep all secrets in environment variables and the platform secret manager. The secret manager is the system of record; environment variables are how the running process receives the values. Nothing else holds them.

Commit only `.env.example`. This file documents every variable the application expects, with placeholder or empty values and short comments describing each one. It is the contract between the codebase and whoever provisions an environment. Real `.env` files are git-ignored and never tracked.

Add secret scanning to CI so that any commit or pull request containing a credential-shaped string fails the pipeline before merge. Add dependency vulnerability scanning to CI so that high and critical advisories in the dependency tree fail the pipeline as well. Document a rotation procedure in the runbooks covering each secret class: how to generate a replacement, where to set it in the secret manager, how to roll it out without downtime, and how to invalidate the old value.

The locked points:

- Environment variables plus platform secret manager are the only storage for secrets.
- `.env.example` is the only secret-related file in version control.
- CI enforces secret scanning and dependency vulnerability scanning.
- Rotation is a documented, runbook-backed procedure.

## Alternatives considered

**Committed config with secrets.** Putting credentials directly into tracked configuration (a `config.json`, a settings module, environment blocks in a compose file) is the simplest thing to wire up and needs no provisioning step. It is rejected outright. It violates the core constraint: the secret enters git history permanently, every clone carries it, and a single repository read (or a misconfigured fork, or a leaked laptop) discloses production credentials. There is no remediation short of rotating everything, and the convenience it buys is small and one-time. The honest trade-off is that contributors must now provision secrets out-of-band rather than getting a working config from a fresh checkout; this is accepted as the cost of not shipping credentials in the repo.

**A secrets file in the repo (encrypted or otherwise).** A dedicated secrets file, possibly encrypted at rest with a tool like SOPS or git-crypt, keeps secrets versioned alongside code and survives the "where did this value go" problem. It was weighed seriously because encrypted-at-rest changes the calculus: the committed bytes are ciphertext, not the secret. It is still not adopted here. The decryption key becomes the secret that cannot live in the repo, so the problem is relocated rather than removed, and the key still has to live in the secret manager (the very mechanism this alternative was meant to avoid leaning on). Key distribution, per-environment key separation, and access revocation add operational surface. Encrypted blobs also defeat plain secret scanning, so a misconfigured or partially encrypted commit can pass CI while still being unsafe. The platform secret manager already provides access control, rotation hooks, and an audit trail that a committed file does not, and it keeps the EU/EEA residency boundary explicit. The trade-off accepted by rejecting this option: secret history and rollback now live in the secret manager and the runbooks rather than in git, so recovering a previous value is a secret-manager operation, not a `git revert`.

## Consequences

- A fresh checkout does not run without provisioning. Each environment must have its variables set in the platform secret manager (or a local git-ignored `.env` derived from `.env.example`) before the application starts. This is deliberate friction and is documented in the setup runbook.
- `.env.example` must be kept in step with the code. Adding a new variable without updating the example file will surface as a missing-configuration error in a fresh environment, so the example file is treated as part of any change that introduces a secret.
- CI fails on detected secrets. A pull request that contains a credential-shaped string will not merge until the offending value is removed from the change and, if it was ever a real value, rotated. False positives are handled with reviewed, narrowly scoped allow-list entries, not by disabling the scanner.
- CI fails on high or critical dependency vulnerabilities. Pipelines block until the dependency is upgraded, replaced, or, where genuinely inapplicable, suppressed with a documented and dated justification. This adds maintenance load and can block an otherwise-clean merge; that cost is accepted in exchange for not shipping known-exploitable dependencies. Medium and lower advisories are tracked but do not block, to keep the gate credible rather than ignored.
- Rotation is a runbook procedure, not tribal knowledge. Each secret class has documented steps for generation, update in the secret manager, rollout, and invalidation, so an incident response does not depend on a single person being available.
- Secret history lives in the secret manager rather than in git. Auditing who changed a credential and when, and rolling back to a prior value, are secret-manager operations.
- The repository can be read by any contributor without exposing production credentials, which lowers the blast radius of a leaked clone, a misconfigured mirror, or a compromised developer machine to code only, never to live secrets.
