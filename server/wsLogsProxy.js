import WebSocket, { WebSocketServer } from 'ws';
import { getMinerIp } from './config/dashboardConfig.js';

const LOGS_WS_PATH = '/api/miner/logs';
const MINER_WS_PATH = '/api/ws';

/** Single upstream connection to miner; fans out to all browser clients. Keeps miner load minimal. */
let minerSocket = null;
const browserClients = new Set();

function closeMinerConnection() {
  if (minerSocket) {
    try {
      minerSocket.removeAllListeners();
      if (minerSocket.readyState === 1) minerSocket.close();
    } catch {
      // ignore
    }
    minerSocket = null;
  }
}

function closeAllBrowsers(reason) {
  for (const client of browserClients) {
    try {
      if (client.readyState === 1) client.close(1000, reason || 'Miner disconnected');
    } catch {
      // ignore
    }
  }
  browserClients.clear();
}

function openMinerConnection() {
  const minerIp = getMinerIp()?.trim();
  if (!minerIp) return false;
  const url = `ws://${minerIp}${MINER_WS_PATH}`;
  const miner = new WebSocket(url);

  miner.on('open', () => {
    minerSocket = miner;
  });

  miner.on('message', (data) => {
    for (const client of browserClients) {
      if (client.readyState === 1) {
        try {
          client.send(data);
        } catch {
          // skip if send fails
        }
      }
    }
  });

  miner.on('close', () => {
    minerSocket = null;
    closeAllBrowsers('Miner connection closed');
  });

  miner.on('error', (err) => {
    console.error('Miner logs WebSocket error:', err.message);
    minerSocket = null;
    closeAllBrowsers('Miner connection error');
  });

  return true;
}

/**
 * Attach WebSocket proxy for miner logs to the HTTP server.
 * One server->miner connection is shared by all browser clients to avoid overwhelming the miner.
 */
export function attachLogsWebSocket(server) {
  const wss = new WebSocketServer({ noServer: true });

  wss.on('connection', (browserWs) => {
    const minerIp = getMinerIp()?.trim();
    if (!minerIp) {
      browserWs.close(1008, 'Miner address not configured');
      return;
    }

    browserClients.add(browserWs);

    browserWs.on('close', () => {
      browserClients.delete(browserWs);
      if (browserClients.size === 0) {
        closeMinerConnection();
      }
    });

    browserWs.on('error', () => {
      browserClients.delete(browserWs);
      if (browserClients.size === 0) {
        closeMinerConnection();
      }
    });

    // Single miner connection shared by all browsers
    if (!minerSocket || minerSocket.readyState !== 1) {
      openMinerConnection();
    }
  });

  server.on('upgrade', (request, socket, head) => {
    const pathname = request.url?.split('?')[0];
    if (pathname !== LOGS_WS_PATH) {
      socket.destroy();
      return;
    }
    wss.handleUpgrade(request, socket, head, (ws) => {
      wss.emit('connection', ws, request);
    });
  });
}
