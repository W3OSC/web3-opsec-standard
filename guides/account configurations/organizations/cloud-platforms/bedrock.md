<!--
id: bedrock-cloud-security
type: CONFIGURATION
scope: ORGANIZATION
-->

<div align="center">
  <img src="../../../../images/guides/bedrock.svg" alt="Amazon Bedrock Logo" width="64" height="64">
  <h2><a href="https://aws.amazon.com/bedrock/" target="_blank" rel="noopener noreferrer">Amazon Bedrock</a> Configuration Guide</h2>
  <p><em>Identity, Network, Logging, Guardrail and Agent controls for Amazon Bedrock accounts</em></p>
</div>

---

## How to Use This Guide

Each item states its **pass** condition, then gives **Console** (the AWS Management Console) and **CLI** (the AWS CLI) steps to **Verify** and **Fix** it. Under CLI, **Expect** is the output that means it passes. Pick the channel you work in at the top of the guide; an item shows only the channels that can check or change the setting, and it passes only when every resource the command returns meets the condition.

#### Prerequisites

- AWS CLI v2 with the `bedrock`, `bedrock-agent`, `bedrock-agent-runtime`, `bedrock-agentcore-control` and `bedrock-runtime` commands - check with `aws --version` and `aws bedrock help`.
- Confirm which account you are auditing: `aws sts get-caller-identity`
- A read-only principal is enough for every **Verify** command. Attach the AWS-managed `SecurityAudit` and `ViewOnlyAccess` policies.
- **Bedrock is regional.** IAM, Organizations and most account-level settings are global; the data-retention mode, model access, invocation logging, guardrails, agents, knowledge bases, custom models and VPC endpoints must be checked in every region where models are enabled. To sweep every region:
  - `for r in $(aws ec2 describe-regions --query 'Regions[].RegionName' --output text); do echo "== $r"; AWS_REGION=$r <command>; done`
- Several **Fix** commands rebuild a resource from its current state with `jq`; install it before you start.
- Mantle checks call the Mantle REST endpoint with a short-term key exported as `$BEDROCK_API_KEY`. A short-term key works only in the Region it was generated in, so generate one in each Region you check or fix (in the console, select that Region before generating the key).
- In a multi-account Organization, run the whole guide in each member account. Organization-wide controls (SCPs, Bedrock policies, the Organization CloudTrail) are checked from the management account.

---

## Identity & Access (IAM)

- [ ] **Deny Model Invocation by Default Through SCP or IAM** - pass: an SCP attached to the root or OU denies `bedrock:InvokeModel*` on every model outside the approved list
  - **Console**:
    - Verify: AWS Organizations > Policies > Service control policies > `DenyUnapprovedBedrockModels` > Content shows a `Deny` on `bedrock:InvokeModel` with `NotResource` listing only approved model and inference-profile ARNs, and Targets lists the root or OU
    - Fix: AWS Organizations > Policies > Service control policies > Create policy > Policy name `DenyUnapprovedBedrockModels` > JSON editor > paste the deny statement with the approved ARNs in `NotResource` > Create policy; then select the policy > Targets > Attach > choose the root or OU > Attach policy
  - **CLI**:
    - Verify:
      ```bash
      aws organizations list-policies-for-target --target-id <root-or-ou-id> --filter SERVICE_CONTROL_POLICY \
        --query 'Policies[].[Name,Id]' --output table
      ```
    - Verify: `aws organizations describe-policy --policy-id <scp-id> --query 'Policy.Content' --output text`
    - Expect: `DenyUnapprovedBedrockModels` is listed for the target and its content shows `"Effect": "Deny"` on the invoke actions with `NotResource` naming only approved ARNs. Without a default deny, any model that gets enabled in the account is callable by every principal with invoke rights.
    - Fix:
      ```bash
      aws organizations create-policy --type SERVICE_CONTROL_POLICY --name DenyUnapprovedBedrockModels \
        --description "Deny invocation of models outside the allowlist" \
        --query 'Policy.PolicySummary.Id' --output text --content '{
          "Version": "2012-10-17",
          "Statement": [{
            "Effect": "Deny",
            "Action": ["bedrock:InvokeModel", "bedrock:InvokeModelWithResponseStream", "bedrock:CreateModelInvocationJob"],
            "NotResource": [
              "arn:aws:bedrock:*::foundation-model/<approved-model-id>",
              "arn:aws:bedrock:*:*:inference-profile/<approved-profile-id>",
              "arn:aws:bedrock:*:*:application-inference-profile/<approved-app-profile-id>"
            ]
          }]
        }'
      ```
    - Fix: `aws organizations attach-policy --target-id <root-or-ou-id> --policy-id <scp-id>`

- [ ] **Scope InvokeModel to Specific Model ARNs** - pass: the workload role's invoke policy lists only approved model or inference-profile ARNs as `Resource`, never `*`
  - **Console**:
    - Verify: IAM > Roles > <workload-role> > Permissions > `BedrockInvokeApprovedModels` > JSON > the `bedrock:InvokeModel` statement's `Resource` lists specific foundation-model or inference-profile ARNs and contains no `*`
    - Fix: IAM > Roles > <workload-role> > Permissions > Add permissions > Create inline policy > JSON > paste the allow statement with the approved ARNs > Next > Policy name `BedrockInvokeApprovedModels` > Create policy
  - **CLI**:
    - Verify:
      ```bash
      aws iam get-role-policy --role-name <workload-role> --policy-name BedrockInvokeApprovedModels \
        --query 'PolicyDocument.Statement[].Resource'
      ```
    - Verify:
      ```bash
      aws iam simulate-principal-policy --policy-source-arn <role-arn> --action-names bedrock:InvokeModel \
        --resource-arns arn:aws:bedrock:<region>::foundation-model/<unapproved-model-id> \
        --query 'EvaluationResults[*].EvalDecision'
      ```
    - Expect: the first command lists only approved ARNs and the simulation returns `implicitDeny` or `explicitDeny`. A wildcard resource lets the role call any model that becomes available in the account, including ones with no guardrail attached.
    - Fix:
      ```bash
      aws iam put-role-policy --role-name <workload-role> --policy-name BedrockInvokeApprovedModels --policy-document '{
        "Version": "2012-10-17",
        "Statement": [{
          "Effect": "Allow",
          "Action": ["bedrock:InvokeModel", "bedrock:InvokeModelWithResponseStream"],
          "Resource": [
            "arn:aws:bedrock:<region>::foundation-model/<model-id>",
            "arn:aws:bedrock:<region>:<account>:inference-profile/<profile-id>"
          ]
        }]
      }'
      ```

- [ ] **Restrict Marketplace Subscriptions by Product ID** - pass: `aws-marketplace:Subscribe` is allowed only when `aws-marketplace:ProductId` matches an approved product ID
  - **Console**:
    - Verify: IAM > Roles > <subscription-role> > Permissions > `BedrockMarketplaceApprovedProducts` > JSON > the `aws-marketplace:Subscribe` statement carries a `ForAnyValue:StringEquals` condition on `aws-marketplace:ProductId` listing only approved product IDs
    - Fix: IAM > Roles > <subscription-role> > Permissions > Add permissions > Create inline policy > JSON > paste the statement with the approved product IDs > Next > Policy name `BedrockMarketplaceApprovedProducts` > Create policy
  - **CLI**:
    - Verify:
      ```bash
      aws iam get-role-policy --role-name <subscription-role> --policy-name BedrockMarketplaceApprovedProducts \
        --query 'PolicyDocument.Statement[?contains(Action, `aws-marketplace:Subscribe`)].Condition'
      ```
    - Verify:
      ```bash
      aws iam simulate-principal-policy --policy-source-arn <role-arn> --action-names aws-marketplace:Subscribe \
        --query 'EvaluationResults[*].EvalDecision'
      ```
    - Expect: the condition block names `aws-marketplace:ProductId` and the simulation (run without a product-ID context) returns `implicitDeny`. Without the condition anyone with subscribe rights can enable third-party models that are billed to you and may process data outside AWS.
    - Fix:
      ```bash
      aws iam put-role-policy --role-name <subscription-role> --policy-name BedrockMarketplaceApprovedProducts --policy-document '{
        "Version": "2012-10-17",
        "Statement": [
          {
            "Effect": "Allow",
            "Action": ["aws-marketplace:Subscribe"],
            "Resource": "*",
            "Condition": {"ForAnyValue:StringEquals": {"aws-marketplace:ProductId": ["<product-id>"]}}
          },
          {
            "Effect": "Allow",
            "Action": ["aws-marketplace:ViewSubscriptions", "aws-marketplace:Unsubscribe"],
            "Resource": "*"
          }
        ]
      }'
      ```

- [ ] **Delete Long-Term Bedrock API Keys Found in Production** - pass: `list-service-specific-credentials` for `bedrock.amazonaws.com` returns no credentials on production users
  - **Console**:
    - Verify: Amazon Bedrock > API keys > Long-term API keys > the list is empty for every production user
    - Fix: Amazon Bedrock > API keys > Long-term API keys > select the key > Actions > Delete > confirm the deletion
  - **CLI**:
    - Verify: `aws iam list-service-specific-credentials --service-name bedrock.amazonaws.com --all-users`
    - Expect: `ServiceSpecificCredentials` is an empty list. A long-term key is a bearer credential with no MFA, session or source-IP bound to it; one leak is unattributed model access until the key is deleted.
    - Fix: `aws iam delete-service-specific-credential --user-name <user> --service-specific-credential-id <credential-id>`

- [ ] **Limit Long-Term API Key Lifetime** - pass: an SCP denies Bedrock key creation when `iam:ServiceSpecificCredentialAgeDays` is over 90 or missing, and every existing key shows an `ExpirationDate`
  - **Console**:
    - Verify: AWS Organizations > Policies > Service control policies > `CapBedrockLongTermKeyAge` > Content shows both `Deny` statements on `iam:CreateServiceSpecificCredential` and Targets lists the root or OU
    - Fix: AWS Organizations > Policies > Service control policies > Create policy > Policy name `CapBedrockLongTermKeyAge` > JSON editor > paste the two deny statements > Create policy; then select the policy > Targets > Attach > choose the root or OU > Attach policy
  - **CLI**:
    - Verify:
      ```bash
      aws organizations list-policies-for-target --target-id <root-or-ou-id> --filter SERVICE_CONTROL_POLICY \
        --query 'Policies[].[Name,Id]' --output table
      ```
    - Verify:
      ```bash
      aws iam list-service-specific-credentials --service-name bedrock.amazonaws.com --all-users \
        --query 'ServiceSpecificCredentials[*].[UserName,ExpirationDate]'
      ```
    - Expect: `CapBedrockLongTermKeyAge` is listed for the target and every credential row has an `ExpirationDate` no more than 90 days after creation. A key with no expiry stays valid until someone remembers to delete it.
    - Fix:
      ```bash
      aws organizations create-policy --type SERVICE_CONTROL_POLICY --name CapBedrockLongTermKeyAge \
        --description "Long-term Bedrock API keys must expire within the policy window" \
        --query 'Policy.PolicySummary.Id' --output text --content '{
          "Version": "2012-10-17",
          "Statement": [
            {
              "Effect": "Deny",
              "Action": "iam:CreateServiceSpecificCredential",
              "Resource": "*",
              "Condition": {
                "StringEquals": {"iam:ServiceSpecificCredentialServiceName": "bedrock.amazonaws.com"},
                "NumericGreaterThan": {"iam:ServiceSpecificCredentialAgeDays": "90"}
              }
            },
            {
              "Effect": "Deny",
              "Action": "iam:CreateServiceSpecificCredential",
              "Resource": "*",
              "Condition": {
                "StringEquals": {"iam:ServiceSpecificCredentialServiceName": "bedrock.amazonaws.com"},
                "Null": {"iam:ServiceSpecificCredentialAgeDays": "true"}
              }
            }
          ]
        }'
      ```
    - Fix: `aws organizations attach-policy --target-id <root-or-ou-id> --policy-id <scp-id>`

- [ ] **Deny Bearer-Token Invocation for Workload Roles** - pass: `bedrock:CallWithBearerToken` and `bedrock-mantle:CallWithBearerToken` evaluate to `explicitDeny` for the role
  - **Console**:
    - Verify: IAM > Roles > <workload-role> > Permissions > `DenyBedrockBearerTokens` > JSON > a statement with `"Effect": "Deny"` on both `CallWithBearerToken` actions and `"Resource": "*"`
    - Fix: IAM > Roles > <workload-role> > Permissions > Add permissions > Create inline policy > JSON > paste the deny statement > Next > Policy name `DenyBedrockBearerTokens` > Create policy
  - **CLI**:
    - Verify:
      ```bash
      aws iam simulate-principal-policy --policy-source-arn <role-arn> \
        --action-names bedrock:CallWithBearerToken bedrock-mantle:CallWithBearerToken \
        --query 'EvaluationResults[*].[EvalActionName,EvalDecision]'
      ```
    - Expect: both rows read `explicitDeny`. A role that can call with bearer tokens can use API keys that bypass the role's session duration, MFA and source conditions.
    - Fix:
      ```bash
      aws iam put-role-policy --role-name <workload-role> --policy-name DenyBedrockBearerTokens --policy-document '{
        "Version": "2012-10-17",
        "Statement": [{
          "Effect": "Deny",
          "Action": ["bedrock:CallWithBearerToken", "bedrock-mantle:CallWithBearerToken"],
          "Resource": "*"
        }]
      }'
      ```

- [ ] **Block Long-Term Key Creation Org-Wide With an SCP** - pass: an SCP attached to the root or OU denies `iam:CreateServiceSpecificCredential` for `bedrock.amazonaws.com` to every principal except the exception role
  - **Console**:
    - Verify: AWS Organizations > Policies > Service control policies > `DenyBedrockLongTermKeys` > Content shows the `Deny` with `ArnNotLike` on `aws:PrincipalArn` naming only the exception role, and Targets lists the root or OU
    - Fix: AWS Organizations > Policies > Service control policies > Create policy > Policy name `DenyBedrockLongTermKeys` > JSON editor > paste the deny statement > Create policy; then select the policy > Targets > Attach > choose the root or OU > Attach policy
  - **CLI**:
    - Verify:
      ```bash
      aws organizations list-policies-for-target --target-id <root-or-ou-id> --filter SERVICE_CONTROL_POLICY \
        --query 'Policies[].[Name,Id]' --output table
      ```
    - Verify: `aws organizations describe-policy --policy-id <scp-id> --query 'Policy.Content' --output text`
    - Expect: `DenyBedrockLongTermKeys` is listed for the target and its content shows the deny with `ArnNotLike` naming only `<exception-role>`. Without the SCP any account administrator can mint long-lived Bedrock keys outside the approved process.
    - Fix:
      ```bash
      aws organizations create-policy --type SERVICE_CONTROL_POLICY --name DenyBedrockLongTermKeys \
        --description "No long-term Bedrock API keys except the exception role" \
        --query 'Policy.PolicySummary.Id' --output text --content '{
          "Version": "2012-10-17",
          "Statement": [{
            "Effect": "Deny",
            "Action": "iam:CreateServiceSpecificCredential",
            "Resource": "*",
            "Condition": {
              "StringEquals": {"iam:ServiceSpecificCredentialServiceName": "bedrock.amazonaws.com"},
              "ArnNotLike": {"aws:PrincipalArn": ["arn:aws:iam::*:role/<exception-role>"]}
            }
          }]
        }'
      ```
    - Fix: `aws organizations attach-policy --target-id <root-or-ou-id> --policy-id <scp-id>`

- [ ] **Replace AmazonBedrockLimitedAccess on Long-Term Key Users with a Scoped Policy** - pass: no user holding a long-term Bedrock key has `AmazonBedrockLimitedAccess` attached
  - **Console**:
    - Verify: IAM > Policies > AmazonBedrockLimitedAccess > Entities attached > the Users list contains no user that holds a long-term Bedrock API key
    - Fix: IAM > Users > <user> > Permissions > select `AmazonBedrockLimitedAccess` > Remove > Remove; then Add permissions > Attach policies directly > <scoped-policy> > Add permissions
  - **CLI**:
    - Verify:
      ```bash
      aws iam list-entities-for-policy --policy-arn arn:aws:iam::aws:policy/AmazonBedrockLimitedAccess \
        --query 'PolicyUsers[].UserName'
      ```
    - Verify: `aws iam list-attached-user-policies --user-name <user>`
    - Expect: the first command returns `[]` and the second lists only the scoped policy. The managed policy grants invoke on every model in the account plus Marketplace subscribe, far more than a single key should carry.
    - Fix:
      ```bash
      aws iam detach-user-policy --user-name <user> --policy-arn arn:aws:iam::aws:policy/AmazonBedrockLimitedAccess
      ```
    - Fix: `aws iam attach-user-policy --user-name <user> --policy-arn <scoped-policy-arn>`

- [ ] **Restrict Invocation to Approved Inference Profiles** - pass: invoke actions are denied whenever `bedrock:InferenceProfileArn` is not an approved application inference profile
  - **Console**:
    - Verify: IAM > Roles > <workload-role> > Permissions > `BedrockApprovedInferenceProfilesOnly` > JSON > a `Deny` on the invoke actions with `StringNotEquals` on `bedrock:InferenceProfileArn` listing only approved profile ARNs
    - Fix: IAM > Roles > <workload-role> > Permissions > Add permissions > Create inline policy > JSON > paste the deny statement with the approved profile ARNs > Next > Policy name `BedrockApprovedInferenceProfilesOnly` > Create policy
  - **CLI**:
    - Verify:
      ```bash
      aws iam get-role-policy --role-name <workload-role> --policy-name BedrockApprovedInferenceProfilesOnly \
        --query 'PolicyDocument.Statement[].Condition'
      ```
    - Verify:
      ```bash
      aws iam simulate-principal-policy --policy-source-arn <role-arn> --action-names bedrock:InvokeModel \
        --resource-arns arn:aws:bedrock:<region>:<account>:application-inference-profile/<unapproved-profile-id> \
        --query 'EvaluationResults[*].EvalDecision'
      ```
    - Expect: the condition names `bedrock:InferenceProfileArn` and the simulation returns `explicitDeny`. Without it a caller can route through any profile, including ones that fan out to regions outside the approved set.
    - Fix:
      ```bash
      aws iam put-role-policy --role-name <workload-role> --policy-name BedrockApprovedInferenceProfilesOnly --policy-document '{
        "Version": "2012-10-17",
        "Statement": [{
          "Effect": "Deny",
          "Action": ["bedrock:InvokeModel", "bedrock:InvokeModelWithResponseStream"],
          "Resource": "*",
          "Condition": {
            "StringNotEquals": {
              "bedrock:InferenceProfileArn": ["arn:aws:bedrock:<region>:<account>:application-inference-profile/<approved-profile-id>"]
            }
          }
        }]
      }'
      ```

