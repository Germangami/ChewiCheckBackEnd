import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import router from './router.js';
import { Bot, webhookCallback } from 'grammy';

dotenv.config();

const app = express();
const PORT = process.env.PORT;
const DB_URL = process.env.MONGO_DB_URL;

// Telegram Bot
const bot = new Bot(process.env.TELEGRAM_BOT_TOKEN);

// Настройка webhook для /api/bot
app.use('/api/bot', webhookCallback(bot, 'express'));

// Middleware
app.use(express.json());
app.use(cors());
app.use('/api', router);

// MongoDB Connection
const connectDB = async () => {
    try {
        await mongoose.connect(DB_URL);
        console.log('Connected to MongoDB');
    } catch (error) {
        console.error('Error connecting to MongoDB:', error.message);
        process.exit(1);
    }
};

// Telegram Bot Logic
bot.command('start', async (ctx) => {
    await ctx.reply('Привет! Это стартовая команда бота.');
});

bot.on('message', async (ctx) => {
    await ctx.reply('Получено сообщение!');
});

// Start Server
const startServer = async () => {
    try {
        await connectDB();
        app.listen(PORT, () => console.log(`Server is running on http://localhost:${PORT}`));
    } catch (error) {
        console.error('Error starting the server:', error.message);
        process.exit(1);
    }
};

startServer();