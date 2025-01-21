import WebSocket, { WebSocketServer } from 'ws';
import express from 'express';
import mongoose from 'mongoose';
import router from './router.js';
import clientRouter from './router/client-router.js';
import cors from 'cors';
import dotenv from 'dotenv';
import https from 'https';
import fs from 'fs';
import { Bot, InlineKeyboard, GrammyError, HttpError } from "grammy";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
const DB_URL = process.env.MONGO_DB_URL;
const WEBAPP_URL = 'https://chewi-check.com';

//BOTSETTINGS
const bot = new Bot(process.env.TELEGRAM_BOT_TOKEN);
const trainerId = 6448727138;
const adminId = 469408413;

// HTTPS опции для сервера
const httpsOptions = {
  key: fs.readFileSync('/etc/nginx/chewi-check.com.key'),
  cert: fs.readFileSync('/etc/nginx/chewi-check.com.fullchain.pem'),
};

// Создаем HTTPS сервер
const server = https.createServer(httpsOptions, app);
const wss = new WebSocketServer({ server });

// Логика WebSocket
wss.on('connection', (socket) => {
  socket.on('message', (data) => {
    const { type, from, message } = JSON.parse(data);
    console.log(type, from, message, 'WEB SOCKET NGXS')

    if (type === 'message') {
      const event = JSON.stringify({
        type: '[Client] Add message',
        from,
        message,
      });

      // Рассылаем сообщение всем подключенным клиентам
      wss.clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
          client.send(event);
        }
      });
    }
  });
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

//КОД БОТА
bot.command('start', async (ctx) => {
  console.log(ctx.match, 'COMMAND START');

  if (ctx.match) {
      const trainer = ctx.match;
      console.log(trainer, 'TRAINER 1');

      const clientData = {
          tgId: ctx.from.id,
          trainerId,
          first_name: ctx.from.first_name ? ctx.from.first_name : '',
          last_name: ctx.from.last_name ? ctx.from.last_name : '',
          username: ctx.from.username ? ctx.from.username : '',
          role: 'Client'
      }

      const response = await fetch(`https://chewi-check.com/client/create`, {
          method: 'POST',
          headers: {
              'Content-Type': 'application/json',
          },
          body: JSON.stringify(clientData)
      });

      if (!response.ok) {
          ctx.reply('Client exist!')
          throw new Error(`Server error: ${response.status}`);
      }
      const data = await response.json();
      ctx.reply('Client created:', data?.first_name ? data?.first_name : data?.username);
      await ctx.reply(`${ctx?.from?.first_name} Welcome to Chewi Check Bot! 👋`, {
          reply_markup: inlineKeyboardForClient,
      });
      console.log('Client created:', data);
  } else {
      if (ctx.from.id === trainerId) {
          await ctx.reply(`${ctx?.from?.first_name} Welcome to Chewi Check Bot! 👋`, {
              reply_markup: inlineKeyboardForCoach,
          });
      } else if(ctx.from.id === adminId) {
          await ctx.reply(`${ctx?.from?.first_name} Welcome to Chewi Check Bot! 👋`, {
              reply_markup: inlineKeyboardForAdmin,
          });
      } else {
          await ctx.reply(`${ctx?.from?.first_name} Welcome to Chewi Check Bot! 👋`, {
              reply_markup: inlineKeyboardForClient,
          });
      }
  }
});

const inlineKeyboardForAdmin = new InlineKeyboard()
    .webApp('Open', {url: `${WEBAPP_URL}`})
    .row()
    .url('add new Coach', `https://t.me/share/url?url=https://t.me/ChewiCheckBot?start=${adminId}&text=hi!`)
    .row()
    .url('add new Client', `https://t.me/share/url?url=https://t.me/ChewiCheckBot?start=${adminId}&text=hi!`)

const inlineKeyboardForCoach = new InlineKeyboard()
    .webApp('Open', {url: `${WEBAPP_URL}`})
    .row()
    .url('add new Client', `https://t.me/share/url?url=https://t.me/ChewiCheckBot?start=${trainerId}&text=hi!`)

const inlineKeyboardForClient = new InlineKeyboard()
    .webApp('Open', {url: `${WEBAPP_URL}`})

bot.catch((err) => {
  const ctx = err.ctx;
  console.log(`Cath ERROR ${ctx.update.update_id}: `);
  const e = err.error;

  if (e instanceof GrammyError) {
      console.error(`Error in request: `, e.description);
  } else if (e instanceof HttpError) {
      console.error(`Couldn't not conntect TELEGRAM: `, e);
  } else {
      console.error(`Unknown error: `, e);
  }
})

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

bot.start();
startServer();

// export { io };