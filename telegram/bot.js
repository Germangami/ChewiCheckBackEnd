import { Bot, InlineKeyboard, GrammyError, HttpError } from "grammy";
import { checkSubscriptionStatus } from './subscriptions.js';
import { io } from '../index.js';
import dotenv from 'dotenv';
dotenv.config();

//BOTSETTINGS
const bot = new Bot(process.env.TELEGRAM_BOT_TOKEN);
const trainerId = 6448727138;
const WEBAPP_URL = 'https://chewi-check.com';
const adminId = 469408413;

//КОД БОТА
bot.command('start', async (ctx) => {
    console.log(ctx.match, 'COMMAND START');
  
    if (ctx.match) {
        const params = ctx.match.split('_');
        const clientType = params[0]; // 'group' или 'individual'
        const trainer = params[1];
        
        const clientData = {
            tgId: ctx.from.id,
            trainerId,
            first_name: ctx.from.first_name || '',
            last_name: ctx.from.last_name || '',
            username: ctx.from.username || '',
            role: 'client',
            clientType,
            ...(clientType === 'group' ? {
                groupTraining: {
                    isActive: false,
                    remainingTrainings: 0,
                    totalTrainings: 0
                }
            } : {
                individualTraining: {
                    scheduledSessions: []
                }
            })
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
      .webApp('Local', {url: `https://878d-93-105-176-50.ngrok-free.app`})
      .row()
      .url('Add Group Client', `https://t.me/share/url?url=https://t.me/ChewiCheckBot?start=group_${adminId}&text=Join group training!`)
      .row()
      .url('Add Individual Client', `https://t.me/share/url?url=https://t.me/ChewiCheckBot?start=individual_${adminId}&text=Join individual training!`)
      .row()
      .url('add new Coach', `https://t.me/share/url?url=https://t.me/ChewiCheckBot?start=${adminId}&text=hi!`)
      .row()
  
  const inlineKeyboardForCoach = new InlineKeyboard()
      .webApp('Open', {url: `${WEBAPP_URL}`})
      .row()
      .url('Add Group Client', `https://t.me/share/url?url=https://t.me/ChewiCheckBot?start=group_${trainerId}&text=Join group training!`)
      .row()
      .url('Add Individual Client', `https://t.me/share/url?url=https://t.me/ChewiCheckBot?start=individual_${trainerId}&text=Join individual training!`)
  
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
    if (ctx.from.id === adminId || ctx.from.id === trainerId) { // Проверяем, что команду вызывает админ
        await ctx.reply("Запуск проверки подписок...");
        await checkSubscriptionStatus();
        await ctx.reply("Проверка подписок завершена!");
    } else {
        await ctx.reply("Извините, эта команда только для администраторов.");
    }
  });
  
  const checkTrainingsData = async () => {
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

  // В существующем боте обновляем обработку команды для добавления тренера
  bot.command('addtrainer', async (ctx) => {
    if (ctx.from.id === adminId) {
        const trainerData = {
            tgId: ctx.message.reply_to_message?.from.id,
            first_name: ctx.message.reply_to_message?.from.first_name || '',
            last_name: ctx.message.reply_to_message?.from.last_name || '',
            username: ctx.message.reply_to_message?.from.username || '',
            workSchedule: {
                workDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
                workHours: { start: '09:00', end: '20:00' }
            }
        };

        try {
            const response = await fetch(`${WEBAPP_URL}/trainer/create`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(trainerData)
            });

            if (!response.ok) {
                throw new Error(`Server error: ${response.status}`);
            }

            const data = await response.json();
            ctx.reply(`Trainer ${data.first_name} created successfully!`);
            io.emit('trainerAdded', data);
        } catch (error) {
            console.error('Error creating trainer:', error);
            ctx.reply('Error creating trainer. Please try again.');
        }
    } else {
        ctx.reply('Sorry, only admin can add trainers.');
    }
  });

  export { bot, adminId, trainerId };