import express from 'express';
import mongoose from 'mongoose';
import router from './router.js';
import clientRouter from './router/client-router.js';
import test1Router from './router/test1.js';
import cors from 'cors';
import dotenv from 'dotenv';
import { Server } from 'socket.io';
import https from 'https';
import fs from 'fs';
import { Bot, InlineKeyboard, GrammyError, HttpError } from "grammy";
import schedule from 'node-schedule';
import Client from './model/Client.js';

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
app.use('test', test1Router)

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
    .webApp('Prod', {url: `${WEBAPP_URL}`})
    .row()
    .webApp('Local', {url: `https://e869-93-105-176-50.ngrok-free.app`})
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

// Добавляем тестовую команду для бота
bot.command("checkSubscriptions", async (ctx) => {
    if (ctx.from.id === adminId) { // Проверяем, что команду вызывает админ
        await ctx.reply("Starting subscription check...");
        await checkSubscriptionStatus();
        await ctx.reply("Subscription check completed!");
    } else {
        await ctx.reply("Sorry, this command is for administrators only.");
    }
});

const checkSubscriptionStatus = async () => {
  try {
    const currentDate = new Date();
    console.log("Current date:", currentDate);
    
    // Находим всех активных клиентов
    const activeClients = await Client.find({ isActive: true });
    console.log("Found active clients:", activeClients.length);

    // Выводим информацию о каждом клиенте для отладки
    for (const client of activeClients) {
      console.log(`\nChecking client: ${client.tgId}`);
      console.log(`End date: ${client.endDate}`);
      console.log(`Remaining trainings: ${client.remainingTrainings}`);
      
      try {
        // Отправляем тестовое сообщение каждому активному клиенту
        await bot.api.sendMessage(
          client.tgId,
          `🔍 Тестовое уведомление:\nДата окончания: ${client.endDate}\nОсталось тренировок: ${client.remainingTrainings}`
        );
        console.log(`Successfully sent message to ${client.tgId}`);
      } catch (error) {
        console.error(`Failed to send message to ${client.tgId}:`, error);
      }
    }

  } catch (error) {
    console.error('Error in test check:', error);
  }
};

// Добавляем запуск проверки в существующую функцию startServer
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

export { io };