<!--
id: developer-security-best-practices-individual-guide
type: GUIDE
scope: INDIVIDUAL
-->

<div align="center">
  <h1>Developer Security Guide</h1>
  <p><em>Trust-level isolation for Web3 development environments</em></p>
</div>

---

## Overview

Web3 developers are a target class of their own. Development machines sit next to wallet extensions and deployment credentials, developers hold contract deployment permissions, and attackers deliver malware through the tools of the trade: dependencies, take-home projects, "can you check out my repo" messages, and poisoned tooling.

The core defense is isolation by trust level: decide which operations are privileged, which are routine, and which are untrusted — then make sure code from one level can never touch the credentials of another. This guide covers that model and the concrete setups (dedicated devices, dev containers, browser separation) that implement it.

The device and network baseline — disk encryption, screen locks, secure DNS, VPN, network and persistence monitoring — is covered in the [Personal Security Checklist](individual-security.md). This guide assumes it and focuses on what is specific to development work.

---

## Security Risks

- **Malicious code execution** — untrusted repos and scripts, compromised dependencies inside trusted projects, supply-chain attacks through development tools (see the [Supply Chain & Dependency Security Guide](supply-chain-dependency-security.md))
- **Endpoint compromise** — malware from downloads and external files, 0-day exploits, network-based attacks, physical attacks and theft
- **Browser-based attacks** — browser and wallet-extension vulnerabilities, session hijacking, phishing
- **Credential compromise** — secrets accidentally committed to code, side-channel leakage, overly permissive dev accounts

---

## Trust Levels

Classify every activity into one of three levels, and never let a lower level's code run where a higher level's credentials live.

### Privileged — dedicated secure environment

The operations that move funds or grant control:

- **Wallet operations** — transaction signing and multi-sig participation, hardware wallet interactions, transaction simulation and verification, contract deployments
- **Sensitive data access** — production deployment credentials, internal confidential documents, administrative access to critical systems
- **High-permission sessions** — cloud consoles (AWS, GCP, Azure), online banking and financial services, organization admin panels

### Default — daily work environment

Standard development activity with standard precautions:

- **Development work** — known, trusted codebases; pre-installed and verified tools; normal IDE usage
- **Authenticated browsing** — logged-in work tools, communication platforms, personal browsing with saved sessions

### Untrusted — disposable environment

Anything that runs code or content you didn't write and haven't verified:

- **Code execution** — foreign or unknown code, new libraries and dependencies, downloaded scripts and tools
- **File handling** — external files from unknown sources, untrusted executables, user-submitted content
- **Risky browsing** — untrusted links, temporary sessionless browsing, video-conference software downloads

---

## Implementation

Three mechanisms enforce the trust levels in practice: separate devices, containerized execution, and separate browsers.

### Device separation

**Dedicated privileged device**

- [ ] **Use a separate machine exclusively for privileged operations**
- [ ] **Air-gap where possible** — isolate from other devices and networks
- [ ] **Isolate the network** — a separate WiFi network or a cellular connection
- [ ] **Allow no external device connections** — USB drives, keyboards, and other peripherals stay off
- [ ] **Always use a VPN** when traveling or on untrusted networks

**Untrusted environment separation**

- [ ] **Segregate daily activity from untrusted operations** using separate devices, OS accounts, or VMs
- [ ] **Wipe untrusted environments regularly**
- [ ] **Assume the untrusted environment is already infected** — never enter credentials for your usual accounts there; create dedicated minimal-access accounts when one is needed

### Dev containers and VMs

Run all project code in containers — including trusted projects, since any of their dependencies can be compromised. Containers can be Docker images, IDE-integrated project containers, or cloud workstations.

- [ ] **One container per project** — never reused across projects
- [ ] **Clean images for untrusted work** — no persistence between sessions
- [ ] **Clone repos inside the container** — ideally a repo never touches the host machine
- [ ] **Minimal, security-focused base images**
- [ ] **No host network access or shared storage** for containers
- [ ] **Keep sensitive credentials out** — untrusted projects get no API keys or deployment credentials; development credentials must be separate from production ones and encrypted at rest with a different passphrase or key
- [ ] **Use VMs when containers don't fit** — configured with no shared storage, network, or device access, and restored to a clean snapshot after each use

Setup guides: [VS Code / Cursor dev containers](https://code.visualstudio.com/docs/devcontainers/containers) · [JetBrains dev containers](https://www.jetbrains.com/help/idea/start-dev-container-from-welcome-screen.html)

### Browser separation

Within your default trust level, run a two-browser system:

**Session browser — trusted operations only**

- [ ] **Authenticated, trusted browsing only** — never open clicked links or pasted URLs here
- [ ] **Maintain logged-in sessions** for work tools
- [ ] **Clear cookies and cache regularly**

**Ephemeral browser — everything else**

- [ ] **Private/incognito mode by default** — no persistent cookies, cache, or history
- [ ] **Set as the system default browser** so clicked links land here, not in your session browser
- [ ] **Use for all temporary and untrusted browsing**

Keep both browsers updated, avoid beta and experimental features, and give wallet extensions a third dedicated browser used only for transacting (see the [Personal Security Checklist](individual-security.md)).

---

## Developer-Specific Hardening

Beyond the baseline checklist, these controls matter most for people who write and ship code.

**Operating system**

- [ ] **Work from a non-admin account** — elevate only when genuinely necessary, never for daily tasks
- [ ] **macOS** — keep System Integrity Protection (SIP) enabled
- [ ] **Windows** — enable Windows Defender Application Control or AppLocker
- [ ] **Linux** — consider SELinux for mandatory access control

**Travel**

- [ ] **Use dedicated travel devices**, or wipe devices before travel
- [ ] **Keep backup snapshots** for fast device restoration
- [ ] **Avoid sensitive accounts on untrusted networks**
- [ ] **Enable remote wipe** in case of theft or seizure

**Code and secrets**

- [ ] **Scan dependencies** for malicious, vulnerable, and risky packages with [depenemy](https://github.com/W3OSC/depenemy) — see the [Supply Chain & Dependency Security Guide](supply-chain-dependency-security.md) for the full lifecycle approach
- [ ] **Sign all git commits** for non-repudiation in logs ([GitHub guide](https://docs.github.com/en/authentication/managing-commit-signature-verification/signing-commits)); [1Password SSH/Git signing](https://vinialbano.com/how-to-sign-git-commits-with-1password/#setting-up-1password-for-ssh-and-git-commit-signing) makes this painless
- [ ] **Encrypt secrets that must live in repos** with a tool like [git-secret](https://sobolevn.me/git-secret/)
- [ ] **Block accidental secret leakage** with an automated pre-commit scanner like [git-secrets](https://github.com/awslabs/git-secrets)
