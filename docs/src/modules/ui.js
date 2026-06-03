export const ui = {
    showToast: (message, duration = 3000) => {
        let container = document.getElementById('toast-container');
        if (!container) {
            container = document.createElement('div');
            container.id = 'toast-container';
            document.body.appendChild(container);
        }
        const toast = document.createElement('div');
        toast.className = 'toast';
        toast.textContent = message;
        container.appendChild(toast);
        setTimeout(() => {
            toast.remove();
        }, duration);
    },
    showLoader: (containerId) => {
        const container = document.getElementById(containerId);
        if (container) {
            container.innerHTML = '<div class="loader">Loading...</div>';
        }
    },
    hideLoader: (containerId) => {
        // Implementation depends on how loader is added
    },
    confirm: (message) => {
        return window.confirm(message);
    }
};
