// Upload Modal Management
let selectedGithubRepo = null;
let uploadedFiles = [];

// Initialize upload modal
function initUploadModal() {
    const uploadBtns = [
        document.getElementById('upload-btn'),
        document.getElementById('upload-btn-mobile')
    ];
    
    uploadBtns.forEach(btn => {
        if (btn) {
            btn.addEventListener('click', openUploadModal);
        }
    });
    
    // Upload type selection
    document.querySelectorAll('.upload-type-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const type = this.dataset.type;
            selectUploadType(type);
        });
    });
    
    // File upload
    const dropZone = document.getElementById('drop-zone');
    const fileInput = document.getElementById('modal-file-input');
    
    dropZone.addEventListener('click', () => fileInput.click());
    dropZone.addEventListener('dragover', handleDragOver);
    dropZone.addEventListener('drop', handleFileDrop);
    fileInput.addEventListener('change', handleFileSelect);
    
    // Close modal
    document.getElementById('close-upload-modal').addEventListener('click', closeUploadModal);
    document.getElementById('upload-modal-overlay').addEventListener('click', function(e) {
        if (e.target === this) closeUploadModal();
    });
    
    // Confirm upload
    document.getElementById('confirm-upload').addEventListener('click', confirmUpload);
}

function openUploadModal() {
    document.getElementById('upload-modal-overlay').style.display = 'flex';
    document.getElementById('upload-type-selector').style.display = 'grid';
    document.getElementById('file-upload-section').style.display = 'none';
    document.getElementById('github-repo-section').style.display = 'none';
    document.getElementById('confirm-upload').style.display = 'none';
    
    // Reset state
    selectedGithubRepo = null;
    uploadedFiles = [];
}

function closeUploadModal() {
    document.getElementById('upload-modal-overlay').style.display = 'none';
}

function selectUploadType(type) {
    document.getElementById('upload-type-selector').style.display = 'none';
    
    if (type === 'file') {
        document.getElementById('file-upload-section').style.display = 'block';
    } else if (type === 'github') {
        document.getElementById('github-repo-section').style.display = 'block';
        loadGithubRepos();
    }
}

// File Upload Handlers
function handleDragOver(e) {
    e.preventDefault();
    e.currentTarget.style.borderColor = '#4f46e5';
    e.currentTarget.style.background = '#eef2ff';
}

function handleFileDrop(e) {
    e.preventDefault();
    e.currentTarget.style.borderColor = '#d1d5db';
    e.currentTarget.style.background = '#f9fafb';
    
    const files = Array.from(e.dataTransfer.files);
    processFiles(files);
}

function handleFileSelect(e) {
    const files = Array.from(e.target.files);
    processFiles(files);
}

async function processFiles(files) {
    const fileList = document.getElementById('file-list');
    fileList.innerHTML = '';
    uploadedFiles = [];
    
    for (const file of files) {
        const reader = new FileReader();
        reader.onload = function(e) {
            uploadedFiles.push({
                name: file.name,
                content: e.target.result,
                type: file.type
            });
            
            // Show file in list
            const fileItem = document.createElement('div');
            fileItem.style.cssText = 'padding: 0.75rem; background: #f3f4f6; border-radius: 0.5rem; margin-bottom: 0.5rem; display: flex; justify-content: space-between; align-items: center;';
            fileItem.innerHTML = `
                <span style="font-size: 0.9rem; color: #1f2937;">${file.name}</span>
                <span style="font-size: 0.75rem; color: #6b7280;">${(file.size / 1024).toFixed(1)} KB</span>
            `;
            fileList.appendChild(fileItem);
        };
        reader.readAsText(file);
    }
    
    if (files.length > 0) {
        document.getElementById('confirm-upload').style.display = 'block';
    }
}

