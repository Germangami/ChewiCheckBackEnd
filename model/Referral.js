import mongoose from 'mongoose';

const ReferralSchema = new mongoose.Schema({
    tgId: { type: String, required: true },
    first_name: { type: String, required: true },
    referralDate: { type: Date, default: Date.now }
});

export const Referral = mongoose.model('Referral', ReferralSchema);