<!--
id: alchemy-organization-configuration
type: CONFIGURATION
scope: ORGANIZATION
-->

<div align="center"> <img src="../../../../images/guides/alchemy.svg" alt="Alchemy Logo" width="64" height="64"> <h2><a href="https://dashboard.alchemy.com/" target="_blank" rel="noopener noreferrer">Alchemy</a> Configuration Guide</h2> </div>

## Account & Team Security

#### Authentication
- [ ]  Settings > Account > Enable **2FA** for every team member (authenticator app or security key - not SMS)
- [ ]  Use SSO where available on your plan, backed by an IdP that enforces hardware-key authentication
- [ ]  Sign up with a dedicated organization email, not a personal address

#### Team Access
- [ ]  Settings > Team > Review members and remove anyone who has left - **same day** per SP-GS-024
- [ ]  Grant the minimum role required; limit the number of members who can create or delete apps and view keys
- [ ]  Review the member list quarterly against the organization account inventory (SP-GS-020)

## API Key Hygiene

#### Key Separation
- [ ]  Create a **separate app (and key) per application and per environment** - never share one key across production, staging, and local development
- [ ]  Record each key in the credential inventory with a **named owner** (SP-GS-020)
- [ ]  Delete unused apps and keys rather than leaving them dormant

#### Exposure Controls
- [ ]  Never treat a frontend-embedded key as secret - any key shipped to a browser is public
    - [ ]  App > Security > **HTTP Referrer allowlist** > Restrict to your exact production domains for any key used from a browser
- [ ]  App > Security > **IP allowlist** > Restrict backend-only keys to your server egress addresses
- [ ]  Restrict each key to the **chains and methods** the application actually needs where the setting is available
- [ ]  Keep keys out of source control - store them in the secrets manager required by SP-DI-009, and rely on secret scanning (SP-DI-004) to catch mistakes

#### Rotation
- [ ]  Set a rotation schedule per key and rotate immediately on suspected exposure or when a key holder departs
- [ ]  App > Settings > Roll API key when rotating, and confirm the old key stops receiving traffic before deleting it

## Monitoring & Continuity

- [ ]  Configure **usage alerts** - an unexplained traffic spike is the primary signal that a key has been stolen and is being used by a third party
- [ ]  Review the usage dashboard on a defined cadence; investigate traffic from unexpected origins or regions
- [ ]  Configure webhooks/notifications to a monitored team channel rather than a single person's inbox
- [ ]  Provision a **second, independent RPC provider** and test failover - a single provider is a single point of failure per SP-SC-018
- [ ]  Document the provider-outage response path in the incident response runbook (SP-GS-001)
