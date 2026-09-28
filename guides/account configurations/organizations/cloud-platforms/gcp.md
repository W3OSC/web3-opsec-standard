<!--
id: gcp-cloud-security
type: CONFIGURATION
scope: ORGANIZATION
-->

<div align="center">
  <img src="../../../../images/guides/gcp.svg" alt="GCP Logo" width="64" height="64">
  <h2><a href="https://cloud.google.com/" target="_blank" rel="noopener noreferrer">GCP</a> Configuration Guide</h2>
  <p><em>Identity, Network, Data, and Detection controls for Google Cloud accounts</em></p>
</div>

---

## How to Use This Guide

Each item states its **pass** condition, then gives **Console** (the Google Cloud or Admin console) and **CLI** (`gcloud`) steps to **Verify** and **Fix** it. Under CLI, **Expect** is the output that means it passes. Pick the channel you work in at the top of the guide; an item shows only the channels that can check or change the setting, and it passes only when every resource the command returns meets the condition.

#### Prerequisites

- Google Cloud CLI - check with `gcloud version`. Some commands need the `alpha` or `beta` component: `gcloud components install alpha beta`.
- Sign in and confirm your context:
  - `gcloud auth login`
  - `gcloud organizations list` and `gcloud projects list --format="table(projectId, name, lifecycleState)"`
  - `gcloud config set project <project-id>`
- **Most checks are per-project.** To sweep every project you can see, wrap the command:
  - `for p in $(gcloud projects list --format="value(projectId)"); do echo "== $p"; <command> --project="$p"; done`
- Organization-level items need the organization ID: `export ORG_ID=$(gcloud organizations list --format="value(name.segment(1))" | head -1)`
- A read-only principal is enough for every CLI **Verify** command: grant `roles/viewer` plus `roles/iam.securityReviewer` at the organization level.
- Identity items covering user accounts and 2-Step Verification are enforced in the **Google Workspace / Cloud Identity** admin console (admin.google.com), not in `gcloud` - those items carry a Console block only.

---

## Identity & Access (IAM)

- [ ] **Corporate Login Credentials In Use** - pass: no IAM member is a `gmail.com` or other non-corporate account
  - **Console**:
    - Verify: Cloud console > IAM & Admin > IAM > select the organization in the resource picker > Principal column lists only accounts on your domain, with no `gmail.com` or other external domain
    - Fix: Cloud console > IAM & Admin > IAM > select the organization in the resource picker > pencil icon on the personal account's row > delete every role > Save, then Cloud console > IAM & Admin > Organization Policies > `Domain restricted sharing` > Manage policy > Applies to: Customize > Add a rule > Policy values: Custom > Allow > your Workspace customer ID > Set policy
  - **CLI**:
    - Verify:
      ```bash
      gcloud organizations get-iam-policy $ORG_ID --format="json" | grep -oE '[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+' | sort -u | grep -v "@<your-domain>"
      ```
    - Expect: no output - no `@gmail.com` account or any domain you do not control appears. A personal account cannot be suspended, audited, or have its credentials reset by your administrators, so when that person leaves their access leaves only if someone remembers.
    - Fix: `gcloud organizations remove-iam-policy-binding $ORG_ID --member="user:<personal>@gmail.com" --role="<role>"`
    - Fix: `gcloud resource-manager org-policies allow constraints/iam.allowedPolicyMemberDomains <customer-id> --organization=$ORG_ID`

- [ ] **Delete Google Cloud API Keys** - pass: no API keys exist, or each is restricted by API and referrer
  - **Console**:
    - Verify: Cloud console > APIs & Services > Credentials > API keys table is empty, or every key's Restrictions column reads a restricted value rather than `None`
    - Fix: Cloud console > APIs & Services > Credentials > API keys > actions menu on the key > Delete API key > Delete; where the key is required, open the key > Application restrictions: Websites > add the allowed referrers > API restrictions: Restrict key > select the APIs > Save
  - **CLI**:
    - Verify:
      ```bash
      for p in $(gcloud projects list --format="value(projectId)"); do
        gcloud services api-keys list --project="$p" --format="table(displayName, restrictions.apiTargets[].service, restrictions.browserKeyRestrictions.allowedReferrers)" 2>/dev/null | sed "s|^|$p |"
      done
      ```
    - Expect: no keys, or every key shows both an API target and an allowed-referrer restriction. An unrestricted API key works from anywhere for any enabled API, and keys are routinely shipped in client-side JavaScript and mobile binaries.
    - Fix: `gcloud services api-keys delete <key-id>`
    - Fix: `gcloud services api-keys update <key-id> --api-target=service=<api> --allowed-referrers="<domain>"`

- [ ] **Delete User-Managed Service Account Keys** - pass: no `USER_MANAGED` keys exist
  - **Console**:
    - Verify: Cloud console > IAM & Admin > Service Accounts > <service-account> > Keys > Key type column shows no `User managed` row
    - Fix: Cloud console > IAM & Admin > Service Accounts > <service-account> > Keys > trash icon on the user-managed key > Delete
  - **CLI**:
    - Verify:
      ```bash
      for p in $(gcloud projects list --format="value(projectId)"); do
        for sa in $(gcloud iam service-accounts list --project="$p" --format="value(email)"); do
          gcloud iam service-accounts keys list --iam-account="$sa" --managed-by=user --project="$p" --format="value(name, validAfterTime)" | sed "s|^|$p $sa |"
        done
      done
      ```
    - Expect: no output. A user-managed key is a permanent credential in a JSON file - it gets committed to repositories, pasted into CI, and copied between laptops, and it does not expire.
    - Fix: `gcloud iam service-accounts keys delete <key-id> --iam-account=<sa>`
    - Fix: `gcloud resource-manager org-policies enable-enforce constraints/iam.disableServiceAccountKeyCreation --organization=$ORG_ID`

- [ ] **Enable Multi-Factor Authentication for User Accounts** - pass: 2-Step Verification enforced for every user (console check)
  - **Console**:
    - Verify: Admin console (admin.google.com) > Security > Authentication > 2-Step Verification > select the top-level organizational unit > Allow users to turn on 2-Step Verification is checked, Enforcement reads `On`, and New user enrollment period is 1 week or shorter
    - Fix: Admin console (admin.google.com) > Security > Authentication > 2-Step Verification > select the top-level organizational unit > check Allow users to turn on 2-Step Verification > Enforcement: On > New user enrollment period: 1 week > Methods: Any except verification codes via text, phone call > Save

- [ ] **Enable Security Key Enforcement for Admin Accounts** - pass: security keys required for all privileged accounts (console check)
  - **Console**:
    - Verify: Admin console (admin.google.com) > Security > Authentication > 2-Step Verification > select the administrators organizational unit > Enforcement reads `On` and Methods reads `Only security key`
    - Fix: Admin console (admin.google.com) > Directory > Organizational units > Create organizational unit for administrators and move every privileged account into it, then Admin console (admin.google.com) > Security > Authentication > 2-Step Verification > select that unit > Override > Enforcement: On > Methods: Only security key > Save
  - **CLI**:
    - Verify:
      ```bash
      gcloud organizations get-iam-policy $ORG_ID --format="table(bindings.role, bindings.members)" | grep -E "admin|owner|Owner|Admin"
      ```
    - Expect: a short list of named administrators, every one of them a member of the organizational unit whose Methods reads `Only security key`. TOTP and push prompts are phishable in real time; a FIDO2 key is bound to the origin and is not.

- [ ] **Minimize the Use of Primitive Roles** - pass: no member holds `roles/owner`, `roles/editor` or `roles/viewer`
  - **Console**:
    - Verify: Cloud console > IAM & Admin > IAM > select the project in the resource picker > filter the table by `Role: Owner`, then `Editor`, then `Viewer` > Principal column lists only documented break-glass owners
    - Fix: Cloud console > IAM & Admin > IAM > select the project in the resource picker > pencil icon on the principal's row > delete the Owner, Editor or Viewer role > Add another role > the predefined role for the job > Save
  - **CLI**:
    - Verify:
      ```bash
      for p in $(gcloud projects list --format="value(projectId)"); do
        echo "== $p"
        gcloud projects get-iam-policy "$p" --flatten="bindings[].members" --format="table(bindings.role, bindings.members)" --filter="bindings.role:roles/owner OR bindings.role:roles/editor OR bindings.role:roles/viewer"
      done
      ```
    - Expect: no rows beyond documented break-glass owners. `roles/editor` alone grants write access to nearly every resource in the project, including the ability to grant itself more.
    - Fix: `gcloud projects remove-iam-policy-binding <project> --member="<member>" --role="roles/editor"`
    - Fix: `gcloud recommender recommendations list --recommender=google.iam.policy.Recommender --location=global --project=<project>`

- [ ] **Restrict Administrator Access for Service Accounts** - pass: no service account holds an admin, owner or editor role
  - **Console**:
    - Verify: Cloud console > IAM & Admin > IAM > select the project in the resource picker > filter the table by `Principal type: Service account` > Role column shows no Owner, Editor or `Admin` role
    - Fix: Cloud console > IAM & Admin > IAM > select the project in the resource picker > pencil icon on the service account's row > delete the Owner, Editor or Admin role > Add another role with only the permissions the workload calls > Save
  - **CLI**:
    - Verify:
      ```bash
      for p in $(gcloud projects list --format="value(projectId)"); do
        gcloud projects get-iam-policy "$p" --flatten="bindings[].members" --format="value(bindings.role, bindings.members)" --filter="bindings.members:serviceAccount AND (bindings.role:admin OR bindings.role:roles/owner OR bindings.role:roles/editor)" | sed "s|^|$p |"
      done
      ```
    - Expect: no output. A service account's credentials live wherever the workload runs, so admin on a service account is admin for anything that can read that workload's environment.
    - Fix: `gcloud projects remove-iam-policy-binding <project> --member="serviceAccount:<sa>" --role="<role>"`

- [ ] **Rotate User-Managed Service Account Keys** - pass: no user-managed key older than 90 days
  - **Console**:
    - Verify: Cloud console > IAM & Admin > Service Accounts > <service-account> > Keys > Key creation date column shows no `User managed` key older than 90 days
    - Fix: Cloud console > IAM & Admin > Service Accounts > <service-account> > Keys > Add key > Create new key > JSON > Create, deploy the new key to the workload, then trash icon on the old key > Delete
  - **CLI**:
    - Verify:
      ```bash
      for p in $(gcloud projects list --format="value(projectId)"); do
        for sa in $(gcloud iam service-accounts list --project="$p" --format="value(email)"); do
          gcloud iam service-accounts keys list --iam-account="$sa" --managed-by=user --project="$p" --format="table(name.basename(), validAfterTime, validBeforeTime)"
        done
      done
      ```
    - Expect: every `validAfterTime` is within the last 90 days. This control is the fallback for keys you cannot yet eliminate - the durable answer is deleting them.
    - Fix: `gcloud iam service-accounts keys create <new-key>.json --iam-account=<sa>`
    - Fix: `gcloud iam service-accounts keys delete <old-key-id> --iam-account=<sa>`
    - Fix: `gcloud resource-manager org-policies allow constraints/iam.serviceAccountKeyExpiryHours 2160h --organization=$ORG_ID`

