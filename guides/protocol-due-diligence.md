<!--
id: protocol-due-diligence-organization-guide
type: GUIDE
scope: ORGANIZATION
-->

# Protocol Due Diligence Guide

*A rubric for vetting a protocol before deploying treasury funds into it*

---

## Overview

Most treasury losses in DeFi are not caused by novel zero-days — they are caused by deploying funds into protocols whose risks were knowable in advance: an admin EOA that could upgrade the contracts at will, an audit that covered different code than what was deployed, an oracle with a single point of failure, or a team that had already mishandled one incident. Due diligence is the discipline of answering those questions *before* capital is at risk, and recording the answers so the decision can be reviewed, challenged, and refreshed.

This guide provides the vetting rubric that supports requirement SP-FC-020 (Protocol Due Diligence for Treasury Deployments). It draws on the assessment approaches used by Digibastion's DeFi category and DeFiSafety's process-quality reviews: score what is observable and documented, not what is promised. Complete every section for each protocol before the first deposit, keep the completed rubric with your treasury records, and refresh it before any increase in exposure. Transaction-level controls for actually moving the funds are covered separately in the [Transaction Verification Guide](./transaction-verification.md) and the [Multi-Sig Operations and Ideal Setup Guide](./multisig-ideal-setup.md).

---

## Security Assessment

- [ ] **Independent audits exist and are relevant**:
  - [ ] At least two independent audits from reputable firms for any protocol receiving significant treasury exposure
  - [ ] Audit recency: the most recent audit covers the currently deployed version — an audit of v1 says little about v3
  - [ ] Audit scope matches the deployed code: verify the audited commit/contracts correspond to the on-chain deployment, not just the repository
  - [ ] Firm quality: auditors have a track record with this protocol category (AMMs, lending, bridges are different specialties)
  - [ ] Findings were remediated: high/critical findings are fixed and re-reviewed, not merely "acknowledged"
- [ ] **Additional review coverage** *(bonus signal)*: Audit competitions (Code4rena, Sherlock, Cantina) and formal verification add independent eyes beyond traditional audits
- [ ] **Bug bounty is live and proportionate**:
  - [ ] Active bounty program (e.g. Immunefi) with a maximum payout meaningful relative to TVL — a $50k cap on a $500M protocol signals the team has not priced its own risk
  - [ ] Bounty scope covers the deployed contracts, not just the website
- [ ] **Time in production**: Prefer protocols with a meaningful unexploited track record at meaningful TVL — code that has held nine figures for two years has survived tests no audit can simulate
- [ ] **Historical incidents and response quality**:
  - [ ] Search for past exploits, near-misses, and white-hat disclosures involving the protocol or its team
  - [ ] If incidents occurred, evaluate the response: speed of disclosure, quality of post-mortem, whether users were made whole, and what structurally changed afterwards
  - [ ] A protocol with one well-handled incident can be a better risk than one with no history and no process

---

## Admin Control Assessment

💡 **You are not just trusting the code — you are trusting everyone who can change the code. Admin key structure is frequently the single largest risk factor and the least examined.**

- [ ] **Identify every privileged role**: Enumerate owners, admins, guardians, and pausers on the actual deployed contracts and determine who holds each
- [ ] **Verify claims on-chain, not in docs**: Confirm the actual owner addresses, timelock delay, and proxy admin via the block explorer or a governance scanner — documentation drifts, chains do not
- [ ] **Admin key structure**:
  - [ ] EOA admin over user funds: treat as close to disqualifying for significant exposure
  - [ ] Multisig admin: check threshold, signer count, and whether signers are independent identified parties or anonymous/overlapping
  - [ ] Timelock-gated admin: the strongest common pattern — verify the timelock actually sits in front of the dangerous functions, not just some of them
- [ ] **Upgradeability**:
  - [ ] Determine whether contracts are upgradeable (proxy patterns, upgrade functions) and exactly who can trigger an upgrade
  - [ ] Non-upgradeable (immutable) contracts remove an entire risk class; upgradeable contracts inherit the full risk of their admin structure
- [ ] **Pause and emergency powers**: Identify who can pause, freeze, or block withdrawals — pause powers protect the protocol but can also trap your funds; know both edges
- [ ] **Timelock duration vs your exit time**: Verify the timelock delay on upgrades/parameter changes is LONGER than the time your organization realistically needs to detect the event and fully withdraw — a 24h timelock is worthless if your own approval process takes three days to execute an exit

---

## Operational Maturity

- [ ] **Team transparency**: The people behind the protocol can be identified and evaluated
  - [ ] Core team publicly identified, or credibly known to reputable investors and auditors with skin in the game
  - [ ] Track record checkable: prior projects, prior incidents, prior failures — fully anonymous teams cap the exposure a treasury should accept
