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
        const type = params[0]; // 'group', 'individual' или 'trainer'
        const fromId = params[1];

        if (type === 'trainer') {
            const trainerData = {
                tgId: ctx.from.id,
                first_name: ctx.from.first_name || '',
                last_name: ctx.from.last_name || '',
                username: ctx.from.username || '',
                role: 'trainer'
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
                    ctx.reply('Trainer already exists!');
                    return;
                }

                const data = await response.json();
                await ctx.reply(`✅ You have been successfully added as a trainer!`, {
                    reply_markup: inlineKeyboardForCoach,
                });
            } catch (error) {
                console.error('Error creating trainer:', error);
                ctx.reply('Error creating trainer. Please try again.');
            }
            return;
        }

        // Существующая логика для клиентов
        const clientData = {
            tgId: ctx.from.id,
            trainerId,
            first_name: ctx.from.first_name || '',
            last_name: ctx.from.last_name || '',
            username: ctx.from.username || '',
            role: 'client',
            clientType: type,
            ...(type === 'group' ? {
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
      .webApp('Local', {url: `https://2f2a-93-105-176-50.ngrok-free.app`})
      .row()
      .url('Add Group Client', `https://t.me/share/url?url=https://t.me/ChewiCheckBot?start=group_${adminId}&text=Join group training!`)
      .row()
      .url('Add Individual Client', `https://t.me/share/url?url=https://t.me/ChewiCheckBot?start=individual_${adminId}&text=Join individual training!`)
      .row()
      .url('Add Trainer', `https://t.me/share/url?url=https://t.me/ChewiCheckBot?start=trainer_${adminId}&text=Become a trainer!`)
  
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
    if (ctx.from.id === adminId || ctx.from.id === trainerId) {
        await ctx.reply("Запуск проверки подписок...");
        await checkSubscriptionStatus();
        await ctx.reply("Проверка подписок завершена!");
    } else {
        await ctx.reply("Извините, эта команда только для администраторов.");
    }
  });

  export { bot, adminId, trainerId };