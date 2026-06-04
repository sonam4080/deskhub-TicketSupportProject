import { ticketsApi } from '../api/tickets.js';
import { formatDate } from '../utils/formatDate.js';
import { debounce } from '../utils/debounce.js';
import { ui } from './ui.js';
import { validateForm } from './form.js';

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
    const tbody = document.getElementById('tickets-tbody');

    // Delete confirmation modal elements
    const deleteModal = document.getElementById('delete-confirm-modal');
    const deleteTicketTitle = document.getElementById('delete-ticket-title');
    const cancelDeleteBtn = document.getElementById('cancel-delete-btn');
    const confirmDeleteBtn = document.getElementById('confirm-delete-btn');
    let pendingDeleteTicketId = null;

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
        document.body.classList.add('modal-open');
    });

    closeModalBtn?.addEventListener('click', () => {
        modal.style.display = 'none';
        document.body.classList.remove('modal-open');
        ticketForm.reset();
    });

    window.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.style.display = 'none';
            document.body.classList.remove('modal-open');
            ticketForm.reset();
        }
    });

    ticketForm?.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        // Clear previous errors and error styling
        document.querySelectorAll('.error-message').forEach(el => {
            el.textContent = '';
            el.classList.remove('show');
        });
        document.querySelectorAll('.form-control').forEach(el => {
            el.classList.remove('error');
        });
        
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

        // Validation schema
        const validationSchema = {
            title: [
                { type: 'required', message: 'Title is required' },
                { type: 'minLength', param: 5, message: 'Title must be at least 5 characters' },
                { type: 'maxLength', param: 100, message: 'Title cannot exceed 100 characters' }
            ],
            description: [
                { type: 'required', message: 'Description is required' },
                { type: 'minLength', param: 10, message: 'Description must be at least 10 characters' }
            ],
            customerEmail: [
                { type: 'required', message: 'Customer email is required' },
                { type: 'email', message: 'Please enter a valid email address' }
            ],
            customerName: [
                { type: 'required', message: 'Customer name is required' }
            ]
        };

        // Validate form
        const errors = validateForm(formData, validationSchema);
        
        // Display errors
        if (Object.keys(errors).length > 0) {
            // Map error field names to HTML elements
            const errorFieldMap = {
                title: { message: 'title-error', input: 'ticket-title' },
                description: { message: 'description-error', input: 'ticket-description' },
                customerName: { message: 'customer-name-error', input: 'customer-name' },
                customerEmail: { message: 'customer-email-error', input: 'customer-email' }
            };

            Object.entries(errors).forEach(([field, message]) => {
                const mapping = errorFieldMap[field];
                if (mapping) {
                    // Show error message
                    const errorEl = document.getElementById(mapping.message);
                    if (errorEl) {
                        errorEl.textContent = message;
                        errorEl.classList.add('show');
                    }
                    
                    // Add error styling to input
                    const inputEl = document.getElementById(mapping.input);
                    if (inputEl) {
                        inputEl.classList.add('error');
                    }
                }
            });
            
            ui.showToast('Please fix the errors in the form');
            return;
        }

        try {
            await ticketsApi.createTicket(formData);
            ui.showToast('Ticket created successfully!');
            modal.style.display = 'none';
            document.body.classList.remove('modal-open');
            ticketForm.reset();
            refresh();
        } catch (error) {
            ui.showToast('Failed to create ticket');
        }
    });

    // Remove error styling when user starts typing
    ['ticket-title', 'ticket-description', 'customer-name', 'customer-email'].forEach(fieldId => {
        document.getElementById(fieldId)?.addEventListener('input', function() {
            this.classList.remove('error');
        });
    });

    // Delete confirmation modal handlers
    cancelDeleteBtn?.addEventListener('click', () => {
        deleteModal.style.display = 'none';
        document.body.classList.remove('modal-open');
        pendingDeleteTicketId = null;
    });

    confirmDeleteBtn?.addEventListener('click', async () => {
        if (pendingDeleteTicketId) {
            try {
                await ticketsApi.deleteTicket(pendingDeleteTicketId);
                ui.showToast('Ticket deleted successfully!');
                deleteModal.style.display = 'none';
                document.body.classList.remove('modal-open');
                pendingDeleteTicketId = null;
                refresh();
            } catch (error) {
                ui.showToast('Failed to delete ticket');
            }
        }
    });

    // Close delete modal when clicking on background
    window.addEventListener('click', (e) => {
        if (e.target === deleteModal) {
            deleteModal.style.display = 'none';
            document.body.classList.remove('modal-open');
            pendingDeleteTicketId = null;
        }
    });

    // Event delegation for delete button
    tbody?.addEventListener('click', async (e) => {
        if (e.target.classList.contains('delete-ticket')) {
            const ticketId = e.target.dataset.ticketId;
            
            // Find the ticket to get its title
            const row = e.target.closest('tr');
            const ticketTitleElement = row.querySelector('a');
            const ticketTitle = ticketTitleElement ? ticketTitleElement.textContent : 'this ticket';
            
            // Show delete confirmation modal
            pendingDeleteTicketId = ticketId;
            deleteTicketTitle.textContent = `Are you sure you want to delete "${ticketTitle}"?`;
            deleteModal.style.display = 'flex';
            document.body.classList.add('modal-open');
        }
    });

    refresh();
}

function renderTable(tickets) {
    const tbody = document.getElementById('tickets-tbody');
    if (!tbody) return;

    if (tickets.length === 0) {
        tbody.innerHTML = '<tr><td colspan="8" style="text-align:center">No tickets found</td></tr>';
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
            <td class="action-cell">
                <button onclick="window.location.href='ticket-detail.html?id=${t.id}'" class="btn btn-sm">View</button>
                <button class="btn btn-sm btn-danger delete-ticket" data-ticket-id="${t.id}" title="Delete ticket">&#128465;</button>
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
