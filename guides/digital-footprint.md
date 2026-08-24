<!--
id: digital-footprint-individual-guide
type: GUIDE
scope: INDIVIDUAL
-->

<div align="center">
  <h1>Digital Footprint Checklist</h1>
  <p><em>Counter-OSINT and doxxing prevention for founders, signers, and team members</em></p>
</div>

---

## Overview

Every wrench attack and every convincing spear-phish starts with reconnaissance. Attackers assemble your home address, family members, daily routine, employer, and on-chain wealth from data brokers, breach dumps, old forum posts, and blockchain explorers — then decide whether you are worth targeting. For founders and multisig signers, footprint reduction is not vanity privacy: it directly shrinks your exposure to physical coercion (see the Physical Security & Duress guide) and targeted phishing.

This checklist draws on Digibastion's OSINT/footprint items and OfficerCIA's counter-OSINT research. The workflow is a loop: map what an attacker can find, reduce it, then maintain the reduced state — because data brokers repopulate and every new account leaks a little more.

---

## Map Your Exposure

Run recon on yourself before an attacker does. Do this from a clean browser profile or VPN so personalization doesn't hide results.

- [ ] Self-OSINT your identity: search your full name, all handles, email addresses, and phone numbers on Google/Bing/DuckDuckGo, including in quotes and combined with your city and employer
	- [ ] Check username reuse across platforms with tools like WhatsMyName or Sherlock — a reused handle is the thread that unravels pseudonyms
- [ ] Check breach corpora: run every email address and phone number through Have I Been Pwned (haveibeenpwned.com), and assume any password or address in a breach is permanently public
	- [ ] Pay special attention to crypto-specific breaches (e.g. the Ledger customer database) that leaked names, home addresses, and phone numbers of hardware wallet buyers
- [ ] Search data-broker/people-search sites (Whitepages, Spokeo, BeenVerified, and their many clones) for your name — note every listing that shows your address, relatives, or phone
- [ ] Run your face through a face-search engine (PimEyes) to see which photos of you are findable, and request removal where supported
- [ ] Map on-chain linkability: for each address you use, trace what connects it to your identity — ENS names, NFT profile pictures, donation posts, CEX deposits, public grant payouts — using a block explorer or tools like Arkham/Nansen the way an attacker would
- [ ] Review old forum, Reddit, Discord, and social posts for leaked details: photos of your home or neighborhood, hardware wallet purchases, holdings brags, travel patterns, family names
	- [ ] Include the Wayback Machine and Google cache — deleting a post does not delete its archives, but you need to know what's there
