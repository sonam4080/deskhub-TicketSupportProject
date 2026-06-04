import { ticketsApi } from '../api/tickets.js';
import { formatDateTime } from '../utils/formatDate.js';
import { ui } from './ui.js';
import { validateForm } from './form.js';

export async function initTicketDetail() {
    const urlParams = new URLSearchParams(window.location.search);
    const ticketId = urlParams.get('id');

    if (!ticketId) {
        window.location.href = 'tickets.html';
        return;
    }

    try {
        const [ticketRes, commentsRes] = await Promise.all([
            ticketsApi.getTicket(ticketId),
            ticketsApi.listComments(ticketId)
        ]);

        window.currentTicket = ticketRes.data; // Store ticket data globally for edit mode
        renderTicket(ticketRes.data);
        renderComments(commentsRes.data);
        setupDetailActions(ticketId);
    } catch (error) {
        ui.showToast('Failed to load ticket details');
    }
}

function renderTicket(ticket) {
    const container = document.getElementById('ticket-detail-container');
    if (!container) return;

    const isEditMode = container.dataset.editMode === 'true';

    if (isEditMode) {
        container.innerHTML = `
            <div class="card">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem;">
                    <h2>Edit Ticket #${ticket.id}</h2>
                    <button class="btn btn-sm" id="cancel-edit" style="background: var(--secondary-color); color: white;">Cancel</button>
                </div>
                <form id="edit-ticket-form">
                    <div class="form-group">
                        <label>Title</label>
                        <input type="text" id="edit-title" class="form-control" value="${ticket.title}">
                        <div class="error-message" id="edit-title-error"></div>
                    </div>
                    <div class="form-group">
                        <label>Description</label>
                        <textarea id="edit-description" class="form-control" rows="4">${ticket.description}</textarea>
                        <div class="error-message" id="edit-description-error"></div>
                    </div>
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
                        <div class="form-group">
                            <label>Priority</label>
                            <select id="edit-priority" class="form-control">
                                <option value="low" ${ticket.priority === 'low' ? 'selected' : ''}>Low</option>
                                <option value="medium" ${ticket.priority === 'medium' ? 'selected' : ''}>Medium</option>
                                <option value="high" ${ticket.priority === 'high' ? 'selected' : ''}>High</option>
                                <option value="urgent" ${ticket.priority === 'urgent' ? 'selected' : ''}>Urgent</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label>Category</label>
                            <select id="edit-category" class="form-control">
                                <option value="technical" ${ticket.category === 'technical' ? 'selected' : ''}>Technical</option>
                                <option value="billing" ${ticket.category === 'billing' ? 'selected' : ''}>Billing</option>
                                <option value="feature" ${ticket.category === 'feature' ? 'selected' : ''}>Feature Request</option>
                                <option value="other" ${ticket.category === 'other' ? 'selected' : ''}>Other</option>
                            </select>
                        </div>
                    </div>
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
                        <div class="form-group">
                            <label>Status</label>
                            <select id="edit-status" class="form-control">
                                <option value="open" ${ticket.status === 'open' ? 'selected' : ''}>Open</option>
                                <option value="in-progress" ${ticket.status === 'in-progress' ? 'selected' : ''}>In Progress</option>
                                <option value="resolved" ${ticket.status === 'resolved' ? 'selected' : ''}>Resolved</option>
                            </select>
                        </div>
                    </div>
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
                        <div class="form-group">
                            <label>Customer Name</label>
                            <input type="text" id="edit-customer-name" class="form-control" value="${ticket.customerName}">
                            <div class="error-message" id="edit-customer-name-error"></div>
                        </div>
                        <div class="form-group">
                            <label>Customer Email</label>
                            <input type="text" id="edit-customer-email" class="form-control" value="${ticket.customerEmail}">
                            <div class="error-message" id="edit-customer-email-error"></div>
                        </div>
                    </div>
                    <div style="display: flex; gap: 1rem; margin-top: 2rem; justify-content: flex-end;">
                        <button type="submit" class="btn btn-primary" style="width: auto;">Save Changes</button>
                        <button type="button" class="btn" id="cancel-edit-btn" style="background: var(--secondary-color); color: white; width: auto;">Cancel</button>
                    </div>
                </form>
            </div>
        `;
    } else {
        container.innerHTML = `
            <div class="card">
                <div style="display: flex; justify-content: space-between; align-items: flex-start;">
                    <div>
                        <h1>${ticket.title}</h1>
                        <p style="color: var(--secondary-color)">Ticket #${ticket.id} • Created on ${formatDateTime(ticket.createdAt)}</p>
                    </div>
                    <div style="display: flex; gap: 0.5rem;">
                        <span class="badge badge-${ticket.priority}">${ticket.priority}</span>
                        <span class="badge badge-${ticket.status.replace(' ', '-')}">${ticket.status}</span>
                    </div>
                </div>
                <button class="btn btn-primary" id="edit-ticket-btn" style="width: auto; margin-top: 1rem; margin-bottom: 1rem;">Edit Ticket</button>
                <hr style="margin: 1.5rem 0; border: 0; border-top: 1px solid var(--border-color);">
                <div style="margin-bottom: 2rem;">
                    <h3>Description</h3>
                    <p style="margin-top: 0.5rem;">${ticket.description}</p>
                </div>
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 2rem;">
                    <div>
                        <h3>Customer Information</h3>
                        <p style="margin-top: 0.5rem;"><strong>Name:</strong> ${ticket.customerName}</p>
                        <p><strong>Email:</strong> ${ticket.customerEmail}</p>
                    </div>
                    <div>
                        <h3>Ticket Information</h3>
                        <p style="margin-top: 0.5rem;"><strong>Priority:</strong> ${ticket.priority}</p>
                        <p><strong>Category:</strong> ${ticket.category}</p>
                        <p><strong>Status:</strong> ${ticket.status}</p>
                    </div>
                </div>
            </div>
        `;
    }
    container.dataset.editMode = isEditMode;
}

