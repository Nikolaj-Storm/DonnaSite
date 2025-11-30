// Main Application Initialization
document.addEventListener('DOMContentLoaded', () => {
    // Initialize DOM element references
    AppState.initElements();
    
    // ===== AUTHENTICATION =====
    AppState.elements.loginForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const password = AppState.elements.passwordInput.value.trim();
        
        if (password === CONFIG.PASSWORD) {
            AppState.elements.loginOverlay.style.opacity = '0';
            setTimeout(() => {
                AppState.elements.loginOverlay.style.display = 'none';
            }, 300);
            
            AppState.elements.appContainer.style.display = 'flex';
            AppState.isAuthenticated = true;
            initializeApp();
        } else {
            AppState.elements.loginError.textContent = 'Forkert kode, prøv igen!';
            AppState.elements.loginForm.style.animation = 'shake 0.5s ease';
            AppState.elements.passwordInput.value = '';
            setTimeout(() => {
                AppState.elements.loginForm.style.animation = '';
                AppState.elements.loginError.textContent = '';
            }, 2000);
        }
    });
    
    // ===== MAIN APP INITIALIZATION =====
    function initializeApp() {
        // Initialize modules
        SocketManager.init();
        UI.init();
        Features.initVoice();
        Namespaces.init();
        ChatHistory.load();
        
        // Message input handlers
        AppState.elements.inputForm.addEventListener('submit', sendMessage);
        AppState.elements.messageInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                sendMessage(e);
            }
        });
        
        // Brain modal handlers
        AppState.elements.brainAcceptBtn.addEventListener('click', () => Features.acceptBrainMemory());
        AppState.elements.brainDenyBtn.addEventListener('click', () => Features.closeBrainModal());
        AppState.elements.brainCancelBtn.addEventListener('click', () => Features.closeBrainModal());
        AppState.elements.brainModalOverlay.addEventListener('click', (e) => {
            if (e.target === AppState.elements.brainModalOverlay) {
                Features.closeBrainModal();
            }
        });
        
        // Speech synthesis voice loading
        if (AppState.synthesis.onvoiceschanged !== undefined) {
            AppState.synthesis.onvoiceschanged = () => {
                console.log("Speech synthesis voices loaded");
            };
        }
    }
    
    // ===== MESSAGE SENDING =====
    async function sendMessage(e) {
        e.preventDefault();
        const text = AppState.elements.messageInput.value.trim();
        if (text === '' && AppState.attachedFiles.length === 0) return;
        
        await SocketManager.sendMessage(text);
    }
});

// ===== CHAT HISTORY MANAGEMENT =====
const ChatHistory = {
    async load() {
        try {
            const response = await fetch(`${CONFIG.SOCKET_URL}/history`);
            const chats = await response.json();
            
            AppState.elements.chatHistoryList.innerHTML = '';
            
            if (chats.length === 0) {
                this.createPlaceholder();
            } else {
                chats.forEach((chat, index) => {
                    const li = document.createElement('li');
                    li.textContent = chat.title || `Chat ${chat.id}`;
                    li.dataset.chatId = chat.id;
                    li.addEventListener('click', () => this.loadChat(chat.id));
                    
                    if (index === 0) {
                        li.classList.add('active');
                    }
                    
                    AppState.elements.chatHistoryList.appendChild(li);
                });
                
                if (chats.length > 0) {
                    this.loadChat(chats[0].id);
                }
            }
        } catch (err) {
            console.error('Failed to load chat history:', err);
            this.createPlaceholder();
        }
    },
    
    createPlaceholder() {
        const li = document.createElement('li');
        li.textContent = 'Ny chat';
        li.classList.add('active');
        li.dataset.chatId = '1';
        li.addEventListener('click', () => this.loadChat(1));
        AppState.elements.chatHistoryList.appendChild(li);
        AppState.currentChatId = 1;
    },
    
    async loadChat(chatId) {
        console.log(`Loading chat ${chatId}...`);
        
        // Update UI
        AppState.elements.chatHistoryList.querySelectorAll('li').forEach(li => {
            li.classList.toggle('active', li.dataset.chatId == chatId);
        });
        
        // Reset state
        AppState.resetChat();
        AppState.currentChatId = chatId;
        Features.updateFileAttachmentUI();
        
        try {
            const response = await fetch(`${CONFIG.SOCKET_URL}/chat/${chatId}`);
            const messages = await response.json();
            
            AppState.messageHistory = messages;
            messages.forEach((msg, idx) => UI.renderMessage(msg, idx));
        } catch (err) {
            console.error('Failed to load chat:', err);
            UI.addSystemMessage(`Chat ${chatId} loaded (empty)`);
        }
        
        // Hide sidebar on mobile
        if (window.innerWidth <= 768) {
            AppState.elements.historyPanel.classList.add('hidden');
        }
    }
};