- [ ] **Block Global Cross-Region Inference Where Data Residency Applies** - pass: an SCP denies invoke when `bedrock:InferenceProfileArn` matches `inference-profile/global.*`
  - **Console**:
    - Verify: AWS Organizations > Policies > Service control policies > `DenyGlobalInferenceProfiles` > Content shows the `Deny` with `StringLike` on `bedrock:InferenceProfileArn` = `arn:aws:bedrock:*:*:inference-profile/global.*`, and Targets lists the root or OU
    - Fix: AWS Organizations > Policies > Service control policies > Create policy > Policy name `DenyGlobalInferenceProfiles` > JSON editor > paste the deny statement > Create policy; then select the policy > Targets > Attach > choose the root or OU > Attach policy
  - **CLI**:
    - Verify:
      ```bash
      aws organizations list-policies-for-target --target-id <root-or-ou-id> --filter SERVICE_CONTROL_POLICY \
        --query 'Policies[].[Name,Id]' --output table
      ```
    - Verify:
      ```bash
      aws iam simulate-principal-policy --policy-source-arn <role-arn> --action-names bedrock:InvokeModel \
        --resource-arns arn:aws:bedrock:<region>::foundation-model/<model-id> \
        --context-entries ContextKeyName=bedrock:InferenceProfileArn,ContextKeyValues=arn:aws:bedrock:<region>:<account>:inference-profile/global.<model-id>,ContextKeyType=string \
        --query 'EvaluationResults[*].EvalDecision'
      ```
    - Expect: `DenyGlobalInferenceProfiles` is listed for the target and the simulation returns `explicitDeny`. A global profile may route a request to any commercial region, which breaks data-residency commitments.
    - Fix:
      ```bash
      aws organizations create-policy --type SERVICE_CONTROL_POLICY --name DenyGlobalInferenceProfiles \
        --description "No global cross-Region inference where data residency applies" \
        --query 'Policy.PolicySummary.Id' --output text --content '{
          "Version": "2012-10-17",
          "Statement": [{
            "Effect": "Deny",
            "Action": ["bedrock:InvokeModel", "bedrock:InvokeModelWithResponseStream"],
            "Resource": "*",
            "Condition": {"StringLike": {"bedrock:InferenceProfileArn": "arn:aws:bedrock:*:*:inference-profile/global.*"}}
          }]
        }'
      ```
    - Fix: `aws organizations attach-policy --target-id <root-or-ou-id> --policy-id <scp-id>`

- [ ] **Restrict Bedrock Service-Role Trust Policies to Your Account and Resource ARN** - pass: every role trusted by `bedrock.amazonaws.com` carries `aws:SourceAccount` and `aws:SourceArn` conditions
  - **Console**:
    - Verify: IAM > Roles > <bedrock-service-role> > Trust relationships > the `bedrock.amazonaws.com` statement has a `Condition` with `StringEquals aws:SourceAccount` = your account and `ArnLike aws:SourceArn` = a Bedrock ARN in your account
    - Fix: IAM > Roles > <bedrock-service-role> > Trust relationships > Edit trust policy > add the `Condition` block to the `bedrock.amazonaws.com` statement > Update policy
  - **CLI**:
    - Verify:
      ```bash
      aws iam list-roles \
        --query "Roles[?contains(to_string(AssumeRolePolicyDocument),'bedrock.amazonaws.com')].[RoleName,AssumeRolePolicyDocument.Statement[].Condition]"
      ```
    - Expect: every row shows a non-empty `Condition` with both keys. A trust with no source condition is open to the confused deputy: a Bedrock resource in another account could assume the role.
    - Fix:
      ```bash
      aws iam update-assume-role-policy --role-name <bedrock-service-role> --policy-document '{
        "Version": "2012-10-17",
        "Statement": [{
          "Effect": "Allow",
          "Principal": {"Service": "bedrock.amazonaws.com"},
          "Action": "sts:AssumeRole",
          "Condition": {
            "StringEquals": {"aws:SourceAccount": "<account>"},
            "ArnLike": {"aws:SourceArn": "arn:aws:bedrock:<region>:<account>:*"}
          }
        }]
      }'
      ```

- [ ] **Detach AmazonBedrockFullAccess from Workload Roles** - pass: `list-entities-for-policy` for `AmazonBedrockFullAccess` returns no workload or application role
  - **Console**:
    - Verify: IAM > Policies > AmazonBedrockFullAccess > Entities attached > the Roles list contains no workload or application role
    - Fix: IAM > Policies > AmazonBedrockFullAccess > Entities attached > select the workload role > Detach > Detach
  - **CLI**:
    - Verify: `aws iam list-entities-for-policy --policy-arn arn:aws:iam::aws:policy/AmazonBedrockFullAccess`
    - Expect: `PolicyRoles` contains only platform or administrator roles, none assumed by workloads. Full access includes creating models, changing invocation logging and deleting guardrails.
    - Fix:
      ```bash
      aws iam detach-role-policy --role-name <workload-role> --policy-arn arn:aws:iam::aws:policy/AmazonBedrockFullAccess
      ```

- [ ] **Deny the Mantle Endpoint for Identities That Must Be Guardrailed or Logged** - pass: `bedrock-mantle:CreateInference` evaluates to `explicitDeny` for the role
  - **Console**:
    - Verify: IAM > Roles > <workload-role> > Permissions > `DenyBedrockMantleInference` > JSON > a statement with `"Effect": "Deny"` on `bedrock-mantle:CreateInference`
    - Fix: IAM > Roles > <workload-role> > Permissions > Add permissions > Create inline policy > JSON > paste the deny statement > Next > Policy name `DenyBedrockMantleInference` > Create policy
  - **CLI**:
    - Verify:
      ```bash
      aws iam simulate-principal-policy --policy-source-arn <role-arn> --action-names bedrock-mantle:CreateInference \
        --resource-arns arn:aws:bedrock-mantle:<region>:<account>:project/<project-id> \
        --query 'EvaluationResults[*].EvalDecision'
      ```
    - Expect: `explicitDeny`. Mantle inference does not pass through the account's Bedrock guardrails or model invocation logging, so a guardrailed role that can reach it has a bypass.
    - Fix:
      ```bash
      aws iam put-role-policy --role-name <workload-role> --policy-name DenyBedrockMantleInference --policy-document '{
        "Version": "2012-10-17",
        "Statement": [{"Effect": "Deny", "Action": "bedrock-mantle:CreateInference", "Resource": "*"}]
      }'
      ```

- [ ] **Scope Mantle Inference to Named Project ARNs** - pass: `bedrock-mantle:CreateInference` is allowed only on the application's own project ARN
  - **Console**:
    - Verify: IAM > Roles > <application-role> > Permissions > `BedrockMantleOwnProjectOnly` > JSON > the `bedrock-mantle:CreateInference` statement's `Resource` is a single `project/<project-id>` ARN, not `*`
    - Fix: IAM > Roles > <application-role> > Permissions > Add permissions > Create inline policy > JSON > paste the allow statement with the project ARN > Next > Policy name `BedrockMantleOwnProjectOnly` > Create policy
  - **CLI**:
    - Verify:
      ```bash
      aws iam get-role-policy --role-name <application-role> --policy-name BedrockMantleOwnProjectOnly \
        --query 'PolicyDocument.Statement[].Resource'
      ```
    - Verify:
      ```bash
      aws iam simulate-principal-policy --policy-source-arn <role-arn> --action-names bedrock-mantle:CreateInference \
        --resource-arns arn:aws:bedrock-mantle:<region>:<account>:project/<unapproved-project-id> \
        --query 'EvaluationResults[*].EvalDecision'
      ```
    - Expect: the resource is the named project ARN and the simulation returns `implicitDeny`. A wildcard lets one application bill and run inference against every project in the account.
    - Fix:
      ```bash
      aws iam put-role-policy --role-name <application-role> --policy-name BedrockMantleOwnProjectOnly --policy-document '{
        "Version": "2012-10-17",
        "Statement": [{
          "Effect": "Allow",
          "Action": "bedrock-mantle:CreateInference",
          "Resource": "arn:aws:bedrock-mantle:<region>:<account>:project/<project-id>"
        }]
      }'
      ```

---

## Networking (PrivateLink)

- [ ] **Use Interface VPC Endpoints for Bedrock Runtime** - pass: an Interface endpoint for `com.amazonaws.<region>.bedrock-runtime` exists in every workload VPC with `PrivateDnsEnabled` = `true`
  - **Console**:
    - Verify: VPC > Endpoints > filter Service name `bedrock-runtime` > one endpoint per workload VPC with Status `Available` and Private DNS names enabled `Yes`
    - Fix: VPC > Endpoints > Create endpoint > AWS services > search `com.amazonaws.<region>.bedrock-runtime` > select the VPC, subnets and security group > check Enable DNS name > Create endpoint
  - **CLI**:
    - Verify:
      ```bash
      aws ec2 describe-vpc-endpoints --filters Name=service-name,Values=com.amazonaws.<region>.bedrock-runtime \
        --query 'VpcEndpoints[*].[VpcEndpointId,VpcId,PrivateDnsEnabled]' --output table
      ```
    - Expect: one row per workload VPC with `True` in the PrivateDnsEnabled column. Without the endpoint, invocations leave the VPC over the public internet and cannot be pinned by `aws:SourceVpce`.
    - Fix:
      ```bash
      aws ec2 create-vpc-endpoint --vpc-id <vpc-id> --vpc-endpoint-type Interface \
        --service-name com.amazonaws.<region>.bedrock-runtime --subnet-ids <subnet-id> \
        --security-group-ids <security-group-id> --private-dns-enabled
      ```

- [ ] **Use an Interface VPC Endpoint for Mantle Inference** - pass: an Interface endpoint for `com.amazonaws.<region>.bedrock-mantle` exists with private DNS on and a policy scoped to `aws:PrincipalOrgID`
  - **Console**:
    - Verify: VPC > Endpoints > filter Service name `bedrock-mantle` > the endpoint shows Status `Available`, Private DNS names enabled `Yes`, and its Policy tab carries the `aws:PrincipalOrgID` condition
    - Fix: VPC > Endpoints > Create endpoint > AWS services > search `com.amazonaws.<region>.bedrock-mantle` > select the VPC, subnets and security group > check Enable DNS name > Policy > Custom > paste the org-scoped policy > Create endpoint
  - **CLI**:
    - Verify:
      ```bash
      aws ec2 describe-vpc-endpoints --filters Name=service-name,Values=com.amazonaws.<region>.bedrock-mantle \
        --query 'VpcEndpoints[*].[VpcEndpointId,VpcId,PrivateDnsEnabled,PolicyDocument]'
      ```
    - Expect: at least one row with `true` and a `PolicyDocument` containing `aws:PrincipalOrgID` = your org ID. Without it Mantle traffic crosses the public internet and the private path is usable by any AWS principal.
    - Fix:
      ```bash
      aws ec2 create-vpc-endpoint --vpc-id <vpc-id> --vpc-endpoint-type Interface \
        --service-name com.amazonaws.<region>.bedrock-mantle --subnet-ids <subnet-id> \
        --security-group-ids <security-group-id> --private-dns-enabled --policy-document '{
          "Version": "2012-10-17",
          "Statement": [{
            "Effect": "Allow",
            "Principal": "*",
            "Action": ["bedrock-mantle:CreateInference"],
            "Resource": "*",
            "Condition": {"StringEquals": {"aws:PrincipalOrgID": "<org-id>"}}
          }]
        }'
      ```

- [ ] **Use an Interface VPC Endpoint for the Bedrock Control Plane** - pass: an Interface endpoint for `com.amazonaws.<region>.bedrock` exists with `PrivateDnsEnabled` = `true`
  - **Console**:
    - Verify: VPC > Endpoints > filter Service name `com.amazonaws.<region>.bedrock` (exact) > the endpoint shows Status `Available` and Private DNS names enabled `Yes`
    - Fix: VPC > Endpoints > Create endpoint > AWS services > search `com.amazonaws.<region>.bedrock` > select the VPC, subnets and security group > check Enable DNS name > Create endpoint
  - **CLI**:
    - Verify:
      ```bash
      aws ec2 describe-vpc-endpoints --filters Name=service-name,Values=com.amazonaws.<region>.bedrock \
        --query 'VpcEndpoints[*].[VpcEndpointId,VpcId,PrivateDnsEnabled]' --output table
      ```
    - Expect: at least one row with `True`. Guardrail, logging and model-access changes made from inside the VPC otherwise travel the public path and cannot be restricted by an endpoint policy.
    - Fix:
      ```bash
      aws ec2 create-vpc-endpoint --vpc-id <vpc-id> --vpc-endpoint-type Interface \
        --service-name com.amazonaws.<region>.bedrock --subnet-ids <subnet-id> \
        --security-group-ids <security-group-id> --private-dns-enabled
      ```

- [ ] **Use an Interface VPC Endpoint for the Agent Runtime** - pass: an Interface endpoint for `com.amazonaws.<region>.bedrock-agent-runtime` exists with `PrivateDnsEnabled` = `true`
  - **Console**:
    - Verify: VPC > Endpoints > filter Service name `bedrock-agent-runtime` > the endpoint shows Status `Available` and Private DNS names enabled `Yes`
    - Fix: VPC > Endpoints > Create endpoint > AWS services > search `com.amazonaws.<region>.bedrock-agent-runtime` > select the VPC, subnets and security group > check Enable DNS name > Create endpoint
  - **CLI**:
    - Verify:
      ```bash
      aws ec2 describe-vpc-endpoints --filters Name=service-name,Values=com.amazonaws.<region>.bedrock-agent-runtime \
        --query 'VpcEndpoints[*].[VpcEndpointId,VpcId,PrivateDnsEnabled]' --output table
      ```
    - Expect: at least one row with `True`. Agent invocations and knowledge-base retrievals otherwise leave the VPC unencrypted-at-the-network-layer to the public endpoint.
    - Fix:
      ```bash
      aws ec2 create-vpc-endpoint --vpc-id <vpc-id> --vpc-endpoint-type Interface \
        --service-name com.amazonaws.<region>.bedrock-agent-runtime --subnet-ids <subnet-id> \
        --security-group-ids <security-group-id> --private-dns-enabled
      ```

- [ ] **Attach a Custom Endpoint Policy** - pass: every Bedrock endpoint's `PolicyDocument` allows only the approved invoke actions on approved ARNs for `aws:PrincipalOrgID` = your org
  - **Console**:
    - Verify: VPC > Endpoints > <bedrock endpoint> > Policy tab > the document is not the default full-access policy and carries the `aws:PrincipalOrgID` condition with named model ARNs
    - Fix: VPC > Endpoints > <bedrock endpoint> > Actions > Manage policy > Custom > paste the scoped policy > Save
  - **CLI**:
    - Verify:
      ```bash
      aws ec2 describe-vpc-endpoints --filters Name=service-name,Values=com.amazonaws.<region>.bedrock-runtime,com.amazonaws.<region>.bedrock \
        --query 'VpcEndpoints[*].[VpcEndpointId,PolicyDocument]'
      ```
    - Expect: no endpoint returns the default document with `"Principal": "*"` and `"Action": "*"` and no condition. A default policy lets any principal, including credentials from other accounts, use your private path to any model.
    - Fix:
      ```bash
      aws ec2 modify-vpc-endpoint --vpc-endpoint-id <vpce-id> --policy-document '{
        "Version": "2012-10-17",
        "Statement": [{
          "Effect": "Allow",
          "Principal": "*",
          "Action": ["bedrock:InvokeModel", "bedrock:InvokeModelWithResponseStream"],
          "Resource": [
            "arn:aws:bedrock:<region>::foundation-model/<model-id>",
            "arn:aws:bedrock:<region>:<account>:inference-profile/<profile-id>"
          ],
          "Condition": {"StringEquals": {"aws:PrincipalOrgID": "<org-id>"}}
        }]
      }'
      ```

- [ ] **Require Invocation Through the VPC Endpoint** - pass: an SCP denies invoke when `aws:SourceVpce` is not the approved endpoint, excluding AWS service calls and the Bedrock service role
  - **Console**:
    - Verify: AWS Organizations > Policies > Service control policies > `RequireBedrockVpcEndpoint` > Content shows the `Deny` with `StringNotEquals aws:SourceVpce` = your endpoint ID, and Targets lists the root or OU
    - Fix: AWS Organizations > Policies > Service control policies > Create policy > Policy name `RequireBedrockVpcEndpoint` > JSON editor > paste the deny statement with your endpoint ID > Create policy; then select the policy > Targets > Attach > choose the root or OU > Attach policy
  - **CLI**:
    - Verify:
      ```bash
      aws organizations list-policies-for-target --target-id <root-or-ou-id> --filter SERVICE_CONTROL_POLICY \
        --query 'Policies[].[Name,Id]' --output table
      ```
    - Verify:
      ```bash
      aws iam simulate-principal-policy --policy-source-arn <role-arn> --action-names bedrock:InvokeModel \
        --resource-arns arn:aws:bedrock:<region>::foundation-model/<model-id> \
        --context-entries ContextKeyName=aws:SourceVpce,ContextKeyValues=vpce-0000000000000000a,ContextKeyType=string \
        --query 'EvaluationResults[*].EvalDecision'
      ```
    - Expect: `RequireBedrockVpcEndpoint` is listed for the target and the simulation returns `explicitDeny` for the unapproved endpoint ID. Without it a stolen credential can invoke your models from anywhere on the internet.
    - Fix:
      ```bash
      aws organizations create-policy --type SERVICE_CONTROL_POLICY --name RequireBedrockVpcEndpoint \
        --description "Model invocation only through the approved VPC endpoint" \
        --query 'Policy.PolicySummary.Id' --output text --content '{
          "Version": "2012-10-17",
          "Statement": [{
            "Effect": "Deny",
            "Action": ["bedrock:InvokeModel", "bedrock:InvokeModelWithResponseStream"],
            "Resource": "*",
            "Condition": {
              "StringNotEquals": {"aws:SourceVpce": "<vpce-id>"},
              "Bool": {"aws:ViaAWSService": "false"},
              "ArnNotLike": {"aws:PrincipalArn": ["arn:aws:iam::*:role/<bedrock-service-role>"]}
            }
          }]
        }'
      ```
    - Fix: `aws organizations attach-policy --target-id <root-or-ou-id> --policy-id <scp-id>`