- [ ] **Detect GCP IAM Configuration Changes** - pass: a log-based metric and alert policy exist for IAM changes
  - **Console**:
    - Verify: Cloud console > Logging > Log-based metrics > User-defined metrics > a metric whose Filter contains `protoPayload.serviceName="iam.googleapis.com"` or `SetIamPolicy` exists, and Cloud console > Monitoring > Alerting > Policies > the policy on that metric shows Enabled
    - Fix: Cloud console > Logging > Log-based metrics > Create metric > Metric type: Counter > Name `iam-changes` > Filter `protoPayload.methodName="SetIamPolicy" OR protoPayload.serviceName="iam.googleapis.com"` > Create metric, then actions menu on that metric > Create alert from metric > add a notification channel that reaches a person > Create policy
  - **CLI**:
    - Verify: `gcloud logging metrics list --format="table(name, filter)"`
    - Verify: `gcloud alpha monitoring policies list --format="table(displayName, enabled)"`
    - Expect: a metric filtering `protoPayload.serviceName="iam.googleapis.com"` or `SetIamPolicy`, and an alert policy whose condition filter names that metric with `enabled` = `True`. A metric with no alert produces a chart nobody opens.
    - Fix:
      ```bash
      gcloud logging metrics create iam-changes --description="IAM policy changes" --log-filter='protoPayload.methodName="SetIamPolicy" OR protoPayload.serviceName="iam.googleapis.com"'
      ```
    - Fix:
      ```bash
      gcloud alpha monitoring policies create --display-name="IAM changes" --condition-display-name="iam-changes above 0" --condition-filter='metric.type="logging.googleapis.com/user/iam-changes"' --if="> 0" --notification-channels=<channel-id>
      ```

---

## Storage (Cloud Storage)

- [ ] **Check for Publicly Accessible Cloud Storage Buckets** - pass: no bucket IAM policy grants `allUsers` or `allAuthenticatedUsers`
  - **Console**:
    - Verify: Cloud console > Cloud Storage > Buckets > Public access column reads `Not public` for every bucket, with no `Public to internet`
    - Fix: Cloud console > Cloud Storage > Buckets > <bucket> > Permissions > select the `allUsers` and `allAuthenticatedUsers` rows > Remove access > Confirm, then Public access > Prevent public access > Confirm
  - **CLI**:
    - Verify:
      ```bash
      for p in $(gcloud projects list --format="value(projectId)"); do
        for b in $(gcloud storage buckets list --project="$p" --format="value(name)"); do
          gcloud storage buckets get-iam-policy "gs://$b" --format="json" | grep -qE '"allUsers"|"allAuthenticatedUsers"' && echo "PUBLIC: $p $b"
        done
      done
      ```
    - Expect: no output. `allUsers` is the open internet; `allAuthenticatedUsers` is every Google account holder, which is not meaningfully narrower.
    - Fix: `gcloud storage buckets remove-iam-policy-binding gs://<bucket> --member=allUsers --role=roles/storage.objectViewer`
    - Fix: `gcloud storage buckets update gs://<bucket> --public-access-prevention`

- [ ] **Bucket Policies with Administrative Permissions** - pass: no bucket grants `roles/storage.admin` to a broad member
  - **Console**:
    - Verify: Cloud console > Cloud Storage > Buckets > <bucket> > Permissions > View by roles > Storage Admin lists only named administrative principals
    - Fix: Cloud console > Cloud Storage > Buckets > <bucket> > Permissions > select the principal's row under Storage Admin > Remove access > Confirm, then Grant access > that principal > Role: Storage Object Viewer or Storage Object Creator > Save
  - **CLI**:
    - Verify:
      ```bash
      for p in $(gcloud projects list --format="value(projectId)"); do
        for b in $(gcloud storage buckets list --project="$p" --format="value(name)"); do
          gcloud storage buckets get-iam-policy "gs://$b" --format="value(bindings.role, bindings.members)" --flatten="bindings[].members" --filter="bindings.role:roles/storage.admin" | sed "s|^|$p $b |"
        done
      done
      ```
    - Expect: only named administrative principals hold `storage.admin`. That role includes deleting the bucket and rewriting its IAM policy, so it covers destroying your evidence as well as reading your data.
    - Fix: `gcloud storage buckets remove-iam-policy-binding gs://<bucket> --member=<member> --role=roles/storage.admin`
    - Fix: `gcloud storage buckets add-iam-policy-binding gs://<bucket> --member=<member> --role=roles/storage.objectViewer`

- [ ] **Enable Uniform Bucket-Level Access for Cloud Storage Buckets** - pass: `uniform_bucket_level_access` = `True`
  - **Console**:
    - Verify: Cloud console > Cloud Storage > Buckets > <bucket> > Permissions > Access control reads `Uniform`
    - Fix: Cloud console > Cloud Storage > Buckets > <bucket> > Permissions > Access control > Switch to uniform > Save (audit existing object ACLs first - they stop taking effect immediately)
  - **CLI**:
    - Verify:
      ```bash
      for p in $(gcloud projects list --format="value(projectId)"); do
        gcloud storage buckets list --project="$p" --format="table(name, uniform_bucket_level_access)"
      done
      ```
    - Expect: `True` on every bucket. With legacy ACLs active, a single object can be made public independently of the bucket policy, and object-level grants do not appear in any IAM review.
    - Fix: `gcloud storage buckets update gs://<bucket> --uniform-bucket-level-access`

- [ ] **Enforce Public Access Prevention** - pass: `publicAccessPrevention` = `enforced` on every bucket
  - **Console**:
    - Verify: Cloud console > Cloud Storage > Buckets > <bucket> > Permissions > Public access card reads `Not public` with Public access prevention `Enforced`, not `Inherited`
    - Fix: Cloud console > Cloud Storage > Buckets > <bucket> > Permissions > Public access > Prevent public access > Confirm, then Cloud console > IAM & Admin > Organization Policies > `Enforce Public Access Prevention` > Manage policy > Applies to: Customize > Add a rule > Enforcement: On > Set policy
  - **CLI**:
    - Verify:
      ```bash
      for p in $(gcloud projects list --format="value(projectId)"); do
        gcloud storage buckets list --project="$p" --format="table(name, public_access_prevention)"
      done
      ```
    - Expect: `enforced` on every bucket. `inherited` means the bucket depends on an organization policy that a project owner can change; `enforced` blocks public grants at the bucket regardless.
    - Fix: `gcloud storage buckets update gs://<bucket> --public-access-prevention`
    - Fix: `gcloud resource-manager org-policies enable-enforce constraints/storage.publicAccessPrevention --organization=$ORG_ID`

- [ ] **Enable Data Access Audit Logs** - pass: `DATA_READ` and `DATA_WRITE` logging enabled for all services
  - **Console**:
    - Verify: Cloud console > IAM & Admin > Audit Logs > select the project in the resource picker > Default audit config > Log types shows Admin Read, Data Read and Data Write all checked
    - Fix: Cloud console > IAM & Admin > Audit Logs > select the project in the resource picker > Default audit config > Log types > check Admin Read, Data Read and Data Write > Save
  - **CLI**:
    - Verify:
      ```bash
      for p in $(gcloud projects list --format="value(projectId)"); do
        echo "== $p"
        gcloud projects get-iam-policy "$p" --format="json" | python3 -c "import json,sys; print(json.load(sys.stdin).get('auditConfigs','NONE'))"
      done
      ```
    - Expect: an `auditConfigs` entry for `allServices` with `DATA_READ`, `DATA_WRITE` and `ADMIN_READ`. Admin activity logs are on by default; data access logs are not, so without this there is no record of who read an object.
    - Fix:
      ```bash
      gcloud projects get-iam-policy <project> --format=json > policy.json
      # add to policy.json: "auditConfigs":[{"service":"allServices","auditLogConfigs":[{"logType":"DATA_READ"},{"logType":"DATA_WRITE"},{"logType":"ADMIN_READ"}]}]
      gcloud projects set-iam-policy <project> policy.json
      ```

- [ ] **Use VPC Service Controls for Cloud Storage Buckets** - pass: a service perimeter covers `storage.googleapis.com`
  - **Console**:
    - Verify: Cloud console > Security > VPC Service Controls > select the organization in the resource picker > Enforced mode > <perimeter> > Restricted services lists `Cloud Storage API`
    - Fix: Cloud console > Security > VPC Service Controls > select the organization in the resource picker > Dry run mode > New perimeter > Title > Projects to protect: Add projects > Restricted services: Add services > Cloud Storage API > Create perimeter, review the dry-run violation logs, then that perimeter's actions menu > Enforce
  - **CLI**:
    - Verify: `gcloud access-context-manager policies list --organization=$ORG_ID --format="value(name)"`
    - Verify: `gcloud access-context-manager perimeters list --policy=<policy-id> --format="table(title, status.restrictedServices)"`
    - Expect: a perimeter exists and lists `storage.googleapis.com` in `restrictedServices`. IAM alone cannot stop a valid credential being used from outside your network; a perimeter is the control that blocks exfiltration by a credential that is genuinely authorised.
    - Fix:
      ```bash
      gcloud access-context-manager perimeters dry-run create <name> --perimeter-title=<title> --perimeter-type=regular --perimeter-resources=projects/<number> --perimeter-restricted-services=storage.googleapis.com --policy=<policy-id>
      ```
    - Fix: `gcloud access-context-manager perimeters dry-run enforce <name> --policy=<policy-id>`

---

## Compute Engine

- [ ] **Check for Virtual Machine Instances with Public IP Addresses** - pass: no instance has an external NAT address
  - **Console**:
    - Verify: Cloud console > Compute Engine > VM instances > External IP column reads `None` for every instance
    - Fix: Cloud console > Compute Engine > VM instances > <instance> > Edit > Network interfaces > expand the interface > External IPv4 address: None > Done > Save
  - **CLI**:
    - Verify:
      ```bash
      for p in $(gcloud projects list --format="value(projectId)"); do
        gcloud compute instances list --project="$p" --format="table(name, zone, networkInterfaces[0].accessConfigs[0].natIP)" --filter="networkInterfaces[0].accessConfigs[0].natIP:*"
      done
      ```
    - Expect: no rows, except instances that must terminate inbound traffic. Every external IP is an internet-facing attack surface that firewall rules alone have to hold back.
    - Fix: `gcloud compute instances delete-access-config <instance> --access-config-name="external-nat" --zone=<zone>`
    - Fix: `gcloud compute ssh <instance> --zone=<zone> --tunnel-through-iap`

- [ ] **Instance templates should not assign a public IP address** - pass: no instance template defines an `accessConfig`
  - **Console**:
    - Verify: Cloud console > Compute Engine > Instance templates > <template> > Network interfaces > External IP reads `None`
    - Fix: Cloud console > Compute Engine > Instance templates > <template> > Create similar > Advanced options > Networking > Network interfaces > External IPv4 address: None > Create, then Cloud console > Compute Engine > Instance groups > <group> > Update VMs > New template: the replacement > Update VMs
  - **CLI**:
    - Verify:
      ```bash
      for p in $(gcloud projects list --format="value(projectId)"); do
        gcloud compute instance-templates list --project="$p" --format="table(name, properties.networkInterfaces[0].accessConfigs[0].name)"
      done
      ```
    - Expect: the access-config column is empty for every template. A template is the durable version of the misconfiguration - every instance a managed instance group creates from it gets a public address, including ones created by autoscaling at 3am.
    - Fix: `gcloud compute instance-templates create <new-template> --source-instance-template=<template> --no-address`
    - Fix: `gcloud compute instance-groups managed rolling-action start-update <group> --version=template=<new-template> --zone=<zone>`

