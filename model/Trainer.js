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
            type: String,
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
        client: {
            tgId: { 
                type: Number, 
                required: true 
            },
            first_name: { 
                type: String, 
                required: true 
            },
            nickname: { 
                type: String,
                required: false
            }
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
trainerSchema.methods.getAvailableSlots = function(dateStr) {
    try {
        if (!dateStr || typeof dateStr !== 'string') {
            throw new Error(`Invalid date format. Expected string, got ${typeof dateStr}`);
        }

        // Получаем день недели
        const dateParts = dateStr.split('.');
        if (dateParts.length !== 3) {
            throw new Error('Invalid date format. Expected DD.MM.YYYY');
        }

        const [day, month, year] = dateParts;
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
            const isAvailable = this.isTimeSlotAvailable(dateStr, time);
            
            // Проверяем, есть ли перерыв в это время
            const hasBreak = this.workSchedule.breaks?.some(function(breakTime) {
                return breakTime.weekDay === workDay && breakTime.time === time;
            });

            slots.push({
                date: dateStr,
                time: time,
                isAvailable: isAvailable && !hasBreak,
                unavailableReason: hasBreak ? 'break' : 
                                 !isAvailable ? 'booked' : 
                                 undefined
            });
        }

        return slots;
    } catch (error) {
        console.error('Error in getAvailableSlots:', error);
        throw error;
    }
};

export default mongoose.model('Trainer', trainerSchema);