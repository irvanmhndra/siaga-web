# siaga-web

React dashboard for **Siaga** — a PagerDuty-style on-call & incident management
SaaS. Vite + TypeScript + Tailwind, TanStack Query + axios, Zustand
opaque-token auth. Talks to `siaga-api`.

## Run

```bash
npm install
npm run dev            # http://localhost:5182
```

In dev the app calls the API at `http://localhost:8089/api/v1`. Override with
`VITE_API_URL`. In a production (single-origin) build it uses the relative
`/api/v1`, since the API serves the SPA from the same origin.

## Build

```bash
npm run build          # tsc -b && vite build → dist/
```

## Pages

Auth (login/register), dashboard (open incidents + on-call now), incidents list
& detail (acknowledge / resolve, timeline), services (integration keys + Events
API snippet), on-call schedules (rotation builder), escalation policies (rules +
targets builder), people & teams (member invites), profile & notification
preferences, and a notifications inbox.

## Deploy

On push to `main`, `.github/workflows/deploy.yml` builds `dist/` (reading
`.env.production`, which sets `VITE_API_URL=/api/v1`), scps it to the VPS at
`~/siaga/web-dist`, and restarts `siaga-api` so it serves the fresh SPA.
Required Actions secrets: `VPS_HOST`, `VPS_USER`, `VPS_SSH_KEY`.
