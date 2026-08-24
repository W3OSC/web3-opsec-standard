<!--
id: travel-security-individual-guide
type: GUIDE
scope: INDIVIDUAL
-->

<div align="center">
  <h1>Travel Security Checklist</h1>
  <p><em>Protecting yourself, your devices, and your organization's keys while on the move</em></p>
</div>

---

## Overview

Travel concentrates risk: you carry devices through jurisdictions with different search laws, connect to untrusted networks, work in public spaces, and attend events where you are visibly identifiable as a person with access to crypto assets. Conferences in particular are targeted hunting grounds for social engineers and device thieves. This checklist is aligned with SEAL's "While Traveling" guidance, Digibastion's travel recommendations, and DARC AC-2.21, and covers the full travel lifecycle: preparation, border crossings, time in the field, and re-entry.

The core principle: **travel with the minimum data, keys, and authority necessary — and assume everything you carry may be inspected, imaged, or stolen.**

---

## Before You Travel

### Devices & Data
- [ ] Use dedicated travel devices (a "burner" laptop and/or phone) provisioned with only the data and accounts needed for the trip
	- [ ] If a dedicated travel device is not feasible, remove sensitive local data, sign out of non-essential accounts, and take a full backup before departure
- [ ] Remove all signing keys, wallet apps, and seed material from any device that crosses a border
	- [ ] Do not travel with hardware wallets unless the trip specifically requires signing; if you must, carry a device with a decoy/passphrase-protected wallet rather than your primary
- [ ] Update the OS and all apps to current versions before departure — you may not want to install updates over untrusted networks mid-trip
- [ ] Take a full, verified backup of every device you are bringing, stored at home or in trusted cloud storage, so loss or seizure of the device costs you nothing but hardware
- [ ] Enable full disk encryption and verify it is active before departure (FileVault, BitLocker, or LUKS; iOS and modern Android encrypt by default when a passcode is set)
- [ ] Set fresh, strong device passcodes before the trip (alphanumeric on phones, not 4-6 digit PINs) — do not reuse your everyday passcodes
- [ ] Enable iOS Lockdown Mode, or use a hardened Android profile (GrapheneOS recommended for high-risk travelers)
- [ ] Disable biometric unlock before any border crossing — in many jurisdictions you can be compelled to provide a fingerprint or face far more easily than a memorized passcode
- [ ] Use your password manager's travel-safe features (e.g. 1Password Travel Mode) to remove sensitive vaults from carried devices

### Keys, Signing & Team Coordination
- [ ] Adjust multisig participation so you are not quorum-critical while traveling — raise thresholds or rotate in a backup signer so that your compromise (or coercion) cannot move funds
- [ ] Notify your team of travel dates, destinations, and expected reachability; designate a backup signer for any scheduled transactions
- [ ] Agree on an out-of-band verification phrase or channel with your team in case someone impersonates you ("I'm stuck abroad, urgent transfer needed" is a classic scam)

### Destination Research
- [ ] Research the device-search and key-disclosure laws of your destination and every transit country (some jurisdictions can legally compel passwords or deny entry for refusal)
- [ ] Check travel advisories for kidnapping, express-robbery, or crypto-targeted crime trends at the destination — "express kidnappings" that march victims through app-based transfers are a documented pattern against crypto holders
- [ ] Plan connectivity in advance: a roaming eSIM or local data plan purchased from a reputable provider, so you are never forced onto public Wi-Fi for lack of options
- [ ] Note the local emergency numbers and the nearest embassy/consulate before departure
- [ ] Download offline maps for your destination so navigation does not depend on untrusted networks

---

## Border Crossings

