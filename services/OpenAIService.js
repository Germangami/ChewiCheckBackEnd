import dotenv from 'dotenv';
dotenv.config();

class OpenAIService {
    async sendMessage(message) {
        try {
            const response = await fetch('https://api.openai.com/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
                },
                body: JSON.stringify({
                    model: 'gpt-3.5-turbo',
                    messages: [
                        {
                            role: 'user',
                            content: message,
                        },
                    ],
                })
            });
            
            if (!response.ok) {
                throw new Error(`OpenAI API responded with status: ${response.status}`);
            }
            
            return await response.json();
        } catch (error) {
            console.error('Error calling OpenAI API:', error.message);
            throw error;
        }
    }
}

export default new OpenAIService(); 