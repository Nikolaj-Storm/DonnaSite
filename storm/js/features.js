// Chat Features: Voice, Files, Brain Memory, Namespaces
const Features = {
    // ===== VOICE RECOGNITION =====
    initVoice() {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SpeechRecognition) {
            console.error("Speech Recognition not supported");
            AppState.elements.micBtn.disabled = true;
            AppState.elements.micBtnMobile.disabled = true;
            return;
        }
        
        AppState.recognition = new SpeechRecognition();
        AppState.recognition.continuous = true;
        AppState.recognition.interimResults = false;
        AppState.recognition.lang = 'en-US';
        
        AppState.recognition.onresult = (event) => {
            const speech = event.results[event.results.length - 1][0].transcript;
            
            if (speech.toLowerCase().includes('stop listening')) {
                this.stopListening();
                return;
            }
            
            AppState.messageHistory.push({ role: "user", content: speech });
            UI.renderMessage({ role: "user", content: speech }, AppState.messageHistory.length - 1);
            
            if (AppState.socket?.connected) {
                AppState.socket.emit('message', { 
                    messages: AppState.messageHistory, 
                    namespaces: AppState.selectedNamespaces
                });
            }
        };
        
        AppState.recognition.onend = () => {
            if (AppState.isListening) {
                try {
                    AppState.recognition.start();
                } catch (err) {
                    console.log("Recognition restart failed:", err);
                    this.stopListening();
                }
            }
        };
        
        AppState.recognition.onerror = (event) => {
            console.error("Speech recognition error:", event.error);
            if (event.error !== 'no-speech' && event.error !== 'aborted') {
                this.stopListening();
                UI.addSystemMessage("Talegenkendelse fejl: " + event.error);
            }
        };
    },
    
    toggleVoice() {
        if (!AppState.recognition) return;
        
        if (AppState.isListening) {
            this.stopListening();
        } else {
            try {
                AppState.recognition.start();
                AppState.isListening = true;
                AppState.elements.micBtn.classList.add('active');
                AppState.elements.micBtnMobile.classList.add('active');
            } catch (err) {
                console.error("Error starting recognition:", err);
                UI.addSystemMessage("Kunne ikke starte talegenkendelse.");
            }
        }
    },
    
    stopListening() {
        AppState.recognition?.stop();
        AppState.isListening = false;
        AppState.elements.micBtn.classList.remove('active');
        AppState.elements.micBtnMobile.classList.remove('active');
    },
    
    speakText(text) {
        AppState.synthesis.cancel();
        
        const cleanText = text
            .replace(/```[\s\S]*?```/g, "kodeblok.")
            .replace(/\*\*/g, '')
            .replace(/\*/g, '')
            .replace(/\[([^\]]+)\]\([^\)]+\)/g, '$1');
        
        const utterance = new SpeechSynthesisUtterance(cleanText);
        utterance.lang = 'en-US';
        
        const voices = AppState.synthesis.getVoices();
        const preferredVoice = voices.find(voice => voice.lang === 'en-US');
        if (preferredVoice) utterance.voice = preferredVoice;
        
        AppState.synthesis.speak(utterance);
    },
    
    // ===== FILE HANDLING =====
    async handleFileSelection(event) {
        const files = event.target.files;
        if (!files?.length) return;
        
        for (let file of files) {
            const fileData = {
                name: file.name,
                type: file.type,
                size: file.size,
                content: null,
                language: this.detectLanguage(file.name)
            };
            
            try {
                if (file.type.startsWith('text/') || file.name.match(/\.(py|js|html|css|json|txt|md)$/)) {
                    fileData.content = await this.readTextFile(file);
                } else if (file.type === 'application/pdf') {
                    UI.addSystemMessage(`Processing PDF: ${file.name}...`);
                    fileData.content = await this.readPDFFile(file);
                } else if (file.type.startsWith('image/')) {
                    fileData.content = await this.readImageFile(file);
                } else {
                    fileData.content = await this.readTextFile(file);
                }
                
                AppState.attachedFiles.push(fileData);
                UI.addSystemMessage(`File attached: ${file.name}`);
            } catch (error) {
                console.error(`Error reading file ${file.name}:`, error);
                UI.addSystemMessage(`Failed to read file: ${file.name}`);
            }
        }
        
        this.updateFileAttachmentUI();
        AppState.elements.fileInput.value = null;
    },
    
    detectLanguage(filename) {
        const ext = filename.split('.').pop().toLowerCase();
        const map = {
            py: 'python', js: 'javascript', html: 'html', css: 'css',
            json: 'json', txt: 'plaintext', md: 'markdown', java: 'java',
            cpp: 'cpp', c: 'c', rs: 'rust', go: 'go', php: 'php',
            rb: 'ruby', ts: 'typescript'
        };
        return map[ext] || 'plaintext';
    },
    
    readTextFile(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => resolve(e.target.result);
            reader.onerror = reject;
            reader.readAsText(file);
        });
    },
    
    readImageFile(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => resolve(e.target.result);
            reader.onerror = reject;
            reader.readAsDataURL(file);
        });
    },
    
    readPDFFile(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                const base64 = e.target.result.split(',')[1];
                resolve(`[PDF file - ${file.size} bytes - base64: ${base64.substring(0, 100)}...]`);
            };
            reader.onerror = reject;
            reader.readAsDataURL(file);
        });
    },
    
    updateFileAttachmentUI() {
        let indicator = document.getElementById('file-indicator');
        
        if (AppState.attachedFiles.length > 0) {
            if (!indicator) {
                indicator = document.createElement('div');
                indicator.id = 'file-indicator';
                indicator.style.cssText = `
                    padding: 0.5rem; background: rgba(35, 166, 213, 0.2);
                    border-radius: 0.5rem; margin-bottom: 0.5rem;
                    font-size: 0.9rem; color: #333;
                `;
                AppState.elements.inputForm.insertBefore(indicator, AppState.elements.inputForm.firstChild);
            }
            
            indicator.innerHTML = `
                <strong>📎 Attached files (${AppState.attachedFiles.length}):</strong><br>
                ${AppState.attachedFiles.map((f, i) => `
                    <span style="display: inline-block; margin: 0.25rem 0.5rem 0.25rem 0; 
                                 padding: 0.25rem 0.5rem; background: rgba(255,255,255,0.7); 
                                 border-radius: 0.25rem;">
                        ${f.name}
                        <button type="button" onclick="Features.removeAttachment(${i})" 
                                style="margin-left: 0.5rem; padding: 0 0.25rem; background: none; 
                                       border: none; color: #e63946; cursor: pointer; font-weight: bold;">×</button>
                    </span>
                `).join('')}
            `;
        } else if (indicator) {
            indicator.remove();
        }
    },
    
    removeAttachment(index) {
        AppState.attachedFiles.splice(index, 1);
        this.updateFileAttachmentUI();
        UI.addSystemMessage('File removed from attachments');
    },
    
    // ===== BRAIN MEMORY =====
    openBrainModal(messageIndex, iconElement) {
        AppState.currentBrainMessageIndex = messageIndex;
        AppState.currentBrainIconElement = iconElement;
        
        AppState.elements.brainModalOverlay.classList.add('active');
        AppState.elements.brainModalStatus.textContent = 'Processing with AI...';
        AppState.elements.brainRefinedText.value = '';
        AppState.elements.brainRefinedText.disabled = true;
        
        const message = AppState.messageHistory[messageIndex];
        const contextStart = Math.max(0, messageIndex - 2);
        const contextEnd = Math.min(AppState.messageHistory.length, messageIndex + 3);
        const contextMessages = AppState.messageHistory.slice(contextStart, contextEnd);
        
        if (AppState.socket?.connected) {
            AppState.socket.emit('brain_request', {
                message: message.content,
                context: contextMessages.map(m => m.content),
                message_role: message.role,
                message_index: messageIndex
            });
        } else {
            AppState.elements.brainModalStatus.textContent = 'Not connected. Enter memory manually:';
            AppState.elements.brainRefinedText.value = message.content;
            AppState.elements.brainRefinedText.disabled = false;
        }
    },
    
    closeBrainModal() {
        AppState.elements.brainModalOverlay.classList.remove('active');
        AppState.currentBrainMessageIndex = null;
        AppState.currentBrainIconElement = null;
    },
    
    acceptBrainMemory() {
        const refinedText = AppState.elements.brainRefinedText.value.trim();
        if (!refinedText) {
            AppState.elements.brainModalStatus.textContent = 'Cannot save empty memory';
            return;
        }
        
        AppState.elements.brainModalStatus.textContent = 'Saving to knowledge base...';
        
        if (AppState.socket?.connected) {
            const saveNamespace = AppState.selectedNamespaces[0] || 'general';
            AppState.socket.emit('brain_save', {
                refined_text: refinedText,
                original_index: AppState.currentBrainMessageIndex,
                namespace: saveNamespace
            });
        } else {
            if (AppState.currentBrainIconElement) {
                AppState.currentBrainIconElement.classList.add('saved');
            }
            this.closeBrainModal();
            UI.addSystemMessage('Memory saved locally (offline mode)');
        }
    },
    
    // ===== MEMORY SUGGESTIONS =====
    showMemorySuggestions(suggestions) {
        const banner = document.createElement('div');
        banner.className = 'memory-suggestion-banner';
        banner.style.cssText = `
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white; padding: 1rem; border-radius: 0.5rem;
            margin: 0.5rem 0; font-size: 0.9rem; 
            box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
        `;
        banner.innerHTML = `
            <div style="font-weight: 600; margin-bottom: 0.5rem; display: flex; align-items: center; gap: 0.5rem;">
                💡 Suggested Memories
                <button onclick="this.parentElement.parentElement.remove()" 
                        style="margin-left: auto; background: rgba(255,255,255,0.2); border: none; 
                               color: white; padding: 0.25rem 0.5rem; border-radius: 0.25rem; cursor: pointer;">✕</button>
            </div>
            ${suggestions.map((s, i) => `
                <div style="display: flex; justify-content: space-between; align-items: center; 
                            margin: 0.5rem 0; background: rgba(255,255,255,0.1); 
                            padding: 0.5rem; border-radius: 0.25rem;">
                    <span style="flex: 1;">${this.escapeHtml(s.memory)}</span>
                    <button onclick="Features.quickSaveMemory(\`${this.escapeHtml(s.memory)}\`, ${i}, this)" 
                            class="save-memory-btn"
                            style="background: white; color: #667eea; border: none; 
                                   padding: 0.4rem 1rem; border-radius: 0.25rem; cursor: pointer; 
                                   font-weight: 600; margin-left: 1rem; transition: all 0.2s;">Save</button>
                </div>
            `).join('')}
        `;
        AppState.elements.messageList.appendChild(banner);
        UI.scrollToBottom();
    },
    
    showTopicSuggestion(topic) {
        if (AppState.selectedNamespaces.includes(topic.topic)) return;
        
        const banner = document.createElement('div');
        banner.className = 'topic-suggestion-banner';
        banner.style.cssText = `
            background: #3b82f6; color: white; padding: 0.75rem 1rem;
            border-radius: 0.5rem; margin: 0.5rem 0;
            display: flex; justify-content: space-between; align-items: center;
            box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
        `;
        banner.innerHTML = `
            <span>💼 Looks like <strong>${this.escapeHtml(topic.topic)}</strong> chat. Switch namespace?</span>
            <div style="display: flex; gap: 0.5rem;">
                <button onclick="Features.switchNamespace('${this.escapeHtml(topic.topic)}'); this.parentElement.parentElement.remove();" 
                        style="background: white; color: #3b82f6; border: none; 
                               padding: 0.5rem 1rem; border-radius: 0.25rem; cursor: pointer; font-weight: 600;">Switch</button>
                <button onclick="this.parentElement.parentElement.remove()" 
                        style="background: rgba(255,255,255,0.2); border: none; color: white; 
                               padding: 0.5rem 1rem; border-radius: 0.25rem; cursor: pointer;">Dismiss</button>
            </div>
        `;
        AppState.elements.messageList.appendChild(banner);
        UI.scrollToBottom();
    },
    
    quickSaveMemory(text, index, button) {
        const saveNamespace = AppState.selectedNamespaces[0] || 'general';
        if (AppState.socket?.connected) {
            AppState.socket.emit('brain_save', {
                refined_text: text,
                namespace: saveNamespace
            });
            
            button.textContent = '✓ Saved';
            button.style.background = '#10b981';
            button.style.color = 'white';
            button.disabled = true;
            
            setTimeout(() => {
                button.parentElement.style.opacity = '0.5';
            }, 500);
            
            UI.addSystemMessage('Memory saved!');
        }
    },
    
    switchNamespace(topic) {
        AppState.selectedNamespaces = [topic];
        Namespaces.updateDisplay();
        UI.addSystemMessage(`Switched to ${topic} namespace`);
    },
    
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
};

console.log('✅ Features module loaded');
