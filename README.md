# AllVideoDownloader

A production-ready, mobile-first Next.js app and API for downloading **publicly accessible** Instagram and YouTube videos through a self-hosted [Cobalt](https://github.com/imputnet/cobalt) instance. An optional yt-dlp + FFmpeg fallback handles YouTube when its current media streams are blocked for Cobalt. It includes an iPhone Shortcut workflow, PWA metadata and icons, strict input validation, SSRF protections, a 30-second upstream timeout, and replaceable in-memory rate limiting.

This project does not bypass private accounts, authentication, DRM, paywalls, or other access controls. Only download content you own or have permission to save.

## Features

- Next.js App Router, TypeScript, Tailwind CSS, and a responsive iPhone-friendly interface
- Server-only Cobalt URL and API key
- Exact Instagram and YouTube hostname allowlist and HTTPS-only URL validation
- Cobalt `redirect`, `tunnel`, `picker`, and `error` response handling
- Optional yt-dlp + FFmpeg YouTube fallback that streams a merged MP4 without permanent storage
- Optional Apple Shortcut key with an optional/required policy switch
- 20 requests per IP per 60-minute in-memory rate limit
- Installable PWA manifest, icons, and service worker
- `GET /api/health` health check
- No database, submitted-link storage, or media proxying through Next.js

## Requirements

- Node.js 20.9 or later
- npm
- A self-hosted Cobalt 11 instance, or permission to use another compatible instance
- Optional: yt-dlp and FFmpeg executables when Cobalt cannot deliver YouTube media streams

The public `api.cobalt.tools` service is not intended for third-party application use. Run your own instance for this app.

## Installation

```bash
cd allvideodownloader
npm install
cp .env.example .env.local
```

Edit `.env.local` before starting the app.

## Environment variables

```dotenv
COBALT_API_URL=https://your-cobalt-server.example.com/
COBALT_API_KEY=
SHORTCUT_API_KEY=
SHORTCUT_AUTH_MODE=optional
YTDLP_PATH=
FFMPEG_PATH=
APP_BASE_URL=
```

| Variable | Required | Purpose |
| --- | --- | --- |
| `COBALT_API_URL` | Yes | Base URL of the Cobalt processing API. It is read only by the server. |
| `COBALT_API_KEY` | No | Cobalt API key. Sent as `Authorization: Api-Key <key>`. |
| `SHORTCUT_API_KEY` | No | Private value accepted in the `X-Shortcut-Key` request header. |
| `SHORTCUT_AUTH_MODE` | No | `optional` by default. Set `required` to require the Shortcut key on every `/api/download` request. |
| `YTDLP_PATH` | No | Absolute path to the yt-dlp executable. Enables the YouTube fallback when used with `FFMPEG_PATH`. |
| `FFMPEG_PATH` | No | Absolute path to the FFmpeg executable used to merge YouTube video and audio streams. |
| `APP_BASE_URL` | No | Canonical public origin, such as `https://downloader.example.com`. When omitted, API responses use the request's origin. |

Do not prefix these variables with `NEXT_PUBLIC_`; that would expose them to browser JavaScript. If `SHORTCUT_AUTH_MODE=required`, the public website cannot call the endpoint because the key is deliberately never embedded in frontend code. Use required mode for a private API/Shortcut deployment, or add a separate user-authentication layer for the website.

## Development

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). The API health check is available at [http://localhost:3000/api/health](http://localhost:3000/api/health).

Production check and local production server:

```bash
npm run build
npm start
```

## API

### `POST /api/download`

Request:

```json
{
  "url": "https://www.youtube.com/watch?v=example",
  "quality": "1080"
}
```

Allowed quality values are `max`, `2160`, `1440`, `1080`, `720`, `480`, `360`, and `240`. A missing quality defaults to `1080`.

Supported source hostnames are `instagram.com`, `www.instagram.com`, `youtube.com`, `www.youtube.com`, `m.youtube.com`, `music.youtube.com`, and `youtu.be`.

Single-media response:

```json
{
  "success": true,
  "type": "video",
  "downloadUrl": "https://media.example/video.mp4",
  "filename": "video.mp4",
  "requestedQuality": "1080"
}
```

Picker response:

```json
{
  "success": true,
  "type": "picker",
  "items": [
    {
      "type": "image",
      "downloadUrl": "https://media.example/photo.jpg",
      "filename": "media-1.jpg"
    }
  ],
  "requestedQuality": "1080"
}
```

Errors consistently return `{ "success": false, "error": "Friendly message" }`. Invalid input returns 400, failed authentication 401, rate limiting 429, missing server configuration 503, and upstream failures 4xx/5xx without stack traces.

### `GET /api/health`

Returns:

```json
{ "status": "ok" }
```

This endpoint reports application process health. It does not call Cobalt, so it is safe for frequent platform health probes.

## How Cobalt connects

The browser sends the validated URL and preferred quality only to `/api/download`. That server route checks authentication and rate limits, validates the exact source hostname, and then sends this body to `COBALT_API_URL`:

```json
{
  "url": "<validated source URL>",
  "videoQuality": "1080",
  "downloadMode": "auto"
}
```

The server adds `Accept: application/json`, `Content-Type: application/json`, and, when configured, `Authorization: Api-Key <COBALT_API_KEY>`. Requests are aborted after 30 seconds. The resulting media URL is returned to the client; large media is not stored or proxied through Next.js.

When both `YTDLP_PATH` and `FFMPEG_PATH` are configured, validated YouTube links use the fallback instead. yt-dlp prepares short-lived video and audio URLs, and `/api/media/youtube` streams FFmpeg's merged MP4 output directly to the requester. Nothing is written to disk, and the temporary in-memory download plan expires after ten minutes. This fallback necessarily streams the media through the Next.js process and is intended for a persistent Node host, not short-lived serverless functions.

## Run Cobalt with Docker

The included Compose file uses the official Cobalt 11 image and binds it to loopback by default:

```bash
docker compose -f docker-compose.cobalt.yml up -d
```

For local Next.js development, use:

```dotenv
COBALT_API_URL=http://127.0.0.1:9000/
```

To expose Cobalt through a reverse proxy, set its public URL before starting it so tunnel links are generated correctly:

```bash
COBALT_PUBLIC_URL=https://your-cobalt-api-domain.example/ docker compose -f docker-compose.cobalt.yml up -d
```

Then set the same HTTPS address as `COBALT_API_URL` in the Next.js deployment. Protect any internet-facing Cobalt instance with an API key or other controls described in Cobalt's documentation. The Compose file intentionally does not configure cookies or account sessions; this project is for publicly accessible content only.

## iPhone Shortcut

The complete visual guide is at `/shortcut`. Create a new Shortcut with these actions:

1. **Get Clipboard**.
2. **Choose from Menu** with: Maximum, 2160p, 1440p, 1080p, 720p, 480p, 360p, and 240p.
3. In each branch, add **Text** containing the mapped value and **Set Variable** named `Quality`:
   - Maximum → `max`
   - 2160p → `2160`
   - 1440p → `1440`
   - 1080p → `1080`
   - 720p → `720`
   - 480p → `480`
   - 360p → `360`
   - 240p → `240`
4. After the menu, add **Get Contents of URL**.
5. URL: `https://YOURDOMAIN.com/api/download`.
6. Method: **POST**.
7. Request Body: **JSON**.
8. Add `url` = **Clipboard** and `quality` = **Quality**.
9. If using a private Shortcut key, add header `X-Shortcut-Key` = your key.
10. Add **Get Dictionary Value** for `downloadUrl` from the API response.
11. Add **Get Contents of URL** using `downloadUrl`.
12. Add **Save to Photo Album**.
13. Add **Show Notification** with `Video saved to Photos ✅`.

The simple Shortcut handles single-video responses. Instagram carousels return `type: picker` with an `items` array; use the website for those, or add a Shortcut branch that repeats over `items` and downloads each `downloadUrl`.

For same-Wi-Fi local testing, replace the placeholder domain with the Mac's LAN address, for example `http://192.168.0.142:3000/api/download`. The Mac must remain awake with both services running, the iPhone must be on the same network, and Shortcuts must be allowed Local Network access. Never leave `YOURDOMAIN.com` in the action—it is only a placeholder and will produce a certificate error.

## Deployment

### Always-on deployment (recommended)

The Mac/LAN address is for testing only. To use AllVideoDownloader from any device at any time, run it on an always-on cloud/VPS server with a public domain. The included container setup provides the app, yt-dlp, FFmpeg, and automatic HTTPS through Caddy.

1. Point your domain's DNS `A` record to the server's public IP and make sure ports 80 and 443 are open.
2. Copy `.env.example` to `.env.production` and set `COBALT_API_URL` to a public, compatible Cobalt service. Keep all server secrets only in `.env.production`.
3. Set the domain and start the stack:

```bash
cp .env.example .env.production
# edit .env.production, especially COBALT_API_URL and APP_BASE_URL
export DOMAIN=downloader.example.com
docker compose -f docker-compose.production.yml up -d --build
```

4. Open `https://downloader.example.com/api/health`. When it returns `{ "status": "ok" }`, use `https://downloader.example.com` on any phone, tablet, or computer.

The app container includes the YouTube yt-dlp + FFmpeg fallback. Cobalt is kept as a separately configured service because its public URL and API key must be protected independently. Do not point a public deployment at `127.0.0.1` or a private LAN address.

### Render Free deployment

The included `render.yaml` is a Render Blueprint for the free Docker web service. Render provides a public `onrender.com` HTTPS address for the service. Render's free service may spin down after 15 minutes without traffic, so its first request after inactivity can be slow; it is still independent of your Mac.

1. Create a Render account and choose **New → Blueprint**.
2. Put this project in a GitHub repository, then connect that repository to Render.
3. Select the repository's `render.yaml` Blueprint and apply it.
4. In the service environment settings, enter `COBALT_API_URL` and, if needed, `COBALT_API_KEY`.
5. Set `APP_BASE_URL` to the Render URL shown for the service, such as `https://allvideodownloader.onrender.com`.
6. Wait for `/api/health` to show `{ "status": "ok" }`.
7. Use `https://allvideodownloader.onrender.com/api/download` in the iPhone Shortcut.

Render's Docker deployment builds this project's `Dockerfile`, which includes the YouTube fallback executables. The app still requires a reachable compatible Cobalt API; a Cobalt URL on the Mac (`127.0.0.1` or `192.168.x.x`) will not work from Render.

### Vercel

1. Push this directory to a private or public Git repository.
2. Import it into Vercel as a Next.js project.
3. Add the environment variables above in **Project Settings → Environment Variables**.
4. Deploy, then test `https://YOURDOMAIN/api/health` and one public video.
5. Add your custom domain under **Project Settings → Domains**, configure the DNS records Vercel shows, and wait for HTTPS to become active.

Vercel and other multi-instance/serverless platforms do not share the included in-memory rate-limit state. Replace it with Redis/Upstash before exposing a high-traffic production service.

The optional yt-dlp/FFmpeg YouTube fallback is not suitable for Vercel because it requires local executables and long-running streaming responses. Deploy to a persistent Node/container host for that feature, or configure a Cobalt instance whose YouTube streams work without the fallback.

### Node host or container platform

1. Install dependencies and run `npm run build` during deployment.
2. Set the environment variables in the host's secret manager.
3. Start with `npm start`; the default port is 3000.
4. Put the app behind an HTTPS reverse proxy and forward the real client IP using trusted `X-Forwarded-For`/`X-Real-IP` headers.
5. Point the custom domain's DNS to the host and enable TLS.

Do not trust client-supplied forwarding headers when the app is directly exposed. Configure the edge proxy to overwrite them.

## Security notes

- Source URLs must use HTTPS, contain no credentials or custom ports, and match an exact supported hostname.
- `localhost`, local names, private/reserved IP ranges, malformed URLs, and non-HTTP schemes are rejected.
- The server never fetches the user-supplied URL directly. Only the validated URL is sent to the configured Cobalt service.
- API secrets remain server-side and are never logged by application code.
- Submitted URLs and media files are not permanently stored.
- YouTube fallback plans contain short-lived media URLs in process memory for at most ten minutes; merged output is streamed and never written to disk.
- Cobalt calls time out after 30 seconds; error details and stack traces are not returned to clients.
- Download links are restricted to HTTP(S) URLs before being returned.
- Security headers and a restrictive Content Security Policy are configured in `next.config.ts`.
- Usage remains subject to the source platform's terms and applicable law.

## Rate limiting

`lib/rateLimit.ts` exposes a small `RateLimiter` interface and defaults to 20 requests per IP in a rolling process-local 60-minute bucket. A 429 response includes `Retry-After` and rate-limit metadata headers.

The in-memory implementation resets when the process restarts and is not shared among serverless functions or multiple app instances. Replace `downloadRateLimiter` with a Redis/Upstash implementation that preserves the same interface for real multi-instance production use.

## Add another supported platform

1. Confirm the platform is supported by your Cobalt version and that your use complies with its terms.
2. Add the platform's exact canonical hostnames to `SUPPORTED_HOSTNAMES` in `lib/validation.ts`. Avoid broad `endsWith` rules.
3. Add UI wording if the homepage should advertise the new source.
4. Add validation and API tests for accepted canonical hosts and rejected lookalike/private hosts.
5. Re-run `npm run lint` and `npm run build`.

Do not add private-account cookies, login scraping, DRM removal, paywall workarounds, or other access-control bypasses.
