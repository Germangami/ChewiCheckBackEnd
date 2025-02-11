import { Bot, InlineKeyboard, GrammyError, HttpError } from "grammy";
import dotenv from 'dotenv';
dotenv.config();

const bot = new Bot(process.env.TELEGRAM_BOT_TOKEN);

class TelegramService {
    async sendBookingNotification(trainer, client, date, time) {
        // Сообщение для тренера
        const trainerMessage = `🏋️ *Новая тренировка!*\n\n`
            + `👤 Клиент: ${client.first_name} ${client.nickname ? client.nickname : ''}\n`
            + `📅 Дата: ${date}\n`
            + `⏰ Время: ${time}`;
        
        // Сообщение для клиента
        const clientMessage = `✅ *Тренировка забронирована!*\n\n`
            + `👨‍🏫 Тренер: ${trainer.first_name}\n`
            + `📅 Дата: ${date}\n`
            + `⏰ Время: ${time}`;

        try {
            // Отправляем уведомления с форматированием Markdown
            await bot.api.sendMessage(trainer.tgId, trainerMessage, {
                parse_mode: "Markdown"
            });
            await bot.api.sendMessage(client.tgId, clientMessage, {
                parse_mode: "Markdown"
            });
        } catch (error) {
            console.error('Error sending Telegram notification:', error);
        }
    }

    async sendCancelNotification(trainer, client, date, time) {
        // Уведомления об отмене
        const trainerMessage = `❌ *Тренировка отменена!*\n\n`
            + `👤 Клиент: ${client.first_name} ${client.nickname ? client.nickname : ''}\n`
            + `📅 Дата: ${date}\n`
            + `⏰ Время: ${time}`;
            
        const clientMessage = `❌ *Тренировка отменена!*\n\n`
            + `👨‍🏫 Тренер: ${trainer.first_name}\n`
            + `📅 Дата: ${date}\n`
            + `⏰ Время: ${time}`;

        try {
            await bot.api.sendMessage(trainer.tgId, trainerMessage, {
                parse_mode: "Markdown"
            });
            await bot.api.sendMessage(client.tgId, clientMessage, {
                parse_mode: "Markdown"
            });
        } catch (error) {
            console.error('Error sending cancel notification:', error);
        }
    }
}

export default new TelegramService(); 