- [ ] Power devices fully OFF before reaching any border checkpoint (a cold-booted, encrypted device is in its most protected state; keys are not resident in memory)
- [ ] Carry devices with a minimal social and app footprint — remove or sign out of crypto Twitter/X, Discord, Telegram groups, and portfolio trackers that advertise what you hold or who you work for
- [ ] Never carry seed phrases across a border in any form — not on paper, not on metal plates, not photographed, not in notes apps
- [ ] Prepare and rehearse a calm response to a device-search request before you fly:
	- [ ] Know whether you will comply, and what the legal consequences of refusal are for your citizenship status in that jurisdiction
	- [ ] If a device is taken out of your sight by border agents, treat it as compromised from that moment: record what happened, and report it to your team before using the device again
- [ ] Do not lie to border officials — minimize what you carry so there is nothing that requires explanation
- [ ] Sign out of cloud accounts you don't need in-country; a border search of a signed-in device is a search of your entire cloud
- [ ] Keep a printed copy of essential contacts (team security contact, embassy, lawyer) in case all devices are seized

---

## While Traveling

### Networks & Operations
- [ ] Never perform sensitive operations (signing, exchanges, email, admin panels) on public or hotel Wi-Fi without a trusted VPN (Mullvad or Proton VPN recommended); prefer your own cellular hotspot
- [ ] Disable auto-join for Wi-Fi networks and keep Bluetooth off when not in use
- [ ] Do not plug into public USB charging ports — carry your own charger and a power bank, or use a USB data blocker
- [ ] Defer non-urgent sensitive operations entirely: the best travel policy for treasury actions is "it waits until I'm home"

### Physical Custody
- [ ] Keep devices on your person or in your direct line of sight; a device left unattended — even briefly — should be treated as potentially tampered with
- [ ] Use privacy screens on laptops and phones in airports, trains, and cafés — shoulder-surfing a passcode is a standard prelude to phone snatching
- [ ] Understand hotel safe limitations: staff and master codes can open them — a safe deters opportunists, not targeted attackers. Prefer carrying critical items or using tamper-evident bags
- [ ] Put a tracker (AirTag or equivalent) in checked bags and laptop bags so theft is detected quickly
- [ ] Lock screens the moment you step away, every time, even "just for a second"
- [ ] Be alert to phone-snatch patterns: don't use your phone near curbs or station exits with the screen unlocked, and enable iOS Stolen Device Protection / Android Theft Detection Lock before the trip

### Conference-Specific
- [ ] Never insert unknown USB drives, cables, or accept "free" hardware wallets or swag electronics
- [ ] Do not scan untrusted QR codes — QR-initiated wallet connections and payment requests are a common conference attack vector
- [ ] Be aware of badge scanning and lead-capture apps: your name, employer, and role get harvested and resold, feeding spear-phishing lists
- [ ] Do not discuss holdings, treasury sizes, or signing authority in public spaces or side events — assume conversations are overheard
- [ ] Never hand over or leave an unlocked device at parties or afterparties; drink-assisted device theft is a known pattern at crypto events
- [ ] Be cautious with real-time location posts ("at booth X all day") — announce where you were, not where you are

---

## After You Return

- [ ] Treat all travel devices as suspect until wiped and reprovisioned — do not reconnect a travel laptop to your home or work network for sensitive operations without a clean reinstall
- [ ] Rotate every credential used while traveling (accounts logged into, VPN passwords, any password typed in a public space)
	- [ ] Revoke active sessions on those accounts too — a stolen session token survives a password change if you don't sign out other devices
- [ ] Restore multisig thresholds and signer sets to their normal configuration, and confirm the change with your team
- [ ] Notify your team you are back, so "urgent request from a traveling teammate" pretexts stop being plausible
- [ ] Review account activity and sign-in logs (Google, GitHub, exchange accounts, email) for the entire travel window and flag anything unfamiliar
- [ ] Inspect hardware you traveled with for tampering (unexpected screws, seals, weight, or behavior) before using it for anything sensitive
- [ ] If any device was seized, searched out of your sight, lost, or behaves oddly: invoke your organization's key compromise protocol immediately rather than waiting for proof
