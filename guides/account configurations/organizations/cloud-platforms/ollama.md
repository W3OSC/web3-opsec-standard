<!--
id: ollama-organization-configuration
type: CONFIGURATION
scope: ORGANIZATION
-->

<div align="center">
  <img src="../../../../images/guides/ollama.svg" alt="Ollama Logo" width="64" height="64">
  <h2><a href="https://ollama.com/" target="_blank" rel="noopener noreferrer">Ollama</a> Configuration Guide</h2>
  <p><em>Bind, Origins, Cloud, Provenance, Proxy, Kubernetes and Workstation controls for self-hosted Ollama</em></p>
</div>

---

## How to Use This Guide

Each item states its **pass** condition, then gives **CLI** steps (`systemctl` and drop-in files on the Ollama host, `docker` on a container host, `kubectl` against the serving namespace, `nginx` on the proxy host and `launchctl` on macOS workstations) to **Verify** and **Fix** it; the workstation items that the Ollama desktop app's Settings screen governs also give **Console** steps. Under CLI, **Expect** is the output that means it passes. The Ollama server has no settings console: it is configured through environment variables and the files in front of it, so every server, proxy and Kubernetes item is CLI-only. An item passes only when every host, process, namespace and workstation the command returns meets the condition.

#### Prerequisites

- Ollama server items assume the vendor's Linux systemd service (`ollama.service` running as user `ollama`) and are run on that host with `sudo`.
  - Each item writes its own drop-in file under `/etc/systemd/system/ollama.service.d/` so the files never overwrite each other; the vendor FAQ sets these variables with `systemctl edit ollama`, which writes `override.conf`, and drop-ins apply in name order with the later value winning, so first delete from `override.conf` any `OLLAMA_*` line an item sets.
  - On a Docker host pass it with `docker run -e`, except `OLLAMA_HOST`: the image binds every interface inside the container and the Docker item publishes the port on loopback instead; that item recreates the container, so carry over the image and the `--gpus`, `--device`, `--restart`, `-e` and `-v` flags it was started with.
  - On a Docker host read the variables with `docker inspect -f '{{range .Config.Env}}{{println .}}{{end}}' <ollama-container>` in place of `systemctl show ollama -p Environment`.
  - On a Docker host read the log with `docker logs <ollama-container> 2>&1` in place of `journalctl -u ollama --no-pager`.
  - On a Docker host run `ollama` as `docker exec <ollama-container> ollama`, and upgrade by pulling the new `<ollama-image>` and recreating the container the same way; the image runs as root, so the model-store item applies only to the systemd service.
- Kubernetes items assume one Ollama Deployment, Service and ServiceAccount in a namespace that holds only the serving workload (the NetworkPolicy items apply to every pod in it) and `kubectl` pointed at that cluster.
  - The vendor image `ollama/ollama` sets `OLLAMA_HOST=0.0.0.0:11434`, so the pod listens on its own address: the Ollama Server bind item is a host item, and in a cluster the Service and NetworkPolicy items carry the boundary.
  - `kubectl patch`, `kubectl set` and `kubectl apply -f -` change the live objects; write the same change into the manifests or Helm values so the next rollout keeps it, and a node taint into the node pool's configuration.
  - The NetworkPolicy items assume a network plugin that enforces NetworkPolicy; without one the objects are accepted and change nothing.
  - Set the Ollama Server variables on the Deployment with `kubectl set env deployment/<ollama-deployment> -n <namespace> <NAME>=<value>`.
  - Read them with `kubectl set env deployment/<ollama-deployment> -n <namespace> --list`.
  - Read the log with `kubectl logs deployment/<ollama-deployment> -n <namespace>`.
  - Run `ollama` as `kubectl exec deployment/<ollama-deployment> -n <namespace> -- ollama`.
  - Upgrade with `kubectl set image deployment/<ollama-deployment> -n <namespace> <serving-container>=<ollama-image>` in place of the install script.
  - Send the `127.0.0.1:11434` requests through `kubectl port-forward --address 127.0.0.1 deployment/<ollama-deployment> -n <namespace> 11434:11434`, left running in a second shell on a machine where nothing else listens on port 11434 (quit the Ollama app first): a local Ollama on `127.0.0.1:11434` would answer those requests in place of the pod.
  - A `kubectl patch` or `kubectl set` on the Deployment rolls its pods; on a node with one GPU the new pod can stay `Pending` while the old one keeps running, so follow each Deployment Fix with `kubectl rollout status deployment/<ollama-deployment> -n <namespace>`, and with a single replica set the Deployment's strategy to `Recreate` so the new pod can take the GPU.
