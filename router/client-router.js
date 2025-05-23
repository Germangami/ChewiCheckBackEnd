import Router from 'express';
import ClientController from '../controller/ClientController.js';

const clientRouter = new Router();

clientRouter.post('/create', ClientController.createClient);

clientRouter.put('/update', ClientController.updateClient);
clientRouter.put('/updateClientAboniment', ClientController.updateClientAboniment);
clientRouter.put('/updateGroupTraining', ClientController.updateGroupTraining);
clientRouter.put('/updateIndividualTraining', ClientController.updateIndividualTraining);

clientRouter.get('/getClients', ClientController.getAllClients);
clientRouter.get('/getCurrentClient/:tgId', ClientController.getCurrentClient);

clientRouter.post('/scheduleIndividualTraining', ClientController.scheduleIndividualTraining);

// Новый роут для валидации WebApp
clientRouter.post('/validate-webapp', ClientController.validateWebApp);
clientRouter.post('/auth', ClientController.authenticateWebApp);

export default clientRouter;
