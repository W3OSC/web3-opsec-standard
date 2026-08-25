<!--
id: ledger-individual-configuration
type: CONFIGURATION
scope: INDIVIDUAL
-->

<div align="center"> <img src="../../../../images/guides/ledger.svg" alt="Ledger Logo" width="64" height="64"> <h2><a href="https://www.ledger.com/" target="_blank" rel="noopener noreferrer">Ledger</a> Configuration Guide</h2> </div>

## Device Setup

- [ ]  Purchase devices **directly from ledger.com** only — never from marketplaces, resellers, or second-hand sources
- [ ]  Inspect packaging on arrival and reject any device that arrives with a pre-filled recovery sheet, included instructions to use a specific seed, or signs of tampering
- [ ]  Ledger Live > My Ledger > Run **Genuine check** to cryptographically verify the device before first use
- [ ]  Generate the recovery seed **on the device itself** — never accept, type in, or restore a seed provided by anyone else
- [ ]  Set a strong PIN (8 digits) that is not reused elsewhere; be aware the device **wipes itself after 3 incorrect PIN attempts**

## Firmware & Apps

- [ ]  Update firmware **only through Ledger Live** — never from links in emails, chats, or pop-ups
- [ ]  Review the official release notes before applying a firmware update
- [ ]  My Ledger > App catalog > Install **only the apps you actually need**; uninstall unused apps (keys are unaffected by app removal)

## Security Settings

- [ ]  Settings (on device) > Security > **Passphrase (25th word)** > Enable for high-value accounts; store the passphrase separately from the seed in a password manager
- [ ]  Settings (on device) > Security > **Auto-lock** > Set a short timeout (e.g. 1–5 minutes)
- [ ]  Settings (on device) > Security > **PIN lock** > Require PIN entry whenever the device is connected

## Transaction Safety

- [ ]  Keep **Blind signing OFF by default** in each app's settings — enable only per-session when a specific interaction explicitly requires it, and disable immediately afterwards
- [ ]  Verify the **full recipient address and amount on the device screen** before approving — never trust only what the computer or dApp displays
- [ ]  Prefer **clear signing** with compatible apps and dApps so the device shows human-readable transaction details

## Ledger Live Hygiene

- [ ]  Download Ledger Live **only from ledger.com** — never from ads, search results, or third-party stores
- [ ]  Verify the installer (checksum/signature published by Ledger) before running it
- [ ]  Never install browser extensions claiming to be "Ledger" — Ledger does not distribute a wallet browser extension
- [ ]  Settings > Help > **Analytics / usage data** > Disable (optional, reduces data exposure)

## Recovery

- [ ]  Back up the seed on a **steel/metal backup plate** resistant to fire and water
- [ ]  **Never digitize the seed** — no photos, cloud notes, password managers, email drafts, or text files
- [ ]  Decline **Ledger Recover** unless your organization's policy explicitly accepts the custodial-shard tradeoffs — document the decision either way
- [ ]  Test recovery by restoring the seed on a **spare device**, then wiping it, to confirm the backup is correct

## Phishing Defense

- [ ]  Remember: **Ledger will never ask for your 24-word recovery phrase** — anyone who does is an attacker
- [ ]  Treat "security update", "wallet migration", or "data breach compensation" emails as phishing — Ledger customer data leaks make such lures common; navigate to ledger.com manually instead of clicking links
