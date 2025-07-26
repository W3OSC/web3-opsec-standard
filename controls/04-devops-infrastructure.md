# Controls 4: DevOps & Infrastructure

## Development Environment Security Controls

### **C-DI-001: Isolated Development Environment Setup**
*Implements: [SP-DI-001: Isolated Development Environments](../requirements/04-devops-infrastructure.md#sp-di-001-isolated-development-environments)*

**Development Container Configuration:**
- Use Docker Desktop or Podman for container runtime
- Create project-specific containers from trusted base images
- Implement resource limits and security constraints using cgroups
- Use read-only file systems where possible with tmpfs for temporary data

**Container Security Settings:**
```dockerfile
# Example secure container configuration
FROM node:18-alpine
RUN addgroup -g 1001 -S nodejs && adduser -S nodejs -u 1001
USER nodejs
WORKDIR /app
# Use non-root user and minimal base image
```

**IDE Integration Setup:**
- **VS Code**: Install Dev Containers extension and configure devcontainer.json
- **JetBrains**: Configure remote development with Docker integration
- **Cursor**: Leverage built-in container support with security settings

**Network Isolation:**
- Use Docker networks to isolate development containers
- Implement firewall rules to restrict container network access
- Use DNS filtering to block malicious domains from containers
- Monitor container network traffic for suspicious activity

### **C-DI-002: Trusted Base Images and Dependencies**
*Implements: [SP-DI-002: Trusted Base Images and Dependencies](../requirements/04-devops-infrastructure.md#sp-di-002-trusted-base-images-and-dependencies)*

**Base Image Management:**
- Use official images from Docker Hub or verified publishers
- Prefer minimal base images (Alpine, Distroless, Scratch)
- Regularly update base images to latest security patches
- Implement image scanning with tools like Trivy, Clair, or Snyk

**Dependency Scanning:**
- Use npm audit, yarn audit for Node.js projects
- Use pip-audit, safety for Python projects
- Use bundler-audit for Ruby projects
- Integrate dependency scanning into CI/CD pipelines

**Software Bill of Materials (SBOM):**
- Generate SBOM using tools like Syft or SPDX
- Store SBOM artifacts with container images
- Track dependency versions and vulnerabilities
- Implement automated SBOM generation in build pipelines

**Vulnerability Management:**
- Set up automated vulnerability scanning for all dependencies
- Implement vulnerability thresholds (fail builds on high/critical)
- Maintain vulnerability database updates
- Track and remediate identified vulnerabilities

---

## Source Code Management Controls

### **C-DI-003: Repository Security Implementation**
*Implements: [SP-DI-003: Repository Security Controls](../requirements/04-devops-infrastructure.md#sp-di-003-repository-security-controls)*

**GitHub Repository Security:**
- Set repository visibility to Private by default
- Enable branch protection rules for main/production branches
- Require signed commits using GPG keys
- Implement two-person approval for pull requests

**Branch Protection Configuration:**
```yaml
# Example GitHub branch protection settings
protection_rules:
  - pattern: "main"
    required_status_checks:
      strict: true
      contexts: ["ci/tests", "security/scan"]
    enforce_admins: true
    required_pull_request_reviews:
      required_approving_review_count: 2
      dismiss_stale_reviews: true
    restrictions:
      users: []
      teams: ["core-team"]
```

**Access Control:**
- Limit repository admin access to 2-3 essential personnel
- Use teams for permission management instead of individual access
- Regular audit of repository access and permissions
- Implement just-in-time access for temporary needs

**Repository Rulesets:**
- Block force pushes to all branches
- Require signed commits for all branches
- Implement commit message standards
- Enforce file path restrictions for sensitive files

### **C-DI-004: Code Security Scanning Implementation**
*Implements: [SP-DI-004: Code Security Scanning](../requirements/04-devops-infrastructure.md#sp-di-004-code-security-scanning)*

**Static Application Security Testing (SAST):**
- **JavaScript/TypeScript**: ESLint with security plugins, SonarJS
- **Python**: Bandit, Semgrep, CodeQL
- **Go**: Gosec, StaticCheck
- **Solidity**: Slither, MythX, Securify

**Pre-commit Hook Setup:**
```bash
# Install pre-commit hooks
pip install pre-commit
# .pre-commit-config.yaml
repos:
  - repo: https://github.com/trufflesecurity/trufflehog
    rev: main
    hooks:
      - id: trufflehog
  - repo: https://github.com/Yelp/detect-secrets
    rev: v1.4.0
    hooks:
      - id: detect-secrets
```

**Secret Scanning Tools:**
- **TruffleHog**: Comprehensive secret detection with high accuracy
- **git-secrets**: AWS-developed tool for preventing secret commits
- **detect-secrets**: Yelp's enterprise-grade secret detection
- **GitLeaks**: Fast and configurable secret scanning

**CI/CD Integration:**
- Integrate SAST tools into GitHub Actions, GitLab CI, or Jenkins
- Fail builds on high-severity security findings
- Generate security reports and track remediation
- Implement security gates before deployment

---

## Secrets Management Controls

### **C-DI-005: Secure Secrets Storage Implementation**
*Implements: [SP-DI-005: Secure Secrets Storage](../requirements/04-devops-infrastructure.md#sp-di-005-secure-secrets-storage)*

**Secrets Management Solutions:**
- **HashiCorp Vault**: Enterprise-grade secrets management
- **AWS Secrets Manager**: Cloud-native secrets storage
- **Azure Key Vault**: Microsoft cloud secrets management
- **Google Secret Manager**: Google Cloud secrets storage

**Vault Configuration Example:**
```bash
# Enable KV secrets engine
vault secrets enable -path=myapp kv-v2

# Store secret
vault kv put myapp/database password="secure-password"

# Retrieve secret in application
vault kv get -field=password myapp/database
```

**Application Integration:**
- Use environment variables for secret injection
- Implement secret rotation in applications
- Use service accounts for secret access
- Avoid hardcoding secrets in configuration files

**Encryption Requirements:**
- Encrypt secrets at rest using AES-256
- Use TLS 1.3 for secrets in transit
- Implement proper key management for encryption keys
- Regular rotation of encryption keys

### **C-DI-006: Secret Rotation and Lifecycle Management**
*Implements: [SP-DI-006: Secret Rotation and Lifecycle Management](../requirements/04-devops-infrastructure.md#sp-di-006-secret-rotation-and-lifecycle-management)*

**Automated Secret Rotation:**
- Implement automated rotation for database passwords
- Set up API key rotation schedules
- Use short-lived tokens where possible
- Implement graceful secret rotation without downtime

**Secret Lifecycle Management:**
- Track secret creation, usage, and expiration dates
- Implement secret versioning and rollback capabilities
- Monitor secret access patterns for anomalies
- Automated cleanup of expired and unused secrets

**Emergency Rotation Procedures:**
- Document emergency secret rotation procedures
- Implement rapid rotation capabilities for compromised secrets
- Test emergency rotation procedures regularly
- Maintain communication channels for emergency notifications

---

## CI/CD Pipeline Security Controls

### **C-DI-007: Pipeline Configuration Security**
*Implements: [SP-DI-007: Pipeline Configuration Security](../requirements/04-devops-infrastructure.md#sp-di-007-pipeline-configuration-security)*

**Pipeline as Code:**
```yaml
# Example secure GitHub Actions workflow
name: Secure CI/CD Pipeline
on:
  pull_request:
    branches: [main]
  push:
    branches: [main]

jobs:
  security-scan:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Run Trivy vulnerability scanner
        uses: aquasecurity/trivy-action@master
        with:
          scan-type: 'fs'
          scan-ref: '.'
          format: 'sarif'
          output: 'trivy-results.sarif'
      - name: Upload Trivy scan results
        uses: github/codeql-action/upload-sarif@v2
        with:
          sarif_file: 'trivy-results.sarif'
```

**Build Artifact Security:**
- Sign build artifacts using Sigstore/Cosign
- Generate and store artifact checksums
- Implement artifact scanning before deployment
- Use immutable artifact storage

**Deployment Approvals:**
- Require manual approval for production deployments
- Implement environment-specific approval workflows
- Use deployment gates with security checks
- Maintain audit logs of all deployment approvals

### **C-DI-008: Pipeline Access Controls**
*Implements: [SP-DI-008: Pipeline Access Controls](../requirements/04-devops-infrastructure.md#sp-di-008-pipeline-access-controls)*

**Authentication and Authorization:**
- Use individual accounts with MFA for pipeline access
- Implement RBAC for pipeline permissions
- Use service accounts with minimal permissions for pipeline execution
- Regular audit of pipeline access permissions

**Secret Management in Pipelines:**
- Use pipeline-specific secret stores (GitHub Secrets, GitLab Variables)
- Implement secret masking in pipeline logs
- Use short-lived tokens for pipeline authentication
- Avoid exposing secrets in pipeline configurations

**Pipeline Monitoring:**
- Log all pipeline executions and changes
- Monitor for unusual pipeline activity
- Set up alerts for failed security checks
- Implement pipeline execution approval workflows

---

## Infrastructure as Code Controls

### **C-DI-009: IaC Security and Compliance**
*Implements: [SP-DI-009: IaC Security and Compliance](../requirements/04-devops-infrastructure.md#sp-di-009-iac-security-and-compliance)*

**Terraform Security Configuration:**
```hcl
# Example secure Terraform configuration
resource "aws_s3_bucket" "secure_bucket" {
  bucket = "my-secure-bucket"
}

resource "aws_s3_bucket_encryption" "secure_bucket_encryption" {
  bucket = aws_s3_bucket.secure_bucket.id
  
  server_side_encryption_configuration {
    rule {
      apply_server_side_encryption_by_default {
        sse_algorithm = "AES256"
      }
    }
  }
}

resource "aws_s3_bucket_public_access_block" "secure_bucket_pab" {
  bucket = aws_s3_bucket.secure_bucket.id
  
  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}
```

**IaC Security Scanning:**
- **Checkov**: Comprehensive IaC security scanning
- **Terrascan**: Policy-based IaC security scanner
- **TFSec**: Terraform-specific security scanner
- **Bridgecrew**: Cloud security posture management

**Version Control and Review:**
- Store all IaC templates in version control
- Implement peer review for infrastructure changes
- Use pull request workflows for IaC changes
- Maintain infrastructure change documentation

### **C-DI-010: Infrastructure Drift Detection**
*Implements: [SP-DI-010: Infrastructure Drift Detection](../requirements/04-devops-infrastructure.md#sp-di-010-infrastructure-drift-detection)*

**Drift Detection Tools:**
- **Terraform**: Use `terraform plan` for drift detection
- **AWS Config**: Monitor AWS resource configuration changes
- **Azure Policy**: Enforce and monitor Azure resource compliance
- **Google Cloud Asset Inventory**: Track GCP resource changes

**Automated Drift Remediation:**
```bash
#!/bin/bash
# Example drift detection and remediation script
terraform plan -detailed-exitcode
if [ $? -eq 2 ]; then
    echo "Infrastructure drift detected"
    # Send alert
    curl -X POST -H 'Content-type: application/json' \
        --data '{"text":"Infrastructure drift detected in production"}' \
        $SLACK_WEBHOOK_URL
    # Optional: Auto-remediate
    # terraform apply -auto-approve
fi
```

**Compliance Monitoring:**
- Implement continuous compliance monitoring
- Set up alerts for configuration violations
- Regular compliance reporting and remediation
- Integration with security information and event management (SIEM)

---

## Cloud Security Configuration Controls

### **C-DI-011: Secure Cloud Resource Configuration**
*Implements: [SP-DI-011: Secure Cloud Resource Configuration](../requirements/04-devops-infrastructure.md#sp-di-011-secure-cloud-resource-configuration)*

**AWS Security Configuration:**
- Enable CloudTrail for all regions and accounts
- Configure VPC with private subnets and NAT gateways
- Use Security Groups with least privilege principles
- Enable GuardDuty for threat detection

**Azure Security Configuration:**
- Enable Azure Security Center and Defender
- Configure Network Security Groups with restrictive rules
- Use Azure Key Vault for secrets management
- Enable Azure Monitor and Log Analytics

**Google Cloud Security Configuration:**
- Enable Cloud Security Command Center
- Configure VPC with private Google access
- Use Cloud IAM with principle of least privilege
- Enable Cloud Logging and Monitoring

**Multi-Cloud Security:**
- Implement consistent security policies across clouds
- Use cloud security posture management (CSPM) tools
- Centralized logging and monitoring across cloud providers
- Regular security assessments of cloud configurations

### **C-DI-012: Cloud Security Posture Management**
*Implements: [SP-DI-012: Cloud Security Posture Management](../requirements/04-devops-infrastructure.md#sp-di-012-cloud-security-posture-management)*

**CSPM Tool Implementation:**
- **Prisma Cloud**: Comprehensive cloud security platform
- **Wiz**: Cloud security posture and vulnerability management
- **Orca Security**: Agentless cloud security platform
- **Lacework**: Cloud security and compliance monitoring

**Security Baseline Configuration:**
- Implement CIS Benchmarks for cloud platforms
- Use cloud provider security best practices
- Regular security configuration assessments
- Automated remediation of security misconfigurations

**Continuous Monitoring:**
- Real-time monitoring of cloud resource configurations
- Automated alerts for security policy violations
- Regular security posture reporting
- Integration with incident response procedures

---

## Container Security Controls

### **C-DI-013: Container Image Security**
*Implements: [SP-DI-013: Container Image Security](../requirements/04-devops-infrastructure.md#sp-di-013-container-image-security)*

**Container Image Scanning:**
```yaml
# Example container scanning in CI/CD
- name: Build Docker image
  run: docker build -t myapp:${{ github.sha }} .

- name: Scan image with Trivy
  run: |
    trivy image --exit-code 1 --severity HIGH,CRITICAL myapp:${{ github.sha }}

- name: Sign image with Cosign
  run: |
    cosign sign --key cosign.key myapp:${{ github.sha }}
```

**Container Registry Security:**
- Use private container registries with access controls
- Implement vulnerability scanning in registries
- Sign container images for integrity verification
- Regular cleanup of old and vulnerable images

**Runtime Security:**
- Run containers with non-root users
- Use minimal capabilities and drop unnecessary ones
- Implement resource limits and quotas
- Use read-only root filesystems where possible

### **C-DI-014: Runtime Container Security**
*Implements: [SP-DI-014: Runtime Container Security](../requirements/04-devops-infrastructure.md#sp-di-014-runtime-container-security)*

**Kubernetes Security Configuration:**
```yaml
# Example Pod Security Standards
apiVersion: v1
kind: Pod
metadata:
  name: secure-pod
spec:
  securityContext:
    runAsNonRoot: true
    runAsUser: 1000
    fsGroup: 2000
  containers:
  - name: app
    image: myapp:latest
    securityContext:
      allowPrivilegeEscalation: false
      readOnlyRootFilesystem: true
      capabilities:
        drop:
        - ALL
    resources:
      limits:
        memory: "128Mi"
        cpu: "500m"
```

**Network Policies:**
- Implement Kubernetes Network Policies for micro-segmentation
- Use service mesh (Istio, Linkerd) for advanced traffic management
- Configure ingress and egress traffic controls
- Monitor network traffic for anomalies

**Runtime Monitoring:**
- Deploy runtime security tools (Falco, Sysdig, Aqua)
- Monitor container behavior for anomalies
- Implement automated response to security events
- Regular security assessments of running containers

---

## Access Management Controls

### **C-DI-015: Infrastructure Access Controls**
*Implements: [SP-DI-015: Infrastructure Access Controls](../requirements/04-devops-infrastructure.md#sp-di-015-infrastructure-access-controls)*

**Just-in-Time (JIT) Access Implementation:**
- Use AWS Systems Manager Session Manager for EC2 access
- Implement Azure Privileged Identity Management (PIM)
- Use Google Cloud IAM Conditions for time-based access
- Deploy third-party JIT solutions (CyberArk, BeyondTrust)

**Multi-Factor Authentication:**
- Require MFA for all infrastructure access
- Use hardware security keys for high-privilege accounts
- Implement conditional access policies
- Regular audit of MFA configurations

**Access Logging and Monitoring:**
- Enable comprehensive access logging on all systems
- Monitor for unusual access patterns and locations
- Set up alerts for privileged access activities
- Regular review of access logs and permissions

### **C-DI-016: Break-Glass Procedures**
*Implements: [SP-DI-016: Break-Glass Procedures](../requirements/04-devops-infrastructure.md#sp-di-016-break-glass-procedures)*

**Break-Glass Account Setup:**
- Create individual break-glass accounts for each team member
- Store break-glass credentials in secure password manager vault
- Implement elevated permissions for emergency scenarios
- Regular testing of break-glass account functionality

**Emergency Access Procedures:**
```bash
# Example break-glass access procedure
# 1. Access break-glass credentials from secure vault
# 2. Log emergency access usage
echo "$(date): Emergency access initiated by $(whoami)" >> /var/log/emergency-access.log
# 3. Perform emergency actions
# 4. Rotate break-glass credentials after use
# 5. Conduct post-incident review
```

**Monitoring and Alerting:**
- Immediate alerts for break-glass account usage
- Automated notifications to security team
- Mandatory post-incident reviews for all break-glass usage
- Regular rotation of break-glass account credentials

---

## Monitoring and Logging Controls

### **C-DI-017: Comprehensive Infrastructure Monitoring**
*Implements: [SP-DI-017: Comprehensive Infrastructure Monitoring](../requirements/04-devops-infrastructure.md#sp-di-017-comprehensive-infrastructure-monitoring)*

**Monitoring Stack Setup:**
- **Metrics**: Prometheus, Grafana, DataDog, New Relic
- **Logging**: ELK Stack (Elasticsearch, Logstash, Kibana), Splunk
- **Tracing**: Jaeger, Zipkin, AWS X-Ray
- **Alerting**: PagerDuty, Opsgenie, AlertManager

**Infrastructure Monitoring Configuration:**
```yaml
# Example Prometheus monitoring configuration
global:
  scrape_interval: 15s
  evaluation_interval: 15s

rule_files:
  - "security_rules.yml"

scrape_configs:
  - job_name: 'infrastructure'
    static_configs:
      - targets: ['localhost:9090']
    
  - job_name: 'applications'
    static_configs:
      - targets: ['app1:8080', 'app2:8080']
```

**Security Event Monitoring:**
- Monitor for failed authentication attempts
- Track privilege escalation activities
- Alert on unusual network traffic patterns
- Monitor for malware and intrusion attempts

### **C-DI-018: Security Information and Event Management**
*Implements: [SP-DI-018: Security Information and Event Management](../requirements/04-devops-infrastructure.md#sp-di-018-security-information-and-event-management)*

**SIEM Implementation:**
- **Enterprise**: Splunk, IBM QRadar, Microsoft Sentinel
- **Open Source**: Wazuh, OSSIM, Prelude
- **Cloud-Native**: AWS Security Hub, Google Chronicle

**Log Aggregation and Analysis:**
- Centralize logs from all infrastructure components
- Implement log parsing and normalization
- Set up correlation rules for security events
- Regular tuning of detection rules and alerts

**Threat Intelligence Integration:**
- Integrate threat intelligence feeds into SIEM
- Use indicators of compromise (IoCs) for detection
- Implement automated threat hunting capabilities
- Regular updates of threat intelligence sources

---

## Disaster Recovery Controls

### **C-DI-019: Backup and Recovery Implementation**
*Implements: [SP-DI-019: Backup and Recovery Capabilities](../requirements/04-devops-infrastructure.md#sp-di-019-backup-and-recovery-capabilities)*

**Backup Strategy Implementation:**
- **3-2-1 Rule**: 3 copies, 2 different media, 1 offsite
- Automated daily backups of critical systems
- Regular testing of backup restoration procedures
- Encrypted backups with secure key management

**Multi-Region Deployment:**
```yaml
# Example multi-region Terraform configuration
provider "aws" {
  alias  = "primary"
  region = "us-east-1"
}

provider "aws" {
  alias  = "secondary"
  region = "us-west-2"
}

resource "aws_instance" "primary" {
  provider = aws.primary
  # Primary region configuration
}

resource "aws_instance" "secondary" {
  provider = aws.secondary
  # Secondary region configuration
}
```

**Recovery Objectives:**
- Define Recovery Time Objectives (RTO) for each system
- Define Recovery Point Objectives (RPO) for data loss tolerance
- Document recovery procedures for different scenarios
- Regular testing and validation of recovery procedures

### **C-DI-020: Business Continuity Planning**
*Implements: [SP-DI-020: Business Continuity Planning](../requirements/04-devops-infrastructure.md#sp-di-020-business-continuity-planning)*

**Disaster Recovery Planning:**
- Document comprehensive disaster recovery procedures
- Identify critical systems and dependencies
- Establish alternative operational procedures
- Regular disaster recovery testing and exercises

**Business Impact Analysis:**
- Assess impact of different disaster scenarios
- Prioritize systems based on business criticality
- Define maximum tolerable downtime for each system
- Regular review and update of business impact assessments

**Communication Plans:**
- Establish communication channels for disaster scenarios
- Define stakeholder notification procedures
- Prepare communication templates for different scenarios
- Regular testing of communication procedures

---

## Infrastructure Engineering Account Management

### **C-DI-021: Normal Operations Access Control**
*Implements: Infrastructure Engineering Account Management best practices*

**Minimum Privilege Operations:**
- Users have read-only permissions for daily monitoring
- State-changing operations require approved tickets
- Temporary permissions granted for minimum required time
- All changes tested in dev/staging before production

**Ticket-Based Change Management:**
```yaml
# Example change management workflow
change_request:
  id: CHG-2024-001
  title: "Update production database configuration"
  requester: "john.doe@company.com"
  approver: "jane.smith@company.com"
  implementation_window: "2024-01-15 02:00-04:00 UTC"
  rollback_plan: "Revert to previous configuration"
  testing_evidence: "Successfully tested in staging environment"
```

**Scheduled Implementation:**
- Changes implemented during designated hours (e.g., Tuesday/Thursday 2-4 AM)
- Out-of-hours changes trigger alerts to team
- Post-implementation verification required
- Documentation of all changes and outcomes

### **C-DI-022: Emergency Response Procedures**
*Implements: Break-glass account management for emergency situations*

**Break-Glass Account Configuration:**
- Individual break-glass accounts tied to user identity
- Service-specific break-glass accounts (no SSO bundling)
- Elevated permissions limited to emergency scenarios
- Credentials stored in secure password manager vault

**Emergency Access Workflow:**
1. Access to credentials triggers team-wide alert
2. Usage requires post-mortem write-up
3. Account credentials rotated after each use
4. Complete account re-provisioning recommended

**Response Time Controls:**
- Automated triggers for break-glass access (uptime alarms)
- Two-party controls when 24-hour response acceptable
- Challenge periods (15-minute delay) to allow veto
- Incident response runbooks for common scenarios

---

## Testing and Validation

### **Monthly Security Testing:**
- Vulnerability scanning of all infrastructure components
- Penetration testing of critical systems
- Review and update of security configurations
- Test backup and recovery procedures

### **Quarterly Security Reviews:**
- Comprehensive security architecture review
- Update threat models and risk assessments
- Review and update security policies and procedures
- Security training and awareness programs

### **Annual Security Assessments:**
- Third-party security assessment of entire infrastructure
- Compliance audits and certifications
- Disaster recovery testing and validation
- Update business continuity plans

---

## References and Tools

### **Security Tools:**
- [Trivy](https://trivy.dev/) - Container and IaC vulnerability scanner
- [Checkov](https://www.checkov.io/) - IaC security scanning
- [TruffleHog](https://github.com/trufflesecurity/trufflehog) - Secret scanning
- [Falco](https://falco.org/) - Runtime security monitoring

### **Infrastructure Tools:**
- [Terraform](https://www.terraform.io/) - Infrastructure as Code
- [Kubernetes](https://kubernetes.io/) - Container orchestration
- [Prometheus](https://prometheus.io/) - Monitoring and alerting
- [Grafana](https://grafana.com/) - Observability platform

### **Cloud Security:**
- [Prisma Cloud](https://www.paloaltonetworks.com/prisma/cloud) - CSPM platform
- [Wiz](https://www.wiz.io/) - Cloud security platform
- [AWS Security Hub](https://aws.amazon.com/security-hub/) - AWS security posture
- [Azure Security Center](https://azure.microsoft.com/en-us/services/security-center/) - Azure security

### **SIEM and Monitoring:**
- [Wazuh](https://wazuh.com/) - Open source SIEM
- [Splunk](https://www.splunk.com/) - Enterprise SIEM
- [ELK Stack](https://www.elastic.co/elk-stack) - Log analysis
- [DataDog](https://www.datadoghq.com/) - Monitoring platform
