// ==================== AUTHENTICATION MODULE ====================

// ---- UI State Management ----

function showAuthModal(mode = 'login') {
    const modal = document.getElementById('auth-modal');
    const loginForm = document.getElementById('login-form');
    const signupForm = document.getElementById('signup-form');
    const forgotForm = document.getElementById('forgot-form');
    const title = document.getElementById('auth-title');
    const subtitle = document.getElementById('auth-subtitle');

    // Hide all forms
    loginForm.classList.add('hidden');
    signupForm.classList.add('hidden');
    forgotForm.classList.add('hidden');

    // Clear errors/success
    hideAuthMessages();

    // Show appropriate form
    if (mode === 'login') {
        loginForm.classList.remove('hidden');
        title.textContent = 'Welcome back';
        subtitle.textContent = 'Log in to access your study materials';
    } else if (mode === 'signup') {
        signupForm.classList.remove('hidden');
        title.textContent = 'Create your account';
        subtitle.textContent = 'Join the community of Mumbai University students';
    }

    modal.classList.remove('hidden');
    document.body.classList.add('modal-open');
}

function showForgotPassword() {
    const loginForm = document.getElementById('login-form');
    const signupForm = document.getElementById('signup-form');
    const forgotForm = document.getElementById('forgot-form');
    const title = document.getElementById('auth-title');
    const subtitle = document.getElementById('auth-subtitle');

    loginForm.classList.add('hidden');
    signupForm.classList.add('hidden');
    forgotForm.classList.remove('hidden');

    title.textContent = 'Reset your password';
    subtitle.textContent = "We'll send you a link to reset your password";

    hideAuthMessages();
}

function hideAuthModal() {
    const modal = document.getElementById('auth-modal');
    modal.classList.add('hidden');
    document.body.classList.remove('modal-open');
    hideAuthMessages();
}

function showAuthError(message) {
    const el = document.getElementById('auth-error');
    const text = document.getElementById('auth-error-text');
    const success = document.getElementById('auth-success');
    success.classList.add('hidden');
    text.textContent = message;
    el.classList.remove('hidden');
}

function showAuthSuccess(message) {
    const el = document.getElementById('auth-success');
    const text = document.getElementById('auth-success-text');
    const error = document.getElementById('auth-error');
    error.classList.add('hidden');
    text.textContent = message;
    el.classList.remove('hidden');
}

function hideAuthMessages() {
    document.getElementById('auth-error')?.classList.add('hidden');
    document.getElementById('auth-success')?.classList.add('hidden');
}

function togglePasswordVisibility(inputId, button) {
    const input = document.getElementById(inputId);
    const icon = button.querySelector('i');
    if (input.type === 'password') {
        input.type = 'text';
        icon.classList.replace('fa-eye', 'fa-eye-slash');
    } else {
        input.type = 'password';
        icon.classList.replace('fa-eye-slash', 'fa-eye');
    }
}

function toggleUserDropdown() {
    const dropdown = document.getElementById('user-dropdown');
    dropdown.classList.toggle('hidden');

    // Close on click outside
    if (!dropdown.classList.contains('hidden')) {
        setTimeout(() => {
            document.addEventListener('click', closeDropdownHandler);
        }, 0);
    }
}

function closeDropdownHandler(e) {
    const dropdown = document.getElementById('user-dropdown');
    const btn = document.getElementById('user-avatar-btn');
    if (!btn.contains(e.target) && !dropdown.contains(e.target)) {
        dropdown.classList.add('hidden');
        document.removeEventListener('click', closeDropdownHandler);
    }
}

function toggleMobileMenu() {
    const menu = document.getElementById('mobile-menu');
    menu.classList.toggle('hidden');
}

// ---- Set spinner state ----
function setButtonLoading(btnId, spinnerId, loading) {
    const btn = document.getElementById(btnId);
    const spinner = document.getElementById(spinnerId);
    if (loading) {
        btn.disabled = true;
        btn.classList.add('opacity-70', 'pointer-events-none');
        spinner?.classList.remove('hidden');
    } else {
        btn.disabled = false;
        btn.classList.remove('opacity-70', 'pointer-events-none');
        spinner?.classList.add('hidden');
    }
}

// ---- Firebase Auth Error Messages ----
function getAuthErrorMessage(code) {
    const messages = {
        'auth/email-already-in-use': 'This email is already registered. Try logging in instead.',
        'auth/invalid-email': 'Please enter a valid email address.',
        'auth/user-disabled': 'This account has been disabled. Contact support.',
        'auth/user-not-found': 'No account found with this email. Try signing up.',
        'auth/wrong-password': 'Incorrect password. Try again or reset your password.',
        'auth/weak-password': 'Password should be at least 6 characters.',
        'auth/too-many-requests': 'Too many attempts. Please try again later.',
        'auth/network-request-failed': 'Network error. Check your internet connection.',
        'auth/invalid-credential': 'Invalid email or password. Please try again.',
        'auth/missing-password': 'Please enter your password.'
    };
    return messages[code] || 'Something went wrong. Please try again.';
}

// ---- Form Submissions ----

// Login
document.getElementById('login-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    hideAuthMessages();

    const email = document.getElementById('login-email').value.trim();
    const password = document.getElementById('login-password').value;

    setButtonLoading('login-btn', 'login-spinner', true);

    try {
        await auth.signInWithEmailAndPassword(email, password);
        hideAuthModal();
        showToast('Welcome back! 🎉', 'success');
        // Auth state change listener will handle redirect
    } catch (error) {
        console.error('Login error:', error);
        showAuthError(getAuthErrorMessage(error.code));
    } finally {
        setButtonLoading('login-btn', 'login-spinner', false);
    }
});

