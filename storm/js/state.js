// Global Application State
const AppState = {
    // Authentication
    isAuthenticated: false,
    
    // Socket connection
    socket: null,
    
    // Chat state
    messageHistory: [],
    currentChatId: null,
    attachedFiles: [],
    
    // Namespace state
    selectedNamespaces: ['general'],
    availableNamespaces: {},
    
    // Brain memory state
    currentBrainMessageIndex: null,
    currentBrainIconElement: null,
    
    // Voice state
    isListening: false,
    recognition: null,
    synthesis: window.speechSynthesis,
    
    // DOM Elements (cached for performance)
    elements: {},
    
    // Initialize DOM element references
    initElements() {
        this.elements = {
            // Auth
            loginOverlay: document.getElementById('login-overlay'),
            loginForm: document.getElementById('login-form'),
            passwordInput: document.getElementById('password-input'),
            loginError: document.getElementById('login-error'),
            
            // Main container
            appContainer: document.getElementById('app-container'),
            
            // History panel
            historyPanel: document.getElementById('history-panel'),
            historyToggle: document.getElementById('history-toggle'),
            chatHistoryList: document.getElementById('chat-history-list'),
            sidebarOverlay: document.getElementById('sidebar-overlay'),
            
            // Chat interface
            messageList: document.getElementById('message-list'),
            inputForm: document.getElementById('input-area-form'),
            messageInput: document.getElementById('message-input'),
            chatTopic: document.getElementById('chat-topic'),
            modelSelect: document.getElementById('model-select'),
            
            // File upload
            uploadBtn: document.getElementById('upload-btn'),
            uploadBtnMobile: document.getElementById('upload-btn-mobile'),
            fileInput: document.getElementById('file-input'),
            
            // Voice
            micBtn: document.getElementById('mic-btn'),
            micBtnMobile: document.getElementById('mic-btn-mobile'),
            
            // Brain modal
            brainModalOverlay: document.getElementById('brain-modal-overlay'),
            brainModalStatus: document.getElementById('brain-modal-status'),
            brainRefinedText: document.getElementById('brain-refined-text'),
            brainAcceptBtn: document.getElementById('brain-accept-btn'),
            brainDenyBtn: document.getElementById('brain-deny-btn'),
            brainCancelBtn: document.getElementById('brain-cancel-btn')
        };
    },
    
    // Reset state for new chat
    resetChat() {
        this.messageHistory = [];
        this.attachedFiles = [];
        this.elements.messageList.innerHTML = '';
        
    }
    const State = {
    messages: [],
    currentChatId: null,
    currentGithubRepo: null,  // NEW: Track attached repo
    isListening: false,
    isProcessing: false
};
};

console.log('✅ State module loaded');
