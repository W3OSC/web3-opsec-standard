<!--
id: whatsapp-individual-configuration
type: CONFIGURATION
scope: INDIVIDUAL
-->

<div align="center"> <img src="../../../../images/guides/whatsapp.svg" alt="WhatsApp Logo" width="64" height="64"> <h2><a href="https://www.whatsapp.com/" target="_blank" rel="noopener noreferrer">WhatsApp</a> Configuration Guide</h2> </div>

> WhatsApp is appropriate for personal and external contact, **not** for organization-confidential coordination. Use Signal for sensitive discussion per your organization's encrypted communications requirement (SP-CS-003).

## Account Security

- [ ]  Settings > Account > **Two-step verification** > **On** with a PIN you do not use elsewhere
    - [ ]  Without this, anyone who obtains your phone number via SIM swap can register your account on their device (SP-GS-013)
- [ ]  Add a recovery **email address** to the two-step verification so a forgotten PIN does not lock you out permanently
- [ ]  Enable **passkey** login where available in place of SMS-code re-registration
- [ ]  Apply a carrier port-freeze / account PIN with your mobile provider (see [Mobile Security](../../../mobile-security.md))

## Privacy Settings

- [ ]  Settings > Privacy > **Profile photo** > My contacts (or Nobody) - profile photos are harvested to build convincing impersonation accounts
- [ ]  Settings > Privacy > **Last seen & online**, **About** > My contacts
- [ ]  Settings > Privacy > **Groups** > **My contacts** or "My contacts except..." - this blocks the scam-group mass-add technique
- [ ]  Settings > Privacy > **Read receipts** > Consider disabling
- [ ]  Settings > Privacy > **Default message timer** > Enable disappearing messages for sensitive conversations
- [ ]  Settings > Privacy > **Advanced** > Enable IP address protection in calls if you do not want your address exposed to contacts

## Device & Session Hygiene

- [ ]  Settings > **Linked devices** > Review regularly and remove anything unrecognized
    - [ ]  A linked device reads your message history - this is the primary account-takeover path and it does not require your phone
- [ ]  Never link WhatsApp Web on a shared, public, or untrusted machine
- [ ]  Log out of linked devices you use infrequently rather than leaving sessions open
- [ ]  Protect the phone itself with a strong passcode, auto-lock, and remote wipe (SP-EP-003)

## Backup Security

- [ ]  Settings > Chats > Chat backup > **End-to-end encrypted backup** > **On**, with a strong password or 64-digit key stored in your password manager
    - [ ]  Default cloud backups are **not** end-to-end encrypted - they are readable by the cloud provider and by anyone who compromises that account
- [ ]  Alternatively disable chat backup entirely if the history is sensitive
- [ ]  Ensure the linked cloud account (Google/Apple) is itself protected with hardware-key MFA

## Social Engineering Defense

- [ ]  **Never share a 6-digit registration code** with anyone - the "I accidentally sent you my code" request is always an account-takeover attempt
- [ ]  Verify unexpected requests - especially anything financial or urgent - through a second, known channel before acting (SP-CS-005)
- [ ]  Treat contact from "support", exchange staff, or a colleague's new number as unverified until confirmed independently (SP-GS-006)
- [ ]  Enable and check **security code change notifications** for sensitive contacts; an unexpected change can indicate account takeover or interception
- [ ]  Be aware that profile photos and names are trivially cloned - impersonation of your own executives is a standard attack against your team and community