// Signup
document.getElementById('signup-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    hideAuthMessages();

    const name = document.getElementById('signup-name').value.trim();
    const email = document.getElementById('signup-email').value.trim();
    const year = document.getElementById('signup-year').value;
    const branch = document.getElementById('signup-branch').value;
    const password = document.getElementById('signup-password').value;

    if (!name || !year || !branch) {
        showAuthError('Please fill in all fields including year and branch.');
        return;
    }

    setButtonLoading('signup-btn', 'signup-spinner', true);

    try {
        // Create user in Firebase Auth
        const userCredential = await auth.createUserWithEmailAndPassword(email, password);
        const user = userCredential.user;

        // Update display name
        await user.updateProfile({ displayName: name });

        // Create user document in Firestore
        await db.collection('users').doc(user.uid).set({
            uid: user.uid,
            name: name,
            email: email,
            year: year,
            branch: branch,
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
        });

        hideAuthModal();
        showToast('Account created successfully! Welcome to StudyShare 🎓', 'success');
    } catch (error) {
        console.error('Signup error:', error);
        showAuthError(getAuthErrorMessage(error.code));
    } finally {
        setButtonLoading('signup-btn', 'signup-spinner', false);
    }
});

// Forgot Password
document.getElementById('forgot-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    hideAuthMessages();

    const email = document.getElementById('forgot-email').value.trim();

    setButtonLoading('forgot-btn', 'forgot-spinner', true);

    try {
        await auth.sendPasswordResetEmail(email);
        showAuthSuccess('Password reset link sent! Check your email inbox.');
    } catch (error) {
        console.error('Forgot password error:', error);
        showAuthError(getAuthErrorMessage(error.code));
    } finally {
        setButtonLoading('forgot-btn', 'forgot-spinner', false);
    }
});

// Logout
async function handleLogout() {
    try {
        await auth.signOut();
        showToast('Logged out successfully', 'info');
        window.location.href = 'index.html';
    } catch (error) {
        console.error('Logout error:', error);
        showToast('Error logging out', 'error');
    }
}

// ---- Auth State Observer ----
let currentUser = null;
let currentUserData = null;

auth.onAuthStateChanged(async (user) => {
    const loadingOverlay = document.getElementById('loading-overlay');
    const landingContent = document.getElementById('landing-content');
    const authButtons = document.getElementById('auth-buttons');
    const userMenu = document.getElementById('user-menu');
    const navSearch = document.getElementById('nav-search');

    currentUser = user;

    if (user) {
        // User is logged in
        try {
            // Fetch user data from Firestore
            const userDoc = await db.collection('users').doc(user.uid).get();
            if (userDoc.exists) {
                currentUserData = userDoc.data();
            } else {
                // User doc doesn't exist yet (edge case), create basic one
                currentUserData = {
                    uid: user.uid,
                    name: user.displayName || 'User',
                    email: user.email,
                    year: '',
                    branch: ''
                };
            }
        } catch (err) {
            console.error('Error fetching user data:', err);
            currentUserData = {
                uid: user.uid,
                name: user.displayName || 'User',
                email: user.email,
                year: '',
                branch: ''
            };
        }

        // Update UI
        if (authButtons) authButtons.classList.add('hidden');
        if (userMenu) {
            userMenu.classList.remove('hidden');
            userMenu.classList.add('flex');
        }
        if (navSearch) navSearch.classList.remove('hidden');

        // Set user avatar
        const initial = document.getElementById('user-avatar-initial');
        const displayName = document.getElementById('user-display-name');
        if (initial) initial.textContent = (currentUserData.name || 'U').charAt(0).toUpperCase();
        if (displayName) displayName.textContent = currentUserData.name || 'User';

        // Show mobile menu items
        document.getElementById('mobile-explore-link')?.classList.remove('hidden');
        document.getElementById('mobile-profile-link')?.classList.remove('hidden');
        document.getElementById('mobile-logout-btn')?.classList.remove('hidden');
        document.getElementById('mobile-search')?.classList.remove('hidden');

        // If on landing page, redirect to explore
        if (landingContent && window.location.pathname.endsWith('index.html') || window.location.pathname === '/') {
            // Don't auto-redirect, let user stay on home if they want
            // But hide landing content visually or redirect
            window.location.href = 'explore.html';
        }
    } else {
        // User is logged out
        currentUserData = null;

        if (authButtons) {
            authButtons.classList.remove('hidden');
            authButtons.classList.add('flex');
        }
        if (userMenu) userMenu.classList.add('hidden');
        if (navSearch) navSearch.classList.add('hidden');

        // Hide mobile menu items
        document.getElementById('mobile-explore-link')?.classList.add('hidden');
        document.getElementById('mobile-profile-link')?.classList.add('hidden');
        document.getElementById('mobile-logout-btn')?.classList.add('hidden');
        document.getElementById('mobile-search')?.classList.add('hidden');

        // If on protected page, redirect to home
        const currentPage = window.location.pathname.split('/').pop();
        const protectedPages = ['profile.html', 'explore.html', 'subject.html'];
        if (protectedPages.includes(currentPage)) {
            window.location.href = 'index.html';
            return;
        }
    }

    // Hide loading overlay
    if (loadingOverlay) {
        setTimeout(() => {
            loadingOverlay.style.opacity = '0';
            loadingOverlay.style.transition = 'opacity 0.3s ease';
            setTimeout(() => {
                loadingOverlay.style.display = 'none';
            }, 300);
        }, 300);
    }
});