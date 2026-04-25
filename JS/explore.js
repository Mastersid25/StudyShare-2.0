// ==================== EXPLORE MODULE ====================

// Subject color palette for visual variety
const SUBJECT_COLORS = [
    { bg: 'bg-blue-50', border: 'border-blue-200', icon: 'text-blue-500', hover: 'hover:border-blue-300 hover:shadow-blue-100' },
    { bg: 'bg-purple-50', border: 'border-purple-200', icon: 'text-purple-500', hover: 'hover:border-purple-300 hover:shadow-purple-100' },
    { bg: 'bg-emerald-50', border: 'border-emerald-200', icon: 'text-emerald-500', hover: 'hover:border-emerald-300 hover:shadow-emerald-100' },
    { bg: 'bg-amber-50', border: 'border-amber-200', icon: 'text-amber-500', hover: 'hover:border-amber-300 hover:shadow-amber-100' },
    { bg: 'bg-rose-50', border: 'border-rose-200', icon: 'text-rose-500', hover: 'hover:border-rose-300 hover:shadow-rose-100' },
    { bg: 'bg-cyan-50', border: 'border-cyan-200', icon: 'text-cyan-500', hover: 'hover:border-cyan-300 hover:shadow-cyan-100' },
    { bg: 'bg-indigo-50', border: 'border-indigo-200', icon: 'text-indigo-500', hover: 'hover:border-indigo-300 hover:shadow-indigo-100' },
    { bg: 'bg-orange-50', border: 'border-orange-200', icon: 'text-orange-500', hover: 'hover:border-orange-300 hover:shadow-orange-100' },
    { bg: 'bg-teal-50', border: 'border-teal-200', icon: 'text-teal-500', hover: 'hover:border-teal-300 hover:shadow-teal-100' },
    { bg: 'bg-pink-50', border: 'border-pink-200', icon: 'text-pink-500', hover: 'hover:border-pink-300 hover:shadow-pink-100' }
];

const SUBJECT_ICONS = [
    'fa-calculator', 'fa-atom', 'fa-flask', 'fa-cogs', 'fa-bolt',
    'fa-code', 'fa-database', 'fa-network-wired', 'fa-brain',
    'fa-microchip', 'fa-chart-bar', 'fa-shield-alt', 'fa-cloud',
    'fa-project-diagram', 'fa-laptop-code', 'fa-robot', 'fa-server',
    'fa-drafting-compass', 'fa-hard-hat', 'fa-car'
];

// ---- Render Subject Grid ----
function renderSubjects() {
    const yearSelect = document.getElementById('select-year');
    const branchSelect = document.getElementById('select-branch');
    const year = yearSelect.value;
    const branch = branchSelect.value;

    if (!year) {
        showToast('Please select a year', 'warning');
        return;
    }
    if (!branch && year !== 'FE') {
        showToast('Please select a branch', 'warning');
        return;
    }

    const effectiveBranch = year === 'FE' ? (branch || 'Comp') : branch;
    const subjects = getSubjects(year, effectiveBranch);
    const grid = document.getElementById('subjects-grid');
    const emptyState = document.getElementById('empty-state');
    const selectionInfo = document.getElementById('selection-info');

    if (subjects.length === 0) {
        grid.innerHTML = '';
        if (emptyState) grid.appendChild(emptyState);
        emptyState?.classList.remove('hidden');
        selectionInfo?.classList.add('hidden');
        showToast('No subjects found for this combination', 'info');
        return;
    }

    // Update info banner
    selectionInfo?.classList.remove('hidden');
    document.getElementById('info-year').textContent = getYearFullName(year);
    document.getElementById('info-branch').textContent = year === 'FE' ? 'All Branches (Common)' : getBranchFullName(effectiveBranch);
    document.getElementById('subject-count').textContent = `${subjects.length} subjects`;

    // Render cards
    grid.innerHTML = '';
    subjects.forEach((subject, index) => {
        const color = SUBJECT_COLORS[index % SUBJECT_COLORS.length];
        const icon = SUBJECT_ICONS[index % SUBJECT_ICONS.length];

        const card = document.createElement('a');
        card.href = `subject.html?year=${year}&branch=${effectiveBranch}&subject=${encodeURIComponent(subject)}`;
        card.className = `group bg-white rounded-2xl border ${color.border} shadow-sm p-6 transition-all duration-200 ${color.hover} hover:shadow-lg hover:-translate-y-1 cursor-pointer block`;
        card.innerHTML = `
            <div class="w-12 h-12 ${color.bg} rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <i class="fas ${icon} ${color.icon} text-lg"></i>
            </div>
            <h3 class="font-semibold text-surface-800 mb-1 text-sm leading-snug group-hover:text-primary-700 transition-colors">${escapeHTML(subject)}</h3>
            <div class="flex items-center gap-1 mt-3 text-xs text-surface-400">
                <span>${year}</span>
                <span>•</span>
                <span>${effectiveBranch}</span>
            </div>
            <div class="mt-3 flex items-center gap-1 text-xs text-primary-600 opacity-0 group-hover:opacity-100 transition-opacity">
                <span>Open resources</span>
                <i class="fas fa-arrow-right text-[10px]"></i>
            </div>
        `;
        grid.appendChild(card);
    });
}

// ---- Auto-fill from user profile ----
function autoFillSelection(userData) {
    if (!userData) return;

    const yearSelect = document.getElementById('select-year');
    const branchSelect = document.getElementById('select-branch');
    const quickSelect = document.getElementById('quick-select');

    if (userData.year) yearSelect.value = userData.year;
    if (userData.branch) branchSelect.value = userData.branch;

    // Show quick select button
    if (userData.year && userData.branch) {
        quickSelect?.classList.remove('hidden');
        document.getElementById('quick-year').textContent = userData.year;
        document.getElementById('quick-branch').textContent = getBranchFullName(userData.branch);

        document.getElementById('quick-my-subjects')?.addEventListener('click', () => {
            yearSelect.value = userData.year;
            branchSelect.value = userData.branch;
            renderSubjects();
        });

        // Auto-render on page load
        renderSubjects();
    }
}

// ---- Handle FE year - disable branch requirement ----
document.getElementById('select-year')?.addEventListener('change', function () {
    const branchSelect = document.getElementById('select-branch');
    if (this.value === 'FE') {
        branchSelect.value = branchSelect.value || 'Comp';
        // Still allow selection but FE is common
    }
});

// ---- Auth State Observer for Explore Page ----
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
            autoFillSelection(currentUserData);
        }
    } catch (err) {
        console.error('Error loading user data:', err);
    }

    // Update nav
    const initial = document.getElementById('user-avatar-initial');
    const displayName = document.getElementById('user-display-name');
    if (initial && currentUserData) initial.textContent = (currentUserData.name || 'U').charAt(0).toUpperCase();
    if (displayName && currentUserData) displayName.textContent = currentUserData.name || 'User';

    // Hide loading
    if (loadingOverlay) {
        setTimeout(() => {
            loadingOverlay.style.opacity = '0';
            loadingOverlay.style.transition = 'opacity 0.3s ease';
            setTimeout(() => loadingOverlay.style.display = 'none', 300);
        }, 300);
    }
});