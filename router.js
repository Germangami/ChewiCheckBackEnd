import Router from 'express';
import Post from './Post.js';
import Referral from './Referrals.js';
import User from './model/User.js';

const router = new Router();

router.post('/user', async (req, res) => {
  try {
    // const { tgId, first_name, last_name, username, startDate, endDate, remainingTrainings, totalTrainings, type } = req.body;
    // const post = await User.create({ tgId, first_name, last_name, username, startDate, endDate, remainingTrainings, totalTrainings, type });
    const {tgId, first_name, last_name, username, type} = req.body;
    const post = await User.create({tgId, first_name, last_name, username, type});
    res.json(post);
  } catch(e) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get("/user", async (req, res) => {
  try {
      const posts = await User.find();
      return res.json(posts);
  } catch(e) {
      res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/referrals', async (req, res) => {
  try {
    const { coachId, clientId } = req.body;
    const post = await Referral.create({ coachId, clientId });
    res.json({ success: true });
  } catch (error) {
    console.error('Error saving referral:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
})

router.get("/referrals", async (req, res) => {
    try {
        const posts = await Referral.find();
        return res.json(posts);
    } catch(e) {
        res.status(500).json({ error: 'Internal server error' });
    }
});

export default router;
