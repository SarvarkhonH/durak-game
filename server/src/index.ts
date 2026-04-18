import 'dotenv/config';
import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import { connectDB } from './db';
import { setupSocket } from './socket/handler';
import apiRouter from './routes/api';
import adminRouter from './routes/admin';
import { setupWebhook, handleUpdate } from './bot';

const app = express();
const httpServer = createServer(app);

const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:5173';

const io = new Server(httpServer, {
  cors: { origin: '*', methods: ['GET', 'POST'] },
});

app.use(cors({ origin: '*' }));
app.use(express.json());

app.get('/health', (_req, res) => res.json({ ok: true }));
app.use('/api', apiRouter);
app.use('/admin', adminRouter);

app.post('/webhook', async (req, res) => {
  res.json({ ok: true });
  await handleUpdate(req.body).catch(console.error);
});

setupSocket(io);

async function start() {
  await connectDB();
  const port = Number(process.env.PORT) || 3001;
  httpServer.listen(port, () => {
    console.log(`Server running on port ${port}`);
    if (process.env.SERVER_URL) {
      setupWebhook().catch(console.error);
    }
  });
}

start().catch(console.error);
