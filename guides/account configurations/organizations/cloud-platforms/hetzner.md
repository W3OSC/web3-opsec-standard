<!--
id: hetzner-organization-configuration
type: CONFIGURATION
scope: ORGANIZATION
-->

<div align="center">
  <img src="../../../../images/guides/hetzner.svg" alt="Hetzner Logo" width="64" height="64">
  <h2><a href="https://www.hetzner.com/" target="_blank" rel="noopener noreferrer">Hetzner</a> Configuration Guide</h2>
  <p><em>Cloud VPS Security — Account, Server Hardening & Web Exposure</em></p>
</div>

---

## Account & Cloud Console Security

Secure the control plane first — an attacker with console or API access can bypass every host-level control below.

#### Account Access
- [ ] **Enable two-factor authentication** on the Hetzner account (and Robot, if used) — [account security](https://docs.hetzner.com/general/others/security/)
- [ ] Use a **unique, password-manager-generated password**; never reuse the billing email's password
- [ ] Keep **notification/alert contacts** current so abuse and resource alerts are actually seen

#### Projects & Team
- [ ] Use a **separate Project per environment** (prod / staging / customer) — Cloud Firewalls, keys, and servers are scoped per Project
- [ ] Grant team members **least privilege**; remove access promptly when someone leaves
- [ ] Review the **member and access list** on a recurring schedule

#### API Tokens
- [ ] Create **scoped API tokens** (prefer `Read` over `Read & Write` where possible) — [Cloud API tokens](https://docs.hetzner.com/cloud/api/getting-started/generating-api-token/)
- [ ] Store tokens in a **secrets manager**, never in git, CI logs, or images
- [ ] **Rotate tokens** periodically and immediately after any suspected exposure

---

## Secure Server Provisioning

Getting the baseline right at creation avoids exposing a fresh server before it is hardened.

- [ ] **Attach an SSH key at creation** — never rely on a root password emailed to you
- [ ] **Do not enable password-based rescue/root access** unless actively needed, and disable it afterwards
- [ ] Provision from a **current LTS image** (e.g. latest Ubuntu/Debian LTS) and patch on first boot
- [ ] Apply a **cloud-init / user-data** baseline (create sudo user, updates, firewall) so the box is never in an unhardened state
- [ ] Place internal services on a **private network / vSwitch**; do not bind databases or admin ports to the public IP
- [ ] Assign the server to the **correct Project and Cloud Firewall** from the start

---

## SSH Hardening

- [ ] **Key-only authentication** — set `PasswordAuthentication no` in `/etc/ssh/sshd_config`
- [ ] Prefer **ed25519 keys**; use a passphrase on the private key
- [ ] **Disable direct root login** — `PermitRootLogin no`
- [ ] Administer via a **dedicated non-root sudo user**, not root
- [ ] Restrict who can log in — `AllowUsers <user>` (and/or an `AllowGroups`)
- [ ] Lower brute-force surface — `MaxAuthTries 3`, `LoginGraceTime 20`, and an idle `ClientAliveInterval`
- [ ] Reload and verify before closing your session — `sshd -t && systemctl reload ssh`

---

## Firewall (Defense in Depth)

Run **two** layers: the Hetzner Cloud Firewall (blocks traffic before it reaches the VM) and a host firewall (protects if the cloud rule is ever misconfigured).

#### Hetzner Cloud Firewall
- [ ] **Default-deny inbound**; allow only the ports you need — [Cloud Firewalls](https://docs.hetzner.com/cloud/firewalls/overview/)
- [ ] Expose only **22 (SSH), 80, 443**; keep everything else closed
- [ ] **Restrict SSH source** to known admin IPs or a VPN/bastion — never `0.0.0.0/0`
- [ ] Apply firewalls **via label** so new servers inherit rules automatically

#### Host Firewall (UFW)
- [ ] `ufw default deny incoming` / `ufw default allow outgoing`
- [ ] Allow only the same required ports; mirror the SSH source restriction
- [ ] Enable logging — `ufw logging on`

---

## Automatic Updates & Patching

- [ ] Install and enable **`unattended-upgrades`** for security patches
- [ ] Define a **reboot policy** for kernel updates (maintenance window or Ubuntu Livepatch)
- [ ] Track patch status; do not let long-lived servers drift

---

## Intrusion Prevention

- [ ] Install **`fail2ban`** and enable the `sshd` jail
- [ ] Tune `maxretry`, `findtime`, and `bantime` (e.g. 3 / 10m / 1h+) to your risk tolerance
- [ ] Add web jails (nginx/apache) if the server is public-facing

---

## Kernel & Network Hardening (`sysctl`)

Set in `/etc/sysctl.d/` and apply with `sysctl --system`.

- [ ] Enable **SYN cookies** — `net.ipv4.tcp_syncookies = 1`
- [ ] Enable **reverse-path filtering** (anti-spoofing) — `net.ipv4.conf.all.rp_filter = 1`
- [ ] **Ignore ICMP redirects** — `net.ipv4.conf.all.accept_redirects = 0`, `send_redirects = 0`
- [ ] **Disable source routing** — `net.ipv4.conf.all.accept_source_route = 0`
- [ ] **Log martian packets** — `net.ipv4.conf.all.log_martians = 1`
- [ ] **Disable IP forwarding** unless the host is a router/gateway — `net.ipv4.ip_forward = 0`
- [ ] Disable **IPv6** if genuinely unused (otherwise firewall it too)

---

## Backups & Snapshots

- [ ] Enable **Hetzner automated backups** on production servers — [backups](https://docs.hetzner.com/cloud/servers/getting-started/enabling-backups/)
- [ ] Take a **snapshot before risky changes** (upgrades, migrations)
- [ ] Keep an **offsite/object-storage copy** (e.g. Storage Box / S3-compatible), encrypted
- [ ] **Test a restore** on a schedule — an untested backup is not a backup

---

## (Optional) Web / TLS Hardening

Apply if the server terminates HTTP(S). Based on Hetzner's [webserver security configuration](https://docs.hetzner.com/managed/webserver/https-caching-security-configuration/).

- [ ] **Force HTTPS** with a permanent 301 redirect from HTTP
- [ ] Serve valid TLS via **Let's Encrypt**; auto-renew; **TLS 1.2+** only with strong ciphers
- [ ] Add **HSTS** — `Strict-Transport-Security: max-age=31536000`
  - Add `includeSubDomains` **only if every subdomain serves HTTPS**
  - Add `preload` **only** as a permanent commitment — preload removal is slow
- [ ] Set core **security headers** — `X-Content-Type-Options: nosniff`, `X-Frame-Options`/frame-ancestors CSP, `Referrer-Policy`
- [ ] Configure **cache-control** sensibly; use **cache-busting filenames** for updated CSS/JS
- [ ] Consider **hotlink protection** for static assets (note: `Referer` headers are unreliable)

---

## (Optional) Monitoring, Logging & Auditing

- [ ] Enable **`auditd`** for a tamper-evident record of privileged actions
- [ ] **Centralize and review logs** (auth, firewall, web) off-box where possible
- [ ] Use **Hetzner monitoring/alerts** and external uptime checks for availability signals
- [ ] Alert on **new SSH logins** and repeated auth failures