---

## Model Invocation Logging & Audit

- [ ] **Enable Model Invocation Logging** - pass: `get-model-invocation-logging-configuration` returns a `loggingConfig` with an S3 or CloudWatch destination and every data-delivery flag `true`
  - **Console**:
    - Verify: Amazon Bedrock > Settings > Model invocation logging > Model invocation logging is selected, Text, Image, Embedding and Video are selected, and an S3 or CloudWatch Logs destination is shown
    - Fix: Amazon Bedrock > Settings > Model invocation logging > select Model invocation logging > select Text, Image, Embedding and Video > choose `Both Amazon S3 and CloudWatch Logs` > enter the bucket, log group and role > save the settings
  - **CLI**:
    - Verify: `aws bedrock get-model-invocation-logging-configuration`
    - Expect: `loggingConfig` is present with `textDataDeliveryEnabled`, `imageDataDeliveryEnabled` and `embeddingDataDeliveryEnabled` = `true` and a bucket or log group named. Without it there is no record of what was sent to or returned by a model, so prompt-injection or data-leak incidents cannot be reconstructed.
    - Fix:
      ```bash
      aws bedrock put-model-invocation-logging-configuration --logging-config '{
        "cloudWatchConfig": {
          "logGroupName": "<log-group>",
          "roleArn": "<logging-role-arn>",
          "largeDataDeliveryS3Config": {"bucketName": "<bucket>"}
        },
        "s3Config": {"bucketName": "<bucket>", "keyPrefix": "bedrock-invocations"},
        "textDataDeliveryEnabled": true,
        "imageDataDeliveryEnabled": true,
        "embeddingDataDeliveryEnabled": true,
        "videoDataDeliveryEnabled": true,
        "audioDataDeliveryEnabled": true
      }'
      ```

- [ ] **Encrypt the Invocation Log Destination with a Customer-Managed Key** - pass: the log bucket's default encryption is `aws:kms` with your key and the log group reports a `kmsKeyId`
  - **Console**:
    - Verify: S3 > Buckets > <bucket> > Properties > Default encryption shows `Server-side encryption with AWS Key Management Service keys (SSE-KMS)` and your key ARN
    - Fix: S3 > Buckets > <bucket> > Properties > Default encryption > Edit > `Server-side encryption with AWS Key Management Service keys (SSE-KMS)` > Choose from your AWS KMS keys > <key> > Save changes
  - **CLI**:
    - Verify:
      ```bash
      aws s3api get-bucket-encryption --bucket <bucket> \
        --query 'ServerSideEncryptionConfiguration.Rules[].ApplyServerSideEncryptionByDefault'
      ```
    - Verify: `aws logs describe-log-groups --log-group-name-prefix <log-group> --query 'logGroups[0].kmsKeyId'`
    - Expect: `SSEAlgorithm` = `aws:kms` with `KMSMasterKeyID` = your key, and the log group returns your key ARN rather than `null`. With AWS-owned keys anyone with S3 or Logs read rights sees full prompts and completions; a customer key adds a KMS policy gate.
    - Fix:
      ```bash
      aws s3api put-bucket-encryption --bucket <bucket> --server-side-encryption-configuration '{
        "Rules": [{
          "ApplyServerSideEncryptionByDefault": {"SSEAlgorithm": "aws:kms", "KMSMasterKeyID": "<kms-key-arn>"},
          "BucketKeyEnabled": true
        }]
      }'
      ```
    - Fix: `aws logs associate-kms-key --log-group-name <log-group> --kms-key-id <kms-key-arn>`

- [ ] **Restrict Who Can Read Invocation Logs** - pass: the bucket policy denies `s3:GetObject` and `s3:ListBucket` to every principal except the security role
  - **Console**:
    - Verify: S3 > Buckets > <bucket> > Permissions > Bucket policy > a `Deny` statement on `s3:GetObject` and `s3:ListBucket` with `ArnNotLike aws:PrincipalArn` naming only the security role
    - Fix: S3 > Buckets > <bucket> > Permissions > Bucket policy > Edit > paste the deny statement > Save changes
  - **CLI**:
    - Verify: `aws s3api get-bucket-policy --bucket <bucket> --query Policy --output text`
    - Expect: the policy contains the `Deny` statement with `ArnNotLike` on `aws:PrincipalArn`. Invocation logs hold raw prompts and completions, which routinely include customer data and secrets.
    - Fix:
      ```bash
      aws s3api put-bucket-policy --bucket <bucket> --policy '{
        "Version": "2012-10-17",
        "Statement": [{
          "Effect": "Deny",
          "Principal": "*",
          "Action": ["s3:GetObject", "s3:ListBucket"],
          "Resource": ["arn:aws:s3:::<bucket>", "arn:aws:s3:::<bucket>/*"],
          "Condition": {
            "ArnNotLike": {"aws:PrincipalArn": ["arn:aws:iam::<account>:role/<security-role>"]},
            "Bool": {"aws:ViaAWSService": "false"}
          }
        }]
      }'
      ```

- [ ] **Mask Sensitive Data in the CloudWatch Log Group** - pass: `get-data-protection-policy` returns a policy with `Audit` and `Deidentify` operations for credential and PII identifiers
  - **Console**:
    - Verify: CloudWatch > Logs > Log groups > <log-group> > Data protection > the policy lists the `AwsSecretKey`, `EmailAddress` and `CreditCardNumber` identifiers and masking is active
    - Fix: CloudWatch > Logs > Log groups > <log-group> > Actions > Create data protection policy > select the `AwsSecretKey`, `EmailAddress` and `CreditCardNumber` identifiers > Activate data protection
  - **CLI**:
    - Verify: `aws logs get-data-protection-policy --log-group-identifier <log-group>`
    - Expect: `policyDocument` contains a `Deidentify` statement with `MaskConfig` for the listed identifiers. Without masking, every reader of the log group sees the credentials and PII that users paste into prompts.
    - Fix:
      ```bash
      aws logs put-data-protection-policy --log-group-identifier <log-group> --policy-document '{
        "Name": "MaskCredentialsAndPii",
        "Version": "2021-06-01",
        "Statement": [
          {
            "DataIdentifier": [
              "arn:aws:dataprotection::aws:data-identifier/AwsSecretKey",
              "arn:aws:dataprotection::aws:data-identifier/EmailAddress",
              "arn:aws:dataprotection::aws:data-identifier/CreditCardNumber"
            ],
            "Operation": {"Audit": {"FindingsDestination": {}}}
          },
          {
            "DataIdentifier": [
              "arn:aws:dataprotection::aws:data-identifier/AwsSecretKey",
              "arn:aws:dataprotection::aws:data-identifier/EmailAddress",
              "arn:aws:dataprotection::aws:data-identifier/CreditCardNumber"
            ],
            "Operation": {"Deidentify": {"MaskConfig": {}}}
          }
        ]
      }'
      ```

- [ ] **Enable Deletion Protection for the Invocation Log Bucket** - pass: bucket versioning is `Enabled` and Object Lock has a `COMPLIANCE` default retention
  - **Console**:
    - Verify: S3 > Buckets > <bucket> > Properties > Bucket Versioning reads `Enabled`; Object Lock reads `Enabled` with Default retention mode `Compliance`
    - Fix: S3 > Buckets > <bucket> > Properties > Bucket Versioning > Edit > Enable > Save changes; then Object Lock > Edit > Enable > Default retention > Enable > Compliance > 365 days > Save changes
  - **CLI**:
    - Verify: `aws s3api get-bucket-versioning --bucket <bucket>`
    - Verify:
      ```bash
      aws s3api get-object-lock-configuration --bucket <bucket> \
        --query 'ObjectLockConfiguration.[ObjectLockEnabled,Rule.DefaultRetention.Mode]'
      ```
    - Expect: `"Status": "Enabled"` and `["Enabled", "COMPLIANCE"]`. An attacker who can delete logs erases the only record of what they made the model do.
    - Fix: `aws s3api put-bucket-versioning --bucket <bucket> --versioning-configuration Status=Enabled`
    - Fix:
      ```bash
      aws s3api put-object-lock-configuration --bucket <bucket> --object-lock-configuration '{
        "ObjectLockEnabled": "Enabled",
        "Rule": {"DefaultRetention": {"Mode": "COMPLIANCE", "Days": 365}}
      }'
      ```

- [ ] **Log Bedrock Data Events in CloudTrail** - pass: the trail's advanced event selectors include Data events for every `AWS::Bedrock::*` resource type
  - **Console**:
    - Verify: CloudTrail > Trails > <trail> > Data events > the list shows the Bedrock resource types (Guardrail, KnowledgeBase, AgentAlias, InlineAgent, FlowAlias, PromptVersion, Model, AsyncInvoke) with `Log all events`
    - Fix: CloudTrail > Trails > <trail> > Data events > Edit > Add data event type > Resource type `Bedrock ...` for each type > Log selector template `Log all events` > Save changes
  - **CLI**:
    - Verify:
      ```bash
      aws cloudtrail get-event-selectors --trail-name <trail> \
        --query 'AdvancedEventSelectors[].FieldSelectors[?Field==`resources.type`].Equals[]'
      ```
    - Expect: the output lists `AWS::Bedrock::Guardrail`, `AWS::Bedrock::KnowledgeBase`, `AWS::Bedrock::AgentAlias`, `AWS::Bedrock::InlineAgent`, `AWS::Bedrock::FlowAlias`, `AWS::Bedrock::PromptVersion`, `AWS::Bedrock::Model` and `AWS::Bedrock::AsyncInvoke`. Without data events, `InvokeModel`, `ApplyGuardrail` and `Retrieve` calls never appear in CloudTrail and cannot be alerted on.
    - Fix:
      ```bash
      aws cloudtrail put-event-selectors --trail-name <trail> --advanced-event-selectors "$(
        aws cloudtrail get-event-selectors --trail-name <trail> --query 'AdvancedEventSelectors' --output json | jq '
          (. // []) + [
            {"FieldSelectors": [{"Field": "eventCategory", "Equals": ["Management"]}]},
            {"FieldSelectors": [{"Field": "eventCategory", "Equals": ["Data"]}, {"Field": "resources.type", "Equals": ["AWS::Bedrock::Guardrail"]}]},
            {"FieldSelectors": [{"Field": "eventCategory", "Equals": ["Data"]}, {"Field": "resources.type", "Equals": ["AWS::Bedrock::KnowledgeBase"]}]},
            {"FieldSelectors": [{"Field": "eventCategory", "Equals": ["Data"]}, {"Field": "resources.type", "Equals": ["AWS::Bedrock::AgentAlias"]}]},
            {"FieldSelectors": [{"Field": "eventCategory", "Equals": ["Data"]}, {"Field": "resources.type", "Equals": ["AWS::Bedrock::InlineAgent"]}]},
            {"FieldSelectors": [{"Field": "eventCategory", "Equals": ["Data"]}, {"Field": "resources.type", "Equals": ["AWS::Bedrock::FlowAlias"]}]},
            {"FieldSelectors": [{"Field": "eventCategory", "Equals": ["Data"]}, {"Field": "resources.type", "Equals": ["AWS::Bedrock::PromptVersion"]}]},
            {"FieldSelectors": [{"Field": "eventCategory", "Equals": ["Data"]}, {"Field": "resources.type", "Equals": ["AWS::Bedrock::Model"]}]},
            {"FieldSelectors": [{"Field": "eventCategory", "Equals": ["Data"]}, {"Field": "resources.type", "Equals": ["AWS::Bedrock::AsyncInvoke"]}]}
          ] | unique')"
      ```

- [ ] **Log Mantle Inference as CloudTrail Data Events** - pass: the trail's advanced event selectors include Data events for the `AWS::BedrockMantle::*` resource types
  - **Console**:
    - Verify: CloudTrail > Trails > <trail> > Data events > the list shows the Bedrock Mantle resource types (Project, CustomizedModel, Reservation) with `Log all events`
    - Fix: CloudTrail > Trails > <trail> > Data events > Edit > Add data event type > Resource type `Bedrock Mantle ...` for each type > Log selector template `Log all events` > Save changes
  - **CLI**:
    - Verify:
      ```bash
      aws cloudtrail get-event-selectors --trail-name <trail> \
        --query 'AdvancedEventSelectors[].FieldSelectors[?Field==`resources.type`].Equals[]'
      ```
    - Expect: the output lists `AWS::BedrockMantle::Project`, `AWS::BedrockMantle::CustomizedModel` and `AWS::BedrockMantle::Reservation`. Mantle inference bypasses model invocation logging, so CloudTrail data events are the only record of who called it.
    - Fix:
      ```bash
      aws cloudtrail put-event-selectors --trail-name <trail> --advanced-event-selectors "$(
        aws cloudtrail get-event-selectors --trail-name <trail> --query 'AdvancedEventSelectors' --output json | jq '
          (. // []) + [
            {"FieldSelectors": [{"Field": "eventCategory", "Equals": ["Management"]}]},
            {"FieldSelectors": [{"Field": "eventCategory", "Equals": ["Data"]}, {"Field": "resources.type", "Equals": ["AWS::BedrockMantle::Project"]}]},
            {"FieldSelectors": [{"Field": "eventCategory", "Equals": ["Data"]}, {"Field": "resources.type", "Equals": ["AWS::BedrockMantle::CustomizedModel"]}]},
            {"FieldSelectors": [{"Field": "eventCategory", "Equals": ["Data"]}, {"Field": "resources.type", "Equals": ["AWS::BedrockMantle::Reservation"]}]}
          ] | unique')"
      ```

- [ ] **Enable GuardDuty for Bedrock API Anomaly Detection** - pass: a GuardDuty detector exists in the region with `Status` = `ENABLED`
  - **Console**:
    - Verify: GuardDuty > Settings > the detector status reads `Enabled` (the Summary page shows findings rather than a `Get started` prompt)
    - Fix: GuardDuty > Get started > Enable GuardDuty
  - **CLI**:
    - Verify:
      ```bash
      aws guardduty get-detector --detector-id $(aws guardduty list-detectors --query 'DetectorIds[0]' --output text) \
        --query 'Status'
      ```
    - Expect: `"ENABLED"`. GuardDuty's Bedrock findings (anomalous invoke volume, credential use from new geographies) are the only managed detection for model abuse with stolen credentials.
    - Fix: `aws guardduty create-detector --enable --finding-publishing-frequency FIFTEEN_MINUTES`

- [ ] **Enable the Security Hub AI Security Best Practices Standard** - pass: `get-enabled-standards` lists the `ai-security-best-practices` standard with `StandardsStatus` = `READY`
  - **Console**:
    - Verify: Security Hub > Security standards > `AI Security Best Practices` shows a security score rather than `Enable standard`
    - Fix: Security Hub > Security standards > `AI Security Best Practices` > Enable standard
  - **CLI**:
    - Verify:
      ```bash
      aws securityhub get-enabled-standards \
        --query 'StandardsSubscriptions[].[StandardsArn,StandardsStatus]' --output table
      ```
    - Expect: a row whose ARN contains `ai-security-best-practices` with status `READY`. Without it, misconfigured Bedrock resources produce no findings and drift goes unnoticed.
    - Fix:
      ```bash
      aws securityhub batch-enable-standards --standards-subscription-requests \
        StandardsArn=arn:aws:securityhub:<region>::standards/ai-security-best-practices/v/<version>
      ```

- [ ] **Alert on Long-Term Key Creation and Bearer-Token Use** - pass: EventBridge rules `bedrock-long-term-key-created` (in `us-east-1`) and `bedrock-bearer-token-call` are `ENABLED` with an SNS target
  - **Console**:
    - Verify: Amazon EventBridge (region `us-east-1`) > Rules > `bedrock-long-term-key-created` > State `Enabled` with an SNS target; then Amazon EventBridge (workload region) > Rules > `bedrock-bearer-token-call` > State `Enabled` with an SNS target
    - Fix: Amazon EventBridge > Rules > Create rule > Name `bedrock-long-term-key-created` (in `us-east-1`) or `bedrock-bearer-token-call` > Rule with an event pattern > Next > Custom pattern (JSON editor) > paste the pattern > Next > Target `SNS topic` > <topic> > Next > Create rule
  - **CLI**:
    - Verify:
      ```bash
      aws events list-rules --region us-east-1 --query "Rules[?Name=='bedrock-long-term-key-created'].State"
      ```
    - Verify: `aws events list-rules --query "Rules[?Name=='bedrock-bearer-token-call'].State"`
    - Expect: both return `["ENABLED"]`. IAM events are delivered only in `us-east-1`, so a key-creation rule in any other region never fires and a new bearer credential goes unnoticed.
    - Fix:
      ```bash
      aws events put-rule --region us-east-1 --name bedrock-long-term-key-created --event-pattern '{
        "source": ["aws.iam"],
        "detail-type": ["AWS API Call via CloudTrail"],
        "detail": {
          "eventSource": ["iam.amazonaws.com"],
          "eventName": ["CreateServiceSpecificCredential"],
          "requestParameters": {"serviceName": ["bedrock.amazonaws.com"]}
        }
      }'
      aws events put-targets --region us-east-1 --rule bedrock-long-term-key-created \
        --targets Id=alert,Arn=<sns-topic-arn-in-us-east-1>
      ```
    - Fix:
      ```bash
      aws events put-rule --name bedrock-bearer-token-call --event-pattern '{
        "source": ["aws.bedrock"],
        "detail-type": ["AWS API Call via CloudTrail"],
        "detail": {
          "eventSource": ["bedrock.amazonaws.com"],
          "additionalEventData": {"callWithBearerToken": [true]}
        }
      }'
      aws events put-targets --rule bedrock-bearer-token-call --targets Id=alert,Arn=<sns-topic-arn>
      ```

