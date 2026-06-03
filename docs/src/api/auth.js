import { client } from './client.js';
import { storage } from '../utils/storage.js';

export const authApi = {
    login: async (email, password) => {
        // In a real app, we'd POST to /login. With json-server, we query /users.
        const { data } = await client.get(`/users?email=${email}`);
        const user = data[0];

        console.log('Attempting login for:', email, 'User found:', user);
        if (user && password === 'demo123') {
            storage.set('user', user);
            storage.set('token', 'fake-jwt-token');
            return user;
        }
        throw new Error('Invalid email or password');
    },
    logout: () => {
        storage.remove('user');
        storage.remove('token');
        window.location.href = 'index.html';
    },
    getCurrentUser: () => storage.get('user'),
    isAuthenticated: () => !!storage.get('token')
};
