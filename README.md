# Miner Dashboard

A real-time monitoring dashboard for the NerdQaxe++ Bitcoin Solo Miner, or similar devices.

## Features

- **Live miner monitoring**: hashrate, temperature, power, fan speed (10s polling)
- **Time-series charts**: hashrate and temperature/power history (rolling 1h buffer)
- **Mining details**: shares accepted/rejected, best difficulty, pool info
- **Bitcoin network**: block height, difficulty adjustment, BTC price, fee estimates (60s polling)

## Requirements

- **Node.js** 18 or later
- A NerdQaxe++ miner on your network (for live monitoring)

## Quick Start

```bash
# Install dependencies
npm install
cd client && npm install && cd ..

# Copy env template (optional: set MINER_IP in .env or later in Dashboard Settings)
cp .env.example .env

# Run in development mode
npm run dev
```

This starts:
- Express backend on `http://localhost:8001`
- Vite dev server on `http://localhost:8000` (with proxy to backend)

Open `http://localhost:8000` in your browser.

## Production

```bash
# Build frontend
npm run build

# Start production server
npm start
```

Then open `http://localhost:8001`.

## Configuration

**Miner connection:** Set your miner's IP in **Settings → Dashboard** (Miner IP), or in `.env` as `MINER_IP`. The server starts without it; miner routes return a clear message if the miner address is not configured. `.env` overrides the value stored in the config file.

**Dashboard config (server-persisted):** Stored in `config/dashboard.json` (created when you save from **Settings → Dashboard**):

- **Miner IP or hostname** — fallback if not set in `.env`
- **Expected hashrate (GH/s)** — used for the hashrate gauge scale and the Efficiency “Expected” display
- **Miner / Network poll intervals (ms)** — how often the dashboard fetches miner status and network stats
- **Metric ranges** — single threshold and gauge max per metric (hashrate, temp, power, efficiency, etc.). Gauges use accent (OK) and red (out of range). Each value is editable in the Dashboard tab; the hashrate gauge uses the larger of “Expected hashrate” and “Hashrate → Gauge max”.

**Settings tabs:** Settings has three sections (Miner, Pools, Dashboard). The active section is reflected in the URL (`?tab=settings&section=miner|pools|dashboard`) so you can bookmark or share a link to a specific tab.

**Config API:** `GET /api/config` returns the current config; `PATCH /api/config` updates it (JSON body with any of the allowed keys above). Used by the Settings UI.

The backend listens on port 8001.

## Commands

| Command | Description |
|---------|-------------|
| `npm run dev` | Run backend and frontend in development (watch mode) |
| `npm run dev:server` | Run Express backend with `--watch` |
| `npm run dev:client` | Run Vite dev server (client) |
| `npm run build` | Build frontend for production |
| `npm start` | Start production server (run after `npm run build`) |
| `npm run lint` | Lint client code (use `--fix` to auto-sort imports to the project order) |
| `npm run test` | Run client tests |
| `npm run test:watch` | Run client tests in watch mode |
| `npm run all` | Run build, test, and lint concurrently |

## Architecture

```
Browser --> Express (port 8001) --> NerdQaxe++ Miner (192.168.1.3)
                                --> mempool.space API
```

The Express backend proxies requests to the miner (avoiding CORS issues) and aggregates Bitcoin network data from mempool.space with 30s caching.

**Client (React):** Live miner data and dashboard config are provided via `MinerContext` and `ConfigContext`. The Settings page uses scoped settings contexts (`MinerSettingsContext`, `DashboardSettingsContext`) so the miner/pool and dashboard/colors forms avoid prop drilling; tab content components consume form state via the corresponding hooks.

## License

[MIT](LICENSE)

## Contribute

[Docs](CONTRIBUTE.md)
