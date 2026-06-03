const PREFIX = 'deskhub_';

export const storage = {
    get: (key) => {
        const value = localStorage.getItem(PREFIX + key);
        try {
            return JSON.parse(value);
        } catch (e) {
            return value;
        }
    },
    set: (key, value) => {
        localStorage.setItem(PREFIX + key, JSON.stringify(value));
    },
    remove: (key) => {
        localStorage.removeItem(PREFIX + key);
    },
    clear: () => {
        Object.keys(localStorage)
            .filter(key => key.startsWith(PREFIX))
            .forEach(key => localStorage.removeItem(key));
    }
};
