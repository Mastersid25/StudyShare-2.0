// ==================== SUBJECT / RESOURCE HUB MODULE ====================

// ---- Parse URL Parameters ----
const urlParams = new URLSearchParams(window.location.search);
const pageYear = urlParams.get('year');
const pageBranch = urlParams.get('branch');
const pageSubject = urlParams.get('subject');

let activeCategory = 'notes';
let categoryCounts = { notes: 0, textbooks: 0, 'question-papers': 0, 'paper-solutions': 0 };
let userVotes = {};
let loadedFiles = {};
let pageInitialized = false;

// ==================== INITIALIZE PAGE ====================
function initSubjectPage() {
    if (pageInitialized) return;
    pageInitialized = true;

    if (!pageYear || !pageBranch || !pageSubject) {
        showToast('Invalid subject URL. Redirecting...', 'error');
        setTimeout(() => window.location.href = 'explore.html', 1500);
        return;
    }

    const decodedSubject = decodeURIComponent(pageSubject);

    // Breadcrumb
    const bcYear = document.getElementById('breadcrumb-year');
    const bcBranch = document.getElementById('breadcrumb-branch');
    const bcSubject = document.getElementById('breadcrumb-subject');
    if (bcYear) bcYear.textContent = pageYear;
    if (bcBranch) bcBranch.textContent = pageBranch;
    if (bcSubject) bcSubject.textContent = decodedSubject;

    // Header
    const subjectTitle = document.getElementById('subject-title');
    if (subjectTitle) subjectTitle.textContent = decodedSubject;

    const yearBadge = document.getElementById('header-year-badge');
    if (yearBadge) {
        yearBadge.textContent = pageYear;
        yearBadge.className = `px-2.5 py-0.5 text-xs font-semibold rounded-full badge-${pageYear.toLowerCase()}`;
    }

    const branchBadge = document.getElementById('header-branch-badge');
    if (branchBadge) branchBadge.textContent = getBranchFullName(pageBranch);

    document.title = `${decodedSubject} — StudyShare`;

    const uploadCat = document.getElementById('upload-category');
    if (uploadCat) uploadCat.value = 'notes';

    // Load data
    loadAllCategoryCounts();
    loadCategoryFiles();
}

// ==================== CATEGORY COUNTS ====================
async function loadAllCategoryCounts() {
    const categories = ['notes', 'textbooks', 'question-papers', 'paper-solutions'];
    for (const cat of categories) {
        try {
            const snapshot = await db.collection('materials')
                .where('year', '==', pageYear)
                .where('branch', '==', pageBranch)
                .where('subject', '==', pageSubject)
                .where('category', '==', cat)
                .get();
            categoryCounts[cat] = snapshot.size;
            const countEl = document.getElementById(`count-${cat}`);
            if (countEl) countEl.textContent = snapshot.size;
        } catch (err) {
            console.error(`Error counting ${cat}:`, err);
        }
    }
}

// ==================== SWITCH CATEGORY TAB ====================
function switchCategory(category) {
    activeCategory = category;

    // Update all tabs
    document.querySelectorAll('.tab-btn').forEach(tab => {
        tab.classList.remove('border-primary-600', 'text-primary-700');
        tab.classList.add('border-transparent', 'text-surface-500');
        const badge = tab.querySelector('span');
        if (badge) {
            badge.classList.remove('bg-primary-50', 'text-primary-700');
            badge.classList.add('bg-surface-100', 'text-surface-600');
        }
    });

    // Activate selected tab
    const activeTab = document.getElementById(`tab-${category}`);
    if (activeTab) {
        activeTab.classList.remove('border-transparent', 'text-surface-500');
        activeTab.classList.add('border-primary-600', 'text-primary-700');
        const badge = activeTab.querySelector('span');
        if (badge) {
            badge.classList.remove('bg-surface-100', 'text-surface-600');
            badge.classList.add('bg-primary-50', 'text-primary-700');
        }
    }

    // Update upload default
    const uploadCat = document.getElementById('upload-category');
    if (uploadCat) uploadCat.value = category;

    loadCategoryFiles();
}

