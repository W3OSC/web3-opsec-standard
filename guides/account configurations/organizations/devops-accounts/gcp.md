<!--
id: gcp-cloud-security
type: CONFIGURATION
scope: ORGANIZATION
-->

<div align="center">
  <img src="../../../../images/guides/gcp.svg" alt="GCP Logo" width="64" height="64">
  <h2><a href="https://cloud.google.com/" target="_blank" rel="noopener noreferrer">GCP</a> Security Configuration Guide</h2>
  <p><em>Identity, Network, Data, and Detection controls for Google Cloud accounts</em></p>
</div>

---

## Identity & Access (IAM)

- [ ] **Corporate Login Credentials In Use** — `gcloud organizations list`
- [ ] **Delete Google Cloud API Keys** — `gcloud projects list`
- [ ] **Delete User-Managed Service Account Keys** — `gcloud projects list`
- [ ] **Enable Multi-Factor Authentication for User Accounts** — `gcloud organizations list && gcloud beta identity user-invitations search --organization=$(gcloud organizations list --format="value(name)")`
- [ ] **Enable Security Key Enforcement for Admin Accounts** — `gcloud organizations get-iam-policy $(gcloud organizations list --format="value(name)") --format=json`
- [ ] **Minimize the Use of Primitive Roles** — `gcloud projects list`
- [ ] **Restrict Administrator Access for Service Accounts** — `gcloud projects list`
- [ ] **Rotate User-Managed Service Account Keys** — `gcloud projects list`
- [ ] **Detect GCP IAM Configuration Changes** — `gcloud logging read "protoPayload.serviceName=\"iam.googleapis.com\"" --limit=10 --format=json`

---

## Storage (Cloud Storage)

- [ ] **Check for Publicly Accessible Cloud Storage Buckets** — `gcloud projects list`
- [ ] **Bucket Policies with Administrative Permissions** — `gcloud projects list`
- [ ] **Enable Uniform Bucket-Level Access for Cloud Storage Buckets** — `gcloud projects list`
- [ ] **Enforce Public Access Prevention** — `gcloud projects list`
- [ ] **Enable Data Access Audit Logs** — `gcloud projects get-iam-policy $(gcloud config get-value project) --format=json | jq '.auditConfigs'`
- [ ] **Use VPC Service Controls for Cloud Storage Buckets** — `gcloud projects list`

---

## Compute Engine

- [ ] **Check for Virtual Machine Instances with Public IP Addresses** — `gcloud projects list`
- [ ] **Instance templates should not assign a public IP address** — `gcloud CLI) is not supported.`
- [ ] **Check for Instances Associated with Default Service Accounts** — `gcloud projects list`
- [ ] **Check for Instance-Associated Service Accounts with Full API Access** — `gcloud projects list`
- [ ] **Disable IP Forwarding for Virtual Machine Instances** — `gcloud projects list`
- [ ] **Disable Interactive Serial Console Support** — `gcloud projects list`
- [ ] **Enable "Block Project-Wide SSH Keys" Security Feature** — `gcloud projects list`
- [ ] **Enable OS Login for GCP Projects** — `gcloud projects list`
- [ ] **Use OS Login with 2FA Authentication for VM Instances** — `gcloud projects list`
- [ ] **Check for Publicly Shared Disk Images** — `gcloud projects list`

---

## Kubernetes (GKE)

- [ ] **Disable Client Certificates** — `gcloud projects list`
- [ ] **Disable Kubernetes Dashboard for GKE Clusters** — `gcloud projects list`
- [ ] **Disable Legacy Authorization** — `gcloud projects list`
- [ ] **Enable Private Nodes** — `gcloud projects list`
- [ ] **Restrict Network Access** — `gcloud projects list`
- [ ] **Use GKE Clusters with Private Endpoints Only** — `gcloud projects list`
- [ ] **Enable Workload Identity Federation** — `gcloud projects list`
- [ ] **Prevent Default Service Account Usage** — `gcloud projects list`

---

## Logging & Detection

