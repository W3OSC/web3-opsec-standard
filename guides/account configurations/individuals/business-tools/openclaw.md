<!--
id: openclaw-individual-configuration
type: CONFIGURATION
scope: INDIVIDUAL
-->

<div align="center"> <img src="../../../../images/guides/openclaw.svg" alt="OpenClaw Logo" width="64" height="64"> <h2><a href="https://github.com/openclaw/openclaw" target="_blank" rel="noopener noreferrer">OpenClaw</a> Configuration Guide</h2> </div>

> OpenClaw is a high-privilege autonomous AI agent that runs with terminal/root-level access and continuously installs Skills, MCPs, scripts, and tools. This expansive capability surface creates serious risks - prompt injection, supply chain poisoning, destructive operations, and business-logic abuse. The checklist below is derived from the [SlowMist OpenClaw Security Practice Guide](https://github.com/slowmist/openclaw-security-practice-guide).

---

## Model Selection

- [ ] Use a **strong, latest-generation reasoning model** (e.g. Gemini, Claude Opus, Kimi, MiniMax families) - weaker models misclassify red-line commands, defeating all behavioral controls

---

## Deploy the Security Guide to OpenClaw

- [ ] Download the latest guide from the [SlowMist repo](https://github.com/slowmist/openclaw-security-practice-guide) (use **v2.8 Beta** for OpenClaw ≥ 2026.4, **v2.7** for older versions)
- [ ] Drop the guide markdown file directly into chat and ask OpenClaw to evaluate it for conflicts with the current setup before deploying
- [ ] Issue the deployment command and confirm the agent reports a successful defense-matrix deployment
- [ ] Optionally run the [Red Teaming / Validation Guide](https://github.com/slowmist/openclaw-security-practice-guide/blob/main/docs/Validation-Guide-en.md) to verify the agent correctly blocks red-line operations

---

## Behavioral Blacklists (Red & Yellow Lines)

- [ ] Confirm red-line rules are active - the agent must **halt and require explicit human approval** for any irreversible or destructive operation (e.g. `rm -rf`, mass-delete, credential export)
- [ ] Confirm yellow-line rules are active - high-risk but potentially legitimate actions (e.g. permission changes, service restarts) must be flagged before execution
- [ ] Test that the agent refuses to bypass its own red-line rules even when instructed to in a new chat message

---

## Anti-Supply Chain Poisoning (Skill / MCP Installation)

- [ ] Enable the **Skill/MCP installation audit protocol** - every new Skill, MCP, or script must be reviewed for suspicious instructions, network callbacks, or credential access before installation
- [ ] Require OpenClaw to perform a **secondary download detection** check (looking for any unexpected file fetches embedded in Skill logic)
- [ ] Restrict Skill sources to known, trusted registries; reject unsigned or unverifiable packages

---

## Permission Narrowing

- [ ] Run OpenClaw in the **least-privilege environment** that supports your workflow - avoid persistent root sessions
- [ ] Enable **Cross-Skill pre-flight checks** so OpenClaw validates that a requested action does not exceed its current permission scope before executing
- [ ] Disable any capabilities (filesystem write, network egress, etc.) that are not required for the active task

---

## Nightly Automated Audit (Cron Job)

- [ ] Deploy the nightly audit cron job as described in the guide - it should cover **all 13 core metrics** and produce **explicit output for healthy states** (not just failures)
- [ ] Configure the `--light-context` flag for the audit cron to prevent workspace context from hijacking the isolated audit session
- [ ] Set report output path to `$OC/security-reports/` (not `/tmp`) with 30-day rotation so reports survive reboots
- [ ] Schedule a regular review of the audit reports

---

## Disaster Recovery

- [ ] Enable **Brain Git backup** so OpenClaw's configuration and memory can be restored after an incident
- [ ] Test restoration from backup at least once to confirm it works
- [ ] Store backup credentials separately from the machine OpenClaw runs on

---

## Post-Upgrade Maintenance

- [ ] After any OpenClaw engine upgrade, **rebuild hash baselines** following the post-upgrade workflow in the guide before resuming autonomous operation
- [ ] Re-run validation drills after each upgrade to confirm defenses remain intact