// ==================== LOAD FILES ====================
async function loadCategoryFiles() {
    const filesLoading = document.getElementById('files-loading');
    const filesList = document.getElementById('files-list');
    const filesEmpty = document.getElementById('files-empty');
    const countDisplay = document.getElementById('category-file-count');

    // Show loading, hide others
    if (filesLoading) filesLoading.classList.remove('hidden');
    if (filesList) { filesList.innerHTML = ''; filesList.classList.add('hidden'); }
    if (filesEmpty) filesEmpty.classList.add('hidden');

    const sortSelect = document.getElementById('sort-select');
    const sortBy = sortSelect ? sortSelect.value : 'upvotes';

    try {
        let query = db.collection('materials')
            .where('year', '==', pageYear)
            .where('branch', '==', pageBranch)
            .where('subject', '==', pageSubject)
            .where('category', '==', activeCategory);

        if (sortBy === 'upvotes') {
            query = query.orderBy('upvotes', 'desc');
        } else if (sortBy === 'newest') {
            query = query.orderBy('createdAt', 'desc');
        } else {
            query = query.orderBy('createdAt', 'asc');
        }

        const snapshot = await query.get();

        // Hide loading
        if (filesLoading) filesLoading.classList.add('hidden');

        // Update count
        if (countDisplay) countDisplay.textContent = `${snapshot.size} file${snapshot.size !== 1 ? 's' : ''}`;

        if (snapshot.empty) {
            // Show empty state
            if (filesEmpty) filesEmpty.classList.remove('hidden');
            if (filesList) filesList.classList.add('hidden');
            return;
        }

        // Build file cards
        if (filesList) {
            filesList.innerHTML = '';
            filesList.classList.remove('hidden');

            snapshot.forEach((doc) => {
                const data = doc.data();
                loadedFiles[doc.id] = data;
                const card = createFileCard(doc.id, data);
                filesList.appendChild(card);
            });
        }

        console.log(`Loaded ${snapshot.size} files for category: ${activeCategory}`);

    } catch (error) {
        console.error('Error loading files:', error);

        if (filesLoading) filesLoading.classList.add('hidden');

        if (filesList) {
            filesList.classList.remove('hidden');
            filesList.innerHTML = `
                <div class="p-8 text-center">
                    <div class="w-12 h-12 bg-red-50 rounded-xl flex items-center justify-center mx-auto mb-3">
                        <i class="fas fa-exclamation-triangle text-red-400"></i>
                    </div>
                    <p class="text-red-600 text-sm font-medium mb-1">Error loading files</p>
                    <p class="text-surface-400 text-xs mb-3">${escapeHTML(error.message)}</p>
                    <button onclick="loadCategoryFiles()" class="px-4 py-2 text-sm text-primary-600 font-medium bg-primary-50 rounded-lg hover:bg-primary-100 transition-colors">
                        <i class="fas fa-redo mr-1"></i> Retry
                    </button>
                </div>
            `;
        }
    }
}

