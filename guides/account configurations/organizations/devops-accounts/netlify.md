<!--
id: netlify-organization-configuration
type: CONFIGURATION
scope: ORGANIZATION
-->

<div align="center"> <img src="../../../../images/guides/netlify.svg" alt="Netlify Logo" width="64" height="64"> <h2><a href="https://app.netlify.com/" target="_blank" rel="noopener noreferrer">Netlify</a> Configuration Guide</h2> </div>

## Team Security

#### Authentication
- [ ]  Team settings > Security > **Enforce SSO** where available, backed by an IdP requiring hardware-key authentication
- [ ]  Require **2FA** for all members on accounts not behind SSO
- [ ]  Disconnect any personal Git accounts used for team access in favour of organization-owned identities

#### Members & Roles
- [ ]  Team settings > Members > Assign the least-privilege role (Reviewer or Developer rather than Owner) to each member
    - [ ]  Keep **Owner** count to the minimum needed for continuity
- [ ]  Remove departed members the same day (SP-GS-024) and confirm their Git provider access is also revoked
- [ ]  Team settings > Audit log > Review on a defined cadence for role changes, new sites, and environment variable edits

## Site & Deploy Security

#### Deploy Controls
- [ ]  Site settings > Build & deploy > Branches > Restrict deploys to the **production branch** only
    - [ ]  Ensure that branch carries the protections required by SP-DI-003 (reviews, signed commits)
- [ ]  Site settings > Build & deploy > **Stop auto publishing** for sites that require manual review before going live
- [ ]  Enable **deploy notifications** to a monitored channel so every production deploy is visible to the team
- [ ]  Enable **locked deploys** for critical production sites so a new build cannot auto-replace the live version

#### Deploy Previews
- [ ]  Site settings > Access control > **Password-protect** deploy previews, or restrict them to team members
- [ ]  Treat preview URLs as public unless protected - do not point them at production data or secrets
- [ ]  Review preview deploys from **forked pull requests** as untrusted code (SP-DI-008)

## Environment Variables & Secrets

- [ ]  Site settings > Environment variables > Scope each variable to the specific site and deploy context that needs it
- [ ]  Mark sensitive values as **secret / write-only** so they cannot be read back from the UI or API
- [ ]  Never echo secrets in build commands - build logs are visible to anyone with team access
- [ ]  Keep production secrets out of preview and branch-deploy contexts (SP-SD equivalent: SP-DI-009)
- [ ]  Rotate variables on member departure and on any suspected exposure

## Build Security

- [ ]  Review changes to `netlify.toml` and build commands with the same scrutiny as application code - build config is a deployment path
- [ ]  Pin the build image and Node version rather than tracking "latest"
- [ ]  Install only vetted build plugins; a build plugin executes with full access to your build environment and secrets
- [ ]  Verify the deployed artifact hash against CI build output where practical (SP-DI-018)

## Domain & TLS

- [ ]  Verify custom domain ownership and confirm the domain is managed at a hardened registrar (SP-DI-020)
    - [ ]  Prefer keeping authoritative DNS at your hardened DNS provider rather than delegating the zone to Netlify DNS
- [ ]  Domain settings > HTTPS > **Force HTTPS** > On
- [ ]  Confirm certificate renewal is automatic and monitored; add the domain to Certificate Transparency monitoring (SP-DI-022)
- [ ]  Remove stale domain aliases and branch subdomains that no longer serve a purpose - dangling records invite takeover
