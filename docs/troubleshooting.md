# Troubleshooting

> _**This document contains common problems and their solutions.**_<br>
> Please ensure your issue isn't listed here, before opening a new ticket.
>
> _Found something not listed here? Consider adding it, to help other users._

## Contents

- [Config not loading](#config-not-loading)
  - [You see the default dashboard instead of yours](#you-see-the-default-dashboard-instead-of-yours)
  - [Failed to fetch configuration, status 404](#failed-to-fetch-configuration-server-responded-with-status-404)
  - [Config came back after a permissions fix, but auth is ignored](#config-came-back-after-a-permissions-fix-but-auth-is-ignored)
  - [Edits on the host never reach the container](#edits-on-the-host-never-reach-the-container)
  - [Your browser shows an old config](#your-browser-shows-an-old-config)
  - [Empty dashboard with "Login" in the title](#empty-dashboard-with-login-in-the-title)
  - [Static hosting ignores config changes](#static-hosting-ignores-config-changes)
  - [Nothing loads when Dashy is behind a sub-path](#nothing-loads-when-dashy-is-behind-a-sub-path)
- [Config not saving](#config-not-saving)
  - [Permission denied or read-only filesystem](#permission-denied-or-read-only-filesystem-eacces-erofs)
  - [Kubernetes ConfigMap mount is read-only](#kubernetes-configmap-mount-is-read-only)
  - [SELinux or AppArmor blocks the write](#selinux-or-apparmor-blocks-the-write)
  - [Backup step fails so save aborts](#backup-step-fails-so-save-aborts)
  - [Save button is missing or returns 403](#save-button-is-missing-or-returns-403-forbidden)
  - [Save unavailable on Vercel, Netlify or other static hosts](#save-unavailable-on-vercel-netlify-or-other-static-hosts)
  - [/config-manager/save returns 404 or HTML](#config-managersave-returns-404-or-html)
  - ["Invalid filename" when saving a sub-page](#invalid-filename-when-saving-a-sub-page)
  - ["Cannot save to an external URL"](#cannot-save-to-an-external-url)
  - [Saved successfully but the UI shows the old config](#saved-successfully-but-the-ui-shows-the-old-config)
  - [Container crashes or restart loop after saving](#container-crashes-or-restart-loop-after-saving-before-3213)
  - [Intentionally read-only mode](#intentionally-read-only-mode)
- [Status Checks Failing](#status-checks-failing)
  - [Service Error 401 or 403](#service-error---401-or-403)
  - [Service Error with another status code](#service-error-with-another-status-code)
  - [Invalid URL or EBLOCKED](#invalid-url-or-eblocked)
  - [Certificate errors](#certificate-errors)
  - [ECONNREFUSED, ENOTFOUND or ECONNABORTED](#econnrefused-enotfound-or-econnaborted)
  - [Every item shows Failed to make request or Request timed out](#every-item-shows-failed-to-make-request-or-request-timed-out)
  - [Service doesn't use HTTP](#service-doesnt-use-http)
  - [Still not sure why it's failing](#still-not-sure-why-its-failing)
- [404 / Routing issues](#404--routing-issues)
  - [404 On Static Hosting](#404-on-static-hosting)
  - [404 from Mobile Home Screen](#404-after-launch-from-mobile-home-screen)
  - [404 On Multi-Page Apps](#404-on-multi-page-apps)
  - [Item Opens a Dashy URL Instead of the App](#item-opens-a-dashy-url-instead-of-the-app)
  - [Blocked request in dev mode](#blocked-request-this-host-is-not-allowed-in-dev-mode)
  - [Refused to Connect in Web Content View](#refused-to-connect-in-modal-or-workspace-view)
- [Sub-pages](#sub-pages)
  - [Sub-page shows "Unable to find config for ..."](#sub-page-shows-unable-to-find-config-for-)
  - [Sub-page missing from nav, or won't open when clicked](#sub-page-missing-from-nav-or-wont-open-when-clicked)
  - [Sub-page ignores its theme, layout or appConfig](#sub-page-ignores-its-theme-layout-or-appconfig)
  - [Sub-config files return 404](#sub-config-files-return-404)
  - [Remote Config Not Loading](#remote-config-not-loading)
- [Build & memory errors](#build--memory-errors)
  - [Yarn Build or Run Error](#yarn-error)
  - [The engine "node" is incompatible with this module](#the-engine-node-is-incompatible-with-this-module)
  - [Cannot find module after updating](#cannot-find-module-after-updating)
  - [`yarn build` fails inside the container](#yarn-build-fails-inside-the-container)
  - [High CPU or RAM Usage on Startup](#high-cpu-or-ram-usage-on-startup)
  - [Heap limit Allocation failed](#ineffective-mark-compacts-near-heap-limit-allocation-failed)
  - [Command failed with signal "SIGKILL"](#command-failed-with-signal-sigkill)
  - [Unreachable Code Error](#unreachable-code-error)
  - [Cannot find module './_baseValues'](#error-cannot-find-module-_basevalues)
- [Auth & OIDC](#auth--oidc)
  - [Auth Validation Error: "must be object"](#auth-validation-error-must-be-object)
  - [Anyone can open /conf.yml without logging in](#anyone-can-open-confyml-without-logging-in)
  - [Keycloak Redirect Error](#keycloak-redirect-error)
  - [OIDC or Keycloak failure on numeric client IDs](#oidc-or-keycloak-failure-on-numeric-client-ids)
  - [Redirect loop after login](#redirect-loop-after-login)
  - [invalid_redirect_uri](#invalid_redirect_uri)
  - [Login works, but Dashy shows "Authentication failed"](#login-works-but-dashy-shows-authentication-failed-oidc)
  - [Sent back to the login page after a while](#sent-back-to-the-login-page-after-a-while)
  - [Logged in but no admin controls](#logged-in-but-no-admin-controls)
  - [Login works but Dashy errors on the callback with "OIDC signinCallback returned no user"](#login-works-but-dashy-errors-on-the-callback-with-oidc-signincallback-returned-no-user)
  - [Sign-out leaves you stuck on Authentik](#sign-out-leaves-you-stuck-on-authentik)
  - [Untrusted certificate from Authentik](#untrusted-certificate-from-authentik)
  - [Header auth: "not from trusted proxy"](#header-auth-unauthorized---not-from-trusted-proxy)
  - [Header auth: "missing user header"](#header-auth-unauthorized---missing-user-header)
  - [Invalid user object with all-digit hash](#invalid-user-object-warning-on-startup-with-an-all-digit-hash-or-placeholder)
  - [OIDC login fails with CORS-shaped error from untrusted cert](#oidc-login-looks-like-a-cors-error-in-devtools-but-the-idp-is-configured-for-cors-correctly)
- [Docker & image issues](#docker--image-issues)
  - [Mount Type Mismatch](#mount-type-mismatch)
  - [DockerHub toomanyrequests](#dockerhub-toomanyrequests)
  - [Old image tags fail to pull](#old-image-tags-fail-to-pull)
  - [no matching manifest for linux/arm/v7 (32-bit ARM)](#no-matching-manifest-for-linuxarmv7)
  - [Healthcheck Failing in Docker](#healthcheck-failing-in-docker)
  - [Docker Login Fails on Ubuntu](#docker-login-fails-on-ubuntu)
- [Styles, icons and assets](#styles-icons-and-assets)
  - [Styles and Assets not Updating](#styles-and-assets-not-updating)
  - [Custom Theme not Applying After v4 Upgrade](#custom-theme-not-applying-after-v4-upgrade)
  - [Custom PWA Icon or Name not Showing](#custom-pwa-icon-or-name-not-showing)
  - [Item Icons not Displaying](#item-icons-not-displaying)
  - [Font Awesome Icons not Displaying](#font-awesome-icons-not-displaying)
- [Widgets](#widgets)
  - [Diagnosing Widget Errors](#widget-errors)
  - [Widget Stopped Working](#widget-stopped-working)
  - [Fixing Widget CORS Errors](#widget-cors-errors)
  - [Widget Can't Reach a Local Service](#widget-cant-reach-a-local-service)
  - [CORS Proxy connect ECONNREFUSED or ENOTFOUND](#cors-proxy-connect-econnrefused--or-getaddrinfo-enotfound-)
  - [CORS Proxy Target-URL host blocked or scheme rejected](#cors-proxy-target-url-host--is-blocked--must-use-http-or-https)
  - [CORS Proxy TLS certificate errors](#cors-proxy-unable_to_verify_leaf_signature-or-err_tls_cert_altname_invalid)
  - [Widget Shows Error Incorrectly](#widget-shows-error-incorrectly)
  - [Weather Forecast Widget 401](#weather-forecast-widget-401)
  - [Widget Displaying Inaccurate Data](#widget-displaying-inaccurate-data)
  - [Public IP Widget not working for ipinfo or ipquery providers](#public-ip-widget-not-working-for-ipinfo-or-ipquery-providers)
- [Errors and warnings](#errors-and-warnings)
  - [Config Validation Errors](#config-validation-errors)
  - [Warnings in the Console during deploy](#warnings-in-the-console-during-deploy)
  - [SSL Not Enabled in the Logs](#ssl-not-enabled-in-the-logs)
  - [Copy to Clipboard not Working](#copy-to-clipboard-not-working)
- [How-To / Reference](#how-to--reference)
  - [How to Reset Local Settings](#how-to-reset-local-settings)
  - [How to make a bug report](#how-to-make-a-bug-report)
  - [How-To Open Browser Console](#how-to-open-browser-console)
  - [Git Contributions not Displaying](#git-contributions-not-displaying)

---

## Config not loading

The server reads `conf.yml` from `user-data/` on each request (that's `/app/user-data/` on Docker), which Dashy serves to the base of the domain (like `[your-dashy-instance]/conf.yml`). If you forget to pass in a config, or you put it in the wrong place, you'll see the default Dashy config.

### You see the default dashboard instead of yours

If the page reads "Welcome to your new dashboard!" with a Getting Started section, Dashy is serving the `conf.yml` that ships inside the image. Yours is mounted to the wrong place.

Since v3.0.0 the config lives at `/app/user-data/conf.yml` (NOT `/app/public/conf.yml`)

```bash
docker run -d -p 8080:8080 -v ~/dashy/user-data:/app/user-data lissy93/dashy:latest
```

To see what the container is actually reading: `docker exec -it dashy head /app/user-data/conf.yml`

### "Failed to fetch configuration: Server responded with status 404"

`/app/user-data` is there, but it has no `conf.yml` in it. Usually a host directory got mounted over the top and is empty, or the file is named something else. The name of the root config has to be exactly `conf.yml`.

A file that exists but can't be read by uid 1000 gives the same 404, so check [permissions](#permission-denied-or-read-only-filesystem-eacces-erofs) if the path looks right.

Put the file in place before starting the container:

```bash
mkdir -p ~/dashy/user-data
cp conf.yml ~/dashy/user-data/conf.yml
```

### Config came back after a permissions fix, but auth is ignored

Restart the container after fixing permissions, even though the dashboard already looks repaired. Because auth is resolved once at startup, while `conf.yml` is re-read on every request. See [Permission denied or read-only filesystem](#permission-denied-or-read-only-filesystem-eacces-erofs) for the ownership side, including Synology, NAS and SELinux cases.

```bash
sudo chown -R 1000:1000 ~/dashy/user-data
docker restart dashy
```

### Edits on the host never reach the container

You changed `conf.yml`, restarted, and nothing moved. This is the classic single-file bind mount problem. Most editors save by writing a new file and renaming it over the old one, which breaks the mount's link to the original inode.

Mount the parent directory rather than the file:

```yaml
volumes:
  - ./user-data:/app/user-data
```

Also check the host side is a real path. A bare name with no `/` or `./` in front is a named volume, not a bind mount.

### Your browser shows an old config

Try opening in a private window, do you see the new one now? If so, this is some local settings you've set. Just clear it from Dashy's config menu under Config --> "Reset Local Settings". See [How to Reset Local Settings](#how-to-reset-local-settings).

If the private window is stale too, the server is sending the old file. Check your [mount](#edits-on-the-host-never-reach-the-container), and clear any proxy or CDN cache in front of Dashy.

### Empty dashboard with "Login" in the title

This one is intentional. With auth configured and no session yet, the server sends a cut-down config containing only what the login screen needs. Your sections come back once you're signed in. If you do sign in and it's still empty, the problem is auth rather than config. See [Auth & OIDC](#auth--oidc).

### Static hosting ignores config changes

On Netlify, Vercel, GitHub Pages and similar there's no Dashy server, so `conf.yml` gets copied into `dist/` at build time. Editing it afterwards does nothing until you build again. Commit your change to `user-data/conf.yml` and let the host rebuild, or run `yarn build` locally.

<a id="dashy-hosted-at-a-sub-path-eg-examplecomdashy"></a>

### Nothing loads when Dashy is behind a sub-path

Serve Dashy at `example.com/dashy` and the browser still requests `example.com/conf.yml`. Dashy expects to be at the root of its domain, so the config, saves, sub-pages and page links all use paths starting at `/`. A proxy forwarding only `/dashy/*` never sees those requests.

Give Dashy its own hostname or subdomain instead, like `dashy.example.com`.

---

## Config not saving

There should be an error message, explaining the reason the config save failed. First check [browser console](#how-to-open-browser-console) (<kbd>F12</kbd> --> Console), and then your server-side logs in the terminal. Then, see the following sections for solutions to each possible error.

<a id="config-not-saving-on-vercel--netlify--cdn"></a>
<a id="possible-issue-1-unable-to-call-save-endpoint-from-cdnstatic-server"></a>
<a id="unable-to-write-confyml-eacces-permission-denied"></a>
<a id="permission-denied-saving-config"></a>
<a id="possible-issue-2-unable-to-save"></a>
<a id="config-not-updating"></a>
<a id="config-still-not-updating"></a>
<a id="possible-issue-3-saved-but-not-updating"></a>

### Permission denied or read-only filesystem (EACCES, EROFS)

The container can't write to your `conf.yml` or its directory. Almost always an ownership mismatch: the host directory belongs to a different uid than the one Dashy runs as inside the container. Less commonly a read-only mount or an over-strict file mode.

The `COPY --chown=node:node` in the Dockerfile only sets ownership *inside the image*. When you bind-mount `user-data`, your host directory takes over that path entirely, so its ownership is what counts - not the image's.

Dashy runs as UID=1000 (default non-root node user). You can see this by running `docker exec -it dashy id`. Then, check who owns the user-data directory, with: `docker exec -it dashy ls -la /app/user-data` - if it's not `1000` then that's the issue. And the solution is just to run `sudo chown -R 1000:1000 /path/to/your/user-data` to set the right owner.

Fixes:
1. **Hand the directory to uid 1000** (recommended). Keeps the container running as a non-root user, which is how Dashy is built to run `sudo chown -R 1000:1000 /path/to/your/user-data`
2. **Run the container as your own user** if `chown` isn't practical (multi-user hosts, NAS appliances, host directories you don't want relabelled). Add `--user $(id -u):$(id -g)` to `docker run`, or set `user: "<your-uid>:<your-gid>"` on the service in `docker-compose.yml`.
3. **Loosen a single-file mount** if its mode is `444`. Narrow case, only fixes that one symptom: `chmod 644 /path/to/conf.yml`

**Common mistakes**
- **Using uid/gid 1001.** A common guess on Synology, Unraid and similar where 1001 is the host's first user. Dashy's container is 1000, not 1001.
- **`chmod` alone for a UID mismatch.** Loosens permissions but doesn't change who owns the file. You need `chown`.
- **`chmod -R 777` or `775`.** Works as a workaround, masks the real problem, weakens security. Use `chown` to the right uid instead.

**Other gotchas:**
- **Named Docker volumes** (created with `docker volume create`) inherit ownership from whatever first writes to them. If an older container set them up as root, the diagnose step will show that. Recreate the volume or `chown` the underlying directory under `/var/lib/docker/volumes/`.
- **macOS hosts** rarely hit this. Docker Desktop transparently maps host uid to container uid through its VM. If saves are failing on macOS, look elsewhere first.
- **Storage layers that ignore POSIX permissions** (some NAS app-data folders use FUSE, SMB or overlay mounts where `chmod` and `chgrp` are silent no-ops). Bind-mount user-data from a native filesystem path instead.

### Kubernetes ConfigMap mount is read-only

If you've mounted your `conf.yml` from a ConfigMap, writes will always fail with `EROFS` regardless of UID. ConfigMap volumes are read-only by design. Either treat the ConfigMap as the source of truth and edit it directly (saves through the UI won't work), or use a writable volume type like a `PersistentVolumeClaim` for `user-data/`.

### SELinux or AppArmor blocks the write

If you're on RHEL/Fedora, or systems with SELinux or AppArmour, and you've confirmed permissions are fine, and container's UID matches the host owner, but you still see `EACCES`.

For SELinux, add the `:Z` flag to your volume mount so Docker relabels it for the container (e.g. `volumes: [ './user-data:/app/user-data:Z' ]`)

For AppArmor, check `dmesg` for `apparmor="DENIED"` lines and adjust the profile. Disabling enforcement is a last resort.

### Backup step fails so save aborts

Before each save, Dashy backs up the current `conf.yml` to `user-data/config-backups/`. If that folder can't be written, the whole save aborts with `Unable to backup conf.yml`.

Two ways out:
1. Point `BACKUP_DIR` at a writable path
2. Set `DISABLE_CONFIG_BACKUPS=true` to skip the backup step entirely

### Save button is missing or returns 403 Forbidden

Have you got auth setup? If so, make sure you are logged in as an admin, or set `type: admin` to your user in `conf.yml`.

Beyond that, there's several other config options which prevent saving the config file, so if you didn't mean to add them, just remove from `conf.yml`
- **`appConfig.preventWriteToDisk: true`** disables disk save and the button
- **`appConfig.preventLocalSave: true`** disables the "Local" save option
- **`appConfig.disableConfiguration: true`** hides the editor entirely. `disableConfigurationForNonAdmin: true` does the same just for non-admins.

### Save unavailable on Vercel, Netlify or other static hosts
Updating source config file on static hosts is not possible, since they have no Node server, nor have write access to modify any files.
The "Local" save mode will still work (changes are just persisted in your browser), but the real solution is to copy/export the updated YAML and replace it in the source config file in your repo.

Related: [#1465](https://github.com/Lissy93/dashy/issues/1465).

### `/config-manager/save` returns 404 or HTML
How are you running/serving Dashy?
If you've got a reverse proxy which only forwards specific path prefixes then maybe you're missing the `/config-manager/*` API endpoints?
Check the failed request in the browser's Network tab. If the response is HTML (a proxy error page) or a plain 404, your proxy isn't routing the path. Add `/config-manager/` to whatever you're forwarding, or simplify the rules so everything reaches Dashy.

Or if you're serving up the compiled Vue app directly, instead of using the Node server, then the endpoint won't be available.

### "Invalid filename" when saving a sub-page

The save endpoint only accepts sub-page files ending in `.yml` or `.yaml`. Check the `path:` value of the page in your `pages:` block, e.g. `home.yml`, not `home.txt`.

Sub-page files also need to sit directly in `user-data/`. Dashy drops any folders from the path, so `pages/home.yml` is read from and saved to `user-data/home.yml`.

### "Cannot save to an external URL"

The sub-page you are editing is loaded from a remote URL. Dashy can't write back to that URL.
You will need to edit the file at it's origin yourself instead (click the Export to view the YAML).
Or you could download the config to `user-data/something.yml`, and update `path:` to point to the local version.

### Saved successfully but the UI shows the old config

Two unrelated causes share this symptom:

1. **Local storage overrides the file.** Dashy lets users save settings locally in browser storage, which take priority over `conf.yml`. Open Dashy in incognito to confirm. If the changes appear there, clear local settings via Config menu > "Reset Local Settings".
2. **Docker isn't picking up file changes.** Some text editors save by replacing the inode, which breaks single-file bind mounts. Edit the file in place, or mount the parent directory rather than the single file. [More background](https://medium.com/@jonsbun/why-need-to-be-careful-when-mounting-single-files-into-a-docker-container-4f929340834).

<a id="container-crashes-or-restart-loop-after-saving-config"></a>
<a id="container-crashes-or-restart-loop-after-saving-310-and-311-only"></a>

### Container crashes or restart loop after saving (before 3.2.13)

If your container crashes or restart-loops right after clicking save, with logs like `ERR_HTTP_HEADERS_SENT` or `ERR_STREAM_WRITE_AFTER_END`, this was a known double-`res.end()` bug in versions before 3.2.13. Update to fix it.

```bash
docker pull lissy93/dashy:latest
docker compose up -d --force-recreate
```

### Intentionally read-only mode

To stop anyone saving to disk, set `appConfig.preventWriteToDisk: true` in `conf.yml`. This disables the "Save to Disk" button, and the server rejects saves with a 403. The server reads it on startup, so restart Dashy after adding it by hand.

Without this flag, saving is only limited to admins if you've set up [server-side auth](/docs/authentication/built-in.md#choosing-a-protection-mode), like `auth.users` with `ENABLE_HTTP_AUTH`, OIDC, Keycloak or header auth. With no auth, or `auth.users` alone, anyone who can reach Dashy can save.

For Docker users, you can also mount `user-data` (or just `conf.yml`) as read-only, so the write fails even if a save gets through.

---

## Status Checks Failing

Hover over an item's status indicator to see the error, then find it below.

### `Service Error - 401` or `403`

The service wants credentials. Pass them with [`statusCheckHeaders`](/docs/status-indicators.md#setting-custom-headers), e.g. `statusCheckHeaders: { Authorization: 'Bearer <token>' }`. If you only need to know it's running, accept the code instead with `statusCheckAcceptCodes: '401'`.

### `Service Error` with another status code

The service replied, but not with a 2xx code. If that's normal for this URL, add the code to `statusCheckAcceptCodes`, e.g. `'404'`. Or point `statusCheckUrl` at a page that does return 200, like a health or login page.

### `Invalid URL` or `EBLOCKED`

The URL is missing its protocol. Use `http://192.168.1.5:8080`, not `192.168.1.5:8080`, and include the port if your service needs one.

### Certificate errors

Errors like `DEPTH_ZERO_SELF_SIGNED_CERT`, `SELF_SIGNED_CERT_IN_CHAIN` or `CERT_HAS_EXPIRED` mean the service's certificate isn't trusted. If you trust it, set `statusCheckAllowInsecure: true` on that item.

### `ECONNREFUSED`, `ENOTFOUND` or `ECONNABORTED`

Dashy can't reach the service. `ECONNABORTED` means it gave up after 10 seconds.

Checks run from Dashy's server, not your browser, so the URL has to work from there. In Docker, `localhost` is the Dashy container itself. Use the host's IP instead, or the container name if both are on the same Docker network. Running Dashy with `network_mode: host` also works, see [#445](https://github.com/Lissy93/dashy/discussions/445). Also check your firewall isn't blocking Dashy.

### Every item shows `Failed to make request` or `Request timed out`

Status checks run on Dashy's Node server, so they don't work when the built app is served from a static host or CDN. Run Dashy with Docker or `node server.js` instead. Netlify is the exception, but its function can only reach public URLs.

They're also turned off if `DISABLE_PROXY_ENDPOINTS=true` is set.

### Service doesn't use HTTP

Status checks make an HTTP request and only look at the status code. For things like databases, SSH or game servers, use a ping check instead by setting `pingCheckEnabled: true`. It pings the host from the item's `url`, or set `pingCheckHost` to ping something else.

### Still not sure why it's failing

Open your browser's dev tools, go to the Network tab and filter by `status-check`. Each request shows the URL Dashy checked and the full result. You can also open the endpoint yourself, e.g. `https://your-dashy/status-check/?url=https%3A%2F%2Fexample.com`. Encode the target URL first, with `encodeURIComponent()` or [urlencoder.io](https://www.urlencoder.io/).

---

## 404 / Routing issues

### 404 On Static Hosting

If you're seeing Dashy's 404 page on initial load/ refresh, and then the main app when you go back to Home, then this is likely caused by the Vue router, and if so can be fixed in one of two ways.

The first solution is to switch the routing mode, from HTML5 `history` mode to `hash` mode, by rebuilding Dashy with the `VITE_APP_ROUTING_MODE=hash` build-time environment variable set.

If this works, but you wish to continue using HTML5 history mode, then a bit of extra [server configuration](/docs/management.md#web-server-configuration) is required. This is explained in more detaail in the [Vue Docs](https://router.vuejs.org/guide/essentials/history-mode.html). Once completed, you can then use `VITE_APP_ROUTING_MODE=history` (the default) again, for neater URLs.

### 404 after Launch from Mobile Home Screen

Similar to the above issue, if you get a 404 after using iOS and Android's "Add to Home Screen" feature, then this is caused by Vue router.
It can be fixed by rebuilding Dashy with the `VITE_APP_ROUTING_MODE=hash` build-time environment variable set.

See also: [#628](https://github.com/Lissy93/dashy/issues/628), [#762](https://github.com/Lissy93/dashy/issues/762)

### 404 On Multi-Page Apps

Similar to above, if you get a 404 error when visiting a page directly on multi-page apps, then this can be fixed by rebuilding Dashy with the `VITE_APP_ROUTING_MODE=hash` build-time environment variable set, then refreshing the page.

See also: [#670](https://github.com/Lissy93/dashy/issues/670), [#763](https://github.com/Lissy93/dashy/issues/763)

### Item Opens a Dashy URL Instead of the App

If clicking an item takes you to something like `dashy.example.com/home/www.example.com`, then the item's `url` is missing its protocol. Add `http://` or `https://` to the start, e.g. `url: https://www.example.com`.

<a id="invalid-host-header-while-running-through-ngrok"></a>

### `Blocked request. This host is not allowed` in dev mode

This comes from Vite's dev server (`yarn dev`) when you open it through another hostname, e.g. with ngrok or a reverse proxy. Add the hostname to [`server.allowedHosts`](https://vite.dev/config/server-options#server-allowedhosts) in `vite.config.mjs`, or with ngrok, use `ngrok http 5173 --host-header=rewrite`. The production server (Docker or `node server.js`) doesn't check the hostname.

### `Refused to Connect` in Modal or Workspace View

This is not an issue with Dashy, but instead caused by the target app blocking other sites from embedding it.

It does this with the [`X-Frame-Options`](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/X-Frame-Options) header, or a [`frame-ancestors`](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Content-Security-Policy/frame-ancestors) rule in its `Content-Security-Policy`. To fix it, send a `frame-ancestors` rule that includes Dashy's address. Browsers then ignore `X-Frame-Options`, but it's tidier to remove it. There's no `ALLOW` value for it, and browsers ignore `ALLOW-FROM`. If the app already sends its own `Content-Security-Policy`, edit its `frame-ancestors` rather than adding a second one.

These headers are usually set in the config file for the web server or reverse proxy in front of the target app. Here are some examples for common web servers, just replace `https://dashy.example.com` with your Dashy address. If you can't change the headers, set the item's `target` to `newtab` instead.

#### NGINX

In NGINX, you can use [`add_header`](https://nginx.org/en/docs/http/ngx_http_headers_module.html) within the app block. If the app sends `X-Frame-Options` itself, [`proxy_hide_header`](https://nginx.org/en/docs/http/ngx_http_proxy_module.html#proxy_hide_header) removes it.

```text
server {
  ...
  proxy_hide_header X-Frame-Options;
  add_header Content-Security-Policy "frame-ancestors 'self' https://dashy.example.com" always;
}
```

Then reload with `service nginx reload`

#### Caddy

In Caddy, you can use the [`header`](https://caddyserver.com/docs/caddyfile/directives/header) directive.

```text
header {
  -X-Frame-Options
  Content-Security-Policy "frame-ancestors 'self' https://dashy.example.com"
}
```

#### Apache

In Apache, you can use the [`mod_headers`](https://httpd.apache.org/docs/current/mod/mod_headers.html) module in your config file. This file is usually located somewhere like `/etc/apache2/httpd.conf`

```text
Header unset X-Frame-Options
Header set Content-Security-Policy "frame-ancestors 'self' https://dashy.example.com"
```

#### lighttpd

In lighttpd, you can use [`setenv.set-response-header`](https://redmine.lighttpd.net/projects/lighttpd/wiki/Docs_ModSetEnv).

```text
setenv.set-response-header = ( "Content-Security-Policy" => "frame-ancestors 'self' https://dashy.example.com" )
```

---

## Sub-pages

### Sub-page shows "Unable to find config for ..."

This means Dashy couldn't match the URL segment to any entry in your `pages:` list. A few causes:

#### Old bookmark from before an upgrade
Page URLs changed in v4 for names with letters outside A-Z. For example, `Größe` used to give `/home/gre`, and now gives `/home/größe`. Re-bookmark from the nav, or update the URL by hand.

#### The page was renamed or removed
The URL no longer resolves to anything. Check the `pages:` array in `conf.yml` and confirm the sub-page still exists.

#### The path points at an unreachable file
If the sub-config YAML can't be fetched (404, CORS, auth), you'll see "Unable to load config from ..." instead. Verify the `path:` is correct, reachable from the browser, and CORS-open if remote.

#### Page name literally "Main"
`main` is reserved in the URL scheme to mean "the root config". A page named "Main" becomes reachable at `/home/main-page` (not `/home/main`). Rename the page if that's confusing.

#### Service worker is serving a stale app
Hard-refresh (<kbd>Ctrl</kbd> + <kbd>F5</kbd>) after a major upgrade. The PWA cache may still be pointing at old routes. Also see [Styles and Assets not Updating](#styles-and-assets-not-updating).

### Sub-page missing from nav, or won't open when clicked

If page defined in `pages:` is nowhere in the nav bar, or its link goes to a different page, then there's probably something wrong with the name you chose. Note that Dashy builds each page's URL from its name, keeping only letters, numbers, `-` and `_`.
- Ensure each page does have a valid `name` and `path` field
- Check two pages don't have the same/similar name
- Check each page has a name which has at least some letters or numbers
- Check the page isn't hidden from you by its `displayData`

### Sub-page ignores its theme, layout or appConfig

A sub-page's `appConfig` is merged over your root one, so its theme, layout and other settings should apply. If they don't, you've probably picked a theme or layout in the UI on that page. That's saved in your browser and takes priority, so clear it with [Reset Local Settings](#how-to-reset-local-settings).

The exception is `appConfig.auth`, which only ever comes from your root `conf.yml`. See [Restrictions](/docs/pages-and-sections.md#restrictions).

### Sub-config files return 404

If your `conf.yml` references additional pages via `pages:` and Dashy shows `Unable to load config from '/something.yml'`, the cause is almost always a Docker mount that only exposes `conf.yml` and not the rest of `user-data/`.

If you've done this:

```yaml
volumes:
  - ./my-conf.yml:/app/user-data/conf.yml
```

Only `conf.yml` exists inside the container. Anything it references (sub-configs, custom icons, fonts, CSS) isn't there.

Mount the directory instead:

```yaml
volumes:
  - ./user-data:/app/user-data
```

Now everything in your `user-data` folder is reachable at the web root. Same applies to `docker run -v`.

### Remote Config Not Loading

If you've got a multi-page dashboard, and are hosting the additional config files yourself, then CORS rules will apply. A CORS error will look something like:

```text
Access to fetch at 'https://example.com/raw/my-config.yml' from origin 'http://dashy.local' has been blocked by CORS policy:
No 'Access-Control-Allow-Origin' header is present on the requested resource.
```

The solution is to add the appropriate headers onto the target server, to allow it to accept requests from the origin where you're running Dashy.

If it is a remote service, that you do not have admin access to, then another option is to proxy the request. Either host your own, or use a publicly accessible service, like [allorigins.win](https://allorigins.win), e.g: `https://api.allorigins.win/raw?url=https://pastebin.com/raw/4tZpaJV5`. For git-based services specifically, there's [raw.githack.com](https://raw.githack.com/)

---

## Build & memory errors

### Yarn Error

For more info, see [Issue #1](https://github.com/Lissy93/dashy/issues/1)

First of all, check that you've got yarn installed correctly - see the [yarn installation docs](https://classic.yarnpkg.com/en/docs/install) for more info.

If you're getting an error about scenarios, then you've likely installed the wrong yarn... (you're [not](https://github.com/yarnpkg/yarn/issues/2821) the only one!). You can fix it by uninstalling, adding the correct repo, and reinstalling, for example, in Debian:

- `sudo apt remove yarn`
- `curl -sS https://dl.yarnpkg.com/debian/pubkey.gpg | sudo apt-key add -`
- `echo "deb https://dl.yarnpkg.com/debian/ stable main" | sudo tee /etc/apt/sources.list.d/yarn.list`
- `sudo apt update && sudo apt install yarn`

Alternatively, as a workaround, you have several options:

- Try using [NPM](https://www.npmjs.com/get-npm) instead: So clone, cd, then run `npm install`, `npm run build` and `npm start`
- Try using [Docker](https://www.docker.com/get-started) instead, and all of the system setup and dependencies will already be taken care of. So from within the directory, just run `docker build -t lissy93/dashy .` to build, and then use docker start to run the project, e.g: `docker run -it -p 8080:8080 lissy93/dashy` (see the [Docker docs](/docs/deployment/docker.md) for more info)

### The engine "node" is incompatible with this module

You'll see this error while running `yarn`, if your version of Node is too old or incompatible. 

The solution is to upgrade to the latest LTS version of Node 24.
Alternatively (not recommended), you can ignore this warning by running `yarn install --ignore-engines`.


Dashy needs Node **`^22.22.2 || ^24.15.0 || >=26.0.0`** - that's 22.22.2 or newer on the Node 22 line, 24.15.0 or newer on the Node 24 line, or Node 26 and up.
Check your current version with `node --version`.
The easiest way to do this, is to use a version manager, like [nvm](https://github.com/nvm-sh/nvm) to quickly download and apply different node versions. Run `nvm install 24` then `nvm use 24`.


### `Cannot find module` after updating

If Dashy won't start after an update, with an error like `Error: Cannot find module 'jose'`, then the new version's dependencies weren't installed. If you run Dashy from source, do all of these steps on every update, from Dashy's directory:

```bash
git pull origin master
yarn
yarn build
yarn start
```

Use `yarn` rather than `npm`, so you get the exact versions Dashy was tested with. If you've used `npm install` before, delete `node_modules` and `package-lock.json`, then run `yarn` again.

If you installed with the [Proxmox VE Helper-Scripts](/docs/deployment/self-hosted-os.md#proxmox-ve), run `update` in the LXC's console instead, and report any problems with the script to that project.

### `yarn build` fails inside the container

If you run `docker exec <container> yarn build` and get `vite: not found` (or similar), it's because the published image ships only production dependencies. The build toolchain (vite, vue-tsc, sass, etc.) lives in `devDependencies` and isn't installed in the runtime image.

You almost certainly don't need to rebuild. Dashy's Express server reads `user-data/conf.yml` on every request, so config changes show up on a page refresh, no rebuild required.

If you genuinely need a fresh build (you've patched something in `src/`), do it on the host with `yarn install && yarn build`, or build a custom image from a checkout of the repo.

### High CPU or RAM Usage on Startup

Since v4, the Docker image comes prebuilt, so starting it just runs the server, which idles at around 100 MB of RAM. If you see a big CPU or RAM spike every time the container starts, you're on an older version, which built the app on startup. Update to `lissy93/dashy:latest`.

Building Dashy yourself (`yarn build` or `docker build`) still needs a lot more memory than running it. If that's too much for your host, build it somewhere else, or use the prebuilt image.

See also: [#1585](https://github.com/Lissy93/dashy/issues/1585), [#969](https://github.com/Lissy93/dashy/issues/969), [#1500](https://github.com/Lissy93/dashy/issues/1500), [#877](https://github.com/Lissy93/dashy/issues/877)

### Ineffective mark-compacts near heap limit Allocation failed

If you see an error message, similar to:

```text
<--- Last few GCs --->

[61:0x74533040] 229060 ms: Mark-sweep (reduce) 127.1 (236.9) -> 127.1 (137.4) MB, 5560.7 / 0.3 ms (average mu = 0.286, current mu = 0.011) allocation failure scavenge might not succeed

<--- JS stacktrace --->

FATAL ERROR: Reached heap limit Allocation failed - JavaScript heap out of memory
```

Node ran out of memory while building Dashy. With v4 this only happens when you build it yourself, so build on a machine with more free RAM, or use the prebuilt Docker image. Older versions built on every start, so if you're on one, update, or give the container more memory with e.g. `--memory=1024m`. For more info, see [Docker: Runtime options with Memory, CPUs, and GPUs](https://docs.docker.com/config/containers/resource_constraints/).

See also: [#380](https://github.com/Lissy93/dashy/issues/380), [#350](https://github.com/Lissy93/dashy/issues/350), [#297](https://github.com/Lissy93/dashy/issues/297), [#349](https://github.com/Lissy93/dashy/issues/349), [#510](https://github.com/Lissy93/dashy/issues/510), [#511](https://github.com/Lissy93/dashy/issues/511) and [#834](https://github.com/Lissy93/dashy/issues/834)

### Command failed with signal "SIGKILL"

The build was killed for using too much memory. Same causes and fixes as [Heap limit Allocation failed](#ineffective-mark-compacts-near-heap-limit-allocation-failed) above.

See also [#624](https://github.com/Lissy93/dashy/issues/624)

### Unreachable Code Error

An error similar to: `Fatal error in , line 0. Unreachable code, FailureMessage Object: 0xffe6c8ac. Illegal instruction (core dumped)`
Is related to a bug in a downstream package, see [nodejs/docker-node#1477](https://github.com/nodejs/docker-node/issues/1477).
Usually, updating your system and packages will resolve the issue.

See also: [#776](https://github.com/Lissy93/dashy/issues/776)

### Error: Cannot find module './_baseValues'

Clearing the cache should fix this: `yarn cache clean`
If the issue persists, remove `node_modules` and reinstall: `rm -rf node_modules && yarn`

---

## Auth & OIDC

<a id="auth-validation-error-should-be-object"></a>

### Auth Validation Error: "must be object"

Your `appConfig.auth` is still in the list format from before V 1.6.5, which is no longer supported. Dashy ignores it and logs a warning, so your login is turned off and anyone can see your dashboard. Users now go under `auth.users`.

For more info, see [this announcement](https://github.com/Lissy93/dashy/discussions/177).

You can fix this by replacing:

```yaml
auth:
- user: xxx
  hash: xxx
```

with

```yaml
auth:
  users:
  - user: xxx
    hash: xxx
```

### Anyone can open `/conf.yml` without logging in

With only `auth.users` set, the login page runs in the browser, but the server doesn't check it. So anyone can still open `/conf.yml` directly, and see your config, users and password hashes.

To have the server enforce the login too, set the `ENABLE_HTTP_AUTH=true` environment variable and restart Dashy. Note that guest access doesn't work in this mode. Or use OIDC, Keycloak or header auth instead. See [Choosing a Protection Mode](/docs/authentication/built-in.md#choosing-a-protection-mode).

Logged-in users can still read the whole config, so keep API keys out of it with [environment variables](/docs/widgets.md#handling-secrets).

### Keycloak Redirect Error

Check the [browser's console output](#how-to-open-browser-console), if you've not set any headers, you will likely see a CORS error here, which would be the source of the issue.

You need to allow Dashy to make requests to Keycloak, and Keycloak to redirect to Dashy. The way you do this depends on how you're hosting these applications / which proxy you are using, and examples can be found in the [Management Docs](/docs/management.md#setting-headers).

For example, add the access control header to Keycloak, like:

`Access-Control-Allow-Origin [URL-of Dashy]`

Note that for requests that transport sensitive info like credentials, setting `Access-Control-Allow-Origin` to a wildcard (`*`) is not allowed - see [MDN Docs](https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS#requests_with_credentials), so you will need to specify the actual URL.

You should also ensure that Keycloak is correctly configured, with a user, realm and application, and be sure that you have set a valid redirect URL in Keycloak ([screenshot](https://user-images.githubusercontent.com/1862727/148599768-db4ee4f8-72c5-402d-8f00-051d999e6267.png)).

For more details on how to set headers, see the [Example Headers](/docs/management.md#setting-headers) in the management docs, or reference the documentation for your proxy.

If you're running in Kubernetes, you will need to enable CORS ingress rules, see [docs](https://kubernetes.github.io/ingress-nginx/user-guide/nginx-configuration/annotations/#enable-cors), e.g:

```text
nginx.ingress.kubernetes.io/cors-allow-origin: "https://dashy.example.com"
nginx.ingress.kubernetes.io/enable-cors: "true"
```

See also: #479, #409, #507, #491, #341, #520

<a id="numeric-client_id-getting-truncated"></a>

### OIDC or Keycloak failure on numeric client IDs

If your IdP rejects the login with an *"invalid client"* / *"client not found"* error, and your `clientId` is a long numeric value, the cause is almost certainly YAML number parsing.

YAML parses unquoted numeric tokens as Numbers, and JavaScript can't represent integers larger than 2^53 (~16 digits) without losing precision. So an unquoted numeric `clientId` will be silently truncated (e.g. `918756876419824312` → `918756876419824300`), or - for very large values - converted to scientific notation (e.g. `9.187568764198242e+37`), and the IdP will reject it.

The fix is to wrap the `clientId` in quotes in your `conf.yml` so it gets parsed as a string:

```yaml
appConfig:
  auth:
    enableOidc: true
    oidc:
      clientId: "918756876419824312"
      endpoint: https://idp.example.com/
```

The same applies to `auth.keycloak.clientId`. Dashy will print a warning in the [browser console](#how-to-open-browser-console) when a numeric `clientId` is too long to store exactly, to help diagnose this.

See also: #1941


### Redirect loop after login
Your `endpoint` probably includes `.well-known/openid-configuration`. Drop everything from `.well-known` onwards

### invalid_redirect_uri
The redirect URI registered with your provider doesn't exactly match the URL Dashy is being served from. Register both the bare URL and the trailing-slash version, and make sure the scheme matches (`http` vs `https`).

<a id="login-works-in-the-browser-but-the-dashboard-refuses-to-save-anything-403"></a>

### Login works, but Dashy shows "Authentication failed (OIDC)"
Your provider accepted the login, but Dashy's server is rejecting the id_token. The browser console will say `OIDC login succeeded, but Dashy still received unauthenticated config`. Check Dashy's container logs for `[auth-oidc] token verification failed`. Common causes:
- **Issuer mismatch**. Authentik is behind a reverse proxy that isn't sending `X-Forwarded-Proto: https`, so its discovery document advertises `http://` while you configured `https://` in Dashy. Fix the proxy or set `AUTHENTIK_HOST`/`AUTHENTIK_LISTEN__TRUSTED_PROXY_CIDRS` on the Authentik containers
- **Audience mismatch**. The `aud` claim in the id_token doesn't match your `clientId`. Confirm the provider's Client ID and your `clientId` are exactly the same (no leading or trailing whitespace)
- **Dashy server can't reach your provider**. The Dashy container fails to fetch the discovery document. Exec into the container and try `wget -qO- <your-endpoint>/.well-known/openid-configuration`
- **Clock skew**. The middleware allows 30 seconds of drift. If a container's clock is further off than that, `exp`/`iat` checks fail

If you've exhausted these and need a stop-gap, set `oidc.disableServerSideCheck: true` to skip server-side verification and fall back to client-side-only auth. This leaves Dashy's server routes unprotected, so only use it in a trusted environment (see the [OIDC docs](/docs/authentication/oidc.md)).

### Sent back to the login page after a while
Your SSO session's id_token expired, so Dashy signs you out (rather than leaving a logged-in-looking UI whose API calls all silently 401). For OIDC, set `oidc.enableSilentRenew: true` to refresh the session in the background before it lapses; this needs your provider to issue refresh tokens (Dashy adds the `offline_access` scope automatically when it's on). Otherwise, just sign in again when prompted.

### Logged in but no admin controls
Dashy only makes you an admin if your token's groups or roles include the `adminGroup` or `adminRole` set in your `oidc` or `keycloak` config. Check one of those is set, and matches exactly. With OIDC, the [browser console](#how-to-open-browser-console) shows `Authenticated as <user> (non-admin)` after login, along with the groups and roles Dashy received. If your group isn't there:
- The user is not in that group
- Your provider isn't sending a `groups` claim. In Authentik, the `groups` scope mapping needs to exist and be attached to the provider
- You've set `scope:` in conf.yml and left out `groups`

### Login works but Dashy errors on the callback with "OIDC signinCallback returned no user"
The id_token came back without a username claim. Confirm the provider has "profile" and "email" in its scopes and the "Include claims in id_token" is on

### Sign-out leaves you stuck on Authentik
Dashy redirects to Authentik's end-session endpoint on logout. If Authentik's invalidation flow prompts for confirmation (the default), that's expected - click through it. To skip the prompt entirely, change the provider's invalidation flow to one without a consent stage.

### Untrusted certificate from Authentik
Self-signed certs make Dashy's server-side fetch of the discovery document fail. Use a real cert (Let's Encrypt, or your homelab CA installed into the Dashy image) for the Authentik hostname.

### Header auth: "Unauthorized - not from trusted proxy"
The IP your reverse proxy presents as isn't in `auth.headerAuth.proxyWhitelist`. For Docker it's usually the bridge IP, not your LAN IP. Find it with `docker compose exec dashy getent hosts <proxy-service-name>` and paste that into `proxyWhitelist`. Restart Dashy after the change.

### Header auth: "Unauthorized - missing user header"
The source IP check passed, but the configured `userHeader` isn't on the request. Either the proxy isn't sending it (check the Cloudflare Access policy / Authelia forward-auth / Tailscale Serve config is actually applied), or the header name in `conf.yml` doesn't match what the proxy sends. Header matching is case-insensitive, but spelling and prefix matter.

### "Invalid user object" warning on startup with an all-digit hash or placeholder
YAML parsed your `hash:` value as a number rather than a string, because every character was a digit. Common when using placeholder all-zero hashes under header auth. Quote it: `hash: "0000..."`. Same root cause as the numeric `clientId` issue above.

### OIDC login looks like a CORS error in devtools, but the IdP is configured for CORS correctly
If your identity provider uses a self-signed or untrusted certificate, the browser will silently abort `oidc-client-ts`'s token-exchange fetch and surface it as a CORS-shaped error. Open the IdP URL directly in a new tab, accept the certificate warning, then retry the Dashy login. The real fix is to use a trusted cert (Let's Encrypt, or a homelab CA installed into the browser's trust store).

---

## Docker & image issues

### Mount Type Mismatch

```text
Error response from daemon: ... mount through procfd: not a directory:
Are you trying to mount a directory onto a file (or vice-versa)?
```

This means the host side and container side of your volume don't agree on whether the target is a file or a directory.

Recommended pattern: mount a host directory onto `/app/user-data`. The directory must exist on the host and contain at least a `conf.yml`:

```bash
mkdir -p ~/dashy-data
cp /path/to/your/conf.yml ~/dashy-data/conf.yml
docker run -d -p 8080:8080 -v ~/dashy-data:/app/user-data lissy93/dashy:latest
```

If you'd rather mount a single file (`-v ~/conf.yml:/app/user-data/conf.yml`), the host path must be a file that already exists, otherwise Docker creates a directory in its place and you'll see this error.

### DockerHub `toomanyrequests`

This situation relates to error messages similar to one of the following, returned when pulling, updating or running the Docker container from Docker Hub.

```text
Continuing execution. Pulling image lissy93/dashy:release-1.6.0
error pulling image configuration: toomanyrequests
```

or

```text
You have reached your pull rate limit. You may increase the limit by authenticating and upgrading: https://www.docker.com/increase-rate-limit
```

When DockerHub returns one of these errors, or a `429` status, that means you've hit your rate limit. Docker Hub allows 10 pulls an hour per IP address if you're not logged in, or 100 an hour on a free account.
You can [check your rate limit status](https://www.docker.com/blog/checking-your-current-docker-pull-rate-limits-and-status/) by looking for the `ratelimit-remaining` header in any DockerHub responses.

#### Solution 1 - Use an alternate container registry

- Dashy is also available through GHCR, which at present does not have any hard limits. Just use `docker pull ghcr.io/lissy93/dashy:latest` to fetch the image
- You can also build the image from source, by cloning the repo, and running `docker build -t dashy .` or use the pre-made docker compose

#### Solution 2 - Increase your rate limits

- Logging in to DockerHub (`docker login`) will increase your rate limit from 10 to 100 pulls per hour
- Paid plans (Pro and above) have no pull limit
- Since rate limits are counted based on your IP address, proxying your requests, or using a VPN may work

### Old image tags fail to pull

If `docker pull` returns `manifest unknown` or `manifest for lissy93/dashy:arm32v7 not found`, the cause is a stale architecture-specific tag in your compose file or run command. Tags like `:arm32v7`, `:arm64v8`, and `:multi-arch` are no longer published.

The `:latest` tag is multi-arch and works on amd64 and arm64 without you having to pick a variant. Just use:

```yaml
image: lissy93/dashy:latest
```

Docker fetches the right architecture for your host automatically. To pin a version, use a semver tag, e.g. `lissy93/dashy:3.2.14`.

### `no matching manifest for linux/arm/v7`

Dashy's Docker image is built for `amd64` and `arm64` only (`4.4.10` was the last release to include a 32-bit `armv7` build). On a 32-bit ARM host (Raspberry Pi 2, or a Pi 3/4 running a 32-bit OS), `docker pull`, `docker run` or `docker compose up` fails with:

```
no matching manifest for linux/arm/v7 in the manifest list entries
```

(Pi 1 and Pi Zero report `linux/arm/v6`.) 32-bit ARM was dropped because the build toolchain (Rolldown) no longer ships a 32-bit ARM binary, and Node 24 dropped 32-bit ARM too. To fix it:

- **Recommended:** reinstall your host OS as 64-bit (`arm64`). The Raspberry Pi 3 and newer all support it, and Dashy's `arm64` image is then selected automatically.
- **Stay on 32-bit:** pin the last image that shipped `armv7`:
  ```yaml
  image: lissy93/dashy:4.4.10
  ```

### Healthcheck Failing in Docker

If `docker ps` shows the Dashy container as `unhealthy`, the periodic healthcheck (`node services/healthcheck.js`, run every 5 minutes by default) couldn't reach the local server.

#### SSL-enabled Dashy

The healthcheck reads the same cert paths as the main server (`/etc/ssl/certs/dashy-pub.pem` and `/etc/ssl/certs/dashy-priv.key`) to detect whether to probe HTTPS or HTTP. If you've mounted certs at non-default paths via `SSL_PUB_KEY_PATH` / `SSL_PRIV_KEY_PATH`, the healthcheck will pick those up automatically as long as those env vars are set on the container. With certs in place, it checks `SSL_PORT` (443 by default) over HTTPS, instead of `PORT`.

#### Custom port

If you've set `PORT` to override the default 8080, the healthcheck honors the same env var, so it should work without changes. Make sure `PORT` is set in the container environment, not just in the host-side Docker port mapping.

#### Container is unhealthy past the grace period

The healthcheck has a 20s `start-period` after which failures start counting. The image is prebuilt, so startup is just `node server.js` binding to a port - fast even on a Pi. If the container is still `unhealthy` past the grace period, the server isn't listening where the healthcheck expects. Check `docker logs <container>` for `Unable to start Dashy's Node server`, which usually means something else is already using that port, e.g. when running with `network_mode: host`. A broken `conf.yml` won't cause this, since the healthcheck doesn't depend on it.

See also: [#1410](https://github.com/Lissy93/dashy/issues/1410)

### Docker Login Fails on Ubuntu

Run `sudo apt install gnupg2 pass && gpg2 -k`

---

## Styles, icons and assets

### Styles and Assets not Updating

If you find that your styles and other visual assets work when visiting `ip:port` by not `dashy.domain.com`, then this is usually caused by caching. In your browser, do a hard-refresh (<kbd>Ctrl</kbd> + <kbd>F5</kbd>). If you use Cloudflare, then you can clear the cache through the management console, or set the cache level to Bypass for certain files, under the Rules tab.

### Custom Theme not Applying After v4 Upgrade

Older versions rebuilt Dashy when the container started, so you could mount SCSS files into `/app/src`, like `user-defined-themes.scss`. The v4 image comes prebuilt without the source code, so those files are now ignored.

Move your styles into a plain CSS file in `user-data`, wrapped in `html[data-theme='mytheme'] { ... }`, then load it with:

```yaml
appConfig:
  theme: mytheme
  cssThemes: [mytheme]
  externalStyleSheet: /mytheme.css
```

See [Full CSS file](/docs/theming.md#option-2-full-css-file) for a complete example. SCSS-only syntax, like `$variables` or `//` comments, won't work in a CSS file. A `//` comment breaks the rule after it, so use `/* */` instead.

### Custom PWA Icon or Name not Showing

To install Dashy as an app with your own name and icon, add a manifest to your `user-data` folder. This is what Firefox's "Add tab to taskbar" and Chrome or Edge's Install button read. `pageInfo.title` and `pageInfo.favicon` only change the browser tab.

1. If you're using Docker, mount the whole `user-data` folder, not just `conf.yml`
2. Put a 192x192 and a 512x512 PNG of your icon in user-data, e.g. `icon-192.png` and `icon-512.png`
3. Create `user-data/manifest.webmanifest`. Dashy v4 doesn't use `manifest.json`
4. Check that `https://your-dashy/manifest.webmanifest` shows your JSON, not Dashy's default

Example user-data/manifest.webmanifest

   ```json
   {
     "name": "My Dashboard",
     "short_name": "Dashboard",
     "start_url": "/",
     "scope": "/",
     "display": "standalone",
     "icons": [
       { "src": "/icon-192.png", "sizes": "192x192", "type": "image/png" },
       { "src": "/icon-512.png", "sizes": "512x512", "type": "image/png" }
     ]
   }
   ```

If the installed app still has Dashy's name or icon, it's usually one of these:

- **Browser cache.** Your browser saves the app's details the first time you install it, so remove the app and add it again. In Firefox, open the app and click "Remove tab from taskbar" in the address bar. Unpinning it from the Windows taskbar isn't enough. Still stuck? Try a fresh browser profile.
- **Service worker.** With `appConfig.enableServiceWorker: true`, the service worker can keep serving the old manifest. Set it to `false`, or clear the site's data in your browser.
- **SVG icons.** Browser support for SVG manifest icons varies, so include the PNGs.
- **Content-Security-Policy.** If you set a CSP header, it needs `manifest-src 'self'` or the browser will block the manifest.
- **Auth proxy.** If the manifest URL shows a login page, your proxy is blocking it. Let the manifest and icons through without auth (see below)

Example of skipping auth in nginx for manifest and icons:
  ```nginx
  location ~ ^/(manifest\.webmanifest|icon-.*\.png)$ {
      auth_request off;
      proxy_pass http://dashy:8080;
  }
  ```

See also: [#2391](https://github.com/Lissy93/dashy/issues/2391)

### Item Icons not Displaying

If an item's icon is blank, check which kind of icon it is:

- **Local images** go in `user-data/item-icons/`, and are referenced by file name, e.g. `icon: proxmox.png`. Check it loads at `https://your-dashy/item-icons/proxmox.png`. If not, check the file name, and that your Docker mount includes that folder. Only lowercase `.png`, `.svg` and `.jpg` files are recognised, so convert or rename anything else, like `.webp`, `.jpeg` or `.PNG`.
- **Favicons** (`icon: favicon`) are fetched by an online service, which can't reach your local network. Dashy only loads `/favicon.ico` straight from the service when its URL is a private IP or `localhost`. Set `appConfig.faviconApi: local` to do this for every item. If the service keeps its icon somewhere else, use the image's URL or an icon pack instead.
- **Icon packs** need their prefix, e.g. `hl-proxmox` or `fas fa-server`. Check the name exists in that pack.
- **Icon URLs** must point straight at the image, and be reachable from your browser. For GitHub, use the raw file link, not the `/blob/` page.

See [Icons](/docs/icons.md) for all the options.

### Font Awesome Icons not Displaying

Usually, Font Awesome will be automatically enabled if one or more of your icons are using Font-Awesome. If this is not happening, then you can always manually enable (or disable) Font Awesome by setting: [`appConfig`](/docs/configuring.md#appconfig-optional).`enableFontAwesome` to `true`.

If you are trying to use a premium icon, then you must have a [Pro License](https://fontawesome.com/plans). You'll then need to specify your Pro plan API key under `appConfig.fontAwesomeKey`. You can find this key, by logging into your FA account, navigate to Account → [Kits](https://fontawesome.com/kits) → New Kit → Copy Kit Code. The code is a 10-digit alpha-numeric code, and is also visible within the new kit's URL, for example: `81e48ce079`.

<p align="center"><img src="https://i.ibb.co/hZ0D9vs/where-do-i-find-my-font-awesome-key.png" width="600" /></p>

Be sure that you're specifying the icon category and name correctly. You're icon should look be `[category] fa-[icon-name]`. The following categories are supported: `far` _(regular)_, `fas` _(solid)_, `fal`_(light)_, `fad` _(duo-tone)_ and `fab`_(brands)_. With the exception of brands, you'll usually want all your icons to be in from same category, so they look uniform.

Ensure the icon you are trying to use, is available within [FontAwesome Version 5](https://fontawesome.com/v5/search) (we've not yet upgraded to V6, as it works a little differently).

Examples: `fab fa-raspberry-pi`, `fas fa-database`, `fas fa-server`, `fas fa-ethernet`

Finally, check the [browser console](#how-to-open-browser-console) for any error messages, and raise a ticket if the issue persists.

---

## Widgets

### Widget Errors

#### Find Error Message

If an error occurs when fetching or rendering results, you will see a short message in the UI. If that message doesn't adequately explain the problem, then you can [open the browser console](/docs/troubleshooting.md#how-to-open-browser-console) to see more details.

#### Check Config

Before proceeding, ensure that if the widget requires auth your API is correct, and for custom widgets, double check that the URL and protocol is correct.

#### Timeout Error

If the widget says `Request timed out`, or the console shows `RequestError: timeout of ...ms exceeded`, then the service didn't respond in time. Check it's reachable, and if it's just slow, [set a longer timeout](/docs/widgets.md#setting-timeout) on that widget with the `timeout` attribute, in ms. The default is `50000` (50 seconds). With `useProxy`, you'll see `Upstream server timed out` instead, and the proxy always gives up after 30 seconds.

#### CORS error

If the console message mentions to corss-origin blocking, then this is a CORS error, see: [Fixing Widget CORS Errors](#widget-cors-errors)

#### More Info

If you're able to, you can find more information about why the request may be failing in the Dev Tools under the Network tab, and you can ensure your endpoint is correct and working using a tool like Postman.

### Widget Stopped Working

If a widget that used to work now shows `Unable to fetch data` or another error, the API behind it has usually changed. These get fixed in Dashy as they come up, so first update to the latest version. Then check the [widget's docs](/docs/widgets.md) for anything new it needs, e.g. Pi-hole v6 needs the `pi-hole-stats-v6` widget.

Still failing? Find the real error in the [browser console](#how-to-open-browser-console) and Network tab, then [raise a ticket](#how-to-make-a-bug-report).

### Widget CORS Errors

The most common widget issue is a CORS error. This is a browser security mechanism which prevents the client-side app (Dashy) from from accessing resources on a remote origin, without that server's explicit permission (e.g. with headers like Access-Control-Allow-Origin). See the MDN Docs for more info: [Cross-Origin Resource Sharing](https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS).

There are several ways to fix a CORS error:

#### Option 1 - Ensure Correct Protocol

If Dashy is served over HTTPS, your browser blocks requests to `http://` services. This is called mixed content rather than CORS, but it looks the same in Dashy. So use `https://` for the service if it supports it, or proxy the request (see option 3). Also check the URL is correctly formatted.

#### Option 2 - Set Headers

If you have control over the destination (e.g. for a self-hosted service), then you can simply apply the correct headers.
Add the `Access-Control-Allow-Origin` header, with the value of either `*` to allow requests from anywhere, or more securely, the host of where Dashy is served from. For example:

```text
Access-Control-Allow-Origin: https://url-of-dashy.local
```

or

```text
Access-Control-Allow-Origin: *
```

For more info on how to set headers, see: [Setting Headers](/docs/management.md#setting-headers) in the management docs

#### Option 3 - Proxying Request

You can route requests through Dashy's built-in CORS proxy. Instructions and more details can be found [here](/docs/widgets.md#proxying-requests). If you don't have control over the target origin, and you are running Dashy either through Docker, with the Node server or on Netlify, then this solution will work for you.

Just add the `useProxy: true` option to the failing widget.

#### Option 4 - Use a plugin

For testing purposes, you can use an addon, which will disable the CORS checks. You can get the Allow-CORS extension for [Chrome](https://chrome.google.com/webstore/detail/allow-cors-access-control/lhobafahddgcelffkeicbaginigeejlf?hl=en-US) or [Firefox](https://addons.mozilla.org/en-US/firefox/addon/access-control-allow-origin/), more details [here](https://mybrowseraddon.com/access-control-allow-origin.html)

### Widget Can't Reach a Local Service

Widgets fetch their data from your browser, not from Dashy's server. So `http://localhost:61208` means the device you're browsing on, and a container name like `http://glances:61208` won't resolve at all.

Use an address your browser can reach, like the server's IP. Or add `useProxy: true` to the widget, so Dashy's server makes the request instead. Container names then work if Dashy is on the same Docker network, but `localhost` means the Dashy container, see [below](#cors-proxy-connect-econnrefused--or-getaddrinfo-enotfound-). To proxy all widgets, set `appConfig.widgetsAlwaysUseProxy: true`.

### CORS Proxy `connect ECONNREFUSED ...` or `getaddrinfo ENOTFOUND ...`

The target host is unreachable from the Dashy container. If the target is on the same host as Dashy, **don't use `localhost`** - inside a Docker container that resolves to the container itself, not the host. Use the host's LAN IP, the Docker bridge gateway, or `host.docker.internal` (on Docker Desktop). If the target is on a different Docker network, attach Dashy to that network too.

### CORS Proxy `Target-URL host '...' is blocked` / `must use http:// or https://`

To prevent the CORS proxy from being abused as a Server-Side Request Forgery vector, Dashy refuses to proxy a small number of host/scheme combinations by default:

- **Cloud instance metadata services** - `169.254.169.254`, `metadata.google.internal`, and the matching IPv6 forms. These are reserved magic addresses on AWS, Azure, GCP, DigitalOcean, Hetzner, Oracle Cloud and most other providers. A widget that successfully fetches them on a cloud-hosted Dashy can leak the host's IAM credentials, so they're blocked unconditionally.
- **Non-HTTP(S) schemes** - `file://`, `ftp://`, `gopher://`, `javascript:`, `data:`, and similar. The proxy is meant for HTTP APIs only.

If you're running Dashy in a fully isolated/private environment and you've deliberately decided you want to allow these (for example, you genuinely need to query your cloud provider's metadata API from a widget), you can opt out of all proxy restrictions by setting the environment variable:

```bash
DANGEROUSLY_DISABLE_PROXY_RESTRICTIONS=true
```

The variable is named so loudly because flipping it on a Dashy instance that's exposed to anything other than fully trusted users re-opens the SSRF surface - anyone who can hit `/cors-proxy` can then use Dashy as a relay to reach internal services. **Don't set it on cloud-hosted or internet-exposed deployments.**

Note that this is an all-or-nothing escape hatch, not a per-host allowlist. If you only need to reach one specific host that's currently blocked, please open a feature request describing the use case.

### CORS Proxy `UNABLE_TO_VERIFY_LEAF_SIGNATURE` or `ERR_TLS_CERT_ALTNAME_INVALID`

The target's certificate can't be verified - it's self-signed, issued by a private CA, or issued for a different hostname than the one you're requesting. If you trust the host, add `allowInsecure: true` to the widget (`useProxy: true` is needed too). To keep verification on instead, mount your CA into the container and point `NODE_EXTRA_CA_CERTS` at it. See [Ignoring Certificate Errors](/docs/widgets.md#ignoring-certificate-errors).

### Widget Shows Error Incorrectly

When there's an error fetching or displaying a widgets data, then it will be highlighted in yellow, and a message displayed on the UI.

In some instances, this is a false positive, and the widget is actually functioning correctly.
If this is the case, you can disable the UI error message of a given widget by setting: `ignoreErrors: true`

### Weather Forecast Widget 401

A 401 error means your API key is invalid, it is not an issue with Dashy.

Usually this happens due to an error in your config. If you're unsure, copy and paste the [example](/docs/widgets.md#weather-forecast) config, replacing the API key with your own.

Check that `apiKey` is correctly specified, and nested within `options`. Ensure your input city is valid.

To test your API key, try making a request to `https://api.openweathermap.org/data/2.5/weather?q=London&appid=[your-api-key]`

New OpenWeatherMap keys can take a couple of hours to start working, so a brand new key may return `401` at first.

See also: [#803](https://github.com/Lissy93/dashy/issues/803), [#789](https://github.com/Lissy93/dashy/issues/789), [#577](https://github.com/Lissy93/dashy/issues/577), [#621](https://github.com/Lissy93/dashy/issues/621), [#578](https://github.com/Lissy93/dashy/issues/578), [#806](https://github.com/Lissy93/dashy/discussions/806)

### Widget Displaying Inaccurate Data

If any widget is not displaying the data you expect, first confirm that your config is correct, then try manually calling the API endpoint.

If the raw API output is correct, yet the widget is rendering incorrect results, then it is likely a bug, and a ticket should be raised. You can start to debug the issue, by looking at the widget's code ([here](https://github.com/Lissy93/dashy/tree/master/src/components/Widgets)), and the browser console + networking tab.

If the API itself is returning incorrect, incomplete or inaccurate data then an issue needs to be raised **with the API provider** (not Dashy!). You can find the API provider included within the widget docs, or for a full list see the [Privacy Docs](https://github.com/Lissy93/dashy/blob/master/docs/privacy.md#widgets).

See also: [#807](https://github.com/Lissy93/dashy/issues/807) (re, domain monitor)

### Public IP Widget not working for `ipinfo` or `ipquery` providers

If you've set `options.provider` to either `ipinfo` and `ipquery` and the requests are failing, it's likley that they're being blocked. Check your adblocker (uBlock, PrivacyBadger, etc), DNS block lists (PiHole, AdGuard, etc). Or, try proxying the request (with `useProxy: true`) or just try a different provider.

---

## Errors and warnings

### Config Validation Errors

The configuration file is validated against [Dashy's Schema](https://github.com/Lissy93/dashy/blob/master/src/utils/config/ConfigSchema.json) using AJV.

First, check that your syntax is valid, using [YAML Validator](https://codebeautify.org/yaml-validator/) or [JSON Validator](https://codebeautify.org/jsonvalidator). If the issue persists, then take a look at the [schema](https://github.com/Lissy93/dashy/blob/master/src/utils/config/ConfigSchema.json), and verify that the field you are trying to add/ modify matches the required format. You can also use [this tool](https://www.jsonschemavalidator.net/s/JFUj7X9J) to validate your JSON config against the schema, or run `yarn validate-config`.

If you're trying to use a recently released feature, and are getting a warning, this is likely because you've not yet updated the the current latest version of Dashy.

If the issue still persists, you should raise an issue.

### Warnings in the Console during deploy

Please acknowledge the difference between errors and warnings before raising an issue about messages in the console. It's not unusual to see warnings about a new version of a certain package being available, an asset bundle bing oversized or a service worker not yet having a cache. These shouldn't have any impact on the running application, so please don't raise issues about these unless it directly relates to a bug or issue you're experiencing. Errors on the other hand should not appear in the console, and they are worth looking into further.

### "SSL Not Enabled" in the Logs

`SSL Not Enabled: Public key not present` is printed every time Dashy starts without SSL certificates. It's just a notice, and is safe to ignore if you don't want HTTPS, or a reverse proxy handles it for you. If it says `Private key not present`, your public key was found but the private key wasn't, so check its path.

To serve HTTPS from Dashy itself, mount your certificates as shown in [SSL Certificates](/docs/management.md#ssl-certificates). Dashy then redirects HTTP to its SSL port, so publish that port with the same number on both sides, e.g. `-p 443:443`, or set `SSL_PORT=8443` and use `-p 8443:8443`. If you'd rather keep plain HTTP, set `REDIRECT_HTTPS=false`.

### Copy to Clipboard not Working

If the copy to clipboard feature (either under Config --> View / Export Config, or an item's "Copy to Clipboard" option) shows an "Unable to copy" error, first check the browser console. If you see `Clipboard access requires HTTPS`, then your browser is blocking access to the clipboard.
The most common reason for this, is if you're not running the app over HTTPS. Copying to the clipboard requires the app to be running in a secure origin / aka have valid HTTPS cert. You can read more about this [here](https://stackoverflow.com/a/71876238/979052).

As a workaround, you could either:

- Highlight the text and copy / <kbd>Ctrl</kbd> + <kbd>C</kbd>
- Or setup SSL - [here's a guide](https://github.com/Lissy93/dashy/blob/master/docs/management.md#ssl-certificates) on doing so

---

## How-To / Reference

### How to Reset Local Settings

Some settings are stored locally, in the browser's storage.

In some instances cached assets can prevent your settings from being updated, in which case you may wish to reset local data.

To reset local settings from the UI, head to the Config Menu, then click "Reset Local Settings", and Confirm when prompted. This clears the settings you've changed in the UI, like theme and layout, on every page, but keeps you logged in.
This will not affect your config file. But be sure that you keep a backup of your config, if you've not written changes it to disk.

You can also view any and all data that Dashy is storing, using the developer tools. Open your browser's dev tools (usually <kbd>F12</kbd>), in Chromium head to the Application tab, or in Firefox go to the Storage tab. Select Local Storage, then scroll down the the URL Dashy is running on. You should now see all data being stored, and you can select and delete any fields you wish.

For a full list of all data that may be cached, see the [Privacy Docs](/docs/privacy.md#browser-storage).

### How to make a bug report

#### Step 1 - Where to open issues

You will need a GitHub account in order to raise a ticket. You can then [click here](https://github.com/Lissy93/dashy/issues/new?assignees=lissy93&labels=%F0%9F%90%9B+Bug&template=bug.yml&title=%5BBUG%5D+%3Ctitle%3E) to open a new bug report.

#### Step 2 - Checking it's not already covered

Before submitting, please check that:

- A similar ticket has not previously been opened
- The issue is not covered in the [troubleshooting guide](https://github.com/Lissy93/dashy/blob/master/docs/troubleshooting.md) or [docs](https://github.com/Lissy93/dashy/tree/master/docs#readme)

#### Step 3 - Describe the Issue

Your ticket will likely be dealt with more effectively if you can explain the issue clearly, and provide all relevant supporting material.

Complete the fields, asking for your environment info and version of Dashy.
Then describe the issue, briefly explaining the steps to reproduce, expected outcome and actual outcome.

#### Step 4 - Provide Supporting Info

Where relevant please also include:

- A screenshot of the issue
- The relevant parts of your config file
- Logs
  - If client-side issue, then include the browser logs ([see how](#how-to-open-browser-console))
  - If server-side / during deployment, include the terminal output

_Take care to redact any personal info, (like IP addresses, auth hashes or API keys)._

#### Step 5 - Fix Released

A maintainer will aim to respond within 48 hours.
The timeframe for resolving your issue, will vary depending on severity of the bug and the complexity of the fix.
You will be notified on your ticket, when a fix has been released.

Finally, be sure to remain respectful to other users and project maintainers, in line with the [Contributor Covenant Code of Conduct](https://github.com/Lissy93/dashy/blob/master/.github/CODE_OF_CONDUCT.md#contributor-covenant-code-of-conduct).

### How-To Open Browser Console

When raising a bug, one crucial piece of info needed is the browser's console output. This will help the developer diagnose and fix the issue.

If you've been asked for this info, but are unsure where to find it, then it is under the "Console" tab, in the browsers developer tools, which can be opened with <kbd>F12</kbd>. You can right-click the console, and select Save As to download the log.

To open dev tools, and jump straight to the console:

- Win / Linux: <kbd>Ctrl</kbd> + <kbd>Shift</kbd> + <kbd>J</kbd>
- MacOS: <kbd>Cmd</kbd> + <kbd>Option</kbd> + <kbd>J</kbd>

For more detailed walk through, see [this article](https://support.shortpoint.com/support/solutions/articles/1000222881-save-browser-console-file).

### Git Contributions not Displaying

If you've contributed to Dashy (or any other project), but your contributions are not showing up on your GH profile, or in Dashy's [Credits Page](https://github.com/Lissy93/dashy/blob/master/docs/credits.md), then this is likely a git config issue.

These statistics are generated using the username / email associated with commits. This info needs to be setup on your local machine using [`git config`](https://git-scm.com/docs/git-config).

Run the following commands (replacing name + email with your info):

- `git config --global user.name "John Doe"`
- `git config --global user.email johndoe@example.com`

For more info, see [Git First Time Setup Docs](https://git-scm.com/book/en/v2/Getting-Started-First-Time-Git-Setup).

Note that only contributions to the master / main branch or a project are counted
