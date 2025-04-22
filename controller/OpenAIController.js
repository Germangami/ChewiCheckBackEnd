import OpenAIService from '../services/OpenAIService.js';

class OpenAIController {
    async sendMessage(req, res) {
        try {
            const { message } = req.body;
            
            if (!message) {
                return res.status(400).json({ error: 'Message is required' });
            }
            
            const response = await OpenAIService.sendMessage(message);
            res.json(response);
        } catch (error) {
            console.error('Error in OpenAI controller:', error.message);
            res.status(500).json({ 
                error: 'Failed to get response from OpenAI',
                details: error.message
            });
        }
    }
}

export default new OpenAIController(); 