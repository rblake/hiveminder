# Hiveminder PWA — Setup & Build

## Prerequisites

Node.js 18+ on any machine (dev laptop, the server itself, etc.).

```bash
# Check
node --version   # should be 18+
npm --version
```

## Install dependencies

```bash
cd pwa/
npm install
```

## Run tests

```bash
npm test         # watch mode
npm run test:run # single run (CI / before deploy)
```

All tests mock the API via MSW — no running Hiveminder needed to run tests.

## Development

Hiveminder must be running locally (docker compose up) for the dev proxy to work.

```bash
# In the hiveminder/ directory:
docker compose up -d

# Then in pwa/:
npm run dev
# Opens at http://localhost:5173
# API calls to /services/rest/ and /=/ are proxied to localhost:8888
```

Or point at a different instance:
```bash
HIVEMINDER_URL=https://tasks.rblake.net npm run dev
```

Note: voice recognition requires HTTPS or localhost. It will not work on an HTTP dev
server with an external hostname.

## Build for production

```bash
npm run build
# Output: dist/
```

## Deploy to tasks.rblake.net/app/

```bash
# On the server (or rsync from dev machine):
sudo mkdir -p /opt/hiveminder-pwa
sudo rsync -av dist/ /opt/hiveminder-pwa/

# Or from a remote machine:
rsync -av dist/ user@yourserver:/opt/hiveminder-pwa/
```

Then add to the Apache VirtualHost for tasks.rblake.net (before the ProxyPass line):

```apache
Alias /app /opt/hiveminder-pwa
<Directory /opt/hiveminder-pwa>
    Options -Indexes
    Require all granted
    FallbackResource /app/index.html
</Directory>
```

Reload Apache:
```bash
sudo systemctl reload apache2
```

The app is then at: https://tasks.rblake.net/app/

## Install on phones

**iPhone (Safari)**:
1. Open https://tasks.rblake.net/app/ in Safari
2. Share → Add to Home Screen
3. Log in once — credentials persist indefinitely

**Android (Chrome)**:
1. Open https://tasks.rblake.net/app/ in Chrome
2. Chrome prompts "Add to Home Screen" automatically, or use ⋮ → Add to Home Screen

## Icons

Place icons in `public/icons/`:
- `192.png` — 192×192 pixels
- `512.png` — 512×512 pixels

Any square PNG works. Generate from a single source image with:
```bash
convert source.png -resize 192x192 public/icons/192.png
convert source.png -resize 512x512 public/icons/512.png
```
(requires ImageMagick)

Or use any online PWA icon generator.
