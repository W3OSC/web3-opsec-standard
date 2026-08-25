<!--
id: job-scam-defense-individual-guide
type: GUIDE
scope: INDIVIDUAL
-->

# Job Scam & Fake Recruiter Defense

*Protecting yourself from malicious recruiters, poisoned "coding challenges", and interview-platform malware*

Complements the Personal Security Checklist and the Incident Response Readiness Guide. Applies the file-handling controls of **SP-EP-010** (Secure External File Interaction) to recruiter-supplied content.

---

## Overview

The hiring pipeline runs both ways: while organizations vet candidates, attackers pose as recruiters to compromise **you**. North Korea's Lazarus Group runs the ongoing "Contagious Interview" campaign - fake recruiters lure developers into running trojanized coding challenges and npm packages (BeaverTail/InvisibleFerret malware) that steal wallets, credentials, and session data. The ELUSIVE COMET campaign invited crypto founders to podcast and "interview" Zoom calls, then used Zoom's remote-control prompt to seize control of victims' machines mid-call. If you work in web3, an unsolicited, flattering, high-comp offer is a standing attack vector against your device, your keys, and your organization. This checklist keeps a fake interview from becoming a real incident.

---

## Recruiter Verification

💡 **Verify the recruiter before you engage with anything they send. Attackers impersonate real companies and real employees.**

**Identity Checks**
- [ ] **Official Channel Verification**: Verify the recruiter's identity through official company channels - find the company's website or careers page yourself and confirm both the person and the role exist
  - [ ] Contact the company via its official domain or verified socials to confirm the outreach is real
  - [ ] Never rely only on the contact details provided in the outreach itself
- [ ] **Profile Scrutiny**: Verify LinkedIn/Telegram/X profiles independently - new accounts, thin history, stock or AI-generated photos, or connections that don't match the claimed company all indicate a fake persona
- [ ] **Role Existence Check**: Confirm the position is actually listed on the company's official careers page - fake recruiters routinely pitch roles the company never opened

**Message Authenticity**
- [ ] **Domain & Email Checks**: Check email authenticity and domain age
  - [ ] Be suspicious of lookalike domains (`company-careers.com` vs `company.com`) and freshly registered domains
  - [ ] Treat recruiters using free webmail for "corporate" outreach as unverified
- [ ] **Too-Good-To-Be-True Filter**: Treat unsolicited, unusually high-compensation offers as a red flag - especially when the process is rushed, flattery-heavy, moves quickly to Telegram/Discord, or skips normal interview steps
- [ ] **Deepfake Awareness**: Don't treat a video call as proof of identity on its own
  - [ ] Real-time face-swap deepfakes are used on recruiter calls - watch for lag between lip movement and audio, refusal to turn sideways or move a hand across the face, and stalling when asked
  - [ ] Identity is established by the verified company channel, not by the face on the call
- [ ] **Team Awareness**: Tell your organization's security owner when you receive unsolicited recruitment - campaigns typically target several members of the same team at once

---

## Interview Safety

💡 **The "interview" is the delivery mechanism. Code they send you and software they ask you to install are the payloads.**

**Coding Challenges & Take-Homes**
- [ ] **Never on Work Devices**: Never run "coding challenges", take-home projects, or repositories from recruiters on your work device
  - [ ] If you choose to do one at all, run it in a disposable virtual machine with no credentials, wallets, or work data
  - [ ] Destroy the VM afterwards - do not reuse it for anything else
- [ ] **Read Before You Run**: Inspect what you were sent before executing anything
  - [ ] Trojanized challenges hide malicious hooks in `package.json` scripts (`preinstall`/`postinstall`), config files, and obfuscated dependencies
  - [ ] Remember that `npm install` / `pip install` alone can be the compromise - you don't have to run the app to be infected
- [ ] **No Live-Access Assessments**: Decline "skill assessments" that require screen-sharing your terminal while running their code, granting repo/organization access from your accounts, or working inside a remote desktop environment they control

