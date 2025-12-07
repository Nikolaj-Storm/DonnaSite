// Socket.IO Connection & Event Management
const SocketManager = {
    init() {
        console.log("Socket.IO client initialized");
        
        try {
            AppState.socket = io(CONFIG.SOCKET_URL, {
                transports: ['websocket', 'polling'],
                reconnection: true,
                reconnectionDelay: 1000,
                reconnectionDelayMax: 5000,
                reconnectionAttempts: 5
            });
            
            this.setupListeners();
        } catch (err) {
            console.error("Socket.IO connection failed:", err);
            UI.addSystemMessage("Could not connect to server");
        }
    },
    
    setupListeners() {
        const socket = AppState.socket;
        
        socket.on('connect', () => {
            console.log('✅ Connected to socket server');
            UI.addSystemMessage('Connected to Storm backend');
        });
        
        socket.on('disconnect', () => {
            console.log('Disconnected from socket server');
            UI.addSystemMessage('Disconnected from server');
        });
        
        socket.on('response', (data) => {
            if (data.error) {
                UI.addSystemMessage(`Error: ${data.error}`);
                return;
            }
            
            const answer = data.response || data.answer || '';
            const modelUsed = data.model_used || 'Unknown';
            
            AppState.messageHistory.push({
                role: 'assistant',
                content: answer
            });
            
            UI.renderMessage(
                { role: 'assistant', content: answer },
                AppState.messageHistory.length - 1
            );
            
            // Show model indicator
            const lastMessage = AppState.elements.messageList.lastElementChild;
            if (lastMessage) {
                const indicator = document.createElement('div');
                indicator.style.cssText = 'font-size: 0.75rem; color: #999; margin-top: 0.5rem; font-style: italic;';
                indicator.textContent = `via ${modelUsed}`;
                lastMessage.querySelector('.message').appendChild(indicator);
            }
            
            // Handle memory suggestions
            if (data.memory_suggestions && data.memory_suggestions.length > 0) {
                Features.showMemorySuggestions(data.memory_suggestions);
            }
            
            // Handle topic suggestion
            if (data.topic_suggestion && data.topic_suggestion.topic) {
                Features.showTopicSuggestion(data.topic_suggestion);
            }
            
            // Speak response if voice was used
            if (AppState.isListening) {
                Features.speakText(answer);
            }
        });
        
        socket.on('brain_response', (data) => {
            if (data.error) {
                AppState.elements.brainModalStatus.textContent = data.error;
                AppState.elements.brainRefinedText.value = '';
                AppState.elements.brainRefinedText.disabled = true;
                return;
            }
            
            AppState.elements.brainModalStatus.textContent = 'AI refined the memory. Edit if needed:';
            AppState.elements.brainRefinedText.value = data.refined_text;
            AppState.elements.brainRefinedText.disabled = false;
        });
        
        socket.on('brain_saved', (data) => {
            if (data.success) {
                if (AppState.currentBrainIconElement) {
                    AppState.currentBrainIconElement.classList.add('saved');
                }
                Features.closeBrainModal();
                UI.addSystemMessage('Memory saved to knowledge base!');
            } else {
                AppState.elements.brainModalStatus.textContent = 'Failed to save memory';
            }
        });
    },
    
    async sendMessage(text) {
        const messageInput = AppState.elements.messageInput;
        
        if (!text && AppState.attachedFiles.length === 0) {
            return;
        }
        
        // Build message content
        let messageContent = text;
        const images = [];
        
        // Handle file attachments
        if (AppState.attachedFiles.length > 0) {
            messageContent += '\n\n**Attached files:**\n';
            
            for (const fileData of AppState.attachedFiles) {
                if (fileData.type.startsWith('image/')) {
                    // Add image to images array for vision API
                    images.push({
                        data: fileData.content.split(',')[1], // Remove data:image/...;base64,
                        media_type: fileData.type
                    });
                } else {
                    messageContent += `\n📎 ${fileData.name}\n`;
                    if (fileData.content) {
                        messageContent += `\n\`\`\`${fileData.language || ''}\n${fileData.content}\n\`\`\`\n`;
                    }
                }
            }
        }
        
        // Add to history
        AppState.messageHistory.push({
            role: 'user',
            content: messageContent
        });
        
        // Render message
        UI.renderMessage(
            { role: 'user', content: messageContent },
            AppState.messageHistory.length - 1
        );
        
        // Clear input
        messageInput.value = '';
        AppState.attachedFiles = [];
        Features.updateFileAttachmentUI();
        
        // Send to server
        const payload = {
            messages: AppState.messageHistory,
            namespaces: AppState.selectedNamespaces,
            force_model: AppState.elements.modelSelect.value
        };
        
        // Add images if any
        if (images.length > 0) {
            payload.images = images;
        }
        
        // Add GitHub repo context if attached
        if (AppState.currentGithubRepo) {
            payload.github_repo_id = AppState.currentGithubRepo.id;
        }
        
        if (AppState.socket && AppState.socket.connected) {
            AppState.socket.emit('message', payload);
        } else {
            UI.addSystemMessage('Not connected to server. Reconnecting...');
            this.init();
        }
    }
};

console.log('✅ Socket module loaded');
