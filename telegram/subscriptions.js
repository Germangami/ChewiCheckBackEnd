import schedule from 'node-schedule';
import Client from '../model/Client.js';
import { bot, adminId } from './bot.js';
import { io } from '../index.js';

// // Вспомогательная функция для склонения слова "день"
// function getDaysWord(days) {
//     if (days === 1) return 'день';
//     if (days > 1 && days < 5) return 'дня';
//     return 'дней';
// }

// const checkSubscriptionStatus = async () => {
//     try {
//         const currentDate = new Date();
//         console.log("Запуск проверки подписок:", currentDate.toLocaleString());
        
//         // Находим только активных клиентов с установленной датой окончания
//         const activeClients = await Client.find({ 
//             isActive: true,
//             endDate: { $ne: null }
//         });
//         console.log("Найдено активных клиентов:", activeClients.length);

//         for (const client of activeClients) {
//             try {
//                 const endDate = new Date(client.endDate);
//                 const daysUntilExpiration = Math.floor((endDate - currentDate) / (1000 * 60 * 60 * 24));
                
//                 console.log(`Проверка клиента ${client.tgId}:`, {
//                     endDate: endDate.toLocaleString(),
//                     daysLeft: daysUntilExpiration,
//                     remainingTrainings: client.remainingTrainings
//                 });

//                 // Абонемент истек
//                 if (daysUntilExpiration < 0) {
//                     console.log(`Абонемент истек у клиента ${client.tgId}`);
                    
//                     // Обновляем статус клиента
//                     await Client.findByIdAndUpdate(client._id, {
//                         isActive: false,
//                         remainingTrainings: 0,
//                         totalTrainings: 0,
//                         startDate: null,
//                         endDate: null,
//                         aboniment: null
//                     });

//                     // Отправляем уведомление клиенту
//                     await bot.api.sendMessage(
//                         client.tgId,
//                         '❌ Ваш абонемент закончился!\n\n' +
//                         'Для продолжения тренировок необходимо приобрести новый абонемент.\n\n' +
//                         'Свяжитесь с тренером для получения информации о доступных абонементах.'
//                     );
                    
//                     io.emit('clientUpdated', client);
//                 }
//                 // Предупреждение о скором окончании
//                 else if (daysUntilExpiration <= 3) {
//                     console.log(`Отправка предупреждения клиенту ${client.tgId}`);
                    
//                     const message = 
//                         `⚠️ Внимание! Срок действия вашего абонемента подходит к концу!\n\n` +
//                         `До окончания: ${daysUntilExpiration} ${getDaysWord(daysUntilExpiration)}\n` +
//                         `Осталось тренировок: ${client.remainingTrainings}\n\n` +
//                         `Не забудьте продлить абонемент, чтобы продолжить тренировки.`;

//                     await bot.api.sendMessage(client.tgId, message);
//                 }
//             } catch (clientError) {
//                 console.error(`Ошибка при обработке клиента ${client.tgId}:`, clientError);
//                 continue;
//             }
//         }
//     } catch (error) {
//         console.error('Критическая ошибка при проверке подписок:', error);
        
//         try {
//             await bot.api.sendMessage(
//                 adminId,
//                 `❌ Ошибка при проверке подписок:\n${error.message}\n\nТребуется проверка системы!`
//             );
//         } catch (notifyError) {
//             console.error('Не удалось уведомить администратора:', notifyError);
//         }
//     }
// };

// // Запускаем проверку каждый день в 10:00
// const startSubscriptionCheck = () => {
//     console.log('Планировщик проверки подписок запущен');
//     // Временно для тестирования - проверка каждую минуту
//     schedule.scheduleJob('0 10 * * *', checkSubscriptionStatus);
//     // После тестирования вернуть обратно на '0 10 * * *'
// };

// export { checkSubscriptionStatus, startSubscriptionCheck };


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
                    bot.sendMessage(adminId, `Неверный формат даты у клиента ${client._id}, ${client?.first_name}`);
                    continue;
                }

                // 4. Расчет дней до окончания
                const timeDiff = endDate.getTime() - currentDate.getTime();
                const daysUntilExpiration = Math.ceil(timeDiff / (1000 * 3600 * 24));

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
        bot.sendMessage(adminId, `Проверка групповых подписок не удалась: ${error.message}`);
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
    // Временно для тестирования - проверка каждую минуту
    // schedule.scheduleJob('0 10 * * *', checkSubscriptionStatus);
    schedule.scheduleJob('*/2 * * * *', checkSubscriptionStatus);
    // После тестирования вернуть обратно на '0 10 * * *'
};

export { checkSubscriptionStatus, startSubscriptionCheck };