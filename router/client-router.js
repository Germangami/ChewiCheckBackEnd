import Router from 'express';
import ClientController from '../controller/ClientController.js';

const clientRouter = new Router();

clientRouter.post('/create', ClientController.createClient);

clientRouter.put('/update', ClientController.updateClient);
clientRouter.put('/updateClientTrainings', ClientController.updateClientTrainings);
clientRouter.put('/updateClientAboniment', ClientController.updateClientAboniment)

clientRouter.get('/getClients', ClientController.getAllClients);
clientRouter.get('/getCurrentClient/:tgId', ClientController.getCurrentClient);

export default clientRouter;
