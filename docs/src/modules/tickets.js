import { ticketsApi } from '../api/tickets.js';
import { formatDate } from '../utils/formatDate.js';
import { debounce } from '../utils/debounce.js';
import { ui } from './ui.js';

let currentPage = 1;
const limit = 10;

export async function initTicketsList() {
    const searchInput = document.getElementById('search-input');
    const statusFilter = document.getElementById('status-filter');
    const priorityFilter = document.getElementById('priority-filter');
    const sortSelect = document.getElementById('sort-select');
    const newTicketBtn = document.getElementById('new-ticket-btn');
    const modal = document.getElementById('ticket-modal');
    const closeModalBtn = document.getElementById('close-modal');
    const ticketForm = document.getElementById('ticket-form');

    const refresh = async () => {
        const query = searchInput?.value || '';
        const status = statusFilter?.value || '';
        const priority = priorityFilter?.value || '';
        const sort = sortSelect?.value || 'createdAt';
        
        let params = `?_page=${currentPage}&_limit=${limit}&_sort=${sort}&_order=desc`;
        if (query) params += `&q=${query}`;
        if (status) params += `&status=${status}`;
        if (priority) params += `&priority=${priority}`;

        try {
            const { data, totalCount } = await ticketsApi.listTickets(params);
            renderTable(data);
            renderPagination(totalCount);
        } catch (error) {
            ui.showToast('Failed to load tickets');
        }
    };

    searchInput?.addEventListener('input', debounce(() => {
        currentPage = 1;
        refresh();
    }, 300));

    [statusFilter, priorityFilter, sortSelect].forEach(el => {
        el?.addEventListener('change', () => {
            currentPage = 1;
            refresh();
        });
    });

    // Modal logic
    newTicketBtn?.addEventListener('click', () => {
        modal.style.display = 'flex';
    });

    closeModalBtn?.addEventListener('click', () => {
        modal.style.display = 'none';
        ticketForm.reset();
    });

    window.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.style.display = 'none';
            ticketForm.reset();
        }
    });

    ticketForm?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const formData = {
            title: document.getElementById('ticket-title').value,
            description: document.getElementById('ticket-description').value,
            priority: document.getElementById('ticket-priority').value,
            category: document.getElementById('ticket-category').value,
            customerName: document.getElementById('customer-name').value,
            customerEmail: document.getElementById('customer-email').value,
            status: 'open',
            assigneeId: null
        };

        try {
            await ticketsApi.createTicket(formData);
            ui.showToast('Ticket created successfully!');
            modal.style.display = 'none';
            ticketForm.reset();
            refresh();
        } catch (error) {
            ui.showToast('Failed to create ticket');
        }
    });

    refresh();
}

function renderTable(tickets) {
    const tbody = document.getElementById('tickets-tbody');
    if (!tbody) return;

    if (tickets.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" style="text-align:center">No tickets found</td></tr>';
        return;
    }

    tbody.innerHTML = tickets.map(t => `
        <tr>
            <td>#${t.id}</td>
            <td><a href="ticket-detail.html?id=${t.id}">${t.title}</a></td>
            <td>${t.customerName}</td>
            <td><span class="badge badge-${t.priority}">${t.priority}</span></td>
            <td><span class="badge badge-${t.status.replace(' ', '-')}">${t.status}</span></td>
            <td>${formatDate(t.createdAt)}</td>
            <td>
                <button onclick="window.location.href='ticket-detail.html?id=${t.id}'" class="btn">View</button>
            </td>
        </tr>
    `).join('');
}

function renderPagination(totalCount) {
    const container = document.getElementById('pagination');
    if (!container || !totalCount) return;

    const totalPages = Math.ceil(totalCount / limit);
    container.innerHTML = `
        <button class="btn" ${currentPage === 1 ? 'disabled' : ''} id="prev-page">Prev</button>
        <span>Page ${currentPage} of ${totalPages}</span>
        <button class="btn" ${currentPage === totalPages ? 'disabled' : ''} id="next-page">Next</button>
    `;

    document.getElementById('prev-page')?.addEventListener('click', () => {
        if (currentPage > 1) {
            currentPage--;
            initTicketsList();
        }
    });

    document.getElementById('next-page')?.addEventListener('click', () => {
        if (currentPage < totalPages) {
            currentPage++;
            initTicketsList();
        }
    });
}
