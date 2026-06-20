# Runbook: database backup and restore

Status: operational runbook. The lead database is the crown jewel; this is how it is backed up and restored. The concrete backup mechanism is the managed EU PostgreSQL provider's; this runbook states the procedure and the test that must pass at go-live.

## Backups

- The managed EU PostgreSQL provider takes automated daily backups with point-in-time recovery (enable PITR when provisioning). Confirm the retention window (at least 7 days) and that backups are stored in the EU.
- Backups are encrypted at rest by the provider.
- No backup is taken of the in-process development database; it holds only test data.

## Restore (tested at go-live)

1. In the provider console, create a new database from the most recent backup (or a chosen point in time).
2. Point a staging instance at the restored database via `DATABASE_URL` and run the app; confirm leads, consent records and admin accounts are intact.
3. Re-apply any deletions that happened after the backup point (GDPR erasures and the retention purge): the audit log lists `lead.erased` and `lead.retention.purged` actions with timestamps, so the operator can re-run the erasures so an erased subject does not reappear from a backup.
4. Once verified, switch production `DATABASE_URL` to the restored database (or promote it per the provider's flow).

## Acceptance (go-live)

A restore is performed into a staging instance and verified before launch, and the result recorded here with the date and the person who ran it. Until then this runbook is the documented procedure, pending the real provider.

## Retention and erasure interaction

Deletions propagate to new backups within the rotation window. An erased subject may persist only inside an as-yet-unrotated encrypted backup; it is purged on the next rotation, and any restore must re-apply pending deletions (step 3). See `docs/privacy/retention-and-consent.md` and `docs/runbooks/dsar-and-erasure.md`.
