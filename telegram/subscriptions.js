import schedule from 'node-schedule';
import Client from '../model/Client.js';
import { bot, adminId } from './bot.js';
import { io } from '../index.js';

// Вспомогательная функция для склонения слова "день"
function getDaysWord(days) {
    if (days === 1) return 'день';
    if (days > 1 && days < 5) return 'дня';
    return 'дней';
}


const checkSubscriptionStatus = async () => {
    try {
        const currentDate = new Date();
        console.log("Запуск проверки групповых подписок:", currentDate.toLocaleString());

        // 1. Запрос только групповых клиентов с активным абонементом
        const activeGroupClients = await Client.find({
            clientType: 'group',
            'groupTraining.isActive': true,
            'groupTraining.endDate': { $ne: null }
        });

        console.log("Найдено активных групповых клиентов:", activeGroupClients.length);

        for (const client of activeGroupClients) {
            try {
                // 2. Проверка наличия обязательных полей
                if (!client.groupTraining?.endDate || !client.tgId) {
                    console.log(`Пропуск клиента ${client._id}: отсутствуют данные`);
                    continue;
                }

                // 3. Конвертация строки в Date
                const endDate = new Date(client.groupTraining.endDate);
                if (isNaN(endDate.getTime())) {
                    console.log(`Неверный формат даты у клиента ${client._id}`);
                    bot.api.sendMessage(adminId, `Неверный формат даты у клиента ${client._id}, ${client?.first_name}`);
                    continue;
                }

                // 4. Расчет дней до окончания
                const timeDiff = endDate.getTime() - currentDate.getTime();
                const daysUntilExpiration = Math.floor(timeDiff / (1000 * 3600 * 24));

                console.log(`Клиент ${client.tgId}:`, {
                    endDate: endDate.toISOString(),
                    daysUntilExpiration
                });

                // 5. Логика обработки
                if (daysUntilExpiration < 0) {
                    await handleExpiredSubscription(client);
                } else if (daysUntilExpiration <= 3) {
                    await sendExpirationWarning(client, daysUntilExpiration);
                }

            } catch (error) {
                console.error(`Ошибка обработки клиента ${client._id}:`, error);
            }
        }

    } catch (error) {
        console.error('Критическая ошибка:', error);
        // Отправка уведомления админу...
        bot.api.sendMessage(adminId, `Проверка групповых подписок не удалась: ${error.message}`);
    }
};

// Обработка истекшего абонемента
async function handleExpiredSubscription(client) {
    try {
        // Отправка уведомления
        await bot.api.sendMessage(
            client.tgId,
            '❌ Ваш абонемент закончился! Обратитесь к тренеру.'
        );

        // Обновление данных
        const updatedClient = await Client.findByIdAndUpdate(
            client._id,
            {
                $set: {
                    'groupTraining.isActive': false,
                    'groupTraining.remainingTrainings': 0,
                    'groupTraining.totalTrainings': 0,
                    'groupTraining.aboniment': null,
                    'groupTraining.startDate': null,
                    'groupTraining.endDate': null
                }
            },
            { new: true }
        );

        io.emit('clientUpdated', updatedClient);

    } catch (error) {
        console.error(`Ошибка деактивации клиента ${client._id}:`, error);
        throw error;
    }
}

// Отправка предупреждения
async function sendExpirationWarning(client, daysLeft) {
    try {
        const message = `⚠️ До окончания абонемента осталось ${daysLeft} ${getDaysWord(daysLeft)}!`;
        await bot.api.sendMessage(client.tgId, message);
    } catch (error) {
        console.error(`Не удалось отправить предупреждение ${client._id}:`, error);
    }
}

// Запускаем проверку каждый день в 10:00
const startSubscriptionCheck = () => {
    console.log('Планировщик проверки подписок запущен');
    schedule.scheduleJob('0 10 * * *', checkSubscriptionStatus);
    // schedule.scheduleJob('*/2 * * * *', checkSubscriptionStatus);
};

export { checkSubscriptionStatus, startSubscriptionCheck };