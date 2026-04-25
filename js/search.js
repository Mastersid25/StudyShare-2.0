// ==================== GLOBAL SEARCH MODULE ====================

let searchTimeout = null;
const SEARCH_DELAY = 350; // ms debounce

// ---- Initialize Search ----
function initSearch() {
    const searchInput = document.getElementById('global-search-input');
    const mobileSearchInput = document.getElementById('mobile-search-input');

    if (searchInput) {
        searchInput.addEventListener('input', (e) => handleSearchInput(e.target.value, 'search-results-dropdown'));
        searchInput.addEventListener('focus', (e) => {
            if (e.target.value.trim().length >= 2) {
                document.getElementById('search-results-dropdown')?.classList.remove('hidden');
            }
        });

        // Close dropdown on click outside
        document.addEventListener('click', (e) => {
            if (!searchInput.contains(e.target) && !document.getElementById('search-results-dropdown')?.contains(e.target)) {
                document.getElementById('search-results-dropdown')?.classList.add('hidden');
            }
        });
    }

    // Mobile search
    if (mobileSearchInput) {
        mobileSearchInput.addEventListener('input', (e) => handleSearchInput(e.target.value, 'mobile-search-results'));
    }
}

// ---- Handle Search Input with Debounce ----
function handleSearchInput(query, dropdownId) {
    clearTimeout(searchTimeout);

    const dropdown = document.getElementById(dropdownId);
    query = query.trim();

    if (query.length < 2) {
        if (dropdown) {
            dropdown.classList.add('hidden');
            dropdown.innerHTML = '';
        }
        return;
    }

    // Show loading state
    if (dropdown) {
        dropdown.classList.remove('hidden');
        dropdown.innerHTML = `
            <div class="p-4 text-center">
                <i class="fas fa-spinner fa-spin text-primary-500 mr-2"></i>
                <span class="text-sm text-surface-500">Searching...</span>
            </div>
        `;
    }

    searchTimeout = setTimeout(() => {
        performSearch(query, dropdownId);
    }, SEARCH_DELAY);
}

// ---- Perform Firestore Search ----
async function performSearch(query, dropdownId) {
    const dropdown = document.getElementById(dropdownId);
    if (!dropdown) return;

    try {
        // Search by title (case-insensitive using lowercase comparison)
        // Firestore doesn't support native full-text search, so we'll do a prefix search
        // and also client-side filtering

        const queryLower = query.toLowerCase();

        // Get all materials (limited) and filter client-side
        // In production, consider Algolia or Firebase Extensions for full-text search
        const snapshot = await db.collection('materials')
            .orderBy('createdAt', 'desc')
            .limit(100) // Reasonable limit for client-side filtering
            .get();

        const results = [];

        snapshot.forEach((doc) => {
            const data = doc.data();
            const titleLower = (data.title || '').toLowerCase();
            const subjectLower = (data.subject || '').toLowerCase();
            const descLower = (data.description || '').toLowerCase();

            if (titleLower.includes(queryLower) || subjectLower.includes(queryLower) || descLower.includes(queryLower)) {
                results.push({ id: doc.id, ...data });
            }
        });

        // Also search subjects (static data)
        const subjectMatches = [];
        Object.entries(SUBJECTS_DATA).forEach(([year, branches]) => {
            Object.entries(branches).forEach(([branch, subjects]) => {
                const subjectList = Array.isArray(subjects) ? subjects : [];
                subjectList.forEach((subject) => {
                    if (subject.toLowerCase().includes(queryLower)) {
                        subjectMatches.push({ year, branch: branch === '_common' ? 'Comp' : branch, subject });
                    }
                });
            });
        });

        // Render results
        renderSearchResults(results, subjectMatches, dropdown, query);

    } catch (error) {
        console.error('Search error:', error);
        dropdown.innerHTML = `
            <div class="p-4 text-center text-sm text-red-500">
                <i class="fas fa-exclamation-circle mr-1"></i> Search error. Please try again.
            </div>
        `;
    }
}

