<!--
id: airtable-individual-configuration
type: CONFIGURATION
scope: INDIVIDUAL
-->

<div align="center">
  <img src="../../../images/guides/airtable.svg" alt="Airtable Logo" width="64" height="64">
  <h2><a href="https://www.airtable.com/" target="_blank" rel="noopener noreferrer">Airtable</a> Configuration Guide</h2>
</div>

## Individual Account Settings
- Account Settings:
    - [ ]  Account > Account overview > Set up two-factor authentication > **Enable**
    - [ ]  Account > Recent account activity > Ensure recently active sessions are from recognized CLIENT and IP ADDRESS
    - Account > Builder's Hub > Personal access tokens >
        - [ ]  Ensure fine-grained, necessary only scopes
        - [ ]  Ensure none of the tokens grant access to "ALL RESOURCES"

- Workspace Settings:
    - Workspace settings > Workspace >
        - [ ]  Restrict adding new collaborators to this workspace, its bases, and its interfaces > **Enabled**
        - [ ]  Prevent the creation of new share links within this workspace's bases and interfaces > **Enabled**
    - Workspace >
        - Share > Manage access >
            - [ ]  Review list of collaborators and remove any unauthorized users
            - [ ]  Review list of collaborators and ensure appropriate permission levels (limited amount of owners)
            - [ ]  Review list of pending invites and remove any unauthorized users
        - App >
            - [ ]  Manage fields > Edit field permissions > Ensure fine grain field permission settings on sensitive fields
            - Share > if "Share to web" is on > Manage link settings >
                - [ ]  Enable **Anyone on an admin-approved domain**
                - [ ]  Enable **Require a password**