// ===== NAMESPACE MANAGEMENT =====
const Namespaces = {
    async init() {
        try {
            const response = await fetch(`${CONFIG.SOCKET_URL}/namespaces`);
            const data = await response.json();
            AppState.availableNamespaces = data.namespaces;
            this.createMultiSelect();
        } catch (error) {
            console.error('Failed to load namespaces:', error);
            AppState.availableNamespaces = DEFAULT_NAMESPACES;
            this.createMultiSelect();
        }
    },
    
    createMultiSelect() {
        const oldSelect = document.getElementById('namespace-select');
        if (!oldSelect) return;
        
        const container = oldSelect.parentElement;
        const multiSelect = document.createElement('div');
        multiSelect.className = 'namespace-multiselect';
        multiSelect.id = 'namespace-multiselect';
        
        multiSelect.innerHTML = `
            <div class="namespace-multiselect-trigger" id="namespace-trigger">
                <span id="namespace-trigger-text">📂 Namespaces</span>
                <span class="namespace-count" id="namespace-count">1</span>
            </div>
            <div class="namespace-dropdown" id="namespace-dropdown">
                ${Object.entries(AppState.availableNamespaces).map(([key, ns]) => `
                    <div class="namespace-option ${AppState.selectedNamespaces.includes(key) ? 'selected' : ''}" 
                         data-namespace="${key}">
                        <div class="namespace-checkbox">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                <polyline points="20 6 9 17 4 12"></polyline>
                            </svg>
                        </div>
                        <div class="namespace-info">
                            <div class="namespace-name">
                                <span class="namespace-icon">${ns.icon}</span>
                                ${ns.name}
                            </div>
                            <div class="namespace-description">${ns.description}</div>
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
        
        container.replaceChild(multiSelect, oldSelect);
        this.setupListeners();
        this.updateDisplay();
    },
    
    setupListeners() {
        const trigger = document.getElementById('namespace-trigger');
        const dropdown = document.getElementById('namespace-dropdown');
        const options = dropdown.querySelectorAll('.namespace-option');
        
        trigger.addEventListener('click', (e) => {
            e.stopPropagation();
            dropdown.classList.toggle('active');
        });
        
        document.addEventListener('click', (e) => {
            if (!e.target.closest('.namespace-multiselect')) {
                dropdown.classList.remove('active');
            }
        });
        
        options.forEach(option => {
            option.addEventListener('click', (e) => {
                e.stopPropagation();
                const namespace = option.dataset.namespace;
                
                if (AppState.selectedNamespaces.includes(namespace)) {
                    if (AppState.selectedNamespaces.length > 1) {
                        AppState.selectedNamespaces = AppState.selectedNamespaces.filter(ns => ns !== namespace);
                        option.classList.remove('selected');
                    }
                } else {
                    AppState.selectedNamespaces.push(namespace);
                    option.classList.add('selected');
                }
                
                this.updateDisplay();
            });
        });
    },
    
    updateDisplay() {
        const countEl = document.getElementById('namespace-count');
        const triggerText = document.getElementById('namespace-trigger-text');
        
        if (countEl) {
            countEl.textContent = AppState.selectedNamespaces.length;
        }
        
        if (triggerText) {
            if (AppState.selectedNamespaces.length === 1) {
                const ns = AppState.availableNamespaces[AppState.selectedNamespaces[0]];
                triggerText.textContent = `${ns.icon} ${ns.name}`;
            } else if (AppState.selectedNamespaces.length === Object.keys(AppState.availableNamespaces).length) {
                triggerText.textContent = '📚 All Namespaces';
            } else {
                triggerText.textContent = '📂 Multiple';
            }
        }
        
        console.log('Selected namespaces:', AppState.selectedNamespaces);
    }
};
