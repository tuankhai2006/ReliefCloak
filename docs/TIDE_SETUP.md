# Live Tide setup — local development

## Current state (22 October 2026)

- Docker container: `reliefcloak-tide`, bound only to `127.0.0.1:8080`.
- Persistent named volume: `reliefcloak-tide-data` mounted at `/opt/keycloak/data/h2`.
- Image: `tideorg/tidecloak-dev:latest`, downloaded digest `sha256:3f52d0bc3e4e3ae5153e172960003bbe94705cd40af6561fd4c7c4434aaa2708`.
- Realm: `reliefcloak`; application client: `reliefcloak-app`; application origin: `http://localhost:3000`.
- Realm creation, Fabric setup and IGA enablement returned successful responses.
- The initializer is waiting for the first admin to complete Tide enrollment in their browser.
- Live application login, independent admin enrollment, effective quorum and individual transaction policy are **not yet verified**.
- The app remains in mock mode until enrollment, adapter export and login tests complete.

Local credentials and the team's subscription email are in the ignored `.env.tide.local`; never commit or share that file. Enrollment URLs are private, expiring account-setup links and must not be committed either.

## First admin enrollment

Open the private invitation shown by `init/tcinit.sh` in a browser on the same Windows machine. Complete account registration yourself, including any passwords and acceptance screens. The initializer polls and continues automatically when the Tide attributes appear.

The upstream template creates a Keycloak user named `admin` with a template profile email; the subscription email used for realm activation is separate. Do not confuse that template profile field with the Tide identity you register.

Do not rerun the fresh-realm initializer on an existing half-provisioned realm. In particular, do not set `ALLOW_EXISTING_REALM=1` casually: the supplied script can authorize unrelated pending changes during its bootstrap drain. Inspect the existing state and resume the original process instead.

## After enrollment

1. Let the existing initializer finish. It grants the first admin and exports the SDK adapter to `tidecloak.json`.
2. Review the generated adapter before sharing configuration. Keep local setup credentials private.
3. Grant appropriate application roles through the governed console; use independent identities for admin, auditor and officer.
4. Validate real login and server-side token checking before switching `NEXT_PUBLIC_TIDE_MOCK=false` in `.env.local` and restarting/rebuilding the app.
5. Enroll additional independent realm administrators and verify the actual quorum. Do not use multiple accounts controlled by one agent as proof of independent governance.
6. Demonstrate a governed change blocked below quorum and effective only after enough independent approvals.
7. Keep transaction-level enforcement labeled unverified until a signed policy and the payment executor's verifier are implemented.

The realm console is `http://localhost:8080/realms/reliefcloak/tide-console/`. Use the exact `localhost` origin configured in the realm for live application login; `127.0.0.1` may not match configured redirect URIs.

## Container lifecycle

```powershell
docker start reliefcloak-tide
docker logs --tail 40 reliefcloak-tide
docker stop reliefcloak-tide
```

Stopping the container preserves the volume. Do not delete the volume while identities or realm configuration are still needed.

For a separate teammate installation, use the official quickstart and a separate local environment. Their `localhost` is their own machine; copying a local adapter does not give them access to this computer's realm.

## Windows provisioning notes

The repository initializer requires Bash, curl and jq. This machine uses Git Bash at `C:\Program Files\Git\bin\bash.exe`; jq was obtained from the official `jqlang/jq` release and placed in a temporary tools directory. Load `.env.tide.local` into the current process environment and include that tools directory in PATH before invoking the initializer. Do not print the environment variables to logs.

On this Docker host a new named H2 volume started with root ownership. It was initially empty. Granting ownership of its mount directory to the image's Keycloak user (`1000:0`) resolved the startup error without running the server as root.

References:

- https://docs.tide.org/get-started/Tidecloak%20Quickstart
- https://docs.tide.org/Core-Concepts/iga-workflow
