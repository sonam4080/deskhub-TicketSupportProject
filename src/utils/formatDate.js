export const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Intl.DateTimeFormat('en-IN').format(new Date(dateString));
};

export const formatDateTime = (dateString) => {
    if (!dateString) return 'N/A';
    return new Intl.DateTimeFormat('en-IN', {
        dateStyle: 'medium',
        timeStyle: 'short'
    }).format(new Date(dateString));
};

export const formatRelative = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now - date) / 1000);

    if (diffInSeconds < 60) return 'just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    return formatDate(dateString);
};
