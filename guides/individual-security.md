<!--
id: individual-security-individual-guide
type: GUIDE
scope: INDIVIDUAL
-->

<div align="center">
  <h1>Personal Security Checklist</h1>
  <p><em>Baseline OpSec for every member of a Web3 organization</em></p>
</div>

---

## Overview

Your personal security posture is part of your organization's attack surface. A compromised individual gives attackers a trusted channel into everyone else — chat messages, code repos, shared files. This checklist is the baseline every member should meet; the linked guides go deeper on each area.

---

## Work Devices

Everything below applies to any device that touches organization accounts, code, or data.

### Device hardware

- [ ] **Use a dedicated work device** — organization-related activity must never happen on personal devices
- [ ] **Buy through verified supply chains** — direct from the manufacturer or a trusted physical retailer, never a third-party reseller
- [ ] **Require modern security hardware** — biometric login, secure boot, and full disk encryption support

### Device configuration

- [ ] **Enable full disk encryption** on all work devices
- [ ] **Enable antivirus** — built-in OS antivirus is acceptable, but it must be properly enabled with no rule exceptions
- [ ] **Set an inactivity screen lock** of 5 minutes or less before password re-entry is required
- [ ] **Use non-administrator OS accounts** for daily work

### Device usage

- [ ] **Never give personal devices access to organization accounts**
- [ ] **Apply security updates promptly** — operating systems, browsers, and security software as soon as releases with security fixes are available
- [ ] **Use biometrics or SSO in non-private spaces** so cameras and onlookers cannot capture typed passwords
- [ ] **Use a privacy screen** when working in public spaces

### Mobile devices

Phones hold authenticator codes, signed-in chat sessions, and the number your accounts fall back to — see the [Mobile Device Security Guide](mobile-device-security.md) for full iOS and Android hardening.

- [ ] **Enable platform anti-theft protection** — iOS Stolen Device Protection, Android Theft Detection Lock and Remote Lock
- [ ] **Never type your passcode in public view** — use biometrics; an observed passcode plus a snatched phone is a total compromise
- [ ] **Hide notification previews on the lock screen** so one-time codes and messages are not readable on a locked device
- [ ] **Install apps only from the official store** — never sideload, never install a "support" remote-access app
- [ ] **Enable remote location, lock, and wipe**, and keep the Apple ID or Google Account behind the device on phishing-resistant MFA

### Network security

- [ ] **Harden your home WiFi**:
  - [ ] Strong password (at least 20 characters) and rotated (non-default) admin credentials
  - [ ] Router and modem updated to the latest firmware
  - [ ] WPA3/WPA2 encryption (AES, not TKIP), with WPS disabled
  - [ ] Remote management disabled
  - [ ] A separate network for guest devices
