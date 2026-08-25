<!--
id: linkedin-organization-configuration
type: CONFIGURATION
scope: ORGANIZATION
-->

<div align="center"> <img src="../../../../images/guides/linkedin.svg" alt="LinkedIn Logo" width="64" height="64"> <h2><a href="https://www.linkedin.com/" target="_blank" rel="noopener noreferrer">LinkedIn</a> Configuration Guide</h2> </div>

> LinkedIn is the primary surface for two web3 attack patterns: **fake recruiters** targeting your team with interview malware, and **fake candidates** (including DPRK IT workers) targeting your open roles. Pair this guide with [Hiring Security](../../../hiring-security.md) and [Job Scam Defense](../../../job-scam-defense.md).

## Account Security

- [ ]  Settings > Sign in & security > **Two-step verification** > On (authenticator app, not SMS)
- [ ]  Unique, password-manager-generated password per user (SP-GS-008)
- [ ]  Register company page admin accounts to organization email addresses
- [ ]  Settings > Sign in & security > **Where you're signed in** > Review active sessions and sign out anything unrecognized
- [ ]  Settings > Data privacy > Review permitted third-party services and revoke unused connections

## Company Page Administration

- [ ]  Company page > Admin tools > Manage admins > Keep **Super admin** count to the minimum needed for continuity
- [ ]  Assign narrower roles (Content admin, Curator, Recruiting poster) rather than Super admin by default (SP-GS-010)
- [ ]  Remove departed employees from page admin roles the same day (SP-GS-024)
- [ ]  Verify the admin list quarterly against the account inventory (SP-GS-020) - stale page admins are a common oversight because the page is not treated as a system
- [ ]  Ensure at least two current employees hold Super admin so the page cannot be orphaned

## Employee Guidance

Distribute these as expectations to team members, particularly those with privileged access:

- [ ]  Limit public role detail that aids targeting - titles such as "treasury operations" or "multisig signer" identify exactly whom to attack (supports [Digital Footprint](../../../digital-footprint.md))
- [ ]  Consider disabling **Open to work** visibility for personnel in sensitive roles; it materially increases recruiter-pretext contact
- [ ]  Verify any recruiter or business-development InMail through the company's official domain before engaging - never through links or contact details in the message itself (SP-CS-005)
- [ ]  Never run take-home coding assignments, "demo repos", or installers received via LinkedIn on a work device (SP-EP-010)
- [ ]  Decline unknown connection requests - a connection grants direct messaging access used to deliver the next stage of the attack
- [ ]  Report suspected fake recruiters to the security owner so patterns can be tracked across the team (SP-GS-007)

## Data Exposure Controls

- [ ]  Individual settings > Visibility > **Profile viewing options**, **connections list visibility** > Private
- [ ]  Individual settings > Visibility > Email address visibility > Restrict to 1st-degree or off
- [ ]  Advise staff that the employee list attached to the company page is a ready-made target list for spear-phishing (R-CS-007) - encourage minimal public detail rather than page-level obscurity, which LinkedIn does not fully support
- [ ]  Avoid publishing organization chart detail, vendor names, and internal tooling in public posts and job descriptions

## Impersonation Monitoring

- [ ]  Monitor for **fake company pages** using your brand and report them via LinkedIn's impersonation reporting flow
- [ ]  Monitor for **fake executive and recruiter profiles** using your team's names and photos - these are used to lend credibility to scams aimed at your community and counterparties
- [ ]  Include LinkedIn impersonation in the social account takeover runbook, and warn the community through independent channels when a convincing impersonation is active (SP-CS-008)
