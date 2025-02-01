import mongoose from 'mongoose';

const clientSchema = new mongoose.Schema({
    tgId: { type: Number, required: true },
    trainerId: { type: Number, required: false },
    first_name: { type: String, required: false },
    last_name: { type: String, required: false },
    username: { type: String, required: false },
    nickname: { type: String, required: false },
    role: { type: String, required: false },
    note: { type: String, required: false },

    // Новое поле для типа клиента
    clientType: { 
        type: String, 
        enum: ['group', 'individual'], 
        required: true 
    },

    // Поля для групповых тренировок
    groupTraining: {
        aboniment: {type: Number},
        startDate: {type: String},
        endDate: {type: String},
        totalTrainings: {type: Number},
        remainingTrainings: {type: Number},
        lastTrainingDate: {type: String},
        isActive: {type: Boolean}
    },

    // Поля для индивидуальных тренировок
    individualTraining: {
        scheduledSessions: [{
            date: {type: Date},
            time: {type: String},
            status: {
                type: String,
                enum: ['planned', 'completed', 'missed']
            },
            note: {type: String}
        }],
        pricePerSession: {type: Number},
        preferredDays: {type: [String]},
        preferredTime: {type: String}
    },

    startDate: {type: String, required: false},
    endDate: {type: String, required: false},
    totalTrainings: { type: Number, required: false },
    remainingTrainings: { type: Number, required: false },
    aboniment: {type: Number, required: false},
    lastTrainingDate: { type: String, required: false },
    isActive: { type: Boolean, default: false },
}, { timestamps: true });

export default mongoose.model('Client', clientSchema);