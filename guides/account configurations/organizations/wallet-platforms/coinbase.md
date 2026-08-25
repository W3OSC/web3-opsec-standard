<!--
id: coinbase-organization-configuration
type: CONFIGURATION
scope: ORGANIZATION
-->

<div align="center"> <img src="../../../../images/guides/coinbase.svg" alt="Coinbase Logo" width="64" height="64"> <h2><a href="https://www.coinbase.com/" target="_blank" rel="noopener noreferrer">Coinbase</a> Configuration Guide</h2> </div>

> Applies to organizational exchange accounts. Controls marked **[Prime]** are specific to Coinbase Prime or Exchange and may not appear on retail accounts.

## Account Security

- [ ]  Settings > Security > **Security key (FIDO2)** as the 2FA method
    - [ ]  Remove SMS and authenticator-app fallbacks once security keys are enrolled - a fallback method is only as strong as its weakest option (SP-FC-001)
    - [ ]  Enroll at least **two** security keys so loss of one does not lock out the account
- [ ]  Use a unique, password-manager-generated password (SP-GS-008)
- [ ]  Register the account to a **dedicated organization email** that is itself protected with hardware-key MFA and has no SMS recovery (SP-CS-002)
- [ ]  Never share logins - each authorized user holds their own credentials (SP-GS-009)
- [ ]  Access the account only from dedicated or hardened finance devices (SP-FC-003)

## Address Allowlisting

- [ ]  Settings > Security > **Address Book / allowlisting** > **On**
    - [ ]  Once enabled, withdrawals can only be sent to allowlisted addresses - this is the single highest-value control on the account
- [ ]  Confirm the **time delay** on newly added addresses is active (commonly 48 hours) and do not request exemptions
- [ ]  Add only addresses that have been verified against the wallet registry (SP-GS-020)
- [ ]  Send a **test transfer** and confirm receipt before moving material value to any newly allowlisted address (SP-FC-021)
- [ ]  Review the allowlist quarterly and remove addresses no longer in use

## Vaults & Withdrawal Controls

- [ ]  Hold reserves in a **Vault** rather than a standard trading balance
    - [ ]  Configure **multiple approvers** for vault withdrawals (SP-FC-004)
    - [ ]  Confirm the withdrawal time delay is enabled so an unauthorized request can be cancelled during the window
- [ ]  Set withdrawal limits sized to normal operating need, not to account maximum
- [ ]  **[Prime]** Configure withdrawal policies so no single user can both initiate and approve a transfer (SP-FC-006)
- [ ]  Keep only operational working balances on the exchange; sweep excess to organization-controlled custody per the treasury concentration limits (SP-FC-017)

## API Keys

- [ ]  Settings > API > Grant each key the **minimum scope** - view-only wherever the integration allows
    - [ ]  Do **not** enable withdraw/transfer scope unless strictly required; if required, pair it with allowlisting so funds can only move to known addresses
- [ ]  Apply an **IP allowlist** to every key, restricted to your server egress addresses
- [ ]  Record each key in the credential inventory with a named owner and rotation schedule (SP-GS-020)
- [ ]  Delete unused keys; rotate immediately when a key holder departs or exposure is suspected
- [ ]  Store keys in the organization secrets manager, never in source control (SP-DI-009)

## Team & Roles

- [ ]  **[Prime]** Assign least-privilege roles; keep administrator count to the minimum needed for continuity (SP-FC-002)
- [ ]  **[Prime]** Grant view-only access to personnel who need visibility but do not initiate or approve transactions
- [ ]  Remove departed users the same day and rotate any shared integration credentials they could access (SP-GS-024)
- [ ]  Review the user and permission list quarterly

## Session & Device Hygiene

- [ ]  Settings > Security > Review **active sessions and authorized devices**; sign out anything unrecognized
- [ ]  Review connected third-party applications and revoke those no longer in use
- [ ]  Do not access the account from personal or shared devices (SP-EP-001)

## Monitoring & Response

- [ ]  Enable notifications for logins, new device authorizations, withdrawals, and allowlist changes - routed to a monitored channel, not one person's inbox
- [ ]  Treat unexpected "confirm your device" or "verify this withdrawal" prompts as **evidence of an in-progress attack**, not as noise - stop and investigate before approving anything
- [ ]  Train authorized users that Coinbase support will never call to request codes, passwords, or transfers; verify any inbound contact through the official app (SP-GS-006)
- [ ]  Document the account-freeze and support escalation path **in advance** as part of the financial incident response runbook (SP-FC-014, SP-FC-015)
- [ ]  Reconcile exchange balances against internal records on a defined cadence (SP-FC-019)
