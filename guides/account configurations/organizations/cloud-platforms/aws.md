<!--
id: aws-cloud-security
type: CONFIGURATION
scope: ORGANIZATION
-->

<div align="center">
  <img src="../../../../images/guides/aws.svg" alt="AWS Logo" width="64" height="64">
  <h2><a href="https://aws.amazon.com/" target="_blank" rel="noopener noreferrer">AWS</a> Security Configuration Guide</h2>
  <p><em>Identity, Network, Data, and Detection controls for AWS accounts</em></p>
</div>

---

## Identity & Access (IAM)

#### Root Account
- [ ] **Root Account Access Keys Present** — `aws iam get-credential-report`
- [ ] **Root MFA Enabled** — `aws iam get-credential-report`
- [ ] **Root Account Credentials Usage** — `aws iam get-credential-report`
- [ ] **Hardware MFA for AWS Root Account** — `aws iam get-credential-report`

#### Users & Permissions
- [ ] **Enable MFA for IAM Users with Console Password** — `aws iam list-users --output table --query 'Users[*].UserName'`
- [ ] **IAM Users with Administrative Privileges** — `aws iam list-users --output table --query 'Users[*].UserName'`
- [ ] **IAM Policies With Full Administrative Privileges** — `aws iam list-policies --scope Local --query 'Policies[*].Arn'`
- [ ] **IAM Policies with Effect Allow and NotAction** — `aws iam list-policies --scope Local --query 'Policies[*].Arn'`
- [ ] **IAM Role Policy Too Permissive** — `aws iam list-roles --output table --query 'Roles[*].RoleName'`
- [ ] **Cross-Account Access Lacks External ID and MFA** — `aws iam list-users --output table --query 'Users[*].UserName'`
- [ ] **Check for Untrusted Cross-Account IAM Roles** — `aws iam list-roles --output table --query 'Roles[*].RoleName'`
- [ ] **Inactive IAM Console User** — `aws iam list-users`
- [ ] **Unused IAM User** — `aws iam list-users`
- [ ] **IAM User with Password and Access Keys** — `aws iam list-users --output table --query 'Users[*].UserName'`
- [ ] **Unnecessary Access Keys** — `aws iam list-users --output table --query 'Users[*].UserName'`
- [ ] **Access Keys Rotated 90 Days** — `aws iam list-users --query 'Users[*].UserName'`
- [ ] **IAM Access Analyzer in Use** — `aws accessanalyzer list-analyzers --region us-east-1 --query 'analyzers[*].arn'`
- [ ] **MFA Device Deactivated** — `aws iam list-mfa-devices`
- [ ] **Privileged AWS IAM User Has Been Created** — `aws cloudtrail lookup-events --lookup-attributes AttributeKey=EventName,AttributeValue=CreateUser`
- [ ] **IAM Configuration Changes** — `aws cloudtrail lookup-events --lookup-attributes AttributeKey=EventSource,AttributeValue=iam.amazonaws.com --max-results 10`
- [ ] **Sign-In Events** — `aws cloudtrail lookup-events --lookup-attributes AttributeKey=EventName,AttributeValue=ConsoleLogin --max-results 10`

---

## Storage (S3)

#### Public Access
- [ ] **Enable S3 Block Public Access for AWS Accounts** — `aws s3control get-public-access-block --region us-east-1 --account-id 123456789012`
- [ ] **Enable S3 Block Public Access for S3 Buckets** — `aws s3api list-buckets --query 'Buckets[*].Name'`
- [ ] **S3 Bucket Public 'READ' Access** — `aws s3api list-buckets --query 'Buckets[*].Name'`
- [ ] **S3 Bucket Public Access Via Policy** — `aws s3api list-buckets --query 'Buckets[*].Name'`
- [ ] **S3 Cross Account Access** — `aws s3api list-buckets --query 'Buckets[*].Name'`

#### Logging & Detection
- [ ] **S3 Bucket Logging Enabled** — `aws s3api list-buckets --query 'Buckets[*].Name'`
- [ ] **S3 Configuration Changes** — `aws cloudtrail lookup-events --lookup-attributes AttributeKey=EventSource,AttributeValue=s3.amazonaws.com --max-results 10`
- [ ] **Publicly Accessible CloudTrail Buckets** — `aws cloudtrail list-trails --region us-east-1 --query 'Trails[*].Name'`

---

## Compute (EC2)

#### Network Exposure
- [ ] **EC2 Instance Not In Public Subnet** — `aws ec2 describe-instances --region us-east-1 --output table --query 'Reservations[*].Instances[*].InstanceId'`
- [ ] **Disable Public IP Address Assignment for EC2 Instances** — `aws ec2 describe-instances --region us-east-1 --output table --query 'Reservations[*].Instances[*].InstanceId'`
- [ ] **App-Tier Publicly Shared AMI** — `aws ec2 describe-images`
- [ ] **Publicly Shared AMI** — `aws ec2 describe-images --region us-east-1 --owners self --output table --query 'Images[*].ImageId'`
- [ ] **AMI Cross-Account Access** — `aws ec2 describe-images --region us-east-1 --owners self --output table --query 'Images[*].ImageId'`

