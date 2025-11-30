// Socket.IO Connection & Event Handlers
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
        
        // Connection events
        socket.on('connect', () => {
            console.log('✅ Connected to socket server');
            UI.addSystemMessage("Tilsluttet serveren.");
        });
        
        socket.on('disconnect', (reason) => {
            console.log('❌ Disconnected:', reason);
            UI.addSystemMessage("Forbindelse afbrudt. Forsøger at genoprette...");
        });
        
        socket.on('connect_error', (error) => {
            console.error('Connection error:', error);
            UI.addSystemMessage("Forbindelsesfejl. Tjekker server...");
        });
        
        socket.on('reconnect', (attemptNumber) => {
            console.log('Reconnected after', attemptNumber, 'attempts');
            UI.addSystemMessage("Genoprette forbindelse!");
        });
        
        // Message response
        socket.on('response', (data) => {
            if (data.error) {
                UI.addSystemMessage(`Error: ${data.error}`);
                return;
            }
            
            const msg = { 
                role: "assistant", 
                content: data.answer || data.response 
            };
            AppState.messageHistory.push(msg);
            UI.renderMessage(msg, AppState.messageHistory.length - 1);
            Features.speakText(data.response);
            
            // Show model used indicator
            this.showModelIndicator(data.model_used);
            
            // Memory suggestions
            if (data.memory_suggestions?.length > 0) {
                Features.showMemorySuggestions(data.memory_suggestions);
            }
            
            // Topic suggestions
            if (data.topic_suggestion?.confidence > 0.75) {
                Features.showTopicSuggestion(data.topic_suggestion);
            }
        });
        
        // Brain memory events
        socket.on('brain_response', (data) => {
            if (data.error) {
                AppState.elements.brainModalStatus.textContent = 'Error: ' + data.error;
                return;
            }
            AppState.elements.brainModalStatus.textContent = 'Review the refined memory below:';
            AppState.elements.brainRefinedText.value = data.refined_text;
            AppState.elements.brainRefinedText.disabled = false;
        });
        
        socket.on('brain_saved', (data) => {
            if (data.success && AppState.currentBrainIconElement) {
                AppState.currentBrainIconElement.classList.add('saved');
                Features.closeBrainModal();
                const chunkMsg = data.chunks_saved > 1 
                    ? ` (${data.chunks_saved} chunks)` 
                    : '';
                UI.addSystemMessage('Memory saved to knowledge base!' + chunkMsg);
            } else {
                AppState.elements.brainModalStatus.textContent = 'Failed to save: ' + (data.error || 'Unknown error');
            }
        });
    },
    
    showModelIndicator(modelUsed) {
        const modelSelect = AppState.elements.modelSelect;
        if (modelSelect?.value === 'auto' && modelUsed) {
            const modelNames = {
                'simple': '⚡ Flash',
                'moderate': '⚖️ Haiku', 
                'complex': '🧠 Sonnet'
            };
            const modelName = modelNames[modelUsed] || modelUsed;
            
            const indicator = document.createElement('div');
            indicator.style.cssText = `
                font-size: 0.75rem; color: #6b7280; 
                text-align: right; margin-top: 0.25rem;
                font-style: italic;
            `;
            indicator.textContent = `via ${modelName}`;
            
            const lastMessage = AppState.elements.messageList.lastElementChild;
            if (lastMessage?.querySelector('.assistant-message')) {
                lastMessage.querySelector('.message-wrapper').appendChild(indicator);
            }
        }
    },
    
    async sendMessage(text) {
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
        const userMessage = { role: 'user', content: messageContent };
        AppState.messageHistory.push(userMessage);
        UI.renderMessage(userMessage, AppState.messageHistory.length - 1);
        
        // Clear input
        AppState.elements.messageInput.value = '';
        AppState.elements.messageInput.style.height = 'auto';
        AppState.attachedFiles = [];
        Features.updateFileAttachmentUI();
        
        // Check connection
        if (!AppState.socket?.connected) {
            UI.addSystemMessage("Forbinder til serveren...");
            AppState.socket?.connect();
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            if (!AppState.socket?.connected) {
                UI.addSystemMessage("Kunne ikke oprette forbindelse. Tjek internetforbindelse.");
                return;
            }
        }
        
        // Send message
        const modelSelect = AppState.elements.modelSelect;
        const selectedModel = modelSelect?.value || CONFIG.DEFAULT_MODEL;
        
        AppState.socket.emit('message', { 
            messages: AppState.messageHistory, 
            namespaces: AppState.selectedNamespaces,
            force_model: selectedModel
        });
        
        UI.addSystemMessage("Sender besked...");
    }
};

console.log('✅ Socket module loaded');
