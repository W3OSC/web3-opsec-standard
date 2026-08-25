<!--
id: bitwarden-individual-configuration
type: CONFIGURATION
scope: INDIVIDUAL
-->

<div align="center"> <img src="../../../../images/guides/bitwarden.svg" alt="Bitwarden Logo" width="64" height="64"> <h2><a href="https://bitwarden.com/" target="_blank" rel="noopener noreferrer">Bitwarden</a> Configuration Guide</h2> </div>

## Account Security

- [ ]  Choose a **master passphrase of four or more random words** that is used nowhere else and is memorized, not stored digitally
    - [ ]  Understand that 2FA protects the Bitwarden service, **not** an already-downloaded encrypted vault - master password strength and KDF settings are the real defense against an offline attack on a stolen vault
- [ ]  Settings > Security > Two-step login > **Security key (FIDO2)** where available on your plan, otherwise an authenticator app
- [ ]  Remove weaker two-step methods (email) once a stronger one is enrolled
- [ ]  Settings > Security > **Keys** > Set KDF to **Argon2id** with parameters at or above the recommended defaults
- [ ]  Save two-step recovery codes on physical media or in a separate secure location

## Vault Configuration

- [ ]  Settings > Security > **Vault timeout** > Short interval, with timeout action set to **Lock** (or Log out on shared hardware)
- [ ]  Enable PIN or biometric unlock **only on trusted devices**, and keep **"Require master password on restart"** enabled
- [ ]  Review vault items periodically and remove credentials for services no longer in use
- [ ]  Use folders or collections to separate high-value credentials (financial, registrar, exchange) from routine ones

## Emergency & Recovery

- [ ]  Configure **emergency access** for a trusted contact with an appropriate waiting period, **or** document a written recovery plan for your estate/continuity needs
- [ ]  If exporting, use an **encrypted export** only - a plaintext `.json` or `.csv` export is a complete copy of every credential you own
- [ ]  Store any export on encrypted physical media, never in cloud storage or email
- [ ]  Delete exports as soon as they have served their purpose

## Client Hygiene

- [ ]  Install clients and the browser extension **only** from official Bitwarden links; verify the publisher on store listings
- [ ]  Pin the browser extension to the toolbar and **invoke it from the toolbar rather than from in-page prompts**
    - [ ]  Fake in-page "Bitwarden" popups rendered by a malicious site are a standard credential-theft technique
- [ ]  Settings > Auto-fill > **Auto-fill on page load** > **Off**
    - [ ]  Manual autofill turns the extension into a phishing detector: if it does not offer the credential, the domain does not match the saved one - treat that as a warning, not an inconvenience
- [ ]  Keep clients updated

## Usage Practices

- [ ]  Generate a **unique password per site** and never reuse across services (SP-GS-008)
- [ ]  Store TOTP seeds for your **most critical accounts in a separate authenticator**, not in the same vault as the password
    - [ ]  Keeping both factors in one vault reduces two-factor authentication to one factor if that vault is compromised
- [ ]  Prefer hardware security keys over TOTP wherever the service supports them (SP-GS-011)
- [ ]  Run the vault health / exposed password reports periodically and rotate anything flagged as breached or reused
- [ ]  Never store seed phrases or private keys as plain vault notes - follow the seed protection requirements instead (SP-WM-003)

## Sync & Devices

- [ ]  Settings > Security > **Sessions / Devices** > Review authorized devices and deauthorize unrecognized or retired ones
- [ ]  Deauthorize all sessions immediately after a device loss, then change the master password from a clean device
- [ ]  Confirm which Bitwarden server region or self-hosted instance your clients point at
