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
        date: { type: Date, required: true },
        startTime: { type: String, required: true },
        duration: { type: Number, default: 60 }, // длительность в минутах
        clientId: { type: Number, required: true } // tgId клиента
    }],

    isActive: { type: Boolean, default: true }
}, { timestamps: true });

// Метод для проверки доступности временного слота
trainerSchema.methods.isTimeSlotAvailable = function(date, startTime) {
    const requestedDate = new Date(date);
    
    return !this.bookedSlots.some(slot => {
        const slotDate = new Date(slot.date);
        return (
            slotDate.getDate() === requestedDate.getDate() &&
            slotDate.getMonth() === requestedDate.getMonth() &&
            slotDate.getFullYear() === requestedDate.getFullYear() &&
            slot.startTime === startTime
        );
    });
};

// Метод для получения всех доступных слотов на определенную дату
trainerSchema.methods.getAvailableSlots = function(date) {
    const requestedDate = new Date(date);
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