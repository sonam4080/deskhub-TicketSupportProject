import { ticketsApi } from '../api/tickets.js';
import { formatDate } from '../utils/formatDate.js';
import { debounce } from '../utils/debounce.js';
import { ui } from './ui.js';
import { validateForm } from './form.js';

let currentPage = 1;
const limit = 5;
let lastFocusedElement = null;
let panelKeydownHandler = null;
let currentTicket = null;
let refreshTickets = null;

export async function initTicketsList() {
    const searchInput = document.getElementById('search-input');
    const statusFilter = document.getElementById('status-filter');
    const priorityFilter = document.getElementById('priority-filter');
    const sortSelect = document.getElementById('sort-select');
    const clearFiltersBtn = document.getElementById('clear-filters-btn');
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
        
        const sortField = sort === 'priority'
            ? 'priorityRank,createdAt'
            : sort === 'status'
                ? 'statusRank,createdAt'
                : 'createdAt';
        let params = `?_page=${currentPage}&_limit=${limit}&_sort=${sortField}&_order=desc`;
        if (query) params += `&q=${query}`;
        if (status) params += `&status=${status}`;
        if (priority) params += `&priority=${priority}`;

        try {
            const { data, totalCount } = await ticketsApi.listTickets(params);
            renderTable(data);
            renderPagination(totalCount);
            window.dispatchEvent(new Event('dashboardRefreshRequested'));
        } catch (error) {
            ui.showToast('Failed to load tickets');
        }
    };

    refreshTickets = refresh;

    searchInput?.addEventListener('input', debounce(() => {
        currentPage = 1;
        refresh();
    }, 300));

    [statusFilter, priorityFilter, sortSelect].forEach(el => {
        el?.addEventListener('change', () => {
            currentPage = 1;
            refresh();
            updateClearButton();
        });
    });

    // Clear filters button
    clearFiltersBtn?.addEventListener('click', () => {
        // Reset controls to defaults
        if (searchInput) searchInput.value = '';
        if (statusFilter) statusFilter.value = '';
        if (priorityFilter) priorityFilter.value = '';
        if (sortSelect) sortSelect.value = 'createdAt';
        currentPage = 1;
        refresh();
        updateClearButton();
    });

    // Enable/disable clear button based on filters/search state
    function updateClearButton() {
        if (!clearFiltersBtn) return;
        const hasSearch = !!(searchInput && searchInput.value && searchInput.value.trim() !== '');
        const hasStatus = !!(statusFilter && statusFilter.value);
        const hasPriority = !!(priorityFilter && priorityFilter.value);
        const hasSort = !!(sortSelect && sortSelect.value && sortSelect.value !== 'createdAt');
        clearFiltersBtn.disabled = !(hasSearch || hasStatus || hasPriority || hasSort);
    }

    // Wire search input to update clear button state
    searchInput?.addEventListener('input', debounce(() => {
        currentPage = 1;
        refresh();
        updateClearButton();
    }, 300));

    // Initialize clear button state
    updateClearButton();

    // Modal logic
    newTicketBtn?.addEventListener('click', () => {
        // Reset form and clear previous validation errors so modal opens fresh
        ticketForm.reset();
        document.querySelectorAll('.error-message').forEach(el => {
            el.textContent = '';
            el.classList.remove('show');
        });
        document.querySelectorAll('.form-control').forEach(el => {
            el.classList.remove('error');
        });

        modal.style.display = 'flex';
        document.body.classList.add('modal-open');
        // Ensure modal content is scrolled to top when opening
        modal.querySelector('.modal-content')?.scrollTo?.({ top: 0 });
    });

    closeModalBtn?.addEventListener('click', () => {
        modal.style.display = 'none';
        document.body.classList.remove('modal-open');
        ticketForm.reset();
        document.querySelectorAll('.error-message').forEach(el => {
            el.textContent = '';
            el.classList.remove('show');
        });
        document.querySelectorAll('.form-control').forEach(el => {
            el.classList.remove('error');
        });
    });

    window.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.style.display = 'none';
            document.body.classList.remove('modal-open');
            ticketForm.reset();
            document.querySelectorAll('.error-message').forEach(el => {
                el.textContent = '';
                el.classList.remove('show');
            });
            document.querySelectorAll('.form-control').forEach(el => {
                el.classList.remove('error');
            });
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
            ],
            priority: [
                { type: 'required', message: 'Please select a priority' }
            ],
            category: [
                { type: 'required', message: 'Please select a category' }
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
                customerEmail: { message: 'customer-email-error', input: 'customer-email' },
                priority: { message: 'priority-error', input: 'ticket-priority' },
                category: { message: 'category-error', input: 'ticket-category' }
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

    // Remove error styling when user starts typing or changes selection
    ['ticket-title', 'ticket-description', 'customer-name', 'customer-email', 'ticket-priority', 'ticket-category'].forEach(fieldId => {
        const element = document.getElementById(fieldId);
        if (element) {
            if (element.tagName === 'SELECT') {
                element.addEventListener('change', function() {
                    this.classList.remove('error');
                });
            } else {
                element.addEventListener('input', function() {
                    this.classList.remove('error');
                });
            }
        }
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
            const ticketTitleElement = row.querySelector('.ticket-title');
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
            <td><span class="ticket-title">${escapeHtml(t.title)}</span></td>
            <td>${escapeHtml(t.customerName)}</td>
            <td><span class="badge badge-${t.priority}">${escapeHtml(t.priority)}</span></td>
            <td><span class="badge badge-${t.status.replace(' ', '-')}">${escapeHtml(t.status)}</span></td>
            <td>${formatDate(t.createdAt)}</td>
            <td class="action-cell">
                <button class="btn btn-sm view-ticket" data-ticket-id="${t.id}">View</button>
                <button class="btn btn-sm btn-danger delete-ticket" data-ticket-id="${t.id}" title="Delete ticket">&#128465;</button>
            </td>
        </tr>
    `).join('');
}

function renderPanelView(ticket) {
    const panelTitle = document.getElementById('panel-title');
    const panelMeta = document.getElementById('panel-meta');
    const panelDescription = document.getElementById('panel-description');
    const panelStatus = document.getElementById('panel-status');
    const panelPriority = document.getElementById('panel-priority');
    const panelCategory = document.getElementById('panel-category');
    const panelCustomer = document.getElementById('panel-customer');

    if (!panelTitle || !panelMeta || !panelDescription) return;

    panelTitle.textContent = ticket.title || '';
    panelMeta.textContent = `Ticket #${ticket.id} • ${formatDate(ticket.createdAt)}`;
    panelDescription.innerHTML = ticket.description ? `<p>${escapeHtml(ticket.description).replace(/\n/g, '<br>')}</p>` : '<p>No description provided.</p>';
    if (panelStatus) panelStatus.textContent = ticket.status || 'N/A';
    if (panelPriority) panelPriority.textContent = ticket.priority || 'N/A';
    if (panelCategory) panelCategory.textContent = ticket.category || 'N/A';
    if (panelCustomer) panelCustomer.textContent = `${ticket.customerName || 'Unknown'} (${ticket.customerEmail || 'No email'})`;
}

function populatePanelEditForm(ticket) {
    const titleInput = document.getElementById('panel-title-input');
    const descriptionInput = document.getElementById('panel-description-input');
    const priorityInput = document.getElementById('panel-priority-input');
    const categoryInput = document.getElementById('panel-category-input');
    const statusInput = document.getElementById('panel-status-input');
    const customerNameInput = document.getElementById('panel-customer-name-input');
    const customerEmailInput = document.getElementById('panel-customer-email-input');

    if (!titleInput || !descriptionInput || !priorityInput || !categoryInput || !statusInput || !customerNameInput || !customerEmailInput) return;

    titleInput.value = ticket.title || '';
    descriptionInput.value = ticket.description || '';
    priorityInput.value = ticket.priority || '';
    categoryInput.value = ticket.category || '';
    statusInput.value = ticket.status || 'open';
    customerNameInput.value = ticket.customerName || '';
    customerEmailInput.value = ticket.customerEmail || '';
}

function setPanelTab(activeTab) {
    const detailsTab = document.getElementById('panel-tab-details');
    const editTab = document.getElementById('panel-tab-edit');
    const viewSection = document.getElementById('panel-view');
    const editSection = document.getElementById('panel-edit');

    if (detailsTab) detailsTab.classList.toggle('active', activeTab === 'details');
    if (editTab) editTab.classList.toggle('active', activeTab === 'edit');
    if (viewSection) viewSection.hidden = activeTab !== 'details';
    if (editSection) editSection.hidden = activeTab !== 'edit';

    clearPanelValidation();
}

function showPanelView() {
    setPanelTab('details');
}

function showPanelEdit() {
    setPanelTab('edit');
}

function clearPanelValidation() {
    document.querySelectorAll('#panel-edit-form .error-message').forEach(el => {
        el.textContent = '';
        el.classList.remove('show');
    });
    document.querySelectorAll('#panel-edit-form .form-control').forEach(el => {
        el.classList.remove('error');
    });
}

async function loadPanelComments(ticketId) {
    const panelComments = document.getElementById('panel-comments');
    if (!panelComments) return;

    try {
        const response = await ticketsApi.listComments(ticketId);
        const comments = response.data || [];
        if (comments.length === 0) {
            panelComments.innerHTML = '<div class="comment-item">No comments yet.</div>';
            return;
        }

        panelComments.innerHTML = comments.map(c => `
            <div class="comment-item">
                <div class="comment-meta"><strong>${escapeHtml(c.user?.name || 'User')}</strong> • ${formatDate(c.createdAt)}</div>
                <div class="comment-body">${escapeHtml(c.body || '')}</div>
            </div>
        `).join('');
        const commentCount = document.getElementById('panel-comment-count');
        if (commentCount) commentCount.textContent = `(${comments.length})`;
    } catch (error) {
        panelComments.innerHTML = '<div class="comment-item">No comments yet.</div>';
        const commentCount = document.getElementById('panel-comment-count');
        if (commentCount) commentCount.textContent = '(0)';
    }
}

async function savePanelEdits() {
    if (!currentTicket) return;

    const form = document.getElementById('panel-edit-form');
    if (!form) return;

    clearPanelValidation();

    const updates = {
        title: document.getElementById('panel-title-input')?.value || '',
        description: document.getElementById('panel-description-input')?.value || '',
        priority: document.getElementById('panel-priority-input')?.value || '',
        category: document.getElementById('panel-category-input')?.value || '',
        status: document.getElementById('panel-status-input')?.value || 'open',
        customerName: document.getElementById('panel-customer-name-input')?.value || '',
        customerEmail: document.getElementById('panel-customer-email-input')?.value || ''
    };

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
        customerName: [
            { type: 'required', message: 'Customer name is required' }
        ],
        customerEmail: [
            { type: 'required', message: 'Customer email is required' },
            { type: 'email', message: 'Please enter a valid email address' }
        ],
        priority: [
            { type: 'required', message: 'Please select a priority' }
        ],
        category: [
            { type: 'required', message: 'Please select a category' }
        ]
    };

    const errors = validateForm(updates, validationSchema);
    if (Object.keys(errors).length > 0) {
        const mapping = {
            title: { message: 'panel-title-error', input: 'panel-title-input' },
            description: { message: 'panel-description-error', input: 'panel-description-input' },
            customerName: { message: 'panel-customer-name-error', input: 'panel-customer-name-input' },
            customerEmail: { message: 'panel-customer-email-error', input: 'panel-customer-email-input' },
            priority: { message: 'panel-priority-error', input: 'panel-priority-input' },
            category: { message: 'panel-category-error', input: 'panel-category-input' }
        };

        Object.entries(errors).forEach(([field, message]) => {
            const map = mapping[field];
            if (map) {
                const errorEl = document.getElementById(map.message);
                if (errorEl) {
                    errorEl.textContent = message;
                    errorEl.classList.add('show');
                }
                const inputEl = document.getElementById(map.input);
                if (inputEl) inputEl.classList.add('error');
            }
        });
        ui.showToast('Please fix the errors before saving');
        return;
    }

    try {
        await ticketsApi.updateTicket(currentTicket.id, updates);
        currentTicket = { ...currentTicket, ...updates };
        renderPanelView(currentTicket);
        populatePanelEditForm(currentTicket);
        showPanelView();
        ui.showToast('Ticket updated successfully!');
        refreshTickets?.();
    } catch (error) {
        ui.showToast('Failed to update ticket');
    }
}

// Side-panel functions: open/close and hash handling
function openTicketPanel(id) {
    const panel = document.getElementById('ticket-panel');
    const panelBody = document.getElementById('panel-body');
    const panelLoading = document.getElementById('panel-loading');

    if (!panel) return;
    // Save focused element to restore focus on close
    lastFocusedElement = document.activeElement;
    // Hide main content from assistive tech
    document.querySelectorAll('main, header').forEach(el => el?.setAttribute('aria-hidden', 'true'));
    // Lock body scroll
    document.body.style.overflow = 'hidden';

    panel.classList.add('open');
    panel.setAttribute('aria-hidden', 'false');
    panelLoading.style.display = 'block';
    panelBody.hidden = true;
    panel.focus();

    // Key handling for Escape and Tab focus-trap
    panelKeydownHandler = function(e) {
        if (e.key === 'Escape') {
            e.preventDefault();
            closeTicketPanel();
            return;
        }
        if (e.key === 'Tab') {
            const focusable = panel.querySelectorAll('a[href], button:not([disabled]), input, select, textarea, [tabindex]:not([tabindex="-1"])');
            if (!focusable || focusable.length === 0) return;
            const first = focusable[0];
            const last = focusable[focusable.length - 1];
            if (e.shiftKey) {
                if (document.activeElement === first) {
                    e.preventDefault();
                    last.focus();
                }
            } else {
                if (document.activeElement === last) {
                    e.preventDefault();
                    first.focus();
                }
            }
        }
    };
    document.addEventListener('keydown', panelKeydownHandler);

    // Update hash for deep-linking
    try { window.location.hash = `#/tickets/${id}`; } catch (e) {}

    ticketsApi.getTicket(id).then(async res => {
        currentTicket = res.data || res;
        renderPanelView(currentTicket);
        populatePanelEditForm(currentTicket);
        showPanelView();
        await loadPanelComments(currentTicket.id);
    }).catch(() => {
        const panelLoadingText = document.getElementById('panel-loading');
        if (panelLoadingText) panelLoadingText.textContent = 'Failed to load ticket';
    }).finally(() => {
        panelLoading.style.display = 'none';
        panelBody.hidden = false;
    });
}

// helper to escape HTML to avoid injection
function escapeHtml(str) {
    if (!str) return '';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

function closeTicketPanel() {
    const panel = document.getElementById('ticket-panel');
    if (!panel) return;
    panel.classList.remove('open');
    panel.setAttribute('aria-hidden', 'true');
    // Unlock body scroll
    document.body.style.overflow = '';
    // restore main content to assistive tech
    document.querySelectorAll('main, header').forEach(el => el?.removeAttribute('aria-hidden'));
    // remove keydown listener
    if (panelKeydownHandler) {
        document.removeEventListener('keydown', panelKeydownHandler);
        panelKeydownHandler = null;
    }
    // restore focus
    try {
        if (lastFocusedElement && typeof lastFocusedElement.focus === 'function') lastFocusedElement.focus();
    } catch (e) {}
    lastFocusedElement = null;
    // remove hash if it's a ticket hash
    if (window.location.hash.startsWith('#/tickets/')) {
        history.pushState('', document.title, window.location.pathname + window.location.search);
    }
}

// Listen for clicks on ticket links or view buttons
document.addEventListener('click', (e) => {
    const viewBtn = e.target.closest('.view-ticket');
    if (viewBtn) {
        const id = viewBtn.dataset.ticketId;
        if (id) openTicketPanel(id);
        return;
    }
    const tabDetails = e.target.closest('#panel-tab-details');
    if (tabDetails) {
        showPanelView();
        return;
    }

    const tabEdit = e.target.closest('#panel-tab-edit');
    if (tabEdit) {
        showPanelEdit();
        return;
    }

    const panelCancelEditBtn = e.target.closest('.panel-cancel-edit-btn');
    if (panelCancelEditBtn) {
        showPanelView();
        return;
    }

    const closeBtn = e.target.closest('#close-ticket-panel');
    if (closeBtn) {
        closeTicketPanel();
        return;
    }
});

document.addEventListener('submit', async (e) => {
    if (e.target.matches('#panel-add-comment-form')) {
        e.preventDefault();
        const textarea = document.getElementById('panel-comment-input');
        const commentText = textarea?.value.trim() || '';
        if (!commentText || !currentTicket) {
            ui.showToast('Please enter a comment');
            return;
        }

        try {
            await ticketsApi.addComment({
                ticketId: currentTicket.id,
                userId: 1,
                body: commentText
            });
            if (textarea) textarea.value = '';
            await loadPanelComments(currentTicket.id);
            window.dispatchEvent(new Event('dashboardRefreshRequested'));
            ui.showToast('Comment posted');
        } catch (error) {
            ui.showToast('Failed to post comment');
        }
        return;
    }

    if (e.target.matches('#panel-edit-form')) {
        e.preventDefault();
        await savePanelEdits();
        return;
    }
});

// Handle direct hash navigation to open panel on load or back/forward
window.addEventListener('hashchange', () => {
    const m = window.location.hash.match(/^#\/tickets\/(\d+)/);
    if (m && m[1]) {
        openTicketPanel(m[1]);
    } else {
        closeTicketPanel();
    }
});

// On initial load, if there's a ticket hash, open it
window.addEventListener('load', () => {
    const m = window.location.hash.match(/^#\/tickets\/(\d+)/);
    if (m && m[1]) openTicketPanel(m[1]);
});

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
