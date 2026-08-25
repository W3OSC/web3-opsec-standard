<!--
id: youtube-organization-configuration
type: CONFIGURATION
scope: ORGANIZATION
-->

<div align="center"> <img src="../../../../images/guides/youtube.svg" alt="YouTube Logo" width="64" height="64"> <h2><a href="https://studio.youtube.com/" target="_blank" rel="noopener noreferrer">YouTube</a> Configuration Guide</h2> </div>

> Crypto channel takeovers are overwhelmingly executed with **session-token stealer malware**, not password guessing. The attacker sends a "sponsorship" or "collaboration" file to a channel manager, steals the browser session cookie, and bypasses the password and 2FA entirely - then renames the channel and runs a fake livestream giveaway. Sections below are ordered accordingly.

## Google Account Security

- [ ]  Own the channel from a **dedicated organization Google account**, never a personal one (SP-EP-001)
- [ ]  Enroll **two hardware security keys** as the 2FA method and remove SMS fallback (SP-CS-001)
- [ ]  Enroll the owning account in Google's **Advanced Protection Program** - it blocks most session-stealing and unverified app access paths
- [ ]  Set recovery email and phone to organization-controlled destinations; never a personal number (SP-CS-002)
- [ ]  Review Google Account > Security > Your devices and **sign out unrecognized sessions**
- [ ]  Review Google Account > Security > Third-party apps with account access; revoke everything unused

## Channel Permissions

- [ ]  Use a **Brand Account** with delegated permissions so no one needs the owner password to publish (SP-GS-009)
- [ ]  YouTube Studio > Settings > Permissions > Assign the least-privilege role per person
    - [ ]  **Editor** for people who upload and edit; reserve **Manager** and **Owner** for the minimum set required
    - [ ]  Only Owners can delete the channel or change permissions - keep that list to one or two accounts
- [ ]  Every delegate account must independently satisfy the hardware-key 2FA requirement above
- [ ]  Remove departed staff and agency contractors the same day access ends (SP-GS-024)
- [ ]  Review the permission list quarterly against the account inventory (SP-GS-020)

## Session-Theft Defense

- [ ]  Never open sponsorship decks, contracts, "product demo" builds, or password-protected archives on a device that holds channel access - route them to a sandboxed viewer or isolated VM first (SP-EP-010)
- [ ]  Treat unsolicited brand-deal outreach as hostile by default; verify the sender through the company's official domain before engaging (SP-CS-005)
- [ ]  Run EDR on every device with channel access and keep it enforcing (SP-EP-006)
- [ ]  Sign out of the channel account on any device that will not be used to manage it
- [ ]  Prefer a **dedicated browser profile** for channel management, with no unrelated extensions installed (SP-EP-009, SP-EP-011)

## Content & Feature Hygiene

- [ ]  YouTube Studio > Settings > Channel > Restrict who can start **live streams** - takeover scams depend on livestream access
- [ ]  Review connected apps and third-party channel-management tools; remove any not actively required
- [ ]  Enable upload defaults that require manual review before publishing where workflow allows
- [ ]  Keep a current export of channel branding assets so restoration after a takeover is fast

## Monitoring & Response

- [ ]  Alert on new sign-ins and permission changes to a monitored team channel
- [ ]  Monitor for unauthorized changes to **channel name, handle, banner, and profile image** - these are the first visible signs of a takeover in progress
- [ ]  Monitor for **clone channels** impersonating your brand and report them via YouTube's impersonation form
- [ ]  Document the hacked-channel recovery flow and Google support escalation path **in advance** (SP-GS-001)
- [ ]  Include channel takeover in the social account takeover runbook, with pre-drafted community warnings ready to post on independent channels