// ==================== CREATE FILE CARD ====================
function createFileCard(id, data) {
    const div = document.createElement('div');
    div.className = 'file-card flex items-start gap-3 sm:gap-4 px-4 sm:px-6 py-4 sm:py-5 hover:bg-surface-50/50 transition-all group';
    div.id = `file-${id}`;

    const isVoted = userVotes[id] === true;
    const upvoteCount = data.upvotes || 0;

    div.innerHTML = `
        <!-- Upvote -->
        <button onclick="handleUpvote('${id}')" 
            class="upvote-btn flex flex-col items-center gap-0.5 px-2 py-1.5 rounded-xl hover:bg-primary-50 transition-all flex-shrink-0 ${isVoted ? 'active' : ''}" 
            title="${isVoted ? 'Remove upvote' : 'Upvote this'}">
            <i class="fas fa-arrow-up text-sm"></i>
            <span class="text-xs font-bold" id="upvote-count-${id}">${upvoteCount}</span>
        </button>

        <!-- File Icon -->
        <div class="w-10 h-10 sm:w-11 sm:h-11 bg-surface-100 rounded-xl flex items-center justify-center flex-shrink-0">
            <i class="fas ${getFileIcon(data.fileType)} text-base sm:text-lg"></i>
        </div>

        <!-- File Info -->
        <div class="flex-1 min-w-0">
            <h4 class="text-sm font-semibold text-surface-800 leading-snug">${escapeHTML(data.title)}</h4>
            ${data.description ? `<p class="text-xs text-surface-500 mt-1 line-clamp-2">${escapeHTML(data.description)}</p>` : ''}
            <div class="flex flex-wrap items-center gap-x-3 gap-y-1 mt-2 text-xs text-surface-400">
                <span class="flex items-center gap-1">
                    <i class="fas fa-user text-[10px]"></i>
                    ${escapeHTML(data.uploaderName || 'Anonymous')}
                </span>
                <span class="flex items-center gap-1">
                    <i class="fas fa-calendar text-[10px]"></i>
                    ${formatDate(data.createdAt)}
                </span>
                ${data.fileSize ? `
                    <span class="flex items-center gap-1">
                        <i class="fas fa-weight-hanging text-[10px]"></i>
                        ${formatFileSize(data.fileSize)}
                    </span>
                ` : ''}
            </div>
        </div>

        <!-- Action Buttons -->
        <div class="flex items-center gap-1 flex-shrink-0 self-center">
            <button onclick="handlePreview('${id}')" 
                class="w-9 h-9 flex items-center justify-center rounded-lg text-surface-400 hover:text-primary-600 hover:bg-primary-50 transition-all" 
                title="Preview file">
                <i class="fas fa-eye text-sm"></i>
            </button>
            <button onclick="handleDownload('${id}')" 
                class="w-9 h-9 flex items-center justify-center rounded-lg text-surface-400 hover:text-emerald-600 hover:bg-emerald-50 transition-all" 
                title="Download file">
                <i class="fas fa-download text-sm"></i>
            </button>
        </div>
    `;

    return div;
}

// ==================== DOWNLOAD HANDLER ====================
async function handleDownload(fileId) {
    const fileData = loadedFiles[fileId];
    if (!fileData || !fileData.fileURL) {
        showToast('File data not found', 'error');
        return;
    }

    console.log('--- Download Start ---');
    console.log('Title:', fileData.title);
    console.log('Stored URL:', fileData.fileURL.substring(0, 80));

    showToast('Preparing download...', 'info', 2000);

    // Try Method 1: Fetch as blob and download
    try {
        const storageRef = storage.refFromURL(fileData.fileURL);
        const freshURL = await storageRef.getDownloadURL();
        console.log('Fresh URL obtained');

        const response = await fetch(freshURL);
        console.log('Fetch status:', response.status);

        if (!response.ok) throw new Error(`HTTP ${response.status}`);

        const blob = await response.blob();

        // Build filename with extension
        let fileName = fileData.title || 'download';
        const ext = getExtensionFromMime(fileData.fileType) || getExtensionFromURL(fileData.fileURL);
        if (ext && !fileName.toLowerCase().endsWith(`.${ext}`)) {
            fileName += `.${ext}`;
        }

        // Create download
        const blobURL = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = blobURL;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();

        setTimeout(() => {
            window.URL.revokeObjectURL(blobURL);
            document.body.removeChild(a);
        }, 1000);

        showToast('Download started! ✅', 'success');
        console.log('--- Download Success (blob) ---');
        return;

    } catch (err1) {
        console.warn('Blob download failed:', err1.message);
    }

    // Try Method 2: Open in new tab
    try {
        const storageRef = storage.refFromURL(fileData.fileURL);
        const freshURL = await storageRef.getDownloadURL();
        window.open(freshURL, '_blank');
        showToast('File opened in new tab. Right-click → Save As to download.', 'info', 5000);
        return;
    } catch (err2) {
        console.warn('New tab failed:', err2.message);
    }

    // Method 3: Direct URL
    window.open(fileData.fileURL, '_blank');
    showToast('Opening file...', 'info');
}