function renderComments(comments) {
    const container = document.getElementById('comments-container');
    if (!container) return;

    if (comments.length === 0) {
        container.innerHTML = '<p style="color: var(--secondary-color)">No comments yet.</p>';
    } else {
        container.innerHTML = comments.map(c => `
            <div style="background: white; padding: 1rem; border-radius: 0.5rem; border: 1px solid var(--border-color); margin-bottom: 1rem;">
                <div style="display: flex; justify-content: space-between; margin-bottom: 0.5rem;">
                    <strong>${c.user?.name || 'Unknown User'}</strong>
                    <span style="font-size: 0.875rem; color: var(--secondary-color)">${formatDateTime(c.createdAt)}</span>
                </div>
                <p>${c.text}</p>
            </div>
        `).join('');
    }
}

function setupDetailActions(ticketId) {
    const container = document.getElementById('ticket-detail-container');
    const editBtn = document.getElementById('edit-ticket-btn');
    const cancelEditBtn = document.getElementById('cancel-edit-btn');
    const cancelEditTopBtn = document.getElementById('cancel-edit');
    const editForm = document.getElementById('edit-ticket-form');

    // Toggle edit mode
    editBtn?.addEventListener('click', () => {
        container.dataset.editMode = 'true';
        renderTicket(window.currentTicket);
        setupDetailActions(ticketId);
    });

    cancelEditBtn?.addEventListener('click', () => {
        container.dataset.editMode = 'false';
        renderTicket(window.currentTicket);
        setupDetailActions(ticketId);
    });

    cancelEditTopBtn?.addEventListener('click', () => {
        container.dataset.editMode = 'false';
        renderTicket(window.currentTicket);
        setupDetailActions(ticketId);
    });

    // Handle form submission
    editForm?.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        // Clear previous errors and error styling
        document.querySelectorAll('[id^="edit-"]').filter(el => el.id.endsWith('-error')).forEach(el => {
            el.textContent = '';
            el.classList.remove('show');
        });
        document.querySelectorAll('#edit-ticket-form .form-control').forEach(el => {
            el.classList.remove('error');
        });
        
        const formData = {
            title: document.getElementById('edit-title').value,
            description: document.getElementById('edit-description').value,
            customerName: document.getElementById('edit-customer-name').value,
            customerEmail: document.getElementById('edit-customer-email').value
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
                title: { message: 'edit-title-error', input: 'edit-title' },
                description: { message: 'edit-description-error', input: 'edit-description' },
                customerName: { message: 'edit-customer-name-error', input: 'edit-customer-name' },
                customerEmail: { message: 'edit-customer-email-error', input: 'edit-customer-email' }
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

        const updates = {
            title: formData.title,
            description: formData.description,
            priority: document.getElementById('edit-priority').value,
            category: document.getElementById('edit-category').value,
            status: document.getElementById('edit-status').value,
            customerName: formData.customerName,
            customerEmail: formData.customerEmail
        };

        try {
            await ticketsApi.updateTicket(ticketId, updates);
            ui.showToast('Ticket updated successfully!');
            window.currentTicket = { ...window.currentTicket, ...updates };
            container.dataset.editMode = 'false';
            renderTicket(window.currentTicket);
            setupDetailActions(ticketId);
        } catch (error) {
            ui.showToast('Failed to update ticket');
        }
    });

    // Remove error styling when user starts typing
    ['edit-title', 'edit-description', 'edit-customer-name', 'edit-customer-email'].forEach(fieldId => {
        document.getElementById(fieldId)?.addEventListener('input', function() {
            this.classList.remove('error');
        });
    });

    const commentForm = document.getElementById('comment-form');
    if (commentForm) {
        // Clone to remove all old event listeners
        const newCommentForm = commentForm.cloneNode(true);
        commentForm.parentNode.replaceChild(newCommentForm, commentForm);
        
        newCommentForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const text = document.getElementById('comment-text').value;
            if (!text) return;

            try {
                await ticketsApi.addComment({
                    ticketId: parseInt(ticketId),
                    userId: 1, // Current user ID (mocked)
                    text
                });
                document.getElementById('comment-text').value = '';
                initTicketDetail(); // Reload
                ui.showToast('Comment added');
            } catch (error) {
                ui.showToast('Failed to add comment');
            }
        });
    }
}
