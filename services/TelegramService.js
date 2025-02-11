import { Bot, InlineKeyboard, GrammyError, HttpError } from "grammy";

const bot = new Bot(process.env.TELEGRAM_BOT_TOKEN);

class TelegramService {
    async sendBookingNotification(trainer, client, date, time) {
        // Сообщение для тренера
        const trainerMessage = `🏋️ Новая тренировка!\n\nКлиент: ${client.first_name} ${client.nickname ? client.nickname : ''}\nДата: ${date}\nВремя: ${time}`;
        
        // Сообщение для клиента
        const clientMessage = `✅ Тренировка забронирована!\n\nТренер: ${trainer.first_name} ${trainer.last_name ? trainer.last_name : ''}\nДата: ${date}\nВремя: ${time}`;

        try {
            // Отправляем уведомления
            await bot.reply(trainer.tgId, trainerMessage);
            await bot.reply(client.tgId, clientMessage);
        } catch (error) {
            console.error('Error sending Telegram notification:', error);
        }
    }

    async sendCancelNotification(trainer, client, date, time) {
        // Уведомления об отмене
        const trainerMessage = `❌ Тренировка отменена!\n\nКлиент: ${client.first_name} ${client.nickname ? client.nickname : ''}\nДата: ${date}\nВремя: ${time}`;
        const clientMessage = `❌ Тренировка отменена!\n\nТренер: ${trainer.first_name} ${trainer.last_name ? trainer.last_name : ''}\nДата: ${date}\nВремя: ${time}`;

        try {
            await bot.reply(trainer.tgId, trainerMessage);
            await bot.reply(client.tgId, clientMessage);
        } catch (error) {
            console.error('Error sending cancel notification:', error);
        }
    }
}

export default new TelegramService(); 