<div align="center">
  <img src="../../../images/guides/airtable.svg" alt="Airtable Logo" width="64" height="64">
  <h2><a href="https://www.airtable.com/" target="_blank" rel="noopener noreferrer">Airtable</a> Configuration Guide</h2>
</div>

## Individual Account Settings

- Workspace Settings:
    - [ ]  Workspace settings > Workspace > Restrict adding new collaborators to this workspace, its bases, and its interfaces > **Enabled**

- Account Settings:
    - [ ]  Account > Account overview > Set up two-factor authentication > **Enable**
    - [ ]  Account > Recent account activity > Ensure recently active sessions are from recognized CLIENT and IP ADDRESS
    - Account > Builder's Hub > Personal access tokens >
        - [ ]  Ensure fine-grained, necessary only scopes
        - [ ]  Ensure none of the tokens grant access to "ALL RESOURCES"

- App Settings:
    - [ ]  Workspaces > App > Manage fields > Edit field permissions > Ensure fine grain field permission settings on sensitive fields
    - Workspaces > App > Share > if "Share to web" is on > Manage link settings >
        - [ ]  Enable **Require a password**
