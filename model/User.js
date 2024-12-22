import mongoose from 'mongoose';

const User = new mongoose.Schema({
    tgId: {type: Number, required: true},
    first_name: {type: String, required: true},
    last_name: {type: String, required: true},
    username: {type: String, required: true},
    // startDate: {type: Number, required: false},
    // endDate: {type: Number, required: false},
    // remainingTrainings: {type: Number, required: false},
    // totalTrainings: {type: Number, required: false},
    type: {type: String, require: false}
});

export default mongoose.model('User', User);