- [ ] **Monitoring and alerting evidence**: The protocol demonstrates active monitoring (public status/monitoring pages, incident detection in past post-mortems, monitoring partners) rather than relying on Twitter to learn about its own exploits
- [ ] **Incident response readiness**: A published security contact, disclosure policy, and ideally an emergency-response runbook — you are evaluating how they will behave during YOUR worst day
- [ ] **Documentation quality**: Technical docs accurately describe the deployed system, including admin powers and risk parameters — vague or marketing-only docs are a process signal, not just an inconvenience
- [ ] **Deployed-code verification**: All contracts holding or touching funds are source-verified on the block explorer, and the verified source corresponds to the audited repository
- [ ] **Development practices**: Public repository activity, tests, and a documented release/upgrade process — a protocol that ships unreviewed hotfixes to mainnet will eventually ship a bad one

---

## Market & Dependency Risk

- [ ] **TVL history and concentration**:
  - [ ] TVL is established and reasonably stable — a spike-shaped TVL chart driven by incentives can vanish faster than you can exit
  - [ ] Check depositor concentration: if a few whales dominate TVL, their exit changes pool economics and your exit liquidity overnight
  - [ ] Your planned position should be a small fraction of pool liquidity so exit is possible without unacceptable slippage
- [ ] **Oracle dependencies**: Identify every price feed the protocol depends on
  - [ ] Provider and design: Chainlink-style push feeds, TWAPs, and custom oracles each fail differently
  - [ ] Staleness and manipulation behavior: what happens on a stale, frozen, or manipulated price — oracle failure is a top historical loss cause
- [ ] **Bridge exposure**: If the deployment or its assets depend on a bridge (bridged collateral, cross-chain messaging), you inherit that bridge's full risk — assess it as a separate protocol under this same rubric
- [ ] **Composability risk**: Enumerate the protocols this protocol builds on (yield sources, restaking layers, wrapped assets) — your real exposure is the UNION of every layer's risk, and the weakest layer prices the whole position
- [ ] **Asset risk**: Assess the deposited assets themselves (stablecoin depeg history, issuer freeze/blacklist powers, rebasing behavior) — protocol risk and asset risk compound
- [ ] **Chain risk**: Factor in the deployment chain itself — sequencer centralization, upgrade keys on the rollup, and bridge-dependent canonical assets on L2s
- [ ] **Token/economic design**: If returns depend on emissions of the protocol's own token, model what happens to the position when emissions or the token price fall

---

## Ongoing Position Monitoring

Due diligence is not a one-time gate — SP-FC-020 requires deployed positions to be monitored and re-assessed continuously.

- [ ] **Exposure caps per protocol**: Set a documented maximum exposure per protocol at approval time
  - [ ] Express caps both in absolute terms and as a percentage of liquid treasury
  - [ ] Exceeding a cap requires a refreshed rubric and documented approval — not just a bigger transfer
- [ ] **Assign an owner per position**: Every deployed position has a named owner responsible for monitoring alerts and triggering re-review — unowned positions are unmonitored positions
- [ ] **Alerts on governance and upgrade events**: Subscribe to on-chain alerts for the protocol's timelock, proxy admin, and governance contracts
  - [ ] Any queued upgrade or parameter change must page the position owner within the timelock window — the timelock only protects you if someone is watching it
- [ ] **Security incident feeds**: Monitor the protocol's official channels and security aggregators for incidents affecting the protocol or its dependencies
- [ ] **Track realized vs expected yield**: Returns materially above the protocol's stated mechanics are a risk signal to investigate, not a windfall
- [ ] **Periodic re-review triggers**: Refresh the full rubric on a schedule (at least annually) and immediately upon any of: a completed upgrade, admin/multisig membership change, audit of a new version, TVL drop beyond a set threshold, an incident in a dependency, or before ANY increase in exposure
- [ ] **Exit criteria defined in advance**: Document the conditions under which the position is unwound (e.g. timelock shortened, admin structure weakened, oracle changed) so the exit decision is mechanical, not a debate under pressure

---

## Scoring the Rubric

Keep scoring simple enough that it actually gets used. Grade each of the five sections above **Pass / Concern / Fail**, then apply the overall outcome:

| Outcome | Criteria | Effect |
| --- | --- | --- |
| **PASS** | All five sections Pass, or at most one Concern with a documented compensating control | Eligible for deployment up to the standard exposure cap |
| **CONDITIONAL** | Up to two Concerns, no Fails | Reduced exposure cap; concerns, compensating controls, and a re-review date recorded with a named owner |
| **FAIL** | Any section graded Fail — notably an EOA admin over funds, no relevant audit of the deployed code, or a timelock shorter than your exit time | No deployment until the failing condition is remediated and the rubric is re-run |

- [ ] Grade all five sections before debating the overall outcome, so one strong section does not halo a weak one
- [ ] Have the rubric completed by someone other than the person proposing the deployment
- [ ] File the completed rubric with treasury records, including evidence links (audit reports, contract addresses checked, TVL snapshots) — the artifact is what turns "we looked at it" into due diligence
- [ ] Set the re-review date at approval time, on a calendar owned by the position owner
- [ ] Never let deployment urgency compress the rubric — a yield opportunity that cannot wait for due diligence is itself a Fail signal