- Proxy items assume nginx with `conf.d/` includes and a certificate already in place; the same allowlist transfers to any other reverse proxy. Ollama serves plain HTTP only, so TLS ends at the proxy.
- Workstation items use the macOS app's `launchctl` mechanism from the vendor's FAQ, and the app's Settings screen where a switch exists, and take effect after the app restarts.
  - `launchctl setenv` values do not survive a logout, so put the same lines in a LaunchAgent or login script, and quit any terminal or IDE that was running before the Fix.
  - On Windows set the same names as user environment variables and restart the app.
  - On a Linux desktop use the drop-in form of the Ollama Server section for server settings and the user's shell environment for the CLI's `OLLAMA_NOHISTORY`.
- Run every check that calls `127.0.0.1` or `localhost` with no HTTP proxy in the way: add `127.0.0.1,localhost` to `no_proxy` first, or `unset http_proxy https_proxy all_proxy HTTP_PROXY HTTPS_PROXY ALL_PROXY` and remove any `proxy` line from `~/.curlrc`.
  - curl sends loopback requests through a configured proxy, and a proxy that answers them itself can print a passing status.
- Placeholders in angle brackets (`<namespace>`, `<models-dir>`, `<proxy-host>`, `<ollama-container>`, `<ollama-image>`, `<model>` and the rest) are yours to fill; choose each value once and use it on every line. Repeat the whole guide for every serving host, cluster and workstation.

---

## Ollama Server

- [ ] **Bind Ollama to Loopback and Publish It Only Through the Proxy** - pass: `OLLAMA_HOST` on the service is `127.0.0.1:11434` and the only listener on port 11434 is on `127.0.0.1`
  - **CLI**:
    - Verify:
      ```bash
      ss -ltnp | grep ':11434'
      ```
    - Verify:
      ```bash
      systemctl show ollama -p Environment | grep -o 'OLLAMA_HOST=[^ ]*'
      ```
    - Expect: one `LISTEN` line with local address `127.0.0.1:11434`, such as `LISTEN 0 4096 127.0.0.1:11434 0.0.0.0:* users:(("ollama",pid=<pid>,fd=3))`, and none with `*:11434` or `0.0.0.0:11434`, then `OLLAMA_HOST=127.0.0.1:11434` from the second command. A routable bind puts the unauthenticated pull, push, create and delete endpoints in front of anyone who can reach the host.
    - Fix:
      ```bash
      sudo mkdir -p /etc/systemd/system/ollama.service.d && \
        printf '[Service]\nEnvironment="OLLAMA_HOST=127.0.0.1:11434"\n' | \
        sudo tee /etc/systemd/system/ollama.service.d/host.conf >/dev/null && \
        sudo systemctl daemon-reload && sudo systemctl restart ollama
      ```

- [ ] **Publish the Ollama Container Port on Loopback Only (a bare -p puts the unauthenticated API on every host interface)** - pass: the Ollama container publishes `11434/tcp` only on `127.0.0.1`
  - **CLI**:
    - Verify: `docker port <ollama-container> 11434/tcp`
    - Expect: `127.0.0.1:11434` alone; `0.0.0.0:11434`, `[::]:11434` or no mapping at all fails. A bare `-p 11434:11434` publishes the unauthenticated API on every host interface, routed past ufw.
    - Fix:
      ```bash
      docker rm -f <ollama-container> && \
        docker run -d --name <ollama-container> -v ollama:/root/.ollama -p 127.0.0.1:11434:11434 <ollama-image>
      ```