#### Instance Security
- [ ] **EC2 Instance Using IAM Roles** — `aws ec2 describe-instances --region us-east-1 --output table --query 'Reservations[*].Instances[*].InstanceId'`
- [ ] **Require IMDSv2 for EC2 Instances** — `aws ec2 describe-instances --region us-east-1 --output table --query 'Reservations[*].Instances[*].InstanceId'`

#### Security Groups
- [ ] **Default Security Group Unrestricted** — `aws ec2 describe-security-groups --region us-east-1 --filters Name=group-name,Values='default' --output table --query 'SecurityGroups[*].IpPermissions[*].IpRanges'`
- [ ] **Unrestricted SSH Access** — `aws ec2 describe-security-groups --region us-east-1 --filters Name=ip-permission.from-port,Values=22 Name=ip-permission.to-port,Values=22 Name=ip-permission.cidr,Values='0.0.0.0/0','::/0' --output table --query 'SecurityGroups[*].GroupId'`
- [ ] **Unrestricted RDP Access** — `aws ec2 describe-security-groups --region us-east-1 --filters Name=ip-permission.from-port,Values=3389 Name=ip-permission.to-port,Values=3389 Name=ip-permission.cidr,Values='0.0.0.0/0','::/0' --output table --query 'SecurityGroups[*].GroupId'`
- [ ] **Unrestricted MySQL Database Access** — `aws ec2 describe-security-groups --region us-east-1 --filters Name=ip-permission.from-port,Values=3306 Name=ip-permission.to-port,Values=3306 Name=ip-permission.cidr,Values='0.0.0.0/0','::/0' --output table --query 'SecurityGroups[*].GroupId'`
- [ ] **Unrestricted PostgreSQL Database Access** — `aws ec2 describe-security-groups --region us-east-1 --filters Name=ip-permission.from-port,Values=5432 Name=ip-permission.to-port,Values=5432 Name=ip-permission.cidr,Values='0.0.0.0/0','::/0' --output table --query 'SecurityGroups[*].GroupId'`
- [ ] **Unrestricted MSSQL Database Access** — `aws ec2 describe-security-groups --region us-east-1 --filters Name=ip-permission.from-port,Values=1433 Name=ip-permission.to-port,Values=1433 Name=ip-permission.cidr,Values='0.0.0.0/0','::/0' --output table --query 'SecurityGroups[*].GroupId'`
- [ ] **Unrestricted MongoDB Access** — `aws ec2 describe-security-groups --region us-east-1 --filters Name=ip-permission.from-port,Values=27017 Name=ip-permission.to-port,Values=27017 Name=ip-permission.cidr,Values='0.0.0.0/0' --query 'SecurityGroups[*].{Name:GroupName}'`
- [ ] **Unrestricted Redis Cache Access** — `aws ec2 describe-security-groups --region us-east-1 --filters Name=ip-permission.from-port,Values=6379 Name=ip-permission.to-port,Values=6379 Name=ip-permission.cidr,Values='0.0.0.0/0','::/0' --output table --query 'SecurityGroups[*].GroupId'`
- [ ] **Unrestricted SMTP Access** — `aws ec2 describe-security-groups --region us-east-1 --filters Name=ip-permission.from-port,Values=25 Name=ip-permission.to-port,Values=25 Name=ip-permission.cidr,Values='0.0.0.0/0','::/0' --output table --query 'SecurityGroups[*].GroupId'`
- [ ] **Unrestricted NetBIOS Access** — `aws ec2 describe-security-groups`
- [ ] **Unrestricted CIFS Access** — `aws ec2 describe-security-groups`
- [ ] **Unrestricted RPC Access** — `aws ec2 describe-security-groups`
- [ ] **Unrestricted Telnet Access** — `aws ec2 describe-security-groups`
- [ ] **Unrestricted Outbound Access** — `aws ec2 describe-security-groups --region us-east-1 --output table --query 'SecurityGroups[*].GroupId'`
- [ ] **EC2 Security Group Port Range** — `aws ec2 describe-security-groups --region us-east-1 --output table --query 'SecurityGroups[*].GroupId'`

---

## Networking (VPC)

