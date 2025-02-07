import mongoose from 'mongoose';

const trainerSchema = new mongoose.Schema({
    // Основная информация
    tgId: { type: Number, required: true, unique: true },
    first_name: { type: String, required: false },
    last_name: { type: String, required: false },
    username: { type: String, required: false },
    role: { type: String, default: 'trainer' },
    
    // Рабочее расписание
    workSchedule: {
        // Рабочие дни недели
        workDays: [{
            type: String,
            enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
        }],
        // Рабочие часы
        workHours: {
            start: { type: String, default: '09:00' },
            end: { type: String, default: '20:00' }
        }
    },

    // Забронированные слоты
    bookedSlots: [{
        date: { 
            type: String,  // Изменим на String
            required: true 
        },
        startTime: { 
            type: String, 
            required: true 
        },
        duration: { 
            type: Number, 
            default: 60 
        },
        clientId: { 
            type: Number, 
            required: true 
        }
    }],

    isActive: { type: Boolean, default: true }
}, { timestamps: true });

// Метод для проверки доступности временного слота
trainerSchema.methods.isTimeSlotAvailable = function(date, startTime) {
    // date приходит в формате DD.MM.YYYY
    return !this.bookedSlots.some(slot => 
        slot.date === date && slot.startTime === startTime
    );
};

// Метод для получения всех доступных слотов на определенную дату
trainerSchema.methods.getAvailableSlots = function(date) {
    // Преобразуем DD.MM.YYYY в объект Date для получения дня недели
    const [day, month, year] = date.split('.');
    const requestedDate = new Date(year, month - 1, day);
    const workDay = requestedDate.toLocaleDateString('en-US', { weekday: 'long' });
    
    // Проверяем, является ли день рабочим
    if (!this.workSchedule.workDays.includes(workDay)) {
        return [];
    }

    // Генерируем все возможные слоты для этого дня
    const slots = [];
    const [startHour] = this.workSchedule.workHours.start.split(':');
    const [endHour] = this.workSchedule.workHours.end.split(':');

    for (let hour = parseInt(startHour); hour < parseInt(endHour); hour++) {
        const time = `${hour.toString().padStart(2, '0')}:00`;
        if (this.isTimeSlotAvailable(date, time)) {
            slots.push(time);
        }
    }

    return slots;
};

export default mongoose.model('Trainer', trainerSchema);