import Client from '../model/Client.js';
import { io } from '../index.js';
import TelegramService from '../services/TelegramService.js';
import jwt from 'jsonwebtoken';

class ClientController {
    async createClient(req, res) {
        try {
            const { 
                tgId, 
                trainerId,
                first_name = '',
                last_name = '',
                username = '',
                nickName = '',
                role = 'client',
                clientType = 'group'
            } = req.body;

            const existingClient = await Client.findOne({ tgId });

            if (existingClient) {
                return res.status(409).json({ error: 'Client already exists' });
            }
            
            const newClient = await Client.create({ 
                tgId, 
                trainerId, 
                first_name, 
                last_name, 
                username,
                nickName,
                role,
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
            });

            io.emit('clientUpdated', newClient);
            res.json(newClient);
        } catch (error) {
            console.error('Error creating client:', error.message);
            res.status(500).json({ error: 'Internal server error' });
        }
    }

    async updateClient(req, res) {
        const { _id, tgId, first_name, last_name, username, nickname, role, note, totalTrainings, remainingTrainings } = req.body;
    
        const updateData = {};
    
        if (tgId) updateData.tgId = tgId;
        if (first_name) updateData.first_name = first_name;
        if (last_name) updateData.last_name = last_name;
        if (username) updateData.username = username;
        if (nickname) updateData.nickname = nickname;
        if (role) updateData.role = role;
        if (note) updateData.note = note;
        if (totalTrainings) updateData.totalTrainings = totalTrainings;
        if (remainingTrainings) updateData.remainingTrainings = remainingTrainings;
    
        try {
            const client = await Client.findOne({ _id });
    
            if (!client) {
                return res.status(404).json({ error: 'Client not found' });
            }
    
            const updatedClient = await Client.findByIdAndUpdate(_id, updateData, { new: true });

            io.emit('clientUpdated', updatedClient);
    
            res.json(updatedClient);
        } catch (error) {
            console.error('Error updating client:', error.message);
            res.status(500).json({ error: 'Internal server error' });
        }
    }

    async updateGroupTraining(req, res) {
        const { _id } = req.body;
        const today = new Date().toISOString().slice(0, 10);

        try {
            const currentClient = await Client.findById(_id);

            if (!currentClient || currentClient.clientType !== 'group') {
                return res.status(404).json({ error: 'Group client not found' });
            }

            if (currentClient.groupTraining.lastTrainingDate === today) {
                return res.status(400).json({ error: 'Already marked attendance for today' });
            }

            if (currentClient.groupTraining.remainingTrainings > 0) {
                currentClient.groupTraining.remainingTrainings -= 1;
                currentClient.groupTraining.lastTrainingDate = today;
                
                if (currentClient.groupTraining.remainingTrainings === 0) {
                    currentClient.groupTraining.isActive = false;
                }

                await currentClient.save();
                io.emit('clientUpdated', currentClient);
                return res.status(200).json(currentClient);
            } else {
                return res.status(400).json({ error: 'No remaining trainings' });
            }
        } catch(error) {
            console.error(error);
            res.status(500).json({ error: 'Server error' });
        }
    }

    async updateIndividualTraining(req, res) {
        const { _id, sessionId, status } = req.body;

        try {
            const currentClient = await Client.findById(_id);

            if (!currentClient || currentClient.clientType !== 'individual') {
                return res.status(404).json({ error: 'Individual client not found' });
            }

            // Находим конкретную тренировку по ID и обновляем только статус
            const sessionIndex = currentClient.individualTraining.scheduledSessions
                .findIndex(session => session._id.toString() === sessionId);

            if (sessionIndex === -1) {
                return res.status(404).json({ error: 'Training session not found' });
            }

            // Обновляем только статус, так как note больше нет
            currentClient.individualTraining.scheduledSessions[sessionIndex].status = status;
            await currentClient.save();

            io.emit('clientUpdated', currentClient);
            return res.status(200).json(currentClient);
        } catch(error) {
            console.error(error);
            res.status(500).json({ error: 'Server error' });
        }
    }