- [ ] **Check for Instances Associated with Default Service Accounts** - pass: no instance runs as the default Compute Engine service account
  - **Console**:
    - Verify: Cloud console > Compute Engine > VM instances > <instance> > Details > API and identity management > Service account does not read `Compute Engine default service account`
    - Fix: Cloud console > Compute Engine > VM instances > <instance> > Stop > Edit > API and identity management > Service account: <purpose-built account> > Save > Start
  - **CLI**:
    - Verify:
      ```bash
      for p in $(gcloud projects list --format="value(projectId)"); do
        gcloud compute instances list --project="$p" --format="table(name, zone, serviceAccounts[0].email)" --filter="serviceAccounts[0].email~compute@developer.gserviceaccount.com"
      done
      ```
    - Expect: no rows. The default Compute Engine service account is granted `roles/editor` on the project automatically, so any code on that instance can modify nearly every resource in the project.
    - Fix: `gcloud compute instances stop <instance> --zone=<zone>`
    - Fix: `gcloud compute instances set-service-account <instance> --service-account=<sa> --scopes=cloud-platform --zone=<zone>`
    - Fix: `gcloud resource-manager org-policies enable-enforce constraints/iam.automaticIamGrantsForDefaultServiceAccounts --organization=$ORG_ID`

- [ ] **Check for Instance-Associated Service Accounts with Full API Access** - pass: no instance uses the `cloud-platform` scope with a broad service account
  - **Console**:
    - Verify: Cloud console > Compute Engine > VM instances > <instance> > Details > API and identity management > Cloud API access scopes reads `Allow full access to all Cloud APIs` only where Service account is a purpose-built minimal account, never the default one
    - Fix: Cloud console > Compute Engine > VM instances > <instance> > Stop > Edit > API and identity management > Service account: <minimal account> > Access scopes: Allow full access to all Cloud APIs > Save > Start, then Cloud console > IAM & Admin > IAM > pencil icon on that account's row > delete the roles it does not need > Save
  - **CLI**:
    - Verify:
      ```bash
      for p in $(gcloud projects list --format="value(projectId)"); do
        gcloud compute instances list --project="$p" --format="table(name, zone, serviceAccounts[0].email, serviceAccounts[0].scopes)" --filter="serviceAccounts[0].scopes:https://www.googleapis.com/auth/cloud-platform"
      done
      ```
    - Expect: every instance using the full `cloud-platform` scope does so with a tightly-scoped service account, not the default one. Scopes are a legacy second layer - the safe pattern is `cloud-platform` scope plus a minimal service account, never a broad account with broad scopes.
    - Fix: `gcloud compute instances set-service-account <instance> --service-account=<minimal-sa> --scopes=cloud-platform --zone=<zone>`
    - Fix: `gcloud projects remove-iam-policy-binding <project> --member="serviceAccount:<minimal-sa>" --role="<unneeded-role>"`

- [ ] **Disable IP Forwarding for Virtual Machine Instances** - pass: `canIpForward` = `false`
  - **Console**:
    - Verify: Cloud console > Compute Engine > VM instances > <instance> > Details > Network interfaces > IP forwarding column reads `Off`
    - Fix: Cloud console > Compute Engine > VM instances > <instance> > Create similar > Advanced options > Networking > IP forwarding: Off > Create, then delete the original instance (the flag is immutable after creation), and Cloud console > IAM & Admin > Organization Policies > `Restrict VM IP Forwarding` > Manage policy > Applies to: Customize > Add a rule > Policy values: Deny all > Set policy
  - **CLI**:
    - Verify:
      ```bash
      for p in $(gcloud projects list --format="value(projectId)"); do
        gcloud compute instances list --project="$p" --format="table(name, zone, canIpForward)" --filter="canIpForward=true"
      done
      ```
    - Expect: no rows, except deliberate NAT or VPN appliances. An instance that can forward packets can route traffic for addresses it does not own, which turns a single compromised host into a pivot into other subnets.
    - Fix: `gcloud resource-manager org-policies deny constraints/compute.vmCanIpForward --organization=$ORG_ID --all`

- [ ] **Disable Interactive Serial Console Support** - pass: `serial-port-enable` is absent or `false`
  - **Console**:
    - Verify: Cloud console > Compute Engine > VM instances > <instance> > Edit > Remote access > Enable connecting to serial ports is unchecked
    - Fix: Cloud console > Compute Engine > VM instances > <instance> > Edit > Remote access > uncheck Enable connecting to serial ports > Save, then Cloud console > IAM & Admin > Organization Policies > `Disable VM serial port access` > Manage policy > Applies to: Customize > Add a rule > Enforcement: On > Set policy
  - **CLI**:
    - Verify:
      ```bash
      for p in $(gcloud projects list --format="value(projectId)"); do
        gcloud compute instances list --project="$p" --format="table(name, zone, metadata.items.filter('key:serial-port-enable').extract('value'))"
      done
      ```
    - Expect: empty or `false` for every instance. The interactive serial console is reachable with no IP restriction and no firewall in the path - it bypasses every network control you have configured.
    - Fix: `gcloud compute instances add-metadata <instance> --metadata serial-port-enable=false --zone=<zone>`
    - Fix: `gcloud resource-manager org-policies enable-enforce constraints/compute.disableSerialPortAccess --organization=$ORG_ID`

- [ ] **Enable "Block Project-Wide SSH Keys" Security Feature** - pass: `block-project-ssh-keys` = `true` on every instance
  - **Console**:
    - Verify: Cloud console > Compute Engine > VM instances > <instance> > Edit > Security and access > SSH Keys > Block project-wide SSH keys is checked
    - Fix: Cloud console > Compute Engine > VM instances > <instance> > Edit > Security and access > SSH Keys > check Block project-wide SSH keys > Save
  - **CLI**:
    - Verify:
      ```bash
      for p in $(gcloud projects list --format="value(projectId)"); do
        gcloud compute instances list --project="$p" --format="table(name, zone, metadata.items.filter('key:block-project-ssh-keys').extract('value'))"
      done
      ```
    - Expect: `True` on every instance, or OS Login enabled project-wide (which supersedes this). A project-wide key grants shell access to every instance at once, and those keys are rarely inventoried.
    - Fix: `gcloud compute instances add-metadata <instance> --metadata block-project-ssh-keys=true --zone=<zone>`

- [ ] **Enable OS Login for GCP Projects** - pass: `enable-oslogin` = `TRUE` in project metadata
  - **Console**:
    - Verify: Cloud console > Compute Engine > Settings > Metadata > Metadata tab > key `enable-oslogin` has value `TRUE`
    - Fix: Cloud console > Compute Engine > Settings > Metadata > Metadata tab > Edit > Add item > Key `enable-oslogin` > Value `TRUE` > Save, then Cloud console > IAM & Admin > Organization Policies > `Require OS Login` > Manage policy > Applies to: Customize > Add a rule > Enforcement: On > Set policy
  - **CLI**:
    - Verify:
      ```bash
      for p in $(gcloud projects list --format="value(projectId)"); do
        echo "$p: $(gcloud compute project-info describe --project="$p" --format='value(commonInstanceMetadata.items.filter("key:enable-oslogin").extract("value"))')"
      done
      ```
    - Expect: `TRUE` for every project. Without OS Login, SSH access is governed by keys in metadata rather than IAM, so revoking someone's Google account does not revoke their shell access.
    - Fix: `gcloud compute project-info add-metadata --metadata enable-oslogin=TRUE --project=<project>`
    - Fix: `gcloud projects add-iam-policy-binding <project> --member="user:<user>" --role="roles/compute.osLogin"`
    - Fix: `gcloud resource-manager org-policies enable-enforce constraints/compute.requireOsLogin --organization=$ORG_ID`

- [ ] **Use OS Login with 2FA Authentication for VM Instances** - pass: `enable-oslogin-2fa` = `TRUE`
  - **Console**:
    - Verify: Cloud console > Compute Engine > Settings > Metadata > Metadata tab > key `enable-oslogin-2fa` has value `TRUE`
    - Fix: Cloud console > Compute Engine > Settings > Metadata > Metadata tab > Edit > Add item > Key `enable-oslogin-2fa` > Value `TRUE` > Save
  - **CLI**:
    - Verify:
      ```bash
      for p in $(gcloud projects list --format="value(projectId)"); do
        echo "$p: $(gcloud compute project-info describe --project="$p" --format='value(commonInstanceMetadata.items.filter("key:enable-oslogin-2fa").extract("value"))')"
      done
      ```
    - Expect: `TRUE` for every project holding production instances (requires OS Login and 2-Step Verification on the account). Otherwise a stolen Google session cookie is enough to reach a shell on the host.
    - Fix: `gcloud compute project-info add-metadata --metadata enable-oslogin-2fa=TRUE --project=<project>`

- [ ] **Check for Publicly Shared Disk Images** - pass: no custom image grants `allUsers` or `allAuthenticatedUsers`
  - **Console**:
    - Verify: Cloud console > Compute Engine > Storage > Images > select <image> > Show info panel > Permissions > principal list shows no `allUsers` or `allAuthenticatedUsers`
    - Fix: Cloud console > Compute Engine > Storage > Images > select <image> > Show info panel > Permissions > select the `allUsers` row > Remove principal > Remove, then rotate every secret the image contained
  - **CLI**:
    - Verify:
      ```bash
      for p in $(gcloud projects list --format="value(projectId)"); do
        for i in $(gcloud compute images list --project="$p" --no-standard-images --format="value(name)"); do
          gcloud compute images get-iam-policy "$i" --project="$p" --format=json | grep -qE '"allUsers"|"allAuthenticatedUsers"' && echo "PUBLIC: $p $i"
        done
      done
      ```
    - Expect: no output. A disk image is a full filesystem - public images have leaked source code, private keys, and internal configuration to anyone who thought to look, so treat any prior exposure as a disclosure.
    - Fix: `gcloud compute images remove-iam-policy-binding <image> --member=allUsers --role=roles/compute.imageUser`

---

## Kubernetes (GKE)

- [ ] **Disable Client Certificates** - pass: `clientCertificateConfig.issueClientCertificate` is unset or `false`
  - **Console**:
    - Verify: Cloud console > Kubernetes Engine > Clusters > <cluster> > Details > Security > Client certificate reads `Disabled`
    - Fix: Cloud console > Kubernetes Engine > Clusters > Create > Standard > Security > leave Issue a client certificate unchecked > Create, then migrate workloads and delete the old cluster (the certificate cannot be removed from a running cluster)
  - **CLI**:
    - Verify:
      ```bash
      for p in $(gcloud projects list --format="value(projectId)"); do
        gcloud container clusters list --project="$p" --format="table(name, location, masterAuth.clientCertificate.yesno(yes='ISSUED', no='none'))"
      done
      ```
    - Expect: `none` for every cluster. A client certificate is a static credential that cannot be revoked without rotating the cluster's certificate authority, and it bypasses IAM entirely.
    - Fix: `gcloud container clusters create <new-cluster> --no-issue-client-certificate --location=<location>`
    - Fix: `gcloud container clusters update <cluster> --start-credential-rotation --location=<location>`

- [ ] **Disable Kubernetes Dashboard for GKE Clusters** - pass: the Kubernetes dashboard addon is disabled
  - **Console**:
    - Verify: Cloud console > Kubernetes Engine > Clusters > <cluster> > Details > Features > no `Kubernetes Dashboard` entry, or it reads `Disabled`
    - Fix: Cloud console > Kubernetes Engine > Clusters > <cluster> > Details > Features > Kubernetes Dashboard > pencil icon > uncheck Enable Kubernetes Dashboard > Save changes
  - **CLI**:
    - Verify:
      ```bash
      for p in $(gcloud projects list --format="value(projectId)"); do
        gcloud container clusters list --project="$p" --format="table(name, location, addonsConfig.kubernetesDashboard.disabled)"
      done
      ```
    - Expect: `True` for every cluster. The dashboard has a history of being deployed with a privileged service account and reachable without authentication - it was the entry point in the well-known Tesla cryptomining incident.
    - Fix: `gcloud container clusters update <cluster> --update-addons=KubernetesDashboard=DISABLED --location=<location>`

