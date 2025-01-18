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
const PORT = process.env.PORT || 5000;
const DB_URL = process.env.MONGO_DB_URL;

// HTTPS опции для сервера
const httpsOptions = {
  key: fs.readFileSync('/etc/nginx/chewi-check.com.key'),
  cert: fs.readFileSync('/etc/nginx/chewi-check.com.fullchain.pem'),
};

// Создаем HTTPS сервер
const server = https.createServer(httpsOptions, app);

// Создаем Socket.IO сервер
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
  },
  transports: ['polling', 'websocket'], // Транспорты
  path: '/socket.io/', // Путь, совпадающий с клиентом и Nginx
});

// Middleware
app.use(express.json());
app.use(cors());
app.use('/api', router);
app.use('/client', clientRouter);

// MongoDB подключение
const connectDB = async () => {
  try {
    await mongoose.connect(DB_URL);
    console.log('Connected to MongoDB');
  } catch (error) {
    console.error('Error connecting to MongoDB:', error.message);
    process.exit(1);
  }
};

// WebSocket логика
io.on('connection', (socket) => {
  console.log(`Client connected: ${socket.id}`);
  console.log(`Transport: ${socket.conn.transport.name}`);

  socket.on('updateClient', (data) => {
    console.log('Client updated:', data);
    io.emit('clientUpdated', data); // Широковещательная рассылка обновления
  });

  socket.on('disconnect', () => {
    console.log(`Client disconnected: ${socket.id}`);
  });
});

// Запуск сервера
const startServer = async () => {
  try {
    await connectDB();
    server.listen(PORT, () => {
      console.log(`Server is running on https://localhost:${PORT}`);
    });
  } catch (error) {
    console.error('Error starting the server:', error.message);
    process.exit(1);
  }
};

startServer();