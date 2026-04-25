// ==================== PROFILE MODULE ====================

let deleteTargetId = null;
let deleteTargetFileURL = null;

// ---- Load Profile Data ----
function loadProfile(userData) {
    if (!userData) return;

    // Set profile card info
    document.getElementById('profile-avatar').textContent = (userData.name || 'U').charAt(0).toUpperCase();
    document.getElementById('profile-name').textContent = userData.name || 'User';
    document.getElementById('profile-email').textContent = userData.email || '';

    // Year badge
    const yearBadge = document.getElementById('profile-year-badge');
    yearBadge.textContent = userData.year || '--';
    yearBadge.className = `px-3 py-1 text-xs font-semibold rounded-full badge-${(userData.year || '').toLowerCase()}`;

    // Branch
    document.getElementById('profile-branch').textContent = getBranchFullName(userData.branch) || '--';

    // Joined date
    if (userData.createdAt) {
        const date = userData.createdAt.toDate ? userData.createdAt.toDate() : new Date(userData.createdAt);
        document.getElementById('profile-joined').textContent = date.toLocaleDateString('en-IN', {
            month: 'long',
            year: 'numeric'
        });
    }

    // Fill edit form
    document.getElementById('edit-name').value = userData.name || '';
    document.getElementById('edit-year').value = userData.year || 'FE';
    document.getElementById('edit-branch').value = userData.branch || 'Comp';
}

// ---- Load User Uploads ----
async function loadMyUploads(userId) {
    const listContainer = document.getElementById('my-uploads-list');
    const noUploads = document.getElementById('no-uploads');
    const countBadge = document.getElementById('uploads-count-badge');
    const profileCount = document.getElementById('profile-upload-count');

    try {
        const snapshot = await db.collection('materials')
            .where('uploaderId', '==', userId)
            .orderBy('createdAt', 'desc')
            .get();

        const count = snapshot.size;
        countBadge.textContent = count;
        profileCount.textContent = count;

        if (count === 0) {
            listContainer.innerHTML = '';
            noUploads.classList.remove('hidden');
            return;
        }

        noUploads.classList.add('hidden');
        listContainer.innerHTML = '';

        snapshot.forEach((doc) => {
            const data = doc.data();
            const card = createUploadCard(doc.id, data);
            listContainer.appendChild(card);
        });
    } catch (error) {
        console.error('Error loading uploads:', error);
        listContainer.innerHTML = `
            <div class="p-8 text-center">
                <p class="text-red-500 text-sm"><i class="fas fa-exclamation-circle mr-1"></i> Error loading uploads. Please try again.</p>
            </div>
        `;
    }
}

// ---- Create Upload Card ----
function createUploadCard(id, data) {
    const div = document.createElement('div');
    div.className = 'flex items-center gap-4 px-6 py-4 hover:bg-surface-50 transition-colors group';
    div.innerHTML = `
        <div class="w-10 h-10 bg-surface-100 rounded-xl flex items-center justify-center flex-shrink-0">
            <i class="fas ${getFileIcon(data.fileType)} text-lg"></i>
        </div>
        <div class="flex-1 min-w-0">
            <h4 class="text-sm font-semibold text-surface-800 truncate">${escapeHTML(data.title)}</h4>
            <div class="flex items-center gap-3 mt-1 text-xs text-surface-400">
                <span><i class="fas fa-folder-open mr-1"></i>${escapeHTML(data.subject)}</span>
                <span class="hidden sm:inline">•</span>
                <span class="hidden sm:inline">${getCategoryName(data.category)}</span>
                <span>•</span>
                <span>${formatDate(data.createdAt)}</span>
            </div>
        </div>
        <div class="flex items-center gap-1.5">
            <span class="flex items-center gap-1 px-2 py-1 bg-primary-50 text-primary-600 rounded-lg text-xs font-medium">
                <i class="fas fa-arrow-up text-[10px]"></i>${data.upvotes || 0}
            </span>
            <a href="${data.fileURL}" target="_blank" class="w-8 h-8 flex items-center justify-center rounded-lg text-surface-400 hover:text-primary-600 hover:bg-primary-50 transition-all" title="Open file">
                <i class="fas fa-external-link-alt text-xs"></i>
            </a>
            <button onclick="showDeleteModal('${id}', '${data.fileURL}')" class="w-8 h-8 flex items-center justify-center rounded-lg text-surface-400 hover:text-red-600 hover:bg-red-50 transition-all opacity-0 group-hover:opacity-100" title="Delete">
                <i class="fas fa-trash-alt text-xs"></i>
            </button>
        </div>
    `;
    return div;
}

