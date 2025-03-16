import mongoose from 'mongoose';
import moment from 'moment';

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
        },
        // Регулярные перерывы
        breaks: [{
            weekDay: {
                type: String,
                enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
                required: true
            },
            time: {
                type: String,
                required: true
            },
            duration: {
                type: Number,
                required: true,
                min: 15,
                max: 240
            },
            description: {
                type: String,
                default: ''
            }
        }]
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
        status: {
            type: String,
            enum: ['pending', 'approved', 'rejected'],
            default: 'pending'
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
    // Проверяем формат даты
    if (!/^\d{2}\.\d{2}\.\d{4}$/.test(dateStr)) {
        throw new Error('Invalid date format. Expected DD.MM.YYYY');
    }

    // Парсим дату
    const [day, month, year] = dateStr.split('.');
    const date = new Date(year, month - 1, day);
    const weekDay = date.toLocaleString('en-US', { weekday: 'long' });

    // Проверяем, является ли день рабочим
    if (!this.workSchedule.workDays.includes(weekDay)) {
        return [];
    }

    const slots = [];
    const { start, end } = this.workSchedule.workHours;
    let currentTime = moment(start, 'HH:mm');
    const endTime = moment(end, 'HH:mm');

    // Генерируем слоты с интервалом в 1 час
    while (currentTime.isBefore(endTime)) {
        const timeStr = currentTime.format('HH:mm');
        
        // Проверяем доступность слота
        if (this.isTimeSlotAvailable(dateStr, timeStr) && !this.isTimeInBreak(weekDay, timeStr)) {
            slots.push({
                time: timeStr,
                isAvailable: true
            });
        }
        
        currentTime.add(60, 'minutes');
    }

    return slots;
};

trainerSchema.methods.isTimeInBreak = function(weekDay, time) {
    if (!this.workSchedule.breaks) return false;
    
    return this.workSchedule.breaks.some(breakTime => {
        if (breakTime.weekDay !== weekDay) return false;
        
        const breakStart = moment(breakTime.time, 'HH:mm');
        const breakEnd = moment(breakTime.time, 'HH:mm').add(breakTime.duration, 'minutes');
        const checkTime = moment(time, 'HH:mm');
        
        return checkTime.isBetween(breakStart, breakEnd, null, '[)');
    });
};

export default mongoose.model('Trainer', trainerSchema);