- [ ] **Set OLLAMA_ORIGINS to the Named Origins That May Call the Server (never a wildcard)** - pass: `OLLAMA_ORIGINS` on the service is unset or lists only the origins that may call it, never `*`, and a request from any other origin gets no `Access-Control-Allow-Origin` header
  - **CLI**:
    - Verify:
      ```bash
      curl -s --noproxy '*' -D - -o /dev/null -H 'Origin: https://evil.example' http://127.0.0.1:11434/api/version | \
        grep -i -e '^HTTP/' -e '^access-control-allow-origin'
      ```
    - Verify:
      ```bash
      systemctl show ollama -p Environment | grep -o 'OLLAMA_ORIGINS=[^ ]*'
      ```
    - Expect: `HTTP/1.1 403 Forbidden` and no `access-control-allow-origin` line from the first command (no output means nothing answered on 127.0.0.1:11434); then no output (no browser client calls the server) or `OLLAMA_ORIGINS=https://<app-origin>` with no `*` from the second. With a wildcard any web page a developer opens can drive the server and read the answer.
    - Fix:
      ```bash
      sudo mkdir -p /etc/systemd/system/ollama.service.d && \
        printf '[Service]\nEnvironment="OLLAMA_ORIGINS=https://<app-origin>"\n' | \
        sudo tee /etc/systemd/system/ollama.service.d/origins.conf >/dev/null && \
        sudo systemctl daemon-reload && sudo systemctl restart ollama
      ```

- [ ] **Disable Ollama Cloud Passthrough (prompts to cloud models and web search otherwise leave the host for ollama.com)** - pass: `OLLAMA_NO_CLOUD` on the service is `1` and the newest startup log line reads `Ollama cloud disabled: true`
  - **CLI**:
    - Verify:
      ```bash
      journalctl -u ollama --no-pager | grep 'Ollama cloud disabled' | tail -n 1
      ```
    - Verify:
      ```bash
      systemctl show ollama -p Environment | grep -o 'OLLAMA_NO_CLOUD=[^ ]*'
      ```
    - Expect: the first command's line ends `msg="Ollama cloud disabled: true"` (one line per start; the newest wins), then `OLLAMA_NO_CLOUD=1` from the second. With it `false`, a request naming a cloud model carries its prompt through your server to ollama.com.
    - Fix:
      ```bash
      sudo mkdir -p /etc/systemd/system/ollama.service.d && \
        printf '[Service]\nEnvironment="OLLAMA_NO_CLOUD=1"\n' | \
        sudo tee /etc/systemd/system/ollama.service.d/no-cloud.conf >/dev/null && \
        sudo systemctl daemon-reload && sudo systemctl restart ollama
      ```

- [ ] **Put the Model Store in a Directory Only the Service User Can Write** - pass: `OLLAMA_MODELS` on the service points at `<models-dir>`, owned `ollama:ollama` with mode `750`, and nothing under it is owned by another account or writable by group or others
  - **CLI**:
    - Verify: `stat -c '%U:%G %a' <models-dir>`
    - Verify:
      ```bash
      systemctl show ollama -p Environment | grep -o 'OLLAMA_MODELS=[^ ]*'
      ```
    - Verify: `sudo find <models-dir> ! -user ollama -o -perm /022`
    - Expect: `ollama:ollama 750` from the first command, then `OLLAMA_MODELS=<models-dir>`, then no output from the third. A store other accounts can write is where a poisoned model lands without touching the API.
    - Fix:
      ```bash
      sudo mkdir -p /etc/systemd/system/ollama.service.d && \
        printf '[Service]\nEnvironment="OLLAMA_MODELS=<models-dir>"\n' | \
        sudo tee /etc/systemd/system/ollama.service.d/models.conf >/dev/null && \
        sudo chown -R ollama:ollama <models-dir> && sudo chmod -R go-w,g-s <models-dir> && \
        sudo chmod 750 <models-dir> && \
        sudo systemctl daemon-reload && sudo systemctl restart ollama
      ```

- [ ] **Set Explicit Load, Concurrency and Queue Ceilings** - pass: `OLLAMA_MAX_LOADED_MODELS`, `OLLAMA_NUM_PARALLEL` and `OLLAMA_MAX_QUEUE` are all set to explicit values on the service
  - **CLI**:
    - Verify: `systemctl show ollama -p Environment`
    - Expect: one `Environment=` line carrying all three names, such as `Environment=PATH=... OLLAMA_HOST=127.0.0.1:11434 OLLAMA_MAX_LOADED_MODELS=2 OLLAMA_NUM_PARALLEL=2 OLLAMA_MAX_QUEUE=256`. At the defaults a hijacked endpoint fills available memory with resident models and a long queue, starving legitimate callers.
    - Fix:
      ```bash
      sudo mkdir -p /etc/systemd/system/ollama.service.d && \
        printf '[Service]\nEnvironment="OLLAMA_MAX_LOADED_MODELS=<n>" "OLLAMA_NUM_PARALLEL=<n>" "OLLAMA_MAX_QUEUE=<n>"\n' | \
        sudo tee /etc/systemd/system/ollama.service.d/limits.conf >/dev/null && \
        sudo systemctl daemon-reload && sudo systemctl restart ollama
      ```

