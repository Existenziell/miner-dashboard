import 'dotenv/config';
import http from 'http';
import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { PORT } from './config.js';
import { getMinerIp } from './config/dashboardConfig.js';
import configRoutes from './routes/config.js';
import firmwareRoutes from './routes/firmware.js';
import minerRoutes from './routes/miner.js';
import networkRoutes from './routes/network.js';
import { attachLogsWebSocket } from './wsLogsProxy.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();

app.use(cors());
app.use(express.json({ limit: '1mb' }));

// API routes
app.use('/api/config', configRoutes);
app.use('/api/firmware', firmwareRoutes);
app.use('/api/miner', minerRoutes);
app.use('/api/network', networkRoutes);

// In production, serve the built client
if (process.env.NODE_ENV === 'production') {
  const clientDist = path.join(__dirname, '..', 'client', 'dist');
  app.use(express.static(clientDist));
  app.get('*', (_req, res) => {
    res.sendFile(path.join(clientDist, 'index.html'));
  });
}

const server = http.createServer(app);
attachLogsWebSocket(server);

server.listen(PORT, () => {
  const minerIp = getMinerIp();
  console.log(`Server running on http://localhost:${PORT}`);
  console.log(`Miner API target: ${minerIp ? `http://${minerIp}` : '(not set — configure in Dashboard Settings or .env MINER_IP)'}`);
});