- [ ] **Alert on Bearer-Token Use on the Mantle Endpoint** - pass: EventBridge rule `bedrock-mantle-bearer-token-call` is `ENABLED` with an SNS target
  - **Console**:
    - Verify: Amazon EventBridge > Rules > `bedrock-mantle-bearer-token-call` > State `Enabled` with an SNS target
    - Fix: Amazon EventBridge > Rules > Create rule > Name `bedrock-mantle-bearer-token-call` > Rule with an event pattern > Next > Custom pattern (JSON editor) > paste the pattern > Next > Target `SNS topic` > <topic> > Next > Create rule
  - **CLI**:
    - Verify: `aws events list-rules --query "Rules[?Name=='bedrock-mantle-bearer-token-call'].State"`
    - Expect: `["ENABLED"]`. Bearer-token calls to Mantle carry no session identity, so without an alert there is nothing to tie a leaked key's use back to a person.
    - Fix:
      ```bash
      aws events put-rule --name bedrock-mantle-bearer-token-call --event-pattern '{
        "detail-type": ["AWS API Call via CloudTrail"],
        "detail": {
          "eventSource": ["bedrock-mantle.amazonaws.com"],
          "requestParameters": {"callWithBearerToken": [true]}
        }
      }'
      aws events put-targets --rule bedrock-mantle-bearer-token-call --targets Id=alert,Arn=<sns-topic-arn>
      ```

- [ ] **Alarm on Guardrail Interventions** - pass: a CloudWatch alarm on `AWS/Bedrock/Guardrails` `InvocationsIntervened` exists with an SNS action
  - **Console**:
    - Verify: CloudWatch > Alarms > All alarms > `bedrock-guardrail-interventions` > Details show metric `InvocationsIntervened` in namespace `AWS/Bedrock/Guardrails` and an Actions entry pointing at an SNS topic
    - Fix: CloudWatch > Alarms > Create alarm > Select metric > Bedrock > Guardrails > `InvocationsIntervened` for the guardrail and version > Statistic `Sum`, Period `5 minutes` > Threshold `Greater/Equal` than `1` > Next > Notification > <sns-topic> > Next > Alarm name `bedrock-guardrail-interventions` > Create alarm
  - **CLI**:
    - Verify:
      ```bash
      aws cloudwatch describe-alarms-for-metric --metric-name InvocationsIntervened --namespace AWS/Bedrock/Guardrails \
        --dimensions Name=GuardrailArn,Value=<guardrail-arn> Name=GuardrailVersion,Value=<version> \
        --query 'MetricAlarms[].[AlarmName,AlarmActions]'
      ```
    - Expect: at least one alarm with a non-empty `AlarmActions` list. Interventions are the earliest visible sign of prompt-injection or data-exfiltration attempts, and nobody looks at the metric without an alarm.
    - Fix:
      ```bash
      aws cloudwatch put-metric-alarm --alarm-name bedrock-guardrail-interventions \
        --namespace AWS/Bedrock/Guardrails --metric-name InvocationsIntervened \
        --dimensions Name=GuardrailArn,Value=<guardrail-arn> Name=GuardrailVersion,Value=<version> \
        --statistic Sum --period 300 --evaluation-periods 1 --threshold 1 \
        --comparison-operator GreaterThanOrEqualToThreshold --alarm-actions <sns-topic-arn>
      ```

---

## Data Protection

- [ ] **Set the Account Data-Retention Mode Deliberately on Both Prefixes** - pass: in every region where models are enabled, `get-account-data-retention` returns `mode` = `none` (or your documented policy value), and wherever that region has a Mantle endpoint, the Mantle endpoint returns the same mode
  - **CLI**:
    - Verify: `aws bedrock get-account-data-retention --region <region>`
    - Verify: `curl https://bedrock-mantle.<region>.api.aws/v1/data_retention -H "x-api-key: $BEDROCK_API_KEY"`
    - Expect: both return `"mode": "none"` (or the documented policy value) in every region where models are enabled, or the first alone where the Mantle host does not resolve (that region has no Mantle endpoint). A region left at `inherit` falls back to each model's default, and models that retain for abuse detection keep that traffic for up to 30 days.
    - Fix: `aws bedrock put-account-data-retention --region <region> --mode none`
    - Fix:
      ```bash
      curl -X PUT https://bedrock-mantle.<region>.api.aws/v1/data_retention \
        -H "x-api-key: $BEDROCK_API_KEY" -H "Content-Type: application/json" -d '{ "mode": "none" }'
      ```

- [ ] **Enforce the Data-Retention Mode by SCP on Both Prefixes and on Mantle Projects** - pass: an SCP denies `PutAccountDataRetention` on both prefixes and Mantle project create/update unless `DataRetentionMode` equals the policy value
  - **Console**:
    - Verify: AWS Organizations > Policies > Service control policies > `LockBedrockDataRetentionMode` > Content shows `Deny` statements on `bedrock-mantle:PutAccountDataRetention`, `bedrock-mantle:CreateProject`, `bedrock-mantle:UpdateProject` and `bedrock:PutAccountDataRetention` conditioned on the `DataRetentionMode` keys, and Targets lists the root or OU
    - Fix: AWS Organizations > Policies > Service control policies > Create policy > Policy name `LockBedrockDataRetentionMode` > JSON editor > paste the two deny statements > Create policy; then select the policy > Targets > Attach > choose the root or OU > Attach policy
  - **CLI**:
    - Verify:
      ```bash
      aws organizations list-policies-for-target --target-id <root-or-ou-id> --filter SERVICE_CONTROL_POLICY \
        --query 'Policies[].[Name,Id]' --output table
      ```
    - Verify: `aws organizations describe-policy --policy-id <scp-id> --query 'Policy.Content' --output text`
    - Expect: `LockBedrockDataRetentionMode` is listed for the target and its content conditions every statement on `StringNotEquals` `DataRetentionMode` = `none`. Without the SCP any account administrator can flip retention back on with one API call; the management account is outside every SCP and needs the same deny as an IAM policy.
    - Fix:
      ```bash
      aws organizations create-policy --type SERVICE_CONTROL_POLICY --name LockBedrockDataRetentionMode \
        --description "Data-retention mode may only be set to the policy value at account and project scope" \
        --query 'Policy.PolicySummary.Id' --output text --content '{
          "Version": "2012-10-17",
          "Statement": [
            {
              "Effect": "Deny",
              "Action": ["bedrock-mantle:PutAccountDataRetention", "bedrock-mantle:CreateProject", "bedrock-mantle:UpdateProject"],
              "Resource": "*",
              "Condition": {"StringNotEquals": {"bedrock-mantle:DataRetentionMode": "none"}}
            },
            {
              "Effect": "Deny",
              "Action": ["bedrock:PutAccountDataRetention"],
              "Resource": "*",
              "Condition": {"StringNotEquals": {"bedrock:DataRetentionMode": "none"}}
            }
          ]
        }'
      ```
    - Fix: `aws organizations attach-policy --target-id <root-or-ou-id> --policy-id <scp-id>`

- [ ] **Encrypt Bedrock Sessions with a Customer-Managed Key** - pass: every session returned by `get-session` reports `encryptionKeyArn` = your KMS key
  - **CLI**:
    - Verify: `aws bedrock-agent-runtime list-sessions --query 'sessionSummaries[].sessionId'`
    - Verify: `aws bedrock-agent-runtime get-session --session-identifier <id> --query 'encryptionKeyArn'`
    - Expect: every session returns your key ARN, not `null`. Session state holds conversation history and invocation steps; under the AWS-owned key there is no KMS policy gate on who reads it.
    - Fix: `aws bedrock-agent-runtime create-session --encryption-key-arn <kms-key-arn>`

---

## Guardrails

- [ ] **Create at Least One Guardrail Per Application** - pass: `list-guardrails` returns a `READY` guardrail for every application in each region where models are invoked
  - **Console**:
    - Verify: Amazon Bedrock > Guardrails > the list contains one guardrail per application in this region with Status `Ready`
    - Fix: Amazon Bedrock > Guardrails > Create guardrail > Name > blocked messaging > configure content filters, denied topics, sensitive-information filters and contextual grounding > Create guardrail
  - **CLI**:
    - Verify: `aws bedrock list-guardrails --query 'guardrails[].[name,id,version,status]' --output table`
    - Expect: one row per application with status `READY`. Without a guardrail nothing screens prompt attacks on the way in or credential and PII leakage on the way out.
    - Fix:
      ```bash
      aws bedrock create-guardrail --name <guardrail-name> \
        --blocked-input-messaging "<blocked-input-message>" --blocked-outputs-messaging "<blocked-output-message>" \
        --kms-key-id <kms-key-arn> \
        --content-policy-config '{"filtersConfig": [{"type": "PROMPT_ATTACK", "inputStrength": "HIGH", "outputStrength": "NONE"}]}' \
        --sensitive-information-policy-config '{
          "piiEntitiesConfig": [
            {"type": "AWS_ACCESS_KEY", "action": "BLOCK"},
            {"type": "AWS_SECRET_KEY", "action": "BLOCK"},
            {"type": "PASSWORD", "action": "BLOCK"},
            {"type": "CREDIT_DEBIT_CARD_NUMBER", "action": "BLOCK"},
            {"type": "US_SOCIAL_SECURITY_NUMBER", "action": "BLOCK"}
          ]
        }' \
        --topic-policy-config '{"topicsConfig": [{"name": "<denied-topic>", "definition": "<topic-definition>", "type": "DENY"}]}' \
        --contextual-grounding-policy-config '{"filtersConfig": [{"type": "GROUNDING", "threshold": 0.75}, {"type": "RELEVANCE", "threshold": 0.75}]}'
      ```

- [ ] **Set Prompt-Attack Filter Strength to HIGH** - pass: `contentPolicy.filters` contains a `PROMPT_ATTACK` filter with `inputStrength` = `HIGH`
  - **Console**:
    - Verify: Amazon Bedrock > Guardrails > <guardrail> > <version> > Content filters > Prompt attacks > filter strength reads `High`
    - Fix: Amazon Bedrock > Guardrails > <guardrail> > Working draft > Edit > Content filters > Prompt attacks > set strength to `High` > Save and exit
  - **CLI**:
    - Verify:
      ```bash
      aws bedrock get-guardrail --guardrail-identifier <id> --guardrail-version <version> \
        --query "contentPolicy.filters[?type=='PROMPT_ATTACK'].[inputStrength,outputStrength]"
      ```
    - Expect: `[["HIGH", "NONE"]]`. Lower strengths let straightforward jailbreak and instruction-override prompts through.
    - Fix:
      ```bash
      aws bedrock update-guardrail --cli-input-json "$(aws bedrock get-guardrail --guardrail-identifier <guardrail-id> --guardrail-version DRAFT --output json | jq '
        {guardrailIdentifier: .guardrailId, name, description, blockedInputMessaging, blockedOutputsMessaging, kmsKeyId: .kmsKeyArn,
         topicPolicyConfig: (if .topicPolicy then {topicsConfig: .topicPolicy.topics} else null end),
         contentPolicyConfig: (if .contentPolicy then {filtersConfig: .contentPolicy.filters} else null end),
         sensitiveInformationPolicyConfig: (if .sensitiveInformationPolicy then {piiEntitiesConfig: .sensitiveInformationPolicy.piiEntities, regexesConfig: .sensitiveInformationPolicy.regexes} else null end),
         wordPolicyConfig: (if .wordPolicy then {wordsConfig: .wordPolicy.words, managedWordListsConfig: .wordPolicy.managedWordLists} else null end),
         contextualGroundingPolicyConfig: (if .contextualGroundingPolicy then {filtersConfig: .contextualGroundingPolicy.filters} else null end),
         crossRegionConfig: (if .crossRegionDetails then {guardrailProfileIdentifier: .crossRegionDetails.guardrailProfileArn} else null end)}
        | del(..|nulls)
        | .contentPolicyConfig.filtersConfig |= map(if .type == "PROMPT_ATTACK" then .inputStrength = "HIGH" | .outputStrength = "NONE" else . end)')"
      ```

- [ ] **Configure Sensitive-Information Filters for Credentials and PII** - pass: `sensitiveInformationPolicy.piiEntities` blocks `AWS_ACCESS_KEY`, `AWS_SECRET_KEY` and `PASSWORD` and blocks or anonymizes `CREDIT_DEBIT_CARD_NUMBER`
  - **Console**:
    - Verify: Amazon Bedrock > Guardrails > <guardrail> > <version> > Sensitive information filters > PII types list `AWS access key`, `AWS secret key`, `Password` and `Credit/debit card number` with behavior `Block` (or `Mask` for card numbers)
    - Fix: Amazon Bedrock > Guardrails > <guardrail> > Working draft > Edit > Sensitive information filters > Add new PII > select each type and its behavior > Save and exit
  - **CLI**:
    - Verify:
      ```bash
      aws bedrock get-guardrail --guardrail-identifier <id> --guardrail-version <version> \
        --query 'sensitiveInformationPolicy.piiEntities[].[type,action]' --output table
      ```
    - Expect: rows for `AWS_ACCESS_KEY`, `AWS_SECRET_KEY` and `PASSWORD` with `BLOCK`, and `CREDIT_DEBIT_CARD_NUMBER` with `BLOCK` or `ANONYMIZE`. Without them a model can echo secrets pasted into a prompt or found in retrieved documents straight back to any caller.
    - Fix:
      ```bash
      aws bedrock update-guardrail --cli-input-json "$(aws bedrock get-guardrail --guardrail-identifier <guardrail-id> --guardrail-version DRAFT --output json | jq '
        {guardrailIdentifier: .guardrailId, name, description, blockedInputMessaging, blockedOutputsMessaging, kmsKeyId: .kmsKeyArn,
         topicPolicyConfig: (if .topicPolicy then {topicsConfig: .topicPolicy.topics} else null end),
         contentPolicyConfig: (if .contentPolicy then {filtersConfig: .contentPolicy.filters} else null end),
         sensitiveInformationPolicyConfig: (if .sensitiveInformationPolicy then {piiEntitiesConfig: .sensitiveInformationPolicy.piiEntities, regexesConfig: .sensitiveInformationPolicy.regexes} else null end),
         wordPolicyConfig: (if .wordPolicy then {wordsConfig: .wordPolicy.words, managedWordListsConfig: .wordPolicy.managedWordLists} else null end),
         contextualGroundingPolicyConfig: (if .contextualGroundingPolicy then {filtersConfig: .contextualGroundingPolicy.filters} else null end),
         crossRegionConfig: (if .crossRegionDetails then {guardrailProfileIdentifier: .crossRegionDetails.guardrailProfileArn} else null end)}
        | del(..|nulls)
        | .sensitiveInformationPolicyConfig.piiEntitiesConfig |= (. // []) + [
            {type: "AWS_ACCESS_KEY", action: "BLOCK"},
            {type: "AWS_SECRET_KEY", action: "BLOCK"},
            {type: "PASSWORD", action: "BLOCK"},
            {type: "CREDIT_DEBIT_CARD_NUMBER", action: "ANONYMIZE"}
          ]')"
      ```

- [ ] **Configure Denied Topics** - pass: `topicPolicy.topics` contains at least one topic with `type` = `DENY` describing what the application must not discuss
  - **Console**:
    - Verify: Amazon Bedrock > Guardrails > <guardrail> > <version> > Denied topics > at least one topic is listed with a definition
    - Fix: Amazon Bedrock > Guardrails > <guardrail> > Working draft > Edit > Denied topics > Add denied topic > Name, Definition and sample phrases > Confirm > Save and exit
  - **CLI**:
    - Verify:
      ```bash
      aws bedrock get-guardrail --guardrail-identifier <id> --guardrail-version <version> \
        --query 'topicPolicy.topics[].[name,type]' --output table
      ```
    - Expect: at least one row with `DENY`. Without denied topics the application answers on anything a user steers it to, including legal, medical or competitor topics the business never intended to own.
    - Fix:
      ```bash
      aws bedrock update-guardrail --cli-input-json "$(aws bedrock get-guardrail --guardrail-identifier <guardrail-id> --guardrail-version DRAFT --output json | jq '
        {guardrailIdentifier: .guardrailId, name, description, blockedInputMessaging, blockedOutputsMessaging, kmsKeyId: .kmsKeyArn,
         topicPolicyConfig: (if .topicPolicy then {topicsConfig: .topicPolicy.topics} else null end),
         contentPolicyConfig: (if .contentPolicy then {filtersConfig: .contentPolicy.filters} else null end),
         sensitiveInformationPolicyConfig: (if .sensitiveInformationPolicy then {piiEntitiesConfig: .sensitiveInformationPolicy.piiEntities, regexesConfig: .sensitiveInformationPolicy.regexes} else null end),
         wordPolicyConfig: (if .wordPolicy then {wordsConfig: .wordPolicy.words, managedWordListsConfig: .wordPolicy.managedWordLists} else null end),
         contextualGroundingPolicyConfig: (if .contextualGroundingPolicy then {filtersConfig: .contextualGroundingPolicy.filters} else null end),
         crossRegionConfig: (if .crossRegionDetails then {guardrailProfileIdentifier: .crossRegionDetails.guardrailProfileArn} else null end)}
        | del(..|nulls)
        | .topicPolicyConfig.topicsConfig |= (. // []) + [{name: "<topic-name>", definition: "<what the application must not discuss>", type: "DENY"}]')"
      ```

