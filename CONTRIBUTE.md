# Contributing to Miner Dashboard

Thanks for your interest in contributing.

## Setup

1. Clone the repo and install dependencies:

   ```bash
   git clone https://github.com/Existenziell/miner-dashboard.git
   cd miner-dashboard
   npm install
   cd client && npm install && cd ..
   ```

2. Copy `.env.example` to `.env` and set `MINER_IP` (your miner’s IP).

3. Run the app in development:

   ```bash
   npm run dev
   ```

   Backend: `http://localhost:8001`. Frontend (Vite): `http://localhost:8000` (proxies to backend).

## Project structure

- **Root:** `server/` (Express), `client/` (Vite + React), `config/` (runtime `dashboard.json`), `shared/` (schemas and defaults used by both).
- **Server:** `server/index.js` (entry; mounts routes), `server/config.js` (PORT), `server/config/dashboardConfig.js` (load/save config), `server/routes/` — `config.js`, `miner.js`, `network.js`, `firmware.js`.
- **Client:** `client/src/` — `main.jsx`, `App.jsx`, `components/` (pages, dashboard, settings, layout, charts), `context/`, `hooks/`, `lib/` (api, formatters, utils, etc.). Tests under `client/src/test/` mirror `hooks/` and `lib/` with `*.test.js`.

Route mounting in `server/index.js`: `/api/config`, `/api/firmware`, `/api/miner`, `/api/network`.

## Config and API

- **Dashboard config:** Persisted in `config/dashboard.json`; defaults in `shared/dashboardDefaults.js`; server merges and validates in `server/config/dashboardConfig.js`. Miner IP can come from `.env` (overrides stored config).
- **Config API:** `GET /api/config`, `PATCH /api/config` (partial updates); used by the Settings UI. Miner/network/firmware routes proxy or aggregate external data (miner device, mempool.space, GitHub).

## Tests

- **Framework:** Vitest; config in `client/vite.config.js` (`test.include: ['src/test/**/*.test.js']`, `environment: 'node'`).
- **Run:** `npm test` (from repo root) or `npm run test:watch`. Tests live in `client/src/test/` (e.g. `src/test/hooks/useMinerData.test.js`, `src/test/lib/api.test.js`). `npm run all` runs build, test, and lint together.

## Lint and style

- **ESLint:** `client/eslint.config.js`. Import order: React → `@/context` → `@/hooks` → `@/lib` → `@/components` → other; alphabetized; `npm run lint -- --fix` applies import order.
- **Stylelint** for `src/**/*.css`. Run `npm run lint` from repo root (lints JS and CSS). Fix any issues before opening a PR.

## Code conventions

- Client uses `@/` for `src/` and `shared` for the shared package (see `client/vite.config.js` `resolve.alias`). Follow existing patterns in `context/`, `hooks/`, and `lib/` when adding features.

## Commands

- **`npm run dev`** – Start backend and frontend dev servers
- **`npm test`** – Run client tests
- **`npm run test:watch`** – Run tests in watch mode
- **`npm run lint`** – Lint client code
- **`npm run build`** – Build frontend for production
- **`npm start`** – Run production server (after `npm run build`)
- **`npm run all`** – Run build, tests, and lint (good pre-PR check)

## Tests and lint

Before opening a pull request, run tests and lint and fix any issues:

```bash
npm test
npm run lint
```

Or run everything in one go: `npm run all`. The client test suite and ESLint must pass for contributions to be accepted.

## Submitting changes

1. Open an issue or comment on an existing one if you’re planning a larger change.
2. Create a branch, make your changes, and ensure tests and lint pass (see **Tests and lint** above).
3. Open a pull request with a short description of what changed and why.