- [ ] Check developer-surface leaks: GitHub commit emails (`git log` on your public repos reveals every address you've committed with), gravatar hashes, npm/PyPI package metadata, and conference speaker bios
- [ ] Check public-record leaks specific to your situation: company registries listing your home address as a director, domain registrations, property records, court filings, and political donation databases
- [ ] Reverse-image-search your profile photos to find accounts you forgot you had
- [ ] Have a trusted teammate or a professional service run the same recon on you — you have blind spots about your own history that a fresh set of eyes will not
- [ ] Document everything found in a private note — this becomes your removal worklist and your baseline for future checks
- [ ] Rank findings by wrench-attack relevance: home address + wealth signal + routine information is the critical triad; everything else is secondary

---

## Reduce It

- [ ] Use a data-removal service (DeleteMe, Kanary, Optery, or similar) to continuously purge data-broker listings — or work through manual opt-out lists (e.g. Yael Grauer's Big Ass Data Broker Opt-Out List) if you prefer not to hand a service your data
	- [ ] Prioritize the brokers that showed your current home address and relatives in your self-OSINT — those listings are the wrench-attack shopping catalog
- [ ] Remove your home address from public registries wherever possible:
	- [ ] Domain WHOIS — enable registrar privacy on every domain you own, and check historical WHOIS (attackers use archives) to know what already leaked
	- [ ] Company registrations, voter rolls, and property records where your jurisdiction allows redaction or an agent's address
	- [ ] Use a registered agent, PO box, or virtual mailbox going forward, especially for crypto hardware deliveries
	- [ ] If your address is already burned by a breach (e.g. Ledger's), factor that into your physical security posture — removal can't un-leak it
- [ ] Request deletion of old accounts' data under GDPR/CCPA where applicable, not just account closure — closure often leaves the data resident and breachable
- [ ] Scrub location history from posted content going forward: turn off camera geotagging, delay posts until you've left the location, and avoid photographing identifiable views from home
- [ ] Strip EXIF metadata (GPS coordinates, device IDs) from photos before posting — most platforms strip it on upload, but direct file shares and some forums do not (use exiftool or your OS's built-in removal)
	- [ ] Metadata isn't the only leak: window views, reflections, street furniture, and receipts in photos geolocate homes routinely
- [ ] Separate pseudonymous and legal identities with a hard wall: different emails, different browsers/profiles, different payment methods, no cross-following, no reused avatars or usernames across the wall
	- [ ] Writing style links identities too — long-form posts under both identities on the same topics are attributable by stylometry; keep one side low-volume
- [ ] Use unique per-platform email aliases (SimpleLogin, addy.io, or Fastmail/Proton aliases) so a breach at one service can't be joined against others — and so you know exactly who leaked or sold your address
- [ ] Lock down social platform settings that leak your graph: hide follower lists and phone-number discoverability (Telegram, Signal, WhatsApp, X), disable "people you may know"-style contact syncing, and never upload your contacts
- [ ] Tighten LinkedIn specifically: it is the primary spear-phishing reconnaissance tool — trim role details that advertise treasury or infrastructure access, and restrict profile visibility to your network
- [ ] Use a dedicated phone number (VoIP or secondary line) for public-facing signups so your real number — the one anchoring 2FA and Signal — never enters marketing databases
- [ ] Review calendar, document, and photo-album sharing settings: publicly shared Google Calendars and "anyone with the link" docs have doxxed schedules and addresses repeatedly
- [ ] Register domains with privacy protection by default, and prefer registrars that don't leak registrant data in transient states
- [ ] Delete or anonymize dormant accounts surfaced in your self-OSINT rather than leaving them as standing exposure
- [ ] Request removal of sensitive personal results from search engines (Google's "Results about you" tool automates monitoring and removal requests for addresses and phone numbers)

---

## On-Chain Privacy

- [ ] Maintain strictly separate doxxed and private address sets: the address on your conference badge, ENS, or X profile must never touch your main holdings, and should hold only a plausible public-facing balance
	- [ ] Never transact directly between the two sets — one transfer collapses the separation permanently
	- [ ] Keep a written map of which addresses belong to which identity tier, so a tired late-night transaction doesn't cross the wall by accident
- [ ] Avoid ENS or other name-service records pointing at treasury or personal main wallets — a human-readable name on a large balance is a targeting beacon that links wealth to identity in one lookup
- [ ] Use fresh addresses for public donations, grants, airdrops, and anything posted publicly; consolidate later only with care (naive consolidation re-links everything)
- [ ] Treat payroll and vendor payments as linkage events: an employer or DAO paying your "private" address publishes the association on-chain for anyone who identifies the payer
- [ ] Be careful with CEX withdrawals: exchange accounts are KYC'd to your legal identity, and withdrawing from a CEX directly to a "private" address links that identity to the address in exchange records (and to chain analysts observing known hot wallets)
	- [ ] Assume the exchange's view of your withdrawal addresses is itself breachable data, held forever
- [ ] Assume all on-chain activity is permanent and retroactively analyzable — a link you create today can be discovered by better tooling years from now
- [ ] Review token approvals and on-chain social profiles (Lens, Farcaster verifications, POAPs) for identity linkage you didn't intend — event POAPs in particular place you at physical locations on specific dates
- [ ] Watch for dusting and NFT-airdrop tagging on private addresses: interacting with unsolicited tokens can link or poison an address set, so ignore them entirely

---

## Maintain It

- [ ] Repeat the self-OSINT sweep quarterly — data brokers repopulate listings within months, and new breaches surface continuously
	- [ ] Calendar it like a dependency audit; footprint hygiene done once decays to zero within a year
- [ ] Set Google Alerts (or Talkwalker) on your name, home address, and primary handles to catch new exposure as it appears
- [ ] Monitor your pseudonymous handles too — an alert on your pseudonym plus your real name in the same result is the earliest warning that the wall has been breached
- [ ] Subscribe to Have I Been Pwned notifications for all your email addresses and aliases
	- [ ] Enable HIBP domain monitoring if you own personal domains, so alias addresses are covered automatically
- [ ] Watch your on-chain public addresses with an explorer alert or portfolio watcher so unexpected inbound dust or tagging attempts are noticed early
- [ ] Keep your data-removal service subscription active, or re-run manual opt-outs on the same quarterly cadence — brokers relist removed records
- [ ] Review family exposure at the same cadence: spouses' and children's public profiles, school listings, and social posts routinely undo a founder's own footprint work
- [ ] Re-check your on-chain linkage map after any public payment, donation, or new ENS/social verification
- [ ] Audit what your own posts leak before publishing: photos (backgrounds, reflections), real-time locations, new hardware purchases, and team/role announcements that map signing authority
- [ ] Treat every new account, conference registration, and delivery as a footprint decision: default to aliases, agents' addresses, and pseudonyms unless there is a reason not to
- [ ] After any incident (doxxing attempt, targeted phish referencing personal details), work backwards to find which data source enabled it and close that source for the whole team
