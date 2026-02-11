import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import minerRoutes from './routes/miner.js';
import networkRoutes from './routes/network.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT;

app.use(cors());
app.use(express.json());

// API routes
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

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log(`Miner API target: http://${process.env.MINER_IP}`);
  console.log(`Mempool API: ${process.env.MEMPOOL_API}`);
});
