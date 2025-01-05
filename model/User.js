import mongoose from 'mongoose';

const User = new mongoose.Schema({
    tgId: {type: Number, required: true},
    first_name: {type: String, required: true},
    last_name: {type: String, required: true},
    username: {type: String, required: true},
    nickname: {type: String, required: false},
    startDate: {type: String, required: false},
    endDate: {type: String, required: false},
    remainingTrainings: {type: Number, required: false},
    totalTrainings: {type: Number, required: false},
    type: {type: String, require: false},
    membershipType: {type: String, require: false},
    attendanceHistory: [
        {
          date: { type: Date, required: false },
          time: { type: String, required: false },
        }
    ]
});

export default mongoose.model('User', User);