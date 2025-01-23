import Router from 'express';
import Test1Controller from '../controller/Test1.js';

const test1Router = new Router();

test1Router.post('/create', Test1Controller.createClient);

test1Router.put('/update', Test1Controller.updateClient);
test1Router.put('/updateClientTrainings', Test1Controller.updateClientTrainings);
test1Router.put('/updateClientAboniment', Test1Controller.updateClientAboniment)

test1Router.get('/getClients', Test1Controller.getAllClients);
test1Router.get('/getCurrentClient/:tgId', Test1Controller.getCurrentClient);

export default test1Router;
