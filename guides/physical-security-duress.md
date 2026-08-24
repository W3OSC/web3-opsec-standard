<!--
id: physical-security-duress-individual-guide
type: GUIDE
scope: INDIVIDUAL
-->

<div align="center">
  <h1>Physical Security & Duress Checklist</h1>
  <p><em>Defending against in-person coercion — the "$5 wrench attack"</em></p>
</div>

---

## Overview

No amount of cryptography protects a key whose holder can be threatened in person. The "$5 wrench attack" — skip the crypto, hit the keyholder until they sign — has moved from meme to documented reality: home invasions, kidnappings, and violent robberies targeting founders, traders, and known holders are rising worldwide. This checklist draws on SEAL's Coercion & Duress framework and a16z's personal/physical security guidance.

The defense is layered: make yourself a less attractive target, architect your wallets so that coercion physically cannot yield a large payout, prepare your household, and know exactly what to do if it happens anyway. The goal of the wallet architecture section is to make "rob this person at gunpoint" a provably low-value strategy — and to make that fact survivable to explain under stress.

---

## Reduce Your Attractiveness as a Target

- [ ] Never disclose holdings, portfolio performance, or treasury access publicly or socially — not on X/Twitter, not at dinner parties, not to extended family
	- [ ] This includes indirect disclosure: screenshots with balances visible, "since 2013" flexing, or being publicly identified as a multisig signer for a large treasury
- [ ] Do not wear crypto merch, use crypto bumper stickers/license plates, or otherwise physically advertise involvement in the industry — especially while traveling
- [ ] Practice home address hygiene:
	- [ ] Never post photos that reveal your home's exterior, street, or identifiable landmarks
	- [ ] Keep your address out of conference registrations, shipping records for crypto hardware, and public company filings where legally possible
