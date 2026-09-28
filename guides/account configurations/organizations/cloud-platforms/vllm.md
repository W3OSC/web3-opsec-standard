<!--
id: vllm-organization-configuration
type: CONFIGURATION
scope: ORGANIZATION
-->

<div align="center">
  <img src="../../../../images/guides/vllm.svg" alt="vLLM Logo" width="64" height="64">
  <h2><a href="https://docs.vllm.ai/" target="_blank" rel="noopener noreferrer">vLLM</a> Configuration Guide</h2>
  <p><em>Bind, Authentication, Endpoint, Provenance, Proxy, Container and Kubernetes controls for self-hosted vLLM</em></p>
</div>

---

## How to Use This Guide

Each item states its **pass** condition, then gives **CLI** steps (the `vllm serve` invocation and its process, `kubectl` against the serving namespace, `nginx` on the proxy host, `docker` on a container host and `ufw` on each bare serving host) to **Verify** and **Fix** it. Under CLI, **Expect** is the output that means it passes. vLLM has no settings console: it is configured through command-line flags, environment variables and the files in front of it, so every item is CLI-only. An item passes only when every host, process and namespace the command returns meets the condition, and a command that returns none has not checked anything.

#### Prerequisites

- vLLM items assume the `vllm serve` invocation, which in Kubernetes is `command: ["vllm", "serve"]` with the model and each flag as its own `args:` item, not the `/bin/sh -c` script of the vendor's Kubernetes manifest (on the vendor's image that shell stays running beside the server, so the process checks list every flag twice, the environment reads open the shell and miss any variable set inside the script, and a flag written as a later `args:` item reaches only the shell yet still passes).
  - A variable prefixed on the line is an `env:` entry there (a credential such as `VLLM_API_KEY` from a Secret).
  - Each vLLM Fix shows only what its item changes: add that flag or variable to the invocation the server already runs (in Kubernetes the Deployment's `args:` and `env:`, in Docker the `docker run` line), replacing any earlier value of the same flag or variable and deleting any flag or variable the item forbids, then restart the server; run as printed, a Fix starts a server without the flags the other items set.
  - `vllm` is on the `PATH` of the service user, and the `/proc/<pid>/environ` reads run as that user or as root.
  - Run the process checks where the server runs (for a pod, on its node), and first run `pgrep -af 'vllm serve'`: it must list every server there, because a server started as `python3 -m vllm.entrypoints.openai.api_server` is not matched by any check on this page (start it as `vllm serve`).
  - The process checks print only what matches and `pgrep -of 'vllm serve'` opens only the oldest server, so where `pgrep -af 'vllm serve'` lists more than one server, expect each item's lines once per server, run each `/proc/<pid>/environ` read with every PID it lists, and repeat the `:8000` listener check and the `127.0.0.1:8000` requests on each server's port.
  - The loopback bind in the vLLM Server section assumes the proxy runs on the same host or as a sidecar in the serving pod; in Kubernetes the probes and the Service reach the pod address, not loopback, so point them at the sidecar or let the Kubernetes Serving Isolation section carry the boundary.
  - In a container on a bridge network, leave vLLM on the image's default bind and publish the port on loopback instead (the container item): `--host 127.0.0.1` inside the container makes the published port unreachable.
  - Where the invocation reads `--config <file>.yaml`, the file's keys are the same flags (the command line wins over the file), so apply every process check on this page to that file as well.
  - Write flags unabbreviated, in the hyphenated, space-separated form the vendor documents (`--flag value`): the parser also accepts `--flag=value`, underscore spellings and unambiguous prefixes, which the process checks on this page read only where noted.
  - The vLLM items assume the default Python frontend; the opt-in Rust frontend refuses `--allowed-media-domains`, `--tool-server` and `--enable-ssl-refresh` at start, applies media limits of its own and does not enforce `--max-num-queued-reqs` (depending on the build it ignores the flag or refuses it at start).
- Kubernetes items assume one serving Deployment, Service and ServiceAccount in a namespace that holds only the serving workload (the NetworkPolicy items apply to every pod in it) and `kubectl` pointed at that cluster, with vLLM listening on the pod address on port `8000`; where a proxy sidecar in the pod fronts a loopback-bound server instead, write the sidecar's port wherever an item names `8000` in a NetworkPolicy.
  - `kubectl patch`, `kubectl set` and `kubectl apply -f -` change the live objects; write the same change into the manifests or Helm values so the next rollout keeps it, and a node taint into the node pool's configuration.
  - The NetworkPolicy items assume a network plugin that enforces NetworkPolicy; without one the objects are accepted and change nothing.
  - A `kubectl patch` or `kubectl set` on the Deployment rolls its pods; on a node with one GPU the new pod can stay `Pending` while the old one keeps running, so follow each Deployment Fix with `kubectl rollout status deployment/<vllm-deployment> -n <namespace>`, and with a single replica set the Deployment's strategy to `Recreate` so the new pod can take the GPU.
- A server in a pod or a container is not reached by the `127.0.0.1:8000` requests or the file checks run on its host.
  - In Kubernetes, run the requests through `kubectl port-forward --address 127.0.0.1 <pod> -n <namespace> 8000:8000`, left running in a second shell on a machine where nothing else listens on port 8000.
  - Run it once for each pod that `kubectl get pods -n <namespace> -l app=<vllm-deployment> -o name` lists.
  - Put `kubectl exec <pod> -n <namespace> -c <serving-container> --` in front of the `ls` and `stat` reads and the token item's `rm`.
  - Where a proxy sidecar fronts a loopback-bound server, read its listener on the pod's node with `nsenter -t <pid> -n ss -ltnp | grep ':8000'`.
  - On a container host, `<hf-home>` is the host directory the container mounts at `/root/.cache/huggingface`, so the token item's `ls` and `rm` run on the host against it.
  - On a container host, the cache item's `stat` runs with `docker exec <vllm-container>` in front (`docker exec <ray-container>` in the vendor's multi-node Ray containers), and an upgrade is the container item's Fix on the new `vllm/vllm-openai:v<current-release>` image, or for the Ray containers every node's `run_cluster.sh` stopped (its exit removes the container) and started again, head node first, with `vllm/vllm-openai:v<current-release>` as its image, then `vllm serve` started again in the head container.
  - The cache item's Fix is written for a host.
  - In a pod or a container, set `VLLM_CACHE_ROOT` to a subdirectory of a volume that outlives the pod or container (a PersistentVolumeClaim, or a named Docker volume such as the vendor's `vllm-cache`) and restart, then create that directory as the server's own user with `kubectl exec <pod> -n <namespace> -c <serving-container> -- install -d -m 00700 <cache-root>` or `docker exec <vllm-container> install -d -m 00700 <cache-root>` (the leading `00` clears the set-group-ID bit a volume's directories inherit); a directory outside such a volume is recreated with the default mode at the next restart.
  - Where vLLM terminates TLS itself, send every `http://127.0.0.1:8000` request as `https://` with `-k`.
- The proxy item assumes nginx with `conf.d/` includes and a certificate already in place; the same allowlist transfers to any other reverse proxy.
  - The firewall item enables `ufw` with a default-deny incoming policy, its Fix allowing your administrative access first, on a host whose vLLM listeners are host sockets: `vllm serve` run directly or in a container on `--network host`, as the vendor's multi-node Ray containers are.
  - Docker forwards a port published with `-p` in the `nat` table before ufw's rules apply, so a bridge-network container is covered by the container item instead; and on a Kubernetes node ufw's default deny blocks the kubelet and NodePort traffic and its routed default drops pod traffic the network plugin does not accept itself, so there the Kubernetes Serving Isolation section carries the boundary.
  - `<api-port>` is the port clients reach: the proxy's `443`, or `8000` where vLLM terminates TLS itself.
- Run every check that calls `127.0.0.1` or `localhost` with no HTTP proxy in the way: add `127.0.0.1,localhost` to `no_proxy` first, or `unset http_proxy https_proxy all_proxy HTTP_PROXY HTTPS_PROXY ALL_PROXY` and remove any `proxy` line from `~/.curlrc`.
  - curl sends loopback requests through a configured proxy, and a proxy that answers them itself can print a passing status.
- Placeholders in angle brackets (`<namespace>`, `<vllm-proxy-host>`, `<model>` and the rest) are yours to fill; choose each value once and use it on every line.
  - `<hf-home>` is the server's Hugging Face home (`HF_HOME`, the directory that holds `token` and `hub/`), and `<hf-cache-dir>` is the pre-populated model cache as the server process sees it (`<hf-home>/hub` unless you keep it elsewhere; `/root/.cache/huggingface/hub` in the vendor container, `/home/vllm/.cache/huggingface/hub` once it runs as the non-root user).
  - Repeat the whole guide for every serving host and cluster.

---

## vLLM Server

- [ ] **Bind vLLM to Loopback Behind the Proxy (the default listens on every interface)** - pass: `vllm serve` runs with `--host 127.0.0.1` and the only listener on port 8000 is on `127.0.0.1` (in a container on a bridge network, leave the image's default bind and publish the port on loopback instead, as the container item says)
  - **CLI**:
    - Verify:
      ```bash
      ss -ltnp | grep ':8000'
      ```
    - Expect: one `LISTEN` line with local address `127.0.0.1:8000` and none with `*:8000` or `0.0.0.0:8000`. Without `--host` the launcher binds every interface and logs `http://0.0.0.0:8000`, so the server is published the moment the node is reachable.
    - Fix: `vllm serve <model> --host 127.0.0.1 --port 8000`

- [ ] **Set an API Key and Do Not Rely on It Alone (it gates only the /v1, /v2, /inference and /cohere prefixes)** - pass: `--api-key` (or `VLLM_API_KEY`) is set and a request to `/v1/models` without a bearer token is answered `401`
  - **CLI**:
    - Verify: `curl -s -o /dev/null -w '%{http_code}' http://127.0.0.1:8000/v1/models`
    - Expect: `401` (the body is `{"error":"Unauthorized"}`). Without a key anyone who reaches the listener has free inference, and even with it `/invocations` still answers, so the proxy allowlist stays in front.
    - Fix: `VLLM_API_KEY=<api-key> vllm serve <model>`

- [ ] **Restrict CORS to Named Origins (the default is the wildcard)** - pass: `--allowed-origins` lists only your application origins and a request from any other origin gets no `Access-Control-Allow-Origin` header
  - **CLI**:
    - Verify:
      ```bash
      curl -s -D - -o /dev/null -H 'Origin: https://evil.example' http://127.0.0.1:8000/health | \
        grep -i -e '^HTTP/' -e '^access-control-allow-origin'
      ```
    - Verify:
      ```bash
      pgrep -af 'vllm serve' | grep -oE -- '--allowed[-_]origins[ =]\[[^]]*\]'
      ```
    - Expect: `HTTP/1.1 200 OK` and no `access-control-allow-origin` line, then `--allowed-origins ["https://<app-origin>"]` listing only your application origins, with no `*` and no `null`. No output from the first means nothing answered (where vLLM terminates TLS itself, request `https://` with `-k`); no line from the second means the wildcard default. With the wildcard default any web page a developer opens can drive the server and read the answer.
    - Fix: `vllm serve <model> --allowed-origins '["https://<app-origin>"]'`

- [ ] **Do Not Set VLLM_SERVER_DEV_MODE in Production (it adds unauthenticated cache-reset, sleep and RPC endpoints)** - pass: `VLLM_SERVER_DEV_MODE` is unset or `0` on the server process and `GET /is_sleeping` is answered `404`
  - **CLI**:
    - Verify: `curl -s -o /dev/null -w '%{http_code}' http://127.0.0.1:8000/is_sleeping`
    - Expect: `404`. Dev mode registers unauthenticated endpoints that reset caches, sleep the engine and run arbitrary RPC on it.
    - Fix: `VLLM_SERVER_DEV_MODE=0 vllm serve <model>`

- [ ] **Do Not Enable Runtime LoRA Loading (the vendor documents the endpoints as insecure; a loaded adapter changes model behaviour)** - pass: `VLLM_ALLOW_RUNTIME_LORA_UPDATING` is unset or `0` on the server process and `POST /v1/load_lora_adapter` is answered `404`
  - **CLI**:
    - Verify:
      ```bash
      curl -s -o /dev/null -w '%{http_code}' -X POST http://127.0.0.1:8000/v1/load_lora_adapter \
        -H 'Authorization: Bearer <api-key>' -H 'Content-Type: application/json' -d '{}'
      ```
    - Expect: `404`. A caller who reaches the adapter endpoints changes what the model does for every user.
    - Fix: `VLLM_ALLOW_RUNTIME_LORA_UPDATING=0 vllm serve <model>`

- [ ] **Do Not Point --tool-server at the Demo Tools (the demo Python tool runs model-written code in Docker without network isolation)** - pass: no `vllm serve` process carries `--tool-server demo`
  - **CLI**:
    - Verify:
      ```bash
      pgrep -af 'vllm serve' | grep -v -- 'pgrep -af' | \
        grep -oE -- '^[0-9]+|--tool[-_]server[ =]demo( |$)'
      ```
    - Expect: One PID per server and no other line; a `--tool-server demo` line under a PID fails, and no output means no server matched. The demo interpreter runs model-written code in a container on the host's Docker network, one prompt injection away from the LAN and the metadata endpoint.
    - Fix: `vllm serve <model> --tool-server <mcp-host>:<mcp-port>`

- [ ] **Terminate TLS on the Listener When the Proxy Does Not** - pass: `--ssl-keyfile` and `--ssl-certfile` are set with `--enable-ssl-refresh` on every listener that has no TLS-terminating proxy in front, and `/health` answers over `https`
  - **CLI**:
    - Verify: `curl -sk -o /dev/null -w '%{http_code}' https://127.0.0.1:8000/health`
    - Verify:
      ```bash
      pgrep -af 'vllm serve' | grep -oE -- '--enable[-_]ssl[-_]refresh'
      ```
    - Expect: `200` from the first command (a plaintext listener prints `000`) and `--enable-ssl-refresh` from the second. Without TLS at the listener or at the proxy every prompt and API key crosses the network in the clear.
    - Fix: `vllm serve <model> --ssl-keyfile <key.pem> --ssl-certfile <cert.pem> --enable-ssl-refresh`

- [ ] **Allowlist Media Domains and Refuse Redirects (a request URL can otherwise make the server fetch the cloud metadata endpoint)** - pass: `--allowed-media-domains` names only the hosts requests may fetch media from and `VLLM_MEDIA_URL_ALLOW_REDIRECTS` is `0` on the server process
  - **CLI**:
    - Verify:
      ```bash
      pgrep -af 'vllm serve' | grep -oE -- '--allowed-media-domains( [^ -][^ ]*)+'
      ```
    - Verify:
      ```bash
      tr '\0' '\n' < /proc/$(pgrep -of 'vllm serve')/environ | grep '^VLLM_MEDIA_URL_ALLOW_REDIRECTS='
      ```
    - Expect: `--allowed-media-domains <media-host>` naming only your hosts, then `VLLM_MEDIA_URL_ALLOW_REDIRECTS=0`. Unrestricted, a request URL makes the server fetch internal services or the cloud metadata endpoint.
    - Fix: `VLLM_MEDIA_URL_ALLOW_REDIRECTS=0 vllm serve <model> --allowed-media-domains <media-host>`

- [ ] **Cap Per-Request Fan-Out and Leave the Media Size Limits On** - pass: `VLLM_MAX_N_SEQUENCES` is set to a small cap on the server process and no `VLLM_MAX_*` media limit is set to `0`
  - **CLI**:
    - Verify:
      ```bash
      tr '\0' '\n' < /proc/$(pgrep -of 'vllm serve')/environ | grep '^VLLM_MAX_N_SEQUENCES='
      ```
    - Verify:
      ```bash
      tr '\0' '\n' < /proc/$(pgrep -of 'vllm serve')/environ | grep -E '^VLLM_MAX_(MEDIA|IMAGE|AUDIO|EMBED)[A-Z_]*=0$'
      ```
    - Expect: `VLLM_MAX_N_SEQUENCES=64` (or the cap you chose; the vendor suggests 64 or 128 for public-facing servers) from the first command and no output from the second. One request with a large `n` allocates memory and GPU time in proportion and can take the server down.
    - Fix: `VLLM_MAX_N_SEQUENCES=64 vllm serve <model>`

- [ ] **Set Explicit Concurrency and Queue Ceilings on vLLM (the request queue is unbounded by default)** - pass: the `vllm serve` process carries `--max-num-seqs` and `--max-num-queued-reqs`, each with an explicit value
  - **CLI**:
    - Verify:
      ```bash
      pgrep -af 'vllm serve' | grep -oE -- '--max[-_]num[-_](seqs|queued[-_]reqs)[ =][0-9]+'
      ```
    - Expect: two lines, `--max-num-seqs <max-seqs>` and `--max-num-queued-reqs <max-queued>` (no `--max-num-queued-reqs` line means the queue is unbounded). Without a queue ceiling one caller's burst queues without limit, holds the server's memory and starves every other caller.
    - Fix: `vllm serve <model> --max-num-seqs <max-seqs> --max-num-queued-reqs <max-queued>`

- [ ] **Disable Prefix Caching on a vLLM Server Shared Between Tenants (response timing otherwise reveals how another tenant's prompt begins)** - pass: every `vllm serve` process called by users who must not learn each other's prompts, where the calling application does not send each tenant's own secret `cache_salt` on every request, carries `--no-enable-prefix-caching`
  - **CLI**:
    - Verify:
      ```bash
      pgrep -af 'vllm serve' | grep -v -- 'pgrep -af' | grep -oE -- '^[0-9]+|--(no[-_])?enable[-_]prefix[-_]caching'
      ```
    - Expect: One PID per server, each followed by its flag lines; match each PID to its server in `pgrep -af 'vllm serve'`. Under the PID of every server called by users who must not learn each other's prompts, `--no-enable-prefix-caching` as the last line before the next PID; a PID with nothing under it, or with `--enable-prefix-caching` last, keeps the cache on (an application that sends each tenant's own secret `cache_salt` on every request is the vendor's mitigation and needs no flag). With the cache shared and unsalted, a caller who times the first token of guessed prompts learns how another tenant's prompt begins.
    - Fix: `vllm serve <model> --no-enable-prefix-caching`

- [ ] **Load Plugins by Explicit Name Only (unset loads every installed general plugin)** - pass: `VLLM_PLUGINS` is set on the server process to the exact plugin names to load (empty when none)
  - **CLI**:
    - Verify:
      ```bash
      tr '\0' '\n' < /proc/$(pgrep -of 'vllm serve')/environ | grep '^VLLM_PLUGINS='
      ```
    - Expect: `VLLM_PLUGINS=<plugin-name>` listing only the plugins you chose, or `VLLM_PLUGINS=` when none; no output means every installed plugin loads. Unset, every general plugin found in the environment loads into the server, and a plugin can add routes or reach the engine.
    - Fix: `VLLM_PLUGINS=<plugin-name> vllm serve <model>`

- [ ] **Turn Off Usage Statistics Reporting (by default the server posts its hardware, model architecture and configuration to the vendor)** - pass: `VLLM_NO_USAGE_STATS` is `1` on the server process
  - **CLI**:
    - Verify:
      ```bash
      tr '\0' '\n' < /proc/$(pgrep -of 'vllm serve')/environ | grep '^VLLM_NO_USAGE_STATS='
      ```
    - Expect: `VLLM_NO_USAGE_STATS=1`. By default the server posts its hardware, model architecture and configuration to the vendor's stats endpoint.
    - Fix: `VLLM_NO_USAGE_STATS=1 vllm serve <model>`

- [ ] **Upgrade vLLM to a Patched Release** - pass: `/version` on the server reports the current release published on the vendor's releases page
  - **CLI**:
    - Verify: `curl -s http://127.0.0.1:8000/version`
    - Expect: `{"version":"<current-release>"}` from the restarted server, equal to the newest release at github.com/vllm-project/vllm/releases. Older releases let a crafted Host header bypass the API key and leaked one user's output into another's.
    - Fix: `pip install -U vllm`
    - Fix:
      ```bash
      kubectl set image deployment/<vllm-deployment> -n <namespace> <serving-container>=vllm/vllm-openai:v<current-release>
      ```

---

## Model Provenance & Loading

- [ ] **Do Not Set --trust-remote-code (a model repository's own code would run inside the serving process)** - pass: no `vllm serve` process carries `--trust-remote-code`
  - **CLI**:
    - Verify:
      ```bash
      pgrep -af 'vllm serve' | grep -v -- 'pgrep -af' | \
        grep -oE -- '^[0-9]+| --trust[-_]remote[-_]code( |$)'
      ```
    - Expect: One PID per server and no other line (`--no-trust-remote-code` does not match); a `--trust-remote-code` line under a PID fails, and no output means no server matched. With the flag set the repository's own Python runs inside the serving process: code execution on load from a poisoned model.
    - Fix: `vllm serve <model> --no-trust-remote-code`

- [ ] **Load Weights as safetensors Only (the auto default falls back to the pickle-based bin format, which can carry code)** - pass: every `vllm serve` process carries `--load-format safetensors`
  - **CLI**:
    - Verify:
      ```bash
      pgrep -af 'vllm serve' | grep -oE -- '--load[-_]format[ =]safetensors'
      ```
    - Expect: `--load-format safetensors` once per serving process. The `auto` default falls back to pickle-based bin files, which can carry code and are a far larger attack surface for a poisoned model than safetensors.
    - Fix: `vllm serve <model> --load-format safetensors`

- [ ] **Do Not Set --allowed-local-media-path (it lets requests read files from the server)** - pass: `--allowed-local-media-path` is absent or empty on every `vllm serve` process
  - **CLI**:
    - Verify:
      ```bash
      pgrep -af 'vllm serve' | grep -v -- 'pgrep -af' | \
        grep -oE -- '^[0-9]+|--allowed[-_]local[-_]media[-_]path[ =][^ ]*'
      ```
    - Expect: One PID per server with nothing under it, or `--allowed-local-media-path` followed by nothing; any directory after the flag fails, and no output means no server matched. The vendor calls it a security risk: a request can then read image, audio and video files from the server's own disk.
    - Fix: `vllm serve <model> --allowed-local-media-path ''`

- [ ] **Pin Every Revision and Load From a Pre-Populated Cache Offline** - pass: `--revision`, `--code-revision` and `--tokenizer-revision` each carry a commit id, and `HF_HUB_OFFLINE=1` is set with `--download-dir` pointing at the pre-populated cache
  - **CLI**:
    - Verify:
      ```bash
      pgrep -af 'vllm serve' | grep -oE -- '--(code-|tokenizer-)?revision [0-9a-f]{40}'
      ```
    - Verify:
      ```bash
      tr '\0' '\n' < /proc/$(pgrep -of 'vllm serve')/environ | grep '^HF_HUB_OFFLINE='
      ```
    - Verify:
      ```bash
      pgrep -af 'vllm serve' | grep -oE -- '--download[-_]dir[ =][^ ]*'
      ```
    - Expect: three lines, `--revision`, `--code-revision` and `--tokenizer-revision`, each followed by a 40-character commit id, then `HF_HUB_OFFLINE=1`, then `--download-dir <hf-cache-dir>`. A branch or tag moves, so an unpinned name can serve weights or code that nobody reviewed.
    - Fix:
      ```bash
      HF_HUB_OFFLINE=1 vllm serve <model> --revision <commit-sha> --code-revision <commit-sha> \
        --tokenizer-revision <commit-sha> --download-dir <hf-cache-dir>
      ```

- [ ] **Remove the Hugging Face Token From the vLLM Process (offline loading needs none, and code running in the server can read it)** - pass: the `vllm serve` process has none of `HF_TOKEN`, `HUGGING_FACE_HUB_TOKEN` or `HF_TOKEN_PATH` in its environment and no `--hf-token` on its command line, and there is no `token` or `stored_tokens` file in its Hugging Face home (`<hf-home>`)
  - **CLI**:
    - Verify:
      ```bash
      tr '\0' '\n' < /proc/$(pgrep -of 'vllm serve')/environ | grep -oE '^(HF_TOKEN|HUGGING_FACE_HUB_TOKEN|HF_TOKEN_PATH)='
      ```
    - Verify:
      ```bash
      pgrep -af 'vllm serve' | grep -oE -- '--hf[-_]token( |=|$)'
      ```
    - Verify: `ls -d <hf-home> <hf-home>/token <hf-home>/stored_tokens`
    - Expect: no output from the first and second commands, then `ls: cannot access '<hf-home>/token': No such file or directory`, `ls: cannot access '<hf-home>/stored_tokens': No such file or directory` and `<hf-home>` itself from the third; a `cannot access '<hf-home>'` line means the command ran where the server's Hugging Face home is not. Code running in the server reads a token left in its environment, command line or home, and a write token replaces the models you load.
    - Fix:
      ```bash
      kubectl set env deployment/<vllm-deployment> -n <namespace> HF_TOKEN- HUGGING_FACE_HUB_TOKEN- HF_TOKEN_PATH-
      ```
    - Fix: `env -u HF_TOKEN -u HUGGING_FACE_HUB_TOKEN -u HF_TOKEN_PATH vllm serve <model>`
    - Fix: `rm -f <hf-home>/token <hf-home>/stored_tokens`

- [ ] **Restrict the vLLM Cache Directory to the Service User (cache contents load without integrity checks and include code-executing formats)** - pass: `VLLM_CACHE_ROOT` on the server process points at a directory owned by the service user with mode `700`
  - **CLI**:
    - Verify: `stat -c '%U %a' <cache-root>`
    - Verify:
      ```bash
      tr '\0' '\n' < /proc/$(pgrep -of 'vllm serve')/environ | grep '^VLLM_CACHE_ROOT='
      ```
    - Expect: `<service-user> 700` from the first command, then `VLLM_CACHE_ROOT=<cache-root>`. Cache contents load without integrity checks, so a writer to the directory can execute code in the server.
    - Fix:
      ```bash
      install -d -m 700 -o <service-user> -g <service-user> <cache-root> && \
        VLLM_CACHE_ROOT=<cache-root> vllm serve <model>
      ```

---

## Reverse Proxy & Network Exposure

- [ ] **Publish Only /v1 and /health Through the Reverse Proxy for vLLM (/invocations, /pooling, /score and the control endpoints skip the API key)** - pass: the proxy forwards only `/v1/` and `/health` to vLLM, matched on the request URI as the client sent it, and answers `403` on every other path
  - **CLI**:
    - Verify: `curl -s -o /dev/null -w '%{http_code}' https://<vllm-proxy-host>/health`
    - Verify: `curl -s -o /dev/null -w '%{http_code}' -X POST https://<vllm-proxy-host>/invocations`
    - Verify: `curl -s -o /dev/null -w '%{http_code}' -X POST https://<vllm-proxy-host>/allowlist-probe-$RANDOM`
    - Verify:
      ```bash
      curl --path-as-is -s -o /dev/null -w '%{http_code}' https://<vllm-proxy-host>/metrics/x$RANDOM/../../v1/models
      ```
    - Expect: `200` from the first command, answered by vLLM through the proxy, then `403` from the other three, answered by the proxy itself; the third and fourth paths change on every run and no vLLM route serves the third, so a `404` from the third means the proxy forwards paths it does not name, a `200` from the fourth that it matches the normalised path but forwards the raw one. `/invocations` runs the same inference as `/v1` with no key, so an open proxy hands it to anyone.
    - Fix:
      ```bash
      printf 'server { listen 443 ssl; server_name <vllm-proxy-host>; ssl_certificate <cert.pem>; ssl_certificate_key <key.pem>; location ~ ^/(v1/|health$) { if ($request_uri !~ "^/(v1/|health([?]|$))") { return 403; } proxy_pass http://127.0.0.1:8000; proxy_set_header Host $host; } location / { return 403; } }\n' | \
        sudo tee /etc/nginx/conf.d/vllm.conf >/dev/null && sudo nginx -t && sudo nginx -s reload
      ```

- [ ] **Publish the vLLM Container Port on Loopback Only (a bare -p puts the API on every host interface, routed past ufw)** - pass: every vLLM container on a bridge network publishes its ports only on `127.0.0.1`, and `8000/tcp` is published there
  - **CLI**:
    - Verify: `docker port <vllm-container>`
    - Expect: `8000/tcp -> 127.0.0.1:8000` and no line with any other address; `0.0.0.0:`, `[::]:` or a host address fails, and no output means nothing is published (a container on `--network host` is a host process, covered by the loopback bind and the firewall items). A bare `-p 8000:8000` hands anyone who reaches your host the API, routed past ufw before its rules apply.
    - Fix:
      ```bash
      docker rm -f <vllm-container> && \
        docker run -d --name <vllm-container> --gpus all --ipc=host \
        -v <hf-home>:/root/.cache/huggingface -p 127.0.0.1:8000:8000 \
        vllm/vllm-openai:v<current-release> <model>
      ```

- [ ] **Firewall Every Bare-Host vLLM Server to Administrative Access, the Peer Segment and the API Port (PyTorch Distributed listeners accept anyone who connects)** - pass: on a host that runs `vllm serve` directly or in a container on `--network host`, `ufw` is active with a default-deny incoming policy that allows only your administrative access, `<api-port>` and, where the server spans nodes, the peer-node segment
  - **CLI**:
    - Verify: `sudo ufw status verbose`
    - Expect: `Status: active`, `Default: deny (incoming), allow (outgoing), ...` and rules only for `<admin-cidr>` on `22/tcp`, `<api-port>/tcp` and, on a multi-node server, `<peer-node-cidr>`. PyTorch Distributed accepts connections from anywhere with no authorization and runs what it is sent.
    - Fix:
      ```bash
      sudo ufw allow from <admin-cidr> to any port 22 proto tcp && sudo ufw default deny incoming && \
        sudo ufw allow <api-port>/tcp && sudo ufw enable
      ```
    - Fix: `sudo ufw allow from <peer-node-cidr>`

- [ ] **Set VLLM_HOST_IP to the Node's Private Address on Every Node of a Multi-Node vLLM Server (unset, the server advertises its default-route address)** - pass: where one vLLM server spans nodes, `VLLM_HOST_IP` on every node (the head's and each `--headless` worker's `vllm serve`, or each Ray container) is that node's address on the peer-node segment
  - **CLI**:
    - Verify:
      ```bash
      tr '\0' '\n' < /proc/$(pgrep -of 'vllm serve')/environ | grep '^VLLM_HOST_IP='
      ```
    - Verify: `docker exec <ray-container> printenv VLLM_HOST_IP`
    - Expect: `VLLM_HOST_IP=<node-private-ip>` from the first command on each node that runs `vllm serve`, or `<node-private-ip>` from the second in each Ray container. Unset, the server advertises its default-route address, often the public one, and peers exchange unencrypted, code-executing traffic over it.
    - Fix: `VLLM_HOST_IP=<node-private-ip> vllm serve <model>`
    - Fix:
      ```bash
      bash run_cluster.sh vllm/vllm-openai <head-node-ip> --head <hf-home> \
        -e VLLM_HOST_IP=<head-node-ip>
      ```
    - Fix:
      ```bash
      bash run_cluster.sh vllm/vllm-openai <head-node-ip> --worker <hf-home> \
        -e VLLM_HOST_IP=<node-private-ip>
      ```

---

## Kubernetes Serving Isolation

- [ ] **Expose the Inference Service as ClusterIP Only** - pass: the vLLM Service has `spec.type` `ClusterIP` and no `spec.externalIPs`
  - **CLI**:
    - Verify: `kubectl get svc <vllm-service> -n <namespace> -o jsonpath='{.spec.type}{.spec.externalIPs}'`
    - Expect: `ClusterIP` and nothing after it. `LoadBalancer`, `NodePort` or an external IP publishes the endpoint outside the cluster, past the gateway that authenticates it.
    - Fix:
      ```bash
      kubectl patch svc <vllm-service> -n <namespace> -p '{"spec":{"type":"ClusterIP","externalIPs":null}}'
      ```

- [ ] **Allow Ingress to the Serving Pods From the Gateway Namespace Only** - pass: a NetworkPolicy selecting the vLLM pods lists `Ingress` in `policyTypes` and allows traffic only from the gateway namespace on port `8000`, and no other NetworkPolicy in the namespace carries an ingress rule
  - **CLI**:
    - Verify:
      ```bash
      kubectl get networkpolicy vllm-ingress -n <namespace> \
        -o jsonpath='{.spec.podSelector}{" "}{.spec.policyTypes}{" "}{.spec.ingress}'
      ```
    - Verify:
      ```bash
      kubectl get pods -n <namespace> -l app=<vllm-deployment> --field-selector=status.phase=Running -o name
      ```
    - Verify:
      ```bash
      kubectl get networkpolicy -n <namespace> -o jsonpath='{range .items[?(@.spec.ingress)]}{.metadata.name}{"\n"}{end}'
      ```
    - Verify: `kubectl rollout status deployment/<vllm-deployment> -n <namespace> --timeout=60s`
    - Expect: `{"matchLabels":{"app":"<vllm-deployment>"}} ["Ingress"] [{"from":[{"namespaceSelector":{"matchLabels":{"kubernetes.io/metadata.name":"<gateway-namespace>"}}}],"ports":[{"port":8000,"protocol":"TCP"}]}]` - one rule, one `from` entry - from the first command, one `pod/` line per running vLLM replica from the second (none means the policy selects no running pod), `vllm-ingress` alone from the third, then `deployment "<vllm-deployment>" successfully rolled out` from the fourth (anything else, a timeout included, means an old, unlabelled pod may still be serving). Without the policy any pod in the cluster reaches vLLM directly, bypassing the authenticating proxy.
    - Fix:
      ```bash
      kubectl patch deployment <vllm-deployment> -n <namespace> \
        -p '{"spec":{"template":{"metadata":{"labels":{"app":"<vllm-deployment>"}}}}}' && \
        echo '{"apiVersion":"networking.k8s.io/v1","kind":"NetworkPolicy","metadata":{"name":"vllm-ingress"},"spec":{"podSelector":{"matchLabels":{"app":"<vllm-deployment>"}},"policyTypes":["Ingress"],"ingress":[{"from":[{"namespaceSelector":{"matchLabels":{"kubernetes.io/metadata.name":"<gateway-namespace>"}}}],"ports":[{"protocol":"TCP","port":8000}]}]}}' | \
        kubectl apply -n <namespace> -f -
      ```
    - Fix:
      ```bash
      kubectl patch networkpolicy <other-ingress-policy> -n <namespace> --type=json -p '[{"op":"remove","path":"/spec/ingress"}]'
      ```

- [ ] **Default-Deny Egress From the Serving Namespace and Allow Only DNS and the Observability Endpoint** - pass: a NetworkPolicy with an empty `podSelector` lists `Egress` in `policyTypes` and allows only DNS to `kube-system` and the trace collector on `<otlp-port>`, and no other NetworkPolicy in the namespace carries an egress rule
  - **CLI**:
    - Verify:
      ```bash
      kubectl get networkpolicy vllm-egress -n <namespace> \
        -o jsonpath='{.spec.podSelector}{" "}{.spec.policyTypes}{" "}{.spec.egress}'
      ```
    - Verify:
      ```bash
      kubectl get networkpolicy -n <namespace> -o jsonpath='{range .items[?(@.spec.egress)]}{.metadata.name}{"\n"}{end}'
      ```
    - Expect: `{} ["Egress"] [{"ports":[{"port":53,"protocol":"UDP"},{"port":53,"protocol":"TCP"}],"to":[{"namespaceSelector":{"matchLabels":{"kubernetes.io/metadata.name":"kube-system"}}}]},{"ports":[{"port":<otlp-port>,"protocol":"TCP"}],"to":[{"ipBlock":{"cidr":"<observability-cidr>"}}]}]` and no other rule from the first command, then `vllm-egress` alone from the second. With open egress a compromised server ships prompts anywhere and pulls tools from anywhere (DNS must stay allowed or resolution stops).
    - Fix:
      ```bash
      echo '{"apiVersion":"networking.k8s.io/v1","kind":"NetworkPolicy","metadata":{"name":"vllm-egress"},"spec":{"podSelector":{},"policyTypes":["Egress"],"egress":[{"to":[{"namespaceSelector":{"matchLabels":{"kubernetes.io/metadata.name":"kube-system"}}}],"ports":[{"protocol":"UDP","port":53},{"protocol":"TCP","port":53}]},{"to":[{"ipBlock":{"cidr":"<observability-cidr>"}}],"ports":[{"protocol":"TCP","port":<otlp-port>}]}]}}' | \
        kubectl apply -n <namespace> -f -
      ```
    - Fix:
      ```bash
      kubectl patch networkpolicy <other-egress-policy> -n <namespace> --type=json -p '[{"op":"remove","path":"/spec/egress"}]'
      ```

- [ ] **Set GPU and Memory Limits on the Serving Pod** - pass: the serving container has `resources.limits` for `nvidia.com/gpu` and `memory`, and every other container in the serving Deployment has a `memory` limit
  - **CLI**:
    - Verify:
      ```bash
      kubectl get deploy <vllm-deployment> -n <namespace> \
        -o jsonpath='{range .spec.template.spec.containers[*]}{.name}{" "}{.resources.limits}{"\n"}{end}'
      ```
    - Expect: `<serving-container> {"memory":"<memory>","nvidia.com/gpu":"<gpus>"}`, then `<sidecar> {"memory":"<sidecar-memory>"}` for each other container, with a `cpu` key first where one is set. Without limits a runaway or hijacked pod takes the whole GPU node, the most expensive hardware in the cluster.
    - Fix:
      ```bash
      kubectl set resources deployment/<vllm-deployment> -n <namespace> -c <serving-container> \
        --limits=nvidia.com/gpu=<gpus>,memory=<memory> --requests=nvidia.com/gpu=<gpus>
      ```
    - Fix:
      ```bash
      kubectl set resources deployment/<vllm-deployment> -n <namespace> -c <sidecar> --limits=memory=<sidecar-memory>
      ```

- [ ] **Reserve the GPU Nodes for the Serving Workload** - pass: every GPU node carries the `nvidia.com/gpu=present:NoSchedule` taint and the vLLM Deployment tolerates it
  - **CLI**:
    - Verify:
      ```bash
      kubectl get nodes -l <gpu-node-label> \
        -o jsonpath='{range .items[*]}{.metadata.name}{" "}{.spec.taints}{"\n"}{end}'
      ```
    - Verify: `kubectl get deploy <vllm-deployment> -n <namespace> -o jsonpath='{.spec.template.spec.tolerations}'`
    - Expect: one line per GPU node, each the node name followed by a list containing `{"effect":"NoSchedule","key":"nvidia.com/gpu","value":"present"}`, from the first command (a name with nothing after it is an untainted node), then `[{"effect":"NoSchedule","key":"nvidia.com/gpu","operator":"Exists"}]` from the second (the Fix's patch replaces any tolerations the Deployment already carried, so re-add those in the same patch). Untainted, any workload schedules onto the most expensive and most credential-adjacent nodes in the estate.
    - Fix:
      ```bash
      kubectl taint nodes -l <gpu-node-label> nvidia.com/gpu=present:NoSchedule --overwrite && \
        kubectl patch deployment <vllm-deployment> -n <namespace> \
        -p '{"spec":{"template":{"spec":{"tolerations":[{"key":"nvidia.com/gpu","operator":"Exists","effect":"NoSchedule"}]}}}}'
      ```

- [ ] **Disable Service-Account Token Automount on the Serving Pod (the server never calls the Kubernetes API, so a mounted token only helps an attacker)** - pass: the vLLM ServiceAccount has `automountServiceAccountToken: false`, and the vLLM Deployment runs as that account with `automountServiceAccountToken: false` in its pod template
  - **CLI**:
    - Verify: `kubectl get sa <vllm-sa> -n <namespace> -o jsonpath='{.automountServiceAccountToken}'`
    - Verify:
      ```bash
      kubectl get deploy <vllm-deployment> -n <namespace> \
        -o jsonpath='{.spec.template.spec.serviceAccountName}/{.spec.template.spec.automountServiceAccountToken}'
      ```
    - Expect: `false` from the first command, then `<vllm-sa>/false` from the second. The server never calls the Kubernetes API, so a mounted token is free cluster credentials for whoever gets code execution in it.
    - Fix:
      ```bash
      kubectl patch serviceaccount <vllm-sa> -n <namespace> -p '{"automountServiceAccountToken": false}' && \
        kubectl patch deployment <vllm-deployment> -n <namespace> \
        -p '{"spec":{"template":{"spec":{"serviceAccountName":"<vllm-sa>","automountServiceAccountToken":false}}}}'
      ```

- [ ] **Run the vLLM Container as the Image's Non-Root User (the vendor image runs as root)** - pass: the vLLM container, on the `vllm/vllm-openai` image, sets `runAsNonRoot: true`, `runAsUser: 2000`, `runAsGroup: 0` and `allowPrivilegeEscalation: false` in its `securityContext`, and the running server process is UID `2000`
  - **CLI**:
    - Verify:
      ```bash
      kubectl get deploy <vllm-deployment> -n <namespace> \
        -o jsonpath='{range .spec.template.spec.containers[*]}{.name}{" "}{.image}{" "}{.securityContext}{"\n"}{end}'
      ```
    - Verify: `kubectl exec deploy/<vllm-deployment> -n <namespace> -c <serving-container> -- id -u`
    - Expect: `<serving-container> vllm/vllm-openai:<tag> {"allowPrivilegeEscalation":false,"runAsGroup":0,"runAsNonRoot":true,"runAsUser":2000}` (a registry prefix or an `@sha256:` digest on the image counts; other keys may sit among them in name order) from the first command, then `2000` from the second. As root, code execution through a poisoned model or a request bug keeps the runtime's capabilities and writes every root-owned host path mounted read-write; with escalation allowed, it rewrites the image's group-writable `/etc/passwd` and runs `su` back to root.
    - Fix:
      ```bash
      kubectl patch deployment <vllm-deployment> -n <namespace> \
        -p '{"spec":{"template":{"spec":{"securityContext":{"fsGroup":0,"fsGroupChangePolicy":"OnRootMismatch"},"containers":[{"name":"<serving-container>","securityContext":{"runAsNonRoot":true,"runAsUser":2000,"runAsGroup":0,"allowPrivilegeEscalation":false},"env":[{"name":"HF_HOME","value":"/home/vllm/.cache/huggingface"}],"volumeMounts":[{"name":"<cache-volume>","mountPath":"/home/vllm/.cache/huggingface"}]}]}}}}'
      ```
