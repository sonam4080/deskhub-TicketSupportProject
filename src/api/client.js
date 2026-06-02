const BASE_URL = 'http://localhost:3001';

async function request(endpoint, options = {}) {
    const url = `${BASE_URL}${endpoint}`;
    const headers = {
        'Content-Type': 'application/json',
        ...options.headers
    };

    try {
        const response = await fetch(url, { ...options, headers });
        const totalCount = response.headers.get('X-Total-Count');
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        return { data, totalCount: parseInt(totalCount) || null };
    } catch (error) {
        console.error('API Request Error:', error);
        throw error;
    }
}

export const client = {
    get: (endpoint, options) => request(endpoint, { ...options, method: 'GET' }),
    post: (endpoint, body, options) => request(endpoint, { ...options, method: 'POST', body: JSON.stringify(body) }),
    patch: (endpoint, body, options) => request(endpoint, { ...options, method: 'PATCH', body: JSON.stringify(body) }),
    del: (endpoint, options) => request(endpoint, { ...options, method: 'DELETE' })
};
