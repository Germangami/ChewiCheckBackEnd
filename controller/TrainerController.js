import Trainer from '../model/Trainer.js';
import { io } from '../index.js';
import TelegramService from '../services/TelegramService.js';
import Client from '../model/Client.js';

class TrainerController {
    // Создание тренера
    async createTrainer(req, res) {
        try {
            const { 
                tgId, 
                first_name = req.body.first_name ? req.body.first_name : '',
                last_name = req.body.last_name ? req.body.last_name : '',
                username = req.body.username ? req.body.username : '',
                workSchedule = {
                    workDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
                    workHours: { start: '09:00', end: '20:00' }
                }
            } = req.body;

            const existingTrainer = await Trainer.findOne({ tgId });
            if (existingTrainer) {
                return res.status(409).json({ error: 'Trainer already exists' });
            }
            
            const newTrainer = await Trainer.create({ 
                tgId, 
                first_name, 
                last_name, 
                username,
                workSchedule
            });

            io.emit('trainerAdded', newTrainer);
            res.json(newTrainer);
        } catch (error) {
            console.error('Error creating trainer:', error.message);
            res.status(500).json({ error: 'Internal server error' });
        }
    }

    // Получение доступных слотов на определенную дату
    async getAvailableSlots(req, res) {
        try {
            const { trainerId, date } = req.params;
            console.log('Request params:', { trainerId, date });
            console.log('Request params types:', { 
                trainerId: typeof trainerId, 
                date: typeof date 
            });

            const trainer = await Trainer.findOne({ tgId: trainerId });
            console.log('Found trainer:', trainer ? 'yes' : 'no');

            if (!trainer) {
                return res.status(404).json({ error: 'Trainer not found' });
            }

            // Проверяем формат даты
            console.log('Processing date before getAvailableSlots:', date);

            // Получаем слоты
            const availableSlots = trainer.getAvailableSlots(date);
            console.log('Available slots:', availableSlots);
            
            // Возвращаем слоты
            res.json(availableSlots);
        } catch (error) {
            console.error('Full error:', error);
            console.error('Error getting available slots:', error.message);
            res.status(500).json({ error: error.message || 'Internal server error' });
        }
    }