// ==================== PREVIEW HANDLER ====================
async function handlePreview(fileId) {
    const fileData = loadedFiles[fileId];
    if (!fileData || !fileData.fileURL) {
        showToast('File not found', 'error');
        return;
    }

    const modal = document.getElementById('preview-modal');
    const previewBody = document.getElementById('preview-body');
    const previewTitle = document.getElementById('preview-title');
    const previewMeta = document.getElementById('preview-meta');
    const previewIcon = document.getElementById('preview-file-icon');
    const downloadBtn = document.getElementById('preview-download-link');

    if (previewTitle) previewTitle.textContent = fileData.title || 'Untitled';
    if (previewMeta) previewMeta.textContent = `Uploaded by ${fileData.uploaderName || 'Unknown'} • ${formatDate(fileData.createdAt)}`;
    if (previewIcon) previewIcon.className = `fas ${getFileIcon(fileData.fileType)} text-lg flex-shrink-0`;

    // Wire download button
    if (downloadBtn) {
        downloadBtn.onclick = (e) => { e.preventDefault(); handleDownload(fileId); };
    }

    // Show modal with loading
    if (modal) modal.classList.remove('hidden');
    document.body.classList.add('modal-open');

    if (previewBody) {
        previewBody.innerHTML = `
            <div class="flex items-center justify-center h-full">
                <div class="text-center">
                    <i class="fas fa-spinner fa-spin text-primary-500 text-2xl mb-3 block"></i>
                    <p class="text-sm text-surface-500">Loading preview...</p>
                </div>
            </div>
        `;
    }

    try {
        // Get fresh URL
        let freshURL = fileData.fileURL;
        try {
            const ref = storage.refFromURL(fileData.fileURL);
            freshURL = await ref.getDownloadURL();
        } catch (e) {
            console.warn('Could not refresh URL, using stored:', e.message);
        }

        const fileType = (fileData.fileType || '').toLowerCase();
        const isPDF = fileType.includes('pdf');
        const isImage = fileType.includes('image');
        const isText = fileType.includes('text/plain') || fileType.includes('text/csv');

        if (isPDF) {
            // PDF: Use object tag with Google Docs fallback
            const googleURL = `https://docs.google.com/gview?url=${encodeURIComponent(freshURL)}&embedded=true`;
            previewBody.innerHTML = `
                <div class="w-full h-full flex flex-col">
                    <object data="${freshURL}" type="application/pdf" class="w-full flex-1">
                        <iframe src="${googleURL}" class="w-full h-full border-0"></iframe>
                    </object>
                    <div class="bg-white border-t border-surface-200 px-4 py-2 flex items-center justify-center gap-4 flex-shrink-0">
                        <span class="text-xs text-surface-400">PDF not showing?</span>
                        <button onclick="window.open('${freshURL}', '_blank')" class="text-xs font-medium text-primary-600 hover:underline">Open in new tab</button>
                        <button onclick="handleDownload('${fileId}')" class="text-xs font-medium text-emerald-600 hover:underline">Download</button>
                    </div>
                </div>
            `;

        } else if (isImage) {
            previewBody.innerHTML = `
                <div class="flex items-center justify-center h-full p-6 bg-surface-800">
                    <img src="${freshURL}" alt="${escapeHTML(fileData.title)}" 
                        class="max-w-full max-h-full object-contain rounded-lg shadow-2xl"
                        onerror="this.onerror=null; this.parentElement.innerHTML='<div class=\\'text-center\\'><i class=\\'fas fa-exclamation-triangle text-surface-400 text-3xl mb-3 block\\'></i><p class=\\'text-surface-400\\'>Image failed to load</p></div>'">
                </div>
            `;

        } else if (isText) {
            try {
                const resp = await fetch(freshURL);
                const text = await resp.text();
                previewBody.innerHTML = `
                    <div class="p-6 h-full overflow-auto bg-white">
                        <pre class="text-sm text-surface-700 font-mono whitespace-pre-wrap break-words">${escapeHTML(text)}</pre>
                    </div>
                `;
            } catch (e) {
                renderNonPreviewable(previewBody, fileId, freshURL);
            }

        } else {
            // Try Google Docs viewer for Office files
            const isOffice = fileType.includes('word') || fileType.includes('document') ||
                             fileType.includes('presentation') || fileType.includes('powerpoint') ||
                             fileType.includes('spreadsheet') || fileType.includes('excel') ||
                             fileType.includes('msword') || fileType.includes('officedocument');

            if (isOffice) {
                const googleURL = `https://docs.google.com/gview?url=${encodeURIComponent(freshURL)}&embedded=true`;
                previewBody.innerHTML = `
                    <div class="w-full h-full flex flex-col">
                        <iframe src="${googleURL}" class="w-full flex-1 border-0"></iframe>
                        <div class="bg-white border-t border-surface-200 px-4 py-2 flex items-center justify-center gap-4 flex-shrink-0">
                            <span class="text-xs text-surface-400">Preview via Google Docs</span>
                            <button onclick="handleDownload('${fileId}')" class="text-xs font-medium text-emerald-600 hover:underline">Download original</button>
                        </div>
                    </div>
                `;
            } else {
                renderNonPreviewable(previewBody, fileId, freshURL);
            }
        }

    } catch (error) {
        console.error('Preview error:', error);
        if (previewBody) {
            previewBody.innerHTML = `
                <div class="flex flex-col items-center justify-center h-full p-6">
                    <div class="w-16 h-16 bg-red-50 rounded-2xl flex items-center justify-center mb-4">
                        <i class="fas fa-exclamation-triangle text-red-400 text-xl"></i>
                    </div>
                    <h4 class="text-lg font-semibold text-surface-700 mb-1">Preview Error</h4>
                    <p class="text-surface-500 text-sm mb-4">${escapeHTML(error.message)}</p>
                    <div class="flex gap-3">
                        <button onclick="handlePreview('${fileId}')" class="px-4 py-2 bg-primary-50 text-primary-700 text-sm font-medium rounded-lg">
                            <i class="fas fa-redo mr-1"></i> Retry
                        </button>
                        <button onclick="handleDownload('${fileId}')" class="px-4 py-2 bg-emerald-600 text-white text-sm font-medium rounded-lg">
                            <i class="fas fa-download mr-1"></i> Download
                        </button>
                    </div>
                </div>
            `;
        }
    }
}

