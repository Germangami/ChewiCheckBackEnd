import mongoose from 'mongoose';

const clientSchema = new mongoose.Schema({
    tgId: { type: Number, required: false },
    first_name: { type: String, required: false },
    last_name: { type: String, required: false },
    username: { type: String, required: false },
    nickname: { type: String, required: false },
    role: { type: String, required: false }
}, { timestamps: true });

export default mongoose.model('Client', clientSchema);