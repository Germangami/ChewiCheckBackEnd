import Trainer from '../model/Trainer.js';
import { io } from '../index.js';

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
            const trainer = await Trainer.findOne({ tgId: trainerId });

            if (!trainer) {
                return res.status(404).json({ error: 'Trainer not found' });
            }

            const availableSlots = trainer.getAvailableSlots(new Date(date));
            res.json({ availableSlots });
        } catch (error) {
            console.error('Error getting available slots:', error.message);
            res.status(500).json({ error: 'Internal server error' });
        }
    }

    // Бронирование слота
    async bookTimeSlot(req, res) {
        try {
            const { trainerId, clientId, date, startTime, duration = 60 } = req.body;
            const trainer = await Trainer.findOne({ tgId: trainerId });

            if (!trainer) {
                return res.status(404).json({ error: 'Trainer not found' });
            }

            // Проверяем доступность слота
            if (!trainer.isTimeSlotAvailable(date, startTime)) {
                return res.status(400).json({ error: 'Time slot is not available' });
            }

            // Добавляем бронирование
            trainer.bookedSlots.push({
                date: new Date(date),
                startTime,
                duration,
                clientId
            });

            await trainer.save();
            io.emit('trainerScheduleUpdated', trainer);
            res.json({ message: 'Time slot booked successfully', trainer });
        } catch (error) {
            console.error('Error booking time slot:', error.message);
            res.status(500).json({ error: 'Internal server error' });
        }
    }

    // Отмена бронирования
    async cancelBooking(req, res) {
        try {
            const { trainerId, clientId, date, startTime } = req.body;
            const trainer = await Trainer.findOne({ tgId: trainerId });

            if (!trainer) {
                return res.status(404).json({ error: 'Trainer not found' });
            }

            // Находим и удаляем бронирование
            const bookingIndex = trainer.bookedSlots.findIndex(slot => 
                slot.clientId === clientId && 
                new Date(slot.date).toISOString() === new Date(date).toISOString() && 
                slot.startTime === startTime
            );

            if (bookingIndex === -1) {
                return res.status(404).json({ error: 'Booking not found' });
            }

            trainer.bookedSlots.splice(bookingIndex, 1);
            await trainer.save();
            
            io.emit('trainerScheduleUpdated', trainer);
            res.json({ message: 'Booking cancelled successfully', trainer });
        } catch (error) {
            console.error('Error cancelling booking:', error.message);
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
}

export default new TrainerController();