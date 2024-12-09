//mongoDbPassword = quCEeWlYwebDcZ5p
//mongoDbUserName = hermannamreg
import express from 'express'
import mongoose from 'mongoose'
import router from './router.js'
import cors from 'cors'

console.log('server working')

const PORT = 5000;
const DB_URL =  `mongodb+srv://hermannamreg:quCEeWlYwebDcZ5p@cluster0.6d33l.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`

const app = express();

app.use(express.json());
app.use(cors());
app.use('/api', router);

//app.get('/', (req, res) => {
//    console.log(req.query);
//    res.status(200).json('Сервер работает');
//});


async function startApp() {
    try {
        await mongoose.connect(DB_URL, {useUnifiedTopology: true, useNewUrlParser: true});
        app.listen(PORT, () => console.log('SERVER STARTED ON PORT ' + PORT));
    } catch (e) {
        console.log(e)
    }
}



startApp();