- [ ] **Enable Contextual Grounding Checks for RAG Applications** - pass: `contextualGroundingPolicy.filters` has `GROUNDING` and `RELEVANCE` filters with `threshold` at or above your policy value
  - **Console**:
    - Verify: Amazon Bedrock > Guardrails > <guardrail> > <version> > Contextual grounding check > Grounding and Relevance are enabled with thresholds at or above the policy value (for example `0.75`)
    - Fix: Amazon Bedrock > Guardrails > <guardrail> > Working draft > Edit > Contextual grounding check > Enable grounding check and Enable relevance check > set thresholds > Save and exit
  - **CLI**:
    - Verify:
      ```bash
      aws bedrock get-guardrail --guardrail-identifier <id> --guardrail-version <version> \
        --query 'contextualGroundingPolicy.filters[].[type,threshold]' --output table
      ```
    - Expect: rows for `GROUNDING` and `RELEVANCE` with thresholds at or above your value. Without grounding checks a RAG application asserts hallucinated facts as if they came from your documents.
    - Fix:
      ```bash
      aws bedrock update-guardrail --cli-input-json "$(aws bedrock get-guardrail --guardrail-identifier <guardrail-id> --guardrail-version DRAFT --output json | jq --argjson t <threshold> '
        {guardrailIdentifier: .guardrailId, name, description, blockedInputMessaging, blockedOutputsMessaging, kmsKeyId: .kmsKeyArn,
         topicPolicyConfig: (if .topicPolicy then {topicsConfig: .topicPolicy.topics} else null end),
         contentPolicyConfig: (if .contentPolicy then {filtersConfig: .contentPolicy.filters} else null end),
         sensitiveInformationPolicyConfig: (if .sensitiveInformationPolicy then {piiEntitiesConfig: .sensitiveInformationPolicy.piiEntities, regexesConfig: .sensitiveInformationPolicy.regexes} else null end),
         wordPolicyConfig: (if .wordPolicy then {wordsConfig: .wordPolicy.words, managedWordListsConfig: .wordPolicy.managedWordLists} else null end),
         contextualGroundingPolicyConfig: (if .contextualGroundingPolicy then {filtersConfig: .contextualGroundingPolicy.filters} else null end),
         crossRegionConfig: (if .crossRegionDetails then {guardrailProfileIdentifier: .crossRegionDetails.guardrailProfileArn} else null end)}
        | del(..|nulls)
        | .contextualGroundingPolicyConfig.filtersConfig = [{type: "GROUNDING", threshold: $t}, {type: "RELEVANCE", threshold: $t}]')"
      ```

- [ ] **Publish a Numbered Guardrail Version** - pass: `list-guardrails` for the guardrail shows at least one numeric version and applications reference it rather than `DRAFT`
  - **Console**:
    - Verify: Amazon Bedrock > Guardrails > <guardrail> > Versions > at least one numbered version is listed, and the version referenced by applications is not `Working draft`
    - Fix: Amazon Bedrock > Guardrails > <guardrail> > Working draft > Create version > Description > Create version
  - **CLI**:
    - Verify: `aws bedrock list-guardrails --guardrail-identifier <id> --query 'guardrails[].[version,status]'`
    - Expect: a row with a numeric version alongside `DRAFT`, and callers use the numeric one. Draft edits take effect immediately on every caller that references `DRAFT`, with no review gate.
    - Fix: `aws bedrock create-guardrail-version --guardrail-identifier <guardrail-id> --description "<what changed in this version>"`

- [ ] **Encrypt Guardrails with a Customer-Managed Key** - pass: `get-guardrail` reports `kmsKeyArn` = your KMS key
  - **Console**:
    - Verify: Amazon Bedrock > Guardrails > <guardrail> > Overview > KMS key shows your key ARN rather than `AWS owned key`
    - Fix: Amazon Bedrock > Guardrails > <guardrail> > Guardrail overview > Edit > KMS key selection > Customize encryption settings (advanced) > choose your key > Save and exit
  - **CLI**:
    - Verify: `aws bedrock get-guardrail --guardrail-identifier <id> --guardrail-version <version> --query 'kmsKeyArn'`
    - Expect: your key ARN, not `null`. Guardrail definitions include denied-topic examples and regexes that describe exactly what the business wants hidden; a customer key gates who can read them.
    - Fix:
      ```bash
      aws bedrock update-guardrail --cli-input-json "$(aws bedrock get-guardrail --guardrail-identifier <guardrail-id> --guardrail-version DRAFT --output json | jq '
        {guardrailIdentifier: .guardrailId, name, description, blockedInputMessaging, blockedOutputsMessaging, kmsKeyId: .kmsKeyArn,
         topicPolicyConfig: (if .topicPolicy then {topicsConfig: .topicPolicy.topics} else null end),
         contentPolicyConfig: (if .contentPolicy then {filtersConfig: .contentPolicy.filters} else null end),
         sensitiveInformationPolicyConfig: (if .sensitiveInformationPolicy then {piiEntitiesConfig: .sensitiveInformationPolicy.piiEntities, regexesConfig: .sensitiveInformationPolicy.regexes} else null end),
         wordPolicyConfig: (if .wordPolicy then {wordsConfig: .wordPolicy.words, managedWordListsConfig: .wordPolicy.managedWordLists} else null end),
         contextualGroundingPolicyConfig: (if .contextualGroundingPolicy then {filtersConfig: .contextualGroundingPolicy.filters} else null end),
         crossRegionConfig: (if .crossRegionDetails then {guardrailProfileIdentifier: .crossRegionDetails.guardrailProfileArn} else null end)}
        | del(..|nulls)
        | .kmsKeyId = "<kms-key-arn>"')"
      ```

- [ ] **Enforce a Guardrail with the bedrock:GuardrailIdentifier Condition** - pass: the workload role allows invoke only when `bedrock:GuardrailIdentifier` equals the guardrail ARN and version, and denies it otherwise
  - **Console**:
    - Verify: IAM > Roles > <workload-role> > Permissions > `BedrockInvokeOnlyWithGuardrail` > JSON > the allow statement carries `StringEquals bedrock:GuardrailIdentifier` and a `Deny` statement carries `StringNotEquals` on the same key
    - Fix: IAM > Roles > <workload-role> > Permissions > Add permissions > Create inline policy > JSON > paste the allow, deny and `bedrock:ApplyGuardrail` statements > Next > Policy name `BedrockInvokeOnlyWithGuardrail` > Create policy
  - **CLI**:
    - Verify:
      ```bash
      aws iam simulate-principal-policy --policy-source-arn <role-arn> --action-names bedrock:InvokeModel \
        --resource-arns arn:aws:bedrock:<region>::foundation-model/<model-id> \
        --query 'EvaluationResults[*].EvalDecision'
      ```
    - Expect: `explicitDeny`, because no guardrail context is supplied. Without the condition a caller simply omits the guardrail from the request and the model answers unfiltered.
    - Fix:
      ```bash
      aws iam put-role-policy --role-name <workload-role> --policy-name BedrockInvokeOnlyWithGuardrail --policy-document '{
        "Version": "2012-10-17",
        "Statement": [
          {
            "Effect": "Allow",
            "Action": ["bedrock:InvokeModel", "bedrock:InvokeModelWithResponseStream"],
            "Resource": [
              "arn:aws:bedrock:<region>::foundation-model/<model-id>",
              "arn:aws:bedrock:<region>:<account>:inference-profile/<profile-id>"
            ],
            "Condition": {"StringEquals": {"bedrock:GuardrailIdentifier": "<guardrail-arn>:<version>"}}
          },
          {
            "Effect": "Deny",
            "Action": ["bedrock:InvokeModel", "bedrock:InvokeModelWithResponseStream"],
            "Resource": "*",
            "Condition": {"StringNotEquals": {"bedrock:GuardrailIdentifier": "<guardrail-arn>:<version>"}}
          },
          {"Effect": "Allow", "Action": "bedrock:ApplyGuardrail", "Resource": "<guardrail-arn>"}
        ]
      }'
      ```

- [ ] **Enforce an Account-Level Guardrail** - pass: `list-enforced-guardrails-configuration` returns your guardrail ARN and version
  - **Console**:
    - Verify: Amazon Bedrock > Guardrails > Account enforced guardrail configuration lists your guardrail and a numbered version
    - Fix: Amazon Bedrock > Guardrails > Account-level enforcement configurations > Add > select the guardrail and version > Submit
  - **CLI**:
    - Verify: `aws bedrock list-enforced-guardrails-configuration`
    - Expect: `guardrailInferenceConfigs` contains `<guardrail-arn>` with your version. Without an enforced guardrail, any principal whose IAM policy lacks the guardrail condition invokes models unfiltered.
    - Fix:
      ```bash
      aws bedrock put-enforced-guardrail-configuration \
        --guardrail-inference-config guardrailIdentifier=<guardrail-arn>,guardrailVersion=<version>
      ```

- [ ] **Enforce an Organization-Level Guardrail** - pass: the `BEDROCK_POLICY` type is enabled on the root and a Bedrock policy naming your guardrail is attached to the root or OU
  - **Console**:
    - Verify: AWS Organizations > Policies > Amazon Bedrock policies reads `Enabled` and `EnforceOrganizationGuardrail` is listed with the root or OU under Targets
    - Fix: AWS Organizations > Policies > Amazon Bedrock policies > Enable Amazon Bedrock policies; then Create policy > Policy name `EnforceOrganizationGuardrail` > enter the guardrail ARN and version > save the policy; then select the policy > Targets > Attach > choose the root or OU > Attach policy
  - **CLI**:
    - Verify: `aws organizations list-roots --query 'Roots[].PolicyTypes'`
    - Verify: `aws organizations list-policies --filter BEDROCK_POLICY --query 'Policies[].[Name,Id]'`
    - Expect: PolicyTypes includes `{"Type": "BEDROCK_POLICY", "Status": "ENABLED"}` and the policy list shows `EnforceOrganizationGuardrail`. Without it each member account can silently invoke without any guardrail.
    - Fix: `aws organizations enable-policy-type --root-id <root-id> --policy-type BEDROCK_POLICY`
    - Fix:
      ```bash
      aws organizations create-policy --type BEDROCK_POLICY --name EnforceOrganizationGuardrail \
        --description "Organization-level guardrail for AI workloads" \
        --query 'Policy.PolicySummary.Id' --output text --content '{
          "bedrock": {
            "guardrail_inference": {
              "<region>": {
                "config_1": {
                  "identifier": {"@@assign": "<guardrail-arn>:<version>"},
                  "selective_content_guarding": {
                    "system": {"@@assign": "selective"},
                    "messages": {"@@assign": "comprehensive"}
                  },
                  "model_enforcement": {"included_models": {"@@assign": ["ALL"]}}
                }
              }
            }
          }
        }'
      ```
    - Fix: `aws organizations attach-policy --target-id <root-or-ou-id> --policy-id <policy-id>`

- [ ] **Scope the Guardrail Resource-Based Policy to Your Organization** - pass: `get-resource-policy` for the guardrail returns a policy conditioned on `aws:PrincipalOrgID` = your org ID
  - **Console**:
    - Verify: Amazon Bedrock > Guardrails > <guardrail> > Resource-based policy > the statement carries `StringEquals aws:PrincipalOrgID` = your org ID and no unconditioned `"Principal": "*"`
    - Fix: Amazon Bedrock > Guardrails > <guardrail> > Resource-based policy > Add > paste the org-scoped policy > Save
  - **CLI**:
    - Verify: `aws bedrock get-resource-policy --resource-arn <guardrail-arn> --query 'resourcePolicy'`
    - Expect: the policy allows `bedrock:ApplyGuardrail` and `bedrock:GetGuardrail` only with `aws:PrincipalOrgID` = `<org-id>`. A resource policy shared without the org condition lets any AWS account apply or read the guardrail.
    - Fix:
      ```bash
      aws bedrock put-resource-policy --resource-arn <guardrail-arn> --resource-policy '{
        "Version": "2012-10-17",
        "Statement": [{
          "Effect": "Allow",
          "Principal": "*",
          "Action": ["bedrock:ApplyGuardrail", "bedrock:GetGuardrail"],
          "Resource": "<guardrail-arn>",
          "Condition": {"StringEquals": {"aws:PrincipalOrgID": "<org-id>"}}
        }]
      }'
      ```

- [ ] **Scope the Guardrail-Profile Resource-Based Policy to Your Organization for Cross-Region Inference** - pass: `get-resource-policy` for the guardrail profile returns a policy conditioned on `aws:PrincipalOrgID` = your org ID
  - **Console**:
    - Verify: Amazon Bedrock > Guardrails > System-defined guardrail profiles > <profile> > Resource-based policy > the statement carries `StringEquals aws:PrincipalOrgID` = your org ID
    - Fix: Amazon Bedrock > Guardrails > System-defined guardrail profiles > <profile> > Resource-based policy > Add > paste the org-scoped policy > Save
  - **CLI**:
    - Verify: `aws bedrock get-resource-policy --resource-arn <guardrail-profile-arn> --query 'resourcePolicy'`
    - Expect: the policy allows `bedrock:ApplyGuardrail` only with `aws:PrincipalOrgID` = `<org-id>`. Cross-region guardrail profiles are shared resources; without the org condition any account can route its traffic through your profile.
    - Fix:
      ```bash
      aws bedrock put-resource-policy --resource-arn <guardrail-profile-arn> --resource-policy '{
        "Version": "2012-10-17",
        "Statement": [{
          "Effect": "Allow",
          "Principal": "*",
          "Action": ["bedrock:ApplyGuardrail"],
          "Resource": "<guardrail-profile-arn>",
          "Condition": {"StringEquals": {"aws:PrincipalOrgID": "<org-id>"}}
        }]
      }'
      ```

---

## Knowledge Bases (RAG)

- [ ] **Encrypt Knowledge Base Data Sources with Customer-Managed Keys** - pass: every data source reports `serverSideEncryptionConfiguration.kmsKeyArn` = your KMS key
  - **Console**:
    - Verify: Amazon Bedrock > Knowledge Bases > <knowledge-base> > Data source > <data-source> > Advanced settings > KMS key shows your key ARN
    - Fix: Amazon Bedrock > Knowledge Bases > <knowledge-base> > Data source > <data-source> > Edit > Advanced settings > Customize encryption settings > choose your key > Submit
  - **CLI**:
    - Verify:
      ```bash
      aws bedrock-agent get-data-source --knowledge-base-id <kb-id> --data-source-id <ds-id> \
        --query 'dataSource.serverSideEncryptionConfiguration.kmsKeyArn'
      ```
    - Expect: your key ARN, not `null`. Transient ingestion data is otherwise encrypted only with an AWS-owned key that your KMS policies cannot gate.
    - Fix:
      ```bash
      aws bedrock-agent update-data-source --cli-input-json "$(aws bedrock-agent get-data-source --knowledge-base-id <kb-id> --data-source-id <ds-id> --query dataSource --output json | jq '
        {knowledgeBaseId, dataSourceId, name, description, dataSourceConfiguration, dataDeletionPolicy, serverSideEncryptionConfiguration, vectorIngestionConfiguration}
        | .serverSideEncryptionConfiguration = {kmsKeyArn: "<kms-key-arn>"}')"
      ```

- [ ] **Block Public Access on Knowledge Base Data-Source Buckets** - pass: all four Block Public Access settings are `true` on every data-source bucket
  - **Console**:
    - Verify: S3 > Buckets > <bucket> > Permissions > Block public access (bucket settings) reads `On` for all four settings
    - Fix: S3 > Buckets > <bucket> > Permissions > Block public access (bucket settings) > Edit > check Block all public access > Save changes > type `confirm` > Confirm
  - **CLI**:
    - Verify: `aws s3api get-public-access-block --bucket <bucket>`
    - Expect: `BlockPublicAcls`, `IgnorePublicAcls`, `BlockPublicPolicy` and `RestrictPublicBuckets` all `true`. A public source bucket lets anyone plant documents the knowledge base will ingest and the model will cite as truth.
    - Fix:
      ```bash
      aws s3api put-public-access-block --bucket <bucket> --public-access-block-configuration \
        BlockPublicAcls=true,IgnorePublicAcls=true,BlockPublicPolicy=true,RestrictPublicBuckets=true
      ```

- [ ] **Enable Automatic Rotation on the Vector-Store Credentials Secret** - pass: `describe-secret` reports `RotationEnabled` = `true` and a customer `KmsKeyId`
  - **Console**:
    - Verify: Secrets Manager > Secrets > <secret> > Rotation configuration > Automatic rotation reads `Enabled` with a schedule of 30 days or less
    - Fix: Secrets Manager > Secrets > <secret> > Rotation > Edit rotation > turn on Automatic rotation > Schedule 30 days > Rotation function <rotation-function> > Save
  - **CLI**:
    - Verify: `aws secretsmanager describe-secret --secret-id <credentials-secret-arn> --query '[RotationEnabled,KmsKeyId]'`
    - Expect: `[true, "<kms-key-arn>"]`. A static vector-store password that never rotates outlives every engineer and pipeline that has ever read it.
    - Fix:
      ```bash
      aws secretsmanager rotate-secret --secret-id <credentials-secret-arn> \
        --rotation-lambda-arn <rotation-function-arn> --rotation-rules AutomaticallyAfterDays=30
      ```

- [ ] **Set the Data Source Deletion Policy to DELETE** - pass: every data source reports `dataDeletionPolicy` = `DELETE`
  - **Console**:
    - Verify: Amazon Bedrock > Knowledge Bases > <knowledge-base> > Data source > <data-source> > Data deletion policy reads `Delete`
    - Fix: Amazon Bedrock > Knowledge Bases > <knowledge-base> > Data source > <data-source> > Edit > Data deletion policy > `Delete` > Submit
  - **CLI**:
    - Verify:
      ```bash
      aws bedrock-agent get-data-source --knowledge-base-id <kb-id> --data-source-id <ds-id> \
        --query 'dataSource.dataDeletionPolicy'
      ```
    - Expect: `"DELETE"`. With `RETAIN`, embeddings of documents you removed from the source stay in the vector store and remain retrievable after the record was supposed to be gone.
    - Fix:
      ```bash
      aws bedrock-agent update-data-source --cli-input-json "$(aws bedrock-agent get-data-source --knowledge-base-id <kb-id> --data-source-id <ds-id> --query dataSource --output json | jq '
        {knowledgeBaseId, dataSourceId, name, description, dataSourceConfiguration, dataDeletionPolicy, serverSideEncryptionConfiguration, vectorIngestionConfiguration}
        | .dataDeletionPolicy = "DELETE"')"
      ```

