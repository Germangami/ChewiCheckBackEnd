import Router from 'express';
import User from './model/User.js';

const router = new Router();

router.post('/user', async (req, res) => {
  try {
    const {tgId, first_name, last_name, username, type} = req.body;
    const post = await User.create({tgId, first_name, last_name, username, type});
    res.json(post);
  } catch(e) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.put('/user/update', async (req, res) => {
  try {
    const { tgId, nickname, startDate, endDate, totalTrainings, remainingTrainings, membershipType } = req.body;

    if (!tgId) {
      return res.status(400).json({ error: 'tgId не передан' });
    }

    const updatedUser = await User.findOneAndUpdate(
      { tgId },
      {
        ...(nickname && { nickname }),
        ...(startDate && { startDate }),
        ...(endDate && { endDate }),
        ...(totalTrainings && { totalTrainings }),
        ...(remainingTrainings && { remainingTrainings }),
        ...(membershipType && { membershipType })
      },
      { new: true }
    );

    if (!updatedUser) {
      return res.status(404).json({ error: 'Пользователь с указанным tgId не найден' });
    }

    res.status(200).json(updatedUser);
  } catch (e) {
    console.error('Ошибка при обновлении пользователя:', e.message, e.stack);
    res.status(500).json({ error: 'Ошибка сервера', details: e.message });
  }
});


router.put("/user/updateTrainings", async (req, res) => {
  const { tgId } = req.body;

  try {
    const user = await User.findOne({ tgId });
    if (!user) {
      return res.status(404).json({ message: "Пользователь не найден." });
    }

    // Проверка дня недели
    const today = new Date();
    const allowedDays = [1, 3, 5]; // Понедельник, среда, пятница
    const currentDay = today.getDay(); // Текущий день недели (0-6)

    console.log(`Сегодня день недели: ${currentDay}`); // Лог для отладки

    if (!allowedDays.includes(currentDay)) {
      return res
        .status(400)
        .json({ message: "Тренировки доступны только в понедельник, среду и пятницу." });
    }

    // Проверка лимита посещений за неделю
    const currentWeek = getCurrentWeek();
    const weeklyVisits = user.attendanceHistory.filter(
      (att) => new Date(att.date) >= currentWeek
    ).length;

    if (user.membershipType === "basic" && weeklyVisits >= 2) {
      return res
        .status(400)
        .json({ message: "Вы достигли лимита посещений за эту неделю (2 посещения)." });
    }

    if (user.membershipType === "premium" && weeklyVisits >= 3) {
      return res
        .status(400)
        .json({ message: "Вы достигли лимита посещений за эту неделю (3 посещения)." });
    }

    // Записываем посещение
    user.attendanceHistory.push({
      date: today,
      time: `${today.getHours()}:${today.getMinutes()}:${today.getSeconds()}`,
    });
    user.remainingTrainings -= 1; // Уменьшаем количество оставшихся тренировок
    await user.save();

    res.status(200).json({ message: "Посещение зарегистрировано успешно.", user });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Ошибка сервера." });
  }
});

// Функция для получения начала текущей недели
function getCurrentWeek() {
  const now = new Date();
  const startOfWeek = new Date(now.setDate(now.getDate() - now.getDay() + 1)); // Понедельник текущей недели
  startOfWeek.setHours(0, 0, 0, 0);
  return startOfWeek;
}


router.get("/user", async (req, res) => {
  try {
      const posts = await User.find();
      return res.json(posts);
  } catch(e) {
      res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