- [ ] **Disable Legacy Authorization** - pass: `legacyAbac.enabled` is unset or `false`
  - **Console**:
    - Verify: Cloud console > Kubernetes Engine > Clusters > <cluster> > Details > Security > Legacy authorization reads `Disabled`
    - Fix: Cloud console > Kubernetes Engine > Clusters > <cluster> > Details > Security > Legacy authorization > pencil icon > uncheck Enable legacy authorization > Save changes
  - **CLI**:
    - Verify:
      ```bash
      for p in $(gcloud projects list --format="value(projectId)"); do
        gcloud container clusters list --project="$p" --format="table(name, location, legacyAbac.enabled)"
      done
      ```
    - Expect: empty or `False` for every cluster. Legacy ABAC grants broad permissions that override RBAC, so your carefully written Roles and RoleBindings simply do not apply.
    - Fix: `gcloud container clusters update <cluster> --no-enable-legacy-authorization --location=<location>`

- [ ] **Enable Private Nodes** - pass: `privateClusterConfig.enablePrivateNodes` = `true`
  - **Console**:
    - Verify: Cloud console > Kubernetes Engine > Clusters > <cluster> > Details > Networking > Private nodes reads `Enabled`
    - Fix: Cloud console > Kubernetes Engine > Clusters > Create > Standard > Networking > check Enable Private nodes > Create, then add Cloud NAT for egress, migrate workloads and delete the old cluster
  - **CLI**:
    - Verify:
      ```bash
      for p in $(gcloud projects list --format="value(projectId)"); do
        gcloud container clusters list --project="$p" --format="table(name, location, privateClusterConfig.enablePrivateNodes)"
      done
      ```
    - Expect: `True` for every cluster. Nodes with public addresses expose the kubelet and every `hostNetwork` pod directly to the internet.
    - Fix: `gcloud container clusters create <new-cluster> --enable-private-nodes --enable-ip-alias --master-ipv4-cidr=<cidr> --location=<location>`

- [ ] **Restrict Network Access** - pass: master authorized networks enabled with no `0.0.0.0/0` block
  - **Console**:
    - Verify: Cloud console > Kubernetes Engine > Clusters > <cluster> > Details > Networking > Control plane authorized networks reads `Enabled` and the listed networks contain no `0.0.0.0/0`
    - Fix: Cloud console > Kubernetes Engine > Clusters > <cluster> > Details > Networking > Control plane authorized networks > pencil icon > check Enable control plane authorized networks > Add authorized network > <office-cidr> > remove any `0.0.0.0/0` entry > Save changes
  - **CLI**:
    - Verify:
      ```bash
      for p in $(gcloud projects list --format="value(projectId)"); do
        gcloud container clusters list --project="$p" --format="table(name, location, masterAuthorizedNetworksConfig.enabled, masterAuthorizedNetworksConfig.cidrBlocks[].cidrBlock)"
      done
      ```
    - Expect: `enabled` is `True` and no block is `0.0.0.0/0`. An enabled config that allows the world is the same as no config, and reads as compliant in a shallow review.
    - Fix:
      ```bash
      gcloud container clusters update <cluster> --enable-master-authorized-networks --master-authorized-networks=<office-cidr>,<vpn-cidr>,<ci-egress>/32 --location=<location>
      ```

- [ ] **Use GKE Clusters with Private Endpoints Only** - pass: `enablePrivateEndpoint` = `true`
  - **Console**:
    - Verify: Cloud console > Kubernetes Engine > Clusters > <cluster> > Details > Networking > Control plane access > access using the control plane's external IP address reads `Disabled`, with no external endpoint shown
    - Fix: Cloud console > Kubernetes Engine > Clusters > <cluster> > Details > Networking > Control plane access > pencil icon > uncheck Access using the control plane's external IP address > Save changes (confirm your CI runners have a network path into the VPC first)
  - **CLI**:
    - Verify:
      ```bash
      for p in $(gcloud projects list --format="value(projectId)"); do
        gcloud container clusters list --project="$p" --format="table(name, location, privateClusterConfig.enablePrivateEndpoint, privateClusterConfig.publicEndpoint)"
      done
      ```
    - Expect: `True`, with no public endpoint address. Otherwise the control plane accepts authentication attempts from the entire internet.
    - Fix: `gcloud container clusters update <cluster> --enable-private-endpoint --location=<location>`

- [ ] **Enable Workload Identity Federation** - pass: `workloadIdentityConfig.workloadPool` is set
  - **Console**:
    - Verify: Cloud console > Kubernetes Engine > Clusters > <cluster> > Details > Security > Workload Identity reads `Enabled` with pool `<project>.svc.id.goog`
    - Fix: Cloud console > Kubernetes Engine > Clusters > <cluster> > Details > Security > Workload Identity > pencil icon > check Enable Workload Identity > Save changes, then Cloud console > Kubernetes Engine > Clusters > <cluster> > Nodes > <node pool> > Edit > Security > check Enable GKE Metadata Server > Save
  - **CLI**:
    - Verify:
      ```bash
      for p in $(gcloud projects list --format="value(projectId)"); do
        gcloud container clusters list --project="$p" --format="table(name, location, workloadIdentityConfig.workloadPool)"
      done
      ```
    - Expect: a workload pool of the form `<project>.svc.id.goog` on every cluster. Without it, pods authenticate as the node's service account, so every pod on a node shares one identity and the node's full permissions.
    - Fix: `gcloud container clusters update <cluster> --workload-pool=<project>.svc.id.goog --location=<location>`
    - Fix: `gcloud container node-pools update <pool> --cluster=<cluster> --workload-metadata=GKE_METADATA --location=<location>`

- [ ] **Prevent Default Service Account Usage** - pass: no node pool runs as the default Compute Engine service account
  - **Console**:
    - Verify: Cloud console > Kubernetes Engine > Clusters > <cluster> > Nodes > <node pool> > Details > Security > Service account does not read `default`
    - Fix: Cloud console > Kubernetes Engine > Clusters > <cluster> > Nodes > Add node pool > Security > Service account: <minimal account> > Create, then cordon and drain the old pool and Cloud console > Kubernetes Engine > Clusters > <cluster> > Nodes > <old node pool> > Delete
  - **CLI**:
    - Verify:
      ```bash
      for p in $(gcloud projects list --format="value(projectId)"); do
        gcloud container clusters list --project="$p" --format="table(name, location, nodePools[].name, nodePools[].config.serviceAccount)"
      done
      ```
    - Expect: no node pool shows `default` as its service account. The default account carries `roles/editor` on the project, which every pod on those nodes inherits unless Workload Identity is in force.
    - Fix: `gcloud container node-pools create <pool> --service-account=<minimal-sa> --cluster=<cluster> --location=<location>`
    - Fix: `gcloud container node-pools delete <old-pool> --cluster=<cluster> --location=<location>`

---

## Logging & Detection

Each monitoring control needs two things: a log-based metric that matches the events, and an enabled alert policy attached to that metric. A metric with no alert produces a chart nobody opens.

- [ ] **Enable Monitoring for Audit Configuration Changes** - pass: a metric and enabled alert policy exist for audit config changes
  - **Console**:
    - Verify: Cloud console > Logging > Log-based metrics > User-defined metrics > a metric whose Filter contains `protoPayload.serviceData.policyDelta.auditConfigDeltas:*` exists, and Cloud console > Monitoring > Alerting > Policies > the policy on that metric shows Enabled
    - Fix: Cloud console > Logging > Log-based metrics > Create metric > Metric type: Counter > Name `audit-config-changes` > Filter `protoPayload.methodName="SetIamPolicy" AND protoPayload.serviceData.policyDelta.auditConfigDeltas:*` > Create metric, then actions menu on that metric > Create alert from metric > add a notification channel > Create policy
  - **CLI**:
    - Verify: `gcloud logging metrics list --format="table(name, filter)"`
    - Verify: `gcloud alpha monitoring policies list --format="table(displayName, enabled, conditions[].conditionThreshold.filter)"`
    - Expect: a metric filtering `protoPayload.methodName="SetIamPolicy" AND protoPayload.serviceData.policyDelta.auditConfigDeltas:*` and an alert policy whose condition filter names that metric with `enabled` = `True`. Disabling audit logging is the first move in a quiet intrusion.
    - Fix:
      ```bash
      gcloud logging metrics create audit-config-changes --log-filter='protoPayload.methodName="SetIamPolicy" AND protoPayload.serviceData.policyDelta.auditConfigDeltas:*'
      ```
    - Fix:
      ```bash
      gcloud alpha monitoring policies create --display-name="Audit config changes" --condition-display-name="audit-config-changes above 0" --condition-filter='metric.type="logging.googleapis.com/user/audit-config-changes"' --if="> 0" --notification-channels=<channel-id>
      ```

- [ ] **Enable Monitoring for Firewall Rule Changes** - pass: a metric and enabled alert policy exist for firewall changes
  - **Console**:
    - Verify: Cloud console > Logging > Log-based metrics > User-defined metrics > a metric whose Filter matches `compute.firewalls.insert`, `patch` and `delete` exists, and Cloud console > Monitoring > Alerting > Policies > the policy on that metric shows Enabled
    - Fix: Cloud console > Logging > Log-based metrics > Create metric > Metric type: Counter > Name `firewall-changes` > Filter `resource.type="gce_firewall_rule" AND (protoPayload.methodName:"compute.firewalls.insert" OR protoPayload.methodName:"compute.firewalls.patch" OR protoPayload.methodName:"compute.firewalls.delete")` > Create metric, then actions menu on that metric > Create alert from metric > add a notification channel > Create policy
  - **CLI**:
    - Verify: `gcloud logging metrics list --filter="name~firewall" --format="table(name, filter)"`
    - Verify: `gcloud alpha monitoring policies list --format="table(displayName, enabled, conditions[].conditionThreshold.filter)"`
    - Expect: a metric matching firewall insert, patch and delete methods, and an alert policy whose condition filter names that metric with `enabled` = `True`. Opening a port is a single API call and is trivially reversible, so it will not be noticed unless it is alerted on.
    - Fix:
      ```bash
      gcloud logging metrics create firewall-changes --log-filter='resource.type="gce_firewall_rule" AND (protoPayload.methodName:"compute.firewalls.insert" OR protoPayload.methodName:"compute.firewalls.patch" OR protoPayload.methodName:"compute.firewalls.delete")'
      ```
    - Fix:
      ```bash
      gcloud alpha monitoring policies create --display-name="Firewall changes" --condition-display-name="firewall-changes above 0" --condition-filter='metric.type="logging.googleapis.com/user/firewall-changes"' --if="> 0" --notification-channels=<channel-id>
      ```

- [ ] **Enable Monitoring for Custom Role Changes** - pass: a metric and enabled alert policy exist for role changes
  - **Console**:
    - Verify: Cloud console > Logging > Log-based metrics > User-defined metrics > a metric whose Filter matches `google.iam.admin.v1.CreateRole`, `UpdateRole` and `DeleteRole` exists, and Cloud console > Monitoring > Alerting > Policies > the policy on that metric shows Enabled
    - Fix: Cloud console > Logging > Log-based metrics > Create metric > Metric type: Counter > Name `custom-role-changes` > Filter `resource.type="iam_role" AND (protoPayload.methodName="google.iam.admin.v1.CreateRole" OR protoPayload.methodName="google.iam.admin.v1.UpdateRole" OR protoPayload.methodName="google.iam.admin.v1.DeleteRole")` > Create metric, then actions menu on that metric > Create alert from metric > add a notification channel > Create policy
  - **CLI**:
    - Verify: `gcloud logging metrics list --filter="name~role" --format="table(name, filter)"`
    - Verify: `gcloud alpha monitoring policies list --format="table(displayName, enabled, conditions[].conditionThreshold.filter)"`
    - Expect: a metric matching `google.iam.admin.v1.CreateRole`, `UpdateRole` and `DeleteRole`, and an alert policy whose condition filter names that metric with `enabled` = `True`. Quietly adding a permission to an existing custom role escalates everyone who holds it, without any new binding appearing.
    - Fix:
      ```bash
      gcloud logging metrics create custom-role-changes --log-filter='resource.type="iam_role" AND (protoPayload.methodName="google.iam.admin.v1.CreateRole" OR protoPayload.methodName="google.iam.admin.v1.UpdateRole" OR protoPayload.methodName="google.iam.admin.v1.DeleteRole")'
      ```
    - Fix:
      ```bash
      gcloud alpha monitoring policies create --display-name="Custom role changes" --condition-display-name="custom-role-changes above 0" --condition-filter='metric.type="logging.googleapis.com/user/custom-role-changes"' --if="> 0" --notification-channels=<channel-id>
      ```