- [ ] **Scope the Knowledge Base Service Role to Named Resources** - pass: the knowledge base role's trust policy conditions `bedrock.amazonaws.com` on `aws:SourceAccount` and the knowledge base ARN
  - **Console**:
    - Verify: IAM > Roles > <kb-role> > Trust relationships > the `bedrock.amazonaws.com` statement carries `StringEquals aws:SourceAccount` = your account and `ArnLike aws:SourceArn` = `arn:aws:bedrock:<region>:<account>:knowledge-base/<kb-id>`
    - Fix: IAM > Roles > <kb-role> > Trust relationships > Edit trust policy > add the `Condition` block with the knowledge base ARN > Update policy
  - **CLI**:
    - Verify: `aws iam get-role --role-name <kb-role> --query 'Role.AssumeRolePolicyDocument'`
    - Expect: the statement has both `aws:SourceAccount` and `aws:SourceArn` with the knowledge base ARN. Without the conditions a knowledge base in another account could assume the role and read your source buckets.
    - Fix:
      ```bash
      aws iam update-assume-role-policy --role-name <kb-role> --policy-document '{
        "Version": "2012-10-17",
        "Statement": [{
          "Effect": "Allow",
          "Principal": {"Service": "bedrock.amazonaws.com"},
          "Action": "sts:AssumeRole",
          "Condition": {
            "StringEquals": {"aws:SourceAccount": "<account>"},
            "ArnLike": {"aws:SourceArn": "arn:aws:bedrock:<region>:<account>:knowledge-base/<kb-id>"}
          }
        }]
      }'
      ```

- [ ] **Enable Knowledge Base Ingestion Logging** - pass: a vended-log delivery source for the knowledge base ARN exists and is linked to a CloudWatch Logs destination
  - **Console**:
    - Verify: Amazon Bedrock > Knowledge bases > <knowledge-base> > the log delivery shows status `Delivery active`
    - Fix: Amazon Bedrock > Knowledge bases > <knowledge-base> > Edit > add a log delivery > Logging destination `CloudWatch Logs` > Log group name <log-group> > save
  - **CLI**:
    - Verify:
      ```bash
      aws logs describe-delivery-sources \
        --query "deliverySources[?contains(resourceArns[0], 'knowledge-base')].[name,resourceArns[0],logType]"
      ```
    - Verify: `aws logs describe-deliveries --query 'deliveries[].[deliverySourceName,deliveryDestinationArn]'`
    - Expect: a source whose resource ARN is the knowledge base with `APPLICATION_LOGS`, and a delivery linking that source name to a destination. Without ingestion logs, poisoned or silently failed document ingestion goes unnoticed.
    - Fix:
      ```bash
      aws logs put-delivery-source --name <kb-log-source> --resource-arn <knowledge-base-arn> --log-type APPLICATION_LOGS
      ```
    - Fix:
      ```bash
      aws logs put-delivery-destination --name <kb-log-destination> \
        --delivery-destination-configuration destinationResourceArn=<log-group-arn>
      ```
    - Fix:
      ```bash
      aws logs create-delivery --delivery-source-name <kb-log-source> --delivery-destination-arn <delivery-destination-arn>
      ```

- [ ] **Set the OpenSearch Serverless Network Policy to Private with Bedrock as the Source Service** - pass: the collection's network policy has `AllowFromPublic` = `false` and `SourceServices` = `["bedrock.amazonaws.com"]`
  - **Console**:
    - Verify: Amazon OpenSearch Service > Serverless > Network policies > <policy> > Access type reads `Private` and the AWS service private access list shows `bedrock.amazonaws.com`
    - Fix: Amazon OpenSearch Service > Serverless > Network policies > <policy> > Edit > Access type `Private` > AWS service private access > add `bedrock.amazonaws.com` > Save
  - **CLI**:
    - Verify:
      ```bash
      aws opensearchserverless get-security-policy --type network --name <policy-name> \
        --query 'securityPolicyDetail.policy'
      ```
    - Expect: `"AllowFromPublic": false` and `"SourceServices": ["bedrock.amazonaws.com"]`. A public collection endpoint exposes your embeddings and source chunks to anyone who obtains a data-access token.
    - Fix:
      ```bash
      aws opensearchserverless update-security-policy --type network --name <policy-name> \
        --policy-version $(aws opensearchserverless get-security-policy --type network --name <policy-name> --query 'securityPolicyDetail.policyVersion' --output text) \
        --policy '[{
          "Rules": [{"ResourceType": "collection", "Resource": ["collection/<collection-name>"]}],
          "AllowFromPublic": false,
          "SourceServices": ["bedrock.amazonaws.com"]
        }]'
      ```

---

## Model Customization, Import & Batch

- [ ] **Protect Model Customization Jobs Using a VPC** - pass: every customization job reports a `vpcConfig` with your subnets and security group
  - **Console**:
    - Verify: Amazon Bedrock > Custom models > Jobs > <job> > VPC settings show the subnets and security group rather than `Not configured`
    - Fix: Amazon Bedrock > Custom models > Customize model > Create Fine-tuning job > VPC settings > choose the VPC, subnets and security group > Create Fine-tuning job
  - **CLI**:
    - Verify: `aws bedrock list-model-customization-jobs --query 'modelCustomizationJobSummaries[].jobArn'`
    - Verify: `aws bedrock get-model-customization-job --job-identifier <job-arn> --query 'vpcConfig'`
    - Expect: every job returns a `vpcConfig` object, not `null`. Without a VPC the job reads training data and writes outputs over the public path, outside your security groups and endpoint policies.
    - Fix:
      ```bash
      aws bedrock create-model-customization-job --job-name <job-name> --custom-model-name <model-name> \
        --role-arn <customization-role-arn> --base-model-identifier <base-model-id> \
        --training-data-config s3Uri=s3://<bucket>/<training-file> \
        --output-data-config s3Uri=s3://<bucket>/<output-prefix>/ \
        --vpc-config subnetIds=<subnet-id>,securityGroupIds=<security-group-id>
      ```

- [ ] **Run Batch Inference Jobs Inside a VPC** - pass: every batch inference job reports a `vpcConfig` with your subnets and security group
  - **CLI**:
    - Verify: `aws bedrock list-model-invocation-jobs --query 'invocationJobSummaries[*].[jobArn,vpcConfig]'`
    - Expect: every row has a `vpcConfig` object, not `null`. Batch jobs move whole datasets of prompts in and out of S3; without a VPC that traffic and its access path are unbounded.
    - Fix:
      ```bash
      aws bedrock create-model-invocation-job --job-name <job-name> --role-arn <batch-role-arn> --model-id <model-id> \
        --input-data-config s3InputDataConfig={s3Uri=s3://<bucket>/<input-prefix>/} \
        --output-data-config s3OutputDataConfig={s3Uri=s3://<bucket>/<output-prefix>/} \
        --vpc-config subnetIds=<subnet-id>,securityGroupIds=<security-group-id>
      ```

- [ ] **Protect Custom Model Import Jobs with a VPC** - pass: every import job reports a `vpcConfig` with your subnets and security group
  - **Console**:
    - Verify: Amazon Bedrock > Imported models > Jobs > <job> > VPC settings show the subnets and security group rather than `Not configured`
    - Fix: Amazon Bedrock > Imported models > Import model > VPC settings > choose the VPC, subnets and security group > Import model
  - **CLI**:
    - Verify: `aws bedrock list-model-import-jobs --query 'modelImportJobSummaries[].jobArn'`
    - Verify: `aws bedrock get-model-import-job --job-identifier <job-arn> --query 'vpcConfig'`
    - Expect: every job returns a `vpcConfig` object, not `null`. Model weights are intellectual property; without a VPC the import path is not bounded by your network controls.
    - Fix:
      ```bash
      aws bedrock create-model-import-job --job-name <job-name> --imported-model-name <model-name> \
        --role-arn <import-role-arn> --model-data-source s3DataSource={s3Uri=s3://<bucket>/<model-prefix>/} \
        --vpc-config subnetIds=<subnet-id>,securityGroupIds=<security-group-id>
      ```

- [ ] **Encrypt Custom Models with Customer-Managed Keys** - pass: every custom model reports `modelKmsKeyArn` = your KMS key
  - **Console**:
    - Verify: Amazon Bedrock > Custom models > Models > <model> > Model details > KMS key shows your key ARN rather than `AWS owned key`
    - Fix: Amazon Bedrock > Custom models > Customize model > Create Fine-tuning job > Model encryption > Customize encryption settings > choose your key > Create Fine-tuning job
  - **CLI**:
    - Verify: `aws bedrock list-custom-models --query 'modelSummaries[].modelArn'`
    - Verify: `aws bedrock get-custom-model --model-identifier <model-arn> --query 'modelKmsKeyArn'`
    - Expect: every model returns your key ARN, not `null`. Custom weights embody your training data; under an AWS-owned key there is no KMS gate on who can copy or invoke them.
    - Fix:
      ```bash
      aws bedrock create-model-customization-job --job-name <job-name> --custom-model-name <model-name> \
        --role-arn <customization-role-arn> --base-model-identifier <base-model-id> \
        --training-data-config s3Uri=s3://<bucket>/<training-file> \
        --output-data-config s3Uri=s3://<bucket>/<output-prefix>/ \
        --custom-model-kms-key-id <kms-key-arn>
      ```

- [ ] **Encrypt Imported Models with a Customer-Managed Key** - pass: every imported model reports `modelKmsKeyArn` = your KMS key
  - **Console**:
    - Verify: Amazon Bedrock > Imported models > Models > <model> > Model details > KMS key shows your key ARN rather than `AWS owned key`
    - Fix: Amazon Bedrock > Imported models > Import model > Model encryption > Customize encryption settings > choose your key > Import model
  - **CLI**:
    - Verify: `aws bedrock list-imported-models --query 'modelSummaries[].modelArn'`
    - Verify: `aws bedrock get-imported-model --model-identifier <model-arn> --query 'modelKmsKeyArn'`
    - Expect: every model returns your key ARN, not `null`. Imported weights are stored by Bedrock; a customer key is the only way to revoke access to them from your side.
    - Fix:
      ```bash
      aws bedrock create-model-import-job --job-name <job-name> --imported-model-name <model-name> \
        --role-arn <import-role-arn> --model-data-source s3DataSource={s3Uri=s3://<bucket>/<model-prefix>/} \
        --imported-model-kms-key-id <kms-key-arn>
      ```

- [ ] **Scope Cross-Account Import Buckets to the Import Role** - pass: the model bucket's policy grants `s3:GetObject` and `s3:ListBucket` only to the import role in the model account
  - **Console**:
    - Verify: S3 > Buckets > <bucket> > Permissions > Bucket policy > the only cross-account `Allow` names `arn:aws:iam::<model-account>:role/<import-role>` as Principal and no wildcard principal
    - Fix: S3 > Buckets > <bucket> > Permissions > Bucket policy > Edit > paste the policy naming only the import role > Save changes
  - **CLI**:
    - Verify: `aws s3api get-bucket-policy --bucket <bucket> --query Policy --output text`
    - Expect: a single `Allow` for the import role ARN on `s3:GetObject` and `s3:ListBucket`; no `"Principal": "*"` or `"AWS": "*"`. A broader grant exposes the model weights to every principal in the other account.
    - Fix:
      ```bash
      aws s3api put-bucket-policy --bucket <bucket> --policy '{
        "Version": "2012-10-17",
        "Statement": [{
          "Effect": "Allow",
          "Principal": {"AWS": "arn:aws:iam::<model-account>:role/<import-role>"},
          "Action": ["s3:GetObject", "s3:ListBucket"],
          "Resource": ["arn:aws:s3:::<bucket>", "arn:aws:s3:::<bucket>/*"]
        }]
      }'
      ```

---

## Tools: Web Search

- [ ] **Deny External Web Access for Web Search Org-Wide** - pass: an SCP denies `bedrock-websearch:ExternalWebAccess` to every principal except the approved web-search role
  - **Console**:
    - Verify: AWS Organizations > Policies > Service control policies > `DenyBedrockWebSearchExternalAccess` > Content shows the `Deny` on `bedrock-websearch:ExternalWebAccess` with `ArnNotLike aws:PrincipalArn` naming only the approved role, and Targets lists the root or OU
    - Fix: AWS Organizations > Policies > Service control policies > Create policy > Policy name `DenyBedrockWebSearchExternalAccess` > JSON editor > paste the deny statement > Create policy; then select the policy > Targets > Attach > choose the root or OU > Attach policy
  - **CLI**:
    - Verify:
      ```bash
      aws organizations list-policies-for-target --target-id <root-or-ou-id> --filter SERVICE_CONTROL_POLICY \
        --query 'Policies[].[Name,Id]' --output table
      ```
    - Verify: `aws organizations describe-policy --policy-id <scp-id> --query 'Policy.Content' --output text`
    - Expect: `DenyBedrockWebSearchExternalAccess` is listed for the target and its content names only `<approved-web-search-role>` in `ArnNotLike`. Without it any model call can fetch arbitrary web content, which is the classic indirect prompt-injection channel.
    - Fix:
      ```bash
      aws organizations create-policy --type SERVICE_CONTROL_POLICY --name DenyBedrockWebSearchExternalAccess \
        --description "Web Search may not reach the external web except for approved roles" \
        --query 'Policy.PolicySummary.Id' --output text --content '{
          "Version": "2012-10-17",
          "Statement": [{
            "Effect": "Deny",
            "Action": "bedrock-websearch:ExternalWebAccess",
            "Resource": "*",
            "Condition": {"ArnNotLike": {"aws:PrincipalArn": ["arn:aws:iam::*:role/<approved-web-search-role>"]}}
          }]
        }'
      ```
    - Fix: `aws organizations attach-policy --target-id <root-or-ou-id> --policy-id <scp-id>`

- [ ] **Restrict Web Search to Approved Regions** - pass: `bedrock-websearch:*` is denied whenever `aws:RequestedRegion` is outside the approved list
  - **Console**:
    - Verify: IAM > Roles > <web-search-role> > Permissions > `BedrockWebSearchApprovedRegions` > JSON > a `Deny` on `bedrock-websearch:*` with `StringNotEquals aws:RequestedRegion` listing only approved regions
    - Fix: IAM > Roles > <web-search-role> > Permissions > Add permissions > Create inline policy > JSON > paste the deny statement with the approved regions > Next > Policy name `BedrockWebSearchApprovedRegions` > Create policy
  - **CLI**:
    - Verify:
      ```bash
      aws iam simulate-principal-policy --policy-source-arn <role-arn> --action-names bedrock-websearch:ExternalWebAccess \
        --context-entries ContextKeyName=aws:RequestedRegion,ContextKeyValues=<unapproved-region>,ContextKeyType=string \
        --query 'EvaluationResults[*].EvalDecision'
      ```
    - Expect: `explicitDeny`. Web search from an unapproved region routes fetched content and the prompts around it through infrastructure outside your residency boundary.
    - Fix:
      ```bash
      aws iam put-role-policy --role-name <web-search-role> --policy-name BedrockWebSearchApprovedRegions --policy-document '{
        "Version": "2012-10-17",
        "Statement": [{
          "Effect": "Deny",
          "Action": "bedrock-websearch:*",
          "Resource": "*",
          "Condition": {"StringNotEquals": {"aws:RequestedRegion": ["<approved-region>"]}}
        }]
      }'
      ```

- [ ] **Log Web Search Data Events to Catch Denied Fetches** - pass: the trail's advanced event selectors include Data events for `AWS::Bedrock::Tool`
  - **Console**:
    - Verify: CloudTrail > Trails > <trail> > Data events > the list shows resource type `Bedrock Tool` with `Log all events`
    - Fix: CloudTrail > Trails > <trail> > Data events > Edit > Add data event type > Resource type `Bedrock Tool` > Log selector template `Log all events` > Save changes
  - **CLI**:
    - Verify:
      ```bash
      aws cloudtrail get-event-selectors --trail-name <trail> \
        --query 'AdvancedEventSelectors[].FieldSelectors[?Field==`resources.type`].Equals[]'
      ```
    - Expect: the output includes `AWS::Bedrock::Tool`. Without it a denied external fetch leaves no trace, so you never learn which prompts tried to reach the web.
    - Fix:
      ```bash
      aws cloudtrail put-event-selectors --trail-name <trail> --advanced-event-selectors "$(
        aws cloudtrail get-event-selectors --trail-name <trail> --query 'AdvancedEventSelectors' --output json | jq '
          (. // []) + [
            {"FieldSelectors": [{"Field": "eventCategory", "Equals": ["Management"]}]},
            {"FieldSelectors": [{"Field": "eventCategory", "Equals": ["Data"]}, {"Field": "resources.type", "Equals": ["AWS::Bedrock::Tool"]}]}
          ] | unique')"
      ```

---

## Agents Classic (Existing Accounts Only)

- [ ] **Associate a Guardrail with Every Agent** - pass: every agent's `guardrailConfiguration` names a guardrail identifier and version
  - **Console**:
    - Verify: Amazon Bedrock > Agents > <agent> > Guardrail details show a guardrail name and version rather than `None`
    - Fix: Amazon Bedrock > Agents > <agent> > Edit in Agent Builder > Guardrail details > Edit > select the guardrail and version > Save > Save and exit > Prepare
  - **CLI**:
    - Verify:
      ```bash
      for id in $(aws bedrock-agent list-agents --query 'agentSummaries[].agentId' --output text); do
        aws bedrock-agent get-agent --agent-id $id --query 'agent.[agentName,guardrailConfiguration.guardrailIdentifier]' --output text
      done
      ```
    - Expect: every row shows a guardrail identifier, never `None`. An agent without a guardrail passes raw user input to the model and its tools with nothing screening for injection.
    - Fix:
      ```bash
      aws bedrock-agent update-agent --cli-input-json "$(aws bedrock-agent get-agent --agent-id <id> --query agent --output json | jq '
        {agentId, agentName, foundationModel, agentResourceRoleArn, instruction, description, orchestrationType, customOrchestration,
         idleSessionTTLInSeconds, customerEncryptionKeyArn, promptOverrideConfiguration, guardrailConfiguration, memoryConfiguration, agentCollaboration}
        | .guardrailConfiguration = {guardrailIdentifier: "<guardrail-id>", guardrailVersion: "<version>"}')"
      ```

