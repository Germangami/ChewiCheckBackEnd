import express from 'express';
import mongoose from 'mongoose';
import router from './router.js';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.PORT;
const DB_URL = process.env.MONGO_DB_URL;

// Middleware
app.use(express.json());
app.use(cors());
app.use('/api', router);

const connectDB = async () => {
    try {
        await mongoose.connect(DB_URL);
        console.log('Connected to MongoDB');
    } catch (error) {
        console.error('Error connecting to MongoDB:', error.message);
        process.exit(1);
    }
};

const startServer = async () => {
    try {
        await connectDB();
        app.listen(PORT, () => console.log(`Server is running on http://localhost:${PORT}`));
    } catch (error) {
        console.error('Error starting the server:', error.message);
        process.exit(1);
    }
};

startServer();