- [ ] **Enable Monitoring for Bucket Permission Changes** - pass: a metric and enabled alert policy exist for bucket IAM changes
  - **Console**:
    - Verify: Cloud console > Logging > Log-based metrics > User-defined metrics > a metric whose Filter matches `storage.setIamPermissions` exists, and Cloud console > Monitoring > Alerting > Policies > the policy on that metric shows Enabled
    - Fix: Cloud console > Logging > Log-based metrics > Create metric > Metric type: Counter > Name `bucket-permission-changes` > Filter `resource.type="gcs_bucket" AND protoPayload.methodName="storage.setIamPermissions"` > Create metric, then actions menu on that metric > Create alert from metric > add a notification channel > Create policy
  - **CLI**:
    - Verify: `gcloud logging metrics list --filter="name~bucket" --format="table(name, filter)"`
    - Verify: `gcloud alpha monitoring policies list --format="table(displayName, enabled, conditions[].conditionThreshold.filter)"`
    - Expect: a metric matching `storage.setIamPermissions`, and an alert policy whose condition filter names that metric with `enabled` = `True`. Making a bucket public is one API call, and the data is gone before a scheduled scan would find it.
    - Fix:
      ```bash
      gcloud logging metrics create bucket-permission-changes --log-filter='resource.type="gcs_bucket" AND protoPayload.methodName="storage.setIamPermissions"'
      ```
    - Fix:
      ```bash
      gcloud alpha monitoring policies create --display-name="Bucket permission changes" --condition-display-name="bucket-permission-changes above 0" --condition-filter='metric.type="logging.googleapis.com/user/bucket-permission-changes"' --if="> 0" --notification-channels=<channel-id>
      ```

- [ ] **Enable Project Ownership Assignments Monitoring** - pass: a metric and enabled alert policy exist for owner grants
  - **Console**:
    - Verify: Cloud console > Logging > Log-based metrics > User-defined metrics > a metric whose Filter matches `roles/owner` binding additions or `ProjectOwnership` exists, and Cloud console > Monitoring > Alerting > Policies > the policy on that metric shows Enabled
    - Fix: Cloud console > Logging > Log-based metrics > Create metric > Metric type: Counter > Name `project-ownership-changes` > Filter `(protoPayload.serviceName="cloudresourcemanager.googleapis.com") AND (ProjectOwnership OR projectOwnerInvitee) OR (protoPayload.serviceData.policyDelta.bindingDeltas.action="ADD" AND protoPayload.serviceData.policyDelta.bindingDeltas.role="roles/owner")` > Create metric, then actions menu on that metric > Create alert from metric > add a notification channel > Create policy
  - **CLI**:
    - Verify: `gcloud logging metrics list --filter="name~owner" --format="table(name, filter)"`
    - Verify: `gcloud alpha monitoring policies list --format="table(displayName, enabled, conditions[].conditionThreshold.filter)"`
    - Expect: a metric matching `roles/owner` additions in `PROJECT_OWNERSHIP` or `SetIamPolicy` deltas, and an alert policy whose condition filter names that metric with `enabled` = `True`. Granting owner is the cleanest way to establish persistence, and it looks like ordinary administration in the logs.
    - Fix:
      ```bash
      gcloud logging metrics create project-ownership-changes --log-filter='(protoPayload.serviceName="cloudresourcemanager.googleapis.com") AND (ProjectOwnership OR projectOwnerInvitee) OR (protoPayload.serviceData.policyDelta.bindingDeltas.action="ADD" AND protoPayload.serviceData.policyDelta.bindingDeltas.role="roles/owner")'
      ```
    - Fix:
      ```bash
      gcloud alpha monitoring policies create --display-name="Project ownership changes" --condition-display-name="project-ownership-changes above 0" --condition-filter='metric.type="logging.googleapis.com/user/project-ownership-changes"' --if="> 0" --notification-channels=<channel-id>
      ```

- [ ] **Enable VPC Network Changes Monitoring** - pass: a metric and enabled alert policy exist for network and route changes
  - **Console**:
    - Verify: Cloud console > Logging > Log-based metrics > User-defined metrics > a metric whose Filter covers `compute.networks.` and `compute.routes.` methods exists, and Cloud console > Monitoring > Alerting > Policies > the policy on that metric shows Enabled
    - Fix: Cloud console > Logging > Log-based metrics > Create metric > Metric type: Counter > Name `vpc-network-changes` > Filter `resource.type="gce_network" AND (protoPayload.methodName:"compute.networks." OR protoPayload.methodName:"compute.routes." OR protoPayload.methodName:"compute.networks.addPeering")` > Create metric, then actions menu on that metric > Create alert from metric > add a notification channel > Create policy
  - **CLI**:
    - Verify: `gcloud logging metrics list --filter="name~(vpc OR network OR route)" --format="table(name, filter)"`
    - Verify: `gcloud alpha monitoring policies list --format="table(displayName, enabled, conditions[].conditionThreshold.filter)"`
    - Expect: metrics covering `compute.networks.*` and `compute.routes.*`, and alert policies whose condition filter names each metric with `enabled` = `True`. A new route or peering connection can redirect traffic or create an exfiltration path without touching any firewall rule.
    - Fix:
      ```bash
      gcloud logging metrics create vpc-network-changes --log-filter='resource.type="gce_network" AND (protoPayload.methodName:"compute.networks." OR protoPayload.methodName:"compute.routes." OR protoPayload.methodName:"compute.networks.addPeering")'
      ```
    - Fix:
      ```bash
      gcloud alpha monitoring policies create --display-name="VPC network changes" --condition-display-name="vpc-network-changes above 0" --condition-filter='metric.type="logging.googleapis.com/user/vpc-network-changes"' --if="> 0" --notification-channels=<channel-id>
      ```

- [ ] **Enable Monitoring for SQL Instance Configuration Changes** - pass: a metric and enabled alert policy exist for Cloud SQL changes
  - **Console**:
    - Verify: Cloud console > Logging > Log-based metrics > User-defined metrics > a metric whose Filter matches `cloudsql.instances.update` exists, and Cloud console > Monitoring > Alerting > Policies > the policy on that metric shows Enabled
    - Fix: Cloud console > Logging > Log-based metrics > Create metric > Metric type: Counter > Name `sql-instance-changes` > Filter `protoPayload.methodName="cloudsql.instances.update"` > Create metric, then actions menu on that metric > Create alert from metric > add a notification channel > Create policy
  - **CLI**:
    - Verify: `gcloud logging metrics list --filter="name~sql" --format="table(name, filter)"`
    - Verify: `gcloud alpha monitoring policies list --format="table(displayName, enabled, conditions[].conditionThreshold.filter)"`
    - Expect: a metric matching `cloudsql.instances.update`, and an alert policy whose condition filter names that metric with `enabled` = `True`. Adding a public IP or an authorized network of `0.0.0.0/0` is a configuration change, not an attack signature - only an alert distinguishes it from routine work.
    - Fix: `gcloud logging metrics create sql-instance-changes --log-filter='protoPayload.methodName="cloudsql.instances.update"'`
    - Fix:
      ```bash
      gcloud alpha monitoring policies create --display-name="SQL instance changes" --condition-display-name="sql-instance-changes above 0" --condition-filter='metric.type="logging.googleapis.com/user/sql-instance-changes"' --if="> 0" --notification-channels=<channel-id>
      ```

- [ ] **Enable data access audit logging for all critical service APIs** - pass: `DATA_READ` and `DATA_WRITE` enabled for `allServices`
  - **Console**:
    - Verify: Cloud console > IAM & Admin > Audit Logs > select the organization in the resource picker > Default audit config > Log types shows Admin Read, Data Read and Data Write checked and Exempted principals is empty
    - Fix: Cloud console > IAM & Admin > Audit Logs > select the organization in the resource picker > Default audit config > Log types > check Admin Read, Data Read and Data Write > Exempted principals > remove every entry > Save
  - **CLI**:
    - Verify:
      ```bash
      for p in $(gcloud projects list --format="value(projectId)"); do
        echo "== $p"
        gcloud projects get-iam-policy "$p" --format="json" | python3 -c "import json,sys; print(json.load(sys.stdin).get('auditConfigs','NONE'))"
      done
      ```
    - Expect: an `auditConfigs` entry for `allServices` covering `ADMIN_READ`, `DATA_READ` and `DATA_WRITE`, with no `exemptedMembers`. Exempted members are invisible in the audit trail - which is precisely the property an attacker wants.
    - Fix:
      ```bash
      gcloud organizations get-iam-policy $ORG_ID --format=json > policy.json
      # add to policy.json: "auditConfigs":[{"service":"allServices","auditLogConfigs":[{"logType":"DATA_READ"},{"logType":"DATA_WRITE"},{"logType":"ADMIN_READ"}]}]
      gcloud organizations set-iam-policy $ORG_ID policy.json
      ```

- [ ] **Export All Log Entries Using Sinks** - pass: an aggregated sink exports logs outside the source project
  - **Console**:
    - Verify: Cloud console > Logging > Log Router > select the organization in the resource picker > Sinks table > an Enabled sink whose Destination is a Cloud Storage bucket or BigQuery dataset in a separate, locked-down project, with Include child resources checked in its details
    - Fix: Cloud console > Logging > Log Router > select the organization in the resource picker > Create sink > Sink name > Sink destination: Cloud Storage bucket in the logging project > check Include logs ingested by this organization and all child resources > leave the inclusion filter empty > Create sink, then grant the sink's writer identity Storage Object Creator on that bucket and set a locked retention policy
  - **CLI**:
    - Verify: `gcloud logging sinks list --organization=$ORG_ID --format="table(name, destination, filter)"`
    - Verify:
      ```bash
      for p in $(gcloud projects list --format="value(projectId)"); do
        gcloud logging sinks list --project="$p" --format="table(name, destination)"
      done
      ```
    - Expect: an organization-level aggregated sink exists, writing to a bucket or dataset in a separate, locked-down project. Logs kept only in the project being attacked are logs the attacker can delete.
    - Fix:
      ```bash
      gcloud logging sinks create org-audit-sink storage.googleapis.com/<bucket> --organization=$ORG_ID --include-children --log-filter=""
      ```
    - Fix: `gcloud storage buckets add-iam-policy-binding gs://<bucket> --member=<writer-identity> --role=roles/storage.objectCreator`
    - Fix: `gcloud storage buckets update gs://<bucket> --retention-period=<duration>`
    - Fix: `gcloud storage buckets update gs://<bucket> --lock-retention-period`

---

## Encryption Keys (Cloud KMS)

