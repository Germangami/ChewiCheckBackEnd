import {MongoClient} from 'mongodb';

const uri = "mongodb+srv://kontaktherman:PKTC2XYGPqc0mMlf@cluster0.irxhj.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";

async function run() {
    const client = new MongoClient(uri);

    try {
        console.log('Connecting to database...');
        await client.connect(); // Подключение к базе данных
        console.log('Successfully connected to MongoDB!');

        // Проверим доступные базы данных
        const databasesList = await client.db().admin().listDatabases();
        console.log('Databases:');
        databasesList.databases.forEach(db => console.log(` - ${db.name}`));
    } catch (err) {
        console.error('Error connecting to MongoDB:', err);
    } finally {
        await client.close(); // Закрываем подключение
    }
}

run().catch(console.error);