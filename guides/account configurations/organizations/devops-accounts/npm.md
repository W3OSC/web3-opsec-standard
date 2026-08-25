<!--
id: npm-organization-configuration
type: CONFIGURATION
scope: ORGANIZATION
-->

<div align="center"> <img src="../../../../images/guides/npm.svg" alt="npm Logo" width="64" height="64"> <h2><a href="https://www.npmjs.com/" target="_blank" rel="noopener noreferrer">npm</a> Configuration Guide</h2> </div>

## Account Security

#### Two-Factor Authentication
- Account > Two-Factor Authentication (npmjs.com > Profile > Account)
    - [ ]  Two-Factor Authentication > **Enabled** for every member, in **Authorization and writes** mode
        - [ ]  Register a hardware **Security Key** (FIDO2/WebAuthn) as the 2FA method, not TOTP where possible, and never SMS
        - [ ]  Store recovery codes offline in your organization's secrets vault
- Organization > Settings (npmjs.com/org/YOUR-ORG > Settings)
    - [ ]  Require two-factor authentication for all members > **On** [[1]](#required-2fa)

#### Publish 2FA
- Each package > Settings > Publishing access
    - [ ]  **Require two-factor authentication and disallow tokens** for production packages
        - [ ]  If CI must publish, use **Require two-factor authentication or an automation or granular access token** only with granular tokens and provenance (see below) - never with classic automation tokens

## Organization & Package Settings

#### Member Management
- Organization > Members (npmjs.com/org/YOUR-ORG > Members)
    - [ ]  Review member list and remove departed maintainers **immediately** - a lingering account with publish rights is a full supply-chain compromise waiting to happen
    - [ ]  Review Role for each member > Assign **Member**, not **Admin**/**Owner**, unless they manage the org itself
        - [ ]  Ensure no more than 2-3 Owners/Admins

#### Teams and Package Access
- Organization > Teams
    - [ ]  Grant package access through teams, not individual grants, with **Read** as the default
    - [ ]  Restrict **Read and write** (publish) access to the minimal set of active maintainers per package
- Each package > Settings > Manage access
    - [ ]  Review maintainers and remove any who no longer need publish rights
    - [ ]  Package visibility > Confirm private packages are **Private** (restricted)

## Tokens

#### Granular Access Tokens Only
- Profile > Access Tokens (npmjs.com > Access Tokens)
    - [ ]  Use **Granular Access Tokens** exclusively - revoke all classic tokens (read-only, automation, and publish) [[2]](#classic-tokens)
    - [ ]  For each granular token:
        - [ ]  Packages and scopes > Scope to the specific package(s) it publishes, never **All packages**
        - [ ]  Organizations > No org-management permissions unless strictly required
        - [ ]  Expiration > Short expiry (30-90 days), renewed deliberately - never the maximum
        - [ ]  IP Ranges > Restrict to your CI provider's egress CIDRs where feasible
    - [ ]  Maintain a token inventory with a named owner, purpose, and expiry for every token
    - [ ]  Revoke any token that is unused, unrecognized, or whose owner has departed

## Publish Integrity

#### Provenance and Trusted Publishing
- CI pipeline (GitHub Actions / GitLab CI)
    - [ ]  Publish production packages only from trusted CI, with provenance: `npm publish --provenance` (or `provenance=true` in `.npmrc`) [[3]](#provenance)
        - [ ]  Prefer npm **Trusted Publishing** (OIDC) so CI publishes without any long-lived token at all
    - [ ]  Never publish production packages from developer machines - local environments are the primary target of token-stealing malware
- Consuming dependencies
    - [ ]  Commit lockfiles (`package-lock.json`) and install with `npm ci` in CI
    - [ ]  Set `ignore-scripts=true` in CI/build `.npmrc` where feasible, so install-time lifecycle scripts from compromised dependencies cannot execute

## Monitoring

#### Publish and Ecosystem Monitoring
- [ ]  Enable email notifications for package publishes and review any publish you did not expect
- [ ]  Alert on new maintainers or access changes to your packages (audit org member/team changes regularly)
- [ ]  Watch the registry for lookalike/typosquat packages of your package names and scope, and report them to npm support
- [ ]  Subscribe to npm/GitHub security advisories for your dependencies and act on them promptly

---

## Notes

### <a id="required-2fa"></a>[1] Org-Required 2FA
Setting the organization 2FA requirement to required blocks members without 2FA from any org activity, and removes members who disable 2FA later. Combined with publish-time 2FA, this is the single most effective control against the account-takeover publishes that have repeatedly hit high-profile npm packages.

### <a id="classic-tokens"></a>[2] Classic Tokens
Classic automation/publish tokens are long-lived, bypass 2FA on publish, and are frequently exfiltrated from CI logs, `.npmrc` files, and developer machines - they are behind most major npm supply-chain incidents. Granular access tokens support per-package scoping, expiry, and IP allowlists; treat any classic token that ever existed as potentially leaked and revoke it.

### <a id="provenance"></a>[3] Provenance
Provenance attaches a signed, publicly verifiable attestation linking the published tarball to the exact source commit and CI workflow that built it. Consumers (and you) can then detect packages published outside your pipeline - e.g. from a stolen token on a laptop - via `npm audit signatures`.