- [ ] **Enable Monitoring for Audit Configuration Changes** — `gcloud logging metrics list --format="table(name,description)" | grep -i audit`
- [ ] **Enable Monitoring for Firewall Rule Changes** — `gcloud logging metrics list --format="table(name,description)" | grep -i firewall`
- [ ] **Enable Monitoring for Custom Role Changes** — `gcloud logging metrics list --format="table(name,description)" | grep -i role`
- [ ] **Enable Monitoring for Bucket Permission Changes** — `gcloud logging metrics list --format="table(name,description)" | grep -i bucket`
- [ ] **Enable Project Ownership Assignments Monitoring** — `gcloud logging metrics list --format="table(name,description)" | grep -i owner`
- [ ] **Enable VPC Network Changes Monitoring** — `gcloud logging metrics list --format="table(name,description)" | grep -i vpc`
- [ ] **Enable Monitoring for SQL Instance Configuration Changes** — `gcloud logging metrics list --format="table(name,description)" | grep -i sql`
- [ ] **Enable data access audit logging for all critical service APIs** — `gcloud projects list`
- [ ] **Export All Log Entries Using Sinks** — `gcloud projects list`

---

## Encryption Keys (Cloud KMS)

- [ ] **Check for Publicly Accessible Cloud KMS Keys** — `gcloud kms keyrings list`

---

## Databases (Cloud SQL)

- [ ] **Check for Cloud SQL Database Instances with Public IPs** — `gcloud projects list`
- [ ] **Check for Publicly Accessible Cloud SQL Database Instances** — `gcloud projects list`
- [ ] **Configure Root Password for MySQL Database Access** — `gcloud projects list`
- [ ] **Disable "local_infile" Flag for MySQL Database Instances** — `gcloud projects list`
- [ ] **Disable "Cross DB Ownership Chaining" Flag for SQL Server** — `gcloud projects list`
- [ ] **Disable "remote access" Flag for SQL Server** — `gcloud projects list`

---

## Networking (Cloud VPC)

- [ ] **Default VPC Network In Use** — `gcloud projects list`
- [ ] **Check for Unrestricted SSH Access** — `gcloud projects list`
- [ ] **Check for Unrestricted RDP Access** — `gcloud projects list`
- [ ] **Check for Unrestricted MySQL Database Access** — `gcloud projects list`
- [ ] **Check for Unrestricted PostgreSQL Database Access** — `gcloud projects list`
- [ ] **Check for Unrestricted SQL Server Access** — `gcloud projects list`
- [ ] **Check for Unrestricted Redis Access** — `gcloud projects list`
- [ ] **Check for Unrestricted SMTP Access** — `gcloud projects list`
- [ ] **Check for Unrestricted Outbound Access on All Ports** — `gcloud projects list`
- [ ] **Check for VPC Firewall Rules with Port Ranges** — `gcloud projects list`
- [ ] **Enable VPC Flow Logs for VPC Subnets** — `gcloud projects list`
- [ ] **Enable Logging for VPC Firewall Rules** — `gcloud projects list`
- [ ] **Restrict Access to High Risk Ports** — `gcloud projects list`

---

## Functions (Cloud Functions)

- [ ] **Publicly Accessible Functions** — `gcloud projects list`
- [ ] **GCP Functions with Admin Privileges** — `gcloud projects list`
- [ ] **GCP Function using Default Service Account** — `gcloud projects list`
- [ ] **Use Secrets Manager for Managing Secrets in Google Cloud Functions** — `gcloud projects list`

---

## Organization Policies

- [ ] **Define Allowed External IPs for VM Instances** — `gcloud organizations list`
- [ ] **Disable Automatic IAM Role Grants for Default Service Accounts** — `gcloud organizations list`
- [ ] **Disable Serial Port Access Support at Organization Level** — `gcloud organizations list`
- [ ] **Disable Service Account Key Upload** — `gcloud organizations list`
- [ ] **Disable User-Managed Key Creation for Service Accounts** — `gcloud organizations list`
- [ ] **Skip Default VPC Network Creation** — `gcloud organizations list`
