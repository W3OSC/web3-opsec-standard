<!--
id: dependency-management
type: GUIDE
scope: ORGANIZATION
-->

<div align="center">
  <h1>Manage Vulnerable Dependencies</h1>
  <p><em>Patch what you ship and automate the upkeep</em></p>
</div>

---

## Overview

Your application is mostly other people's code. Known-vulnerable dependencies are exploited by automated tooling at scale, and a single vulnerable package can compromise your build pipeline or your runtime. For web3, a compromised dependency in a front-end is a well-trodden path to injecting a wallet drainer. This guide covers patching current findings and keeping dependencies current going forward.

---

## Patch Known-Vulnerable Packages

### Why It's Critical

A vulnerability with a published advisory is a vulnerability with a published exploit. The gap between disclosure and mass scanning is short, so unpatched dependencies are low-hanging fruit.

### Implementation Steps

- [ ] Review the flagged dependencies and their advisories; prioritize CRITICAL and HIGH severity.
- [ ] Upgrade each affected package to a patched version; where no fix exists, evaluate a replacement or a temporary mitigation.
- [ ] Re-run the dependency audit to confirm the findings clear.
- [ ] Verify your lockfile pins the fixed versions so the patch actually ships.

---

## Automate Ongoing Updates

### Why It's Critical

Dependency risk is continuous — new advisories land daily. Manual, periodic review lets vulnerabilities sit unpatched for weeks.

### Implementation Steps

- [ ] Enable automated dependency-update PRs (Dependabot / Renovate) on every repository.
- [ ] Turn on your platform's vulnerability alerts.
- [ ] Pin dependencies with a lockfile and review new transitive dependencies before merging.
- [ ] Prefer well-maintained packages; treat an unmaintained dependency as a latent risk.

---

## Notes

Automated update PRs only help if someone reviews and merges them — assign ownership so security patches don't pile up unmerged.
