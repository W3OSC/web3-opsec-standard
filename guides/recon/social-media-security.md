<!--
id: social-media-security
type: GUIDE
scope: ORGANIZATION
-->

<div align="center">
  <h1>Secure Your Social Channels</h1>
  <p><em>Protect the community an attacker will impersonate</em></p>
</div>

---

## Overview

For a web3 org the community lives on X, Discord and Telegram, and impersonating those channels is how most retail users get drained. Fake admin accounts, cloned servers, and "support" DMs that lead to a wallet-drainer site do their damage to your community and your reputation even when your own infrastructure is untouched. This guide covers hardening your official channels and reducing the impersonation surface.

---

## Harden Official Channels

### Why It's Critical

Impersonated social accounts and fake support are the leading cause of user fund loss in web3. The countermeasures are mostly configuration and policy, and they cost nothing.

### Implementation Steps

- [ ] Verify your official accounts where the platform supports it, and publish the canonical list of official channels on your own domain as a source of truth.
- [ ] On Discord and Telegram, disable or lock down DMs and enforce a clear "admins will never DM you first" policy.
- [ ] Restrict admin roles to a minimal set, require MFA on every admin account, and audit role assignments regularly.
- [ ] Deploy anti-scam bots and raid protection; lock down permissions on new-member and announcement channels.
- [ ] Brief your community regularly on how you *do* and *don't* communicate (no surprise airdrops in DMs, no "connect wallet to verify").

---

## Monitor for Impersonation

### Implementation Steps

- [ ] Connect a social-monitoring source to continuously scan for accounts and servers impersonating your brand and admins.
- [ ] Give your community a fast way to report impersonators, and act on takedowns quickly.

---

## Notes

Most of this is policy and configuration, not tooling. The highest-value single move is a hard, well-communicated "admins never DM first" rule — it defuses the most common scam pattern.
