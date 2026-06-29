<!--
id: hermes-individual-configuration
type: CONFIGURATION
scope: INDIVIDUAL
-->

<div align="center"> <h2><a href="https://hermes-agent.nousresearch.com" target="_blank" rel="noopener noreferrer">Hermes</a> Configuration Guide</h2> </div>

> Hermes is an autonomous AI agent by NousResearch with file-system, shell, and MCP access. Its built-in security model has seven layers - user authorization, dangerous command approval, container isolation, MCP credential filtering, context file scanning, cross-session isolation, and input sanitization. The checklist below ensures those layers are correctly configured. Reference: [Hermes Security Docs](https://hermes-agent.nousresearch.com/docs/user-guide/security).

---

## Dangerous Command Approval (`~/.hermes/config.yaml`)

- [ ] Set `approvals.mode: manual` - never use `smart` (auto-approve) or `off` (YOLO) in production environments
- [ ] Keep `cron_mode: deny` (default) - headless cron jobs should be blocked from auto-approving dangerous commands
- [ ] Keep `mcp_reload_confirm: true` - require confirmation before rebuilding the MCP tool set
- [ ] Keep `destructive_slash_confirm: true` - require confirmation before destructive session commands (`/clear`, `/reset`, `/undo`)
- [ ] Set a reasonable `timeout` (default 60 s) - on timeout the command is **denied** by default; do not extend it unnecessarily

---

## YOLO Mode - Keep Off

- [ ] **Never** start sessions with `hermes --yolo` or `hermes chat --yolo` on machines with real data or credentials
- [ ] Do not set `HERMES_YOLO_MODE=1` in any persistent shell profile or `.env` file
- [ ] Treat any session where `/yolo` was toggled on as untrusted - restart a clean session before performing sensitive operations

---

## Permanent Allowlist Review (`~/.hermes/config.yaml`)

- [ ] Audit `command_allowlist` entries regularly - entries added via "always approve" bypass future approval prompts permanently
- [ ] Remove any allowlist entries that are no longer required
- [ ] Use `hermes config edit` to review the allowlist before sharing a machine or transferring ownership

---

## Container Isolation

- [ ] Run Hermes inside a **Docker, Singularity, or Modal** container for any task involving untrusted code, files, or MCP servers
- [ ] Verify the container backend is active - dangerous-command checks are relaxed inside containers because the container is the security boundary; confirm your container is actually sandboxed
- [ ] Do not mount host sensitive directories (e.g. `~/.ssh`, `~/.hermes`) into agent containers

---

## MCP Credential Filtering

- [ ] Confirm that MCP subprocesses receive only the environment variables they need - Hermes filters credentials by default, but verify no `_ALL_ENVS` override is set
- [ ] Never store production private keys or mnemonics in `~/.hermes/.env` - use a secrets manager and inject only at runtime

---

## Context File Scanning (Prompt Injection)

- [ ] Ensure context file scanning is enabled (default) - this detects prompt injection attempts in project files before they reach the model
- [ ] Treat any project file from an untrusted source as potentially malicious; review scan warnings before proceeding

---

## User Authorization (Gateway)

- [ ] Configure explicit **platform allowlists** in `~/.hermes/.env` (e.g. `TELEGRAM_ALLOWED_USERS`, `DISCORD_ALLOWED_USERS`) - do not rely on `GATEWAY_ALLOW_ALL_USERS=true` outside of private, single-user deployments
- [ ] Prefer **DM pairing** over open allowlists when deploying the gateway for a team - approve pairing codes via `hermes pairing approve <platform> <code>`
- [ ] Periodically audit approved users with `hermes pairing list` and revoke stale entries with `hermes pairing revoke`
- [ ] Set `unauthorized_dm_behavior: ignore` on high-noise platforms (e.g. email, WhatsApp) to suppress unsolicited pairing requests

---

## Credentials & Secrets

- [ ] Keep `~/.hermes/.env` permissions at `0600` - Hermes enforces this but verify after any manual edits
- [ ] Do not commit `~/.hermes/config.yaml` or `~/.hermes/.env` to version control
- [ ] Rotate any API keys or tokens that were ever stored in plain text in the Hermes config directory
