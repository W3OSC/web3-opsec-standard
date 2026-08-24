<!--
id: mobile-security-individual-guide
type: GUIDE
scope: INDIVIDUAL
-->

<div align="center">
  <h1>Mobile Security Checklist</h1>
  <p><em>Hardening the device that anchors your 2FA, messages, and mobile wallets</em></p>
</div>

---

## Overview

Your phone is the single most valuable device you own to an attacker: it anchors 2FA and account recovery for nearly everything, receives your calls and messages, holds your Signal identity, and increasingly carries mobile wallets. A compromised or stolen phone can cascade into email takeover, exchange drains, and impersonation of you to your own team. This checklist adapts Digibastion's mobile security category for web3 individuals: carrier-level defenses first (SIM swaps bypass everything on the handset), then device hardening, app hygiene, wallet practices, and communications.

---

## Carrier & SIM

- [ ] Set a carrier account PIN and enable port-out/number-transfer protection with your provider (see SP-GS-013 for carrier-specific steps: AT&T Extra Security, T-Mobile Account Takeover Protection, Verizon Number Lock, Google Fi Number Lock)
	- [ ] Where offered, require in-store photo ID for any SIM change on the account — social-engineered telco support staff are the weak link in most SIM swaps
- [ ] Set a SIM PIN on the physical SIM so a thief cannot move it to another handset
- [ ] Consider eSIM over physical SIM: it cannot be pulled from a stolen phone, though it shifts risk to your carrier account security — which makes the carrier PIN above even more critical
	- [ ] If you keep a physical SIM, know that a thief with the card can receive your SMS on their handset within minutes — another reason SMS must never gate anything critical
- [ ] Never use SMS-based 2FA or SMS account recovery for critical accounts (email, exchanges, password manager, GitHub) — use FIDO2 keys or TOTP instead
	- [ ] Audit existing accounts for lingering SMS recovery options: many services silently keep phone recovery enabled even after you add stronger factors
- [ ] Consider a secondary, unpublished number (or VoIP number) for accounts that force phone verification, keeping your real number off breach lists
- [ ] Know your carrier's SIM-swap incident process before you need it, and treat sudden loss of cellular service ("SOS only" with no outage) as an active SIM-swap emergency: contact your carrier immediately and lock down email and exchange accounts first

---

## Device Hardening

- [ ] Enable automatic OS and security updates, and replace any phone that no longer receives security patches
	- [ ] Prefer hardware with strong security track records and long support windows: iPhone, or Pixel (which also enables GrapheneOS)
- [ ] Use a strong alphanumeric passcode, not a 4-6 digit PIN and not a swipe pattern
	- [ ] Shield your passcode entry in public — "shoulder-surf the PIN, snatch the phone" defeats every other control on the device
- [ ] Understand the biometrics tradeoff: Face ID/fingerprint is fine for daily convenience, but know how to trigger emergency lockout (iOS: hold side + volume; Android: Lockdown mode) to force passcode-only when at risk, and disable biometrics entirely before border crossings
- [ ] Enable encrypted backups only (iCloud with Advanced Data Protection enabled, or Google One backups) — an unencrypted cloud backup is a copy of your phone an attacker can steal without ever touching the device
	- [ ] Verify what the backup includes: message history and app data in a weakly protected backup undo your on-device encryption
- [ ] Set auto-lock to 30 seconds - 1 minute and require the passcode immediately
- [ ] High-risk individuals (signers, founders, public figures) should enable iOS Lockdown Mode or run GrapheneOS on a Pixel
	- [ ] Lockdown Mode blocks most zero-click exploit chains (message attachments, link previews, unknown FaceTime calls) at modest usability cost — it is the single highest-leverage iOS setting for targeted individuals
- [ ] Review the phone's device list in your Apple/Google account quarterly and remove anything you don't recognize
- [ ] Enable Find My / Find My Device with remote wipe, and enable iOS Stolen Device Protection (or Android Theft Detection Lock)
- [ ] Disable lock-screen access to control center, USB accessories, and notification content where the OS allows it
- [ ] Reboot the phone periodically (daily for high-risk users) — many mobile exploits are non-persistent and die on reboot; GrapheneOS can auto-reboot on a timer
- [ ] Keep Bluetooth, NFC, and AirDrop off or set to contacts-only when not actively in use
- [ ] Use encrypted DNS or an always-on mobile VPN (Mullvad, Proton VPN, or NextDNS profile) so hostile networks can't observe or tamper with your traffic
- [ ] Never leave an old phone signed in as a forgotten 2FA/session device — factory-reset and remove retired phones from your accounts' device lists, and wipe before selling or recycling

---

## App Hygiene

