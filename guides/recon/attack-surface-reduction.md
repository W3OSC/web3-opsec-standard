<!--
id: attack-surface-reduction
type: GUIDE
scope: ORGANIZATION
-->

<div align="center">
  <h1>Reduce Your Public Attack Surface</h1>
  <p><em>Take non-production and admin hosts off the open internet</em></p>
</div>

---

## Overview

Every host that resolves publicly is something an attacker can probe. Staging environments, admin panels, internal tools, CI servers and forgotten subdomains are frequently less hardened than production, run older code, and leak internal detail — so an attacker treats them as the soft way in. This guide helps you find what is exposed and pull the sensitive parts back behind authentication or off the internet entirely.

---

## Inventory and Trim Exposed Hosts

### Why It's Critical

Reconnaissance against a web3 org routinely turns up `staging.`, `admin.`, `vpn.`, `git.` and `jenkins.` subdomains that were never meant to face the public. These are high-value targets: a login page on an internal tool, an unauthenticated dashboard, or a dev build with debug endpoints can hand an attacker credentials, source, or a foothold.

### Implementation Steps

- [ ] Enumerate all subdomains that resolve publicly (certificate transparency logs, DNS records, and your DNS provider's zone file are the sources of truth).
- [ ] For each host, decide: does this need to be reachable from the public internet at all?
- [ ] Put admin panels, internal tools, dashboards and CI/CD behind your VPN, an SSO/identity-aware proxy, or an IP allow-list.
- [ ] Remove DNS records for hosts that are no longer used, so they stop appearing in recon.
- [ ] Ensure any host that must stay public is patched and access-controlled to the same standard as production.
- [ ] Add subdomain discovery to your regular monitoring so new exposed hosts are caught quickly.

---

## Notes

"Security through obscurity" is not the goal — the goal is that non-production and privileged surfaces require authentication. Assume every subdomain you publish will be found; make sure the sensitive ones ask for credentials.
