import express from 'express';
import mongoose from 'mongoose';
import router from './router.js';
import cors from 'cors';
import dotenv from 'dotenv';
import TelegramBot from 'node-telegram-bot-api';

dotenv.config();

const app = express();
const PORT = process.env.PORT;
const DB_URL = process.env.MONGO_DB_URL;
const token = process.env.TELEGRAM_BOT_TOKEN;
const pageUrl = `https://chewi-check.com`;

const bot = new TelegramBot(token, { 
    webHook: true
});
bot.setWebHook(`${pageUrl}/bot${token}`);

// Middleware
app.use(express.json());
app.use(cors());
app.use('/api', router);
app.post(`/bot${token}`, (req, res) => {
    const {body} = req.body;
    bot.processUpdate(req.body);
    res.sendStatus(200);
});

bot.on('callback_query', async (query) => {
    const { id: userId, first_name } = query.from;

    bot.answerCallbackQuery(query.id, `Processing your referral...`);

    try {
        const response = await fetch('https://chewi-check.com/api/referral', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                tgId: userId,
                first_name: first_name,
            }),
        });

        const userData = await response.json();

        if (response.ok) {
            bot.sendMessage(userId, `You have been successfully added with referral data: ${JSON.stringify(userData)}`);
        } else {
            bot.sendMessage(userId, `Failed to add you to the system.`);
        }
    } catch (error) {
        console.error('Error:', error);
        bot.sendMessage(userId, `There was an error adding you to the system.`);
    }
});

//КОМАНДЫ БОТА
bot.onText(/^\/start$/, msg => {
    const { chat: { id } } = msg;

    console.log(id, 'CHECK CHAT!')

    if (!allowedUsers.includes(id)) {
        bot.sendMessage(id, `Hello this is My inline command`, {
            reply_markup: {
                inline_keyboard: [
                    [
                        {
                            text: 'Google',
                            url: 'https://google.com'
                        }
                    ]
                ]
            }
        });
        return;
    } else { 
        bot.sendMessage(id, `Hello this is My inline command`, {
            reply_markup: {
                inline_keyboard: [
                    [
                        {
                            text: 'Google',
                            url: 'https://google.com'
                        }
                    ],
                    [
                        {
                            text: 'add new user',
                            // url: 'https://t.me/share/url?url=https://t.me/ChewiCheckBot&text=Get ready to make your boxing journey more efficient and organized! Lets get started',
                            callback_data: 'test callback-data'
                        }
                    ]
                ]
            }
        });
    }
});

bot.onText(/\help/, msg => {
    const {chat: {id}} = msg;
    bot.sendMessage(id, 'You use command help')
});


//ИНЛАЙН КНОПКИ
bot.on('inline_query', query => {
    const results = [];

    for(let i =0; i < 3; i++) {
        results.push({
            id: i.toString(),
            type: 'article',
            title: `Title ${i}`,
            input_message_content: {
                message_text: `Article ${i} description will be here`
            }
        })
    }

    bot.answerInlineQuery(query.id, results, {
        cache_time: 0,
        switch_pm_text: 'got to Chewi-check-bot',
        switch_pm_parameter: 'hello'
    })
});

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
        app.listen(PORT, () => console.log(`Server is running on http://localhost:${PORT}`));
    } catch (error) {
        console.error('Error starting the server:', error.message);
        process.exit(1);
    }
};

startServer();