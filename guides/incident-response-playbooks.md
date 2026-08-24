<!--
id: incident-response-playbooks-organization-guide
type: GUIDE
scope: ORGANIZATION
-->

# Incident Response Playbooks

## Overview

This is the W3OS Incident Response Playbook Pack: seven scenario-specific runbooks with fill-in templates that your team executes when an incident is live. It complements the [Incident Response Readiness Guide](./incident-response-readiness.md), which covers the preparation layer (monitoring, alerting, backups, and response planning principles) - readiness makes these playbooks executable, and these playbooks turn readiness into concrete action. Print or mirror this document somewhere accessible even if your primary infrastructure is down.

---

## Runbook: Key or Signer Compromise

A private key, seed phrase, or hardware wallet belonging to a signer is exposed, stolen, or suspected compromised (including seed phrases photographed, typed into a phishing site, or stored digitally).

**Detection signals**
- Unexpected outbound transaction from a signer EOA or an unrecognized approval/signature in wallet history
- Signer reports phishing interaction, lost/stolen device, malware detection, or accidental digital exposure of a seed phrase
- Monitoring alert (e.g. Safe Watcher, Forta, Tenderly alerts) on an address owned by a quorum member
- Approvals to unknown spenders visible on [revoke.cash](https://revoke.cash/) for the affected address

**First 15 minutes**
- [ ] Declare the incident, open the Incident Log (template below), and assign an Incident Commander (IC)
- [ ] Treat the key as fully compromised - do not wait for confirmation
- [ ] Freeze all pending multisig transactions: no signing or execution until the quorum is verified clean
- [ ] Identify every wallet, multisig, and contract role (owner, pauser, upgrader) the compromised key touches
- [ ] If funds sit on the compromised EOA, begin immediate migration to a clean, pre-provisioned address - speed beats ceremony here
- [ ] Contact [SEAL 911](https://securityalliance.org/) via Telegram bot @seal_911_bot if theft is in progress or imminent

**Containment**
- [ ] Remove the compromised signer from every multisig via an owner-swap transaction signed by the remaining clean quorum (Safe: `removeOwner`/`swapOwner`), lowering the threshold temporarily only if required and restoring it immediately after
- [ ] Revoke all token approvals granted by the compromised address using [revoke.cash](https://revoke.cash/)
- [ ] Pause protocol contracts if the key held a pauser/guardian role and abuse is plausible
- [ ] Revoke the signer's access to the multisig coordination platform, password manager, and signing-related infrastructure until their environment is re-provisioned
- [ ] Quarantine the affected device(s) for forensics - do not wipe before imaging

**Recovery**
- [ ] Re-provision the affected signer with a new hardware wallet (purchased direct from manufacturer) and freshly generated keys per the [Multi-Sig Ideal Setup Guide](./multisig-ideal-setup.md)
- [ ] Add the new signer address back to quorums only after their full environment (laptop, phone, password manager) is verified or rebuilt
- [ ] Verify integrity of all remaining signers: confirm each one interactively over a second channel and check their addresses for anomalous activity
- [ ] Determine root cause of exposure (phishing, malware, physical, digital seed storage) and close the gap for all signers, not just the victim
- [ ] Complete the Post-Mortem within 5 business days

**Communications**
- [ ] Notify all signers immediately via the pre-agreed emergency channel (not the possibly-compromised one)
- [ ] If funds were lost or contracts paused, publish a holding statement (template below) within 1 hour on at least two official channels
- [ ] Notify custodians, exchanges, and bridge/DEX front-ends of attacker addresses for blocklisting; report theft to law enforcement and preserve evidence chain-of-custody

---

## Runbook: Multisig Coordination Platform Compromise

The Safe web app, your self-hosted Safe UI, the Safe transaction service, or an equivalent coordination layer is compromised and may be serving malicious transaction payloads (the Bybit/Radiant attack class).

**Detection signals**
- A pending transaction in the queue that no team member remembers proposing
- Hardware wallet display (domain hash, message hash, `to`, `operation`) disagrees with what the UI shows
- Any pending transaction with `operation = 1` (delegateCall) that is not an explicitly expected module interaction
- Safe Watcher / monitoring alert for a new proposal outside your normal proposal process
- Public reports of compromise of your coordination platform or its CDN/dependencies

**First 15 minutes**
- [ ] Announce "pause all signing" to every signer on the emergency channel - nobody signs or executes anything until stand-down
- [ ] Open the Incident Log and assign an IC
- [ ] Enumerate the full pending queue via an independent path, not the suspect UI (e.g. Safe transaction service API directly, a block explorer, or a second self-hosted UI)
- [ ] Re-verify every pending transaction by recomputing hashes with [safe-tx-hashes-util](https://github.com/pcaversaccio/safe-tx-hashes-util) and decoding calldata with an independent decoder (e.g. [Swiss Knife](https://calldata.swiss-knife.xyz/decoder))
- [ ] Reject/replace any unrecognized proposal by queuing a same-nonce cancellation transaction (Safe: an empty transaction at the same nonce) - verify the cancellation's hash on hardware wallets before signing

**Containment**
- [ ] Identify which signers already signed the malicious proposal; treat their signing environments as potentially compromised
- [ ] Take the compromised UI/host offline; if self-hosted, isolate the server and preserve disk/images for forensics
- [ ] Rotate credentials and API keys for the coordination platform and its hosting/CDN accounts
- [ ] If any signer executed or signed a malicious payload, fork into the Key or Signer Compromise runbook in parallel
- [ ] Check every Safe for unexpected owner changes, threshold changes, enabled modules, or changed fallback handlers (Safe UI "Settings", or `getOwners`/`getModulesPaginated` via explorer)

**Recovery**
- [ ] Rebuild the coordination UI from a verified clean source (pinned commit of [safe-wallet-monorepo](https://github.com/safe-global/safe-wallet-monorepo)) on fresh infrastructure
- [ ] Re-verify all Safe configuration on-chain (owners, threshold, modules, guard, fallback handler) against your documented baseline before resuming operations
- [ ] Resume signing only after IC declares stand-down, starting with a low-value test transaction verified end-to-end on hardware wallet screens
- [ ] Add or tighten controls that would have caught this: hash verification as a mandatory signing step, delegateCall alerts, timelock/veto module (e.g. Zodiac Delay)
- [ ] Complete the Post-Mortem

**Communications**
- [ ] Notify all signers and finance/ops stakeholders that signing is frozen and why
- [ ] If the compromised platform is third-party (e.g. Safe itself), report to their security team and to SEAL 911 with IOCs (malicious payloads, addresses, injected script URLs) so other teams can be warned
- [ ] If any transaction executed, publish a holding statement within 1 hour and follow the status update cadence

---

## Runbook: DNS Hijack / Domain Takeover

Your domain's DNS records are altered at the registrar or DNS provider, redirecting users to an attacker-controlled clone (the Curve/Galxe attack class).

**Detection signals**
- DNS monitoring alert: A/AAAA/CNAME records for your domain resolve to unrecognized IPs
- Users report certificate warnings, wallet-drain prompts, or a subtly different site
- Registrar/DNS provider account notifications: password reset emails, transfer-out requests, nameserver changes you did not initiate
- Certificate Transparency log alert for a certificate issued for your domain that you did not request (monitor via [crt.sh](https://crt.sh/) or CT alerting)

**First 15 minutes**
- [ ] Open the Incident Log and assign an IC
- [ ] Confirm the hijack from multiple vantage points: `dig +short yourdomain.xyz @1.1.1.1` and `@8.8.8.8`, plus an external checker - compare against your known-good records
- [ ] Log in to registrar and DNS provider directly (bookmarked URL, never via email links); if locked out, immediately call the registrar's emergency/abuse line and start account recovery
- [ ] Warn users NOW on at least two channels you still control (X, Discord, status page): "Do not use the site, do not sign anything" - do not wait for full confirmation
- [ ] Contact SEAL 911 and submit the hijacked domain to [ChainPatrol](https://chainpatrol.io/) and Google Safe Browsing ([safebrowsing.google.com/safebrowsing/report_phish/](https://safebrowsing.google.com/safebrowsing/report_phish/))

**Containment**
- [ ] Restore correct DNS records; expect propagation delay bounded by the attacker-set TTL - if records were changed with a high TTL, note that users may see poisoned answers until it expires
- [ ] Lock the account: rotate registrar/DNS passwords, revoke all sessions and API keys, re-enroll 2FA on hardware keys, remove unknown delegate users
- [ ] Enable registrar lock (`clientTransferProhibited` at minimum; request registry lock / `serverTransferProhibited` from the registrar for high-value domains)
- [ ] Verify no attacker persistence: check for added DNS records (extra TXT/MX for mail interception, wildcard records), changed nameservers, pending transfer authorizations, and modified contact emails
- [ ] Revoke any TLS certificates the attacker obtained and check CT logs for others

**Recovery**
- [ ] Set sane TTLs going forward (300-3600s on A/AAAA records) so future incidents recover quickly
- [ ] Enable DNSSEC if the registrar and DNS provider support it
- [ ] Move the domain to a security-focused registrar with registry lock support (e.g. Cloudflare Registrar, MarkMonitor, CSC) if the current one failed you
- [ ] Determine how the account fell (SIM swap, phishing, registrar support-channel social engineering, credential stuffing) and remediate
- [ ] Set up continuous DNS and CT-log monitoring with alerts if not already in place
- [ ] Complete the Post-Mortem

**Communications**
- [ ] Maintain user warnings until DNS is verified restored globally; then publish an explicit all-clear with guidance
- [ ] Tell affected users to check and revoke approvals at [revoke.cash](https://revoke.cash/) and report drained wallets
- [ ] Publish a timeline (hijack start, containment, guidance for users who visited in the window) and file reports with the registrar's abuse team and law enforcement

---

## Runbook: Frontend Compromise

Your dApp frontend is serving malicious JavaScript (via hosting compromise, CDN poisoning, or a hostile deploy) that prompts users to sign wallet-draining transactions, while DNS remains intact.

**Detection signals**
- Users report unexpected signature requests, changed transaction targets, or drainer-style "claim/verify" prompts
- Frontend integrity monitoring detects changed bundle hashes or unexpected external script domains
- Hosting/CDN audit logs show an unrecognized deploy, changed build settings, or new team member
- On-chain monitoring shows user funds flowing from your users to a common attacker address shortly after site interaction

**First 15 minutes**
- [ ] Open the Incident Log and assign an IC
- [ ] Take the frontend down immediately - a 503 or maintenance page is strictly better than a live drainer. Replace the site with a static warning page if possible
- [ ] Warn users on at least two independent channels (e.g. X + Discord announcement) with explicit instructions: do not connect, do not sign; if you signed, disconnect and revoke approvals at [revoke.cash](https://revoke.cash/)
- [ ] Capture evidence before purging: save the malicious bundle, injected script URLs, and drainer addresses (curl the page from a clean machine, archive to web.archive.org)
- [ ] Contact SEAL 911 with the drainer addresses for tracing and exchange blocklisting

**Containment**
- [ ] Purge the CDN cache completely after the malicious content is removed (Cloudflare: Caching → Purge Everything; or provider equivalent) so no edge node keeps serving the payload
- [ ] Freeze all deploys and revoke deploy tokens/credentials for hosting (Vercel/Netlify/Cloudflare Pages), CI, and any bot accounts
- [ ] Identify the injection vector: hosting account takeover, compromised npm dependency, poisoned third-party script/analytics tag, or malicious commit - fork into the Dependency / Build Pipeline runbook if it is a supply-chain vector
- [ ] Remove unknown collaborators and rotate all secrets on the hosting platform; re-enroll 2FA with hardware keys
- [ ] Report drainer addresses to [ChainPatrol](https://chainpatrol.io/), wallet security providers (Blockaid, Blowfish), and Etherscan for tagging

**Recovery**
- [ ] Rebuild and redeploy from a verified clean commit on clean infrastructure; diff the deployed bundle against a local reproducible build before going live
- [ ] Add Subresource Integrity (SRI) attributes for third-party scripts and a strict Content-Security-Policy limiting script sources
- [ ] Add deploy protections: required review on production deploys, deploy notifications to a monitored channel, and frontend integrity monitoring
- [ ] Restore the site and announce the all-clear only after independent verification from multiple networks/devices
- [ ] Complete the Post-Mortem, including the estimated user-impact window

**Communications**
- [ ] Keep the warning pinned on both channels for the full duration; update on the status cadence (template below)
- [ ] Publish the exact impact window ("site was malicious between T1 and T2 UTC") so users know if they are affected
- [ ] Provide a step-by-step remediation guide for affected users (revoke approvals, move assets from exposed wallets to fresh ones), and coordinate a joint statement if third-party infrastructure was the vector

---

## Runbook: Social Account Takeover

An official Discord server, X account, Telegram channel/admin, or similar community property is taken over and used to push scam links to your community.

**Detection signals**
- Posts/announcements you did not make, especially "surprise mint", "airdrop claim", or "urgent migration" links
- Admin/moderator reports of lost access, changed passwords, or unfamiliar sessions
- Platform notifications: password/email changed, new login from unknown location, 2FA removed
- Community members reporting drained wallets after clicking an "official" link; new webhooks, bots, or integrations appearing in the Discord audit log

**First 15 minutes**
- [ ] Open the Incident Log and assign an IC
- [ ] Warn the community from every account you still control, naming the compromised account explicitly: "Our X is compromised - do not click any links from it"
- [ ] Attempt recovery on the compromised account: force password reset, terminate all sessions, remove attacker 2FA if you still have partial access
- [ ] Discord: if any admin retains access, revoke the malicious admin's roles, delete malicious webhooks/bots, enable server-wide pause on invites and set verification level to Highest; delete scam announcements
- [ ] Submit scam URLs to [ChainPatrol](https://chainpatrol.io/), Google Safe Browsing, and SEAL 911

**Containment**
- [ ] Escalate via platform emergency paths: X - report via [help.twitter.com/forms/account-access](https://help.twitter.com/en/forms) (hacked account form); Discord - Trust & Safety report plus your Discord partner/developer contact if you have one; Telegram - @notoscam and volunteer support, recover via linked devices
- [ ] Use any warm contacts (investor intros, SEAL community, partner networks) to accelerate platform escalation - direct human contact beats ticket queues
- [ ] Audit all other social accounts for the same vector (shared passwords, same compromised admin device or email) and rotate credentials everywhere
- [ ] Check the compromised admin's endpoint for malware (session-token theft is the most common X/Discord vector) - quarantine the device
- [ ] Remove all third-party app authorizations and connected apps on the recovered accounts

**Recovery**
- [ ] Restore account access; rotate to unique strong passwords in the team password manager and hardware-key 2FA (disable SMS 2FA everywhere)
- [ ] Rebuild Discord permission hygiene: least-privilege roles, no dormant admin accounts, audit log review, disable @everyone pings for non-admins
- [ ] Move account credentials to shared vault ownership so no account depends on a single person's email/phone, and record the platform escalation contacts that actually worked in your emergency contact list
- [ ] Complete the Post-Mortem

**Communications**
- [ ] Announce the compromise and the all-clear from the recovered account itself plus one other channel, so users can cross-verify
- [ ] Publish a list of exactly what the attacker posted (screenshots) and state clearly that all of it is fraudulent
- [ ] Direct affected users to revoke approvals ([revoke.cash](https://revoke.cash/)) and report losses; collect drainer addresses for blocklisting
- [ ] Remind the community of your policy: you never DM first, never run surprise mints, and announcements always appear on at least two channels

---

## Runbook: Dependency / Build Pipeline Attack

A dependency you consume is compromised (malicious npm/PyPI release), or your CI/CD pipeline itself is breached and producing tampered artifacts.

**Detection signals**
- Public advisory or SEAL/community alert for a package in your dependency tree
- CI audit logs show workflow runs, secret accesses, or artifact publishes you cannot attribute
- Build outputs differ from local reproducible builds; unexpected postinstall scripts or network calls during builds
- New or modified GitHub Actions workflows, deploy keys, PATs, or webhooks that nobody added
- Dependabot/socket.dev/npm audit flags a newly published malicious version within your ranges

**First 15 minutes**
- [ ] Open the Incident Log and assign an IC
- [ ] Freeze all deploys and releases: disable auto-deploy on merge, pause CI pipelines (GitHub: disable Actions on affected repos), and announce the freeze to engineering
- [ ] Identify the blast radius: `npm ls <package>` / lockfile search across all repos to find affected versions and which artifacts shipped with them
- [ ] Pin or roll back to the last known-good dependency versions in lockfiles; do not run installs on developer machines against the poisoned range in the meantime
- [ ] If your published artifacts (site bundle, SDK, contracts tooling) may already be tampered, fork into the Frontend Compromise runbook for user-facing impact

**Containment**
- [ ] Rotate ALL CI/CD secrets: cloud credentials, deploy tokens, npm tokens, signing keys, PATs - assume anything exposed to a compromised build step is stolen
- [ ] Audit recent artifacts: rebuild the last N releases from clean source and diff against what was published/deployed; yank or unpublish anything that does not match
- [ ] Review CI audit logs for the exposure window: workflow changes, secret access, artifact uploads, new self-hosted runners
- [ ] Revoke and reissue any code-signing or package-publishing credentials; check npm/registry accounts for unauthorized publishes of YOUR packages
- [ ] Check developer machines that installed the malicious version (postinstall scripts run locally) - treat affected workstations as compromised endpoints, including any that hold wallet keys

**Recovery**
- [ ] Re-enable deploys only from a verified clean pipeline: pinned dependency versions (exact, not ranges), lockfile enforcement, and a clean rebuild of production
- [ ] Add supply-chain controls: `npm ci` with committed lockfiles, dependency review gates, provenance/signature verification, minimal-permission CI tokens (GitHub OIDC over long-lived secrets), and `ignore-scripts` where feasible
- [ ] Subscribe to advisory feeds for your stack and add automated malicious-package scanning (e.g. Socket, Snyk) to CI
- [ ] Verify smart contract deploy artifacts separately: recompiled bytecode must match on-chain deployments if the toolchain was in the blast radius
- [ ] Complete the Post-Mortem

**Communications**
- [ ] Notify engineering and all downstream consumers of your packages/SDKs about affected versions and remediation steps
- [ ] If users could have interacted with tampered artifacts, publish a holding statement with the exposure window on two channels
- [ ] Report the malicious package to the registry (npm security) and the dependency's maintainers; share IOCs (package versions, exfil domains, payload hashes) with SEAL 911 and the community

---

## Runbook: Wallet Drainer Targeting Community

A phishing campaign impersonates your organization - fake sites, lookalike domains, malicious ads, spoofed emails, or fake support DMs - draining your community's wallets. Your infrastructure is NOT compromised.

**Detection signals**
- Community reports of drained wallets after interacting with "your" site or a claimed airdrop
- Lookalike domain registrations surfacing (typosquats, `yourproject-claim.xyz` patterns) via brand monitoring or ChainPatrol alerts
- Malicious sponsored search ads or social ads impersonating your brand
- Fake support accounts DMing users in Discord/Telegram; spoofed emails using your brand
- Sudden spike in "is this real?" questions in community channels

**First 15 minutes**
- [ ] Open the Incident Log and assign an IC (this can be a lighter comms-led response, but still log it)
- [ ] Collect the exact phishing URLs, drainer addresses, ad screenshots, and sender handles from reporters - evidence first, takedowns second
- [ ] Post a warning on at least two official channels with the exact fake URL spelled out (defanged, e.g. `hxxps://`) and a reminder of your real domain
- [ ] Submit the phishing domains to [ChainPatrol](https://chainpatrol.io/) for takedown and cross-platform blocklisting
- [ ] Report to SEAL 911 with drainer addresses so tracing and exchange notifications can start

**Containment**
- [ ] File takedown reports in parallel: registrar abuse contact, hosting provider abuse contact, Google Safe Browsing ([report_phish](https://safebrowsing.google.com/safebrowsing/report_phish/)), Microsoft SmartScreen, and [phish.report](https://phish.report/) to automate the fan-out
- [ ] Report drainer addresses for wallet-level blocking: Blockaid, Blowfish, MetaMask (eth-phishing-detect), and Etherscan address tagging
- [ ] Report malicious ads through the ad network's reporting flow (Google Ads: "Report this ad"); flag fake social accounts for impersonation on each platform
- [ ] Ban and report fake support accounts in your Discord/Telegram; enable anti-phishing bots and link filtering if not present
- [ ] Track every reported domain in the Incident Log - drainer crews rotate domains, so expect new ones for days

**Recovery**
- [ ] Set up ongoing brand/typosquat monitoring (ChainPatrol, registrar watch services, CT log alerts for your brand string)
- [ ] Defensively register the most obvious typosquat domains and high-risk TLD variants of your brand
- [ ] Add permanent anti-phishing UX: your real domain pinned in every social bio, "we never DM first" messaging, and a `/verify` or official-links page users can cross-check
- [ ] Publish SPF, DKIM, and DMARC (p=reject) records so spoofed email from your domain fails
- [ ] Complete a lightweight Post-Mortem focused on detection latency and takedown time

**Communications**
- [ ] Maintain a pinned, continuously updated warning listing known fake domains/accounts for the duration of the campaign
- [ ] Give affected users concrete steps: revoke approvals at [revoke.cash](https://revoke.cash/), migrate remaining assets to a fresh wallet, report to law enforcement / IC3
- [ ] Ask the community to report new fakes to a single channel or form, and after the campaign subsides publish a short recap: what the scam looked like, how to verify official links, total domains taken down

---

## Templates

Copy these into your incident channel or docs at the start of every incident and drill.

### Incident Log

```text
INCIDENT LOG
============
Incident ID:        INC-YYYYMMDD-##
Runbook invoked:    (Key Compromise / Platform Compromise / DNS / Frontend / Social ATO / Supply Chain / Community Drainer)
Severity:           SEV-1 (funds at risk now) / SEV-2 (exposure, no active loss) / SEV-3 (contained threat)
Declared at (UTC):
Incident Commander:
Scribe:
Comms Lead:

TIMELINE (append-only, all times UTC)
-------------------------------------
HH:MM | who | what happened / what was done / decision + rationale
HH:MM |     |

TRACKING
--------
Affected assets/accounts:
Attacker addresses/domains (IOCs):
Actions pending:            (owner -> action -> deadline)
External parties engaged:   (SEAL 911 / registrar / platform / law enforcement + ticket refs)
Stand-down declared (UTC):  by:
```

### Post-Mortem

```text
POST-MORTEM: INC-YYYYMMDD-##
============================
Owner:                      Due: within 5 business days of stand-down
Status:                     Draft / Reviewed / Actions Tracked

SUMMARY (3-4 sentences, plain language, blameless)

IMPACT
- Funds lost / at risk:
- Users affected + exposure window (UTC):
- Downtime / operational impact:

TIMELINE
- First malicious activity:
- Detected at:              (detection gap: ______)
- Contained at:             (containment gap: ______)
- Fully recovered at:

ROOT CAUSE
- Technical root cause:
- Contributing factors (process, access, monitoring):

WHAT WENT WELL / WHAT WENT POORLY
-
-

ACTION ITEMS (each with owner + deadline, tracked in issue tracker)
1. [prevent recurrence]
2. [detect faster]
3. [respond faster]

RUNBOOK UPDATES REQUIRED
- Which runbook, which step, what change:
```

### Communications Plan

```text
COMMUNICATIONS PLAN: INC-YYYYMMDD-##
====================================
Comms Lead:                 Approver for public statements:

HOLDING STATEMENT (publish within 1 hour of a user-impacting SEV-1/SEV-2)
"We are aware of [issue] affecting [scope]. [Immediate user instruction,
e.g. do not interact with X / no user action needed]. Funds in [unaffected
systems] are not affected. Next update by [time UTC]."
-> Never speculate on cause; never promise reimbursement in early comms.

STATUS UPDATE CADENCE
- SEV-1: every 60 min until contained, then every 4 hours until resolved
- SEV-2: every 4 hours
- SEV-3: at declaration and at resolution
- Always state the time of the next update; post even if the update is
  "no change - still investigating"

STAKEHOLDER MATRIX
| Stakeholder            | Channel                    | Who informs | When              |
|------------------------|----------------------------|-------------|-------------------|
| Internal team          | Emergency channel + pager  | IC          | Immediately       |
| Signers/keyholders     | Verified secondary channel | IC          | Immediately       |
| Community/users        | X + Discord (2 channels)   | Comms Lead  | Within 1 hour     |
| Investors/partners     | Direct (email/TG)          | Founder/CEO | Before public,    |
|                        |                            |             | if feasible       |
| SEAL 911 / responders  | @seal_911_bot (Telegram)   | IC          | ASAP for theft    |
| Law enforcement        | Per jurisdiction / IC3     | Legal       | Within 24-72h     |
| Legal counsel          | Direct                     | IC          | Before public     |
|                        |                            |             | statement (SEV-1) |
```

---

## Drill Program

Runbooks decay without practice. Test them on a schedule and treat drill findings like production bugs.

- [ ] Run one full live-fire drill annually (actually rotate a test signer, actually fail over the frontend, actually execute a same-nonce cancellation on a testnet Safe) with the real on-call team
- [ ] Run a quarterly tabletop exercise: walk one runbook end-to-end against a realistic scenario, with the IC role played by someone who has not led one before
- [ ] Rotate through all seven scenarios so every runbook is exercised at least once every two years, prioritizing the ones tied to your largest holdings
- [ ] Time every drill against the runbook's "First 15 minutes" checklist and record detection-to-containment metrics in the Incident Log template
- [ ] File post-drill improvements as tracked action items with owners and deadlines, and update the affected runbook before the drill is closed out
- [ ] Verify during each drill that the emergency contact list, platform escalation paths, and stakeholder matrix are still current