- [ ] **Default VPC in Use** — `aws ec2 describe-vpcs --region us-east-1 --query 'Vpcs[?(IsDefault==`true`)].VpcId | []'`
- [ ] **VPC Flow Logs Enabled** — `aws ec2 describe-vpcs --region us-east-1 --query 'Vpcs[*].VpcId'`
- [ ] **Unrestricted Network ACL Inbound Traffic** — `aws ec2 describe-network-acls`
- [ ] **Unrestricted Inbound Traffic on Remote Server Administration Ports** — `aws ec2 describe-network-acls`
- [ ] **VPC Endpoint Exposed** — `aws ec2 describe-vpc-endpoints --region us-east-1 --output table --query 'VpcEndpoints[*].VpcEndpointId'`
- [ ] **VPC Peering Connections To Accounts Outside AWS Organization** — `aws organizations list-accounts`

---

## Audit & Detection (CloudTrail)

- [ ] **CloudTrail Enabled** — `aws cloudtrail list-trails --region us-east-1 --query 'Trails[*].Name'`
- [ ] **CloudTrail Global Services Enabled** — `aws cloudtrail list-trails`
- [ ] **CloudTrail Log File Integrity Validation** — `aws cloudtrail list-trails --region us-east-1 --query 'Trails[*].Name'`
- [ ] **CloudTrail Integrated With CloudWatch** — `aws cloudtrail list-trails --region us-east-1 --query 'Trails[*].Name'`
- [ ] **CloudTrail Management Events** — `aws cloudtrail list-trails --region us-east-1 --query 'Trails[*].Name'`

---

## Databases (RDS)

- [ ] **RDS Publicly Accessible** — `aws rds describe-db-instances --region us-east-1 --output table --query 'DBInstances[*].DBInstanceIdentifier'`
- [ ] **RDS Instance Not In Public Subnet** — `aws rds describe-db-instances`
- [ ] **Amazon RDS Public Snapshots** — `aws rds describe-db-snapshots --region us-east-1 --snapshot-type manual --output table --query 'DBSnapshots[*].DBSnapshotIdentifier'`
- [ ] **IAM Database Authentication** — `aws rds describe-db-instances --region us-east-1 --output table --query 'DBInstances[?Engine==`mysql` || Engine==`postgres`].DBInstanceIdentifier | []'`
- [ ] **Unrestricted DB Security Group** — `aws rds describe-db-security-groups --region us-east-1 --query 'DBSecurityGroups[*].DBSecurityGroupName'`
- [ ] **RDS Auto Minor Version Upgrade** — `aws rds describe-db-instances --region us-east-1 --output table --query 'DBInstances[?Engine==`mysql` || Engine==`postgres`].DBInstanceIdentifier | []'`
- [ ] **RDS Master Username** — `aws rds describe-db-instances`

---

## Serverless (Lambda)

- [ ] **Function Exposed** — `aws lambda list-functions --region us-east-1 --output table --query 'Functions[*].FunctionName'`
- [ ] **Lambda Function With Admin Privileges** — `aws lambda list-functions --region us-east-1 --output table --query 'Functions[*].FunctionName'`
- [ ] **Lambda Functions Should not Share Roles that Contain Admin Privileges** — `aws lambda list-functions`
- [ ] **Lambda Cross Account Access** — `aws lambda list-functions --region us-east-1 --output table --query 'Functions[*].FunctionName'`
- [ ] **Enable IAM Authentication for Lambda Function URLs** — `aws lambda list-functions --region us-east-1 --output table --query 'Functions[*].FunctionName'`
- [ ] **Lambda Using Supported Runtime Environment** — `aws lambda list-functions`
- [ ] **VPC Access for AWS Lambda Functions** — `aws lambda list-functions`

---

## Encryption Keys (KMS)

- [ ] **Key Exposed** — `aws kms list-keys`
- [ ] **KMS Cross Account Access** — `aws kms list-keys`

---

## Kubernetes (EKS)

- [ ] **EKS Cluster Endpoint Public Access** — `aws eks list-clusters --region us-east-1 --output table --query 'clusters'`
- [ ] **Ensure EKS Clusters Have Private Endpoint Enabled and Public Access Disabled** — `aws eks list-clusters`
- [ ] **Ensure EKS Clusters Are Created with Private Nodes** — `aws eks list-clusters`
- [ ] **Disable Remote Access to EKS Cluster Node Groups** — `aws eks list-clusters`
- [ ] **Enable Envelope Encryption for EKS Kubernetes Secrets** — `aws eks list-clusters`
- [ ] **Enable Support for Network Policies** — `aws eks list-clusters`
- [ ] **Kubernetes Cluster Logging** — `aws eks list-clusters`
- [ ] **Kubernetes Cluster Version** — `aws eks list-clusters --region us-east-1 --output table --query 'clusters'`
- [ ] **Use OIDC Provider for Authenticating Kubernetes API Calls** — `aws eks list-clusters`

---

## Secrets Management

- [ ] **AWS Secrets Manager in Use for RDS Instances** — `aws secretsmanager list-secrets`
- [ ] **Secret Rotation Enabled** — `aws secretsmanager list-secrets --region us-east-1 --query 'SecretList[*].Name'`