- [ ] **Check for Publicly Accessible Cloud KMS Keys** - pass: no key or keyring grants `allUsers` or `allAuthenticatedUsers`
  - **Console**:
    - Verify: Cloud console > Security > Key Management > Key rings > <key ring> > select <key> > Show info panel > Permissions > principal list shows no `allUsers` or `allAuthenticatedUsers` (repeat with the key ring itself selected, since its bindings are inherited by every key under it)
    - Fix: Cloud console > Security > Key Management > Key rings > <key ring> > select <key> > Show info panel > Permissions > select the `allUsers` or `allAuthenticatedUsers` row > Remove principal > Remove
  - **CLI**:
    - Verify:
      ```bash
      for p in $(gcloud projects list --format="value(projectId)"); do
        for loc in $(gcloud kms locations list --format="value(locationId)" 2>/dev/null); do
          for kr in $(gcloud kms keyrings list --location="$loc" --project="$p" --format="value(name)" 2>/dev/null); do
            for k in $(gcloud kms keys list --keyring="$kr" --location="$loc" --project="$p" --format="value(name)" 2>/dev/null); do
              gcloud kms keys get-iam-policy "$k" --keyring="$kr" --location="$loc" --project="$p" --format=json | grep -qE '"allUsers"|"allAuthenticatedUsers"' && echo "PUBLIC KEY: $k"
            done
          done
        done
      done
      ```
    - Expect: no output. A publicly accessible key makes the encryption decorative - anyone who can reach the ciphertext can also call `decrypt`.
    - Fix:
      ```bash
      gcloud kms keys remove-iam-policy-binding <key> --keyring=<keyring> --location=<location> --member=allUsers --role=roles/cloudkms.cryptoKeyDecrypter
      ```
    - Fix:
      ```bash
      gcloud kms keyrings remove-iam-policy-binding <keyring> --location=<location> --member=allUsers --role=roles/cloudkms.cryptoKeyDecrypter
      ```

---

## Databases (Cloud SQL)

- [ ] **Check for Cloud SQL Database Instances with Public IPs** - pass: no instance has a `PRIMARY` public IP
  - **Console**:
    - Verify: Cloud console > SQL > <instance> > Connections > Networking > Public IP is unchecked and Private IP is checked
    - Fix: Cloud console > SQL > <instance> > Connections > Networking > uncheck Public IP > check Private IP > Network: <vpc> > Save, then connect through the Cloud SQL Auth Proxy
  - **CLI**:
    - Verify:
      ```bash
      for p in $(gcloud projects list --format="value(projectId)"); do
        gcloud sql instances list --project="$p" --format="table(name, region, ipAddresses[].type.list(), settings.ipConfiguration.ipv4Enabled)"
      done
      ```
    - Expect: `ipv4Enabled` is `False` and no address of type `PRIMARY` appears. A public IP puts the database on the internet, guarded only by authorized networks and the database password.
    - Fix: `gcloud sql instances patch <instance> --no-assign-ip --network=projects/<project>/global/networks/<vpc>`

- [ ] **Check for Publicly Accessible Cloud SQL Database Instances** - pass: no authorized network is `0.0.0.0/0`
  - **Console**:
    - Verify: Cloud console > SQL > <instance> > Connections > Networking > Authorized networks list contains no `0.0.0.0/0`
    - Fix: Cloud console > SQL > <instance> > Connections > Networking > Authorized networks > trash icon on the `0.0.0.0/0` entry > Add a network > <office-cidr> > Done > Save
  - **CLI**:
    - Verify:
      ```bash
      for p in $(gcloud projects list --format="value(projectId)"); do
        gcloud sql instances list --project="$p" --format="table(name, settings.ipConfiguration.authorizedNetworks[].value.list())"
      done
      ```
    - Expect: no instance lists `0.0.0.0/0`. That single entry makes the database reachable from every host on the internet, leaving the password as the only control.
    - Fix: `gcloud sql instances patch <instance> --authorized-networks=<office-cidr>`
    - Fix: `gcloud sql instances patch <instance> --no-assign-ip`

- [ ] **Configure Root Password for MySQL Database Access** - pass: the `root` user has a password set
  - **Console**:
    - Verify: Cloud console > SQL > <instance> > Users > the `root` row exists with a specific Host name rather than `%`, and the instance was created with a root password
    - Fix: Cloud console > SQL > <instance> > Users > actions menu on the `root` row > Change password > enter a strong password > OK
  - **CLI**:
    - Verify:
      ```bash
      for p in $(gcloud projects list --format="value(projectId)"); do
        for i in $(gcloud sql instances list --project="$p" --filter="databaseVersion~MYSQL" --format="value(name)"); do
          echo "== $p/$i"
          gcloud sql users list --instance="$i" --project="$p" --format="table(name, host)"
        done
      done
      ```
    - Expect: a `root` user exists with a host restriction, and you can confirm a password was set at creation. A MySQL instance created without `--root-password` has a blank root password, and if a public IP is also present that is an unauthenticated database on the internet.
    - Fix: `gcloud sql users set-password root --host=% --instance=<instance> --prompt-for-password`

- [ ] **Disable "local_infile" Flag for MySQL Database Instances** - pass: `local_infile` = `off`
  - **Console**:
    - Verify: Cloud console > SQL > <instance> > Overview > Configuration > Database flags shows `local_infile` = `off`
    - Fix: Cloud console > SQL > <instance> > Edit > Flags > Add a database flag > `local_infile` > Off > Done > Save
  - **CLI**:
    - Verify:
      ```bash
      for p in $(gcloud projects list --format="value(projectId)"); do
        gcloud sql instances list --project="$p" --filter="databaseVersion~MYSQL" --format="table(name, settings.databaseFlags[].name.list(), settings.databaseFlags[].value.list())"
      done
      ```
    - Expect: `local_infile` appears with value `off`. When on, a compromised or malicious MySQL server can read files from the connecting client's filesystem, and it widens SQL injection into local file disclosure.
    - Fix: `gcloud sql instances patch <instance> --database-flags local_infile=off,<other-flag>=<value>`

- [ ] **Disable "Cross DB Ownership Chaining" Flag for SQL Server** - pass: `cross db ownership chaining` = `off`
  - **Console**:
    - Verify: Cloud console > SQL > <instance> > Overview > Configuration > Database flags shows `cross db ownership chaining` = `off`
    - Fix: Cloud console > SQL > <instance> > Edit > Flags > Add a database flag > `cross db ownership chaining` > Off > Done > Save
  - **CLI**:
    - Verify:
      ```bash
      for p in $(gcloud projects list --format="value(projectId)"); do
        gcloud sql instances list --project="$p" --filter="databaseVersion~SQLSERVER" --format="table(name, settings.databaseFlags[].name.list(), settings.databaseFlags[].value.list())"
      done
      ```
    - Expect: the flag appears with value `off`. Ownership chaining lets a user in one database reach objects in another without a permission check there, which defeats per-database isolation on a shared instance.
    - Fix: `gcloud sql instances patch <instance> --database-flags "cross db ownership chaining=off"`

- [ ] **Disable "remote access" Flag for SQL Server** - pass: `remote access` = `off`
  - **Console**:
    - Verify: Cloud console > SQL > <instance> > Overview > Configuration > Database flags shows `remote access` = `off`
    - Fix: Cloud console > SQL > <instance> > Edit > Flags > Add a database flag > `remote access` > Off > Done > Save
  - **CLI**:
    - Verify:
      ```bash
      for p in $(gcloud projects list --format="value(projectId)"); do
        gcloud sql instances list --project="$p" --filter="databaseVersion~SQLSERVER" --format="table(name, settings.databaseFlags[].name.list(), settings.databaseFlags[].value.list())"
      done
      ```
    - Expect: the flag appears with value `off`. Remote access permits running stored procedures from remote servers, which can be chained for lateral movement between instances.
    - Fix: `gcloud sql instances patch <instance> --database-flags "remote access=off"`

---

## Networking (Cloud VPC)

Firewall rules apply to a network, not a subnet, and `0.0.0.0/0` in `sourceRanges` means the internet. Each port check below looks for an ingress allow rule reaching that port from anywhere.

- [ ] **Default VPC Network In Use** - pass: no project uses the auto-created `default` network
  - **Console**:
    - Verify: Cloud console > VPC network > VPC networks > Name column shows no network named `default`
    - Fix: Cloud console > VPC network > VPC networks > default > Delete VPC network > Delete (after migrating workloads to a custom-mode VPC), then Cloud console > IAM & Admin > Organization Policies > `Skip default network creation` > Manage policy > Applies to: Customize > Add a rule > Enforcement: On > Set policy
  - **CLI**:
    - Verify:
      ```bash
      for p in $(gcloud projects list --format="value(projectId)"); do
        n=$(gcloud compute networks list --project="$p" --filter="name=default" --format="value(name)")
        [ -n "$n" ] && echo "$p: default network present"
      done
      ```
    - Expect: no output. The default network ships with auto-created subnets in every region and permissive rules allowing internal traffic plus SSH, RDP and ICMP from anywhere - none of which you chose.
    - Fix: `gcloud compute networks delete default --project=<project>`
    - Fix: `gcloud resource-manager org-policies enable-enforce constraints/compute.skipDefaultNetworkCreation --organization=$ORG_ID`

- [ ] **Check for Unrestricted SSH Access** - pass: no firewall rule allows port 22 from `0.0.0.0/0`
  - **Console**:
    - Verify: Cloud console > VPC network > Firewall > filter `Direction: Ingress` and `Filters: 0.0.0.0/0` > Protocols / ports column shows no Allow rule containing `tcp:22` or `all`
    - Fix: Cloud console > VPC network > Firewall > <rule> > Edit > Source IPv4 ranges: replace `0.0.0.0/0` with <office-cidr> > Save, or Delete the rule and use IAP TCP forwarding
  - **CLI**:
    - Verify:
      ```bash
      for p in $(gcloud projects list --format="value(projectId)"); do
        gcloud compute firewall-rules list --project="$p" --filter="direction=INGRESS AND disabled=false AND sourceRanges:0.0.0.0/0 AND (allowed.ports:22 OR allowed.ports~'^$')" --format="table(name, network, allowed[].map().firewall_rule().list())"
      done
      ```
    - Expect: no rows, including rules with an empty port list, which allow all ports and are the easiest to miss. Open SSH is scanned and brute-forced continuously.
    - Fix: `gcloud compute firewall-rules update <rule> --source-ranges=<office-cidr>`
    - Fix: `gcloud compute ssh <instance> --zone=<zone> --tunnel-through-iap`

- [ ] **Check for Unrestricted RDP Access** - pass: no firewall rule allows port 3389 from `0.0.0.0/0`
  - **Console**:
    - Verify: Cloud console > VPC network > Firewall > filter `Direction: Ingress` and `Filters: 0.0.0.0/0` > Protocols / ports column shows no Allow rule containing `tcp:3389` or `all`
    - Fix: Cloud console > VPC network > Firewall > <rule> > Edit > Source IPv4 ranges: replace `0.0.0.0/0` with <office-cidr> > Save, or Delete the rule and use IAP for Windows remote desktop
  - **CLI**:
    - Verify:
      ```bash
      for p in $(gcloud projects list --format="value(projectId)"); do
        gcloud compute firewall-rules list --project="$p" --filter="direction=INGRESS AND disabled=false AND sourceRanges:0.0.0.0/0 AND allowed.ports:3389" --format="table(name, network, targetTags)"
      done
      ```
    - Expect: no rows. Exposed RDP is the primary initial-access vector for ransomware operators.
    - Fix: `gcloud compute firewall-rules update <rule> --source-ranges=<office-cidr>`

