<!--
id: zoom-organization-configuration
type: CONFIGURATION
scope: ORGANIZATION
-->

<div align="center"> <img src="../../../../images/guides/zoom.svg" alt="Zoom Logo" width="64" height="64"> <h2><a href="https://zoom.us/" target="_blank" rel="noopener noreferrer">Zoom</a> Configuration Guide</h2> </div>

## Account Security

#### Sign-in Settings
- Advanced > Security (admin.zoom.us/account/setting?tab=security)
    - [ ]  Sign in with two-factor authentication > **On** [[1]](#sso-2fa)
        - [ ]  Authentication methods > **Authentication app only**
    - [ ]  Only allow users to sign in with SSO > **On** (if your organization has an identity provider)
        - [ ]  Allow users to sign in with specified domains > Restrict to your organization's domain
    - [ ]  Sign-in password requirements > Set to maximum length and complexity available
    - [ ]  Automatically sign users out after a specified time > **On**

#### Member Management
- User Management > Users (admin.zoom.us/account/user)
    - [ ]  Review user list and remove departed members or unrecognized accounts
    - [ ]  Review Role for each user > Limit **Admin** and **Owner** roles to the minimum necessary

## Remote Control Lockdown [[2]](#elusive-comet)

#### Disable Remote Control
- Account Management > Account Settings > Meeting (admin.zoom.us/account/setting)
    - **In Meeting (Basic) >**
        - [ ]  Remote control > **Off**
            - [ ]  Lock the setting so users and groups cannot re-enable it
    - **In Meeting (Support) >**
        - [ ]  Remote support > **Off**
            - [ ]  Lock the setting so users and groups cannot re-enable it
    - **In Meeting (Advanced) >**
        - [ ]  Far end camera control > **Off**
            - [ ]  Auto-accept far end camera control > **Off**

## Meeting Security

#### Access Controls
- Account Management > Account Settings > Meeting > Security
    - [ ]  Waiting Room > **On**
        - [ ]  Waiting Room Options > **Everyone** (or at minimum users not in your account)
    - [ ]  Require a passcode when scheduling new meetings > **On**
    - [ ]  Require a passcode for instant meetings > **On**
    - [ ]  Embed passcode in invite link for one-click join > **Off** for sensitive meetings
    - [ ]  Only authenticated users can join meetings > **On** for internal meetings
        - [ ]  Authentication options > Restrict to your organization's domain
    - [ ]  Host can lock the meeting > Ensure hosts are trained to use **Lock Meeting** once all participants have joined

#### Watermarking
- Account Management > Account Settings > Meeting > Security
    - [ ]  Add watermark > **On** for meetings covering sensitive material (key ceremonies, treasury operations, incident response)
    - [ ]  Add audio watermark > **On** for the same meeting categories

## In-Meeting Restrictions

#### Content Sharing
- Account Management > Account Settings > Meeting > In Meeting (Basic)
    - [ ]  Send files via meeting chat > **Off** (or restrict to specified file types if needed)
    - [ ]  Screen sharing > Who can share? > **Host Only** by default
        - [ ]  Disable desktop screen sharing for meetings you host > Consider **On** (share specific windows only)
    - [ ]  Annotation > **Off**
    - [ ]  Whiteboard > Review and disable if unused

#### Chat Restrictions
- Account Management > Account Settings > Meeting > In Meeting (Basic)
    - [ ]  Meeting chat > Restrict participants to chatting with **Everyone publicly** or host only
    - [ ]  Meeting chat - Direct messages > **Off** for external participants
- Team Chat (admin.zoom.us/account/imsettings)
    - [ ]  Sharing and storage > Review external file sharing and restrict to internal users

## App and Integration Hygiene

#### Zoom Apps
- Account Management > Account Settings > Zoom Apps
    - [ ]  Zoom Apps Quick Launch Button > **Off**
    - [ ]  Allow users to add and use approved apps only > **On** (or disable Zoom Apps entirely if unused)

#### Marketplace Review
- Advanced > App Marketplace (marketplace.zoom.us)
    - [ ]  Manage > Permissions > Allow users to install apps > **Require admin approval**
    - [ ]  Review installed apps and remove any unnecessary or unrecognized
        - [ ]  Verify requested scopes are appropriate for each remaining app
    - [ ]  Review Created Apps (Server-to-Server OAuth / API apps) and delete unused credentials
        - [ ]  Rotate credentials for any app whose secrets may have been exposed

## Recording and Data

#### Recording Controls
- Account Management > Account Settings > Recording
    - [ ]  Cloud recording > **Off** unless there is a business need
        - [ ]  If enabled, Require passcode to access shared cloud recordings > **On**
        - [ ]  If enabled, Only authenticated users can view cloud recordings > **On**
    - [ ]  Automatic recording > **Off**
    - [ ]  Recording disclaimer > Ask participants for consent when a recording starts > **On**
    - [ ]  Auto delete cloud recordings after days > **On**, set a retention period matching your data policy

#### Encryption
- Account Management > Account Settings > Meeting > Security
    - [ ]  Allow use of end-to-end encryption > **On**
        - [ ]  Use E2EE for sensitive discussions (key material, treasury, incidents) [[3]](#e2ee-tradeoffs)

## Client Hygiene

#### Update Enforcement
- Account Management > Account Settings > General
    - [ ]  Automatically update the Zoom desktop client > **On**
        - [ ]  Update channel > **Fast** (receives security fixes soonest)
- [ ]  Instruct all members to download the Zoom client only from **zoom.us/download** [[4]](#fake-installers)
- [ ]  Where you manage endpoints (MDM), deploy the Zoom client centrally and block sideloaded installers

---

## Notes

### <a id="sso-2fa"></a>[1] SSO and 2FA
When SSO-only sign-in is enforced, 2FA is handled by your identity provider - enforce phishing-resistant methods (hardware security keys) there. Zoom's native 2FA setting applies to email/password sign-in.

### <a id="elusive-comet"></a>[2] ELUSIVE COMET Campaign
The ELUSIVE COMET threat actor targeted web3 organizations by inviting victims to Zoom calls (often posing as podcasters or journalists), renaming themselves to "Zoom" and sending a remote-control request that looks like a system prompt. One click grants full control of the victim's machine, leading to wallet drains and malware installation. Disabling remote control, remote support, and far end camera control account-wide - and locking those settings - removes this attack surface entirely.

### <a id="e2ee-tradeoffs"></a>[3] E2EE Tradeoffs
End-to-end encrypted meetings disable cloud recording, live transcription, breakout rooms in some client versions, and join-before-host. All participants must join from the Zoom client (not dial-in or web). Accept these tradeoffs for high-sensitivity calls.

### <a id="fake-installers"></a>[4] Fake Zoom Installers
Fake Zoom installer and "meeting SDK update" pages are one of the most common malware delivery vectors against web3 teams. Attackers send meeting links to lookalike domains that prompt a "client update" download. Only zoom.us (and app stores on mobile) are legitimate sources.
