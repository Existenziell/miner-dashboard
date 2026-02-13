/**
 * Server config from environment. Required vars are validated at startup in index.js.
 * Use this module instead of process.env so all config is read from one place.
 */
export const MINER_IP = process.env.MINER_IP ?? '192.168.1.3';
export const PORT = process.env.PORT ?? '8001';