- [ ] **Check for Unrestricted MySQL Database Access** - pass: no firewall rule allows port 3306 from `0.0.0.0/0`
  - **Console**:
    - Verify: Cloud console > VPC network > Firewall > filter `Direction: Ingress` and `Filters: 0.0.0.0/0` > Protocols / ports column shows no Allow rule containing `tcp:3306` or `all`
    - Fix: Cloud console > VPC network > Firewall > <rule> > Edit > Source IPv4 ranges: replace `0.0.0.0/0` with <app-subnet-cidr>, or Targets: Specified service account > <app-tier-sa> > Save
  - **CLI**:
    - Verify:
      ```bash
      for p in $(gcloud projects list --format="value(projectId)"); do
        gcloud compute firewall-rules list --project="$p" --filter="direction=INGRESS AND disabled=false AND sourceRanges:0.0.0.0/0 AND allowed.ports:3306" --format="table(name, network, targetTags)"
      done
      ```
    - Expect: no rows. A database reachable from the internet is one credential-stuffing run from full data disclosure.
    - Fix: `gcloud compute firewall-rules update <rule> --source-ranges=<app-subnet-cidr>`
    - Fix: `gcloud compute firewall-rules update <rule> --target-service-accounts=<app-tier-sa>`

- [ ] **Check for Unrestricted PostgreSQL Database Access** - pass: no firewall rule allows port 5432 from `0.0.0.0/0`
  - **Console**:
    - Verify: Cloud console > VPC network > Firewall > filter `Direction: Ingress` and `Filters: 0.0.0.0/0` > Protocols / ports column shows no Allow rule containing `tcp:5432` or `all`
    - Fix: Cloud console > VPC network > Firewall > <rule> > Edit > Source IPv4 ranges: replace `0.0.0.0/0` with <app-subnet-cidr> > Save, or Delete the rule and reach the database over a private path
  - **CLI**:
    - Verify:
      ```bash
      for p in $(gcloud projects list --format="value(projectId)"); do
        gcloud compute firewall-rules list --project="$p" --filter="direction=INGRESS AND disabled=false AND sourceRanges:0.0.0.0/0 AND allowed.ports:5432" --format="table(name, network, targetTags)"
      done
      ```
    - Expect: no rows. An internet-reachable PostgreSQL port turns a weak or reused password into full read access to the data.
    - Fix: `gcloud compute firewall-rules update <rule> --source-ranges=<app-subnet-cidr>`

- [ ] **Check for Unrestricted SQL Server Access** - pass: no firewall rule allows port 1433 from `0.0.0.0/0`
  - **Console**:
    - Verify: Cloud console > VPC network > Firewall > filter `Direction: Ingress` and `Filters: 0.0.0.0/0` > Protocols / ports column shows no Allow rule containing `tcp:1433` or `all`
    - Fix: Cloud console > VPC network > Firewall > <rule> > Edit > Source IPv4 ranges: replace `0.0.0.0/0` with <app-subnet-cidr> > Save, or Delete the rule
  - **CLI**:
    - Verify:
      ```bash
      for p in $(gcloud projects list --format="value(projectId)"); do
        gcloud compute firewall-rules list --project="$p" --filter="direction=INGRESS AND disabled=false AND sourceRanges:0.0.0.0/0 AND allowed.ports:1433" --format="table(name, network, targetTags)"
      done
      ```
    - Expect: no rows. SQL Server on the internet is brute-forced for the `sa` account within hours of appearing.
    - Fix: `gcloud compute firewall-rules update <rule> --source-ranges=<app-subnet-cidr>`

- [ ] **Check for Unrestricted Redis Access** - pass: no firewall rule allows port 6379 from `0.0.0.0/0`
  - **Console**:
    - Verify: Cloud console > VPC network > Firewall > filter `Direction: Ingress` and `Filters: 0.0.0.0/0` > Protocols / ports column shows no Allow rule containing `tcp:6379` or `all`
    - Fix: Cloud console > VPC network > Firewall > <rule> > Edit > Source IPv4 ranges: replace `0.0.0.0/0` with <app-subnet-cidr> > Save, and move to Memorystore with AUTH and private service access
  - **CLI**:
    - Verify:
      ```bash
      for p in $(gcloud projects list --format="value(projectId)"); do
        gcloud compute firewall-rules list --project="$p" --filter="direction=INGRESS AND disabled=false AND sourceRanges:0.0.0.0/0 AND allowed.ports:6379" --format="table(name, network, targetTags)"
      done
      ```
    - Expect: no rows. Redis is unauthenticated by default and its `CONFIG` command can write files to disk - exposure is frequently direct code execution.
    - Fix: `gcloud compute firewall-rules update <rule> --source-ranges=<app-subnet-cidr>`

- [ ] **Check for Unrestricted SMTP Access** - pass: no firewall rule allows port 25 from `0.0.0.0/0`
  - **Console**:
    - Verify: Cloud console > VPC network > Firewall > filter `Direction: Ingress` and `Filters: 0.0.0.0/0` > Protocols / ports column shows no Allow rule containing `tcp:25` or `all`
    - Fix: Cloud console > VPC network > Firewall > <rule> > Delete > Delete, and send mail through a managed provider rather than running a relay
  - **CLI**:
    - Verify:
      ```bash
      for p in $(gcloud projects list --format="value(projectId)"); do
        gcloud compute firewall-rules list --project="$p" --filter="direction=INGRESS AND disabled=false AND sourceRanges:0.0.0.0/0 AND allowed.ports:25" --format="table(name, network, targetTags)"
      done
      ```
    - Expect: no rows. An open relay gets your address space blocklisted and your domain used for phishing that appears to come from you.
    - Fix: `gcloud compute firewall-rules delete <rule>`

- [ ] **Check for Unrestricted Outbound Access on All Ports** - pass: egress is not a blanket allow to `0.0.0.0/0`
  - **Console**:
    - Verify: Cloud console > VPC network > Firewall > filter `Direction: Egress` > no Allow rule with Filters `0.0.0.0/0` and Protocols / ports `all` at a priority number lower than your deny rules
    - Fix: Cloud console > VPC network > Firewall > Create firewall rule > Name `deny-all-egress` > Direction of traffic: Egress > Action on match: Deny > Targets: All instances in the network > Destination IPv4 ranges: 0.0.0.0/0 > Protocols and ports: Deny all > Priority 65534 > Create, then create higher-priority Allow rules for specific destinations
  - **CLI**:
    - Verify:
      ```bash
      for p in $(gcloud projects list --format="value(projectId)"); do
        gcloud compute firewall-rules list --project="$p" --filter="direction=EGRESS AND disabled=false AND destinationRanges:0.0.0.0/0 AND allowed.IPProtocol:all" --format="table(name, network, priority)"
      done
      ```
    - Expect: no permissive egress rule at a priority below your deny rules. Open egress is what turns a foothold into data exfiltration and command-and-control; GCP allows all egress by default, so this needs a deliberate change.
    - Fix:
      ```bash
      gcloud compute firewall-rules create deny-all-egress --network=<network> --direction=EGRESS --action=DENY --rules=all --destination-ranges=0.0.0.0/0 --priority=65534
      ```

- [ ] **Check for VPC Firewall Rules with Port Ranges** - pass: no allow rule opens a contiguous port range
  - **Console**:
    - Verify: Cloud console > VPC network > Firewall > filter `Direction: Ingress` > Protocols / ports column shows no Allow rule with a range such as `tcp:1-65535` or `tcp:1024-65535`
    - Fix: Cloud console > VPC network > Firewall > <rule> > Edit > Protocols and ports: Specified protocols and ports > TCP: list only the individual ports in use > Save
  - **CLI**:
    - Verify:
      ```bash
      for p in $(gcloud projects list --format="value(projectId)"); do
        gcloud compute firewall-rules list --project="$p" --filter="direction=INGRESS AND disabled=false" --format="value(name, allowed[].map().firewall_rule().list())" | grep -E '[0-9]+-[0-9]+' | sed "s|^|$p |"
      done
      ```
    - Expect: no output. A range such as `1-65535` or `1024-65535` exposes every service that will ever listen on the host, including ones added long after the rule was written.
    - Fix: `gcloud compute firewall-rules update <rule> --rules=tcp:<port1>,tcp:<port2>`

- [ ] **Enable VPC Flow Logs for VPC Subnets** - pass: `enableFlowLogs` = `True` on every subnet
  - **Console**:
    - Verify: Cloud console > VPC network > VPC networks > <network> > Subnets > Flow logs column reads `On` for every subnet
    - Fix: Cloud console > VPC network > VPC networks > <network> > Subnets > <subnet> > Edit > Flow logs: On > Aggregation interval: 5 sec > Sample rate: 50% > Save
  - **CLI**:
    - Verify:
      ```bash
      for p in $(gcloud projects list --format="value(projectId)"); do
        gcloud compute networks subnets list --project="$p" --format="table(name, region, network, enableFlowLogs)"
      done
      ```
    - Expect: `True` on every subnet carrying workloads. Without flow logs there is no record of what talked to what, so an intrusion cannot be scoped after the fact.
    - Fix:
      ```bash
      gcloud compute networks subnets update <subnet> --region=<region> --enable-flow-logs --logging-aggregation-interval=interval-5-sec --logging-flow-sampling=0.5
      ```

- [ ] **Enable Logging for VPC Firewall Rules** - pass: `logConfig.enable` = `True` on every allow rule
  - **Console**:
    - Verify: Cloud console > VPC network > Firewall > Logs column reads `On` for every ingress Allow rule
    - Fix: Cloud console > VPC network > Firewall > <rule> > Edit > Logs: On > check Include metadata > Save
  - **CLI**:
    - Verify:
      ```bash
      for p in $(gcloud projects list --format="value(projectId)"); do
        gcloud compute firewall-rules list --project="$p" --format="table(name, direction, logConfig.enable)"
      done
      ```
    - Expect: `True` at least on every ingress allow rule. Firewall logs are what tell you a rule is being exercised - and by whom - which is also how you find rules that can safely be removed.
    - Fix: `gcloud compute firewall-rules update <rule> --enable-logging --logging-metadata=include-all`

- [ ] **Restrict Access to High Risk Ports** - pass: no rule allows NetBIOS, SMB, RPC or Telnet from `0.0.0.0/0`
  - **Console**:
    - Verify: Cloud console > VPC network > Firewall > filter `Direction: Ingress` and `Filters: 0.0.0.0/0` > Protocols / ports column shows no Allow rule containing `tcp:23`, `tcp:135`, `tcp:137`, `tcp:138`, `tcp:139`, `tcp:445` or `all`
    - Fix: Cloud console > VPC network > Firewall > <rule> > Delete > Delete, or where the port is needed internally, <rule> > Edit > Source IPv4 ranges: <specific-subnet-cidr> > Save
  - **CLI**:
    - Verify:
      ```bash
      for p in $(gcloud projects list --format="value(projectId)"); do
        for port in 23 135 137 138 139 445; do
          gcloud compute firewall-rules list --project="$p" --filter="direction=INGRESS AND disabled=false AND sourceRanges:0.0.0.0/0 AND allowed.ports:$port" --format="value(name)" | sed "s|^|$p port $port: |"
        done
      done
      ```
    - Expect: no output. These are Windows file-sharing and legacy remote-access ports - SMB on 445 is the port behind EternalBlue and most self-propagating ransomware, and Telnet carries credentials in cleartext.
    - Fix: `gcloud compute firewall-rules delete <rule>`
    - Fix: `gcloud compute firewall-rules update <rule> --source-ranges=<specific-subnet-cidr>`

---

## Functions (Cloud Functions)

