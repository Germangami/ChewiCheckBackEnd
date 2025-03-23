import { Bot, InlineKeyboard, GrammyError, HttpError } from "grammy";
import dotenv from 'dotenv';
import crypto from 'crypto';
dotenv.config();

const bot = new Bot(process.env.TELEGRAM_BOT_TOKEN);

class TelegramService {
    constructor() {
        this.botToken = process.env.TELEGRAM_BOT_TOKEN;
    }

    validateTelegramWebAppData(initData) {
        // Проверяем наличие данных
        if (!initData) {
            throw new Error('No init data provided');
        }

        const urlParams = new URLSearchParams(initData);
        const hash = urlParams.get('hash');
        const authDate = urlParams.get('auth_date');
        const userData = urlParams.get('user');

        // Проверяем обязательные поля
        if (!hash || !authDate || !userData) {
            throw new Error('Missing required fields in init data');
        }

        // Создаем массив для проверки
        const dataCheckArr = [];
        urlParams.sort();
        urlParams.forEach((value, key) => {
            if (key !== 'hash') {
                dataCheckArr.push(`${key}=${value}`);
            }
        });

        // Создаем строку для проверки
        const dataCheckString = dataCheckArr.join('\\n');

        // Создаем секретный ключ
        const secretKey = crypto
            .createHash('sha256')
            .update(this.botToken)
            .digest();

        // Создаем hmac
        const hmac = crypto
            .createHmac('sha256', secretKey)
            .update(dataCheckString)
            .digest('hex');

        // Проверяем валидность данных
        if (hmac !== hash) {
            throw new Error('Invalid hash');
        }

        // Проверяем время авторизации (не старше 24 часов)
        const authDateSeconds = parseInt(authDate);
        const now = Math.floor(Date.now() / 1000);
        if (now - authDateSeconds > 86400) {
            throw new Error('Authorization data is expired');
        }

        // Возвращаем данные пользователя
        return JSON.parse(userData);
    }

    async sendMessageToUser(userId, message) {
        try {
            const response = await fetch(`https://api.telegram.org/bot${this.botToken}/sendMessage`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    chat_id: userId,
                    text: message,
                    parse_mode: 'HTML'
                })
            });

            if (!response.ok) {
                throw new Error(`Telegram API error: ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            console.error('Error sending message:', error);
            throw error;
        }
    }

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