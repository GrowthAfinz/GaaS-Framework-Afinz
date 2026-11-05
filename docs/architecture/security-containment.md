# Emergency access containment — 2026-11-05

Production now uses an explicit allowlist in gaas_security.approved_members, independent of editable profile roles. Deleted or newly registered identities cannot pass the REST pre-request gate. All public tables and Storage objects also have a restrictive approved-member policy. GraphQL is closed to browser roles during containment.

## Provisioning
Creating/inviting an Auth user does not grant GaaS data access. A trusted operator must review the exact identity and insert its auth.users.id into gaas_security.approved_members using a privileged server connection. Do not automatically approve by domain, user_metadata or profiles.role. Disable membership to revoke data access immediately. Keep signup and anonymous sign-in disabled.

The initial roster was reviewed during the incident, including the new colleague explicitly confirmed by the owner. Existing table-specific policies continue to apply after the global membership gate.

## Edge Functions
Every deployed active handler now verifies either an approved signed user session or its existing privileged internal credential before business logic. The wrapper is tested against missing credentials, the public anon key, revoked identities, service credentials, worker dispatch and verifier failures. Legacy anonymous-key database clients were changed to server-side service clients only behind this guard.

Seven legacy deployed functions have no corresponding versioned source entrypoint in main. Their original and hardened deployment bundles are preserved in private local incident evidence; do not redeploy an old unauthenticated bundle. Three retired audit functions already return 410.

## Checks
- Anonymous HTTP checks covered 200 REST table/view endpoints; all denied.
- 34 HTTP checks across 17 active Edge Functions; all denied without an approved session.
- Database transaction assertions: all nine approved identities accepted, deleted identity rejected, zero visible activities for deleted identity, profile role escalation rejected. Assertion transactions rolled back.
- These tests do not demonstrate that a stolen legitimate session cannot exist, or establish historical impact.
- PostgREST pre-request does not protect Storage or Realtime by itself; restrictive RLS supplies the table/object boundary.
- Internal scheduled execution still requires its original worker/service credential; no report was generated or published as a test.

## GitHub
main requires PR and the validate check, up-to-date base, conversation resolution and linear history; rules apply to admins, force-push and deletion disabled. GitHub-owned Actions only, full SHA pins, read-only default workflow token, no workflow PR self-approval, dependency alerts/security updates and secret scanning/push protection enabled.

## Remaining exposure
The owner chose to keep GitHub Pages and review public files individually. No data export or historical commit was removed. Files in public/data remain publicly downloadable until selected for migration/removal. Business documentation and skills are public too. Removing a current file cannot revoke old clones/caches/history.

The history pattern scan covered 4,731 textual blobs reachable from main, up to 3MB each; three private-key marker hits were synthetic test fixtures. No real provider secret was found by those patterns. GitHub secret alerts were empty at inspection time. This is not a comprehensive secret-free certification.

npm audit initially reported 14 findings. Compatible patch updates were applied; remaining major tool upgrades and SheetJS issues require a separate compatibility review. Do not use audit fix --force blindly.

Incident logs, IPs, email roster, traffic snapshots, HTTP test results and deployment backups are local private evidence and must not be committed to this public repo.

## Scheduled Meta credential
The legacy scheduled Meta call used the public anon JWT. Its Vault credential was replaced server-side with a fresh private random value. The Edge boundary verifies that value through a service-only RPC; the public key remains denied. The gateway JWT toggle is off for this collector because the private dispatch token is not a JWT; signed users still require approved membership. A probe using the real internal credential reached only invalid-mode validation (400), without collecting or changing business data.
