import { initLogin, checkAuth } from './modules/auth.js';
import { initTicketsList } from './modules/tickets.js';
import { initTicketDetail } from './modules/ticketDetail.js';
import { authApi } from './api/auth.js';

document.addEventListener('DOMContentLoaded', () => {
    checkAuth();

    const path = window.location.pathname;
    const page = path.split('/').pop();

    if (page === 'index.html' || page === '' || path.endsWith('/public/')) {
        initLogin();
    } else if (page === 'tickets.html') {
        initTicketsList();
    } else if (page === 'dashboard.html') {
        renderDashboard();
    } else if (page === 'ticket-detail.html') {
        initTicketDetail();
    }

    // Handle logout
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', (e) => {
            e.preventDefault();
            authApi.logout();
        });
    }

    // Set user name in header
    const userNameEl = document.getElementById('user-name');
    if (userNameEl) {
        const user = authApi.getCurrentUser();
        if (user) userNameEl.textContent = user.name;
    }
});

async function renderDashboard() {
    const statsContainer = document.querySelector('.stats-grid');
    if (statsContainer) {
        statsContainer.innerHTML = `
            <div class="stat-card"><h3>Open Tickets</h3><div class="value">12</div></div>
            <div class="stat-card"><h3>In Progress</h3><div class="value">5</div></div>
            <div class="stat-card"><h3>Resolved</h3><div class="value">45</div></div>
            <div class="stat-card"><h3>Avg Response</h3><div class="value">2.4h</div></div>
        `;
    }
}
