import express from 'express';
import mongoose from 'mongoose';
import router from './router.js';
import cors from 'cors';
import dotenv from 'dotenv';
import TelegramBot from 'node-telegram-bot-api';
import User from './model/User.js';

dotenv.config();
console.log('Server is starting...');

const PORT = 5000;
const app = express();

const token = process.env.TELEGRAM_BOT_TOKEN;
const DB_URL = process.env.MONGO_DB_URL;
const webAppUrl = 'https://chewi-check.com/';

const bot = new TelegramBot(token, {polling: true});

console.log(process.env.TELEGRAM_BOT_TOKEN, 'TELEGRAM TOKEN');
console.log(process.env.MONGO_DB_URL, 'MONGO DB');

app.use(express.json());
app.use(cors());
app.use('/api', router);

async function startApp() {
    try {
        console.log('Connecting to MongoDB...');
        await mongoose.connect(DB_URL, {
            useUnifiedTopology: true,
            useNewUrlParser: true,
        });

        bot.on('message', async (msg) => {
            const chatId = msg.chat.id;
            const text = msg.text;
        
            console.log(msg, 'MSG CHECK!')

            if (text === '/start createCoach' && msg.from.id === 469408413) {
                try {
                    const response = await fetch('https://chewi-check.com/api/user', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            tgId: msg.from.id,
                            first_name: msg.from.first_name || 'unknown',
                            last_name: msg.from.last_name || 'unknown',
                            username: msg.from.username || 'unknown',
                            type: 'Coach',
                        }),
                    });
        
                    if (response.ok) {
                        await bot.sendMessage(chatId, `Тренер ${msg?.from?.first_name} был успешно добавлен`);
                    } else {
                        await bot.sendMessage(chatId, `Ошибка при добавлении тренера: ${response.statusText}`);
                    }
                } catch (error) {
                    console.error('Ошибка добавления тренера:', error.message);
                    await bot.sendMessage(chatId, 'Произошла ошибка при добавлении тренера.');
                }
            }
        
            if (text.startsWith('/start ref_')) {
                try {
                    const existingUser = await User.findOne({tgId: msg.from.id});

                    if (existingUser) {
                        await bot.sendMessage(chatId, `Пользователь с таким ID уже существует: ${msg?.from?.first_name}`);
                        return;
                    }
                    const response = await fetch('https://chewi-check.com/api/user', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            tgId: msg.from.id,
                            first_name: msg.from.first_name || 'unknown',
                            last_name: msg.from.last_name || 'unknown',
                            username: msg.from.username || 'unknown',
                            type: 'Client',
                        }),
                    });
        
                    if (response.ok) {
                        await bot.sendMessage(chatId, `Клиент ${msg?.from?.first_name} был успешно добавлен`);
                    } else {
                        await bot.sendMessage(chatId, `Ошибка при добавлении клиента: ${response.statusText}`);
                    }
                } catch (error) {
                    console.error('Ошибка добавления клиента:', error.message);
                    await bot.sendMessage(chatId, 'Произошла ошибка при добавлении клиента.');
                }
            }
        
            await bot.sendMessage(chatId, 'Доступные команды', {
                reply_markup: {
                    inline_keyboard: [
                        [
                            {text: 'Добавить Клиента', web_app: {url: `${webAppUrl}` + '/invite-client'}}
                        ]
                    ]
                }
            })
        
        });

        console.log('Starting server...');
        app.listen(PORT, () =>
            console.log(`Server is running on http://localhost:${PORT}`)
        );
    } catch (error) {
        console.error('Error starting the server:', error.message);
        process.exit(1); // Завершаем процесс с ошибкой
    }
}

startApp();