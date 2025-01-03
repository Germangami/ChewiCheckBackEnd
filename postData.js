const postData = async (url = '', data = {}) => {
    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
        });

        if (!response.ok) {
            console.error(`Error: ${response.status} - ${response.statusText}`);
            return { error: `HTTP ${response.status}` };
        }

        const result = await response.json();
        return result;
    } catch (error) {
        console.error('Fetch error:', error);
        throw error;
    }
};

export default {
    postData
}