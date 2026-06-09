import { initLogin, checkAuth } from './modules/auth.js';
import { initTicketsList } from './modules/tickets.js';
import { initTicketDetail } from './modules/ticketDetail.js';
import { authApi } from './api/auth.js';
import { ticketsApi } from './api/tickets.js';

document.addEventListener('DOMContentLoaded', () => {
    checkAuth();

    const path = window.location.pathname;
    const page = path.split('/').pop();

    if (page === 'index.html' || page === '') {
        initLogin();
    } else if (page === 'tickets.html') {
        renderDashboard();
        window.addEventListener('dashboardRefreshRequested', renderDashboard);
        initTicketsList();
    } else if (page === 'dashboard.html') {
        window.location.href = 'tickets.html';
    } else if (page === 'ticket-detail.html') {
        window.location.href = 'tickets.html';
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
    if (!statsContainer) return;

    try {
        const [ticketsRes, commentsRes] = await Promise.all([
            ticketsApi.listTickets(),
            ticketsApi.listAllComments()
        ]);

        const tickets = ticketsRes.data || ticketsRes;
        const comments = commentsRes.data || commentsRes;

        const openCount = tickets.filter(t => t.status === 'open').length;
        const inProgressCount = tickets.filter(t => t.status === 'in-progress').length;
        const resolvedCount = tickets.filter(t => t.status === 'resolved').length;

        const commentsByTicket = comments.reduce((map, comment) => {
            const ticketId = comment.ticketId;
            if (!map[ticketId]) map[ticketId] = [];
            map[ticketId].push(comment);
            return map;
        }, {});

        const responseTimes = tickets
            .map(ticket => {
                const ticketComments = commentsByTicket[ticket.id] || [];
                if (ticketComments.length === 0) return null;
                const firstComment = ticketComments.reduce((first, comment) => {
                    return new Date(comment.createdAt) < new Date(first.createdAt) ? comment : first;
                }, ticketComments[0]);
                return new Date(firstComment.createdAt) - new Date(ticket.createdAt);
            })
            .filter(time => time !== null);

        const avgResponseText = responseTimes.length > 0
            ? formatDuration(Math.round(responseTimes.reduce((sum, ms) => sum + ms, 0) / responseTimes.length))
            : 'N/A';

        statsContainer.innerHTML = `
            <div class="stat-card"><h3>Open Tickets</h3><div class="value">${openCount}</div></div>
            <div class="stat-card"><h3>In Progress</h3><div class="value">${inProgressCount}</div></div>
            <div class="stat-card"><h3>Resolved</h3><div class="value">${resolvedCount}</div></div>
            <div class="stat-card"><h3>Avg First Response</h3><div class="value">${avgResponseText}</div></div>
        `;
    } catch (error) {
        statsContainer.innerHTML = `
            <div class="stat-card"><h3>Open Tickets</h3><div class="value">-</div></div>
            <div class="stat-card"><h3>In Progress</h3><div class="value">-</div></div>
            <div class="stat-card"><h3>Resolved</h3><div class="value">-</div></div>
            <div class="stat-card"><h3>Avg First Response</h3><div class="value">N/A</div></div>
        `;
    }
}

function formatDuration(ms) {
    const totalMinutes = Math.round(ms / 60000);
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    if (hours > 0) {
        return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
}