- [ ] **Use a secure DNS provider** — e.g. Cloudflare's [1.1.1.1](https://www.cloudflare.com/learning/dns/what-is-1.1.1.1/)
- [ ] **Configure a trusted VPN** and use it on any public WiFi
- [ ] **Run active network monitoring** — [Little Snitch](https://www.obdev.at/products/littlesnitch/), [LuLu](https://objective-see.org/products/lulu.html), or [GlassWire](https://www.glasswire.com/) — tracking outbound connections and blocking all traffic by default unless explicitly approved
- [ ] **Run persistence monitoring** — [BlockBlock](https://objective-see.org/products/blockblock.html) alerts whenever anything installs itself to run at startup
- [ ] **Enable the OS firewall** with no rule exceptions

---

## Wallets & Transactions

For the full organizational picture — platform setup, quorum design, and transaction verification — see the [Multi-Sig Wallet Security Guide](multisig-ideal-setup.md).

### Hardware wallets

- [ ] **Buy through verified supply chains** — direct from the manufacturer or a trusted physical retailer, never a reseller
- [ ] **Verify device authenticity cryptographically** during initial setup to confirm firmware integrity
- [ ] **Require a screen large enough to display complete transaction data** — clear signing helps, but it is not a silver bullet and never replaces reading the transaction
- [ ] **Require secure PIN entry** — randomized layouts or biometric login, PINs of at least 6 digits, and time-based lockouts against brute force
- [ ] **Store wallets in a safe or hidden location** when not in use

### Wallet backups

- [ ] **Back up seed phrases on disaster-resistant physical media** — never digitally
- [ ] **Never store a seed phrase in plain text** — importing it must require a passphrase, an additional word, or unscrambling a random word order, with the secret kept in a password manager
- [ ] **Generate keys on the wallet device and never export them** — no photos, no password-manager backups; they must never touch another device in any form
- [ ] **Alternatively, shard the seed** (e.g. Shamir's Secret Sharing, N of M shards) with shards held by trusted guardians — a custodian service, family members, separate physical media, or (since one shard alone reveals nothing) a password manager

### Multi-sig participation

- [ ] **Sign only on a dedicated device** used exclusively for transactions and transaction-verification tools
- [ ] **Sign only on private, authenticated networks** or over a trusted VPN
- [ ] **Run network and persistence monitoring on signing devices** — default-deny rules allowing only the minimum endpoints transactions require

---

## Operations

Daily habits that keep a compromise from starting — or from spreading once it does.

### Browser security

- [ ] **Separate browsers by trust level** — one for session-based sensitive work, one for opening links and temporary browsing, and a third dedicated solely to wallet extensions and transacting
- [ ] **Minimize extension permissions** — review regularly and remove anything that can rewrite page content, read all websites, or access the file system without a strong reason
- [ ] **Install extensions only from official stores** (Chrome Web Store, Firefox Add-ons, etc.) — never sideloaded from a file or repo

### Secure communication

- [ ] **Sign emails with a published, externally verifiable PGP key** so recipients can verify authenticity; make sure teammates have it
- [ ] **Use end-to-end encrypted channels** (Signal recommended) for confidential communication and coordination of sensitive operations
- [ ] **Open external files only in a sandbox or after sanitizing** — [Dangerzone](https://dangerzone.rocks/), [VirusTotal](https://www.virustotal.com/gui/home/upload), [Google Drive](https://support.google.com/drive/answer/141702) preview, or a disposable VM
- [ ] **Share internal files via a dedicated platform** (Google Drive/Docs, Dropbox, Notion, etc.) — never as email or chat attachments, which normalizes the exact delivery vector social-engineering malware uses
- [ ] **Navigate to shared links manually** — re-type or manually navigate rather than clicking, to defeat homograph lookalikes

### Workspace

- [ ] **Perform sensitive operations in a dedicated workspace** — isolated from common areas and shielded from unauthorized visual access to screens
- [ ] **Store organizational devices and materials securely** when not in use
- [ ] **Never perform privileged operations in public spaces**
- [ ] **Lock computers whenever unattended**

---

## Authentication

Method selection by account sensitivity, recovery hardening, and session hygiene are covered in depth in the [Authentication & MFA Guide](authentication-and-mfa.md).

### Password management

- [ ] **Use a password manager** (1Password or Bitwarden recommended), with organization accounts separate from personal accounts
- [ ] **Generate every password** — never reused, 20–32 characters, full character set (letters, numbers, symbols)
- [ ] **Use a strong master password** — at least 20 characters mixing [phonetic phrases](https://xkcd.com/936/), numbers, and special characters

### Login methods

- [ ] **Enforce 2FA on every account** — FIDO security keys (e.g. YubiKey) recommended; mobile authenticator apps acceptable
- [ ] **Prefer passkeys as the primary login method** where available
- [ ] **Reserve SSO for non-sensitive accounts** — never for financial, administrative, deployment, or infrastructure access
- [ ] **Never use SMS 2FA unless no other option exists**, and never enable SMS-based account recovery at all
- [ ] **Keep TOTP seeds out of password managers** — a single dedicated device only
- [ ] **Protect your phone number from SIM swaps** — set a SIM PIN and enable carrier port-out protection; see [SIM swap protection](authentication-and-mfa.md#sim-swap-protection) for carrier-specific steps
