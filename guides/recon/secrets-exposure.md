<!--
id: secrets-exposure
type: GUIDE
scope: ORGANIZATION
-->

<div align="center">
  <h1>Remove Exposed Files and Rotate Secrets</h1>
  <p><em>Get source and environment files off your web root</em></p>
</div>

---

## Overview

When a `.git/` directory or a `.env` file is served straight off your web root, an attacker can download your entire source history or your application secrets with a single request. This is one of the fastest paths from "no vulnerabilities" to full compromise — and for a web3 project, a leaked deployer key or mnemonic means direct, irreversible loss. This guide covers blocking the exposure and cleaning up afterwards.

---

## Block the Exposed Path

### Why It's Critical

`/.git/config`, `/.env`, backup files and `/server-status` pages leak source, credentials and internal structure. Once served publicly they should be treated as already compromised.

### Implementation Steps

- [ ] Confirm the exposure (e.g. `GET /.git/config` returns repository config, or `/.env` returns `KEY=value` lines).
- [ ] Block access to the path at the web server / CDN (deny rules for dotfiles and `.git`, disable `mod_status` exposure).
- [ ] Remove the file or directory from the deployed web root entirely — the build/deploy process should never ship it.
- [ ] Disable directory listing on the web server.

---

## Rotate Everything That Leaked

### Why It's Critical

If a secret was reachable on the public internet, assume it has been harvested. Blocking the path does not un-leak what was already exposed.

### Implementation Steps

- [ ] Rotate every credential that appeared in the exposed file — API keys, database passwords, tokens, and especially any private key or mnemonic.
- [ ] Review access logs for signs the file was actually fetched.
- [ ] Add exposed-file checks to your regular monitoring so a redeploy that reintroduces the file is caught.

---

## Notes

Blocking the URL is necessary but not sufficient — rotation is the part that actually contains the incident. Prioritise any on-chain keys first.