function renderNonPreviewable(container, fileId, freshURL) {
    const fileData = loadedFiles[fileId] || {};
    container.innerHTML = `
        <div class="flex flex-col items-center justify-center h-full p-6">
            <div class="w-20 h-20 bg-surface-200 rounded-2xl flex items-center justify-center mb-4">
                <i class="fas ${getFileIcon(fileData.fileType)} text-3xl"></i>
            </div>
            <h4 class="text-lg font-semibold text-surface-700 mb-1">Preview not available</h4>
            <p class="text-surface-500 text-sm mb-1">${escapeHTML(fileData.title || '')}</p>
            <p class="text-surface-400 text-xs mb-6">${fileData.fileSize ? formatFileSize(fileData.fileSize) : ''} • ${getFileTypeName(fileData.fileType)}</p>
            <div class="flex gap-3">
                <button onclick="handleDownload('${fileId}')" class="px-6 py-3 bg-gradient-to-r from-primary-600 to-primary-700 text-white font-semibold text-sm rounded-xl shadow-lg flex items-center gap-2">
                    <i class="fas fa-download"></i> Download File
                </button>
                <button onclick="window.open('${freshURL || ''}', '_blank')" class="px-6 py-3 bg-surface-200 text-surface-700 font-semibold text-sm rounded-xl hover:bg-surface-300 flex items-center gap-2">
                    <i class="fas fa-external-link-alt"></i> Open in Tab
                </button>
            </div>
        </div>
    `;
}

function hidePreviewModal() {
    const modal = document.getElementById('preview-modal');
    const body = document.getElementById('preview-body');
    if (modal) modal.classList.add('hidden');
    if (body) body.innerHTML = '';
    document.body.classList.remove('modal-open');
}

