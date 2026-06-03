import { authApi } from '../api/auth.js';

export function initLogin() {
    const form = document.getElementById('login-form');
    const errorMsg = document.getElementById('login-error');
    const loginBtn = document.getElementById('login-btn');

    if (!form) return;

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;

        loginBtn.disabled = true;
        loginBtn.textContent = 'Logging in...';
        errorMsg.style.display = 'none';

        try {
            await authApi.login(email, password);
            window.location.href = 'dashboard.html';
        } catch (error) {
            errorMsg.style.display = 'block';
            loginBtn.disabled = false;
            loginBtn.textContent = 'Login';
        }
    });
}

export function checkAuth() {
    const publicPages = ['index.html', ''];
    const path = window.location.pathname;
    const currentPage = path.split('/').pop();
    
    const isPublic = publicPages.includes(currentPage);
    const isAuthenticated = authApi.isAuthenticated();

    if (!isAuthenticated && !isPublic) {
        window.location.href = 'index.html';
    } else if (isAuthenticated && isPublic) {
        window.location.href = 'dashboard.html';
    }
}
