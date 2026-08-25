<!--
id: brex-organization-configuration
type: CONFIGURATION
scope: ORGANIZATION
-->

<div align="center"> <img src="../../../../images/guides/brex.svg" alt="Brex Logo" width="64" height="64"> <h2><a href="https://www.brex.com/" target="_blank" rel="noopener noreferrer">Brex</a> Configuration Guide</h2> </div>

## Account Security

- [ ]  Settings > Security > Two-factor authentication > **Authenticator app or security key** (never SMS - SP-FC-001)
- [ ]  Unique, password-manager-generated password per user (SP-GS-008)
- [ ]  Individual logins for every user - shared financial credentials are prohibited (SP-GS-009, SP-FC-001)
- [ ]  Register accounts to organization email addresses that are themselves hardware-key protected
- [ ]  Access financial portals only from dedicated or hardened finance devices (SP-FC-003)
- [ ]  Review active sessions and connected devices on a defined cadence

## Roles & Permissions

- [ ]  Team > Users > Assign the least-privilege role required; keep **Admin** count to the minimum for continuity (SP-FC-002)
- [ ]  Grant bookkeepers and external accountants **read-only / bookkeeper** scope - never payment-initiation rights
- [ ]  Ensure no single user can both create and approve the same payment (SP-FC-006)
- [ ]  Remove departed employees the same day and reassign their card and approval responsibilities (SP-GS-024)
- [ ]  Review the full user and role list quarterly against the account inventory (SP-GS-020)

## Card Controls

- [ ]  Set **per-card spend limits** sized to actual need rather than a blanket company limit
- [ ]  Apply **merchant category and vendor restrictions** where the card has a narrow purpose
- [ ]  Issue a **separate virtual card per vendor or subscription** - this contains the blast radius when a card number leaks in a vendor breach
- [ ]  Lock or delete unused and dormant cards rather than leaving them active
- [ ]  Never share a physical card or its number between employees
- [ ]  Require receipts and memos so anomalous spend is visible during review

## Payments & Transfers

- [ ]  Require **dual authorization** for all outbound wires and ACH payments (SP-FC-004)
- [ ]  Configure tiered approval thresholds so higher-value payments require additional approvers (SP-FC-005)
- [ ]  Verify new payee bank details **out-of-band** by voice with a known contact before the first payment - never from details supplied in an email thread (SP-FC-007, SP-FC-009)
- [ ]  Maintain a payee allowlist and require the same out-of-band verification when banking details change (SP-FC-008)
- [ ]  Set ACH and wire limits appropriate to normal operating spend

## Integrations

- [ ]  Review connected accounting and expense integrations; remove any that are unused
- [ ]  Grant integrations the minimum scope required, and prefer read-only sync where possible
- [ ]  Inventory API credentials with named owners and a rotation schedule (SP-GS-020)

## Monitoring

- [ ]  Enable **real-time transaction alerts** to a monitored team channel, not a single inbox
- [ ]  Alert on new user additions, role escalations, card issuance, and payee changes
- [ ]  Reconcile statements against internal records on a defined cadence (SP-FC-019)
- [ ]  Document the fraud-report and card-freeze escalation path in the financial incident response runbook before it is needed (SP-FC-014, SP-FC-015)
