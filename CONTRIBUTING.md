# Contributing to Miner Dashboard

Thanks for your interest in contributing.

## Setup

1. Clone the repo and install dependencies:

   ```bash
   git clone https://github.com/christof/miner-dashboard.git
   cd miner-dashboard
   npm install
   cd client && npm install && cd ..
   ```

2. Copy `.env.example` to `.env` and set at least `MINER_IP` (your NerdQaxe++ miner’s IP). The server will not start without `MINER_IP`, `MEMPOOL_API`, and `PORT`.

3. Run the app in development:

   ```bash
   npm run dev
   ```

   Backend: `http://localhost:8001`. Frontend (Vite): `http://localhost:8000` (proxies to backend).

## Commands

- **`npm run dev`** – Start backend and frontend dev servers
- **`npm test`** – Run client tests
- **`npm run test:watch`** – Run tests in watch mode
- **`npm run lint`** – Lint client code
- **`npm run build`** – Build frontend for production
- **`npm start`** – Run production server (after `npm run build`)

## Submitting changes

1. Open an issue or comment on an existing one if you’re planning a larger change.
2. Create a branch, make your changes, and ensure tests and lint pass (`npm test`, `npm run lint`).
3. Open a pull request with a short description of what changed and why.
