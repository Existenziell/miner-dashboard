# Miner Dashboard

A real-time monitoring dashboard for the NerdQaxe++ Bitcoin Solo Miner, with Bitcoin network status from mempool.space.

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

# Copy env template and set your miner IP (and optional MEMPOOL_API, PORT)
cp .env.example .env
# Edit .env: set MINER_IP to your miner's IP address

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

Copy `.env.example` to `.env` in the project root and set your values:

- **MINER_IP** – Your miner's IP address (required)
- **MEMPOOL_API** – Mempool API base URL (default: `https://mempool.space/api`)
- **PORT** – Backend port (default: `8001`)

The server will not start until `MINER_IP`, `MEMPOOL_API`, and `PORT` are set.

## Architecture

```
Browser --> Express (port 8001) --> NerdQaxe++ Miner (192.168.1.3)
                                --> mempool.space API
```

The Express backend proxies requests to the miner (avoiding CORS issues) and aggregates Bitcoin network data from mempool.space with 30s caching.

## License

MIT. See [LICENSE](LICENSE).
