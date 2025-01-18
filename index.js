import express from 'express';
import mongoose from 'mongoose';
import router from './router.js';
import clientRouter from './router/client-router.js';
import cors from 'cors';
import dotenv from 'dotenv';
import { Server } from 'socket.io';
import https from 'https';
import fs from 'fs';

dotenv.config();

const app = express();
const PORT = process.env.PORT;
const DB_URL = process.env.MONGO_DB_URL;


// Создаем HTTPS сервер
const httpsOptions = {
    key: fs.readFileSync('/etc/nginx/chewi-check.com.key'),
    cert: fs.readFileSync('/etc/nginx/chewi-check.com.fullchain.pem')
};
const server = https.createServer(httpsOptions, app);
const io = new Server(server, {
    cors: {
        origin: '*',
        methods: ['GET', 'POST', 'PUT', 'DELETE']
    }
});

// Middleware
app.use(express.json());
app.use(cors());
app.use('/api', router);
app.use('/client', clientRouter);

const connectDB = async () => {
    try {
        await mongoose.connect(DB_URL);
        console.log('Connected to MongoDB');
    } catch (error) {
        console.error('Error connecting to MongoDB:', error.message);
        process.exit(1);
    }
};

const startServer = async () => {
    try {
        await connectDB();
        // Используем server.listen, а не app.listen
        server.listen(PORT, () => {
            console.log(`Server is running on https://localhost:${PORT}`);
        });
    } catch (error) {
        console.error('Error starting the server:', error.message);
        process.exit(1);
    }
};

// WebSocket
io.on('connection', (socket) => {
    // Когда новый клиент подключается, выводим информацию в консоль
    console.log(`Client connected: ${socket.id}`);

    // Слушаем обновления клиента
    socket.on('updateClient', (data) => {
        console.log('Client updated:', data);

        // Рассылаем обновления всем подключенным клиентам
        io.emit('clientUpdated', data);
    });

    // Слушаем событие отключения клиента
    socket.on('disconnect', () => {
        console.log(`Client disconnected: ${socket.id}`);
    });
});

export { io };

startServer();