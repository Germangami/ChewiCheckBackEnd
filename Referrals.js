import mongoose from 'mongoose'

const Referral = new mongoose.Schema({
    coachId: {type: Number, required: true},
    clientId: {type: Number, required: true},
})
export default mongoose.model('Referrals', Referral)
