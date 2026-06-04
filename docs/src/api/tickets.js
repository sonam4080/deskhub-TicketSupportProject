import { client } from './client.js';

export const ticketsApi = {
    listTickets: (params = '') => client.get(`/tickets${params}`),
    getTicket: (id) => client.get(`/tickets/${id}`),
    createTicket: (ticket) => client.post('/tickets', { ...ticket, createdAt: new Date().toISOString() }),
    updateTicket: (id, updates) => client.patch(`/tickets/${id}`, updates),
    deleteTicket: (id) => client.del(`/tickets/${id}`),
    listComments: (ticketId) => client.get(`/comments?ticketId=${ticketId}&_expand=user`),
    addComment: (comment) => client.post('/comments', { ...comment, createdAt: new Date().toISOString() })
};