- [ ] **Configure the Agent Idle Session Timeout** - pass: every agent's `idleSessionTTLInSeconds` is at or below your policy value
  - **Console**:
    - Verify: Amazon Bedrock > Agents > <agent> > Agent details > Idle session timeout reads a value at or below the policy value
    - Fix: Amazon Bedrock > Agents > <agent> > Edit in Agent Builder > Additional settings > Idle session timeout > set the value > Save and exit > Prepare
  - **CLI**:
    - Verify: `aws bedrock-agent get-agent --agent-id <id> --query 'agent.idleSessionTTLInSeconds'`
    - Expect: a number at or below the policy value (the default is `1800`, 30 minutes). A long timeout keeps conversation state, including retrieved documents and tool outputs, resumable by anyone who obtains the session ID.
    - Fix:
      ```bash
      aws bedrock-agent update-agent --cli-input-json "$(aws bedrock-agent get-agent --agent-id <id> --query agent --output json | jq --arg ttl <seconds> '
        {agentId, agentName, foundationModel, agentResourceRoleArn, instruction, description, orchestrationType, customOrchestration,
         idleSessionTTLInSeconds, customerEncryptionKeyArn, promptOverrideConfiguration, guardrailConfiguration, memoryConfiguration, agentCollaboration}
        | .idleSessionTTLInSeconds = ($ttl | tonumber)')"
      ```

- [ ] **Grant the Action-Group Lambda Invoke Permission to Its Agent Only** - pass: the function's resource policy statement for `bedrock.amazonaws.com` carries `aws:SourceAccount` and `aws:SourceArn` = the agent ARN
  - **Console**:
    - Verify: Lambda > Functions > <function> > Configuration > Permissions > Resource-based policy statements > `AllowBedrockAgent` > Conditions show `SourceAccount` = your account and `SourceArn` = `arn:aws:bedrock:<region>:<account>:agent/<id>`
    - Fix: Lambda > Functions > <function> > Configuration > Permissions > Resource-based policy statements > Edit > add the `bedrock.amazonaws.com` statement (Sid `AllowBedrockAgent`) with `aws:SourceAccount` = your account and `aws:SourceArn` = the agent ARN > Save
  - **CLI**:
    - Verify:
      ```bash
      aws lambda get-policy --function-name <function> --query Policy --output text | \
        jq '.Statement[] | select(.Principal.Service=="bedrock.amazonaws.com") | .Condition'
      ```
    - Expect: a `Condition` with `StringEquals AWS:SourceAccount` and `ArnLike AWS:SourceArn` naming the agent ARN. Without them any Bedrock agent in any account can invoke your function with attacker-chosen arguments.
    - Fix:
      ```bash
      aws lambda add-permission --function-name <function> --statement-id AllowBedrockAgent \
        --action lambda:InvokeFunction --principal bedrock.amazonaws.com --source-account <account> \
        --source-arn arn:aws:bedrock:<region>:<account>:agent/<id>
      ```

- [ ] **Enable the Pre-Processing Step** - pass: the `PRE_PROCESSING` prompt configuration reports `promptState` = `ENABLED`
  - **Console**:
    - Verify: Amazon Bedrock > Agents > <agent> > Working draft > Orchestration strategy > Edit > Pre-processing > `Activate template` is on
    - Fix: Amazon Bedrock > Agents > <agent> > Working draft > Orchestration strategy > Edit > Pre-processing > turn on `Activate template` > Save and exit > Prepare
  - **CLI**:
    - Verify:
      ```bash
      aws bedrock-agent get-agent --agent-id <id> \
        --query "agent.promptOverrideConfiguration.promptConfigurations[?promptType=='PRE_PROCESSING'].promptState"
      ```
    - Expect: `["ENABLED"]`. Pre-processing is the step that classifies malicious or out-of-scope input before orchestration; disabled, every prompt goes straight to tool selection.
    - Fix:
      ```bash
      aws bedrock-agent update-agent --cli-input-json "$(aws bedrock-agent get-agent --agent-id <id> --query agent --output json | jq '
        {agentId, agentName, foundationModel, agentResourceRoleArn, instruction, description, orchestrationType, customOrchestration,
         idleSessionTTLInSeconds, customerEncryptionKeyArn, promptOverrideConfiguration, guardrailConfiguration, memoryConfiguration, agentCollaboration}
        | .promptOverrideConfiguration.promptConfigurations |= ((. // []) | map(select(.promptType != "PRE_PROCESSING"))
            + [{promptType: "PRE_PROCESSING", promptState: "ENABLED", promptCreationMode: "DEFAULT"}])')"
      ```

- [ ] **Encrypt Agent Resources with a Customer-Managed Key on Agents Created After January 22, 2025** - pass: every agent created after that date reports `customerEncryptionKeyArn` = your KMS key
  - **Console**:
    - Verify: Amazon Bedrock > Agents > <agent> > Agent details > KMS key shows your key ARN rather than `AWS owned key`
    - Fix: Amazon Bedrock > Agents > <agent> > Edit in Agent Builder > Additional settings > KMS key selection > Customize encryption settings > choose your key > Save and exit > Prepare
  - **CLI**:
    - Verify: `aws bedrock-agent get-agent --agent-id <id> --query 'agent.[createdAt,customerEncryptionKeyArn]'`
    - Expect: your key ARN for every agent created after 2025-01-22, not `null`. Agent resources hold instructions, prompt overrides and session data; a customer key gates who can read them.
    - Fix:
      ```bash
      aws bedrock-agent update-agent --cli-input-json "$(aws bedrock-agent get-agent --agent-id <id> --query agent --output json | jq '
        {agentId, agentName, foundationModel, agentResourceRoleArn, instruction, description, orchestrationType, customOrchestration,
         idleSessionTTLInSeconds, customerEncryptionKeyArn, promptOverrideConfiguration, guardrailConfiguration, memoryConfiguration, agentCollaboration}
        | .customerEncryptionKeyArn = "<kms-key-arn>"')"
      ```

- [ ] **Restrict the Agent Service-Role Trust to Its Agent ARN and Your Account** - pass: the agent role's trust policy conditions `bedrock.amazonaws.com` on `aws:SourceAccount` and the agent ARN
  - **Console**:
    - Verify: IAM > Roles > <agent-role> > Trust relationships > the `bedrock.amazonaws.com` statement carries `StringEquals aws:SourceAccount` = your account and `ArnLike aws:SourceArn` = `arn:aws:bedrock:<region>:<account>:agent/<id>`
    - Fix: IAM > Roles > <agent-role> > Trust relationships > Edit trust policy > add the `Condition` block with the agent ARN > Update policy
  - **CLI**:
    - Verify: `aws iam get-role --role-name <agent-role> --query 'Role.AssumeRolePolicyDocument.Statement[].Condition'`
    - Expect: a non-empty `Condition` with both keys and the agent ARN. Without it an agent in another account can assume the role and reach your knowledge bases and Lambdas.
    - Fix:
      ```bash
      aws iam update-assume-role-policy --role-name <agent-role> --policy-document '{
        "Version": "2012-10-17",
        "Statement": [{
          "Effect": "Allow",
          "Principal": {"Service": "bedrock.amazonaws.com"},
          "Action": "sts:AssumeRole",
          "Condition": {
            "StringEquals": {"aws:SourceAccount": "<account>"},
            "ArnLike": {"aws:SourceArn": "arn:aws:bedrock:<region>:<account>:agent/<id>"}
          }
        }]
      }'
      ```

- [ ] **Publish the Checked Draft as a Numbered Version Behind a New Alias** - pass: every production alias routes to a numbered version whose guardrail, timeout, KMS key and role match the checked draft
  - **Console**:
    - Verify: Amazon Bedrock > Agents > <agent> > Aliases > each production alias shows a numbered version in the Version column, and that version's details match the draft you checked
    - Fix: Amazon Bedrock > Agents > <agent> > Prepare > Aliases > Create > Alias name > `Create a new version and associate it to this alias` > Description > Create alias
  - **CLI**:
    - Verify:
      ```bash
      aws bedrock-agent list-agent-aliases --agent-id <id> \
        --query 'agentAliasSummaries[].[agentAliasName,routingConfiguration[0].agentVersion]' --output table
      ```
    - Verify:
      ```bash
      aws bedrock-agent get-agent-version --agent-id <id> \
        --agent-version $(aws bedrock-agent get-agent-alias --agent-id <id> --agent-alias-id <alias-id> --query 'agentAlias.routingConfiguration[0].agentVersion' --output text) \
        --query 'agentVersion.[guardrailConfiguration,idleSessionTTLInSeconds,customerEncryptionKeyArn,agentResourceRoleArn]'
      ```
    - Expect: every production alias maps to a numeric version and the version's guardrail, TTL, KMS key and role equal the values you verified on the draft. Callers on the test alias run whatever the draft says right now, with no release gate.
    - Fix: `aws bedrock-agent prepare-agent --agent-id <id>`
    - Fix:
      ```bash
      aws bedrock-agent create-agent-alias --agent-id <id> --agent-alias-name <alias-name> \
        --description "<what this release was checked against>"
      ```

- [ ] **Require Confirmation on Action-Group Functions That Change State** - pass: every state-changing function in `functionSchema.functions` reports `requireConfirmation` = `ENABLED`
  - **Console**:
    - Verify: Amazon Bedrock > Agents > <agent> > Action groups > <action-group> > Action group function <function> > Require confirmation reads `Enabled` for every function that writes or sends
    - Fix: Amazon Bedrock > Agents > <agent> > Action groups > <action-group> > Edit > Action group function <function> > Require confirmation `Enabled` > Save and exit > Prepare
  - **CLI**:
    - Verify:
      ```bash
      aws bedrock-agent get-agent-action-group --agent-id <id> --agent-version DRAFT --action-group-id <ag-id> \
        --query 'agentActionGroup.functionSchema.functions[*].[name,requireConfirmation]' --output table
      ```
    - Expect: `ENABLED` on every function that changes state. Without confirmation a single injected instruction can make the agent send, pay or delete on the user's behalf.
    - Fix:
      ```bash
      aws bedrock-agent update-agent-action-group --cli-input-json "$(aws bedrock-agent get-agent-action-group --agent-id <id> --agent-version DRAFT --action-group-id <ag-id> --query agentActionGroup --output json | jq --arg fn <function-name> '
        {agentId, agentVersion, actionGroupId, actionGroupName, description, parentActionGroupSignature: .parentActionSignature,
         parentActionGroupSignatureParams, actionGroupExecutor, actionGroupState, apiSchema, functionSchema}
        | .functionSchema.functions |= map(if .name == $fn then .requireConfirmation = "ENABLED" else . end)')"
      ```

- [ ] **Disable Code Interpreter and Computer-Use Action Groups Unless Designed** - pass: every action group with an `AMAZON.CodeInterpreter` or `ANTHROPIC.*` parent signature is `DISABLED` on agents not designed for it
  - **Console**:
    - Verify: Amazon Bedrock > Agents > <agent> > Action groups > any `Code Interpreter` or computer-use group shows State `Disabled` unless the agent was designed to use it
    - Fix: Amazon Bedrock > Agents > <agent> > Action groups > <action-group> > Edit > Action group status `Disabled` > Save and exit > Prepare
  - **CLI**:
    - Verify:
      ```bash
      for g in $(aws bedrock-agent list-agent-action-groups --agent-id <id> --agent-version DRAFT --query 'actionGroupSummaries[].actionGroupId' --output text); do
        aws bedrock-agent get-agent-action-group --agent-id <id> --agent-version DRAFT --action-group-id $g \
          --query 'agentActionGroup.[actionGroupName,parentActionSignature,actionGroupState]' --output text
      done
      ```
    - Expect: every row with `AMAZON.CodeInterpreter`, `ANTHROPIC.Computer`, `ANTHROPIC.Bash` or `ANTHROPIC.TextEditor` reads `DISABLED`. These groups give the model code execution or a desktop; an injected prompt turns them into an attacker's shell.
    - Fix:
      ```bash
      aws bedrock-agent update-agent-action-group --cli-input-json "$(aws bedrock-agent get-agent-action-group --agent-id <id> --agent-version DRAFT --action-group-id <ag-id> --query agentActionGroup --output json | jq '
        {agentId, agentVersion, actionGroupId, actionGroupName, description, parentActionGroupSignature: .parentActionSignature,
         parentActionGroupSignatureParams, actionGroupExecutor, actionGroupState, apiSchema, functionSchema}
        | .actionGroupState = "DISABLED"')"
      ```

- [ ] **Limit Agent Memory Retention** - pass: on every agent with memory enabled, `memoryConfiguration.storageDays` is at or below your policy value
  - **Console**:
    - Verify: Amazon Bedrock > Agents > <agent> > Edit in Agent Builder > Memory > Memory duration reads a value at or below the policy value, or Enable session summarization is not `Enabled`
    - Fix: Amazon Bedrock > Agents > <agent> > Edit in Agent Builder > Memory > Memory duration > enter the days > Save > Prepare
  - **CLI**:
    - Verify: `aws bedrock-agent get-agent --agent-id <id> --query 'agent.memoryConfiguration.[enabledMemoryTypes,storageDays]'`
    - Expect: `storageDays` at or below the policy value whenever `enabledMemoryTypes` is non-empty. Long-term memory stores summaries of every past session per user; the longer it lives, the more a leaked memory ID reveals.
    - Fix:
      ```bash
      aws bedrock-agent update-agent --cli-input-json "$(aws bedrock-agent get-agent --agent-id <id> --query agent --output json | jq --arg days <days> '
        {agentId, agentName, foundationModel, agentResourceRoleArn, instruction, description, orchestrationType, customOrchestration,
         idleSessionTTLInSeconds, customerEncryptionKeyArn, promptOverrideConfiguration, guardrailConfiguration, memoryConfiguration, agentCollaboration}
        | if .memoryConfiguration then .memoryConfiguration.storageDays = ($days | tonumber) else . end')"
      ```

- [ ] **Grant the Custom Orchestration Lambda Invoke Permission to Its Agent Only** - pass: the orchestration function's resource policy allows `bedrock.amazonaws.com` only with `aws:SourceArn` = the agent ARN
  - **Console**:
    - Verify: Amazon Bedrock > Agents > <agent> > Orchestration strategy shows the custom orchestration Lambda; then Lambda > Functions > <orchestration-function> > Configuration > Permissions > Resource-based policy statements > `AllowBedrockAgentOrchestration` > Conditions show `SourceAccount` = your account and `SourceArn` = the agent ARN
    - Fix: Lambda > Functions > <orchestration-function> > Configuration > Permissions > Resource-based policy statements > Edit > add the `bedrock.amazonaws.com` statement (Sid `AllowBedrockAgentOrchestration`) with `aws:SourceAccount` = your account and `aws:SourceArn` = the agent ARN > Save
  - **CLI**:
    - Verify: `aws bedrock-agent get-agent --agent-id <id> --query 'agent.[orchestrationType,customOrchestration.executor.lambda]'`
    - Verify:
      ```bash
      aws lambda get-policy --function-name <orchestration-function> --query Policy --output text | \
        jq '.Statement[] | select(.Principal.Service=="bedrock.amazonaws.com") | .Condition'
      ```
    - Expect: `CUSTOM_ORCHESTRATION` with the function ARN, and the function's statement condition names your account and the agent ARN. The orchestration Lambda decides which tools run; an open invoke permission lets a foreign agent drive it.
    - Fix:
      ```bash
      aws lambda add-permission --function-name <orchestration-function> --statement-id AllowBedrockAgentOrchestration \
        --action lambda:InvokeFunction --principal bedrock.amazonaws.com --source-account <account> \
        --source-arn arn:aws:bedrock:<region>:<account>:agent/<id>
      ```

- [ ] **Disable Multi-Agent Collaboration on Agents That Are Not Designed Supervisors** - pass: `agentCollaboration` = `DISABLED` on every agent that is not a documented supervisor
  - **Console**:
    - Verify: Amazon Bedrock > Agents > <agent> > Multi-agent collaboration reads `Disabled` unless the agent is a documented supervisor
    - Fix: Amazon Bedrock > Agents > <agent> > Edit in Agent Builder > Multi-agent collaboration > Edit > turn off > Save > Save and exit > Prepare
  - **CLI**:
    - Verify: `aws bedrock-agent get-agent --agent-id <id> --query 'agent.agentCollaboration'`
    - Expect: `"DISABLED"` for every non-supervisor agent. An agent left as a supervisor can be wired to delegate to collaborators whose tools and data it was never meant to reach.
    - Fix:
      ```bash
      aws bedrock-agent update-agent --cli-input-json "$(aws bedrock-agent get-agent --agent-id <id> --query agent --output json | jq '
        {agentId, agentName, foundationModel, agentResourceRoleArn, instruction, description, orchestrationType, customOrchestration,
         idleSessionTTLInSeconds, customerEncryptionKeyArn, promptOverrideConfiguration, guardrailConfiguration, memoryConfiguration, agentCollaboration}
        | .agentCollaboration = "DISABLED"')"
      ```

- [ ] **Detach Broad Managed Policies from the Action-Group Lambda Execution Role** - pass: the function's execution role has no `AdministratorAccess`, `PowerUserAccess` or `*FullAccess` policy attached
  - **Console**:
    - Verify: Lambda > Functions > <function> > Configuration > Permissions > Execution role > open the role > Permissions policies list only the function's scoped policy and `AWSLambdaBasicExecutionRole`
    - Fix: IAM > Roles > <lambda-role> > Permissions > select the broad managed policy > Remove > Remove
  - **CLI**:
    - Verify:
      ```bash
      aws iam list-attached-role-policies \
        --role-name $(aws lambda get-function-configuration --function-name <function> --query 'Role' --output text | sed 's|.*/||') \
        --query 'AttachedPolicies[*].PolicyArn'
      ```
    - Expect: no ARN ending in `AdministratorAccess`, `PowerUserAccess` or `FullAccess`. The model chooses this function's inputs, so every excess permission on the role is reachable through prompt injection.
    - Fix:
      ```bash
      aws iam detach-role-policy \
        --role-name $(aws lambda get-function-configuration --function-name <function> --query 'Role' --output text | sed 's|.*/||') \
        --policy-arn <broad-policy-arn>
      ```