- [ ] **Do Not Enable Request-Body Logging in Production (OLLAMA_DEBUG_LOG_REQUESTS writes every prompt and a replay script to a temp directory)** - pass: `OLLAMA_DEBUG_LOG_REQUESTS` is not set on the service and the newest `server config` startup log line reads `OLLAMA_DEBUG_LOG_REQUESTS:false`
  - **CLI**:
    - Verify:
      ```bash
      systemctl show ollama -p Environment | grep -c OLLAMA_DEBUG_LOG_REQUESTS
      ```
    - Verify:
      ```bash
      journalctl -u ollama --no-pager | grep 'msg="server config"' | tail -n 1 | grep -o 'OLLAMA_DEBUG_LOG_REQUESTS:[a-z]*'
      ```
    - Expect: `0` from the first command, then `OLLAMA_DEBUG_LOG_REQUESTS:false` from the second (the running server's newest startup line; no output means the command did not read this server's log). Left on after troubleshooting, every prompt your users send sits on disk in a temp directory with a replay script beside it.
    - Fix:
      ```bash
      sudo sed -i '/OLLAMA_DEBUG_LOG_REQUESTS/d' /etc/systemd/system/ollama.service.d/*.conf && \
        sudo systemctl daemon-reload && sudo systemctl restart ollama
      ```

- [ ] **Upgrade Ollama to a Patched Release** - pass: `/api/version` on the server reports the version of the release GitHub marks Latest for ollama/ollama
  - **CLI**:
    - Verify: `curl -s http://127.0.0.1:11434/api/version`
    - Verify:
      ```bash
      curl -s https://api.github.com/repos/ollama/ollama/releases/latest | grep '"tag_name"'
      ```
    - Expect: `{"version":"<x.y.z>"}` from the first command and `"tag_name": "v<x.y.z>",` from the second, the same version. An unpatched server let a crafted model upload read process memory with no credential at all.
    - Fix:
      ```bash
      curl -fsSL https://ollama.com/install.sh | sh
      ```

---

## Model Provenance & Loading

