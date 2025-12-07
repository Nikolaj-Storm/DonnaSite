// storm/js/socket.js

const CONFIG = {
    SOCKET_URL: window.STORM_SOCKET_URL || 'https://donnaai.dk',
    DEFAULT_MODEL: 'gpt-4o-mini'
};

const AppState = {
    socket: null,
    isConnected: false,
    isProcessing: false,
    messageHistory: [],
    selectedNamespaces: ['general'],
    attachedFiles: [],
    currentGithubRepo: null, // ensure this exists if you use it elsewhere
    elements: {},
};

const UI = {
    init() {
        AppState.elements = {
            messageList: document.getElementById('message-list'),
            messageInput: document.getElementById('message-input'),
            sendButton: document.getElementById('send-button'),
            modelSelect: document.getElementById('model-select'),
            namespaceSelect: document.getElementById('namespace-select'),
            statusIndicator: document.getElementById('status-indicator'),
            fileInput: document.getElementById('file-input'),
            fileList: document.getElementById('file-list'),
        };

        this.setupEventListeners();
    },

    setupEventListeners() {
        const { messageInput, sendButton } = AppState.elements;

        if (sendButton) {
            sendButton.addEventListener('click', () => {
                SocketManager.sendMessage(messageInput.value.trim());
            });
        }

        if (messageInput) {
            messageInput.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    SocketManager.sendMessage(messageInput.value.trim());
                }
            });
        }
    },

    setStatus(text) {
        if (AppState.elements.statusIndicator) {
            AppState.elements.statusIndicator.textContent = text;
        }
    },

    addSystemMessage(text) {
        const messageList = AppState.elements.messageList;
        if (!messageList) return;

        const li = document.createElement('li');
        li.className = 'system-message';
        li.textContent = text;
        messageList.appendChild(li);
        messageList.scrollTop = messageList.scrollHeight;
    },

    renderMessage(message, index) {
        const messageList = AppState.elements.messageList;
        if (!messageList) return;

        const li = document.createElement('li');
        li.className = message.role === 'user' ? 'user-message' : 'assistant-message';

        const wrapper = document.createElement('div');
        wrapper.className = 'message-wrapper';

        const content = document.createElement('div');
        content.className = 'message-content';
        content.innerHTML = marked.parse(message.content || '');

        wrapper.appendChild(content);
        li.appendChild(wrapper);
        messageList.appendChild(li);
        messageList.scrollTop = messageList.scrollHeight;
    }
};

const Features = {
    updateFileAttachmentUI() {
        const fileList = AppState.elements.fileList;
        if (!fileList) return;

        fileList.innerHTML = '';

        for (const fileData of AppState.attachedFiles) {
            const li = document.createElement('li');
            li.textContent = `${fileData.name} (${fileData.type})`;
            fileList.appendChild(li);
        }
    },

    showTypingIndicator(modelName) {
        const messageList = AppState.elements.messageList;
        if (!messageList) return;

        const indicator = document.createElement('div');
        indicator.className = 'typing-indicator';
        indicator.textContent = `via ${modelName}`;

        const lastMessage = messageList.lastElementChild;
        if (lastMessage?.querySelector('.assistant-message')) {
            lastMessage.querySelector('.message-wrapper').appendChild(indicator);
        }
    }
};

const SocketManager = {
    init() {
        console.log("Connecting to:", CONFIG.SOCKET_URL);

        try {
            AppState.socket = io(CONFIG.SOCKET_URL, {
                transports: ['websocket', 'polling'],
                reconnection: true,
                reconnectionDelay: 1000,
                reconnectionDelayMax: 5000,
                reconnectionAttempts: 5
            });

            this.setupListeners();
            console.log("Socket.IO client initialized");
        } catch (err) {
            console.error("Socket.IO connection failed:", err);
            UI.addSystemMessage("Kunne ikke oprette forbindelse til serveren.");
        }
    },

    setupListeners() {
        const socket = AppState.socket;
        if (!socket) return;

        socket.on('connect', () => {
            AppState.isConnected = true;
            UI.setStatus('Forbundet');
        });

        socket.on('disconnect', () => {
            AppState.isConnected = false;
            UI.setStatus('Afbrudt');
        });

        socket.on('response', (data) => {
            if (data.error) {
                UI.addSystemMessage(`Error: ${data.error}`);
                AppState.isProcessing = false;
                return;
            }

            const assistantMessage = {
                role: 'assistant',
                content: data.content || ''
            };

            AppState.messageHistory.push(assistantMessage);
            UI.renderMessage(assistantMessage, AppState.messageHistory.length - 1);
            AppState.isProcessing = false;
        });
    },

    async sendMessage(text) {
        if (!text || AppState.isProcessing) return;

        // Build message with file attachments
        let messageContent = text;

        if (AppState.attachedFiles.length > 0) {
            messageContent += '\n\n**Attached files:**\n';

            for (const fileData of AppState.attachedFiles) {
                messageContent += `\n📎 ${fileData.name} (${fileData.type})\n`;

                if (fileData.content) {
                    if (fileData.type.startsWith('text/') ||
                        fileData.name.match(/\.(py|js|html|css|json)$/)) {
                        messageContent += `\n\`\`\`${fileData.language || ''}\n${fileData.content}\n\`\`\`\n`;
                    } else if (fileData.type === 'application/pdf') {
                        messageContent += `\nPDF Content:\n${fileData.content}\n`;
                    } else if (fileData.type.startsWith('image/')) {
                        messageContent += `\n[Image: ${fileData.name}]\n`;
                        messageContent += `\nImage data (base64): ${fileData.content.substring(0, 100)}...\n`;
                    }
                }
            }
        }

        // Add to history
        const userMessage
