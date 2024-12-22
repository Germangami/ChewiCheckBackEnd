import mongoose from 'mongoose';

const ReferralSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  referrerId: { type: String, required: true },
});

const Referral = mongoose.model('Referral', ReferralSchema);

export async function saveReferral(userId, referrerId) {
  await Referral.create({ userId, referrerId });
}

export async function getReferrals(userId) {
  const referrals = await Referral.find({ referrerId: userId });
  return referrals.map((referral) => referral.userId);
}

export async function getReferrer(userId) {
  const referral = await Referral.findOne({ userId });
  return referral ? referral.referrerId : null;
}