- [ ] **Pull Ollama Models Only From a Registry You Control, by Full Name (the default registry needs no credential and takes any name)** - pass: every model in `ollama list` is named `<registry-host>/<model-namespace>/<model>:<tag>`
  - **CLI**:
    - Verify:
      ```bash
      ollama list | awk -v h='<registry-host>/' 'NR==1 || index($1, h) != 1 || split($1, p, "/") != 3'
      ```
    - Expect: the header row alone (`NAME`, `ID`, `SIZE` and `MODIFIED`, each padded to its column's widest entry); every other line printed names a model not pulled from `<registry-host>` (the host is matched exactly as `ollama list` prints it, so write it in the same case), and no header row (an `Error:` line or nothing) means the command did not reach the server. A bare name resolves to the public registry with no credential on the server side, so any name a caller sends gets pulled.
    - Fix: `ollama rm <public-model>`
    - Fix: `ollama pull <registry-host>/<model-namespace>/<model>:<tag>`

---

## Reverse Proxy & Network Exposure

- [ ] **Publish Only the Ollama Inference Paths Through the Reverse Proxy (pull, push, create and delete stay unreachable)** - pass: the proxy forwards only `/api/chat`, `/api/generate`, `/api/embed`, `/api/embeddings`, `/api/tags`, `/api/show`, `/api/version` and `/v1/` to Ollama and answers `403` on every other path, and its server block is the `default_server` for port 443 and the only one on any port that reaches Ollama
  - **CLI**:
    - Verify:
      ```bash
      sudo nginx -T 2>/dev/null | grep -E '^[^#]*(listen[^;]*[ :]443[ ;]|11434)'
      ```
    - Verify:
      ```bash
      for p in api/pull api/push api/create api/delete api/copy api/blobs/sha256:0 api/ps api/status api/me api/experimental/web_search api/codex/x api/signout api/user/keys/x api/allowlist-probe-$RANDOM; do
        printf '%s %s %s\n' "$p" "$(curl -s -o /dev/null -w '%{http_code}' -X POST -d '{}' "https://<proxy-host>/$p")" \
          "$(curl -s -o /dev/null -w '%{http_code}' -X POST -d '{}' -H 'Host: localhost:11434' "https://<proxy-host>/$p")"; done
      ```
    - Expect: from the first command, `default_server` on exactly one line, the one that also carries `server_name <proxy-host>` and `proxy_pass http://127.0.0.1:11434`, no other line naming `11434`, and no `listen` naming an address; nginx routes a request on its Host header, and a Host no `server_name` matches goes to the default server for the port, so without this the second probe below is answered by another server block, and any other block that reaches `11434`, such as the vendor FAQ's `listen 80` example left in `sites-enabled/`, forwards every path on its own port where the loop below does not look. From the loop, every line ends in `403 403`, answered by the proxy itself; the second probe sends `Host: localhost:11434`, which a loopback-bound Ollama accepts, so a proxy that passes the client's Host header through cannot hide behind Ollama's own `403` for a foreign host; the last path is new on every run and no Ollama route serves it, so a `404` in either column means the proxy forwards paths it does not name. Every path the proxy forwards is unauthenticated on Ollama, so an open `/api/pull` or `/api/create` is model tampering from the internet.
    - Fix:
      ```bash
      auth=''; [ -f /etc/nginx/conf.d/ollama-auth.conf ] && auth='if ($ollama_authorized = 0) { return 401; } '
      printf 'server { listen 443 ssl default_server; server_name <proxy-host>; ssl_certificate <cert.pem>; ssl_certificate_key <key.pem>; location ~ ^/(api/(chat|generate|embed|embeddings|tags|show|version)|v1/) { %sproxy_pass http://127.0.0.1:11434; proxy_set_header Host localhost:11434; } location / { return 403; } }\n' "$auth" | \
        sudo tee /etc/nginx/conf.d/ollama.conf >/dev/null && sudo nginx -t && sudo nginx -s reload
      ```

- [ ] **Require a Bearer Token at the Proxy for Every Ollama Request (Ollama has no authentication of its own)** - pass: a request to any forwarded Ollama path without a known `Authorization: Bearer` token is answered `401`, and with it `200`
  - **CLI**:
    - Verify: `curl -s -o /dev/null -w '%{http_code}' https://<proxy-host>/api/version`
    - Verify:
      ```bash
      curl -s -o /dev/null -w '%{http_code}' -H 'Authorization: Bearer <token>' https://<proxy-host>/api/version
      ```
    - Expect: `401` from the first command and `200` from the second. Ollama has no server-side credential, so without a token at the proxy inference is open to anyone who can reach it.
    - Fix:
      ```bash
      printf 'map $http_authorization $ollama_authorized { default 0; "Bearer <token>" 1; }\n' | \
        sudo tee /etc/nginx/conf.d/ollama-auth.conf >/dev/null && \
        sudo sed -i 's|proxy_pass http://127.0.0.1:11434;|if ($ollama_authorized = 0) { return 401; } proxy_pass http://127.0.0.1:11434;|' /etc/nginx/conf.d/ollama.conf && \
        sudo nginx -t && sudo nginx -s reload
      ```

---

## Kubernetes Serving Isolation

- [ ] **Expose the Inference Service as ClusterIP Only** - pass: the Ollama Service has `spec.type` `ClusterIP` and no `spec.externalIPs`
  - **CLI**:
    - Verify: `kubectl get svc <ollama-service> -n <namespace> -o jsonpath='{.spec.type}{.spec.externalIPs}'`
    - Expect: `ClusterIP` and nothing after it. `LoadBalancer`, `NodePort` or an external IP publishes Ollama's unauthenticated API outside the cluster, past the gateway that authenticates it.
    - Fix:
      ```bash
      kubectl patch svc <ollama-service> -n <namespace> -p '{"spec":{"type":"ClusterIP","externalIPs":null}}'
      ```

- [ ] **Allow Ingress to the Serving Pods From the Gateway Namespace Only** - pass: a NetworkPolicy selecting the Ollama pods lists `Ingress` in `policyTypes` and allows traffic only from the gateway namespace on port `11434`, and no other NetworkPolicy in the namespace carries an ingress rule
  - **CLI**:
    - Verify:
      ```bash
      kubectl get networkpolicy inference-ingress -n <namespace> \
        -o jsonpath='{.spec.podSelector}{" "}{.spec.policyTypes}{" "}{.spec.ingress}'
      ```
    - Verify:
      ```bash
      kubectl get pods -n <namespace> -l app=<ollama-deployment> --field-selector=status.phase=Running -o name
      ```
    - Verify:
      ```bash
      kubectl get networkpolicy -n <namespace> -o jsonpath='{range .items[?(@.spec.ingress)]}{.metadata.name}{"\n"}{end}'
      ```
    - Verify: `kubectl rollout status deployment/<ollama-deployment> -n <namespace> --timeout=60s`
    - Expect: `{"matchLabels":{"app":"<ollama-deployment>"}} ["Ingress"] [{"from":[{"namespaceSelector":{"matchLabels":{"kubernetes.io/metadata.name":"<gateway-namespace>"}}}],"ports":[{"port":11434,"protocol":"TCP"}]}]` - one rule, one `from` entry - from the first command, one `pod/` line per running Ollama replica from the second (none means the policy selects no running pod), `inference-ingress` alone from the third, then `deployment "<ollama-deployment>" successfully rolled out` from the fourth (anything else, a timeout included, means an old, unlabelled pod may still be serving). Without the policy any pod in the cluster reaches Ollama's unauthenticated API directly, bypassing the authenticating proxy.
    - Fix:
      ```bash
      kubectl patch deployment <ollama-deployment> -n <namespace> \
        -p '{"spec":{"template":{"metadata":{"labels":{"app":"<ollama-deployment>"}}}}}' && \
        echo '{"apiVersion":"networking.k8s.io/v1","kind":"NetworkPolicy","metadata":{"name":"inference-ingress"},"spec":{"podSelector":{"matchLabels":{"app":"<ollama-deployment>"}},"policyTypes":["Ingress"],"ingress":[{"from":[{"namespaceSelector":{"matchLabels":{"kubernetes.io/metadata.name":"<gateway-namespace>"}}}],"ports":[{"protocol":"TCP","port":11434}]}]}}' | \
        kubectl apply -n <namespace> -f -
      ```
    - Fix:
      ```bash
      kubectl patch networkpolicy <other-ingress-policy> -n <namespace> --type=json -p '[{"op":"remove","path":"/spec/ingress"}]'
      ```

- [ ] **Default-Deny Egress From the Ollama Namespace and Allow Only DNS and the Model Registry** - pass: a NetworkPolicy with an empty `podSelector` lists `Egress` in `policyTypes` and allows only DNS to `kube-system` and the registry you pull Ollama models from, and no other NetworkPolicy in the namespace carries an egress rule
  - **CLI**:
    - Verify:
      ```bash
      kubectl get networkpolicy inference-egress -n <namespace> \
        -o jsonpath='{.spec.podSelector}{" "}{.spec.policyTypes}{" "}{.spec.egress}'
      ```
    - Verify:
      ```bash
      kubectl get networkpolicy -n <namespace> -o jsonpath='{range .items[?(@.spec.egress)]}{.metadata.name}{"\n"}{end}'
      ```
    - Expect: `{} ["Egress"] [{"ports":[{"port":53,"protocol":"UDP"},{"port":53,"protocol":"TCP"}],"to":[{"namespaceSelector":{"matchLabels":{"kubernetes.io/metadata.name":"kube-system"}}}]},{"ports":[{"port":443,"protocol":"TCP"}],"to":[{"ipBlock":{"cidr":"<model-registry-cidr>"}}]}]` and no other rule from the first command, then `inference-egress` alone from the second. With open egress a compromised server ships prompts anywhere, and a request that reaches a pull route fetches a model from any registry (DNS must stay allowed or resolution stops).
    - Fix:
      ```bash
      echo '{"apiVersion":"networking.k8s.io/v1","kind":"NetworkPolicy","metadata":{"name":"inference-egress"},"spec":{"podSelector":{},"policyTypes":["Egress"],"egress":[{"to":[{"namespaceSelector":{"matchLabels":{"kubernetes.io/metadata.name":"kube-system"}}}],"ports":[{"protocol":"UDP","port":53},{"protocol":"TCP","port":53}]},{"to":[{"ipBlock":{"cidr":"<model-registry-cidr>"}}],"ports":[{"protocol":"TCP","port":443}]}]}}' | \
        kubectl apply -n <namespace> -f -
      ```
    - Fix:
      ```bash
      kubectl patch networkpolicy <other-egress-policy> -n <namespace> --type=json -p '[{"op":"remove","path":"/spec/egress"}]'
      ```

- [ ] **Set GPU and Memory Limits on the Serving Pod** - pass: the Ollama container has a `memory` limit, plus an `nvidia.com/gpu` limit when the Deployment tolerates the `nvidia.com/gpu` taint, and every other container in the Ollama Deployment has a `memory` limit
  - **CLI**:
    - Verify:
      ```bash
      kubectl get deploy <ollama-deployment> -n <namespace> \
        -o jsonpath='{range .spec.template.spec.containers[*]}{.name}{" "}{.resources.limits}{"\n"}{end}'
      ```
    - Verify:
      ```bash
      kubectl get deploy <ollama-deployment> -n <namespace> \
        -o jsonpath='{.spec.template.spec.tolerations}'
      ```
    - Expect: `<serving-container> {"memory":"<memory>","nvidia.com/gpu":"<gpus>"}` when the second command prints an `nvidia.com/gpu` toleration, or `<serving-container> {"memory":"<memory>"}` when it prints none, then `<sidecar> {"memory":"<sidecar-memory>"}` for each other container, with a `cpu` key first where one is set. Without limits a runaway or hijacked pod takes the whole node, and with no GPU limit the image can see every GPU on it.
    - Fix:
      ```bash
      kubectl set resources deployment/<ollama-deployment> -n <namespace> -c <serving-container> --limits=memory=<memory>
      ```
    - Fix:
      ```bash
      kubectl set resources deployment/<ollama-deployment> -n <namespace> -c <serving-container> \
        --limits=nvidia.com/gpu=<gpus> --requests=nvidia.com/gpu=<gpus>
      ```
    - Fix:
      ```bash
      kubectl set resources deployment/<ollama-deployment> -n <namespace> -c <sidecar> --limits=memory=<sidecar-memory>
      ```

- [ ] **Reserve the GPU Nodes for the Serving Workload** - pass: every GPU node carries the `nvidia.com/gpu=present:NoSchedule` taint, and the Ollama Deployment tolerates it when Ollama serves on GPU
  - **CLI**:
    - Verify:
      ```bash
      kubectl get nodes -l <gpu-node-label> -o jsonpath='{range .items[*]}{.metadata.name}{" "}{.spec.taints}{"\n"}{end}'
      ```
    - Verify:
      ```bash
      kubectl get deploy <ollama-deployment> -n <namespace> \
        -o jsonpath='{.spec.template.spec.tolerations}'
      ```
    - Expect: one line per GPU node, the node name followed by a list containing `{"effect":"NoSchedule","key":"nvidia.com/gpu","value":"present"}` (a name with nothing after it is an untainted node and fails), from the first command, then `[{"effect":"NoSchedule","key":"nvidia.com/gpu","operator":"Exists"}]` from the second when Ollama serves on GPU, or no output when it serves on CPU (the toleration Fix replaces any tolerations the Deployment already carried, so re-add those in the same patch). Untainted, any workload schedules onto the most expensive and most credential-adjacent nodes in the estate.
    - Fix: `kubectl taint nodes -l <gpu-node-label> nvidia.com/gpu=present:NoSchedule --overwrite`
    - Fix:
      ```bash
      kubectl patch deployment <ollama-deployment> -n <namespace> \
        -p '{"spec":{"template":{"spec":{"tolerations":[{"key":"nvidia.com/gpu","operator":"Exists","effect":"NoSchedule"}]}}}}'
      ```

- [ ] **Disable Service-Account Token Automount on the Serving Pod (the server never calls the Kubernetes API, so a mounted token only helps an attacker)** - pass: the Ollama ServiceAccount has `automountServiceAccountToken: false`, and the Ollama Deployment runs as that account with `automountServiceAccountToken: false` in its pod template
  - **CLI**:
    - Verify: `kubectl get sa <ollama-sa> -n <namespace> -o jsonpath='{.automountServiceAccountToken}'`
    - Verify:
      ```bash
      kubectl get deploy <ollama-deployment> -n <namespace> \
        -o jsonpath='{.spec.template.spec.serviceAccountName}/{.spec.template.spec.automountServiceAccountToken}'
      ```
    - Expect: `false` from the first command, then `<ollama-sa>/false` from the second. Ollama never calls the Kubernetes API, so a mounted token is free cluster credentials for whoever gets code execution in the pod.
    - Fix:
      ```bash
      kubectl patch serviceaccount <ollama-sa> -n <namespace> -p '{"automountServiceAccountToken": false}' && \
        kubectl patch deployment <ollama-deployment> -n <namespace> \
        -p '{"spec":{"template":{"spec":{"serviceAccountName":"<ollama-sa>","automountServiceAccountToken":false}}}}'
      ```

---

## Developer Workstations

- [ ] **Remove Any OLLAMA_HOST Override on Workstations (the server then binds loopback only)** - pass: `OLLAMA_HOST` is not set for the app, `Expose Ollama to the network` is off in the app's Settings, and the only listener on port 11434 is on `127.0.0.1`
  - **Console**:
    - Verify: Ollama app > Settings > `Expose Ollama to the network` > the switch is off
    - Fix: Ollama app > Settings > `Expose Ollama to the network` > turn the switch off (the app restarts its server)
  - **CLI**:
    - Verify: `launchctl getenv OLLAMA_HOST`
    - Verify: `lsof -nP -iTCP:11434 -sTCP:LISTEN`
    - Expect: no output from the first command, then one `ollama` line ending `TCP 127.0.0.1:11434 (LISTEN)` from the second, never `*:11434`. A laptop set to `0.0.0.0` to test from a phone becomes an open model server on the next public network.
    - Fix: `launchctl unsetenv OLLAMA_HOST`

- [ ] **Remove Any OLLAMA_ORIGINS Override on Workstations (a wildcard origin lets any web page drive the local model server)** - pass: the app's server sends no `Access-Control-Allow-Origin` header to a foreign origin: `OLLAMA_ORIGINS` is not set in launchd and the app's stored `browser` flag is `0` (the default list already admits local origins and the app schemes)
  - **CLI**:
    - Verify:
      ```bash
      curl -s --noproxy '*' -D - -o /dev/null -H 'Origin: https://evil.example' http://127.0.0.1:11434/api/version | \
        grep -i -e '^HTTP/' -e '^access-control-allow-origin'
      ```
    - Verify: `launchctl getenv OLLAMA_ORIGINS`
    - Verify: `sqlite3 ~/Library/Application\ Support/Ollama/db.sqlite 'SELECT browser FROM settings;'`
    - Expect: `HTTP/1.1 403 Forbidden` and no `access-control-allow-origin` line from the first command (no output means the app's server is not running: start the app and read it again), an empty line (no value) from the second, and `0` from the third. A wildcard origin lets any web page the developer opens drive the local model server and read its answers.
    - Fix:
      ```bash
      pkill -x Ollama; while pgrep -x Ollama >/dev/null; do sleep 1; done; \
        launchctl unsetenv OLLAMA_ORIGINS && \
        sqlite3 ~/Library/Application\ Support/Ollama/db.sqlite 'UPDATE settings SET browser = 0;' && open -a Ollama
      ```

- [ ] **Turn Off Prompt History on Workstations (the CLI keeps every interactive prompt in ~/.ollama/history)** - pass: `OLLAMA_NOHISTORY` is `1` in the environment the `ollama` CLI starts in
  - **CLI**:
    - Verify: `launchctl getenv OLLAMA_NOHISTORY`
    - Verify: `printenv OLLAMA_NOHISTORY`
    - Expect: `1` from both commands, the second in a terminal app quit and reopened after the Fix. Otherwise every interactive prompt is appended to a plain file in the home directory, where pasted secrets and customer data end up.
    - Fix: `launchctl setenv OLLAMA_NOHISTORY 1`

- [ ] **Disable Cloud Passthrough on Workstations Unless It Is Approved (a cloud model name otherwise sends the developer's prompts and files to ollama.com)** - pass: `~/.ollama/server.json` sets `disable_ollama_cloud` to `true`
  - **Console**:
    - Verify: Ollama app > Settings > `Cloud` > the switch is off
    - Fix: Ollama app > Settings > `Cloud` > turn the switch off (the app writes ~/.ollama/server.json and restarts its server)
  - **CLI**:
    - Verify: `grep -o '"disable_ollama_cloud": *true' ~/.ollama/server.json`
    - Expect: `"disable_ollama_cloud": true`; after the app restarts its log reads `Ollama cloud disabled: true`. An integration that names a cloud model sends the developer's prompt and files to a third party through the local server.
    - Fix: `mkdir -p ~/.ollama && printf '{"disable_ollama_cloud": true}\n' > ~/.ollama/server.json`
