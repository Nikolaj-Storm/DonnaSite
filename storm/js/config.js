// Configuration & Constants
const CONFIG = {
    BACKEND_URL: window.location.hostname === 'localhost' 
        ? 'http://localhost:10000'
        : 'https://storm-backend-wqd0.onrender.com',
    SOCKET_URL: window.location.hostname === 'localhost'
        ? 'http://localhost:10000'
        : 'https://storm-backend-wqd0.onrender.com',  // FIXED: Added missing comma here
    PASSWORD: 'hemmelig',
    DEFAULT_MODEL: 'moderate',
    BRAIN_SVG: '<svg viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/></svg>'
};

const DEFAULT_NAMESPACES = {
    'general': {
        name: 'General',
        description: 'General memories',
        icon: '📝',
        color: '#6b7280'
    }
};

// Log configuration on load for debugging
console.log('Storm Config loaded:', {
    backend: CONFIG.BACKEND_URL,
    socket: CONFIG.SOCKET_URL,
    environment: window.location.hostname === 'localhost' ? 'local' : 'production'
});