// ==================== HELPERS ====================
function getExtensionFromURL(url) {
    try {
        const decoded = decodeURIComponent(url);
        const m = decoded.match(/\.([a-zA-Z0-9]{2,5})(?:\?|$)/);
        return m ? m[1].toLowerCase() : '';
    } catch (e) { return ''; }
}

function getExtensionFromMime(mime) {
    if (!mime) return '';
    const map = {
        'application/pdf': 'pdf', 'image/jpeg': 'jpg', 'image/png': 'png', 'image/gif': 'gif',
        'application/msword': 'doc', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx',
        'application/vnd.ms-powerpoint': 'ppt', 'application/vnd.openxmlformats-officedocument.presentationml.presentation': 'pptx',
        'application/vnd.ms-excel': 'xls', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'xlsx',
        'application/zip': 'zip', 'text/plain': 'txt'
    };
    return map[mime] || '';
}

function getFileTypeName(mime) {
    if (!mime) return 'Unknown';
    if (mime.includes('pdf')) return 'PDF';
    if (mime.includes('image')) return 'Image';
    if (mime.includes('word') || mime.includes('document')) return 'Word Document';
    if (mime.includes('presentation') || mime.includes('powerpoint')) return 'PowerPoint';
    if (mime.includes('spreadsheet') || mime.includes('excel')) return 'Excel';
    if (mime.includes('zip')) return 'ZIP Archive';
    if (mime.includes('text')) return 'Text File';
    return mime.split('/').pop();
}

// ==================== UPVOTE SYSTEM ====================
async function handleUpvote(fileId) {
    if (!currentUser) {
        showToast('Please log in to upvote', 'warning');
        return;
    }

    const fileData = loadedFiles[fileId];
    if (!fileData) return;

    const currentVotes = fileData.upvotes || 0;
    const voteRef = db.collection('materials').doc(fileId).collection('votes').doc(currentUser.uid);
    const btn = document.querySelector(`#file-${fileId} .upvote-btn`);
    const countEl = document.getElementById(`upvote-count-${fileId}`);

    try {
        const voteDoc = await voteRef.get();

        if (voteDoc.exists) {
            // Remove vote
            if (btn) btn.classList.remove('active');
            if (countEl) countEl.textContent = Math.max(0, currentVotes - 1);
            await voteRef.delete();
            await db.collection('materials').doc(fileId).update({ upvotes: firebase.firestore.FieldValue.increment(-1) });
            userVotes[fileId] = false;
            loadedFiles[fileId].upvotes = Math.max(0, currentVotes - 1);
        } else {
            // Add vote
            if (btn) btn.classList.add('active');
            if (countEl) countEl.textContent = currentVotes + 1;
            await voteRef.set({ votedAt: firebase.firestore.FieldValue.serverTimestamp() });
            await db.collection('materials').doc(fileId).update({ upvotes: firebase.firestore.FieldValue.increment(1) });
            userVotes[fileId] = true;
            loadedFiles[fileId].upvotes = currentVotes + 1;
            showToast('Upvoted! 👍', 'success', 2000);
        }
    } catch (error) {
        console.error('Upvote error:', error);
        showToast('Error processing vote', 'error');
    }
}

async function loadUserVotes() {
    if (!currentUser) return;
    try {
        const snapshot = await db.collection('materials')
            .where('year', '==', pageYear)
            .where('branch', '==', pageBranch)
            .where('subject', '==', pageSubject)
            .get();

        const checks = snapshot.docs.map(async (doc) => {
            try {
                const voteDoc = await db.collection('materials').doc(doc.id).collection('votes').doc(currentUser.uid).get();
                if (voteDoc.exists) userVotes[doc.id] = true;
            } catch (e) { /* skip */ }
        });
        await Promise.all(checks);
    } catch (err) {
        console.warn('Error loading votes:', err);
    }
}

// ==================== UPLOAD SYSTEM ====================
function showUploadModal() {
    if (!currentUser) {
        showToast('Please log in to upload', 'warning');
        return;
    }
    const modal = document.getElementById('upload-modal');
    if (modal) modal.classList.remove('hidden');
    document.body.classList.add('modal-open');

    const errEl = document.getElementById('upload-error');
    if (errEl) errEl.classList.add('hidden');
}