**Call Software & Prompts**
- [ ] **No Prompted Installs**: Never install "video call software", plugins, drivers, or camera/microphone "fixes" at a recruiter's prompting
  - [ ] Real interviews work with standard, already-installed tools - join by browser from the platform's official domain instead
  - [ ] "The meeting requires our custom client/SDK" is a malware delivery line, not a technical requirement
- [ ] **Refuse Remote Control**: Refuse Zoom (or any platform's) remote-control requests - there is no legitimate reason for an interviewer to control your machine; decline the prompt and end the call
- [ ] **Security Software Stays On**: Treat any request to disable antivirus, EDR, firewalls, or OS protections ("the challenge won't run otherwise") as an active attack - stop immediately and report it
- [ ] **Your Account, Your Settings**: Keep interviews on your own accounts with your own settings - decline links that force you through third-party launchers, and never grant screen-share of your full desktop when a single window will do

---

## Document & Link Hygiene

💡 **Job descriptions, offer letters, and meeting invites are attachments and links from an untrusted party - handle them that way.**

- [ ] **Sandboxed Viewing**: Open all recruiter attachments (PDFs, "job descriptions", offer letters) only in sandboxed viewers or after sanitization per SP-EP-010
  - [ ] Use [Dangerzone](https://dangerzone.rocks/), Google Drive preview, or a temporary VM - never desktop apps on your work device
  - [ ] Scan suspicious files with [VirusTotal](https://www.virustotal.com/gui/home/upload) before opening
- [ ] **Meeting Link Verification**: Verify meeting links against known domains before joining
  - [ ] Legitimate: `zoom.us`, `meet.google.com`, `teams.microsoft.com`
  - [ ] Treat lookalikes (`zoom-meeting[.]xyz`, `us04-zoom[.]link`) as malicious
  - [ ] Prefer joining from the browser when the invite comes from an unverified party - it limits what the platform (or a fake client) can do to your system
- [ ] **Manual Navigation**: Manually type or re-navigate to shared links rather than clicking them (to avoid homograph and redirect tricks)
- [ ] **No Credentials, No Wallets**: Never enter credentials or connect a wallet on a page reached from a recruiter's link - "assessment portals" and "onboarding forms" are common phishing fronts
- [ ] **Preserve Samples**: Share suspicious files and links with your security owner rather than deleting them - they are indicators the whole team can block on

---

## If You Suspect Compromise

💡 **You ran the challenge, installed the "update", or accepted the prompt - speed now matters more than embarrassment. Reporting fast is what protects your team.**

**Immediate Actions**
- [ ] **Disconnect**: Take the device off the network immediately (Wi-Fi off, cables out) - do not "finish the call" or keep investigating on the infected machine
- [ ] **Report**: Notify your organization's security owner immediately - the same campaign is likely targeting teammates, and your access may already be in use
- [ ] **Quarantine**: Treat the device as fully compromised per your organization's incident response runbook (see the Incident Response Readiness Guide)
  - [ ] Preserve the device for forensics - do not wipe it before evidence is captured
  - [ ] Write down what you executed, installed, or approved and when - timestamps make forensics and damage assessment far faster

**From a Clean Device**
- [ ] **Rotate Credentials**: Using a separate, known-clean device, rotate everything the compromised machine could reach - passwords, 2FA enrollments, SSH keys, API tokens - and sign out of all active sessions everywhere
- [ ] **Move Funds**: Move funds from any hot wallets whose keys or extensions lived on the device to fresh wallets generated on a clean device - assume seed phrases and session cookies are stolen
  - [ ] Revoke token approvals granted from the affected wallets (e.g. via [Revoke.cash](https://revoke.cash/)) once funds are safe
- [ ] **Warn Others**: Ask your security owner to warn the team (and, if an organization was impersonated, notify that organization) so the same lure is burned for the attacker
- [ ] **Clean Recovery Only**: Do not restore from backups made after the suspected compromise, and only return to work on a wiped or replaced device cleared by your security owner