// GitHub Repo Selection
async function loadGithubRepos() {
    const reposList = document.getElementById('github-repos-list');
    reposList.innerHTML = '<p style="color: #9ca3af;">Loading...</p>';
    
    try {
        const response = await fetch(`${BACKEND_URL}/github/repos/indexed`);
        const data = await response.json();
        
        if (data.repos.length === 0) {
            reposList.innerHTML = '<p style="color: #9ca3af;">No indexed repos. <a href="github.html" style="color: #4f46e5;">Index a repo first →</a></p>';
            return;
        }
        
        reposList.innerHTML = '';
        data.repos.forEach(repo => {
            if (repo.status !== 'complete') return; // Only show completed
            
            const repoCard = document.createElement('div');
            repoCard.style.cssText = 'padding: 1rem; border: 2px solid #e5e7eb; border-radius: 0.75rem; margin-bottom: 0.75rem; cursor: pointer; transition: all 0.2s;';
            repoCard.innerHTML = `
                <div style="display: flex; justify-content: space-between; align-items: start;">
                    <div>
                        <h5 style="margin: 0 0 0.25rem 0; color: #1f2937; font-size: 1rem;">${repo.full_name}</h5>
                        <p style="margin: 0; color: #6b7280; font-size: 0.85rem;">${repo.description || 'No description'}</p>
                        <div style="margin-top: 0.5rem; display: flex; gap: 0.75rem; font-size: 0.75rem; color: #9ca3af;">
                            <span>🔵 ${repo.language || 'Multiple'}</span>
                            <span>📂 ${repo.file_count} files</span>
                            <span>📦 ${repo.chunk_count} chunks</span>
                        </div>
                    </div>
                    <div class="repo-check" style="width: 1.5rem; height: 1.5rem; border: 2px solid #d1d5db; border-radius: 50%; display: flex; align-items: center; justify-content: center;"></div>
                </div>
            `;
            
            repoCard.addEventListener('click', function() {
                selectGithubRepo(repo, this);
            });
            
            reposList.appendChild(repoCard);
        });
        
    } catch (error) {
        reposList.innerHTML = `<p style="color: #ef4444;">Failed to load repos: ${error.message}</p>`;
    }
}

function selectGithubRepo(repo, element) {
    // Deselect all
    document.querySelectorAll('#github-repos-list > div').forEach(card => {
        card.style.borderColor = '#e5e7eb';
        card.querySelector('.repo-check').innerHTML = '';
    });
    
    // Select this one
    element.style.borderColor = '#4f46e5';
    element.querySelector('.repo-check').innerHTML = '<svg style="width: 1rem; height: 1rem; color: #4f46e5;" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"/></svg>';
    
    selectedGithubRepo = repo;
    document.getElementById('confirm-upload').style.display = 'block';
}

// Confirm Upload
async function confirmUpload() {
    if (selectedGithubRepo) {
        // Attach GitHub repo to session
        attachGithubRepoToSession(selectedGithubRepo);
    } else if (uploadedFiles.length > 0) {
        // Handle local file uploads
        await uploadLocalFiles();
    }
    
    closeUploadModal();
}

function attachGithubRepoToSession(repo) {
    // Store in session state
    State.currentGithubRepo = repo;
    
    // Show indicator in UI
    showGithubRepoIndicator(repo);
    
    // Send system message
    addMessage('system', `📂 GitHub repo attached: **${repo.full_name}**\n\nI now have full access to this codebase. Ask me anything about the code!`);
}

function showGithubRepoIndicator(repo) {
    // Remove existing indicator
    const existing = document.getElementById('github-repo-indicator');
    if (existing) existing.remove();
    
    // Add new indicator to header
    const header = document.getElementById('chat-header');
    const indicator = document.createElement('div');
    indicator.id = 'github-repo-indicator';
    indicator.style.cssText = 'display: flex; align-items: center; gap: 0.5rem; padding: 0.5rem 0.75rem; background: rgba(79, 70, 229, 0.1); border-radius: 0.5rem; font-size: 0.85rem; color: #4f46e5;';
    indicator.innerHTML = `
        <svg style="width: 1rem; height: 1rem;" fill="currentColor" viewBox="0 0 16 16">
            <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.012 8.012 0 0 0 16 8c0-4.42-3.58-8-8-8z"/>
        </svg>
        <span>${repo.full_name}</span>
        <button onclick="detachGithubRepo()" style="margin-left: 0.25rem; background: none; border: none; color: #4f46e5; cursor: pointer; font-size: 1rem;">×</button>
    `;
    
    header.insertBefore(indicator, header.children[1]);
}

function detachGithubRepo() {
    State.currentGithubRepo = null;
    const indicator = document.getElementById('github-repo-indicator');
    if (indicator) indicator.remove();
    
    addMessage('system', 'GitHub repo detached from this session.');
}

async function uploadLocalFiles() {
    // TODO: Implement local file upload to RAG
    console.log('Uploading files:', uploadedFiles);
    addMessage('system', `Uploaded ${uploadedFiles.length} file(s). Processing...`);
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', initUploadModal);