function hideUploadModal() {
    const modal = document.getElementById('upload-modal');
    if (modal) modal.classList.add('hidden');
    document.body.classList.remove('modal-open');
    resetUploadForm();
}

function resetUploadForm() {
    const form = document.getElementById('upload-form');
    if (form) form.reset();

    const errEl = document.getElementById('upload-error');
    if (errEl) errEl.classList.add('hidden');

    const progContainer = document.getElementById('upload-progress-container');
    if (progContainer) progContainer.classList.add('hidden');

    const progBar = document.getElementById('upload-progress-bar');
    if (progBar) progBar.style.width = '0%';

    const progText = document.getElementById('upload-percent');
    if (progText) progText.textContent = '0%';

    clearFileSelection();

    const btn = document.getElementById('upload-submit-btn');
    if (btn) {
        btn.disabled = false;
        btn.innerHTML = '<i class="fas fa-cloud-upload-alt"></i><span>Upload Material</span>';
    }
}

// File drop zone
const fileDropZone = document.getElementById('file-drop-zone');
const fileInput = document.getElementById('upload-file');

if (fileDropZone && fileInput) {
    fileDropZone.addEventListener('click', () => fileInput.click());
    fileDropZone.addEventListener('dragover', (e) => { e.preventDefault(); fileDropZone.classList.add('border-primary-400', 'bg-primary-50/30'); });
    fileDropZone.addEventListener('dragleave', (e) => { e.preventDefault(); fileDropZone.classList.remove('border-primary-400', 'bg-primary-50/30'); });
    fileDropZone.addEventListener('drop', (e) => {
        e.preventDefault();
        fileDropZone.classList.remove('border-primary-400', 'bg-primary-50/30');
        if (e.dataTransfer.files.length > 0) {
            fileInput.files = e.dataTransfer.files;
            showFileSelected(e.dataTransfer.files[0]);
        }
    });
    fileInput.addEventListener('change', (e) => {
        if (e.target.files.length > 0) showFileSelected(e.target.files[0]);
    });
}

function showFileSelected(file) {
    const p = document.getElementById('file-placeholder');
    const s = document.getElementById('file-selected');
    if (p) p.classList.add('hidden');
    if (s) s.classList.remove('hidden');

    const nameEl = document.getElementById('selected-file-name');
    const sizeEl = document.getElementById('selected-file-size');
    const iconEl = document.getElementById('selected-file-icon');
    if (nameEl) nameEl.textContent = file.name;
    if (sizeEl) sizeEl.textContent = formatFileSize(file.size);
    if (iconEl) iconEl.className = `fas ${getFileIcon(file.type)} text-2xl`;
}

function clearFileSelection(e) {
    if (e) e.stopPropagation();
    const p = document.getElementById('file-placeholder');
    const s = document.getElementById('file-selected');
    const i = document.getElementById('upload-file');
    if (p) p.classList.remove('hidden');
    if (s) s.classList.add('hidden');
    if (i) i.value = '';
}

