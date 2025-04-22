import axios from 'axios';
import dotenv from 'dotenv';
dotenv.config();

class OpenAIService {
    async sendMessage(message) {
        try {
            const response = await axios.post(
                'https://api.openai.com/v1/chat/completions',
                {
                    model: 'gpt-3.5-turbo',
                    messages: [
                        {
                            role: 'user',
                            content: message,
                        },
                    ],
                },
                {
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
                    },
                }
            );
            
            return response.data;
        } catch (error) {
            console.error('Error calling OpenAI API:', error.message);
            throw error;
        }
    }
}

export default new OpenAIService(); 