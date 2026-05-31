import 'dotenv/config';
import cors from 'cors';
import express from 'express';
import http from 'node:http';
import { fileURLToPath } from 'node:url';
import { Server as SocketServer } from 'socket.io';
import authRoutes from './routes/auth.js';
import chatRoutes from './routes/chat.js';
import itineraryRoutes from './routes/itinerary.js';
import tripsRoutes from './routes/trips.js';
import updatesRoutes from './routes/updates.js';
import { errorHandler } from './middleware/errorHandler.js';
import { initializeSocket } from './socket/updatesBroadcaster.js';
const app = express();
app.use(cors({
    origin: true,
    credentials: true,
}));
app.use(express.json({ limit: '1mb' }));
app.get('/health', (_req, res) => {
    res.json({ success: true, status: 'ok' });
});
app.use('/api/auth', authRoutes);
app.use('/api/trips', tripsRoutes);
app.use('/api/itinerary', itineraryRoutes);
app.use('/api/updates', updatesRoutes);
app.use('/api/chat', chatRoutes);
app.use(errorHandler);
export default app;
const currentFilePath = fileURLToPath(import.meta.url);
const entryPath = process.argv[1];
if (entryPath && currentFilePath === entryPath) {
    const port = Number(process.env.PORT ?? 3001);
    const server = http.createServer(app);
    const io = new SocketServer(server, {
        cors: {
            origin: '*',
        },
    });
    initializeSocket(io);
    server.listen(port, () => {
        console.log(`API listening on http://localhost:${port}`);
    });
}
