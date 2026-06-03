import { ticketsApi } from '../api/tickets.js';
import { formatDateTime } from '../utils/formatDate.js';
import { ui } from './ui.js';

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
                    <h3>Actions</h3>
                    <div class="form-group" style="margin-top: 0.5rem;">
                        <label>Update Status</label>
                        <select id="update-status" class="form-control">
                            <option value="open" ${ticket.status === 'open' ? 'selected' : ''}>Open</option>
                            <option value="in-progress" ${ticket.status === 'in-progress' ? 'selected' : ''}>In Progress</option>
                            <option value="resolved" ${ticket.status === 'resolved' ? 'selected' : ''}>Resolved</option>
                        </select>
                    </div>
                </div>
            </div>
        </div>
    `;
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
    const statusSelect = document.getElementById('update-status');
    statusSelect?.addEventListener('change', async (e) => {
        try {
            await ticketsApi.updateTicket(ticketId, { status: e.target.value });
            ui.showToast('Status updated successfully');
        } catch (error) {
            ui.showToast('Failed to update status');
        }
    });

    const commentForm = document.getElementById('comment-form');
    commentForm?.addEventListener('submit', async (e) => {
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
