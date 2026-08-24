<!--
id: fireblocks-organization-configuration
type: CONFIGURATION
scope: ORGANIZATION
-->

<div align="center"> <img src="../../../../images/guides/fireblocks.svg" alt="Fireblocks Logo" width="64" height="64"> <h2><a href="https://console.fireblocks.io/" target="_blank" rel="noopener noreferrer">Fireblocks</a> Configuration Guide</h2> </div>

## Workspace Security

#### Admin Quorum
- [ ]  Settings > General > Admin quorum > **2+ approvals** (never 1) so no single admin can approve workspace changes, new devices, or new users alone

#### User Roles
- [ ]  Settings > Users > Review every user and assign the least-privilege role for their job
    - [ ]  **Owner/Admin** roles limited to the minimum set of people
    - [ ]  Day-to-day initiators as **Signer**/**Initiator**, finance/audit staff as **Viewer**
    - [ ]  No shared accounts - one user per person

#### API Users
- [ ]  Settings > Users > API Users > Review each API user
    - [ ]  Assign the most restrictive role (e.g. **Viewer** for reporting keys, **Signer** only where automation must sign)
    - [ ]  Route signing API users through an **API Co-Signer** with a Co-Signer callback handler that enforces your policy server-side
    - [ ]  Remove unused API users and rotate their keys on a schedule

#### IP Allowlisting
- [ ]  Settings > Users > API Users > Edit > IP whitelisting > **Restrict each API key to known source IPs**
- [ ]  Enable IP allowlisting for console access where available on your plan

## Transaction Authorization Policy

- [ ]  Settings > Transaction Policy (TAP) > Build explicit rules with amount tiers:
    - [ ]  Low-value operational tier > small amount cap > **1 designated approver**
    - [ ]  Mid-value tier > **2+ designated approvers**
    - [ ]  High-value/treasury tier > **quorum of designated approvers** (e.g. 3-of-5)
- [ ]  Use **designated signers/approvers** per rule - never "any admin"
- [ ]  Ensure no rule allows a **single approver** above your low-value threshold
- [ ]  Final rule at the bottom of the TAP > **Block all** (default-deny) so anything not explicitly matched is rejected
- [ ]  Require admin quorum approval for all TAP changes and review the full rule list after every edit (rules match top-down)

## Allowlisting

- [ ]  Settings > General > One-time addresses > **Disabled** (or restricted) so transfers can only go to allowlisted addresses
- [ ]  Whitelisted Addresses > Add each counterparty address with a clear name and require admin quorum approval for new entries
- [ ]  Restrict treasury/cold vault accounts to **allowlisted addresses only** via TAP rules (destination = whitelisted addresses)
- [ ]  Review the allowlist quarterly and remove stale counterparties

## Users & Devices

- [ ]  Enforce **MFA** for every console user (authenticator app or hardware key - no SMS)
- [ ]  Mobile signer devices (Fireblocks mobile app):
    - [ ]  Company-managed or verified personal devices with passcode + biometric lock and up-to-date OS
    - [ ]  No jailbroken/rooted devices; no signer app on shared devices
- [ ]  Offboarding: Settings > Users > **Remove departed users the same day**, including their API users and pending device pairings
- [ ]  Review pending user invitations and device-pairing requests weekly; cancel anything unrecognized

## Monitoring

- [ ]  Settings > Notifications > Enable transaction alerts (initiated, pending approval, completed, failed) for all relevant users and a shared team channel
- [ ]  Compliance/AML screening (Chainalysis or your provider) > **Enabled** for incoming and outgoing transactions, with alerts on flagged transfers
- [ ]  Settings > Audit Log > Review on a defined cadence (weekly minimum) for:
    - [ ]  User, role, and device changes
    - [ ]  TAP and allowlist edits
    - [ ]  API key creation
- [ ]  Export audit logs (or stream via API) to your SIEM/log archive for retention

## Backup & Recovery

- [ ]  Settings > General > Backup and recovery > Create the **key backup** of MPC key shares using a workspace recovery public key you generated offline
- [ ]  Store the recovery kit (backup package + recovery private key passphrase) in **separate, access-controlled offline locations** (e.g. safe-deposit boxes), never in the same place or in cloud storage
- [ ]  Document custody: who holds each recovery component, and require 2+ people to assemble a recovery
- [ ]  Test the recovery procedure (verify the backup package validates against the recovery key) after setup and after any owner change
- [ ]  Define owner succession: documented procedure to transfer the workspace **Owner** role and re-issue the recovery kit if the owner departs
