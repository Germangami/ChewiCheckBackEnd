import Router from 'express';
import UserController from './controller/UserController.js'

const router = new Router();

router.post('/user', UserController.createUser);

router.put('/user/update', UserController.updateUser);

router.put("/user/updateTrainings", UserController.updateTrainingsUser);

router.get("/user", UserController.getAllUsers);

export default router;
