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
        console.log("Запуск проверки подписок:", currentDate.toLocaleString());
        
        // Находим только активных клиентов с установленной датой окончания
        const activeClients = await Client.find({ 
            isActive: true,
            endDate: { $ne: null }
        });
        console.log("Найдено активных клиентов:", activeClients.length);

        for (const client of activeClients) {
            try {
                const endDate = new Date(client.endDate);
                const daysUntilExpiration = Math.floor((endDate - currentDate) / (1000 * 60 * 60 * 24));
                
                console.log(`Проверка клиента ${client.tgId}:`, {
                    endDate: endDate.toLocaleString(),
                    daysLeft: daysUntilExpiration,
                    remainingTrainings: client.remainingTrainings
                });

                // Абонемент истек
                if (daysUntilExpiration < 0) {
                    console.log(`Абонемент истек у клиента ${client.tgId}`);
                    
                    // Обновляем статус клиента
                    await Client.findByIdAndUpdate(client._id, {
                        isActive: false,
                        remainingTrainings: 0,
                        totalTrainings: 0,
                        startDate: null,
                        endDate: null,
                        aboniment: null
                    });

                    // Отправляем уведомление клиенту
                    await bot.api.sendMessage(
                        client.tgId,
                        '❌ Ваш абонемент закончился!\n\n' +
                        'Для продолжения тренировок необходимо приобрести новый абонемент.\n\n' +
                        'Свяжитесь с тренером для получения информации о доступных абонементах.'
                    );
                    
                    io.emit('clientUpdated', client);
                }
                // Предупреждение о скором окончании
                else if (daysUntilExpiration <= 3) {
                    console.log(`Отправка предупреждения клиенту ${client.tgId}`);
                    
                    const message = 
                        `⚠️ Внимание! Срок действия вашего абонемента подходит к концу!\n\n` +
                        `До окончания: ${daysUntilExpiration} ${getDaysWord(daysUntilExpiration)}\n` +
                        `Осталось тренировок: ${client.remainingTrainings}\n\n` +
                        `Не забудьте продлить абонемент, чтобы продолжить тренировки.`;

                    await bot.api.sendMessage(client.tgId, message);
                }
            } catch (clientError) {
                console.error(`Ошибка при обработке клиента ${client.tgId}:`, clientError);
                continue;
            }
        }
    } catch (error) {
        console.error('Критическая ошибка при проверке подписок:', error);
        
        try {
            await bot.api.sendMessage(
                adminId,
                `❌ Ошибка при проверке подписок:\n${error.message}\n\nТребуется проверка системы!`
            );
        } catch (notifyError) {
            console.error('Не удалось уведомить администратора:', notifyError);
        }
    }
};

// Запускаем проверку каждый день в 10:00
const startSubscriptionCheck = () => {
    console.log('Планировщик проверки подписок запущен');
    // Временно для тестирования - проверка каждую минуту
    schedule.scheduleJob('0 10 * * *', checkSubscriptionStatus);
    // После тестирования вернуть обратно на '0 10 * * *'
};

export { checkSubscriptionStatus, startSubscriptionCheck };