// ---- Edit Profile ----
document.getElementById('edit-profile-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();

    const name = document.getElementById('edit-name').value.trim();
    const year = document.getElementById('edit-year').value;
    const branch = document.getElementById('edit-branch').value;

    if (!name) {
        showToast('Please enter your name', 'warning');
        return;
    }

    const btn = document.getElementById('save-profile-btn');
    const status = document.getElementById('save-status');
    btn.disabled = true;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Saving...';

    try {
        const user = auth.currentUser;

        // Update Firestore
        await db.collection('users').doc(user.uid).update({
            name: name,
            year: year,
            branch: branch
        });

        // Update Auth profile
        await user.updateProfile({ displayName: name });

        // Update local data
        currentUserData.name = name;
        currentUserData.year = year;
        currentUserData.branch = branch;

        // Refresh profile display
        loadProfile(currentUserData);

        // Update navbar
        document.getElementById('user-avatar-initial').textContent = name.charAt(0).toUpperCase();
        document.getElementById('user-display-name').textContent = name;

        status.classList.remove('hidden');
        setTimeout(() => status.classList.add('hidden'), 3000);

        showToast('Profile updated successfully!', 'success');
    } catch (error) {
        console.error('Error updating profile:', error);
        showToast('Error updating profile. Please try again.', 'error');
    } finally {
        btn.disabled = false;
        btn.innerHTML = '<i class="fas fa-save"></i> Save Changes';
    }
});

// ---- Delete Upload ----
function showDeleteModal(id, fileURL) {
    deleteTargetId = id;
    deleteTargetFileURL = fileURL;
    document.getElementById('delete-modal').classList.remove('hidden');
    document.body.classList.add('modal-open');
}

function hideDeleteModal() {
    document.getElementById('delete-modal').classList.add('hidden');
    document.body.classList.remove('modal-open');
    deleteTargetId = null;
    deleteTargetFileURL = null;
}

async function confirmDelete() {
    if (!deleteTargetId) return;

    const btn = document.getElementById('confirm-delete-btn');
    btn.disabled = true;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Deleting...';

    try {
        // Delete from Firestore
        await db.collection('materials').doc(deleteTargetId).delete();

        // Delete from Storage
        if (deleteTargetFileURL) {
            try {
                const fileRef = storage.refFromURL(deleteTargetFileURL);
                await fileRef.delete();
            } catch (storageErr) {
                console.warn('Could not delete storage file:', storageErr);
            }
        }

        hideDeleteModal();
        showToast('File deleted successfully', 'success');

        // Refresh uploads list
        if (currentUser) {
            loadMyUploads(currentUser.uid);
        }
    } catch (error) {
        console.error('Error deleting file:', error);
        showToast('Error deleting file. Please try again.', 'error');
    } finally {
        btn.disabled = false;
        btn.innerHTML = '<i class="fas fa-trash-alt text-xs"></i> Delete';
    }
}

// ---- Auth State Observer for Profile Page ----
auth.onAuthStateChanged(async (user) => {
    const loadingOverlay = document.getElementById('loading-overlay');

    if (!user) {
        window.location.href = 'index.html';
        return;
    }

    currentUser = user;

    try {
        const userDoc = await db.collection('users').doc(user.uid).get();
        if (userDoc.exists) {
            currentUserData = userDoc.data();
            loadProfile(currentUserData);
        }
    } catch (err) {
        console.error('Error loading user data:', err);
    }

    // Update nav
    const initial = document.getElementById('user-avatar-initial');
    const displayName = document.getElementById('user-display-name');
    if (initial && currentUserData) initial.textContent = (currentUserData.name || 'U').charAt(0).toUpperCase();
    if (displayName && currentUserData) displayName.textContent = currentUserData.name || 'User';

    // Load uploads
    loadMyUploads(user.uid);

    // Hide loading
    if (loadingOverlay) {
        setTimeout(() => {
            loadingOverlay.style.opacity = '0';
            loadingOverlay.style.transition = 'opacity 0.3s ease';
            setTimeout(() => loadingOverlay.style.display = 'none', 300);
        }, 300);
    }
});