// UI Rendering & Updates
const UI = {
    // Initialize event listeners
    init() {
        const el = AppState.elements;
        
        // History toggle
        el.historyToggle.addEventListener('click', () => this.toggleHistory());
        el.sidebarOverlay.addEventListener('click', () => el.historyPanel.classList.add('hidden'));
        
        // File upload
        el.uploadBtn.addEventListener('click', () => el.fileInput.click());
        el.uploadBtnMobile.addEventListener('click', () => el.fileInput.click());
        el.fileInput.addEventListener('change', (e) => Features.handleFileSelection(e));
        
        // Microphone
        el.micBtn.addEventListener('click', () => Features.toggleVoice());
        el.micBtnMobile.addEventListener('click', () => Features.toggleVoice());
    },
    
    toggleHistory() {
        AppState.elements.historyPanel.classList.toggle('hidden');
    },
    
    addSystemMessage(text) {
        const msg = document.createElement('div');
        msg.classList.add('message');
        msg.style.cssText = 'align-self: center; background: rgba(255,255,255,0.8); color: #388e3c; font-style: italic; font-size: 0.9em; max-width: 50%;';
        msg.textContent = text;
        AppState.elements.messageList.appendChild(msg);
        this.scrollToBottom();
    },
    
    renderMessage(message, messageIndex) {
        const wrapper = document.createElement('div');
        wrapper.className = 'message-wrapper ' + (message.role === 'user' ? 'user-wrapper' : 'assistant-wrapper');
        
        const messageEl = document.createElement('div');
        messageEl.classList.add('message', `${message.role}-message`);
        
        const content = message.content;
        const codeBlockRegex = /```(\w+)?\n([\s\S]*?)```/g;
        const codeBlocks = [];
        let match;
        
        while ((match = codeBlockRegex.exec(content)) !== null) {
            codeBlocks.push({
                fullMatch: match[0],
                language: match[1] || 'plaintext',
                code: match[2],
                index: match.index
            });
        }
        
        if (codeBlocks.length > 0 && message.role === 'assistant') {
            let lastIndex = 0;
            codeBlocks.forEach((block) => {
                const beforeText = content.substring(lastIndex, block.index);
                if (beforeText.trim()) {
                    const beforeEl = document.createElement('div');
                    beforeEl.innerHTML = marked.parse(beforeText);
                    messageEl.appendChild(beforeEl);
                }
                messageEl.appendChild(this.createCodeBlock(block.language, block.code));
                lastIndex = block.index + block.fullMatch.length;
            });
            const afterText = content.substring(lastIndex);
            if (afterText.trim()) {
                const afterEl = document.createElement('div');
                afterEl.innerHTML = marked.parse(afterText);
                messageEl.appendChild(afterEl);
            }
        } else {
            messageEl.innerHTML = marked.parse(content);
        }
        
        // Brain icon
        const brainIcon = document.createElement('div');
        brainIcon.className = 'brain-icon';
        brainIcon.innerHTML = CONFIG.BRAIN_SVG;
        brainIcon.title = 'Save to memory';
        brainIcon.addEventListener('click', () => Features.openBrainModal(messageIndex, brainIcon));
        
        wrapper.appendChild(messageEl);
        wrapper.appendChild(brainIcon);
        AppState.elements.messageList.appendChild(wrapper);
        
        // Syntax highlighting
        messageEl.querySelectorAll('pre code').forEach((block) => {
            Prism.highlightElement(block);
        });
        
        this.scrollToBottom();
    },
    
    createCodeBlock(language, code) {
        const container = document.createElement('div');
        container.className = 'code-block-container';
        
        const header = document.createElement('div');
        header.className = 'code-block-header';
        
        const langLabel = document.createElement('span');
        langLabel.className = 'code-block-language';
        langLabel.textContent = language;
        header.appendChild(langLabel);
        
        const controls = document.createElement('div');
        controls.className = 'code-block-controls';
        
        if (language.toLowerCase() === 'html') {
            const previewBtn = document.createElement('button');
            previewBtn.className = 'code-control-btn active';
            previewBtn.textContent = 'Preview';
            previewBtn.type = 'button';
            
            const codeBtn = document.createElement('button');
            codeBtn.className = 'code-control-btn';
            codeBtn.textContent = 'Code';
            codeBtn.type = 'button';
            
            controls.appendChild(previewBtn);
            controls.appendChild(codeBtn);
        }
        
        const copyBtn = document.createElement('button');
        copyBtn.className = 'code-control-btn';
        copyBtn.textContent = 'Copy';
        copyBtn.type = 'button';
        copyBtn.addEventListener('click', () => this.copyCode(code, copyBtn));
        controls.appendChild(copyBtn);
        
        header.appendChild(controls);
        container.appendChild(header);
        
        const contentArea = document.createElement('div');
        contentArea.className = 'code-block-content';
        
        if (language.toLowerCase() === 'html') {
            const previewContainer = document.createElement('div');
            previewContainer.className = 'code-preview-container active';
            const iframe = document.createElement('iframe');
            iframe.className = 'html-iframe';
            iframe.setAttribute('srcdoc', code);
            iframe.setAttribute('sandbox', 'allow-scripts allow-modals');
            previewContainer.appendChild(iframe);
            contentArea.appendChild(previewContainer);
            
            const sourceContainer = document.createElement('div');
            sourceContainer.className = 'code-source-container';
            const pre = document.createElement('pre');
            const codeEl = document.createElement('code');
            codeEl.className = `language-${language}`;
            codeEl.textContent = code;
            pre.appendChild(codeEl);
            sourceContainer.appendChild(pre);
            contentArea.appendChild(sourceContainer);
            
            const previewBtn = controls.querySelector('.code-control-btn:nth-child(1)');
            const codeBtn = controls.querySelector('.code-control-btn:nth-child(2)');
            
            previewBtn.addEventListener('click', () => {
                previewBtn.classList.add('active');
                codeBtn.classList.remove('active');
                previewContainer.classList.add('active');
                sourceContainer.classList.remove('active');
            });
            
            codeBtn.addEventListener('click', () => {
                codeBtn.classList.add('active');
                previewBtn.classList.remove('active');
                sourceContainer.classList.add('active');
                previewContainer.classList.remove('active');
                Prism.highlightElement(codeEl);
            });
        } else {
            const sourceContainer = document.createElement('div');
            sourceContainer.className = 'code-source-container active';
            const pre = document.createElement('pre');
            const codeEl = document.createElement('code');
            codeEl.className = `language-${language}`;
            codeEl.textContent = code;
            pre.appendChild(codeEl);
            sourceContainer.appendChild(pre);
            contentArea.appendChild(sourceContainer);
            
            setTimeout(() => Prism.highlightElement(codeEl), 0);
        }
        
        container.appendChild(contentArea);
        return container;
    },
    
    copyCode(code, button) {
        navigator.clipboard.writeText(code).then(() => {
            const originalText = button.textContent;
            button.textContent = 'Copied!';
            button.style.background = 'rgba(35, 166, 213, 0.5)';
            
            const notification = document.createElement('div');
            notification.className = 'copy-notification';
            notification.textContent = 'Code copied to clipboard!';
            document.body.appendChild(notification);
            
            setTimeout(() => {
                notification.remove();
            }, 2000);
            
            setTimeout(() => {
                button.textContent = originalText;
                button.style.background = '';
            }, 1500);
        });
    },
    
    scrollToBottom() {
        AppState.elements.messageList.scrollTop = AppState.elements.messageList.scrollHeight;
    }
};
