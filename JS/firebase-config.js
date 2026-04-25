// ==================== FIREBASE CONFIGURATION ====================
// Go to Firebase Console > Project Settings > Your apps > Config

const firebaseConfig = {
    apiKey: "AIzaSyAdeB0UQrYVaXA0LeyaT1L0CadU0sf0Pkw",
    authDomain: "studyshare-2.firebaseapp.com",
    projectId: "studyshare-2",
    storageBucket: "studyshare-2.firebasestorage.app",
    messagingSenderId: "170241193343",
    appId: "1:170241193343:web:b133dddedbec0bd867964a",
    measurementId: "G-23PWPP3ZJR"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);

// Initialize services
const auth = firebase.auth();
const db = firebase.firestore();
const storage = firebase.storage();

// Enable Firestore offline persistence (optional but recommended)
db.enablePersistence({ synchronizeTabs: true }).catch((err) => {
    if (err.code === 'failed-precondition') {
        console.warn('Firestore persistence failed: Multiple tabs open');
    } else if (err.code === 'unimplemented') {
        console.warn('Firestore persistence not available in this browser');
    }
});

// ==================== SUBJECT DATA ====================
// This maps Year + Branch to the relevant subjects
const SUBJECTS_DATA = {
    FE: {
        // First Year is common for all branches
        _common: [
            "Engineering Mathematics I",
            "Engineering Physics",
            "Engineering Chemistry",
            "Engineering Mechanics",
            "Basic Electrical Engineering",
            "Engineering Mathematics II",
            "Engineering Graphics",
            "C Programming",
            "Professional Communication Skills",
            "Environmental Studies"
        ]
    },
    SE: {
        Comp: [
            "Engineering Mathematics III",
            "Data Structures",
            "Database Management System",
            "Discrete Mathematics",
            "Digital Logic Design & Analysis",
            "Computer Graphics",
            "Operating Systems",
            "Microprocessor",
            "Probability & Statistics"
        ],
        AIML: [
            "Engineering Mathematics III",
            "Data Structures",
            "Database Management System",
            "Discrete Mathematics",
            "Digital Logic Design",
            "Fundamentals of AI",
            "Probability and Statistics",
            "Object Oriented Programming",
            "Computer Organization"
        ],
        DS: [
            "Engineering Mathematics III",
            "Data Structures",
            "Database Management System",
            "Discrete Mathematics",
            "Fundamentals of Data Science",
            "Probability and Statistics",
            "Python Programming",
            "Computer Organization",
            "Object Oriented Programming"
        ],
        EXTC: [
            "Engineering Mathematics III",
            "Electronic Devices & Circuits",
            "Digital System Design",
            "Network Analysis",
            "Signals and Systems",
            "Electromagnetic Engineering",
            "Analog Electronics",
            "Control Systems",
            "Probability & Statistics"
        ],
        Civil: [
            "Engineering Mathematics III",
            "Strength of Materials",
            "Fluid Mechanics I",
            "Surveying",
            "Building Materials & Construction",
            "Engineering Geology",
            "Concrete Technology",
            "Structural Analysis I",
            "Environmental Engineering I"
        ],
        Mech: [
            "Engineering Mathematics III",
            "Thermodynamics",
            "Strength of Materials",
            "Production Process I",
            "Fluid Mechanics",
            "Material Science",
            "Kinematics of Machinery",
            "Machine Drawing",
            "Probability & Statistics"
        ]
    },
    TE: {
        Comp: [
            "Theory of Computation",
            "Software Engineering",
            "Computer Networks",
            "Data Warehouse & Mining",
            "Cryptography & System Security",
            "Machine Learning",
            "Web Technology",
            "Distributed Computing",
            "Compiler Design"
        ],
        AIML: [
            "Machine Learning",
            "Natural Language Processing",
            "Computer Vision",
            "Deep Learning",
            "Software Engineering",
            "Computer Networks",
            "Data Mining",
            "Reinforcement Learning",
            "AI Ethics"
        ],
        DS: [
            "Machine Learning",
            "Big Data Analytics",
            "Data Visualization",
            "Statistical Methods",
            "Computer Networks",
            "Software Engineering",
            "Natural Language Processing",
            "Deep Learning",
            "Cloud Computing"
        ],
        EXTC: [
            "Microprocessors & Microcontrollers",
            "Digital Communication",
            "Computer Networks",
            "Power Electronics",
            "Antenna & Wave Propagation",
            "Television Engineering",
            "Embedded Systems",
            "VLSI Design",
            "Optical Communication"
        ],
        Civil: [
            "Structural Analysis II",
            "Geotechnical Engineering",
            "Water Resources Engineering",
            "Transportation Engineering I",
            "Design of Steel Structures",
            "Environmental Engineering II",
            "Quantity Surveying",
            "Construction Management",
            "Advanced Surveying"
        ],
        Mech: [
            "Heat Transfer",
            "Theory of Machines I",
            "Machine Design I",
            "Internal Combustion Engines",
            "Metrology & Quality Control",
            "Production Process II",
            "Refrigeration & Air Conditioning",
            "Finite Element Analysis",
            "Mechatronics"
        ]
    },
    BE: {
        Comp: [
            "Artificial Intelligence",
            "High Performance Computing",
            "Data Analytics",
            "Software Testing & QA",
            "Cloud Computing",
            "Information Security",
            "Blockchain Technology",
            "Internet of Things",
            "Human Computer Interaction"
        ],
        AIML: [
            "Advanced Deep Learning",
            "Generative AI",
            "Robotics & Intelligent Systems",
            "AI in Healthcare",
            "Cloud & Edge AI",
            "Explainable AI",
            "Advanced NLP",
            "AI for Business Intelligence",
            "Capstone Project"
        ],
        DS: [
            "Advanced Machine Learning",
            "Data Engineering",
            "Time Series Analysis",
            "Recommender Systems",
            "Business Intelligence",
            "Cloud Data Platforms",
            "Data Privacy & Ethics",
            "Advanced Deep Learning",
            "Capstone Project"
        ],
        EXTC: [
            "Wireless Communication",
            "Satellite Communication",
            "Image Processing",
            "Radar Engineering",
            "Mobile Communication",
            "Advanced Networking",
            "Speech Processing",
            "RF Circuit Design",
            "IoT Systems"
        ],
        Civil: [
            "Design of RCC Structures",
            "Transportation Engineering II",
            "Advanced Structural Design",
            "Earthquake Engineering",
            "Project Management",
            "Urban Planning",
            "Bridge Engineering",
            "Estimation & Valuation",
            "Environmental Impact Assessment"
        ],
        Mech: [
            "CAD/CAM",
            "Power Plant Engineering",
            "Automobile Engineering",
            "Machine Design II",
            "Industrial Engineering",
            "Operations Research",
            "Robotics",
            "Advanced Manufacturing",
            "Project Management"
        ]
    }
};

