<!--
id: trezor-individual-configuration
type: CONFIGURATION
scope: INDIVIDUAL
-->

<div align="center"> <img src="../../../../images/guides/trezor.svg" alt="Trezor Logo" width="64" height="64"> <h2><a href="https://trezor.io/" target="_blank" rel="noopener noreferrer">Trezor</a> Configuration Guide</h2> </div>

## Device Setup

- [ ]  Purchase devices **directly from trezor.io** only — never from marketplaces, resellers, or second-hand sources
- [ ]  Inspect the **holographic seal and packaging** on arrival; reject any device with broken seals, re-glued boxes, or other signs of tampering
- [ ]  On first connect, let Trezor Suite perform the **firmware authenticity check** before installing firmware or creating a wallet
- [ ]  Generate the recovery seed **on the device itself** — never accept a pre-filled recovery card or a seed supplied by anyone else

## Security Settings

- [ ]  Set a strong PIN (up to 50 digits) that is not reused elsewhere; incorrect attempts trigger exponentially increasing delays
- [ ]  Enable the **passphrase feature (hidden wallets)** for high-value accounts; store the passphrase separately from the seed in a password manager
- [ ]  Trezor Suite > Settings > Device > **Auto-lock** > Set a short timeout
- [ ]  Consider setting a **wipe code** — a duress PIN that erases the device when entered

## Backup

- [ ]  Choose your backup type deliberately: **standard (BIP39)** vs **Shamir backup (SLIP39)** on supported models — prefer **Shamir** for high-value holdings so no single share can restore the wallet
- [ ]  Transfer the seed/shares to a **steel/metal backup** resistant to fire and water
- [ ]  **Never photograph or digitize** the seed — no photos, cloud notes, password managers, email drafts, or text files

## Trezor Suite

- [ ]  Download Trezor Suite **only from trezor.io** — never from ads, search results, or third-party stores
- [ ]  Verify the installer's **PGP signature/checksum** published by Trezor before running it
- [ ]  Settings > Application > **Tor** > Enable to route Suite traffic through Tor (optional privacy hardening)
- [ ]  Settings > Application > **Discreet mode** > Enable to hide balances from shoulder-surfers

## Transaction Safety

- [ ]  Verify the **full recipient address and amount on the device screen** before approving — never trust only what the computer displays
- [ ]  When receiving, use **"Show full address"** to confirm the receive address on the device screen matches Suite
- [ ]  Use **coin control** awareness when spending — review which UTXOs are being combined to avoid unnecessarily linking addresses

## Firmware

- [ ]  Install firmware updates **only through Trezor Suite** — never from links in emails, chats, or pop-ups
- [ ]  When prompted during an update, **verify the firmware fingerprint** against the value published by Trezor
