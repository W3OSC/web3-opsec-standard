<!--
id: tailscale-organization-configuration
type: CONFIGURATION
scope: ORGANIZATION
-->

<div align="center">
  <img src="../../../../images/guides/tailscale.svg" alt="Tailscale Logo" width="64" height="64">
  <h2><a href="https://tailscale.com/" target="_blank" rel="noopener noreferrer">Tailscale</a> Configuration Guide</h2>
</div>

## Admin Console Settings

#### Identity & Access
- [ ]  Sign in with your organization's SSO identity provider (Okta/Entra/Google) > require **hardware security keys** for authentication at the IdP level (Tailscale inherits the IdP's authentication strength)
- [ ]  Assign admin roles on a least-privilege basis > use scoped roles (Network admin, IT admin, Auditor) instead of granting full **Admin/Owner** to everyone
- [ ]  Keep the Owner/Admin count to the minimum needed (2–3 for redundancy, never one, never everyone)
- [ ]  Remove departed users the **same day** > suspend/delete the user in the admin console *and* verify all of their devices are removed from the tailnet (deleting the IdP account alone does not immediately kill active node keys)
- [ ]  Review the user list on a set cadence and remove stale or unrecognized accounts

#### ACL Policy
- [ ]  Replace the default allow-all policy > write an explicit `acls` policy where anything not listed is **denied** (Tailscale is default-deny once any ACL exists — never ship the permissive starter policy)
- [ ]  Remove any broad `"src": ["*"], "dst": ["*:*"]` rules > every rule should name specific groups, tags, and ports
- [ ]  Define access with **groups** (`group:eng`, `group:ops`) mapped from your IdP rather than listing individual user emails
- [ ]  Gate server access with **tags** (`tag:prod`, `tag:ci`) and restrict who may apply each tag via `tagOwners`
- [ ]  Manage the policy file in version control with **GitOps** (e.g., `gitops-pusher` in CI) > all changes go through pull-request review, no direct console edits
- [ ]  Use `tests` blocks in the policy file to assert critical allow/deny expectations so regressions fail CI

#### Device Management
- [ ]  Settings > Device management > Device approval > **Required** > every new device must be manually approved by an admin before joining the tailnet
- [ ]  Keep **key expiry enabled** for all user devices (do not disable expiry as a convenience) so lost or stolen devices age out automatically
- [ ]  For tagged servers (which do not expire by default) > document a node key rotation plan and rotate on a set cadence or via ephemeral/pre-authorized keys with short expiry
- [ ]  Review the Machines list on a set cadence > remove stale, duplicate, or unrecognized devices immediately
- [ ]  Enable **device posture checking** where available on your plan > require managed/compliant devices (OS version, disk encryption) for access to sensitive tags

#### Network Hardening
- [ ]  Disable or reject **subnet routes** unless explicitly needed > approve only the specific routes required, and scope who can reach them in the ACL policy
- [ ]  Restrict **exit nodes** > approve only designated, hardened machines as exit nodes and limit who may use them via `autogroup:internet` rules
- [ ]  If using **Tailscale SSH** > gate sensitive destinations with `"action": "check"` (re-authentication) and enable **session recording** for privileged hosts where available
- [ ]  Keep **MagicDNS** enabled for consistent naming, and enable **HTTPS certificates** only if needed > note that cert issuance publishes machine names to public Certificate Transparency logs, so avoid sensitive hostnames

#### Sharing & External Access
- [ ]  Review all **node sharing** invites on a set cadence > remove shares that are no longer needed and keep external access time-limited
- [ ]  Never share privileged infrastructure nodes (production servers, CI runners, signing machines) outside the tailnet
- [ ]  Restrict who can create sharing invites, and require an internal approval step before sharing any node externally

#### Logging & Monitoring
- [ ]  Review **configuration audit logs** regularly for ACL changes, role changes, device approvals, and key expiry modifications
- [ ]  Stream audit logs (and **network flow logs** where available on your plan) to your SIEM for retention and correlation
- [ ]  Alert on new device authorizations and new user sign-ins to a monitored channel > investigate any device or user you did not expect