// Upload form submit
document.getElementById('upload-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();

    const category = document.getElementById('upload-category')?.value;
    const title = document.getElementById('upload-title')?.value.trim();
    const description = document.getElementById('upload-description')?.value.trim();
    const file = document.getElementById('upload-file')?.files[0];

    if (!title) { showUploadError('Please enter a title.'); return; }
    if (!file) { showUploadError('Please select a file.'); return; }
    if (file.size > 50 * 1024 * 1024) { showUploadError('File exceeds 50MB limit.'); return; }

    const btn = document.getElementById('upload-submit-btn');
    const progressContainer = document.getElementById('upload-progress-container');
    const progressBar = document.getElementById('upload-progress-bar');
    const percentText = document.getElementById('upload-percent');

    if (btn) { btn.disabled = true; btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i><span>Uploading...</span>'; }
    if (progressContainer) progressContainer.classList.remove('hidden');

    const errEl = document.getElementById('upload-error');
    if (errEl) errEl.classList.add('hidden');

    try {
        const timestamp = Date.now();
        const ext = file.name.match(/\.[^.]+$/) ? file.name.match(/\.[^.]+$/)[0] : '';
        const safeName = file.name.replace(/[^a-zA-Z0-9]/g, '_').substring(0, 40);
        const storagePath = `materials/${pageYear}/${pageBranch}/${pageSubject}/${category}/${timestamp}_${safeName}${ext}`;

        const storageRef = storage.ref(storagePath);
        const metadata = {
            contentType: file.type || 'application/octet-stream',
            customMetadata: { uploadedBy: currentUser.uid, originalName: file.name }
        };

        const uploadTask = storageRef.put(file, metadata);

        uploadTask.on('state_changed',
            (snapshot) => {
                const progress = Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100);
                if (progressBar) progressBar.style.width = progress + '%';
                if (percentText) percentText.textContent = progress + '%';
            },
            (error) => {
                console.error('Upload failed:', error);
                showUploadError('Upload failed: ' + error.message);
                if (btn) { btn.disabled = false; btn.innerHTML = '<i class="fas fa-cloud-upload-alt"></i><span>Upload Material</span>'; }
                if (progressContainer) progressContainer.classList.add('hidden');
            },
            async () => {
                try {
                    const downloadURL = await uploadTask.snapshot.ref.getDownloadURL();

                    await db.collection('materials').add({
                        title: title,
                        description: description || '',
                        fileURL: downloadURL,
                        fileType: file.type || '',
                        fileSize: file.size || 0,
                        year: pageYear,
                        branch: pageBranch,
                        subject: pageSubject,
                        category: category,
                        uploaderId: currentUser.uid,
                        uploaderName: currentUserData?.name || currentUser.displayName || 'Anonymous',
                        upvotes: 0,
                        createdAt: firebase.firestore.FieldValue.serverTimestamp()
                    });

                    hideUploadModal();
                    showToast('Uploaded successfully! 🎉', 'success');
                    if (category === activeCategory) loadCategoryFiles();
                    loadAllCategoryCounts();
                } catch (saveErr) {
                    console.error('Save error:', saveErr);
                    showUploadError('File uploaded but metadata save failed.');
                    if (btn) { btn.disabled = false; btn.innerHTML = '<i class="fas fa-cloud-upload-alt"></i><span>Upload Material</span>'; }
                }
            }
        );
    } catch (error) {
        console.error('Upload error:', error);
        showUploadError(error.message);
        if (btn) { btn.disabled = false; btn.innerHTML = '<i class="fas fa-cloud-upload-alt"></i><span>Upload Material</span>'; }
        if (progressContainer) progressContainer.classList.add('hidden');
    }
});

function showUploadError(message) {
    const el = document.getElementById('upload-error');
    const text = document.getElementById('upload-error-text');
    if (text) text.textContent = message;
    if (el) el.classList.remove('hidden');
}

// ==================== AUTH STATE OBSERVER ====================
// Only use ONE observer — prevent double initialization
let authHandled = false;

auth.onAuthStateChanged(async (user) => {
    if (authHandled) return;

    const loadingOverlay = document.getElementById('loading-overlay');

    if (!user) {
        window.location.href = 'index.html';
        return;
    }

    authHandled = true;
    currentUser = user;

    try {
        const userDoc = await db.collection('users').doc(user.uid).get();
        if (userDoc.exists) currentUserData = userDoc.data();
    } catch (err) {
        console.error('Error loading user:', err);
    }

    // Update nav
    const initial = document.getElementById('user-avatar-initial');
    const displayName = document.getElementById('user-display-name');
    if (initial && currentUserData) initial.textContent = (currentUserData.name || 'U').charAt(0).toUpperCase();
    if (displayName && currentUserData) displayName.textContent = currentUserData.name || 'User';

    // Initialize page ONCE
    initSubjectPage();

    // Load votes then refresh to show correct states
    await loadUserVotes();
    loadCategoryFiles();

    // Hide loading
    if (loadingOverlay) {
        loadingOverlay.style.opacity = '0';
        loadingOverlay.style.transition = 'opacity 0.3s ease';
        setTimeout(() => { loadingOverlay.style.display = 'none'; }, 300);
    }
});