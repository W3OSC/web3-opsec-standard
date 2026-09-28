<!--
id: litellm-organization-configuration
type: CONFIGURATION
scope: ORGANIZATION
-->

<div align="center">
  <img src="../../../../images/guides/litellm.svg" alt="LiteLLM Logo" width="64" height="64">
  <h2><a href="https://www.litellm.ai/" target="_blank" rel="noopener noreferrer">LiteLLM</a> Configuration Guide</h2>
  <p><em>Master-Key, Virtual-Key, Budget, Model-Access, Admin-UI, Network, Logging, Guardrail and Deployment controls for the LiteLLM Proxy (LLM gateway)</em></p>
</div>

---

## How to Use This Guide

Each item states its **pass** condition, then gives **Console** (the LiteLLM Admin UI at `/ui`) and **CLI** (`curl` against the proxy's management API, `kubectl` and `helm` for the deployment, `yq` for the config file) steps to **Verify** and **Fix** it. Under CLI, **Expect** is the output that means it passes. Most server settings live in `config.yaml` or the environment and have no Admin UI page, so many items are CLI-only; an item shows only the channels that can check or change the setting, and it passes only when every key, team or deployment the command returns meets the condition. Where an **Expect** reads `no output`, an empty result is the passing state even when the command exits non-zero.

#### Prerequisites

- The proxy's base URL and the master key, exported once: `export LITELLM_HOST=https://<litellm-host> MASTER_KEY=<master-key>`. Every `curl` Verify runs with the master key unless the item says otherwise.
- A Verify whose Expect is `no output` also prints nothing when the host or the master key is wrong. Check both once before the list checks: `curl -s -o /dev/null -w '%{http_code}' -H "Authorization: Bearer $MASTER_KEY" $LITELLM_HOST/key/list` prints `200`.
- `curl`, `jq`, `yq` (mikefarah), `openssl` and `cosign` on the workstation; `kubectl` and `helm` with access to the namespace the proxy runs in: `export NS=<namespace>`.
  - The ingress items show the ingress-nginx controller's annotation; the Kubernetes project has retired that controller with no further security fixes, so on a supported controller or a Gateway API implementation set its equivalent.
- Deployment items assume LiteLLM's monolithic deployment - the vendor's Helm chart `oci://ghcr.io/berriai/litellm-helm`, one image serving inference, the management API and the Admin UI - installed as release `litellm`: the Deployment and Service are named `litellm`, the rendered config is ConfigMap `litellm-config` (key `config.yaml`), and `values.yaml` holds the config under `proxy_config:` and environment variables under `envVars:`.
  - Check once that both objects exist: `kubectl get deployment/litellm configmap/litellm-config -n $NS -o name` prints two lines.
  - A missing object prints nothing, and the checks below whose Expect is `null` or `no output` then pass without reading anything.
  - That happens under another release name and on the vendor's componentized `litellm` chart (gateway, management backend and UI as separate Deployments, one ConfigMap under another name), which this page does not cover.
- `config.yaml` fixes edit `values.yaml` in place with `yq` and roll out with `helm upgrade litellm oci://ghcr.io/berriai/litellm-helm -n $NS -f values.yaml`; the proxy reads the file at startup.
  - Values passed as `--set` are not kept between releases, so every fix on this page writes `values.yaml` and the rollout command is always the same.
  - Once the release split for application-facing replicas is in place (the item that serves only the inference routes, and the Admin UI item after it), re-run those two Fixes after every Fix that edits `values.yaml`, so the `litellm-app` release carries the same settings, restart `deployment/litellm-app` after any Fix that replaces the master key Secret, and run each Verify against that release too: there the Deployment, Service and Ingress are `litellm-app` and the ConfigMap is `litellm-app-config` (`kubectl get deployment/litellm-app configmap/litellm-app-config -n $NS -o name` prints two lines), and `https://<app-host>` stands in for `$LITELLM_HOST` only in the checks that send no key and in the rotation item's previous-key check, which must print `401` there too.
  - The other keyed checks read the database both releases share or the config the re-run copies, and most call routes that answer `403` there by design.
  - The Admin UI item already checks both hosts, so run its two Verifies as written.
- `kubectl set env` changes the live Deployment and rolls the pods, but the value then lives outside `values.yaml`: the next `helm upgrade -f values.yaml` neither carries it nor promises to keep it.
  - Write the same value under `envVars:` in `values.yaml`; secret values go into a Kubernetes Secret listed under `environmentSecrets:`.
- `STORE_MODEL_IN_DB` decides where settings live, and it cuts both ways.
  - Left unset, `values.yaml` is the only source of truth, but the Admin UI routes that save settings refuse with a `STORE_MODEL_IN_DB` error - the items that need them set the variable in their own Fix.
  - Set, settings saved from the Admin UI live in the database, override the `config.yaml` these checks read, and are not restored by `helm upgrade`; then repeat every config check against `GET /config/list` as well.
- Admin UI paths start from the left sidebar as a `proxy_admin`. Repeat the key, team and user checks on every proxy instance.

---

## Master Key & Database

- [ ] **Set a Master Key From a Secret (never run the proxy without one)** - pass: the master key reaches the proxy from a Kubernetes Secret (`PROXY_MASTER_KEY` on the chart's Deployment, read by `general_settings.master_key`) as `sk-` plus at least 32 random characters, and an unauthenticated request is refused
  - **CLI**:
    - Verify: `curl -s -o /dev/null -w '%{http_code}' $LITELLM_HOST/v1/models`
    - Verify:
      ```bash
      kubectl get configmap litellm-config -n $NS -o jsonpath='{.data.config\.yaml}' \
        | yq '.general_settings.master_key'
      ```
    - Verify:
      ```bash
      kubectl exec deployment/litellm -n $NS -- sh -c 'printenv PROXY_MASTER_KEY | tr -d "\n" | wc -c'
      ```
    - Expect: `401` from the first command, `os.environ/PROXY_MASTER_KEY` from the second and at least `35` from the third. With no master key every caller is an internal user who can call models, mint keys and reset spend.
    - Fix:
      ```bash
      yq -i 'del(.masterkey) | .proxy_config.general_settings.master_key = "os.environ/PROXY_MASTER_KEY"' values.yaml \
        && helm upgrade litellm oci://ghcr.io/berriai/litellm-helm -n $NS -f values.yaml \
        && REF=$(kubectl get deployment litellm -n $NS -o jsonpath='{range .spec.template.spec.containers[0].env[?(@.name=="PROXY_MASTER_KEY")]}{.valueFrom.secretKeyRef.name}/{.valueFrom.secretKeyRef.key}{end}') \
        && kubectl patch secret "${REF%/*}" -n $NS -p "{\"stringData\":{\"${REF#*/}\":\"sk-$(openssl rand -hex 32)\"}}" \
        && kubectl rollout restart deployment/litellm -n $NS
      ```

- [ ] **Set a Dedicated Salt Key Before the First Credential Is Stored** - pass: `LITELLM_SALT_KEY` is set from a Kubernetes Secret and differs from the master key
  - **CLI**:
    - Verify:
      ```bash
      kubectl exec deployment/litellm -n $NS -- sh -c 'printenv LITELLM_SALT_KEY | tr -d "\n" | wc -c'
      ```
    - Verify:
      ```bash
      kubectl exec deployment/litellm -n $NS -- sh -c '[ "$LITELLM_SALT_KEY" != "$PROXY_MASTER_KEY" ] && echo differs || echo same-as-master'
      ```
    - Expect: at least `35` (the `sk-` prefix plus 32 characters) from the first command and `differs` from the second. Otherwise the master key encrypts every stored provider credential, so replacing its Secret breaks them - and so does adding the salt once credentials are stored, until each one is re-entered.
    - Fix:
      ```bash
      kubectl create secret generic litellm-salt -n $NS --from-literal=LITELLM_SALT_KEY=sk-$(openssl rand -hex 32) \
        && kubectl set env deployment/litellm -n $NS --from=secret/litellm-salt
      ```

- [ ] **Connect a Managed Postgres Key Store Over Verified TLS** - pass: `DATABASE_URL` points at your managed Postgres with `sslmode=verify-full`, and `/health/readiness` reports `db` as `connected`
  - **CLI**:
    - Verify: `curl -s $LITELLM_HOST/health/readiness`
    - Verify:
      ```bash
      kubectl exec deployment/litellm -n $NS -- sh -c 'printenv DATABASE_URL | grep -o "sslmode=[a-z-]*"'
      ```
    - Expect: `"db":"connected"` and `sslmode=verify-full`. A missing database means no key store and no enforced budgets; an unverified connection exposes every hashed key and credential in transit.
    - Fix:
      ```bash
      kubectl create secret generic litellm-db -n $NS --from-literal=username=<db-user> --from-literal=password=<db-password> \
        && kubectl create secret generic litellm-db-ca -n $NS --from-file=ca.pem=<ca-bundle.pem> \
        && yq -i '.db.useExisting = true | .db.deployStandalone = false | .db.endpoint = "<db-host>" | .db.database = "<db-name>" | .db.secret.name = "litellm-db"' values.yaml \
        && yq -i '.db.url = "postgresql://$(DATABASE_USERNAME):$(DATABASE_PASSWORD)@$(DATABASE_HOST)/$(DATABASE_NAME)?sslmode=verify-full&sslrootcert=/certs/ca.pem"' values.yaml \
        && yq -i '.volumes = ([.volumes[] | select(.name != "db-ca")] + [{"name": "db-ca", "secret": {"secretName": "litellm-db-ca"}}])' values.yaml \
        && yq -i '.volumeMounts = ([.volumeMounts[] | select(.name != "db-ca")] + [{"name": "db-ca", "mountPath": "/certs", "readOnly": true}])' values.yaml \
        && helm upgrade litellm oci://ghcr.io/berriai/litellm-helm -n $NS -f values.yaml
      ```

- [ ] **Rotate the Master Key on a Schedule by Replacing the Secret (with a salt key set, never through /key/regenerate)** - pass: the master key Secret was replaced inside your rotation window and the previous value is refused
  - **CLI**:
    - Verify:
      ```bash
      curl -s -o /dev/null -w '%{http_code}' -H 'Authorization: Bearer <previous-master-key>' $LITELLM_HOST/v1/models
      ```
    - Verify: `kubectl get secret litellm-masterkey -n $NS -o jsonpath='{.metadata.managedFields[-1].time}'`
    - Expect: `401` for the previous value and a Secret timestamp inside your rotation window. A master key that never rotates keeps every past leak live.
    - Fix:
      ```bash
      kubectl create secret generic litellm-masterkey -n $NS --from-literal=masterkey=sk-$(openssl rand -hex 32) \
        --dry-run=client -o yaml | kubectl apply -f - && kubectl rollout restart deployment/litellm -n $NS
      ```

- [ ] **Do Not Return the Master Key to Admin UI Sessions** - pass: `general_settings.disable_master_key_return` is `true`
  - **CLI**:
    - Verify:
      ```bash
      kubectl get configmap litellm-config -n $NS -o jsonpath='{.data.config\.yaml}' \
        | yq '.general_settings.disable_master_key_return'
      ```
    - Expect: `true`. With it off, the bootstrap admin's dashboard session lists the master key's own token record whenever one exists in the key table.
    - Fix:
      ```bash
      yq -i '.proxy_config.general_settings.disable_master_key_return = true' values.yaml \
        && helm upgrade litellm oci://ghcr.io/berriai/litellm-helm -n $NS -f values.yaml
      ```

---

## Admin UI & SSO

- [ ] **Create a Personal Proxy Admin Account for Every Administrator** - pass: every administrator has a `proxy_admin` user with their own email, and the shared environment login is used for recovery only
  - **Console**:
    - Verify: Admin UI > Internal Users > Users > Global Proxy Role column shows `Admin (All Permissions)` for each named administrator, not only for `default_user_id`
    - Fix: Admin UI > Internal Users > + Invite User > User Email > Global Proxy Role `Admin (All Permissions)` > tick `Send invitation email` only if SSO is off > Invite User
  - **CLI**:
    - Verify:
      ```bash
      curl -s -H "Authorization: Bearer $MASTER_KEY" "$LITELLM_HOST/user/list?role=proxy_admin" | jq -r '.users[].user_email'
      ```
    - Expect: one email per administrator, plus one `null` line for the environment login's `default_user_id`. A shared bootstrap login cannot be rotated per person or revoked for a single leaver. Once SSO is on, leave `Send invitation email` unticked and set `send_invite_email` to `false`: the emailed link sets a password and opens an admin session outside SSO for about a week, while the new administrator can sign in through the identity provider instead.
    - Fix:
      ```bash
      curl -s -X POST -H "Authorization: Bearer $MASTER_KEY" -H 'Content-Type: application/json' $LITELLM_HOST/user/new \
        -d '{"user_email":"<admin-email>","user_role":"proxy_admin","auto_create_key":false,"send_invite_email":<true-only-if-SSO-is-off>}'
      ```

- [ ] **Set a UI Username and a UI Password That Is Not the Master Key** - pass: `UI_USERNAME` is not `admin` and `UI_PASSWORD` is set from a Secret to a value that differs from the master key
  - **CLI**:
    - Verify:
      ```bash
      kubectl exec deployment/litellm -n $NS -- sh -c '[ "${UI_USERNAME:-admin}" != admin ] && [ -n "$UI_PASSWORD" ] && echo set || echo default'
      ```
    - Verify:
      ```bash
      curl -s -o /dev/null -w '%{http_code}' $LITELLM_HOST/login \
        --data-urlencode "username=<ui-username>" --data-urlencode "password=$MASTER_KEY"
      ```
    - Expect: `set` from the first command and `401` from the login, or `403` once password login is turned off beside SSO. Without them the default `admin` login with the API root key is a guessable takeover of both the UI and the API.
    - Fix:
      ```bash
      kubectl create secret generic litellm-ui-login -n $NS --from-literal=UI_USERNAME=<ui-username> \
        --from-literal=UI_PASSWORD=$(openssl rand -base64 24) && kubectl set env deployment/litellm -n $NS --from=secret/litellm-ui-login
      ```

- [ ] **Shorten the Admin UI Session Lifetime** - pass: `LITELLM_UI_SESSION_DURATION` is set to the hours your policy allows, not the 24-hour default
  - **CLI**:
    - Verify: `kubectl exec deployment/litellm -n $NS -- printenv LITELLM_UI_SESSION_DURATION`
    - Expect: a duration shorter than `24h`, such as `8h`. The default keeps a stolen admin session cookie valid for a day.
    - Fix: `kubectl set env deployment/litellm -n $NS LITELLM_UI_SESSION_DURATION=8h`

- [ ] **Restrict Admin UI SSO Sign-In to Admin Roles** - pass: `general_settings.ui_access_mode` is `admin_only`
  - **CLI**:
    - Verify:
      ```bash
      kubectl get configmap litellm-config -n $NS -o jsonpath='{.data.config\.yaml}' \
        | yq '.general_settings.ui_access_mode'
      ```
    - Expect: `admin_only`. With the default `all`, every SSO user gets a dashboard session that can drive the management API.
    - Fix:
      ```bash
      yq -i '.proxy_config.general_settings.ui_access_mode = "admin_only"' values.yaml \
        && helm upgrade litellm oci://ghcr.io/berriai/litellm-helm -n $NS -f values.yaml
      ```

- [ ] **Sign Admins In Through Your Identity Provider (free for up to five user records; beyond that a licence)** - pass: `/sso/readiness` reports the provider configured with its pinned endpoints, `PROXY_BASE_URL` is your public URL, and `SSO_ENABLED` is `true`
  - **Console**:
    - Verify: Admin UI > Settings > Admin Settings > SSO Settings > the page shows your provider's configuration instead of `No SSO Configuration Found`
    - Fix: Admin UI > Settings > Admin Settings > SSO Settings > Configure SSO > SSO Provider > enter Proxy Admin Email and Proxy Base URL and the provider's client id, secret and endpoints > Add SSO (the save needs `STORE_MODEL_IN_DB`; without it use the CLI Fix)
  - **CLI**:
    - Verify:
      ```bash
      curl -s -H "Authorization: Bearer $MASTER_KEY" $LITELLM_HOST/sso/readiness | jq -r '(.detail // .) | [.status, .sso_configured, .provider, ((.missing_environment_variables // []) | join(","))] | @tsv'
      ```
    - Verify:
      ```bash
      curl -s -H "Authorization: Bearer $MASTER_KEY" $LITELLM_HOST/sso/get/ui_settings | jq -r '[.SSO_ENABLED, .PROXY_BASE_URL] | @tsv'
      ```
    - Expect: `healthy`, `true`, your provider's name and an empty fourth field from the first command, and `true` with your public URL from the second; `unhealthy` with the missing variables listed in the fourth field is the fail state. Without SSO every admin login is a proxy-local password with no MFA and no central offboarding.
    - Fix:
      ```bash
      kubectl create secret generic litellm-sso -n $NS --from-literal=GENERIC_CLIENT_ID=<client-id> \
        --from-literal=GENERIC_CLIENT_SECRET=<client-secret> && kubectl set env deployment/litellm -n $NS --from=secret/litellm-sso \
        GENERIC_AUTHORIZATION_ENDPOINT=https://<idp>/authorize GENERIC_TOKEN_ENDPOINT=https://<idp>/token \
        GENERIC_USERINFO_ENDPOINT=https://<idp>/userinfo GENERIC_SCOPE="openid email profile" PROXY_BASE_URL=https://<litellm-host>
      ```

- [ ] **Restrict SSO Sign-In to Corporate Email Domains** - pass: `ALLOWED_EMAIL_DOMAINS` lists every corporate domain and nothing else
  - **CLI**:
    - Verify: `kubectl exec deployment/litellm -n $NS -- printenv ALLOWED_EMAIL_DOMAINS`
    - Expect: a comma-separated list of your domains. Without it any account at the identity provider, personal ones included, can sign in and be provisioned.
    - Fix: `kubectl set env deployment/litellm -n $NS ALLOWED_EMAIL_DOMAINS=<domain>,<domain>`

- [ ] **Bind the Proxy Admin Role to One SSO Identity** - pass: `PROXY_ADMIN_ID` is set to the administrator's identity-provider user id
  - **CLI**:
    - Verify: `kubectl exec deployment/litellm -n $NS -- printenv PROXY_ADMIN_ID`
    - Expect: the administrator's IdP user id. Without it the SSO admin is still the shared bootstrap login.
    - Fix: `kubectl set env deployment/litellm -n $NS PROXY_ADMIN_ID=<idp-user-id>`

- [ ] **Disable Password Login Once SSO Covers Every Admin** - pass: `general_settings.disable_password_login_when_sso_enabled` is `true`
  - **CLI**:
    - Verify:
      ```bash
      kubectl get configmap litellm-config -n $NS -o jsonpath='{.data.config\.yaml}' \
        | yq '.general_settings.disable_password_login_when_sso_enabled'
      ```
    - Expect: `true`. A password path beside SSO sidesteps the identity provider's MFA and leaver process; an unclaimed invitation link does too, because it sets a password and opens a dashboard session whatever this flag says, so once SSO is on add administrators without an invitation email and let them sign in through the identity provider.
    - Fix:
      ```bash
      yq -i '.proxy_config.general_settings.disable_password_login_when_sso_enabled = true' values.yaml \
        && helm upgrade litellm oci://ghcr.io/berriai/litellm-helm -n $NS -f values.yaml
      ```

- [ ] **Do Not Accept Custom Virtual Key Values** - pass: the UI setting `disable_custom_api_keys` is `true` and `/key/generate` refuses a caller-supplied `key`
  - **Console**:
    - Verify: Admin UI > Settings > Admin Settings > UI Settings > `Disable custom Virtual key values` is on
    - Fix: Admin UI > Settings > Admin Settings > UI Settings > switch `Disable custom Virtual key values` on
  - **CLI**:
    - Verify:
      ```bash
      curl -s -H "Authorization: Bearer $MASTER_KEY" $LITELLM_HOST/get/ui_settings | jq .values.disable_custom_api_keys
      ```
    - Expect: `true`. The UI settings table needs `STORE_MODEL_IN_DB`; without it the PATCH answers `500`. Otherwise anyone who can mint a key can choose a weak, guessable value for it.
    - Fix:
      ```bash
      kubectl set env deployment/litellm -n $NS STORE_MODEL_IN_DB=True && kubectl rollout status deployment/litellm -n $NS \
        && curl -s -X PATCH -H "Authorization: Bearer $MASTER_KEY" -H 'Content-Type: application/json' $LITELLM_HOST/update/ui_settings \
             -d '{"disable_custom_api_keys":true}'
      ```

---

## Virtual Keys & Teams

- [ ] **Restrict Who May Create Virtual Keys** - pass: `litellm_settings.key_generation_settings` limits team keys to team admins and personal keys to proxy admins
  - **CLI**:
    - Verify:
      ```bash
      kubectl get configmap litellm-config -n $NS -o jsonpath='{.data.config\.yaml}' \
        | yq '.litellm_settings.key_generation_settings'
      ```
    - Expect: `team_key_generation.allowed_team_member_roles` is `[admin]` and `personal_key_generation.allowed_user_roles` is `[proxy_admin]`. Otherwise every user session can mint keys that outlive the session.
    - Fix:
      ```bash
      yq -i '.proxy_config.litellm_settings.key_generation_settings.team_key_generation.allowed_team_member_roles = ["admin"] | .proxy_config.litellm_settings.key_generation_settings.personal_key_generation.allowed_user_roles = ["proxy_admin"]' values.yaml \
        && helm upgrade litellm oci://ghcr.io/berriai/litellm-helm -n $NS -f values.yaml
      ```

- [ ] **Issue Every Workload Its Own Service-Account Key, Never the Master Key** - pass: every application authenticates with a virtual key whose `key_alias` names the workload and environment, and no application configuration holds the master key
  - **Console**:
    - Verify: Admin UI > Virtual Keys > Key column shows one named key per workload and environment, with a Team for each
    - Fix: Admin UI > Virtual Keys > open the key > Settings > Edit Settings > Key Alias `<workload>-<environment>` > Save Changes
  - **CLI**:
    - Verify:
      ```bash
      PAGES=$(curl -s -H "Authorization: Bearer $MASTER_KEY" "$LITELLM_HOST/key/list?size=100" | jq .total_pages)
      for p in $(seq 1 "$PAGES"); do
        curl -s -H "Authorization: Bearer $MASTER_KEY" "$LITELLM_HOST/key/list?return_full_object=true&size=100&page=$p"
      done | jq -r '.keys[] | select(.key_alias == null) | .token'
      ```
    - Verify:
      ```bash
      curl -s -H "Authorization: Bearer $MASTER_KEY" "$LITELLM_HOST/spend/logs" \
        | jq -r '.[] | select(.api_key == "litellm_proxy_master_key") | [.model_group, .user] | @tsv' | sort -u
      ```
    - Expect: no output from either command: every key carries an alias naming its workload, and no retained spend row was written by the master key. A key nobody can attribute cannot be scoped or revoked with confidence, and an application holding the master key holds the whole gateway.
    - Fix:
      ```bash
      curl -s -X POST -H "Authorization: Bearer $MASTER_KEY" -H 'Content-Type: application/json' $LITELLM_HOST/key/service-account/generate \
        -d '{"team_id":"<team-id>","key_alias":"<workload>-<environment>","models":["<model>"],"duration":"90d","allowed_routes":["llm_api_routes"]}'
      ```

- [ ] **Allowlist Models on Every Virtual Key** - pass: every key's `models` names the deployments the workload needs; no key has an empty list or a catch-all entry (`*`, `all-proxy-models`, `all-team-models`)
  - **Console**:
    - Verify: Admin UI > Virtual Keys > Models column names specific models for every key, never `All Proxy Models`, `all-team-models` or `*`
    - Fix: Admin UI > Virtual Keys > open the key > Settings > Edit Settings > Models > pick the named models > Save Changes
  - **CLI**:
    - Verify:
      ```bash
      PAGES=$(curl -s -H "Authorization: Bearer $MASTER_KEY" "$LITELLM_HOST/key/list?size=100" | jq .total_pages)
      for p in $(seq 1 "$PAGES"); do
        curl -s -H "Authorization: Bearer $MASTER_KEY" "$LITELLM_HOST/key/list?return_full_object=true&size=100&page=$p"
      done | jq -r '.keys[] | select((.models | length) == 0 or ([.models[] | select(. == "*" or . == "all-proxy-models" or . == "all-team-models")] | length > 0)) | .key_alias'
      ```
    - Expect: no output. A key with every model can drive the most expensive deployment behind the proxy.
    - Fix:
      ```bash
      curl -s -X POST -H "Authorization: Bearer $MASTER_KEY" -H 'Content-Type: application/json' $LITELLM_HOST/key/update \
        -d '{"key":"<key-token>","models":["<model>"]}'
      ```

- [ ] **Set an Expiry on Every Virtual Key** - pass: every key has `expires` set; no key expires never
  - **Console**:
    - Verify: Admin UI > Virtual Keys > open the key > EXPIRES shows a date, never `Never`
    - Fix: Admin UI > Virtual Keys > open the key > Settings > Edit Settings > Key Expiry Settings > untick `Never Expire` > Expire Key `90d` > Save Changes
  - **CLI**:
    - Verify:
      ```bash
      PAGES=$(curl -s -H "Authorization: Bearer $MASTER_KEY" "$LITELLM_HOST/key/list?size=100" | jq .total_pages)
      for p in $(seq 1 "$PAGES"); do
        curl -s -H "Authorization: Bearer $MASTER_KEY" "$LITELLM_HOST/key/list?return_full_object=true&size=100&page=$p"
      done | jq -r '.keys[] | select(.expires == null) | .key_alias'
      ```
    - Expect: no output. A key that never expires keeps a forgotten leak valid indefinitely.
    - Fix:
      ```bash
      curl -s -X POST -H "Authorization: Bearer $MASTER_KEY" -H 'Content-Type: application/json' $LITELLM_HOST/key/update \
        -d '{"key":"<key-token>","duration":"90d"}'
      ```

- [ ] **Limit Application Keys to the Inference Routes** - pass: every application key has `allowed_routes` set to `["llm_api_routes"]`
  - **CLI**:
    - Verify:
      ```bash
      PAGES=$(curl -s -H "Authorization: Bearer $MASTER_KEY" "$LITELLM_HOST/key/list?size=100" | jq .total_pages)
      for p in $(seq 1 "$PAGES"); do
        curl -s -H "Authorization: Bearer $MASTER_KEY" "$LITELLM_HOST/key/list?return_full_object=true&size=100&page=$p"
      done | jq -r '.keys[] | select((.allowed_routes | sort) != ["llm_api_routes"]) | .key_alias'
      ```
    - Expect: no output. A key open to every route can enumerate teams, keys, models and spend as well as call models.
    - Fix:
      ```bash
      curl -s -X POST -H "Authorization: Bearer $MASTER_KEY" -H 'Content-Type: application/json' $LITELLM_HOST/key/update \
        -d '{"key":"<key-token>","allowed_routes":["llm_api_routes"]}'
      ```

- [ ] **Block a Compromised Key Immediately, Then Delete It** - pass: `/key/info` reports every key from the incident as `blocked` `true`, or reports it is no longer in the database
  - **CLI**:
    - Verify:
      ```bash
      curl -s -H "Authorization: Bearer $MASTER_KEY" "$LITELLM_HOST/key/info?key=<virtual-key>" | jq -r '.info.blocked // .error.message'
      ```
    - Expect: `true`, or `Key not found in database` once deleted. A leaked key that stays active keeps drawing on the provider accounts behind the proxy.
    - Fix:
      ```bash
      curl -s -X POST -H "Authorization: Bearer $MASTER_KEY" -H 'Content-Type: application/json' $LITELLM_HOST/key/block -d '{"key":"<virtual-key>"}'
      ```
    - Fix:
      ```bash
      curl -s -X POST -H "Authorization: Bearer $MASTER_KEY" -H 'Content-Type: application/json' $LITELLM_HOST/key/delete -d '{"keys":["<virtual-key>"]}'
      ```

- [ ] **Allowlist Models on Every Team** - pass: every team's `models` names its approved deployments; no team has an empty list or a catch-all entry (`all-proxy-models`, `*`)
  - **Console**:
    - Verify: Admin UI > Teams > Your Teams > open each team > Overview > Models lists specific models, never the `All proxy models` badge (an empty list shows it too) and never `*`
    - Fix: Admin UI > Teams > Your Teams > open the team > Settings > Edit Settings > Models > pick the approved models > Save Changes
  - **CLI**:
    - Verify:
      ```bash
      curl -s -H "Authorization: Bearer $MASTER_KEY" $LITELLM_HOST/team/list \
        | jq -r '.[] | select((.models | length) == 0 or any(.models[]; . == "all-proxy-models" or . == "*")) | .team_alias'
      ```
    - Expect: no output. A team without an allowlist lets any member key reach every model.
    - Fix:
      ```bash
      curl -s -X POST -H "Authorization: Bearer $MASTER_KEY" -H 'Content-Type: application/json' $LITELLM_HOST/team/update \
        -d '{"team_id":"<team-id>","models":["<model>"]}'
      ```

- [ ] **Set a Per-Member Budget on Every Team (member key lifetime is licence-gated)** - pass: every team's member budget carries a cap and a reset window
  - **Console**:
    - Verify: Admin UI > Teams > Your Teams > open the team > Settings > Team Member Settings shows a Max Budget and a Budget Duration, not `No Limit`
    - Fix: Admin UI > Teams > Your Teams > open the team > Settings > Edit Settings > Team Member Settings > Default Budget (USD) > Default Budget Duration > Save Changes
  - **CLI**:
    - Verify:
      ```bash
      BUDGETS=$(curl -s -H "Authorization: Bearer $MASTER_KEY" $LITELLM_HOST/budget/list \
        | jq -r '[.[] | select(.max_budget != null and .budget_duration != null) | .budget_id]')
      curl -s -H "Authorization: Bearer $MASTER_KEY" $LITELLM_HOST/team/list \
        | jq -r --argjson ids "$BUDGETS" '.[] | select((.metadata.team_member_budget_id // "") as $id | ($ids | index($id)) == null) | .team_alias'
      ```
    - Expect: no output: every team's member budget id resolves to a budget object that carries a cap and a reset window. Without member caps one leaked member key can spend the whole team budget.
    - Fix:
      ```bash
      curl -s -X POST -H "Authorization: Bearer $MASTER_KEY" -H 'Content-Type: application/json' $LITELLM_HOST/team/update \
        -d '{"team_id":"<team-id>","team_member_budget":<usd>,"team_member_budget_duration":"30d"}'
      ```

- [ ] **Do Not Auto-Add the Creating Admin to Every Team** - pass: `general_settings.disable_auto_add_proxy_admin_to_teams` is `true`
  - **Console**:
    - Verify: Admin UI > Settings > Router Settings > General > `disable_auto_add_proxy_admin_to_teams` shows Value `true` (with Status `In DB` this holds only when the store is on)
    - Fix: Admin UI > Settings > Router Settings > General > `disable_auto_add_proxy_admin_to_teams` > Value > toggle on > Update (this writes the database copy of `general_settings`, which the proxy reads back only when the store is on - `general_settings.store_model_in_db` in `config.yaml` or `STORE_MODEL_IN_DB` in the environment, either route; on the chart's default deployment use the CLI Fix)
  - **CLI**:
    - Verify:
      ```bash
      kubectl get configmap litellm-config -n $NS -o jsonpath='{.data.config\.yaml}' \
        | yq '.general_settings.disable_auto_add_proxy_admin_to_teams'
      ```
    - Expect: `true`. Otherwise every team silently carries the bootstrap admin as a member and its member list is wrong.
    - Fix:
      ```bash
      yq -i '.proxy_config.general_settings.disable_auto_add_proxy_admin_to_teams = true' values.yaml \
        && helm upgrade litellm oci://ghcr.io/berriai/litellm-helm -n $NS -f values.yaml
      ```

- [ ] **Cap What Any Virtual Key Can Be Created With** - pass: `litellm_settings.upperbound_key_generate_params` sets a maximum budget, duration and rate limit for every key
  - **CLI**:
    - Verify:
      ```bash
      kubectl get configmap litellm-config -n $NS -o jsonpath='{.data.config\.yaml}' \
        | yq '.litellm_settings.upperbound_key_generate_params'
      ```
    - Expect: a mapping with `max_budget`, `duration`, `rpm_limit` and `tpm_limit`, not `null`. Without ceilings one request can mint an unlimited, never-expiring key.
    - Fix:
      ```bash
      yq -i '.proxy_config.litellm_settings.upperbound_key_generate_params = {"max_budget": 100, "budget_duration": "30d", "duration": "90d", "rpm_limit": 600, "tpm_limit": 1000000, "max_parallel_requests": 20}' values.yaml \
        && helm upgrade litellm oci://ghcr.io/berriai/litellm-helm -n $NS -f values.yaml
      ```

---

## Budgets & Rate Limits

- [ ] **Set a Hard Budget With a Reset Window on Every Virtual Key** - pass: every key has `max_budget` and `budget_duration` set
  - **Console**:
    - Verify: Admin UI > Virtual Keys > Spend / Budget column shows a dollar cap and Budget Reset shows a date for every key, never `Unlimited` or `Never`
    - Fix: Admin UI > Virtual Keys > open the key > Settings > Edit Settings > Max Budget (USD) > Reset Budget > choose the window > Save Changes
  - **CLI**:
    - Verify:
      ```bash
      PAGES=$(curl -s -H "Authorization: Bearer $MASTER_KEY" "$LITELLM_HOST/key/list?size=100" | jq .total_pages)
      for p in $(seq 1 "$PAGES"); do
        curl -s -H "Authorization: Bearer $MASTER_KEY" "$LITELLM_HOST/key/list?return_full_object=true&size=100&page=$p"
      done | jq -r '.keys[] | select(.max_budget == null or .budget_duration == null) | .key_alias'
      ```
    - Expect: no output; a capped key answers `429` with `budget_exceeded` once it is spent. An uncapped key is an unbounded bill on the provider accounts behind the proxy.
    - Fix:
      ```bash
      curl -s -X POST -H "Authorization: Bearer $MASTER_KEY" -H 'Content-Type: application/json' $LITELLM_HOST/key/update \
        -d '{"key":"<key-token>","max_budget":<usd>,"budget_duration":"30d"}'
      ```

- [ ] **Set Rate and Concurrency Limits on Every Virtual Key** - pass: every key has `rpm_limit`, `tpm_limit` and `max_parallel_requests` set
  - **Console**:
    - Verify: Admin UI > Virtual Keys > open the key > Settings > Rate Limits shows TPM, RPM and Max Parallel Requests values, not `Unlimited`
    - Fix: Admin UI > Virtual Keys > open the key > Settings > Edit Settings > TPM Limit > RPM Limit > Max Parallel Requests > Save Changes
  - **CLI**:
    - Verify:
      ```bash
      PAGES=$(curl -s -H "Authorization: Bearer $MASTER_KEY" "$LITELLM_HOST/key/list?size=100" | jq .total_pages)
      for p in $(seq 1 "$PAGES"); do
        curl -s -H "Authorization: Bearer $MASTER_KEY" "$LITELLM_HOST/key/list?return_full_object=true&size=100&page=$p"
      done | jq -r '.keys[] | select(.rpm_limit == null or .tpm_limit == null or .max_parallel_requests == null) | .key_alias'
      ```
    - Expect: no output; a limited key answers `429` with `throttling_error` above its rate. An unlimited key lets one loop or one leak burn the provider quota in minutes.
    - Fix:
      ```bash
      curl -s -X POST -H "Authorization: Bearer $MASTER_KEY" -H 'Content-Type: application/json' $LITELLM_HOST/key/update \
        -d '{"key":"<key-token>","rpm_limit":<rpm>,"tpm_limit":<tpm>,"max_parallel_requests":<n>}'
      ```

- [ ] **Set a Budget With a Reset Window and Rate Limits on Every Team** - pass: every team has `max_budget`, `budget_duration`, `rpm_limit` and `tpm_limit` set
  - **Console**:
    - Verify: Admin UI > Teams > Your Teams > open each team > Overview > Budget Status shows a cap with a reset and Rate Limits shows TPM and RPM values, not `Unlimited`
    - Fix: Admin UI > Teams > Your Teams > open the team > Settings > Edit Settings > Max Budget (USD) > Reset Budget > Tokens per minute Limit (TPM) > Requests per minute Limit (RPM) > Save Changes
  - **CLI**:
    - Verify:
      ```bash
      curl -s -H "Authorization: Bearer $MASTER_KEY" $LITELLM_HOST/team/list \
        | jq -r '.[] | select(.max_budget == null or .budget_duration == null or .rpm_limit == null or .tpm_limit == null) | .team_alias'
      ```
    - Expect: no output. Without a team ceiling, key budgets add up to whatever a team admin chooses to mint.
    - Fix:
      ```bash
      curl -s -X POST -H "Authorization: Bearer $MASTER_KEY" -H 'Content-Type: application/json' $LITELLM_HOST/team/update \
        -d '{"team_id":"<team-id>","max_budget":<usd>,"budget_duration":"30d","rpm_limit":<rpm>,"tpm_limit":<tpm>}'
      ```

- [ ] **Set a Proxy-Wide Budget Ceiling** - pass: `litellm_settings.max_budget` and `budget_duration` are set and `/global/spend` reports the cap
  - **CLI**:
    - Verify:
      ```bash
      curl -s -H "Authorization: Bearer $MASTER_KEY" $LITELLM_HOST/global/spend | jq .max_budget
      ```
    - Expect: your cap as a positive number, not `0.0`. Without it the sum of every team's spend has no ceiling.
    - Fix:
      ```bash
      yq -i '.proxy_config.litellm_settings.max_budget = <usd> | .proxy_config.litellm_settings.budget_duration = "30d"' values.yaml \
        && helm upgrade litellm oci://ghcr.io/berriai/litellm-helm -n $NS -f values.yaml
      ```

- [ ] **Enforce Budgets Against the Database (fail closed)** - pass: `general_settings.fail_closed_budget_enforcement` is `true`
  - **CLI**:
    - Verify:
      ```bash
      kubectl get configmap litellm-config -n $NS -o jsonpath='{.data.config\.yaml}' \
        | yq '.general_settings.fail_closed_budget_enforcement'
      ```
    - Expect: `true`. Otherwise stale cached spend lets an over-budget key keep spending during a database outage.
    - Fix:
      ```bash
      yq -i '.proxy_config.general_settings.fail_closed_budget_enforcement = true' values.yaml \
        && helm upgrade litellm oci://ghcr.io/berriai/litellm-helm -n $NS -f values.yaml
      ```

- [ ] **Require an End-User Identifier on Every Request** - pass: `general_settings.enforce_user_param` is `true`
  - **CLI**:
    - Verify:
      ```bash
      kubectl get configmap litellm-config -n $NS -o jsonpath='{.data.config\.yaml}' \
        | yq '.general_settings.enforce_user_param'
      ```
    - Expect: `true`; a request without `user` then fails with `401`. Anonymous requests cannot be budgeted, blocked or attributed per end user.
    - Fix:
      ```bash
      yq -i '.proxy_config.general_settings.enforce_user_param = true' values.yaml \
        && helm upgrade litellm oci://ghcr.io/berriai/litellm-helm -n $NS -f values.yaml
      ```

- [ ] **Set a Default Budget for New Internal Users** - pass: `litellm_settings.default_internal_user_params` sets `max_budget` and `budget_duration`
  - **Console**:
    - Verify: Admin UI > Internal Users > Default User Settings > Max Budget (USD) and Reset Budget show values, not `Not set` and `No reset`
    - Fix: Admin UI > Internal Users > Default User Settings > Edit Settings > Max Budget (USD) > Reset Budget > Save Changes
  - **CLI**:
    - Verify:
      ```bash
      curl -s -H "Authorization: Bearer $MASTER_KEY" $LITELLM_HOST/get/internal_user_settings \
        | jq '.values | [.max_budget, .budget_duration]'
      ```
    - Expect: a dollar amount and a window such as `30d`, not two nulls. Otherwise every auto-provisioned user starts with unlimited spend.
    - Fix:
      ```bash
      kubectl set env deployment/litellm -n $NS STORE_MODEL_IN_DB=True \
        && kubectl rollout status deployment/litellm -n $NS \
        && curl -s -H "Authorization: Bearer $MASTER_KEY" $LITELLM_HOST/get/internal_user_settings \
             | jq '.values + {"max_budget":<usd>,"budget_duration":"30d"}' \
             | curl -s -X PATCH -H "Authorization: Bearer $MASTER_KEY" -H 'Content-Type: application/json' $LITELLM_HOST/update/internal_user_settings -d @-
      ```

- [ ] **Set a Default Budget for End Users** - pass: a budget object exists and `litellm_settings.max_end_user_budget_id` names it
  - **CLI**:
    - Verify:
      ```bash
      kubectl get configmap litellm-config -n $NS -o jsonpath='{.data.config\.yaml}' \
        | yq '.litellm_settings.max_end_user_budget_id'
      ```
    - Verify:
      ```bash
      curl -s -H "Authorization: Bearer $MASTER_KEY" $LITELLM_HOST/budget/list \
        | jq -r '.[] | select(.budget_id == "<budget-id>") | .max_budget'
      ```
    - Expect: the id from the first command and a dollar amount from the second, neither `null` nor empty. Otherwise one abusive end user of your product can spend the whole application budget, and an id naming a deleted budget enforces nothing.
    - Fix:
      ```bash
      curl -s -X POST -H "Authorization: Bearer $MASTER_KEY" -H 'Content-Type: application/json' $LITELLM_HOST/budget/new \
        -d '{"budget_id":"<budget-id>","max_budget":<usd>,"budget_duration":"30d","rpm_limit":<rpm>}' \
        && yq -i '.proxy_config.litellm_settings.max_end_user_budget_id = "<budget-id>"' values.yaml \
        && helm upgrade litellm oci://ghcr.io/berriai/litellm-helm -n $NS -f values.yaml
      ```

- [ ] **Alert on Budget Thresholds Before the Ceiling Blocks Requests** - pass: `general_settings.alerting` names a destination and `alert_types` is unset or includes `budget_alerts`
  - **CLI**:
    - Verify:
      ```bash
      kubectl get configmap litellm-config -n $NS -o jsonpath='{.data.config\.yaml}' \
        | yq -o=json -I=0 '[((.general_settings.alerting // []) | length), ((.general_settings.alert_types // ["budget_alerts"]) | contains(["budget_alerts"]))]'
      ```
    - Expect: `[1,true]`, or a larger first number. With no destination, or with an `alert_types` list that leaves `budget_alerts` out, nothing warns you at 85% and 95% of a budget and the first sign that a key is burning it is the invoice.
    - Fix:
      ```bash
      kubectl create secret generic litellm-alerting -n $NS --from-literal=SLACK_WEBHOOK_URL=<webhook-url> --dry-run=client -o yaml | kubectl apply -f - \
        && yq -i '.environmentSecrets = ((.environmentSecrets // []) + ["litellm-alerting"] | unique) | .proxy_config.general_settings.alerting = ((.proxy_config.general_settings.alerting // []) + ["slack"] | unique) | with(select(.proxy_config.general_settings.alert_types != null); .proxy_config.general_settings.alert_types = (.proxy_config.general_settings.alert_types + ["budget_alerts"] | unique))' values.yaml \
        && helm upgrade litellm oci://ghcr.io/berriai/litellm-helm -n $NS -f values.yaml
      ```

---

## Model Access

- [ ] **Do Not Expose Wildcard Models (a `*` entry routes any model name straight to the provider account)** - pass: no `model_list` entry has a `*` anywhere in its `litellm_params.model`
  - **CLI**:
    - Verify:
      ```bash
      kubectl get configmap litellm-config -n $NS -o jsonpath='{.data.config\.yaml}' \
        | yq '.model_list[] | select(.litellm_params.model | test("[*]")) | .model_name'
      ```
    - Expect: no output. A wildcard deployment bills whatever model a caller names on the provider account behind it, and `/model/info` shows it only as the expanded provider catalogue.
    - Fix:
      ```bash
      yq -i 'del(.proxy_config.model_list[] | select(.litellm_params.model | test("[*]")))' values.yaml \
        && helm upgrade litellm oci://ghcr.io/berriai/litellm-helm -n $NS -f values.yaml
      ```

- [ ] **Do Not Enable Client-Side Credentials (a request body could then point the proxy's provider key at a caller-chosen host)** - pass: `general_settings.allow_client_side_credentials` is unset or `false` and no model sets `configurable_clientside_auth_params`
  - **CLI**:
    - Verify:
      ```bash
      kubectl get configmap litellm-config -n $NS -o jsonpath='{.data.config\.yaml}' \
        | yq '[.general_settings.allow_client_side_credentials, [.model_list[].litellm_params.configurable_clientside_auth_params]]'
      ```
    - Expect: `null` or `false` in the first slot and only `null` entries in the second list. Otherwise a caller can redirect the proxy's outbound request, provider key included, to their own server.
    - Fix:
      ```bash
      yq -i 'del(.proxy_config.general_settings.allow_client_side_credentials) | del(.proxy_config.model_list[].litellm_params.configurable_clientside_auth_params)' values.yaml \
        && helm upgrade litellm oci://ghcr.io/berriai/litellm-helm -n $NS -f values.yaml
      ```

- [ ] **Do Not Forward Client or Provider Auth Headers to the Model Provider** - pass: `forward_client_headers_to_llm_api` and `forward_llm_provider_auth_headers` are `false` or unset in `general_settings`, in `litellm_settings` and in the UI settings, and `litellm_settings.model_group_settings` sets no `forward_client_headers_to_llm_api` list
  - **Console**:
    - Verify: Admin UI > Settings > Admin Settings > UI Settings > `Forward client headers to LLM API` and `Forward LLM provider auth headers` are both off
    - Fix: Admin UI > Settings > Admin Settings > UI Settings > switch `Forward client headers to LLM API` off > switch `Forward LLM provider auth headers` off
  - **CLI**:
    - Verify:
      ```bash
      kubectl get configmap litellm-config -n $NS -o jsonpath='{.data.config\.yaml}' \
        | yq '[.general_settings.forward_client_headers_to_llm_api, .general_settings.forward_llm_provider_auth_headers, .litellm_settings.forward_llm_provider_auth_headers, .litellm_settings.model_group_settings.forward_client_headers_to_llm_api]'
      ```
    - Verify:
      ```bash
      curl -s -H "Authorization: Bearer $MASTER_KEY" "$LITELLM_HOST/config/list?config_type=general_settings" \
        | jq -r '.[] | select(.field_name == "forward_client_headers_to_llm_api") | [.field_name, (.field_value | tostring)] | @tsv'
      ```
    - Verify:
      ```bash
      curl -s -H "Authorization: Bearer $MASTER_KEY" $LITELLM_HOST/get/ui_settings \
        | jq '.values | [.forward_client_headers_to_llm_api, .forward_llm_provider_auth_headers]'
      ```
    - Expect: three `null` or `false` values and then `null` from the first command, `forward_client_headers_to_llm_api` followed by `false` or `null` from the second, and `false` twice from the third. Forwarded auth headers let a caller swap their own provider key in for the governed one. One path has no switch: an Anthropic OAuth token (`Authorization: Bearer sk-ant-oat...`) sent beside `x-litellm-api-key` still replaces the deployment's key on `anthropic/` models whatever these settings say.
    - Fix:
      ```bash
      yq -i '.proxy_config.general_settings.forward_client_headers_to_llm_api = false | .proxy_config.general_settings.forward_llm_provider_auth_headers = false | .proxy_config.litellm_settings.forward_llm_provider_auth_headers = false | del(.proxy_config.litellm_settings.model_group_settings.forward_client_headers_to_llm_api)' values.yaml \
        && helm upgrade litellm oci://ghcr.io/berriai/litellm-helm -n $NS -f values.yaml
      ```
    - Fix:
      ```bash
      kubectl set env deployment/litellm -n $NS STORE_MODEL_IN_DB=True && kubectl rollout status deployment/litellm -n $NS \
        && curl -s -X PATCH -H "Authorization: Bearer $MASTER_KEY" -H 'Content-Type: application/json' $LITELLM_HOST/update/ui_settings \
             -d '{"forward_client_headers_to_llm_api":false,"forward_llm_provider_auth_headers":false}'
      ```

- [ ] **Require a Virtual Key on Every Pass-Through Endpoint** - pass: every `general_settings.pass_through_endpoints` entry has `auth: true`
  - **CLI**:
    - Verify:
      ```bash
      kubectl get configmap litellm-config -n $NS -o jsonpath='{.data.config\.yaml}' \
        | yq '.general_settings.pass_through_endpoints[] | select((.auth | tag) != "!!bool" or .auth != true) | .path'
      ```
    - Expect: no output. An entry with `auth: false` or a quoted `auth: 'true'` relays any caller to the target with your configured headers and keys, and an entry that omits `auth` accepts any valid key without that key's budget and route checks.
    - Fix:
      ```bash
      yq -i '.proxy_config.general_settings.pass_through_endpoints[].auth = true' values.yaml \
        && helm upgrade litellm oci://ghcr.io/berriai/litellm-helm -n $NS -f values.yaml
      ```

- [ ] **Do Not Run stdio MCP Servers Inside the Gateway (they execute as the proxy process with its secrets)** - pass: no `mcp_servers` entry uses `transport: stdio`
  - **CLI**:
    - Verify:
      ```bash
      kubectl get configmap litellm-config -n $NS -o jsonpath='{.data.config\.yaml}' \
        | yq '.mcp_servers | to_entries[] | select(.value.transport == "stdio") | .key'
      ```
    - Verify:
      ```bash
      curl -s -H "Authorization: Bearer $MASTER_KEY" $LITELLM_HOST/v1/mcp/server \
        | jq -r '.[] | select(.transport == "stdio") | [.server_id, .server_name] | @tsv'
      ```
    - Expect: no output from either command. A stdio server is a command the proxy spawns in its own container as the proxy's user, with the container's files and network reach.
    - Fix:
      ```bash
      yq -i 'del(.proxy_config.mcp_servers[] | select(.transport == "stdio"))' values.yaml \
        && helm upgrade litellm oci://ghcr.io/berriai/litellm-helm -n $NS -f values.yaml
      ```
    - Fix: `curl -s -X DELETE -H "Authorization: Bearer $MASTER_KEY" "$LITELLM_HOST/v1/mcp/server/<server-id>"`

- [ ] **Limit Request Body Size at the Ingress (the proxy's own size limit is licence-gated)** - pass: the ingress in front of the proxy caps request bodies, and `nginx.ingress.kubernetes.io/proxy-body-size` is not `0`
  - **CLI**:
    - Verify:
      ```bash
      kubectl get ingress litellm -n $NS -o jsonpath='{.metadata.name}{"\t"}{.metadata.annotations.nginx\.ingress\.kubernetes\.io/proxy-body-size}{"\n"}'
      ```
    - Expect: `litellm` and a bounded size such as `10m`, or `litellm` and an empty second field where the controller's own `1m` default applies; never `0`, and never `NotFound` - an ingress that does not exist caps nothing at all, and the item that terminates TLS in front of the proxy is what creates it. A limit of `0` turns the body-size check off, and one caller can then push multi-megabyte prompts through the tokenizer and the provider on every request.
    - Fix:
      ```bash
      yq -i '.ingress.annotations."nginx.ingress.kubernetes.io/proxy-body-size" = "<body-size>"' values.yaml \
        && helm upgrade litellm oci://ghcr.io/berriai/litellm-helm -n $NS -f values.yaml
      ```

---

## Routes & Network Exposure

- [ ] **Terminate TLS in Front of the Proxy and Enable HSTS** - pass: the proxy is reachable only through an HTTPS ingress bound to its host name, `PROXY_BASE_URL` is `https://<litellm-host>` and `LITELLM_ENABLE_HSTS` is `true`
  - **CLI**:
    - Verify:
      ```bash
      curl -s -D - -o /dev/null $LITELLM_HOST/health/liveliness | grep -i strict-transport-security
      ```
    - Verify: `kubectl get ingress litellm -n $NS -o jsonpath='{.spec.tls[*].hosts}'`
    - Verify:
      ```bash
      kubectl get deploy litellm -n $NS -o jsonpath='{.spec.template.spec.containers[0].env[?(@.name=="PROXY_BASE_URL")].value}'
      ```
    - Verify:
      ```bash
      kubectl get deploy litellm -n $NS -o jsonpath='{.spec.template.spec.containers[0].env[?(@.name=="LITELLM_ENABLE_HSTS")].value}'
      ```
    - Expect: a `strict-transport-security` header, your host under `tls`, `https://<litellm-host>` from the third command and `true` from the fourth (an ingress controller can add the header on its own; the fourth command reads the proxy's own switch). Otherwise bearer keys and prompts cross the network in clear text, and the proxy, which sees only the plain-HTTP hop behind the ingress, issues the Admin UI session cookie without `Secure`.
    - Fix:
      ```bash
      yq -i '.ingress.enabled = true | .ingress.hosts[0].host = "<litellm-host>" | .ingress.hosts[0].paths[0].path = "/" | .ingress.hosts[0].paths[0].pathType = "Prefix" | .ingress.tls[0].secretName = "<tls-secret>" | .ingress.tls[0].hosts[0] = "<litellm-host>" | .envVars.PROXY_BASE_URL = "https://<litellm-host>" | .envVars.LITELLM_ENABLE_HSTS = "true"' values.yaml \
        && helm upgrade litellm oci://ghcr.io/berriai/litellm-helm -n $NS -f values.yaml
      ```

- [ ] **Restrict CORS to Named Origins** - pass: `LITELLM_CORS_ORIGINS` lists your application origins and a foreign origin gets no `access-control-allow-origin`
  - **CLI**:
    - Verify:
      ```bash
      curl -s -D - -o /dev/null -H 'Origin: https://evil.example' $LITELLM_HOST/health/liveliness \
        | grep -i access-control-allow-origin
      ```
    - Expect: no output; never `*` or the foreign origin echoed back. A wildcard lets any web page drive the proxy from a visitor's browser.
    - Fix:
      ```bash
      kubectl set env deployment/litellm -n $NS LITELLM_CORS_ORIGINS=https://<app-origin>,https://<second-app-origin>
      ```

- [ ] **Turn Off the Swagger, ReDoc and OpenAPI Pages (they answer without a key and list every management route)** - pass: `NO_DOCS`, `NO_REDOC` and `NO_OPENAPI` are `True` and `/openapi.json` returns `404`
  - **CLI**:
    - Verify: `curl -s -o /dev/null -w '%{http_code}' $LITELLM_HOST/openapi.json`
    - Expect: `404`. The default serves the full route schema and a request form to anyone who can reach the port. `/routes` still lists every path, pass-through endpoints included, without a key and has no switch - block it at the ingress.
    - Fix: `kubectl set env deployment/litellm -n $NS NO_DOCS=True NO_REDOC=True NO_OPENAPI=True`

- [ ] **Serve Only the Inference Routes on Application-Facing Replicas** - pass: the application-facing release sets `general_settings.allowed_routes` to the inference and health routes, and a management route on its host name answers `403`
  - **CLI**:
    - Verify:
      ```bash
      curl -s -o /dev/null -w '%{http_code}' -H "Authorization: Bearer $MASTER_KEY" https://<app-host>/key/list
      ```
    - Expect: `403` from the application host name, while your own applications still get `200`. The list is a template and the comparison is an exact string match on the request path, so a route your applications call and you did not list - `/v1/responses`, `/v1/messages`, `/moderations`, `/rerank` - loses production traffic. The list is checked only on routes that take a key, so `/login`, `/v2/login`, `/onboarding/*`, the `/ui` bundle and `/get/ui_settings` still answer on the application host - block those paths at the ingress as well. A public replica that also serves /key, /team and /login turns any key leak into gateway administration.
    - Fix:
      ```bash
      cp values.yaml values-app.yaml \
        && yq -i '.proxy_config.general_settings.allowed_routes = ["/v1/chat/completions", "/chat/completions", "/v1/embeddings", "/embeddings", "/v1/models", "/models", "/health/liveliness", "/health/readiness"] | .ingress.enabled = true | .ingress.hosts[0].host = "<app-host>" | .ingress.hosts[0].paths[0].path = "/" | .ingress.hosts[0].paths[0].pathType = "Prefix" | .ingress.tls[0].hosts[0] = "<app-host>" | .ingress.tls[0].secretName = "<app-tls-secret>" | .masterkeySecretName = "litellm-masterkey" | .masterkeySecretKey = "masterkey"' values-app.yaml \
        && helm upgrade --install litellm-app oci://ghcr.io/berriai/litellm-helm -n $NS -f values-app.yaml
      ```

- [ ] **Disable the Admin UI on Application-Facing Replicas** - pass: `DISABLE_ADMIN_UI` is `True` on the application-facing release and its host name's `/litellm/.well-known/litellm-ui-config` reports `admin_ui_disabled` as `true`, while the `litellm` release you administer from reports `false`
  - **CLI**:
    - Verify:
      ```bash
      curl -s https://<app-host>/litellm/.well-known/litellm-ui-config | jq .admin_ui_disabled
      ```
    - Verify:
      ```bash
      curl -s $LITELLM_HOST/litellm/.well-known/litellm-ui-config | jq .admin_ui_disabled
      ```
    - Expect: `true` from the first command and `false` from the second. The variable only hides the UI: `POST /login` still issues an admin session cookie, so a public replica that answers `/login` is still a password-login surface. On the release you administer from it would also switch off the SSO sign-in, so keep it out of `values.yaml`; the Fix writes it to `values-app.yaml`, which the item before this one creates.
    - Fix:
      ```bash
      yq -i '.envVars.DISABLE_ADMIN_UI = "True"' values-app.yaml \
        && helm upgrade --install litellm-app oci://ghcr.io/berriai/litellm-helm -n $NS -f values-app.yaml
      ```

- [ ] **Restrict Which Namespaces Can Reach the Proxy (the proxy's own IP allowlist is licence-gated)** - pass: a NetworkPolicy selects the proxy pods and admits only the ingress controller and the application namespaces
  - **CLI**:
    - Verify:
      ```bash
      kubectl get networkpolicy -n $NS -o jsonpath='{range .items[*]}{.metadata.name}={.spec.podSelector.matchLabels}|types={.spec.policyTypes}|ingress={.spec.ingress}{"\n"}{end}'
      ```
    - Expect: a line whose selector is the proxy's own (`app.kubernetes.io/name`: `litellm`), whose `types` include `Ingress`, and in which every rule carries a `from` naming your ingress and application namespaces. A rule with no `from`, such as `[{}]`, admits every pod in the cluster, which is the state this item exists to remove; `ingress=` with nothing after it denies all ingress only when `types` include `Ingress` - an `Egress`-only policy restricts nothing on the way in.
    - Fix:
      ```bash
      kubectl apply -n $NS -f - <<'EOF'
      apiVersion: networking.k8s.io/v1
      kind: NetworkPolicy
      metadata:
        name: litellm-ingress
      spec:
        podSelector:
          matchLabels:
            app.kubernetes.io/name: litellm
        policyTypes: [Ingress]
        ingress:
          - from:
              - namespaceSelector:
                  matchLabels:
                    kubernetes.io/metadata.name: <ingress-namespace>
              - namespaceSelector:
                  matchLabels:
                    kubernetes.io/metadata.name: <application-namespace>
            ports:
              - port: 4000
      EOF
      ```

- [ ] **Do Not Turn Off Authentication on the Metrics Endpoint** - pass: `litellm_settings.require_auth_for_metrics_endpoint` is unset or `true`, `/metrics/` answers `401` without a key, and no second metrics listener is running
  - **CLI**:
    - Verify: `curl -s -o /dev/null -w '%{http_code}' $LITELLM_HOST/metrics/`
    - Verify:
      ```bash
      kubectl get deploy litellm -n $NS -o jsonpath='{.spec.template.spec.containers[0].env[?(@.name=="PROMETHEUS_METRICS_PORT")].value}'
      ```
    - Expect: `401` from the first command and no output from the second. An open metrics page lists key hashes, aliases, user emails and client IPs per model, and the chart's separate metrics port serves the same page with no key at all.
    - Fix:
      ```bash
      yq -i 'del(.proxy_config.litellm_settings.require_auth_for_metrics_endpoint) | .metricsServer.enabled = false | del(.envVars.PROMETHEUS_METRICS_PORT)' values.yaml \
        && helm upgrade litellm oci://ghcr.io/berriai/litellm-helm -n $NS -f values.yaml
      ```

- [ ] **Hide Deployment Details From the Health Route** - pass: `general_settings.health_check_details` is `false`
  - **CLI**:
    - Verify:
      ```bash
      kubectl get configmap litellm-config -n $NS -o jsonpath='{.data.config\.yaml}' \
        | yq '.general_settings.health_check_details'
      ```
    - Verify:
      ```bash
      curl -s -H "Authorization: Bearer $MASTER_KEY" $LITELLM_HOST/health \
        | jq '[.healthy_endpoints[], .unhealthy_endpoints[]] | any(keys - ["model", "model_id", "mode_error", "exception_status"] | length > 0)'
      ```
    - Expect: `false` from both commands (the first prints `null` while the key is unset, and unset means on). With details on, the admin view maps every model name to the provider endpoint behind it, and every key that can call `/health` gets an unhealthy deployment's request URL and error text.
    - Fix:
      ```bash
      yq -i '.proxy_config.general_settings.health_check_details = false' values.yaml \
        && helm upgrade litellm oci://ghcr.io/berriai/litellm-helm -n $NS -f values.yaml
      ```

- [ ] **Do Not Publish Model Groups to the Public AI Hub (the /public/model_hub route answers without a key; the UI toggle only redirects the dashboard page)** - pass: `litellm_settings.public_model_groups` is unset or empty and `/public/model_hub` returns `[]` without a key
  - **Console**:
    - Verify: Admin UI > AI Hub > Model Hub > the Public column shows `No` on every row
    - Fix: Admin UI > AI Hub > Model Hub > Select Models to Make Public > untick the groups to withdraw > Next > Make Public (the wizard cannot submit an empty selection and needs `STORE_MODEL_IN_DB`, and the list it saves then overrides `values.yaml`; to publish nothing, use the CLI Fixes)
  - **CLI**:
    - Verify: `curl -s $LITELLM_HOST/public/model_hub`
    - Expect: `[]`. Every published group is an inventory of the models, providers and prices you front, served to anyone who can reach the port.
    - Fix:
      ```bash
      yq -i 'del(.proxy_config.litellm_settings.public_model_groups)' values.yaml \
        && helm upgrade litellm oci://ghcr.io/berriai/litellm-helm -n $NS -f values.yaml
      ```
    - Fix:
      ```bash
      curl -s -X POST -H "Authorization: Bearer $MASTER_KEY" -H 'Content-Type: application/json' $LITELLM_HOST/model_group/make_public \
        -d '{"model_groups":[]}'
      ```

- [ ] **Expose the Proxy Only Through the Ingress** - pass: every Service in the namespace is `ClusterIP` with no `externalIPs`
  - **CLI**:
    - Verify:
      ```bash
      kubectl get svc -n $NS -o jsonpath='{range .items[*]}{.metadata.name}={.spec.type}{.spec.externalIPs}{"\n"}{end}'
      ```
    - Expect: every line ends in `ClusterIP`, with no address list after it. A NodePort, a LoadBalancer or an `externalIPs` entry on Postgres or Redis exposes the key store and the prompt cache without any LiteLLM authentication.
    - Fix:
      ```bash
      kubectl patch svc <service> -n $NS -p '{"spec":{"type":"ClusterIP","externalIPs":null,"loadBalancerSourceRanges":null}}'
      ```

---

## Logging, Audit & Redaction

- [ ] **Do Not Store Prompts and Responses in Spend Logs** - pass: `general_settings.store_prompts_in_spend_logs` is unset or `false` and `STORE_PROMPTS_IN_SPEND_LOGS` is set neither on the Deployment nor under the config's `environment_variables`
  - **Console**:
    - Verify: Admin UI > Settings > Admin Settings > Logging Settings > `Store Prompts in Spend Logs` is off (the switch does not show `STORE_PROMPTS_IN_SPEND_LOGS` from the environment; the second CLI Verify reads it)
    - Fix: Admin UI > Settings > Admin Settings > Logging Settings > switch `Store Prompts in Spend Logs` off > Save Settings (the pod that takes the save applies it at once unless `config.yaml` sets the key; only the database copy of `general_settings` keeps it, and a restarted pod or another replica reads that copy only when the store is on - `general_settings.store_model_in_db` in `config.yaml`, `STORE_MODEL_IN_DB` in the environment, or the Admin UI's `Store Model in DB` switch from the next start; on the chart's default deployment use the CLI Fix)
  - **CLI**:
    - Verify:
      ```bash
      kubectl get configmap litellm-config -n $NS -o jsonpath='{.data.config\.yaml}' \
        | yq '.general_settings.store_prompts_in_spend_logs // .environment_variables.STORE_PROMPTS_IN_SPEND_LOGS'
      ```
    - Verify:
      ```bash
      kubectl get deploy litellm -n $NS -o jsonpath='{.spec.template.spec.containers[0].env[?(@.name=="STORE_PROMPTS_IN_SPEND_LOGS")].value}'
      ```
    - Expect: `null` or `false` from the first command and no output from the second. Otherwise the model's responses, and the full request body of every failed call, are kept in the database beside the key store, readable by every admin.
    - Fix:
      ```bash
      yq -i 'del(.proxy_config.general_settings.store_prompts_in_spend_logs) | del(.proxy_config.environment_variables.STORE_PROMPTS_IN_SPEND_LOGS) | del(.envVars.STORE_PROMPTS_IN_SPEND_LOGS)' values.yaml \
        && helm upgrade litellm oci://ghcr.io/berriai/litellm-helm -n $NS -f values.yaml \
        && kubectl set env deployment/litellm -n $NS STORE_PROMPTS_IN_SPEND_LOGS-
      ```

- [ ] **Redact Messages From Every Logging Callback** - pass: `litellm_settings.turn_off_message_logging` is `true`
  - **CLI**:
    - Verify:
      ```bash
      kubectl get configmap litellm-config -n $NS -o jsonpath='{.data.config\.yaml}' \
        | yq '.litellm_settings.turn_off_message_logging'
      ```
    - Expect: `true`. Otherwise every callback destination holds the full prompt and completion text.
    - Fix:
      ```bash
      yq -i '.proxy_config.litellm_settings.turn_off_message_logging = true' values.yaml \
        && helm upgrade litellm oci://ghcr.io/berriai/litellm-helm -n $NS -f values.yaml
      ```

- [ ] **Stop Callers Suppressing Their Own Request Records** - pass: `litellm_settings.global_disable_no_log_param` is `true`
  - **CLI**:
    - Verify:
      ```bash
      kubectl get configmap litellm-config -n $NS -o jsonpath='{.data.config\.yaml}' \
        | yq '.litellm_settings.global_disable_no_log_param'
      ```
    - Expect: `true`. Otherwise any caller can add `no-log` to a request body and that call reaches no logging destination, so a stolen key can make its own traffic invisible to the callback trail.
    - Fix:
      ```bash
      yq -i '.proxy_config.litellm_settings.global_disable_no_log_param = true' values.yaml \
        && helm upgrade litellm oci://ghcr.io/berriai/litellm-helm -n $NS -f values.yaml
      ```

- [ ] **Redact Key and User Identifiers From Langfuse, Langsmith and Logfire Traces** - pass: `litellm_settings.redact_user_api_key_info` is `true`
  - **CLI**:
    - Verify:
      ```bash
      kubectl get configmap litellm-config -n $NS -o jsonpath='{.data.config\.yaml}' \
        | yq '.litellm_settings.redact_user_api_key_info'
      ```
    - Expect: `true`. Otherwise every trace in those three stores carries the key hash, user id, user email and team id of the caller; object-store and APM destinations receive those fields whatever this flag says, so restrict who can read them.
    - Fix:
      ```bash
      yq -i '.proxy_config.litellm_settings.redact_user_api_key_info = true' values.yaml \
        && helm upgrade litellm oci://ghcr.io/berriai/litellm-helm -n $NS -f values.yaml
      ```

- [ ] **Redact Messages From Exceptions** - pass: `litellm_settings.redact_messages_in_exceptions` is `true`
  - **CLI**:
    - Verify:
      ```bash
      kubectl get configmap litellm-config -n $NS -o jsonpath='{.data.config\.yaml}' \
        | yq '.litellm_settings.redact_messages_in_exceptions'
      ```
    - Expect: `true`. Otherwise a provider exception quotes the failing request's messages into the debug log line and into the alert sent to your chat channel, where a wider audience reads them than reads the spend table.
    - Fix:
      ```bash
      yq -i '.proxy_config.litellm_settings.redact_messages_in_exceptions = true' values.yaml \
        && helm upgrade litellm oci://ghcr.io/berriai/litellm-helm -n $NS -f values.yaml
      ```

- [ ] **Turn Off Failure-Row Storage in the Database (failed requests are otherwise recorded with their exception text)** - pass: `general_settings.disable_error_logs` is `true`
  - **CLI**:
    - Verify:
      ```bash
      kubectl get configmap litellm-config -n $NS -o jsonpath='{.data.config\.yaml}' \
        | yq '.general_settings.disable_error_logs'
      ```
    - Expect: `true`. Otherwise every failed request leaves a failure row with its exception text in the key-store database.
    - Fix:
      ```bash
      yq -i '.proxy_config.general_settings.disable_error_logs = true' values.yaml \
        && helm upgrade litellm oci://ghcr.io/berriai/litellm-helm -n $NS -f values.yaml
      ```

- [ ] **Enable Audit Logs (Enterprise)** - pass: on a licensed proxy `litellm_settings.store_audit_logs` is `true` and `/audit` reports a non-zero `total` after a key or team change
  - **CLI**:
    - Verify:
      ```bash
      curl -s -H "Authorization: Bearer $MASTER_KEY" "$LITELLM_HOST/audit?page_size=1" | jq .total
      ```
    - Expect: a number greater than `0` after a key or team change. An unlicensed proxy writes no audit rows whatever the flag says; without them no key, team or model change is attributable.
    - Fix:
      ```bash
      yq -i '.proxy_config.litellm_settings.store_audit_logs = true' values.yaml \
        && helm upgrade litellm oci://ghcr.io/berriai/litellm-helm -n $NS -f values.yaml
      ```

- [ ] **Alert on Key, Team and User Changes (service-account keys, regenerated keys and team membership changes raise no alert)** - pass: `general_settings.alerting` includes `slack` or `ms_teams` and `alert_types` includes the nine key, team and user change events
  - **CLI**:
    - Verify:
      ```bash
      kubectl get configmap litellm-config -n $NS -o jsonpath='{.data.config\.yaml}' \
        | yq -o=json -I=0 '[([(.general_settings.alerting // [])[] | select(. == "slack" or . == "ms_teams")] | length), ([.general_settings.alert_types[] | select(. == "new_virtual_key_created" or . == "virtual_key_updated" or . == "virtual_key_deleted" or . == "new_team_created" or . == "team_updated" or . == "team_deleted" or . == "new_internal_user_created" or . == "internal_user_updated" or . == "internal_user_deleted")] | length)]'
      ```
    - Expect: `[1,9]`, or `[2,9]` with both Slack and Teams. `email` and `webhook` destinations never receive these events, and without a Slack or Teams destination a key minted through a stolen admin session goes unnoticed until the bill arrives.
    - Fix:
      ```bash
      kubectl create secret generic litellm-alerting -n $NS --from-literal=SLACK_WEBHOOK_URL=<webhook-url> --dry-run=client -o yaml | kubectl apply -f - \
        && yq -i '.environmentSecrets = ((.environmentSecrets // []) + ["litellm-alerting"] | unique) | .proxy_config.general_settings.alerting = ((.proxy_config.general_settings.alerting // []) + ["slack"] | unique) | .proxy_config.general_settings.alert_types = ((.proxy_config.general_settings.alert_types // []) + ["llm_exceptions", "llm_too_slow", "llm_requests_hanging", "budget_alerts", "spend_reports", "failed_tracking_spend", "user_spend_thresholds", "db_exceptions", "daily_reports", "cooldown_deployment", "new_model_added", "model_deprecation_warnings", "outage_alerts", "region_outage_alerts", "fallback_reports", "new_virtual_key_created", "virtual_key_updated", "virtual_key_deleted", "new_team_created", "team_updated", "team_deleted", "new_internal_user_created", "internal_user_updated", "internal_user_deleted"] | unique)' values.yaml \
        && helm upgrade litellm oci://ghcr.io/berriai/litellm-helm -n $NS -f values.yaml
      ```

- [ ] **Ship Request Records to a Log Store You Control** - pass: `litellm_settings.success_callback` and `failure_callback`, or `callbacks`, name a destination outside the proxy database
  - **Console**:
    - Verify: Admin UI > Settings > Logging & Alerts > Logging Callbacks > Active Logging Callbacks lists your destination with Mode `Success & Failure`, or in two rows with Mode `Success` and `Failure` (a row named `s3 Bucket (AWS)` is the legacy `s3` logger and ships no failures; the S3 logger this page sets shows as `s3_v2`)
    - Fix: Admin UI > Settings > Logging & Alerts > Logging Callbacks > Add Callback > Callback > choose the destination > enter its credentials > Add Callback (the form sets the success side only and writes the database copy of `litellm_settings`, which the proxy reads back only when the store is on - `general_settings.store_model_in_db` in `config.yaml`, `STORE_MODEL_IN_DB` in the environment, or the Admin UI's `Store Model in DB` switch from the next start; on the chart's default deployment use the CLI Fix)
  - **CLI**:
    - Verify:
      ```bash
      kubectl get configmap litellm-config -n $NS -o jsonpath='{.data.config\.yaml}' \
        | yq -o=json -I=0 '.litellm_settings | [(.success_callback // .callbacks), (.failure_callback // .callbacks)]'
      ```
    - Expect: both lists name your destination, such as `[["s3_v2"],["s3_v2"]]`, never `[null,null]` and never the legacy `s3`, which ships successes only. Records that exist only in the proxy database vanish with it.
    - Fix:
      ```bash
      yq -i '.proxy_config.litellm_settings.success_callback = (((.proxy_config.litellm_settings.success_callback // []) - ["s3"]) + ["s3_v2"] | unique) | .proxy_config.litellm_settings.failure_callback = (((.proxy_config.litellm_settings.failure_callback // []) - ["s3"]) + ["s3_v2"] | unique) | .proxy_config.litellm_settings.s3_callback_params.s3_bucket_name = "<bucket>" | .proxy_config.litellm_settings.s3_callback_params.s3_region_name = "<region>"' values.yaml \
        && helm upgrade litellm oci://ghcr.io/berriai/litellm-helm -n $NS -f values.yaml
      ```

- [ ] **Set a Retention Period for Spend Logs** - pass: `general_settings.maximum_spend_logs_retention_period` is set to the window your policy allows
  - **Console**:
    - Verify: Admin UI > Settings > Admin Settings > Logging Settings > `Maximum Spend Logs Retention Period (Optional)` shows your window (without the store, a window saved here stays on this screen after a restart but is no longer enforced; there, trust the CLI Verify)
    - Fix: Admin UI > Settings > Admin Settings > Logging Settings > `Maximum Spend Logs Retention Period (Optional)` > enter the window such as `90d` > Save Settings (the pod that takes the save applies it at once, but only the database copy of `general_settings` keeps it, and a restarted pod or another replica reads that copy only when the store is on - `general_settings.store_model_in_db` in `config.yaml`, `STORE_MODEL_IN_DB` in the environment, or the Admin UI's `Store Model in DB` switch from the next start; on the chart's default deployment use the CLI Fix)
  - **CLI**:
    - Verify:
      ```bash
      kubectl get configmap litellm-config -n $NS -o jsonpath='{.data.config\.yaml}' \
        | yq '.general_settings.maximum_spend_logs_retention_period'
      ```
    - Expect: a duration such as `90d`, not `null`. Unset, every request row with its caller IP is kept forever.
    - Fix:
      ```bash
      yq -i '.proxy_config.general_settings.maximum_spend_logs_retention_period = "90d"' values.yaml \
        && helm upgrade litellm oci://ghcr.io/berriai/litellm-helm -n $NS -f values.yaml
      ```

- [ ] **Run the Proxy in Production Mode and Ship No .env File (the database client reads a .env from the working directory in every mode)** - pass: `LITELLM_MODE` is `PRODUCTION` and neither `/app/.env` nor `/app/prisma/.env` exists in the container
  - **CLI**:
    - Verify:
      ```bash
      kubectl exec deployment/litellm -n $NS -- sh -c 'printenv LITELLM_MODE; ls /app/.env /app/prisma/.env 2>&1'
      ```
    - Expect: `PRODUCTION`, then `No such file or directory` for both paths. On current releases the database client loads a .env from /app and from /app/prisma in every mode, so a stray file in the image or a volume silently becomes configuration, keys included. The second Fix clears the running container only: remove the file from the image or unmount the volume that carries it, or it is back on the next restart and on every replica the exec did not reach.
    - Fix:
      ```bash
      yq -i '.envVars.LITELLM_MODE = "PRODUCTION"' values.yaml \
        && helm upgrade litellm oci://ghcr.io/berriai/litellm-helm -n $NS -f values.yaml
      ```
    - Fix: `kubectl exec deployment/litellm -n $NS -- rm -f /app/.env /app/prisma/.env`

- [ ] **Log at Error Level in JSON (debug and verbose logs print prompts and key fragments)** - pass: `LITELLM_LOG` is `ERROR`, `JSON_LOGS` is `true` and `litellm_settings.set_verbose` is unset
  - **CLI**:
    - Verify:
      ```bash
      kubectl exec deployment/litellm -n $NS -- sh -c 'printenv | grep -E "^(LITELLM_LOG|JSON_LOGS)="'
      ```
    - Verify:
      ```bash
      kubectl get configmap litellm-config -n $NS -o jsonpath='{.data.config\.yaml}' \
        | yq '.litellm_settings.set_verbose'
      ```
    - Expect: `LITELLM_LOG=ERROR` and `JSON_LOGS=true` from the first command and `null` from the second. Debug and verbose output puts prompts and key fragments into the log pipeline, and `set_verbose` prints them whatever the log level says.
    - Fix:
      ```bash
      yq -i '.envVars.LITELLM_LOG = "ERROR" | .envVars.JSON_LOGS = "true" | del(.proxy_config.litellm_settings.set_verbose)' values.yaml \
        && helm upgrade litellm oci://ghcr.io/berriai/litellm-helm -n $NS -f values.yaml
      ```

- [ ] **Require a Password and TLS on the Redis Behind the Proxy** - pass: every Redis source the proxy reads, the database-persisted one included, names a TLS endpoint with a password - a `rediss` `REDIS_URL` that carries one, or `REDIS_HOST` with `REDIS_SSL` `true` and `REDIS_PASSWORD` from a Secret - and `config.yaml` names no plaintext Redis
  - **CLI**:
    - Verify:
      ```bash
      kubectl exec deployment/litellm -n $NS -- sh -c 'printenv REDIS_URL | cut -d: -f1; printenv REDIS_URL | grep -qE "^[a-z]+://[^/@]*:[^/@]+@" && echo password || echo no-password'
      ```
    - Verify:
      ```bash
      kubectl exec deployment/litellm -n $NS -- sh -c 'printenv | grep -oE "^REDIS_(HOST|PASSWORD|SSL)=" ; printenv REDIS_SSL'
      ```
    - Verify:
      ```bash
      kubectl get deploy litellm -n $NS -o jsonpath='{range .spec.template.spec.containers[0].env[?(@.value)]}{.name}{"\n"}{end}' | grep -E '^REDIS_(URL|PASSWORD)$'
      ```
    - Verify:
      ```bash
      kubectl get configmap litellm-config -n $NS -o jsonpath='{.data.config\.yaml}' \
        | yq '[.general_settings.coordination_redis, .litellm_settings.cache_params]'
      ```
    - Verify:
      ```bash
      curl -s -H "Authorization: Bearer $MASTER_KEY" $LITELLM_HOST/coordination_redis/settings | jq -c '{source, ssl: .values.ssl, password_set: (.values.password != null), url_set: (.values.url != null)}'
      ```
    - Expect: `rediss` and `password` from the first command, or `no-password` alone from the first and all three variable names and `true` from the second; nothing from the third, which names a password or url written as a literal `value:`; two `null`s from the fourth unless the block names the same TLS endpoint; and from the fifth a `source` that is the store you configured, with `ssl` and `password_set` true - or `url_set` true for a `rediss` url that carries the password - when it is `coordination_redis`. A `REDIS_URL` from a Secret under `environmentSecrets:` outranks `REDIS_HOST`, so delete it from that Secret; `REDIS_URL-` removes only a literal entry. A plaintext or unauthenticated Redis exposes cached prompts and the shared budget counters.
    - Fix:
      ```bash
      kubectl create secret generic litellm-redis -n $NS --from-literal=REDIS_PASSWORD=<redis-password> --dry-run=client -o yaml | kubectl apply -f - \
        && kubectl set env deployment/litellm -n $NS --from=secret/litellm-redis \
             REDIS_HOST=<redis-host> REDIS_PORT=<redis-port> REDIS_SSL=true REDIS_URL-
      ```

---

## Guardrails & Secret Managers

- [ ] **Run a PII-Masking Guardrail on Every Request by Default** - pass: a `presidio` guardrail with `mode: pre_call`, `default_on: true` and a `presidio_filter_scope` other than `output` is configured
  - **CLI**:
    - Verify:
      ```bash
      kubectl get configmap litellm-config -n $NS -o jsonpath='{.data.config\.yaml}' \
        | yq '.guardrails[] | select(.litellm_params.guardrail == "presidio" and .litellm_params.default_on == true and ([.litellm_params.mode] | flatten | contains(["pre_call"])) and (.litellm_params.presidio_filter_scope // "both") != "output") | .guardrail_name'
      ```
    - Expect: the guardrail's name. Without `pre_call` and `default_on`, or with `presidio_filter_scope: output`, masking either happens after the prompt has reached the provider or depends on every key and request opting in.
    - Fix:
      ```bash
      yq -i 'del(.proxy_config.guardrails[] | select(.guardrail_name == "pii-masking")) | .proxy_config.guardrails += [{"guardrail_name": "pii-masking", "litellm_params": {"guardrail": "presidio", "mode": "pre_call", "default_on": true, "pii_entities_config": {"CREDIT_CARD": "MASK", "EMAIL_ADDRESS": "MASK", "PHONE_NUMBER": "MASK"}}}] | .envVars.PRESIDIO_ANALYZER_API_BASE = "http://<presidio-analyzer>:5002" | .envVars.PRESIDIO_ANONYMIZER_API_BASE = "http://<presidio-anonymizer>:5001"' values.yaml \
        && helm upgrade litellm oci://ghcr.io/berriai/litellm-helm -n $NS -f values.yaml
      ```

- [ ] **Do Not Run Custom-Code Guardrails Inside the Proxy (the in-process sandbox has been escaped before)** - pass: no guardrail in `config.yaml` or in the database uses `guardrail: custom_code`
  - **CLI**:
    - Verify:
      ```bash
      kubectl get configmap litellm-config -n $NS -o jsonpath='{.data.config\.yaml}' \
        | yq '.guardrails[] | select(.litellm_params.guardrail == "custom_code") | .guardrail_name'
      ```
    - Verify:
      ```bash
      curl -s -H "Authorization: Bearer $MASTER_KEY" "$LITELLM_HOST/v2/guardrails/list" \
        | jq -r '.guardrails[] | select(.litellm_params.guardrail == "custom_code") | "\(.guardrail_name) \(.guardrail_definition_location) \(.guardrail_id)"'
      ```
    - Expect: no output from either command. In-process guardrail code runs with the proxy's provider keys and database connection.
    - Fix:
      ```bash
      yq -i 'del(.proxy_config.guardrails[] | select(.litellm_params.guardrail == "custom_code"))' values.yaml \
        && helm upgrade litellm oci://ghcr.io/berriai/litellm-helm -n $NS -f values.yaml
      ```
    - Fix: `curl -s -X DELETE -H "Authorization: Bearer $MASTER_KEY" "$LITELLM_HOST/guardrails/<guardrail-id>"`

- [ ] **Reference Provider Keys From Secrets, Never as Literals in config.yaml** - pass: every `litellm_params.api_key` in the rendered config starts with `os.environ/` and the variable comes from a Kubernetes Secret
  - **CLI**:
    - Verify:
      ```bash
      kubectl get configmap litellm-config -n $NS -o jsonpath='{.data.config\.yaml}' \
        | yq '.model_list[].litellm_params.api_key | select(. != null)' | grep -v '^os\.environ/'
      ```
    - Verify:
      ```bash
      { kubectl get deploy litellm -n $NS -o jsonpath='{range .spec.template.spec.containers[0].env[?(@.value)]}{.name}{"\n"}{end}'
        kubectl get configmap litellm-config -n $NS -o jsonpath='{.data.config\.yaml}' | yq '.environment_variables // {} | to_entries[] | select(.value | to_string | test("^os.environ/") | not) | .key'
      } | grep -xF "$(kubectl get configmap litellm-config -n $NS -o jsonpath='{.data.config\.yaml}' | yq '.model_list[].litellm_params.api_key | select(. != null) | sub("^os.environ/"; "")')"
      ```
    - Expect: no output from either command. A literal key in the ConfigMap or in the Deployment's `env` is readable by anyone with namespace read access and lands in every backup.
    - Fix:
      ```bash
      kubectl create secret generic litellm-provider-keys -n $NS --from-literal=OPENAI_API_KEY=<provider-key> \
        && yq -i '(.proxy_config.model_list[] | select(has("litellm_params") and (.litellm_params | has("api_key")) and (.litellm_params.api_key | test("^os.environ/") | not)) | .litellm_params.api_key) = "os.environ/OPENAI_API_KEY" | .environmentSecrets = ((.environmentSecrets // []) + ["litellm-provider-keys"] | unique) | del(.proxy_config.environment_variables.OPENAI_API_KEY) | del(.envVars.OPENAI_API_KEY) | del(.extraEnvVars[] | select(.name == "OPENAI_API_KEY"))' values.yaml \
        && helm upgrade litellm oci://ghcr.io/berriai/litellm-helm -n $NS -f values.yaml \
        && kubectl set env deployment/litellm -n $NS OPENAI_API_KEY-
      ```

---

## Deployment & Upgrades

- [ ] **Pin a Signed Release Image and Verify Its Signature Before Rollout** - pass: the Deployment runs a vendor image (`ghcr.io/berriai/litellm` or `ghcr.io/berriai/litellm-non_root`) at a release tag or digest, never a moving tag, and `cosign verify` passed for it
  - **CLI**:
    - Verify: `kubectl get deploy litellm -n $NS -o jsonpath='{.spec.template.spec.containers[0].image}'`
    - Verify:
      ```bash
      cosign verify --key https://raw.githubusercontent.com/BerriAI/litellm/<release-tag>/cosign.pub \
        $(kubectl get deploy litellm -n $NS -o jsonpath='{.spec.template.spec.containers[0].image}')
      ```
    - Expect: a release tag or an `@sha256:` digest from the first command, never `latest`, `main-latest` or `main-stable`, and `The signatures were verified against the specified public key` from the second, which `cosign` writes to stderr beside the signature payload on stdout. A moving tag can change under you, and malicious releases have been published before.
    - Fix:
      ```bash
      cosign verify --key https://raw.githubusercontent.com/BerriAI/litellm/<release-tag>/cosign.pub "$(yq '.image.repository // "ghcr.io/berriai/litellm"' values.yaml):<release-tag>" \
        && yq -i '.image.tag = "<release-tag>"' values.yaml \
        && helm upgrade litellm oci://ghcr.io/berriai/litellm-helm -n $NS -f values.yaml
      ```

- [ ] **Run the Non-Root Image With a Restricted Security Context** - pass: the proxy container runs as uid `65534` with `runAsNonRoot` and `allowPrivilegeEscalation: false`
  - **CLI**:
    - Verify: `kubectl exec deployment/litellm -n $NS -- id -u`
    - Verify: `kubectl get deploy litellm -n $NS -o jsonpath='{.spec.template.spec.containers[0].securityContext}'`
    - Expect: `65534` and a securityContext with `runAsNonRoot: true` and `allowPrivilegeEscalation: false`. The default image runs the listener as root.
    - Fix:
      ```bash
      yq -i '.image.repository = "ghcr.io/berriai/litellm-non_root" | .securityContext.runAsNonRoot = true | .securityContext.runAsUser = 65534 | .securityContext.allowPrivilegeEscalation = false' values.yaml \
        && helm upgrade litellm oci://ghcr.io/berriai/litellm-helm -n $NS -f values.yaml
      ```

- [ ] **Upgrade the Proxy to the Latest Release** - pass: the image the Deployment runs resolves to the latest release tag on the vendor's releases page, or to that release's digest
  - **CLI**:
    - Verify: `kubectl get deploy litellm -n $NS -o jsonpath='{.spec.template.spec.containers[0].image}'`
    - Verify:
      ```bash
      curl -s https://api.github.com/repos/BerriAI/litellm/releases/latest | jq -re '.tag_name // error("rate limited")'
      ```
    - Verify:
      ```bash
      cosign verify --key https://raw.githubusercontent.com/BerriAI/litellm/<release-tag>/cosign.pub "$(yq '.image.repository // "ghcr.io/berriai/litellm"' values.yaml):<release-tag>" 2>/dev/null \
        | jq -r '.[0].critical.image."docker-manifest-digest"'
      ```
    - Expect: the two strings name the same release, or - if you pinned a digest - the third command, run with the tag the second printed, prints the `sha256:` digest the first shows after `@`. An old release keeps every published authentication and injection advisory live.
    - Fix:
      ```bash
      cosign verify --key https://raw.githubusercontent.com/BerriAI/litellm/<release-tag>/cosign.pub "$(yq '.image.repository // "ghcr.io/berriai/litellm"' values.yaml):<release-tag>" \
        && yq -i '.image.tag = "<release-tag>"' values.yaml \
        && helm upgrade litellm oci://ghcr.io/berriai/litellm-helm -n $NS -f values.yaml
      ```
