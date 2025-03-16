import Router from 'express';
import TrainerController from '../controller/TrainerController.js';

const trainerRouter = new Router();

// Базовые операции с тренером
trainerRouter.post('/create', TrainerController.createTrainer);
trainerRouter.get('/getTrainers', TrainerController.getAllTrainers);
trainerRouter.get('/getTrainer/:tgId', TrainerController.getTrainerById);
trainerRouter.get('/slots/:trainerId/:date', TrainerController.getAvailableSlots);
trainerRouter.post('/book', TrainerController.bookTimeSlot);
trainerRouter.post('/cancel', TrainerController.cancelBooking);
trainerRouter.put('/schedule', TrainerController.updateWorkSchedule);
trainerRouter.patch('/booking/status', TrainerController.updateBookingStatus);

export default trainerRouter;