// ==================== HELPER FUNCTIONS ====================

/**
 * Get subjects for a given year and branch
 */
function getSubjects(year, branch) {
    if (!year || !branch) return [];
    if (year === 'FE') {
        return SUBJECTS_DATA.FE._common || [];
    }
    return (SUBJECTS_DATA[year] && SUBJECTS_DATA[year][branch]) || [];
}

/**
 * Get full year name
 */
function getYearFullName(year) {
    const map = {
        FE: 'First Year Engineering',
        SE: 'Second Year Engineering',
        TE: 'Third Year Engineering',
        BE: 'Final Year Engineering'
    };
    return map[year] || year;
}

/**
 * Get full branch name
 */
function getBranchFullName(branch) {
    const map = {
        Comp: 'Computer Engineering',
        AIML: 'AI & Machine Learning',
        DS: 'Data Science',
        EXTC: 'Electronics & Telecom',
        Civil: 'Civil Engineering',
        Mech: 'Mechanical Engineering'
    };
    return map[branch] || branch;
}

/**
 * Show a toast notification
 */
function showToast(message, type = 'info', duration = 4000) {
    const container = document.getElementById('toast-container');
    if (!container) return;

    const iconMap = {
        success: 'fa-check-circle text-green-500',
        error: 'fa-exclamation-circle text-red-500',
        info: 'fa-info-circle text-blue-500',
        warning: 'fa-exclamation-triangle text-amber-500'
    };

    const bgMap = {
        success: 'bg-green-50 border-green-200',
        error: 'bg-red-50 border-red-200',
        info: 'bg-blue-50 border-blue-200',
        warning: 'bg-amber-50 border-amber-200'
    };

    const toast = document.createElement('div');
    toast.className = `toast-enter flex items-center gap-3 px-5 py-4 rounded-xl shadow-lg border ${bgMap[type] || bgMap.info} max-w-sm`;
    toast.innerHTML = `
        <i class="fas ${iconMap[type] || iconMap.info}"></i>
        <span class="text-sm font-medium text-surface-700">${message}</span>
        <button onclick="this.parentElement.remove()" class="ml-auto text-surface-400 hover:text-surface-600 transition-colors">
            <i class="fas fa-times text-xs"></i>
        </button>
    `;

    container.appendChild(toast);

    setTimeout(() => {
        toast.classList.add('toast-exit');
        setTimeout(() => toast.remove(), 300);
    }, duration);
}

/**
 * Format file size
 */
function formatFileSize(bytes) {
    if (!bytes) return 'Unknown';
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / 1048576).toFixed(1) + ' MB';
}

/**
 * Format date
 */
function formatDate(timestamp) {
    if (!timestamp) return 'Unknown';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    const now = new Date();
    const diff = now - date;
    const days = Math.floor(diff / 86400000);

    if (days === 0) return 'Today';
    if (days === 1) return 'Yesterday';
    if (days < 7) return days + ' days ago';
    if (days < 30) return Math.floor(days / 7) + 'w ago';

    return date.toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
    });
}

/**
 * Get file icon based on type
 */
function getFileIcon(fileType) {
    if (!fileType) return 'fa-file text-surface-400';
    if (fileType.includes('pdf')) return 'fa-file-pdf text-red-500';
    if (fileType.includes('image')) return 'fa-file-image text-purple-500';
    if (fileType.includes('word') || fileType.includes('document')) return 'fa-file-word text-blue-500';
    if (fileType.includes('presentation') || fileType.includes('powerpoint')) return 'fa-file-powerpoint text-orange-500';
    if (fileType.includes('spreadsheet') || fileType.includes('excel')) return 'fa-file-excel text-green-500';
    if (fileType.includes('zip') || fileType.includes('rar')) return 'fa-file-archive text-amber-500';
    return 'fa-file text-surface-400';
}

/**
 * Get category icon
 */
function getCategoryIcon(category) {
    const map = {
        notes: 'fa-sticky-note text-blue-500',
        textbooks: 'fa-book text-emerald-500',
        'question-papers': 'fa-question-circle text-purple-500',
        'paper-solutions': 'fa-check-double text-amber-500'
    };
    return map[category] || 'fa-folder text-surface-400';
}

/**
 * Get category display name
 */
function getCategoryName(category) {
    const map = {
        notes: 'Notes',
        textbooks: 'Textbooks',
        'question-papers': 'Question Papers',
        'paper-solutions': 'Paper Solutions'
    };
    return map[category] || category;
}

/**
 * Escape HTML to prevent XSS
 */
function escapeHTML(str) {
    if (!str) return '';
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}