// ---- Render Search Results ----
function renderSearchResults(fileResults, subjectResults, dropdown, query) {
    if (fileResults.length === 0 && subjectResults.length === 0) {
        dropdown.innerHTML = `
            <div class="p-6 text-center">
                <div class="w-12 h-12 bg-surface-100 rounded-xl flex items-center justify-center mx-auto mb-3">
                    <i class="fas fa-search text-surface-400"></i>
                </div>
                <p class="text-sm font-medium text-surface-600">No results found</p>
                <p class="text-xs text-surface-400 mt-1">Try different keywords or check spelling</p>
            </div>
        `;
        return;
    }

    let html = '';

    // Subject matches
    if (subjectResults.length > 0) {
        html += `<div class="px-4 py-2 bg-surface-50 border-b border-surface-100">
            <span class="text-xs font-semibold text-surface-400 uppercase tracking-wider">Subjects</span>
        </div>`;

        // Deduplicate subjects
        const uniqueSubjects = [];
        const seen = new Set();
        subjectResults.forEach(s => {
            const key = `${s.year}-${s.branch}-${s.subject}`;
            if (!seen.has(key)) {
                seen.add(key);
                uniqueSubjects.push(s);
            }
        });

        uniqueSubjects.slice(0, 5).forEach((item) => {
            html += `
                <a href="subject.html?year=${item.year}&branch=${item.branch}&subject=${encodeURIComponent(item.subject)}"
                    class="flex items-center gap-3 px-4 py-3 hover:bg-surface-50 transition-colors border-b border-surface-50">
                    <div class="w-8 h-8 bg-primary-50 rounded-lg flex items-center justify-center flex-shrink-0">
                        <i class="fas fa-book-open text-primary-500 text-xs"></i>
                    </div>
                    <div class="min-w-0">
                        <p class="text-sm font-medium text-surface-800 truncate">${highlightMatch(item.subject, query)}</p>
                        <p class="text-xs text-surface-400">${item.year} • ${getBranchFullName(item.branch)}</p>
                    </div>
                    <i class="fas fa-arrow-right text-xs text-surface-300 ml-auto"></i>
                </a>
            `;
        });
    }

    // File matches
    if (fileResults.length > 0) {
        html += `<div class="px-4 py-2 bg-surface-50 border-b border-surface-100">
            <span class="text-xs font-semibold text-surface-400 uppercase tracking-wider">Files (${fileResults.length})</span>
        </div>`;

        fileResults.slice(0, 8).forEach((item) => {
            html += `
                <a href="subject.html?year=${item.year}&branch=${item.branch}&subject=${encodeURIComponent(item.subject)}"
                    class="flex items-center gap-3 px-4 py-3 hover:bg-surface-50 transition-colors border-b border-surface-50">
                    <div class="w-8 h-8 bg-surface-100 rounded-lg flex items-center justify-center flex-shrink-0">
                        <i class="fas ${getFileIcon(item.fileType)} text-xs"></i>
                    </div>
                    <div class="min-w-0 flex-1">
                        <p class="text-sm font-medium text-surface-800 truncate">${highlightMatch(item.title, query)}</p>
                        <p class="text-xs text-surface-400">${escapeHTML(item.subject)} • ${getCategoryName(item.category)} • <i class="fas fa-arrow-up text-[10px]"></i> ${item.upvotes || 0}</p>
                    </div>
                    <i class="fas fa-arrow-right text-xs text-surface-300"></i>
                </a>
            `;
        });
    }

    dropdown.innerHTML = html;
}

// ---- Highlight Matching Text ----
function highlightMatch(text, query) {
    if (!query) return escapeHTML(text);
    const escaped = escapeHTML(text);
    const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    return escaped.replace(regex, '<mark class="bg-yellow-200 text-yellow-900 rounded px-0.5">$1</mark>');
}

// ---- Initialize on page load ----
document.addEventListener('DOMContentLoaded', initSearch);