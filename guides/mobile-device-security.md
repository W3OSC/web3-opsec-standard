<!--
id: mobile-device-security-individual-guide
type: GUIDE
scope: INDIVIDUAL
-->

<div align="center">
  <h1>Mobile Device Security Guide</h1>
  <p><em>Hardening the phone that holds your 2FA, your chats, and your recovery paths</em></p>
</div>

---

## Overview

Your phone is the most exposed privileged device you own. It holds authenticator codes, signed-in sessions for email and chat, password manager access, passkeys, and the phone number that half the internet treats as proof of identity. It travels through airports, cafés, and conferences, and it is the one device you routinely hand to strangers to take a photo.

Most mobile compromises in Web3 are not exotic. They are a passcode watched over a shoulder and a phone snatched minutes later, a SIM or eSIM ported to an attacker's device, a "support agent" talking someone into installing a remote-access app, or a fake wallet in a store listing. Mercenary spyware is real and does target this industry, but the common cases are mundane and entirely preventable.

This guide covers hardening iOS and Android for people with access to funds, infrastructure, or community channels, and what to do when a phone is lost, stolen, or suspected of being compromised. Phone-number and SIM controls are covered in depth in the [Authentication & MFA Guide](authentication-and-mfa.md#sim-swap-protection); this guide covers the device itself.

---

## Security Risks

- **Physical access to an unlocked or observed device**
  - Passcode observed in public ("shoulder surf and snatch") — with the passcode, an attacker owns the device, the cloud account, and every password reset that flows through it
  - Theft or seizure while unlocked, where biometrics and screen lock never come into play
  - Border crossings and checkpoints where a device may be taken out of sight or unlock compelled

- **Account and identity takeover through the phone**
  - SIM swap and eSIM transfer handing over SMS codes and number-based recovery
  - Cloud account (Apple ID / Google Account) compromise — a backup of the phone is a copy of the phone
  - Lock-screen notification previews leaking one-time codes and message content to anyone holding the device

- **Malicious and over-permissioned apps**
  - Fake wallet, exchange, and airdrop apps published to official stores, or delivered via sideloading, TestFlight, and APK links
  - Remote-access and screen-sharing apps installed under social-engineering pressure from a fake "support agent"
  - Accessibility services, custom keyboards, and device-admin apps that can read the screen, capture input, and act on the user's behalf
  - Legitimate apps with excessive permissions and cloud sync quietly copying photos of seed phrases and recovery codes off the device

- **Network and proximity attacks**
  - Auto-joining remembered or open Wi-Fi networks, and rogue base stations that downgrade to 2G to intercept SMS
  - Malicious charging ports and cables (juice jacking) and hostile USB accessories against an unattended phone
  - Malicious configuration profiles and MDM enrolment that silently install root certificates or VPNs

- **Targeted mobile malware**
  - Zero-click exploits delivered through messaging apps, which require no user interaction at all
  - Mercenary spyware with full access to messages, microphone, camera, and location — Web3 founders, signers, and security staff are in scope for this

---

## Device Baseline

Applies to both platforms, and to any phone or tablet that touches organization accounts, chat, or wallet software.

### Choosing and provisioning

- [ ] **Use a device that still receives security updates** — replace phones past their vendor support window; an unpatched phone cannot be hardened
- [ ] **Buy from the manufacturer or carrier directly**, never a third-party reseller or marketplace
- [ ] **Prefer a dedicated work phone** for organization accounts, following the same separation rule as laptops in the [Personal Security Checklist](individual-security.md)
- [ ] **Keep a separate device for signing and authenticator codes** if you hold funds or signer duties — never the same phone you use for browsing and social apps
- [ ] **Set up from scratch on high-value devices** rather than restoring a backup carried forward from an older, less-hardened phone

### Passcode and biometrics

- [ ] **Set a passcode of at least 6 digits** — an alphanumeric passphrase on devices with signer or admin access
- [ ] **Never enter your passcode in public view** — use biometrics in cafés, airports, and conferences, and shield the screen when a passcode is unavoidable
- [ ] **Use biometrics as the day-to-day unlock** so the passcode is typed rarely and observed almost never
- [ ] **Enable erase-after-failed-attempts** (iOS: Settings → Face ID & Passcode → Erase Data) on devices with sensitive access
- [ ] **Know how to disable biometrics instantly** — iOS: hold side + volume until the power-off screen appears; Android: power menu → Lockdown. Do this before any situation where the device may be taken
- [ ] **Power the device fully off when crossing borders or entering any hostile environment** — a phone that has not been unlocked since boot is in its strongest cryptographic state

### Lock screen exposure

- [ ] **Hide notification previews** — iOS: Settings → Notifications → Show Previews → When Unlocked; Android: Settings → Notifications → Notifications on lock screen → hide sensitive content
- [ ] **Disable Control Center, wallet, and reply-from-lock-screen access while locked** (iOS: Settings → Face ID & Passcode → Allow Access When Locked)
- [ ] **Disable USB accessory access while locked** (iOS: same screen → Accessories off) so a seized or unattended phone cannot be connected to forensic hardware
- [ ] **Set the shortest practical auto-lock**, 1 minute or less on devices with signer or admin access

### Updates and backups

- [ ] **Enable automatic OS and security updates**, including iOS Rapid Security Responses
- [ ] **Apply updates the day they ship** on any device with wallet, admin, or signer access — mobile exploits are usually weaponized against known-but-unpatched bugs
- [ ] **Enable automatic app updates** from the official store only
- [ ] **Encrypt backups end-to-end** — iOS: turn on [Advanced Data Protection](https://support.apple.com/en-us/108756) (Settings → your name → iCloud); Android: set a screen lock so backups are encrypted, and verify Google One backup is enabled with a device-only passcode
- [ ] **Protect the cloud account like a critical account** — the Apple ID or Google Account behind a phone can restore its contents onto an attacker's device; it needs hardware-key or passkey MFA and hardened recovery

---

## iOS Hardening

- [ ] **Enable Stolen Device Protection** (Settings → Face ID & Passcode) — requires biometrics plus a one-hour delay for passcode changes, Apple ID changes, and turning off Find My when away from familiar locations. This is the single most effective control against passcode-observation theft
- [ ] **Turn on Lockdown Mode** (Settings → Privacy & Security → Lockdown Mode) for founders, signers, and anyone plausibly targeted by mercenary spyware — it blocks the message attachment types, web technologies, and unsolicited connections that zero-click chains rely on
- [ ] **Require Attention for Face ID** so the phone cannot be unlocked by pointing it at a sleeping or unaware owner
- [ ] **Audit device management** (Settings → General → VPN & Device Management) — any configuration profile, MDM enrolment, or VPN you did not knowingly install is a compromise until proven otherwise
- [ ] **Run Safety Check** (Settings → Privacy & Security → Safety Check) after any suspected compromise or relationship change to review what people and apps have access
- [ ] **Review app permissions quarterly** — location, microphone, camera, photos, contacts, and local network; use the App Privacy Report to see what apps actually access
- [ ] **Set Photos access to selected photos only** for chat and social apps, so a full photo library cannot be read by an app that only needs to send one image
- [ ] **Set AirDrop to Contacts Only** and disable automatic AirDrop receiving in public
- [ ] **Turn on iMessage Contact Key Verification** if you coordinate sensitive operations over iMessage
- [ ] **Review signed-in devices on your Apple ID** and remove anything unfamiliar
- [ ] **Disable Siri on the lock screen**, which can otherwise answer questions about contacts and messages without unlocking

---

## Android Hardening

- [ ] **Use a device with a long, first-party update commitment** — Pixel and current flagship Samsung devices; consider [GrapheneOS](https://grapheneos.org/) on a Pixel for signers and high-risk roles
- [ ] **Turn on Advanced Protection** (Settings → Security & privacy → Advanced Protection, Android 16+) — it blocks sideloading, forces hardened memory protections, disables 2G, restricts USB while locked, and turns on intrusion logging in one switch
- [ ] **Enrol the Google Account in the [Advanced Protection Program](https://landing.google.com/advancedprotection/)** — requires hardware keys or passkeys and severely restricts account recovery social engineering
- [ ] **Block installs from unknown sources** (Settings → Apps → Special app access → Install unknown apps — deny for every app, especially browsers and messengers)
- [ ] **Keep Google Play Protect enabled**, including scanning of installed apps
- [ ] **Audit accessibility services** (Settings → Accessibility → Downloaded apps) — an app with accessibility access can read the screen and tap on your behalf; this is the mechanism behind most Android banking and wallet-drainer trojans. Nothing should be here that you did not deliberately enable
- [ ] **Audit device admin apps and notification-listener access** and remove anything unrecognized
- [ ] **Disable 2G** (Settings → Network & internet → SIMs → Allow 2G, off) to defeat downgrade-based interception
- [ ] **Use a work profile or Private Space** to isolate organization apps from personal ones, with separate credentials and the ability to pause or wipe the container independently
- [ ] **Turn on Theft Detection Lock, Offline Device Lock, and Remote Lock** where available, so a snatched phone locks itself rather than staying open in the thief's hands
- [ ] **Review app permissions quarterly** and enable automatic revocation of permissions for unused apps

---

## App Discipline

The app you install voluntarily is a more common failure than the exploit you never see.

- [ ] **Install only from the official store** — App Store or Google Play; never sideload APKs, never install from a link in chat, email, or a DM from "support"
- [ ] **Verify the publisher, not just the name** — check the developer name, website, download counts, and review history against official project documentation before installing any wallet or exchange app
- [ ] **Never install remote-access, screen-share, or remote-support apps** (AnyDesk, TeamViewer, and similar) on a device with account or wallet access — no legitimate support desk will ever ask for this, and the request itself is the attack
- [ ] **Refuse TestFlight and beta invites** for financial apps from anyone who contacts you first — fake beta builds are a standard Web3 delivery vector
- [ ] **Never install third-party keyboards** on a device used for credentials or seed entry; a keyboard sees everything typed
- [ ] **Remove apps you no longer use** — every installed app is maintained attack surface with standing permissions
- [ ] **Treat QR codes as untrusted links** — verify the site a scanned code opens before connecting a wallet or approving a session, and disconnect stale WalletConnect sessions

---

## Credentials and Key Material on Mobile

- [ ] **Never store seed phrases, private keys, or their photographs on a phone** — no notes, no screenshots, no photo library, no cloud drive; photos sync off the device automatically
- [ ] **Never screenshot recovery codes or TOTP QR codes** for the same reason
- [ ] **Keep TOTP seeds on a dedicated authenticator device**, separate from the phone holding your password manager, so one lost phone is not both factors (see the [Authentication & MFA Guide](authentication-and-mfa.md#factor-independence))
- [ ] **Require biometric unlock on the password manager** with a short auto-lock timeout, and never enable "stay unlocked"
- [ ] **Do not hold meaningful funds in a mobile hot wallet** — use a hardware wallet for anything material, and keep mobile wallets for small operational balances only
- [ ] **Disable clipboard-sharing and cross-device clipboard sync**, which have repeatedly leaked addresses and secrets between devices

---

## Network and Physical Exposure

- [ ] **Disable Wi-Fi auto-join and forget public networks** after use; prefer your cellular connection or a personal hotspot over café and conference Wi-Fi
- [ ] **Use a trusted VPN on any network you do not control**
- [ ] **Never charge from public USB ports** — use your own battery pack, a charge-only cable, or a USB data blocker
- [ ] **Turn off Bluetooth, AirDrop/Nearby Share, and NFC when not in use**, especially at conferences
- [ ] **Never leave a phone unattended** in a hotel room, at a desk, or with a stranger "borrowing" it for a call
- [ ] **Carry a clean travel device** for high-risk travel, with only the apps and accounts the trip requires, and re-image it on return
- [ ] **Use a privacy screen protector** on a device you regularly use in public

---

## Suspected Compromise

Signs worth acting on: unfamiliar configuration profiles or device-admin apps, an account you cannot sign out of, sessions or devices you do not recognize on your Apple ID or Google Account, sudden battery and thermal changes with no cause, a spyware notification from Apple or Google, or messages sent that you did not send.

- [ ] **Do not try to clean a suspect phone** — treat it as fully compromised and move off it
- [ ] **Move to a known-clean device first**, then revoke sessions and rotate credentials from there, not from the suspect phone
- [ ] **Revoke and rotate in priority order** — cloud account, email, password manager, chat accounts, exchange and organization accounts; assume anything the phone was signed into is exposed
- [ ] **Remove the device from wallets and multi-sigs** it participated in, and migrate funds if any key material could have touched it
- [ ] **Preserve evidence before wiping** if the incident matters — [MVT](https://github.com/mvt-project/mvt) and [iVerify](https://iverify.io/) can analyze a device or backup for known spyware indicators
- [ ] **Factory reset and set up fresh** rather than restoring the backup that may contain the problem
- [ ] **Follow the organization's process** in the [Incident Response Readiness Guide](incident-response-readiness.md) — a compromised phone with chat access is an organization-wide incident, not a personal one

### Lost or stolen device

- [ ] **Mark as lost and locate immediately** via Find My (iOS) or Find Hub / Find My Device (Android)
- [ ] **Call the carrier and suspend the SIM/eSIM** to stop the number being used for SMS codes and port-out
- [ ] **Sign the device out of the cloud account** and revoke its sessions from another device
- [ ] **Rotate anything the passcode could unlock** if the passcode may have been observed before the theft — this is the standard sequence in phone-snatching attacks
- [ ] **Erase remotely** once recovery is no longer realistic

---

## Organizational Controls

For teams responsible for members' devices rather than their own:

- [ ] **Inventory every mobile device with access to organization accounts**, including personal phones running the authenticator or chat apps
- [ ] **Enforce a minimum OS version** and remove access from devices past their vendor support window
- [ ] **Require managed work profiles or MDM enrolment** on devices holding organization data, with remote wipe of the work container available
- [ ] **Publish a written policy** that seed phrases, private keys, and signer roles never live on general-purpose phones
- [ ] **Include mobile devices in onboarding and offboarding** — wipe the work profile, revoke device tokens and push sessions, and remove the number from recovery paths when someone leaves
- [ ] **Brief the team on the phone-snatch and fake-support patterns** specifically; both are defeated by knowledge, not configuration

---

## Related W3OS Requirements

This guide implements the mobile endpoint controls from [Domain 2: Endpoint Security](../requirements/02-endpoints.md):

- **SP-EP-014** — Mobile Device Hardening
- **SP-EP-015** — Mobile Application Control
- **SP-EP-016** — Mobile Device Loss and Compromise Response

addressing risks R-EP-014 (Mobile Device Compromise and Mobile Malware), R-EP-015 (Theft or Loss of Mobile Devices with Privileged Access), and R-EP-002 (Physical Device Compromise), alongside the phone-number controls in SP-GS-013 (SIM Swap Mitigation).
