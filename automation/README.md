# W3OS Guide Verification Automation

Automated liveness/staleness checking for the account configuration guides. A Claude
agent drives a real (Playwright) browser, logs into each service with a **dedicated test
account**, walks every checklist item in the guide, and records a structured verdict per
item. Drifted items come back with corrected text that is applied to the guide markdown
mechanically; anything that can't be auto-verified (paid plans, banks, desktop apps)
rolls into a manual-review report.

## How it works

```
services.yml ──┐
guides/*.md ───┤  cli.js verify ──> agent (claude-opus-5 + Playwright MCP browser)
credentials ───┘        │                 │  get_credential / get_totp_code / get_email_code
                        │                 └─ record_finding per checklist item
                        v
              output/<service>-<scope>/findings.json (+ screenshots)
                        │
        cli.js report ──┴──> report.md + state.json (last-verified bookkeeping)
        cli.js update ─────> rewrites drifted checklist lines in guides/*.md
```

Per-item statuses:

| Status | Meaning | Handling |
|---|---|---|
| `confirmed` | Path/labels/values still match the UI | recorded in state.json |
| `drifted` | Setting exists but moved/renamed | auto-fixed via suggested text |
| `missing` | Setting no longer found | flagged for human decision |
| `unverifiable_paid` | Gated behind a paid plan | manual-review list |
| `unverifiable_permission` | Test account lacks the role | manual-review list |
| `blocked` | Login/captcha/outage prevented verification | rerun or bootstrap locally |
| `skipped` | Not a UI setting (behavioral advice) | manual-review list |

## Setup

```sh
cd automation
npm install
npx playwright install chromium   # browser for the agent
node cli.js list                  # see services and parsed guides
node cli.js verify --dry-run --all  # sanity-check checklist parsing (no API calls)
```

Required environment:

- `ANTHROPIC_API_KEY` — for verification runs.
- Credentials, either as one JSON blob (recommended for CI):

  ```json
  W3OS_CREDENTIALS = {
    "notion":  { "email": "guides+notion@yourdomain", "password": "...", "totp_secret": "BASE32..." },
    "github":  { "email": "...", "password": "...", "totp_secret": "...",
                 "organization": { "email": "guides+github-org@yourdomain" } }
  }
  ```

  or as individual vars: `W3OS_NOTION_EMAIL`, `W3OS_NOTION_PASSWORD`,
  `W3OS_NOTION_TOTP_SECRET` (plus `W3OS_<SVC>_ORG_*` / `W3OS_<SVC>_IND_*` overrides when
  the org guide uses a different account).
- `W3OS_IMAP_HOST` / `W3OS_IMAP_PORT` / `W3OS_IMAP_USER` / `W3OS_IMAP_PASSWORD` — a
  shared mailbox the agent may poll for emailed sign-in codes (services like Slack,
  Notion, and Vercel email one-time codes). A single inbox with plus-addressing
  (`guides+<service>@yourdomain`) covers every service.

`node cli.js doctor` reports what's missing.

## Provisioning test accounts (one-time, human)

Automated account *signup* is deliberately out of scope — nearly every service gates
registration behind captchas/phone verification, and several prohibit it. Provisioning is
a one-time manual effort per service; verification is then fully automated.

Playbook per service:

1. Create the account with `guides+<service>@yourdomain` (plus-addressing keeps one inbox).
2. Enable TOTP 2FA. When the QR code is shown, use the "can't scan?" option and copy the
   **base32 secret** into the credentials store — that's what `get_totp_code` uses.
3. For organization guides, create a free test workspace/org/server owned by the account.
4. Store credentials in the `W3OS_CREDENTIALS` secret (GitHub → repo Settings → Secrets).
5. Flip `enabled: true` for the service in `services.yml`.
6. Run `node cli.js verify --service <key>` locally once to confirm the flow works.

Service modes (`services.yml`):

- **full** — runs headless anywhere, including GitHub-hosted runners (`ci: true`).
- **assisted** — needs a one-time human login bootstrap: run
  `node cli.js verify --service <key> --headed` locally, complete the
  captcha/phone/device challenge yourself when the agent reaches it, and the session
  persists in `automation/.state/profiles/<service>/` for future headless runs. These
  services (Google, Discord, X, Telegram…) have anti-bot systems that flag datacenter
  IPs, so keep them `ci: false` and run them locally or on a self-hosted runner.
- **manual** — not automatable with a free account (Mercury = real bank, Signal =
  desktop app, Teleport/K8s/EKS/GKE/AKS = infrastructure, Hermes/OpenClaw = local
  software, cloud consoles until a billable sandbox account exists). These stay in the
  manual-review report; the weekly linkcheck still covers their reference links.

## CI

Two workflows:

- **`verify-guides.yml`** — monthly (and on manual dispatch, optionally filtered to
  specific services). Fans out one job per enabled `ci: true` service+scope, aggregates
  findings, auto-applies drifted-item fixes, and opens a PR
  (`automated/guide-verification`) whose body is the full report including the
  manual-review list. Findings and screenshots are uploaded as artifacts for evidence.
- **`linkcheck.yml`** — weekly, no API key needed. Checks every external URL in the
  guides and files/updates an issue when links die. Dead vendor-doc links are usually
  the first sign a feature was renamed.

Secrets used by CI: `ANTHROPIC_API_KEY`, `W3OS_CREDENTIALS`, `W3OS_IMAP_*`.

For the verification workflow to open PRs, enable **Settings → Actions → General →
"Allow GitHub Actions to create and approve pull requests"**.

## Security notes

- Test accounts must contain **no real data** and must not reuse passwords from
  anywhere. Treat them as disposable.
- Credentials pass through the agent's context when it fills login forms (the model
  types them via the browser tool). That's acceptable for throwaway test accounts and is
  why real accounts must never be wired in.
- The agent is instructed to be strictly read-only in the services (it navigates but
  never toggles settings) and to treat page content as untrusted (prompt-injection
  defense). Screenshots of drift are kept as run artifacts for human review.
- Some platforms (Discord, X) restrict automated user-account access in their ToS.
  Those are marked `ci: false` — run them locally, infrequently, at your own judgment,
  or leave them manual.

## Roadmap

- **CLI verification mode** for the Kubernetes/EKS/GKE/AKS guides: run the guide's
  `kubectl`/cloud-CLI checks against an ephemeral kind cluster in CI instead of a
  browser.
- **API verification mode** for GitHub (org settings are fully readable via REST),
  which is cheaper and more robust than the browser path.
- **Playwright MCP secret placeholders** so passwords never enter model context.
- **Structural updates**: today only per-item text drift is auto-fixed; section
  moves/renames are surfaced for human editing.