    // Бронирование слота
    async bookTimeSlot(req, res) {
        try {
            const { trainerId, client, date, startTime, duration = 60 } = req.body;
            console.log('Received booking request:', req.body);

            if (!client || !client.tgId || !client.first_name) {
                return res.status(400).json({ error: 'Invalid client data' });
            }

            const trainer = await Trainer.findOne({ tgId: trainerId });
            if (!trainer) {
                return res.status(404).json({ error: 'Trainer not found' });
            }

            // Проверяем доступность слота
            if (!trainer.isTimeSlotAvailable(date, startTime)) {
                return res.status(400).json({ error: 'Time slot is not available' });
            }

            // Добавляем бронирование с новой структурой client
            trainer.bookedSlots.push({
                date,
                startTime,
                duration,
                client: {
                    tgId: client.tgId,
                    first_name: client.first_name,
                    nickname: client.nickname || ''
                }
            });

            await trainer.save();
            
            // Отправляем уведомления
            await TelegramService.sendBookingNotification(trainer, client, date, startTime);

            io.emit('trainerScheduleUpdated', trainer);
            res.json(newTrainer);
        } catch (error) {
            console.error('Error booking time slot:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }

    // Отмена бронирования
    async cancelBooking(req, res) {
        try {
            const { trainerId, client, date, startTime } = req.body;
            
            // Находим тренера
            const trainer = await Trainer.findOne({ tgId: trainerId });
            if (!trainer) {
                return res.status(404).json({ error: 'Trainer not found' });
            }

            // Находим и удаляем бронирование у тренера
            const bookingIndex = trainer.bookedSlots.findIndex(slot => 
                slot.client.tgId === client.tgId && 
                slot.date === date && 
                slot.startTime === startTime
            );

            if (bookingIndex === -1) {
                return res.status(404).json({ error: 'Booking not found' });
            }

            // Удаляем бронирование у тренера
            trainer.bookedSlots.splice(bookingIndex, 1);
            await trainer.save();

            // Находим клиента и удаляем у него эту тренировку
            const currentClient = await Client.findOne({ tgId: client.tgId });
            if (currentClient && currentClient.clientType === 'individual') {
                currentClient.individualTraining.scheduledSessions = 
                    currentClient.individualTraining.scheduledSessions.filter(session => 
                        !(session.date === date && session.time === startTime)
                    );
                await currentClient.save();
                
                // Уведомляем об обновлении клиента
                io.emit('clientUpdated', currentClient);
            }
            
            // Отправляем уведомления об отмене
            await TelegramService.sendCancelNotification(
                trainer,
                client,
                date,
                startTime
            );

            // Уведомляем об обновлении тренера
            io.emit('trainerScheduleUpdated', trainer);
            
            res.json({ 
                message: 'Booking cancelled successfully', 
                trainer,
                client: currentClient 
            });
        } catch (error) {
            console.error('Error cancelling booking:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }

    // Обновление рабочего расписания тренера
    async updateWorkSchedule(req, res) {
        try {
            const { trainerId, workSchedule } = req.body;
            const trainer = await Trainer.findOne({ tgId: trainerId });

            if (!trainer) {
                return res.status(404).json({ error: 'Trainer not found' });
            }

            trainer.workSchedule = workSchedule;
            await trainer.save();

            io.emit('trainerScheduleUpdated', trainer);
            res.json({ message: 'Work schedule updated successfully', trainer });
        } catch (error) {
            console.error('Error updating work schedule:', error.message);
            res.status(500).json({ error: 'Internal server error' });
        }
    }

    // Получение всех тренеров
    async getAllTrainers(req, res) {
        try {
            const trainers = await Trainer.find({ isActive: true });
            return res.json(trainers);
        } catch (error) {
            console.error('Error fetching trainers:', error.message);
            res.status(500).json({ error: 'Internal server error' });
        }
    }

    // Получение тренера по ID
    async getTrainerById(req, res) {
        const { tgId } = req.params;
    
        try {
            const trainer = await Trainer.findOne({ tgId });
    
            if (!trainer) {
                return res.status(404).json({ error: 'Trainer not found' });
            }
    
            res.json(trainer);
        } catch (error) {
            console.error('Error finding trainer:', error.message);
            res.status(500).json({ error: 'Internal server error' });
        }
    }

    // Обновление статуса бронирования (подтверждение/отмена)
    async updateBookingStatus(req, res) {
        try {
            const { trainerId, clientTgId, date, startTime, status } = req.body;
            
            const trainer = await Trainer.findOne({ tgId: trainerId });
            if (!trainer) {
                return res.status(404).json({ error: 'Trainer not found' });
            }

            if (status === 'rejected') {
                // Находим и удаляем бронирование
                const bookingIndex = trainer.bookedSlots.findIndex(slot => 
                    slot.client.tgId === clientTgId && 
                    slot.date === date && 
                    slot.startTime === startTime
                );

                if (bookingIndex === -1) {
                    return res.status(404).json({ error: 'Booking not found' });
                }

                const canceledBooking = trainer.bookedSlots[bookingIndex];
                trainer.bookedSlots.splice(bookingIndex, 1);
                await trainer.save();

                // Отправляем уведомление клиенту через Telegram
                await TelegramService.sendBookingRejectedNotification(
                    trainer,
                    canceledBooking.client,
                    date,
                    startTime
                );

                io.emit('trainerScheduleUpdated', trainer);
                return res.json({ message: 'Booking cancelled successfully', trainer });
            }

            // Для других статусов (completed, approved)
            const booking = trainer.bookedSlots.find(slot => 
                slot.client.tgId === clientTgId && 
                slot.date === date && 
                slot.startTime === startTime
            );

            if (!booking) {
                return res.status(404).json({ error: 'Booking not found' });
            }

            // Обновляем статус
            booking.status = status;
            await trainer.save();

            // Отправляем уведомление для подтверждения
            if (status === 'approved') {
                await TelegramService.sendBookingApprovedNotification(
                    trainer,
                    booking.client,
                    date,
                    startTime
                );
            }

            io.emit('trainerScheduleUpdated', trainer);
            res.json({ message: 'Booking status updated successfully', trainer });
        } catch (error) {
            console.error('Error updating booking status:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }
}

export default new TrainerController();