- [ ] **Assign a Dedicated Service Role to Each Agent** - pass: no two agents in the region share the same `agentResourceRoleArn`
  - **Console**:
    - Verify: Amazon Bedrock > Agents > open each agent > Agent details > Agent resource role is different for every agent
    - Fix: IAM > Roles > Create role > AWS service > Bedrock > Agents > attach only that agent's policies > Create role; then Amazon Bedrock > Agents > <agent> > Edit in Agent Builder > Agent resource role > select the new role > Save and exit > Prepare
  - **CLI**:
    - Verify:
      ```bash
      for id in $(aws bedrock-agent list-agents --query 'agentSummaries[].agentId' --output text); do
        aws bedrock-agent get-agent --agent-id $id --query 'agent.agentResourceRoleArn' --output text
      done | sort | uniq -d
      ```
    - Expect: no output. A shared role lets a compromised agent reach every other agent's knowledge bases and action groups.
    - Fix:
      ```bash
      aws bedrock-agent update-agent --cli-input-json "$(aws bedrock-agent get-agent --agent-id <id> --query agent --output json | jq '
        {agentId, agentName, foundationModel, agentResourceRoleArn, instruction, description, orchestrationType, customOrchestration,
         idleSessionTTLInSeconds, customerEncryptionKeyArn, promptOverrideConfiguration, guardrailConfiguration, memoryConfiguration, agentCollaboration}
        | .agentResourceRoleArn = "<dedicated-agent-role-arn>"')"
      ```

---

## AgentCore

- [ ] **Set AgentCore Runtimes to VPC Network Mode** - pass: every agent runtime reports `networkConfiguration.networkMode` = `VPC`
  - **Console**:
    - Verify: Amazon Bedrock AgentCore > Runtime > <runtime> > Network configuration reads `VPC` with subnets and a security group rather than `Public`
    - Fix: Amazon Bedrock AgentCore > Runtime > <runtime> > Edit > Network configuration > `VPC` > choose the subnets and security group > Save
  - **CLI**:
    - Verify: `aws bedrock-agentcore-control list-agent-runtimes --query 'agentRuntimes[].agentRuntimeId'`
    - Verify: `aws bedrock-agentcore-control get-agent-runtime --agent-runtime-id <id> --query 'networkConfiguration.networkMode'`
    - Expect: `"VPC"` for every runtime. In `PUBLIC` mode the agent's code can reach any internet host, so an injected instruction can exfiltrate whatever the runtime holds.
    - Fix:
      ```bash
      aws bedrock-agentcore-control update-agent-runtime --cli-input-json "$(aws bedrock-agentcore-control get-agent-runtime --agent-runtime-id <id> --output json | jq '
        {agentRuntimeId, agentRuntimeArtifact, roleArn, networkConfiguration, description, authorizerConfiguration, requestHeaderConfiguration,
         protocolConfiguration, lifecycleConfiguration, metadataConfiguration, environmentVariables, filesystemConfigurations}
        | .networkConfiguration = {networkMode: "VPC", networkModeConfig: {subnets: ["<subnet-id>"], securityGroups: ["<security-group-id>"]}}')"
      ```

- [ ] **Set AWS_IAM or CUSTOM_JWT Inbound Authorization on Every AgentCore Gateway** - pass: every gateway reports `authorizerType` = `AWS_IAM` or `CUSTOM_JWT`, never `NONE`
  - **Console**:
    - Verify: Amazon Bedrock AgentCore > Gateways > <gateway> > Inbound Auth configurations shows an identity provider configuration (Discovery URL, Allowed audiences, Allowed clients)
    - Fix: Amazon Bedrock AgentCore > Gateways > Create gateway > Inbound Auth configurations > Use existing identity provider configurations > Discovery URL, Allowed audiences, Allowed clients > Create gateway
  - **CLI**:
    - Verify: `aws bedrock-agentcore-control list-gateways --query 'items[].gatewayId'`
    - Verify: `aws bedrock-agentcore-control get-gateway --gateway-identifier <id> --query '[authorizerType,authorizerConfiguration]'`
    - Expect: `AWS_IAM` or `CUSTOM_JWT` with a populated configuration for every gateway. An unauthenticated gateway exposes every tool behind it to anyone who finds the endpoint.
    - Fix:
      ```bash
      aws bedrock-agentcore-control update-gateway --cli-input-json "$(aws bedrock-agentcore-control get-gateway --gateway-identifier <id> --output json | jq '
        {gatewayIdentifier: .gatewayId, name, description, roleArn, protocolType, protocolConfiguration, authorizerType, authorizerConfiguration,
         kmsKeyArn, customTransformConfiguration, interceptorConfigurations, policyEngineConfiguration, exceptionLevel, wafConfiguration}
        | .authorizerType = "AWS_IAM" | del(.authorizerConfiguration)')"
      ```

- [ ] **Encrypt AgentCore Memory and Gateways with Customer-Managed Keys** - pass: every memory reports `encryptionKeyArn` and every gateway reports `kmsKeyArn` = your KMS key
  - **Console**:
    - Verify: Amazon Bedrock AgentCore > Memory > <memory> > Encryption shows your key ARN; then Amazon Bedrock AgentCore > Gateways > <gateway> > Encryption shows your key ARN
    - Fix: Amazon Bedrock AgentCore > Memory > Create memory > Additional configurations > KMS key > Customize encryption settings (advanced) > choose your key > Create memory (memory keys are set at creation); then Amazon Bedrock AgentCore > Gateways > Create gateway > KMS key > Customize encryption settings (advanced) > choose your key > Create gateway
  - **CLI**:
    - Verify: `aws bedrock-agentcore-control get-memory --memory-id <id> --query 'memory.encryptionKeyArn'`
    - Verify: `aws bedrock-agentcore-control get-gateway --gateway-identifier <id> --query 'kmsKeyArn'`
    - Expect: your key ARN from both, not `null`. Memory stores every past interaction per user and gateways hold tool credentials; without a customer key your KMS policies gate none of it.
    - Fix:
      ```bash
      aws bedrock-agentcore-control create-memory --name <memory-name> --event-expiry-duration <days> --encryption-key-arn <kms-key-arn>
      ```
    - Fix:
      ```bash
      aws bedrock-agentcore-control update-gateway --cli-input-json "$(aws bedrock-agentcore-control get-gateway --gateway-identifier <id> --output json | jq '
        {gatewayIdentifier: .gatewayId, name, description, roleArn, protocolType, protocolConfiguration, authorizerType, authorizerConfiguration,
         kmsKeyArn, customTransformConfiguration, interceptorConfigurations, policyEngineConfiguration, exceptionLevel, wafConfiguration}
        | .kmsKeyArn = "<kms-key-arn>"')"
      ```

- [ ] **Create Custom Browsers and Code Interpreters in VPC Network Mode, with Browser Session Recording** - pass: every custom browser and code interpreter reports `networkMode` = `VPC`, and every browser reports `recording.enabled` = `true`
  - **Console**:
    - Verify: Amazon Bedrock AgentCore > Built-in tools > Browser > <browser> > Network mode reads `VPC` and Session recording reads `Enabled`; then Built-in tools > Code Interpreter > <interpreter> > Network mode reads `VPC`
    - Fix: Amazon Bedrock AgentCore > Built-in tools > Create browser tool > Network settings > `VPC` > subnets and security group > Session recording > enable recording to an S3 bucket and prefix > Create; then Built-in tools > Code Interpreter > Create Code Interpreter > Network configuration > `VPC` > subnets and security group > Create (network mode is set at creation, so recreate and delete the old tool)
  - **CLI**:
    - Verify: `aws bedrock-agentcore-control get-browser --browser-id <id> --query '[networkConfiguration.networkMode,recording.enabled]'`
    - Verify: `aws bedrock-agentcore-control get-code-interpreter --code-interpreter-id <id> --query 'networkConfiguration.networkMode'`
    - Expect: `["VPC", true]` for every browser and `"VPC"` for every code interpreter. A public-mode browser or sandbox is an internet-connected machine the model controls, and without recording there is no replay of what it did.
    - Fix:
      ```bash
      aws bedrock-agentcore-control create-browser --name <browser-name> \
        --network-configuration networkMode=VPC,vpcConfig={subnets=[<subnet-id>],securityGroups=[<security-group-id>]} \
        --recording enabled=true,s3Location={bucket=<bucket>,prefix=<prefix>}
      ```
    - Fix:
      ```bash
      aws bedrock-agentcore-control create-code-interpreter --name <interpreter-name> \
        --network-configuration networkMode=VPC,vpcConfig={subnets=[<subnet-id>],securityGroups=[<security-group-id>]}
      ```

- [ ] **Require MMDSv2 on Every Runtime and Deny User-Id Delegation Where Unneeded** - pass: every runtime reports `metadataConfiguration.requireMMDSV2` = `true`, and `bedrock-agentcore:InvokeAgentRuntimeForUser` is `explicitDeny` for caller roles that do not need delegation
  - **Console**:
    - Verify: IAM > Roles > <caller-role> > Permissions > `DenyAgentCoreUserIdDelegation` > JSON > a `Deny` on `bedrock-agentcore:InvokeAgentRuntimeForUser`
    - Fix: IAM > Roles > <caller-role> > Permissions > Add permissions > Create inline policy > JSON > paste the deny statement > Next > Policy name `DenyAgentCoreUserIdDelegation` > Create policy
  - **CLI**:
    - Verify: `aws bedrock-agentcore-control get-agent-runtime --agent-runtime-id <id> --query 'metadataConfiguration.requireMMDSV2'`
    - Verify:
      ```bash
      aws iam simulate-principal-policy --policy-source-arn <role-arn> --action-names bedrock-agentcore:InvokeAgentRuntimeForUser \
        --resource-arns <runtime-arn> --query 'EvaluationResults[*].EvalDecision'
      ```
    - Expect: `true` and `explicitDeny`. MMDSv1 lets a server-side request forgery inside the runtime read the instance credentials, and user-id delegation lets a caller act as any user it names.
    - Fix:
      ```bash
      aws bedrock-agentcore-control update-agent-runtime --cli-input-json "$(aws bedrock-agentcore-control get-agent-runtime --agent-runtime-id <id> --output json | jq '
        {agentRuntimeId, agentRuntimeArtifact, roleArn, networkConfiguration, description, authorizerConfiguration, requestHeaderConfiguration,
         protocolConfiguration, lifecycleConfiguration, metadataConfiguration, environmentVariables, filesystemConfigurations}
        | .metadataConfiguration = {requireMMDSV2: true}')"
      ```
    - Fix:
      ```bash
      aws iam put-role-policy --role-name <caller-role> --policy-name DenyAgentCoreUserIdDelegation --policy-document '{
        "Version": "2012-10-17",
        "Statement": [{"Effect": "Deny", "Action": "bedrock-agentcore:InvokeAgentRuntimeForUser", "Resource": "*"}]
      }'
      ```

- [ ] **Require VPC Mode Org-Wide With AgentCore Condition Keys** - pass: an SCP denies AgentCore runtime, browser and code-interpreter creation unless `bedrock-agentcore:subnets` and `bedrock-agentcore:securityGroups` equal the approved values
  - **Console**:
    - Verify: AWS Organizations > Policies > Service control policies > `RequireAgentCoreVpcMode` > Content shows the three `Deny` statements conditioned on `bedrock-agentcore:subnets` and `bedrock-agentcore:securityGroups`, and Targets lists the root or OU
    - Fix: AWS Organizations > Policies > Service control policies > Create policy > Policy name `RequireAgentCoreVpcMode` > JSON editor > paste the deny statements with the approved subnet and security-group IDs > Create policy; then select the policy > Targets > Attach > choose the root or OU > Attach policy
  - **CLI**:
    - Verify:
      ```bash
      aws organizations list-policies-for-target --target-id <root-or-ou-id> --filter SERVICE_CONTROL_POLICY \
        --query 'Policies[].[Name,Id]' --output table
      ```
    - Verify: `aws organizations describe-policy --policy-id <scp-id> --query 'Policy.Content' --output text`
    - Expect: `RequireAgentCoreVpcMode` is listed for the target and its content carries the `Null` and `ForAnyValue:StringNotEquals` conditions on both keys. Without the SCP any developer can launch a public-mode runtime that undoes the per-resource VPC checks.
    - Fix:
      ```bash
      aws organizations create-policy --type SERVICE_CONTROL_POLICY --name RequireAgentCoreVpcMode \
        --description "AgentCore runtimes, browsers and code interpreters must use approved subnets and security groups" \
        --query 'Policy.PolicySummary.Id' --output text --content '{
          "Version": "2012-10-17",
          "Statement": [
            {
              "Effect": "Deny",
              "Action": ["bedrock-agentcore:CreateAgentRuntime", "bedrock-agentcore:UpdateAgentRuntime", "bedrock-agentcore:CreateCodeInterpreter", "bedrock-agentcore:CreateBrowser"],
              "Resource": "*",
              "Condition": {"Null": {"bedrock-agentcore:subnets": "true", "bedrock-agentcore:securityGroups": "true"}}
            },
            {
              "Effect": "Deny",
              "Action": ["bedrock-agentcore:CreateAgentRuntime", "bedrock-agentcore:UpdateAgentRuntime", "bedrock-agentcore:CreateCodeInterpreter", "bedrock-agentcore:CreateBrowser"],
              "Resource": "*",
              "Condition": {"ForAnyValue:StringNotEquals": {"bedrock-agentcore:subnets": ["<subnet-id>"]}}
            },
            {
              "Effect": "Deny",
              "Action": ["bedrock-agentcore:CreateAgentRuntime", "bedrock-agentcore:UpdateAgentRuntime", "bedrock-agentcore:CreateCodeInterpreter", "bedrock-agentcore:CreateBrowser"],
              "Resource": "*",
              "Condition": {"ForAnyValue:StringNotEquals": {"bedrock-agentcore:securityGroups": ["<security-group-id>"]}}
            }
          ]
        }'
      ```
    - Fix: `aws organizations attach-policy --target-id <root-or-ou-id> --policy-id <scp-id>`

- [ ] **Log AgentCore Gateway and Runtime Data Events in CloudTrail** - pass: the trail's advanced event selectors include Data events for `AWS::BedrockAgentCore::Gateway`, `Runtime` and `RuntimeEndpoint`
  - **Console**:
    - Verify: CloudTrail > Trails > <trail> > Data events > the list shows the Bedrock AgentCore resource types (Gateway, Runtime, RuntimeEndpoint) with `Log all events`
    - Fix: CloudTrail > Trails > <trail> > Data events > Edit > Add data event type > Resource type `Bedrock AgentCore ...` for each type > Log selector template `Log all events` > Save changes
  - **CLI**:
    - Verify:
      ```bash
      aws cloudtrail get-event-selectors --trail-name <trail> \
        --query 'AdvancedEventSelectors[].FieldSelectors[?Field==`resources.type`].Equals[]'
      ```
    - Expect: the output lists `AWS::BedrockAgentCore::Gateway`, `AWS::BedrockAgentCore::Runtime` and `AWS::BedrockAgentCore::RuntimeEndpoint`. Without data events, every tool call through a gateway and every runtime invocation is invisible to CloudTrail.
    - Fix:
      ```bash
      aws cloudtrail put-event-selectors --trail-name <trail> --advanced-event-selectors "$(
        aws cloudtrail get-event-selectors --trail-name <trail> --query 'AdvancedEventSelectors' --output json | jq '
          (. // []) + [
            {"FieldSelectors": [{"Field": "eventCategory", "Equals": ["Management"]}]},
            {"FieldSelectors": [{"Field": "eventCategory", "Equals": ["Data"]}, {"Field": "resources.type", "Equals": ["AWS::BedrockAgentCore::Gateway"]}]},
            {"FieldSelectors": [{"Field": "eventCategory", "Equals": ["Data"]}, {"Field": "resources.type", "Equals": ["AWS::BedrockAgentCore::Runtime"]}]},
            {"FieldSelectors": [{"Field": "eventCategory", "Equals": ["Data"]}, {"Field": "resources.type", "Equals": ["AWS::BedrockAgentCore::RuntimeEndpoint"]}]}
          ] | unique')"
      ```

- [ ] **Deny Gateways Created Without an Authorizer** - pass: an SCP denies `bedrock-agentcore:CreateGateway` when `bedrock-agentcore:GatewayAuthorizerType` is `NONE` or `AUTHENTICATE_ONLY`
  - **Console**:
    - Verify: AWS Organizations > Policies > Service control policies > `DenyAgentCoreGatewaysWithoutAuthorizer` > Content shows the `Deny` on `bedrock-agentcore:CreateGateway` conditioned on `bedrock-agentcore:GatewayAuthorizerType` in `NONE`, `AUTHENTICATE_ONLY`, and Targets lists the root or OU
    - Fix: AWS Organizations > Policies > Service control policies > Create policy > Policy name `DenyAgentCoreGatewaysWithoutAuthorizer` > JSON editor > paste the deny statement > Create policy; then select the policy > Targets > Attach > choose the root or OU > Attach policy
  - **CLI**:
    - Verify:
      ```bash
      aws organizations list-policies-for-target --target-id <root-or-ou-id> --filter SERVICE_CONTROL_POLICY \
        --query 'Policies[].[Name,Id]' --output table
      ```
    - Verify: `aws organizations describe-policy --policy-id <scp-id> --query 'Policy.Content' --output text`
    - Expect: `DenyAgentCoreGatewaysWithoutAuthorizer` is listed for the target and its content names `NONE` and `AUTHENTICATE_ONLY` under `bedrock-agentcore:GatewayAuthorizerType`. Without it the per-gateway check is only as good as the last person who clicked through creation.
    - Fix:
      ```bash
      aws organizations create-policy --type SERVICE_CONTROL_POLICY --name DenyAgentCoreGatewaysWithoutAuthorizer \
        --description "Gateways must authenticate and authorize callers" \
        --query 'Policy.PolicySummary.Id' --output text --content '{
          "Version": "2012-10-17",
          "Statement": [{
            "Effect": "Deny",
            "Action": "bedrock-agentcore:CreateGateway",
            "Resource": "*",
            "Condition": {"StringEquals": {"bedrock-agentcore:GatewayAuthorizerType": ["NONE", "AUTHENTICATE_ONLY"]}}
          }]
        }'
      ```
    - Fix: `aws organizations attach-policy --target-id <root-or-ou-id> --policy-id <scp-id>`
