import { client } from './client.js';

const PRIORITY_RANK = {
    urgent: 4,
    high: 3,
    medium: 2,
    low: 1
};

const STATUS_RANK = {
    open: 3,
    'in-progress': 2,
    resolved: 1
};

function addRankFields(ticket) {
    const payload = { ...ticket };
    if ('priority' in payload) {
        payload.priorityRank = PRIORITY_RANK[payload.priority] ?? 0;
    }
    if ('status' in payload) {
        payload.statusRank = STATUS_RANK[payload.status] ?? 0;
    }
    return payload;
}

export const ticketsApi = {
    listTickets: (params = '') => client.get(`/tickets${params}`),
    getTicket: (id) => client.get(`/tickets/${id}`),
    createTicket: (ticket) => client.post('/tickets', addRankFields({ ...ticket, createdAt: new Date().toISOString() })),
    updateTicket: (id, updates) => client.patch(`/tickets/${id}`, addRankFields(updates)),
    deleteTicket: (id) => client.del(`/tickets/${id}`),
    listComments: (ticketId) => client.get(`/comments?ticketId=${ticketId}&_expand=user`),
    listAllComments: () => client.get('/comments?_expand=user'),
    addComment: (comment) => client.post('/comments', { ...comment, createdAt: new Date().toISOString() })
};