- [ ] Install apps only from the official App Store / Google Play — and even there, verify the developer name and review count before installing wallet or exchange apps (fake wallet apps pass review regularly)
- [ ] Audit app permissions quarterly: revoke camera, microphone, location, contacts, and photo access from apps that do not strictly need them (iOS App Privacy Report / Android Privacy Dashboard)
- [ ] Never sideload apps or install third-party APKs on any device that holds a wallet or 2FA seeds
	- [ ] "Beta test our game/app" TestFlight and APK invitations are a known targeted-malware vector against crypto team members
- [ ] Check for stalkerware if your threat model includes close-proximity adversaries: review installed profiles/device admin apps (iOS: Settings > General > VPN & Device Management; Android: device admin app list), and unexpected battery or data drain
- [ ] Use a separate Android work profile (e.g. via Shelter) or a dedicated iOS Focus/device to isolate work apps from personal apps
- [ ] Remove apps you no longer use — every installed app is standing attack surface
- [ ] Beware "support" and "screen sharing" apps: never install AnyDesk/TeamViewer-class tools at the request of an inbound caller — this is the standard exchange-drain playbook
- [ ] Keep your 2FA app (Aegis, Raivo/2FAS, or Google Authenticator with cloud sync disabled) on this device only, consistent with your TOTP-single-device policy, and back up its encrypted export offline

---

## Mobile Wallets

- [ ] Keep only spending-money balances in mobile hot wallets — an amount you could lose to a stolen, unlocked phone without lasting damage
- [ ] Pair mobile wallet apps with a hardware wallet where supported (e.g. Ledger/Keystone integrations) so keys never live on the phone for meaningful balances
- [ ] Protect the wallet app itself with a separate PIN/biometric lock where the app supports it, so an unlocked phone is not an unlocked wallet
- [ ] Never store seed phrases on the phone in any form: no photos, no notes apps, no password manager entries, no cloud drives — photo libraries are the first place stolen-phone crews look
- [ ] Verify destination addresses on a second surface before sending: hardware wallet screen, or read back via a second device/channel — never trust the phone screen alone
- [ ] Send a small test transaction first for any meaningful transfer to a new address, and confirm receipt before sending the remainder
- [ ] Beware clipboard hijackers: after pasting an address, re-verify the first and last 6 characters; malware that swaps copied addresses is common on mobile
- [ ] Treat QR codes as untrusted input: verify the decoded address/transaction the app shows you before approving, and never scan QR codes from strangers, posters, or conference booths into a wallet app
- [ ] Disable wallet balance widgets and notification previews that display holdings on the lock screen
- [ ] Do not use in-app browsers (Telegram, Twitter/X, Discord) to open dApp links or connect wallets — open links in your dedicated browser where you can inspect the URL
- [ ] Review WalletConnect sessions and token approvals from mobile wallets regularly (revoke.cash) — mobile signing flows make it easy to accumulate forgotten approvals

---

## Messaging & Calls

- [ ] Use Signal for all sensitive communications; enable a Signal PIN and registration lock so a SIM swap cannot hijack your Signal identity
	- [ ] Verify safety numbers with your core team in person or over a trusted channel, and re-verify when they change
	- [ ] Review Signal's Linked Devices list periodically — a silently linked desktop session is a full transcript tap
- [ ] Treat SMS links as hostile by default — carriers' spam filtering does not catch targeted smishing; navigate to services manually instead of tapping
- [ ] Disable message previews on the lock screen so 2FA codes and private messages are not readable from a stolen or observed phone
- [ ] Silence unknown callers (iOS: Silence Unknown Callers; Android: call screening) to blunt vishing — legitimate contacts will leave a message; "your exchange's fraud department" will not
- [ ] Treat all inbound calls claiming to be your bank, exchange, or carrier as hostile: hang up and call back on the official number
	- [ ] The same applies to voice notes and calls that sound like teammates — voice cloning is cheap; verify unusual requests on a known channel before acting
- [ ] Set disappearing messages for sensitive Signal threads so a compromised phone yields less history
- [ ] Lock down messenger discoverability: hide your phone number in Telegram and Signal settings so your number can't be joined to your handles
- [ ] Never approve an MFA push notification you did not initiate, and report (don't just dismiss) unexpected prompts — MFA fatigue attacks rely on you eventually tapping "Approve"
- [ ] Rehearse the stolen-phone drill so you can execute it in minutes: remote-lock and wipe via Find My, sign out sessions from your password manager's security dashboard, notify your carrier, then notify your team
	- [ ] Keep the ability to do this from a second device — if your phone is your only 2FA anchor, its theft locks you out exactly when you need access most (keep FIDO2 backup keys and printed recovery codes offline)
