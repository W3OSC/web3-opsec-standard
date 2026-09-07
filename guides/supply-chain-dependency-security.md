<!--
id: supply-chain-dependency-security-organization-guide
type: GUIDE
scope: ORGANIZATION
-->

<div align="center">
  <h1>Supply Chain & Dependency Security Guide</h1>
  <p><em>Managing third-party code risk across the full dependency lifecycle</em></p>
</div>

---

## Overview

A modern Web3 project is mostly code your team did not write. A typical frontend or tooling repo pulls in hundreds of transitive dependencies, each one authored, published, and updated by someone outside your organization. Every one of those packages is code that runs on developer machines, inside CI runners holding deployment secrets, and in the frontends your users trust with their wallets.

Attackers know this. Web3 teams are disproportionately targeted with malicious packages because the payoff is immediate and irreversible: a single compromised dependency can exfiltrate private keys and seed phrases, swap recipient addresses in a frontend, or steal cloud and signing credentials from CI. Supply chain attacks bypass your perimeter entirely — you invite the code in yourself.

This guide covers how to vet, pin, update, monitor, and respond to dependencies as a managed attack surface, and the tooling W3OS recommends for automating it.

---

## Security Risks

- **🎣 Malicious Packages by Design**
  - Typosquatting: names one character away from popular packages (`ethes`, `web3.js` vs `web3js`)
  - Dependency confusion: public packages published under your internal/private package names, winning resolution over the real ones
  - Starter kits, "airdrop tools," and job-interview "take-home projects" seeded with credential stealers

- **📦 Compromised Legitimate Packages**
  - Maintainer account takeover via phishing or credential stuffing, followed by a malicious release of a trusted package
  - Ownership transfer to a "helpful new maintainer" who later ships a payload
  - Abandoned or archived projects silently adopted by attackers

- **⚙️ Install-Time Code Execution**
  - npm `preinstall`/`postinstall` scripts run arbitrary code the moment you (or CI) run `npm install` — before you ever import the package
  - Build-time code in setup scripts and build plugins with the same effect in other ecosystems

- **🔄 Update-Channel Attacks**
  - Loose version ranges (`^`, `~`, `>=`, `*`) automatically pull the next published version — the exact window a hijacked release exploits
  - Lockfile tampering in pull requests, hiding a swapped package or resolved URL inside thousands of lockfile diff lines
  - Auto-merged update PRs shipping a compromised version to production with no human review

- **🏗️ Build, CI, and User Exposure**
  - Dependencies execute inside CI with access to workflow secrets, signing keys, and deploy credentials
  - Frontend dependencies ship directly to users' browsers — a compromised UI package becomes a wallet drainer
  - Compromised developer machines (see the [Developer Security Guide](developer-security-best-practices.md)) become a path to publishing malicious versions of *your own* packages

---

## The Dependency Lifecycle

Treat every dependency as a vendor relationship with distinct decisions at each stage: **intake → pinning → updating → monitoring → removal**.

### 🔍 Intake: Vetting New Dependencies

Every new dependency is a permanent expansion of your attack surface. Vet before the first install:

- [ ] **Necessity First**: Prefer the standard library, existing dependencies, or a small amount of first-party code over adding a new package for trivial functionality
- [ ] **Package Age**: Require versions at least 6 months old with balanced usage metrics — brand-new packages and brand-new versions carry the highest risk
- [ ] **Health Signals**: Check weekly downloads, contributor count, maintenance activity, and whether a linked source repository exists and is not archived
- [ ] **Name Verification**: Compare the package name character-by-character against official documentation in a monospace font; never install a name from a chat message, search result, or LLM output without verifying it
- [ ] **Install Scripts**: Check for `preinstall`/`postinstall` scripts (`npm pkg get scripts` on the tarball, or a depenemy scan) and treat their presence as requiring justification
- [ ] **Source Review**: Skim the actual published artifact (not just the GitHub repo — they can differ) for obfuscated code, network calls, or environment variable access that doesn't match the package's purpose
- [ ] **Scan Before Adding**: Run [depenemy](https://github.com/W3OSC/depenemy) against the change introducing the dependency so reputation and supply chain checks run before merge
- [ ] **Sandbox First Contact**: Perform first installs and evaluation of unfamiliar packages in an isolated environment, never on a machine with wallet or production access

### 📌 Pinning & Lockfiles

Make every install reproducible and every change to third-party code visible in review:

- [ ] **Exact Pins**: Pin direct dependencies to exact versions — no `^`, `~`, `>=`, or `*` ranges in manifests
- [ ] **Lockfiles Committed**: Commit `package-lock.json`/`yarn.lock`/`pnpm-lock.yaml`, `Cargo.lock`, `uv.lock`/`poetry.lock` (or hash-pinned requirements) to version control for every project, including internal tools
- [ ] **Lockfile-Only Installs in CI**: Use `npm ci` (not `npm install`), `pip install --require-hashes`, `cargo build --locked`, etc., so CI can never resolve versions the lockfile doesn't contain
- [ ] **Disable Install Scripts by Default**: Set `ignore-scripts=true` in `.npmrc` (npm/yarn/pnpm) and explicitly allowlist the few packages that genuinely need build scripts (pnpm supports this natively)
- [ ] **Review Lockfile Diffs**: Treat lockfile changes as code changes; reviewers must check that resolved packages, versions, and registry URLs match the intended update
- [ ] **Pin Transitives When Needed**: Use `overrides` (npm), `resolutions` (yarn), or equivalent to force known-good versions of vulnerable or suspicious transitive dependencies

### 🔄 Updating Deliberately

Staying outdated is a risk; updating blindly is a bigger one. Updates should be **deliberate, delayed, and reviewed**:

- [ ] **Release Cooldown**: Never adopt a version less than 7 days old — most malicious releases are detected and pulled within days of publication. Enforce this with a configured cooldown policy (Dependabot `cooldown`, Renovate `minimumReleaseAge`, or pnpm `minimumReleaseAge`) rather than convention
- [ ] **Human Review Required**: Every dependency update lands via a pull request reviewed by a human — never auto-merge dependency updates, including "patch-only" ones
- [ ] **Read Before Merging**: For security-sensitive or widely-used packages, review the changelog and the actual diff between published versions before approving
- [ ] **Prioritize by Exposure**: Fast-track updates that fix vulnerabilities exploitable in your usage; batch routine version bumps on a regular cadence
- [ ] **Rebuild and Test in Isolation**: Run updated dependencies through CI and isolated environments before they reach machines with production or signing access

### 📡 Continuous Monitoring

New vulnerabilities and newly-flagged malicious packages affect dependencies you already pinned:

- [ ] **Dependabot Alerts**: Enable the dependency graph and Dependabot alerts on all repositories (see the [GitHub configuration guide](<account configurations/organizations/devops-accounts/github.md>)) so known-vulnerable versions surface automatically
- [ ] **Scheduled Scans**: Run depenemy on a schedule (not just on PRs) so newly-published advisories and reputation changes against existing pins are caught
- [ ] **Alert Routing**: Route dependency alerts to a channel the team actually triages, with an owner and an SLA — an ignored alert stream is equivalent to no alerts
- [ ] **Dependency Inventory**: Maintain visibility into what you depend on across all repos (GitHub dependency graph, or SBOM generation for release artifacts) so "are we affected?" takes minutes, not days

### 🗑️ Removal & Pruning

- [ ] **Regular Pruning**: Periodically remove unused dependencies (`depcheck`, `cargo machete`, etc.) — every removed package is attack surface gone
- [ ] **Replace the Abandoned**: Migrate away from deprecated, archived, or single-maintainer packages in critical paths before they become someone else's takeover target
- [ ] **Full Removal**: When removing a package, confirm it also leaves the lockfile and that no scripts or CI steps still reference it

---

## Recommended Tooling

### 🛡️ Depenemy

[Depenemy](https://github.com/W3OSC/depenemy) is W3OSC's open-source dependency scanner, built specifically around the supply chain threat model described in this guide. It scans npm/Node.js, Python, Rust, and Solidity (Foundry/Hardhat) projects for three categories of findings:

- **Behavioral risks** — unpinned versions and loose ranges, lagging versions, missing lockfiles, missing release-cooldown policies
- **Reputation signals** — young author accounts, new packages/versions, low download counts, stale or deprecated packages, known-vulnerable versions, suspected typosquatting
- **Supply chain risks** — install scripts, missing or archived source repositories, dependency confusion exposure, packages recorded as malicious in OSV

**Setup:**

```bash
pip install depenemy

# Scan a project
depenemy scan .

# Gate CI on findings
depenemy scan . --fail-on error

# List all checks
depenemy rules
```

**CI integration** — surface findings in the repository Security tab on every push and pull request:

```yaml
# .github/workflows/depenemy.yml
name: Depenemy scan
on: [push, pull_request]

jobs:
  scan:
    runs-on: ubuntu-latest
    permissions:
      contents: read
      security-events: write
    steps:
      - uses: actions/checkout@v4
      - uses: W3OSC/depenemy-action@v1
        with:
          token: ${{ secrets.GITHUB_TOKEN }}
          fail-on: error
```

**Pre-commit hook** — block high-severity findings before they're committed:

```yaml
# .pre-commit-config.yaml
repos:
  - repo: https://github.com/W3OSC/depenemy
    rev: v0.1.4
    hooks:
      - id: depenemy
```

Thresholds, per-rule severities, and ignores are configured in a `.depenemy.yml` at the repository root, so teams can tune checks (e.g. for internal packages) without disabling scanning.

- [ ] **PR Gate**: Depenemy runs on every pull request with `--fail-on error`
- [ ] **Scheduled Scan**: Depenemy runs on a schedule against default branches to catch new advisories on existing pins
- [ ] **Tuned Config**: A committed `.depenemy.yml` documents every ignored rule with a reason

### 🤖 GitHub Dependabot

W3OS recommends Dependabot for all teams hosting on GitHub — with an important distinction between its **alerting** and its **automatic update** features:

- [ ] **Dependency Graph**: **Enabled** on all repositories
- [ ] **Dependabot Alerts**: **Enabled** on all repositories — this is your baseline notification channel for known-vulnerable dependencies
- [ ] **Alert Access**: Restricted to admins and the people who triage them
- [ ] **Automatic Update PRs**: **Disabled** by default (security updates, grouped updates, and version updates) — automatic PRs pull newly-published versions on the attacker's timeline, and normalize a merge-without-reading culture around dependency changes
- [ ] **If Version Updates Are Used**: Configure a [`cooldown`](https://docs.github.com/en/code-security/dependabot/working-with-dependabot/dependabot-options-reference#cooldown-) period (≥ 7 days) in `dependabot.yml`, require human review on every PR, and never enable auto-merge

This matches the W3OS [GitHub configuration guide](<account configurations/organizations/devops-accounts/github.md>): alerts tell you *what* needs updating; the update itself should go through your deliberate, reviewed update process above.

### 🔧 Ecosystem-Native Tools

Layer these alongside depenemy and Dependabot where they fit your stack:

- **npm / Node.js**: `npm audit` for advisories; `ignore-scripts=true` in `.npmrc`; `npm ci` in CI; pnpm's `minimumReleaseAge` for enforced cooldown
- **Python**: [pip-audit](https://github.com/pypa/pip-audit) for advisories; hash-pinned requirements with `pip install --require-hashes`; prefer `uv`/`poetry` lockfiles
- **Rust**: [cargo-audit](https://github.com/rustsec/rustsec) against the RustSec database; [cargo-deny](https://github.com/EmbarkStudios/cargo-deny) for policy enforcement; [cargo-vet](https://github.com/mozilla/cargo-vet) to require audits for new dependencies
- **Cross-ecosystem**: [osv-scanner](https://github.com/google/osv-scanner) for OSV advisory coverage across lockfiles

---

## Ecosystem Notes for Web3 Projects

**JavaScript / TypeScript frontends**
- [ ] Frontend dependency compromise ships directly to users — apply the strictest pinning, cooldown, and review here, not the loosest
- [ ] Use Subresource Integrity for any scripts loaded from CDNs, and avoid third-party scripts on transaction-signing pages entirely
- [ ] Verify wallet-adjacent packages (wallet adapters, signing libraries, address utilities) with extra care — they are the most-typosquatted category in Web3

**Solidity / smart contract repos**
- [ ] Foundry: pin dependencies to exact commit hashes (git submodules or `foundry.toml` with locked tags), never floating branches like `master`
- [ ] Hardhat and Foundry-with-npm setups inherit the full npm threat model — everything in this guide applies to your contracts repo, not just your frontend
- [ ] Vendored/audited contract dependencies (e.g. OpenZeppelin) must be updated deliberately and re-reviewed — a dependency bump in contracts can change what you deploy on-chain

**CI/CD**
- [ ] Dependency installation runs in CI jobs with the minimum secrets possible — build steps that run third-party code should not have access to deployment credentials or signing keys (see the [Deployments & Infrastructure Guide](deployments-infra-access-control.md))
- [ ] Pin GitHub Actions to full commit SHAs, not tags — actions are dependencies too
- [ ] Fork PRs must never run workflows with secret access without approval

---

## Responding to a Compromised Dependency

When a dependency you use is reported malicious or compromised, treat it as an active incident (see the [Incident Response Readiness Guide](incident-response-readiness.md)):

- [ ] **Confirm Exposure**: Check lockfiles across all repos and branches to determine whether the affected versions were ever resolved and installed — the advisory's version range vs. your pinned versions decides everything
- [ ] **Freeze the Pipeline**: Pause deploys and CI for affected repos until the dependency is removed or pinned to a clean version
- [ ] **Assume Execution**: If an affected version was installed anywhere, assume its code ran — on developer machines, in CI, or in production builds
- [ ] **Rotate Exposed Secrets**: Rotate credentials available to any environment that installed the package: CI secrets, cloud credentials, npm/PyPI publish tokens, and API keys. Treat any hot wallet keys that touched an affected machine as compromised and migrate funds
- [ ] **Audit Published Artifacts**: Check whether affected versions were bundled into anything you shipped — frontend builds, published packages, or container images — and pull/rebuild them
- [ ] **Rebuild Environments**: Wipe and rebuild developer environments and CI runners that installed affected versions rather than trying to clean them
- [ ] **Communicate**: If users may have interacted with a compromised frontend, notify them immediately through verified channels with concrete guidance (revoke approvals, migrate funds)
- [ ] **Post-Incident**: Record how the dependency got in and which lifecycle control failed, then fix that control — cooldown, review depth, pinning, or monitoring

---

## Related W3OS Requirements

This guide implements the supply chain controls from [Domain 4: DevOps & Infrastructure](../requirements/04-devops-infrastructure.md):

- **SP-DI-005** — Package Verification and Integrity
- **SP-DI-006** — Typosquatting Detection and Prevention
- **SP-DI-007** — Dependency Management and Scanning

addressing risks R-DI-003 (Supply Chain Attacks Through Dependencies), R-DI-010 (Compromised Software Dependencies and Packages), and R-DI-011 (Typosquatting and Package Name Confusion Attacks).