    async updateClientAboniment(req, res) {
        try {
            const { aboniment, _id } = req.body;
            const currentClient = await Client.findOne({ _id });

            if (!currentClient) {
                return res.status(404).json({ error: 'Client not found' });
            }

            // Определяем количество тренировок на основе абонемента
            let totalTrainings = 0;
            if (aboniment === 200) {
                totalTrainings = 8;  // 2 тренировки в неделю * 4 недели
            } else if (aboniment === 300) {
                totalTrainings = 12; // 3 тренировки в неделю * 4 недели
            } else {
                return res.status(400).json({ error: 'Invalid aboniment value' });
            }

            const currentDate = new Date();
            const endDate = new Date();
            endDate.setMonth(currentDate.getMonth() + 1);

            // Обновляем поля в groupTraining
            currentClient.groupTraining = {
                aboniment,
                totalTrainings,
                remainingTrainings: totalTrainings,
                startDate: currentDate.toISOString(),
                endDate: endDate.toISOString(),
                isActive: true
            };

            const updatedClient = await currentClient.save();
            io.emit('clientUpdated', updatedClient);
            res.status(200).json(updatedClient);
        } catch (error) {
            console.error('Error updating aboniment:', error.message);
            res.status(500).json({ error: 'Internal server error' });
        }
    }

    async getCurrentClient(req, res) {
        const { tgId } = req.params;
    
        try {
            const currentClient = await Client.findOne({ tgId });
    
            if (!currentClient) {
                return res.status(404).json({ error: 'Client not found' });
            }
    
            res.json(currentClient);
        } catch (error) {
            console.error('Error finding current client:', error.message);
            res.status(500).json({ error: 'Internal server error' });
        }
    }

    async getAllClients(req, res) {
        try {
            const posts = await Client.find();
            return res.json(posts);
        } catch (error) {
            console.error('Error fetching clients:', error.message);
            res.status(500).json({ error: 'Internal server error' });
        }
    }

    async scheduleIndividualTraining(req, res) {
        const { _id, date, time } = req.body;

        try {
            const currentClient = await Client.findById(_id);

            if (!currentClient || currentClient.clientType !== 'individual') {
                return res.status(404).json({ error: 'Individual client not found' });
            }

            // Преобразуем дату в нужный формат, если она приходит в другом формате
            const formattedDate = date.includes('T') 
                ? new Date(date).toLocaleDateString('ru-RU') // из ISO в DD.MM.YYYY
                : date;

            // Добавляем новую запланированную тренировку
            currentClient.individualTraining.scheduledSessions.push({
                date: formattedDate,
                time,
                status: 'planned'
            });

            await currentClient.save();
            io.emit('clientUpdated', currentClient);
            return res.status(200).json(currentClient);
        } catch(error) {
            console.error(error);
            res.status(500).json({ error: 'Server error' });
        }
    }

    // Отмена индивидуальной тренировки клиентом
    async cancelIndividualTraining(req, res) {
        const { _id, date, time } = req.body;

        try {
            const currentClient = await Client.findById(_id);

            if (!currentClient || currentClient.clientType !== 'individual') {
                return res.status(404).json({ error: 'Individual client not found' });
            }

            // Удаляем тренировку из расписания клиента
            currentClient.individualTraining.scheduledSessions = 
                currentClient.individualTraining.scheduledSessions.filter(session => 
                    !(session.date === date && session.time === time)
                );

            await currentClient.save();
            io.emit('clientUpdated', currentClient);
            return res.status(200).json(currentClient);
        } catch(error) {
            console.error(error);
            res.status(500).json({ error: 'Server error' });
        }
    }

    async validateWebApp(req, res) {
        try {
            const { initData } = req.body;
            
            if (!initData) {
                return res.status(400).json({ message: 'Init data is required' });
            }

            const userData = TelegramService.validateTelegramWebAppData(initData);
            return res.json({ valid: true, user: userData });
        } catch (error) {
            console.error('WebApp validation error:', error);
            return res.status(401).json({ 
                message: 'Invalid Telegram WebApp data',
                error: error.message 
            });
        }
    }

    async authenticateWebApp(req, res) {
        try {
            const { initData } = req.body;
            
            // Валидируем данные
            const userData = TelegramService.validateTelegramWebAppData(initData);
            
            // Ищем клиента
            let client = await Client.findOne({ tgId: userData.id });
            
            if (!client) {
                return res.status(404).json({ message: 'Client not found' });
            }

            // Создаем JWT токен
            const token = jwt.sign(
                { 
                    userId: client._id,
                    tgId: client.tgId,
                    role: 'client'
                },
                process.env.JWT_SECRET,
                { expiresIn: '24h' }
            );

            // Обновляем lastActive
            client.lastActive = new Date();
            await client.save();

            return res.json({
                token,
                user: {
                    id: client._id,
                    tgId: client.tgId,
                    first_name: client.first_name,
                    last_name: client.last_name,
                    username: client.username,
                    role: client.role,
                    clientType: client.clientType
                }
            });
        } catch (error) {
            console.error('Authentication error:', error);
            return res.status(401).json({ 
                message: 'Authentication failed',
                error: error.message 
            });
        }
    }
}

export default new ClientController();