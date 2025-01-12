import Client from '../model/Client.js';

class ClientController {
    async createClient(req, res) {
        try {
            const { tgId, first_name, last_name, username, nickName, role } = req.body;
            const post = await Client.create({ tgId, first_name, last_name, username, nickName, role });
            res.json(post);
        } catch (error) {
            console.error('Error creating client:', error.message);
            res.status(500).json({ error: 'Internal server error' });
        }
    }

    async updateClient(req, res) {
        const { _id, tgId, first_name, last_name, username, nickname, role } = req.body;
    
        const updateData = {};
    
        if (tgId) updateData.tgId = tgId;
        if (first_name) updateData.first_name = first_name;
        if (last_name) updateData.last_name = last_name;
        if (username) updateData.username = username;
        if (nickname) updateData.nickname = nickname;
        if (role) updateData.role = role;
    
        try {
            const client = await Client.findOne({ _id });
    
            if (!client) {
                return res.status(404).json({ error: 'Client not found' });
            }
    
            const updatedClient = await Client.findByIdAndUpdate(_id, updateData, { new: true });
    
            res.json(updatedClient);
        } catch (error) {
            console.error('Error updating client:', error.message);
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