- [ ] Use an LLC, registered agent, or PO box / virtual mailbox for deliveries and public records — especially hardware wallet purchases, which have leaked customer addresses in past breaches (e.g. the Ledger customer data breach)
- [ ] Review what breach data exposes about your home: search your name and known emails in breach corpora and data-broker sites, and pursue removal (see the Digital Footprint guide)
- [ ] Be discreet with lifestyle signaling (cars, watches, real-time location posts) that correlates you with liquid wealth
- [ ] Keep your on-chain wealth unlinkable to your legal identity and address — ENS names and doxxed addresses on large balances are targeting beacons (see the Digital Footprint guide's on-chain privacy section)

---

## Wallet Architecture Against Coercion

Design so that no attacker standing in your living room can profit meaningfully, no matter what you sign.

- [ ] Ensure no single device — and no single person, including you — can move significant funds:
	- [ ] Hold significant assets in a multisig (e.g. Safe) with signers who are geographically separate and cannot be physically coerced in one location
	- [ ] Ensure you personally are below quorum: your keys alone, under coercion, must be insufficient
	- [ ] Co-signers must verify large or unusual requests out-of-band with a liveness check — a signer under duress will "urgently" request signatures; slow verification is the feature, not the bug
- [ ] Use timelocks or withdrawal delays that cannot be bypassed under duress — a 24-72 hour on-chain delay converts a robbery into a hostage situation the attacker cannot sustain, and buys time for team freeze procedures
	- [ ] Options include on-chain timelock modules on a Safe, exchange withdrawal delays with allowlisted addresses, and custody providers with mandatory review windows
	- [ ] The delay must be genuinely non-bypassable by you — an "emergency override" you know exists is one the attacker can extract
- [ ] Maintain a decoy/duress wallet: a real, functioning wallet with a modest but plausible balance you can surrender convincingly
	- [ ] It should have transaction history and a believable balance — an empty wallet endangers you by signaling deception
	- [ ] Hardware wallet passphrase features (BIP39 passphrase / "hidden wallet") can present a decoy wallet on the same device
	- [ ] Size the decoy to your visible profile: an attacker who researched you expects a balance consistent with what your footprint advertises — another reason to keep that footprint small
- [ ] Carry only a daily-limit hot wallet on your person or phone — an amount you can afford to lose instantly and hand over without hesitation
- [ ] Never keep seed phrases, hardware wallets, and their backups all at home where a single home invasion captures everything
	- [ ] Distribute backups across geographically separate secure locations (bank safe deposit box, trusted family member in another city, professional custody)
- [ ] Avoid "brain-provable" custody stories: if you can be forced to reconstruct full access from memory and items in your house, redesign until you can't
- [ ] Periodically test that the timelock/multisig story holds: walk through what an attacker could actually extract from you alone in 24 hours, and close whatever gap you find

---

## Family & Household

- [ ] Brief family members on social engineering and doxxing:
	- [ ] They should never confirm your travel schedule, employer, holdings, or home details to callers or online contacts
	- [ ] Establish a family code word to authenticate genuine emergency calls and defeat voice-clone "kidnapping" scams
	- [ ] Brief them before they need it: attackers target the least-prepared household member, not you
- [ ] Implement home security basics: solid locks, exterior cameras/video doorbell, alarm system, lighting, and a plan for answering the door to unexpected visitors
	- [ ] Never open the door for unexpected "deliveries," "utility workers," or "police" without independent verification — impersonation is the standard entry method in crypto home invasions
- [ ] High-profile individuals should vary school runs, commutes, and gym routines, and avoid real-time location sharing (disable "live" location posts; post trips after returning)
- [ ] Ensure family members lock their own social profiles — attackers routinely map targets through spouses' and children's public accounts
- [ ] Decide in advance what family members should do during an incident: comply, do not resist, and use the code word or silent alarm only if safe
- [ ] High-net-worth individuals should consider a professional residential security assessment and, where appropriate, kidnap & ransom (K&R) insurance

---

## If It Happens

Rehearse this mentally in advance. Under adrenaline you will only do what you have already decided.

- [ ] Comply. Money is not worth your life — no balance justifies resisting an armed attacker
- [ ] Give the duress wallet: hand over the decoy/daily-limit wallet calmly and completely; do not volunteer the existence of other wallets
- [ ] Stay calm and cooperative in demeanor: attackers escalate on perceived resistance or tricks, and de-escalate when extraction is going "smoothly"
- [ ] Note what you can safely observe (faces, voices, vehicles, what they knew about you — their knowledge reveals the reconnaissance source) for the report afterward
- [ ] If pressed about larger funds, explain truthfully that they are behind a multisig/timelock you cannot unilaterally move — this is exactly why the architecture above must be real, not a bluff
- [ ] Activate any silent alarm, duress PIN, or check-in protocol you have configured, only if it is safe to do so
- [ ] Do not attempt heroics, stalling tricks, or fake wallets you can't back up under pressure — a discovered deception escalates violence
- [ ] Report immediately after the incident: law enforcement first, then your team
	- [ ] Preserve evidence: do not wipe devices or delete messages before law enforcement and your incident response process have what they need
- [ ] Trigger your organization's emergency freeze procedures (SP-FC-015) and key compromise protocol — every key you hold must be treated as compromised and rotated, even if you "only" surrendered the decoy
- [ ] Arrange support afterward: physical attacks are traumatic, and pretending otherwise leads to poor security decisions in the following weeks

---

## Check-In Protocols

- [ ] Establish scheduled check-ins for high-value signers before and after large transactions or signing ceremonies (a Signal message to a designated teammate at agreed times)
- [ ] Define missed-check-in escalation in advance: who gets alerted, after how long, and what they do (attempt contact, pause pending transactions, trigger freeze via SP-FC-015, contact authorities)
- [ ] Use a distress signal distinct from the all-clear — a phrase or emoji that reads as normal to an onlooker but signals coercion to your team
	- [ ] Critically: the absence of the all-clear must itself trigger escalation, so an attacker who confiscates your phone gains nothing by blocking the message
- [ ] Extend check-ins to solo travel and in-person meetings with unknown parties (OTC trades and "investor meetings" have been used as kidnapping lures)
- [ ] Test the protocol periodically so the escalation path actually works when it matters — including at least one unannounced missed-check-in drill