- [ ] **Publicly Accessible Functions** - pass: no function grants invoker to `allUsers`
  - **Console**:
    - Verify: Cloud console > Cloud Run > Services > <function> > Security > Authentication reads `Require authentication`, and the Permissions panel lists no `allUsers`
    - Fix: Cloud console > Cloud Run > Services > <function> > Security > Authentication: Require authentication > Save, then Permissions > Add principal > <calling service account> > Role: Cloud Run Invoker > Save
  - **CLI**:
    - Verify:
      ```bash
      for p in $(gcloud projects list --format="value(projectId)"); do
        for f in $(gcloud functions list --project="$p" --format="value(name)" 2>/dev/null); do
          gcloud functions get-iam-policy "$f" --project="$p" --format=json 2>/dev/null | grep -q '"allUsers"' && echo "PUBLIC: $p $f"
        done
      done
      ```
    - Expect: no output, except functions that are deliberately public webhooks sitting behind an API Gateway or load balancer with Cloud Armor. `allUsers` on an invoker role is an unauthenticated internet endpoint.
    - Fix: `gcloud functions remove-iam-policy-binding <function> --member=allUsers --role=roles/cloudfunctions.invoker`
    - Fix: `gcloud functions add-iam-policy-binding <function> --member=serviceAccount:<caller-sa> --role=roles/cloudfunctions.invoker`

- [ ] **GCP Functions with Admin Privileges** - pass: no function runs as a service account with owner, editor or admin
  - **Console**:
    - Verify: Cloud console > Cloud Run > Services > <function> > Security > note the Service account, then Cloud console > IAM & Admin > IAM > filter the table by that account > Role column shows no Owner, Editor or `Admin` role
    - Fix: Cloud console > IAM & Admin > IAM > pencil icon on the function's service account row > delete the Owner, Editor or Admin role > Add another role covering only the APIs the handler calls > Save
  - **CLI**:
    - Verify:
      ```bash
      for p in $(gcloud projects list --format="value(projectId)"); do
        gcloud functions list --project="$p" --format="table(name, serviceAccountEmail)" 2>/dev/null
      done
      ```
    - Verify:
      ```bash
      gcloud projects get-iam-policy <project> --flatten="bindings[].members" --filter="bindings.members:serviceAccount:<sa>" --format="value(bindings.role)"
      ```
    - Expect: no function's service account holds `roles/owner`, `roles/editor` or a `*.admin` role. The function's identity is available to any code it runs, including a compromised dependency.
    - Fix: `gcloud projects remove-iam-policy-binding <project> --member="serviceAccount:<sa>" --role="roles/editor"`

- [ ] **GCP Function using Default Service Account** - pass: no function uses the default App Engine or Compute service account
  - **Console**:
    - Verify: Cloud console > Cloud Run > Services > <function> > Security > Service account is neither `<project>@appspot.gserviceaccount.com` nor `<number>-compute@developer.gserviceaccount.com`
    - Fix: Cloud console > IAM & Admin > Service Accounts > Create service account for the function > Create, then Cloud console > Cloud Run > Services > <function> > Edit & deploy new revision > Security > Service account: <per-function account> > Deploy
  - **CLI**:
    - Verify:
      ```bash
      for p in $(gcloud projects list --format="value(projectId)"); do
        gcloud functions list --project="$p" --format="value(name, serviceAccountEmail)" 2>/dev/null | grep -E "appspot.gserviceaccount.com|compute@developer.gserviceaccount.com" | sed "s|^|$p |"
      done
      ```
    - Expect: no output. The default accounts carry `roles/editor`, so every function sharing one has write access to nearly the whole project and to each other's resources.
    - Fix: `gcloud iam service-accounts create <function-sa> --display-name="<function> runtime"`
    - Fix: `gcloud functions deploy <function> --service-account=<function-sa>@<project>.iam.gserviceaccount.com`

- [ ] **Use Secrets Manager for Managing Secrets in Google Cloud Functions** - pass: no secret-shaped value in plaintext environment variables
  - **Console**:
    - Verify: Cloud console > Cloud Run > Services > <function> > Revisions > current revision > Variables & Secrets > Environment variables list holds no literal value under a name like `*KEY*`, `*SECRET*`, `*TOKEN*`, `*PASSWORD*` or `*CREDENTIAL*`
    - Fix: Cloud console > Security > Secret Manager > Create secret > Name > Secret value > Create secret, grant the function's service account Secret Manager Secret Accessor under Permissions, then Cloud console > Cloud Run > Services > <function> > Edit & deploy new revision > Variables & Secrets > Reference a secret > Exposed as environment variable `<ENV_VAR>` > remove the plaintext variable > Deploy, and rotate every value that was in plaintext
  - **CLI**:
    - Verify:
      ```bash
      for p in $(gcloud projects list --format="value(projectId)"); do
        for f in $(gcloud functions list --project="$p" --format="value(name)" 2>/dev/null); do
          echo "== $p/$f"
          gcloud functions describe "$f" --project="$p" --format="value(serviceConfig.environmentVariables)" 2>/dev/null
        done
      done
      ```
    - Expect: no variable whose name suggests a secret (`*KEY*`, `*SECRET*`, `*TOKEN*`, `*PASSWORD*`, `*CREDENTIAL*`) holds a literal value. Environment variables are visible to anyone with `cloudfunctions.functions.get` and appear in deployment logs and Terraform state.
    - Fix: `gcloud secrets create <secret> --data-file=-`
    - Fix: `gcloud secrets add-iam-policy-binding <secret> --member=serviceAccount:<function-sa> --role=roles/secretmanager.secretAccessor`
    - Fix: `gcloud functions deploy <function> --set-secrets=<ENV_VAR>=<secret>:latest`

---

## Organization Policies

- [ ] **Define Allowed External IPs for VM Instances** - pass: `constraints/compute.vmExternalIpAccess` is enforced with a deny-all or allow-list
  - **Console**:
    - Verify: Cloud console > IAM & Admin > Organization Policies > select the organization in the resource picker > `Define allowed external IPs for VM instances` > Policy details > Effective policy reads Deny all, or an explicit Allow list of instance names
    - Fix: Cloud console > IAM & Admin > Organization Policies > select the organization in the resource picker > `Define allowed external IPs for VM instances` > Manage policy > Applies to: Customize > Add a rule > Policy values: Deny all > Set policy, then add Custom allow rules for the specific instances that need an external IP
  - **CLI**:
    - Verify: `gcloud resource-manager org-policies describe constraints/compute.vmExternalIpAccess --organization=$ORG_ID --effective`
    - Expect: a `listPolicy` with `allValues: DENY`, or an explicit `allowedValues` list of the instances permitted an external IP. The default is unrestricted, so any project owner can publish a VM to the internet.
    - Fix: `gcloud resource-manager org-policies deny constraints/compute.vmExternalIpAccess --organization=$ORG_ID --all`
    - Fix: `gcloud resource-manager org-policies allow constraints/compute.vmExternalIpAccess projects/<project>/zones/<zone>/instances/<instance> --project=<project>`

- [ ] **Disable Automatic IAM Role Grants for Default Service Accounts** - pass: `constraints/iam.automaticIamGrantsForDefaultServiceAccounts` is enforced
  - **Console**:
    - Verify: Cloud console > IAM & Admin > Organization Policies > select the organization in the resource picker > `Disable Automatic IAM Grants for Default Service Accounts` > Policy details > Effective policy reads Enforced
    - Fix: Cloud console > IAM & Admin > Organization Policies > select the organization in the resource picker > `Disable Automatic IAM Grants for Default Service Accounts` > Manage policy > Applies to: Customize > Add a rule > Enforcement: On > Set policy, then remove the existing `roles/editor` grants from default service accounts in current projects
  - **CLI**:
    - Verify: `gcloud resource-manager org-policies describe constraints/iam.automaticIamGrantsForDefaultServiceAccounts --organization=$ORG_ID --effective`
    - Expect: `booleanPolicy.enforced` is `true`. Without it, every new project's default Compute Engine and App Engine service accounts are granted `roles/editor` automatically - over-privilege created at project creation, before anyone reviews anything.
    - Fix: `gcloud resource-manager org-policies enable-enforce constraints/iam.automaticIamGrantsForDefaultServiceAccounts --organization=$ORG_ID`

- [ ] **Disable Serial Port Access Support at Organization Level** - pass: `constraints/compute.disableSerialPortAccess` is enforced
  - **Console**:
    - Verify: Cloud console > IAM & Admin > Organization Policies > select the organization in the resource picker > `Disable VM serial port access` > Policy details > Effective policy reads Enforced
    - Fix: Cloud console > IAM & Admin > Organization Policies > select the organization in the resource picker > `Disable VM serial port access` > Manage policy > Applies to: Customize > Add a rule > Enforcement: On > Set policy
  - **CLI**:
    - Verify: `gcloud resource-manager org-policies describe constraints/compute.disableSerialPortAccess --organization=$ORG_ID --effective`
    - Expect: `booleanPolicy.enforced` is `true`. The interactive serial console bypasses firewall rules and IP restrictions entirely, so a per-instance setting is not enough - this is the organization-wide backstop.
    - Fix: `gcloud resource-manager org-policies enable-enforce constraints/compute.disableSerialPortAccess --organization=$ORG_ID`

- [ ] **Disable Service Account Key Upload** - pass: `constraints/iam.disableServiceAccountKeyUpload` is enforced
  - **Console**:
    - Verify: Cloud console > IAM & Admin > Organization Policies > select the organization in the resource picker > `Disable Service Account Key Upload` > Policy details > Effective policy reads Enforced
    - Fix: Cloud console > IAM & Admin > Organization Policies > select the organization in the resource picker > `Disable Service Account Key Upload` > Manage policy > Applies to: Customize > Add a rule > Enforcement: On > Set policy
  - **CLI**:
    - Verify: `gcloud resource-manager org-policies describe constraints/iam.disableServiceAccountKeyUpload --organization=$ORG_ID --effective`
    - Expect: `booleanPolicy.enforced` is `true`. Uploading external key material means the private key was generated outside Google and may exist in places you cannot audit.
    - Fix: `gcloud resource-manager org-policies enable-enforce constraints/iam.disableServiceAccountKeyUpload --organization=$ORG_ID`

- [ ] **Disable User-Managed Key Creation for Service Accounts** - pass: `constraints/iam.disableServiceAccountKeyCreation` is enforced
  - **Console**:
    - Verify: Cloud console > IAM & Admin > Organization Policies > select the organization in the resource picker > `Disable service account key creation` > Policy details > Effective policy reads Enforced
    - Fix: Cloud console > IAM & Admin > Organization Policies > select the organization in the resource picker > `Disable service account key creation` > Manage policy > Applies to: Customize > Add a rule > Enforcement: On > Set policy (migrate workloads to Workload Identity Federation first, or deployments that mint keys will fail)
  - **CLI**:
    - Verify: `gcloud resource-manager org-policies describe constraints/iam.disableServiceAccountKeyCreation --organization=$ORG_ID --effective`
    - Expect: `booleanPolicy.enforced` is `true`. This is the structural version of the service account key controls above - it stops the next key being created rather than finding it later.
    - Fix: `gcloud resource-manager org-policies enable-enforce constraints/iam.disableServiceAccountKeyCreation --organization=$ORG_ID`

- [ ] **Skip Default VPC Network Creation** - pass: `constraints/compute.skipDefaultNetworkCreation` is enforced
  - **Console**:
    - Verify: Cloud console > IAM & Admin > Organization Policies > select the organization in the resource picker > `Skip default network creation` > Policy details > Effective policy reads Enforced
    - Fix: Cloud console > IAM & Admin > Organization Policies > select the organization in the resource picker > `Skip default network creation` > Manage policy > Applies to: Customize > Add a rule > Enforcement: On > Set policy (existing default networks are unaffected - delete those separately)
  - **CLI**:
    - Verify: `gcloud resource-manager org-policies describe constraints/compute.skipDefaultNetworkCreation --organization=$ORG_ID --effective`
    - Expect: `booleanPolicy.enforced` is `true`. Otherwise every new project gets a default network with permissive rules allowing SSH, RDP and ICMP from anywhere, and the clock starts before anyone has looked at it.
    - Fix: `gcloud resource-manager org-policies enable-enforce constraints/compute.skipDefaultNetworkCreation --organization=$ORG_ID`
