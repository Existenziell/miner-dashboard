# Miner Dashboard

A real-time monitoring dashboard for the NerdQaxe++ Bitcoin Solo Miner, with Bitcoin network status from mempool.space.

## Features

- **Live miner monitoring**: hashrate, temperature, power, fan speed (10s polling)
- **Time-series charts**: hashrate and temperature/power history (rolling 1h buffer)
- **Mining details**: shares accepted/rejected, best difficulty, pool info
- **Bitcoin network**: block height, difficulty adjustment, BTC price, fee estimates (60s polling)

## Quick Start

```bash
# Install dependencies
npm install
cd client && npm install && cd ..

# Configure miner IP (edit .env)
cp .env.example .env  # then edit MINER_IP

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

Edit `.env` in the project root:

```
MINER_IP=192.168.1.3       # Your miner's IP address
MEMPOOL_API=https://mempool.space/api  # Or your own mempool instance
PORT=8001                   # Backend port
```

## Architecture

```
Browser --> Express (port 8001) --> NerdQaxe++ Miner (192.168.1.3)
                                --> mempool.space API
```

The Express backend proxies requests to the miner (avoiding CORS issues) and aggregates Bitcoin network data from mempool.space with 30s caching.

## Future

- Run your own Bitcoin node and point `MEMPOOL_API` to a local mempool instance
- Add settings controls (frequency, voltage, fan speed)
- Multiple miner support
