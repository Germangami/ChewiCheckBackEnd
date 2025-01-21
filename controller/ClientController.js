import Client from '../model/Client.js';
// import { io } from '../index.js';

class ClientController {
    async createClient(req, res) {
        try {
            const { tgId, trainerId, first_name, last_name, username, nickName, role } = req.body;

            const existingClient = await Client.findOne({ tgId });

            if (existingClient) {
                return res.status(409).json({ error: 'Client already exists' });
            }
            
            const newClient = await Client.create({ tgId, trainerId, first_name, last_name, username, nickName, role });
            // io.emit('clientUpdated', newClient);
            res.json(newClient);
        } catch (error) {
            console.error('Error creating client:', error.message);
            res.status(500).json({ error: 'Internal server error' });
        }
    }

    async updateClient(req, res) {
        const { _id, tgId, first_name, last_name, username, nickname, role, note, totalTrainings, remainingTrainings } = req.body;
    
        const updateData = {};
    
        if (tgId) updateData.tgId = tgId;
        if (first_name) updateData.first_name = first_name;
        if (last_name) updateData.last_name = last_name;
        if (username) updateData.username = username;
        if (nickname) updateData.nickname = nickname;
        if (role) updateData.role = role;
        if (note) updateData.note = note;
        if (totalTrainings) updateData.totalTrainings = totalTrainings;
        if (remainingTrainings) updateData.remainingTrainings = remainingTrainings;
    
        try {
            const client = await Client.findOne({ _id });
    
            if (!client) {
                return res.status(404).json({ error: 'Client not found' });
            }
    
            const updatedClient = await Client.findByIdAndUpdate(_id, updateData, { new: true });

            // io.emit('clientUpdated', updatedClient);
    
            res.json(updatedClient);
        } catch (error) {
            console.error('Error updating client:', error.message);
            res.status(500).json({ error: 'Internal server error' });
        }
    }

    async updateClientTrainings(req, res) {
        const { _id } = req.body;
        const today = new Date().toISOString().slice(0, 10);

        try {
            const currentClient = await Client.findById(_id);

            if (!currentClient) {
                return res.status(404).json({ error: 'Client not found' });
            }

            if (currentClient.lastTrainingDate === today) {
                return res.status(400).json({ error: 'You have already marked attendance for today' });
            }

            if (currentClient.remainingTrainings > 0) {
                currentClient.remainingTrainings -= 1;
                currentClient.lastTrainingDate = today;
                await currentClient.save();

                // io.emit('clientUpdated', currentClient);
                return res.status(200).json(currentClient);
            } else {
                return res.status(400).json({ error: 'No remaining trainings to mark' });
            }
        } catch(error) {
            console.error(error);
            res.status(500).json({ error: 'Server error' });
        }
    }

    async updateClientAboniment(req, res) {
        const { _id, aboniment } = req.body;
    
        try {
            const currentClient = await Client.findById(_id);
    
            if (!currentClient) {
                return res.status(404).json({ error: 'Client not found' });
            }
    
            let totalTrainings = 0;
            let remainingTrainings = 0;
    
            if (aboniment === 200) {
                totalTrainings = 8;
            } else if (aboniment === 300) {
                totalTrainings = 12;
            } else {
                return res.status(400).json({ error: 'Invalid aboniment value' });
            }
    
            remainingTrainings = totalTrainings;
    
            const currentDate = new Date();
    
            const endDate = new Date();
            endDate.setMonth(currentDate.getMonth() + 1);
    
            currentClient.aboniment = aboniment;
            currentClient.totalTrainings = totalTrainings;
            currentClient.remainingTrainings = remainingTrainings;
            currentClient.startDate = currentDate.toISOString();
            currentClient.endDate = endDate.toISOString();
    
            const updatedClient = await currentClient.save();

            // io.emit('clientUpdated', updatedClient);
            res.status(200).json(updatedClient);
        } catch (error) {
            console.error('Error updating aboniment:', error.message);
            res.status(500).json({ error: 'Internal server error' });
        }
    }

    async getCurrentClient(req, res) {
        const { tgId } = req.params;
    
        try {
            const currentClient = await Client.findOne({ tgId });
    
            if (!currentClient) {
                return res.status(404).json({ error: 'Client not found' });
            }
    
            res.json(currentClient);
        } catch (error) {
            console.error('Error finding current client:', error.message);
            res.status(500).json({ error: 'Internal server error' });
        }
    }

    async getAllClients(req, res) {
        try {
            const posts = await Client.find();
            return res.json(posts);
        } catch (error) {
            console.error('Error fetching clients:', error.message);
            res.status(500).json({ error: 'Internal server error' });
        }
    }
}

export default new ClientController();