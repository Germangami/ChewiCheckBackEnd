import express from 'express';
import mongoose from 'mongoose';
import router from './router.js';
import cors from 'cors';

import TelegramBot from 'node-telegram-bot-api';
import PostData from './postData.js'

console.log('Server is starting...');

const PORT = 5000;

// Подключение к MongoDB
const DB_URL = `mongodb+srv://kontaktherman:PKTC2XYGPqc0mMlf@cluster0.irxhj.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

const app = express();

const token = '7652562820:AAHI8UQf_tV9I9Ty-2609QfYCDMhGRQBc9E';
const webAppUrl = 'https://chewi-check.com/';

const bot = new TelegramBot(token, {polling: true});

// Middleware для обработки JSON и CORS
app.use(express.json());
app.use(cors());
app.use('/api', router);

// Тестовый эндпоинт
// app.get('/', (req, res) => {
//     res.status(200).json({ message: 'Сервер работает!' });
// });

// Проверка подключения к базе данных
// mongoose.connection.on('connected', () => {
//     console.log('MongoDB connection established');
// });

// mongoose.connection.on('error', (err) => {
//     console.error('MongoDB connection error:', err.message);
// });

// mongoose.connection.on('disconnected', () => {
//     console.warn('⚠️ MongoDB connection lost');
// });

// Запуск приложения
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

// app.get('/api/test-db', async (req, res) => {
//     try {
//         const result = await mongoose.connection.db.listCollections().toArray();
//         res.status(200).json(result);
//     } catch (e) {
//         console.error("Error fetching collections:", e);
//         res.status(500).json({ error: "Database error" });
//     }
// });

// Обработка необработанных ошибок
// process.on('unhandledRejection', (reason, promise) => {
//     console.error('Unhandled Rejection at:', promise, 'reason:', reason);
// });

// process.on('uncaughtException', (err) => {
//     console.error('Uncaught Exception thrown:', err.message);
//     process.exit(1); // Завершаем процесс
// });

// Запуск
startApp();