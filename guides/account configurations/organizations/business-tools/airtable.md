<div align="center">
  <img src="../../../images/guides/airtable.svg" alt="Airtable Logo" width="64" height="64">
  <h2><a href="https://www.airtable.com/" target="_blank" rel="noopener noreferrer">Airtable</a> Configuration Guide</h2>
</div>

## Organization Settings
- Admin Panel:
    - Users >
        - [ ]  Review list of collaborators and remove any unauthorized users
        - [ ]  Review list of collaborators and ensure appropriate permission levels (limited amount of owners)
        - [ ]  Review list of pending invites and remove any unauthorized users
    - Settings >
        - Security & compliance >
            - [ ]  Two-factor authentication > **On for all users** (unless using SSO)
            - [ ]  Fixed web session length > **1 month** (or less)
        - Sharing & data >
            - [ ]  Organization membership > **Admin review**
            - [ ]  Collaborator invites > **Restricted to your organization’s domains**
            - [ ]  Share links > Any except **Public**
            - [ ]  Prevent public sharing of interface pages > **On**
            - [ ]  Restrict user group creation to admins > **On**
            - [ ]  Data export > **Restricted to org unit members** or **Restricted for all**
            - Synced views >
                - [ ]  Who can enable syncing outside of Joe Van Loon’s Organization? > **Only admins**
                - [ ]  Review share links > Review list and remove any unnecessary
            - Integrations & development >
                - [ ]  Block API access to organization-owned apps & workspaces > **On**