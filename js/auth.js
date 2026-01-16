// ==================== FIREBASE AUTHENTICATION ====================
// Complete Auth with Email/Password, Google Sign-in, Realtime Database

// ==================== FIREBASE CONFIGURATION ====================
const firebaseConfig = {
    apiKey: "AIzaSyDf4QSE3kw9HQD_ZWJ-DDZ8yN3hgRp4UaM",
    authDomain: "otp-auth-ff7fb.firebaseapp.com",
    projectId: "otp-auth-ff7fb",
    storageBucket: "otp-auth-ff7fb.firebasestorage.app",
    messagingSenderId: "945314024888",
    appId: "1:945314024888:web:1eb577611a4de09757934d",
    measurementId: "G-6HMXTKV0SQ"
};

// Initialize Firebase
if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}

const auth = firebase.auth();
const db = firebase.firestore();

// REMOVED DUPLICATE PROVIDER - This was breaking the code

async function saveUserToFirestore(user, provider, extraData = {}) {
    const ref = db.collection("users").doc(user.uid);
    const snap = await ref.get();

    const baseData = {
        uid: user.uid,
        name: user.displayName || extraData.name || "User",
        email: user.email,
        photo: user.photoURL || "",
        role: "user",
        isNewUser: !snap.exists,
        lastLogin: firebase.firestore.FieldValue.serverTimestamp()
    };

    if (!snap.exists) {
        await ref.set({
            ...baseData,
            providers: [provider],
            createdAt: firebase.firestore.FieldValue.serverTimestamp(),
            ...extraData
        });
    } else {
        const updateData = {
            lastLogin: firebase.firestore.FieldValue.serverTimestamp(),
            providers: firebase.firestore.FieldValue.arrayUnion(provider)
        };
        
        // Only update fields that have values
        if (extraData.name) updateData.name = extraData.name;
        if (extraData.phone) updateData.phone = extraData.phone;
        if (extraData.address) updateData.address = extraData.address;
        if (extraData.city) updateData.city = extraData.city;
        if (extraData.state) updateData.state = extraData.state;
        if (extraData.pincode) updateData.pincode = extraData.pincode;
        if (user.photoURL) updateData.photo = user.photoURL;
        
        await ref.update(updateData);
    }
}

async function isPhoneAlreadyExists(phone, currentUid = null) {
    const snapshot = await db
        .collection("users")
        .where("phone", "==", phone)
        .get();

    if (snapshot.empty) return false;

    return snapshot.docs.some(doc => doc.id !== currentUid);
}

// ==================== STATE ====================
let pendingGoogleUser = null;
let redirectUrl = null;

// ==================== DOM HELPERS ====================
const $ = id => document.getElementById(id);
const $$ = sel => document.querySelectorAll(sel);

// ==================== INITIALIZATION ====================
document.addEventListener('DOMContentLoaded', () => {
    // Get redirect URL from query params
    const params = new URLSearchParams(window.location.search);
    redirectUrl = params.get('redirect');
    
    // Bind events based on page
    if ($('loginForm')) {
        bindLoginEvents();
    }
    
    if ($('signupForm')) {
        bindSignupEvents();
    }
    
    // Common events
    bindCommonEvents();
});

// ==================== LOGIN EVENTS ====================
function bindLoginEvents() {
    $('loginForm')?.addEventListener('submit', handleLogin);
    $('googleLoginBtn')?.addEventListener('click', handleGoogleAuth);
    
    $('togglePassword')?.addEventListener('click', () => {
        togglePassword('password', 'togglePassword');
    });
    
    $('forgotPasswordLink')?.addEventListener('click', e => {
        e.preventDefault();
        $('forgotPasswordModal')?.classList.add('active');
    });
    
    $('closeForgotModal')?.addEventListener('click', () => {
        $('forgotPasswordModal')?.classList.remove('active');
    });
    
    $('forgotPasswordForm')?.addEventListener('submit', handleForgotPassword);
    $('completeProfileForm')?.addEventListener('submit', handleCompleteProfile);
}

// ==================== SIGNUP EVENTS ====================
function bindSignupEvents() {
    $('signupForm')?.addEventListener('submit', handleSignup);
    $('googleSignupBtn')?.addEventListener('click', handleGoogleAuth);
    
    $$('.toggle-password').forEach(btn => {
        btn.addEventListener('click', function() {
            const targetId = this.dataset.target;
            togglePassword(targetId, null, this);
        });
    });
    
    $('password')?.addEventListener('input', checkPasswordStrength);
    
    $('phone')?.addEventListener('input', e => {
        e.target.value = e.target.value.replace(/\D/g, '').slice(0, 10);
    });
    
    $('pincode')?.addEventListener('input', e => {
        e.target.value = e.target.value.replace(/\D/g, '').slice(0, 6);
    });
    
    $('completeProfileForm')?.addEventListener('submit', handleCompleteProfile);
}

// ==================== COMMON EVENTS ====================
function bindCommonEvents() {
    $$('.modal-overlay').forEach(modal => {
        modal.addEventListener('click', e => {
            if (e.target === modal && modal.id !== 'completeProfileModal') {
                modal.classList.remove('active');
            }
        });
    });
    
    $('profilePhone')?.addEventListener('input', e => {
        e.target.value = e.target.value.replace(/\D/g, '').slice(0, 10);
    });
    
    $('profilePincode')?.addEventListener('input', e => {
        e.target.value = e.target.value.replace(/\D/g, '').slice(0, 6);
    });
    
    document.addEventListener('keydown', e => {
        if (e.key === 'Escape') {
            $('forgotPasswordModal')?.classList.remove('active');
        }
    });
}

// ==================== EMAIL/PASSWORD LOGIN ====================
async function handleLogin(e) {
    e.preventDefault();
    
    const email = $('email')?.value.trim();
    const password = $('password')?.value;
    const rememberMe = $('rememberMe')?.checked;
    
    if (!email || !password) {
        showMessage('Please fill in all fields', 'error');
        return;
    }
    
    if (!validateEmail(email)) {
        showMessage('Please enter a valid email address', 'error');
        return;
    }
    
    showLoading('Logging in...');
    
    try {
        const persistence = rememberMe 
            ? firebase.auth.Auth.Persistence.LOCAL 
            : firebase.auth.Auth.Persistence.SESSION;
        
        await auth.setPersistence(persistence);
        
        const userCredential = await auth.signInWithEmailAndPassword(email, password);
        const user = userCredential.user;
        
        await saveUserToFirestore(user, "password");
        
        hideLoading();
        toast('Login successful!', 'success');
        
        setTimeout(() => handleRedirect(), 1000);
        
    } catch (error) {
        hideLoading();
        handleAuthError(error);
    }
}

// ==================== EMAIL/PASSWORD SIGNUP ====================
async function handleSignup(e) {
    e.preventDefault();
    
    const fullName = $('fullName')?.value.trim();
    const email = $('email')?.value.trim();
    const phone = $('phone')?.value.trim();
    const password = $('password')?.value;
    const confirmPassword = $('confirmPassword')?.value;
    const address = $('address')?.value.trim();
    const city = $('city')?.value.trim();
    const state = $('state')?.value.trim();
    const pincode = $('pincode')?.value.trim();
    const termsChecked = $('termsCheck')?.checked;
    
    if (!fullName || !email || !phone || !password || !address || !city || !pincode) {
        showMessage('Please fill in all required fields', 'error');
        return;
    }
    
    if (!validateEmail(email)) {
        showMessage('Please enter a valid email address', 'error');
        return;
    }
    
    if (phone.length !== 10) {
        showMessage('Please enter a valid 10-digit phone number', 'error');
        return;
    }
    
    if (password.length < 6) {
        showMessage('Password must be at least 6 characters', 'error');
        return;
    }
    
    if (password !== confirmPassword) {
        showMessage('Passwords do not match', 'error');
        return;
    }
    
    if (pincode.length !== 6) {
        showMessage('Please enter a valid 6-digit pincode', 'error');
        return;
    }
    
    if (!termsChecked) {
        showMessage('Please accept the Terms of Service', 'error');
        return;
    }
    
    showLoading('Creating your account...');

    try {
        const userCredential = await auth.createUserWithEmailAndPassword(email, password);
        const user = userCredential.user;
        
        // Phone uniqueness check (AFTER auth)
        const phoneExists = await isPhoneAlreadyExists(phone, user.uid);
        if (phoneExists) {
            hideLoading();
            showMessage("This phone number is already registered.", "error");
            // Rollback auth user
            await user.delete();
            return;
        }

        await user.updateProfile({ displayName: fullName });
        
        await saveUserToFirestore(user, "password", {
            name: fullName,
            phone,
            address,
            city,
            state,
            pincode
        });
        
        hideLoading();
        toast('Account created successfully!', 'success');
        
        setTimeout(() => handleRedirect(), 1500);
        
    } catch (error) {
        hideLoading();
        handleAuthError(error);
    }
}

// ==================== GOOGLE AUTHENTICATION ====================
async function handleGoogleAuth() {
    showLoading('Connecting to Google...');
    
    try {
        const provider = new firebase.auth.GoogleAuthProvider(); // MOVED INSIDE FUNCTION
        const result = await auth.signInWithPopup(provider);
        const user = result.user;
        const isNewUser = result.additionalUserInfo?.isNewUser;

        if (isNewUser) {
            pendingGoogleUser = user;
            hideLoading(); // FIX: Hide loading before showing modal
            showCompleteProfileModal(user);
        } else {
            // Existing user → just update lastLogin
            await saveUserToFirestore(user, "google");
            hideLoading();
            toast('Login successful!', 'success');
            setTimeout(handleRedirect, 1000);
        }

    } catch (error) {
        hideLoading();
        
        // ACCOUNT LINKING
        if (error.code === 'auth/account-exists-with-different-credential') {
            try {
                await linkGoogleAccount(error);
            } catch (linkError) {
                handleAuthError(linkError);
            }
        } else {
            handleAuthError(error);
        }
    }
}

async function linkGoogleAccount(error) {
    const email = error.customData?.email || error.email;
    const pendingCred = error.credential;

    const password = prompt(
        "This email already exists. Enter your password to link Google login."
    );

    if (!password) {
        throw new Error('Password required for account linking');
    }

    const userCred = await auth.signInWithEmailAndPassword(email, password);
    await userCred.user.linkWithCredential(pendingCred);
    await saveUserToFirestore(userCred.user, "google");

    toast('Google account linked successfully!', 'success');
    setTimeout(handleRedirect, 1000);
}

// ==================== COMPLETE PROFILE (Google Users) ====================
function showCompleteProfileModal(user) {
    const modal = $('completeProfileModal');
    const photo = $('googleUserPhoto');
    const name = $('googleUserName');
    
    if (photo) photo.src = user.photoURL || 'https://via.placeholder.com/80?text=User';
    if (name) name.textContent = `Welcome, ${user.displayName || 'User'}!`;
    
    modal?.classList.add('active');
}

async function handleCompleteProfile(e) {
    e.preventDefault();
    
    if (!pendingGoogleUser) {
        showMessage('Session expired. Please try again.', 'error');
        return;
    }
    
    const phone = $('profilePhone')?.value.trim();
    const address = $('profileAddress')?.value.trim();
    const city = $('profileCity')?.value.trim();
    const pincode = $('profilePincode')?.value.trim();
    const state = $('profileState')?.value.trim();
    
    if (!phone || phone.length !== 10) {
        toast('Please enter a valid 10-digit phone number', 'error');
        return;
    }
    
    if (!address) {
        toast('Please enter your address', 'error');
        return;
    }
    
    if (!city) {
        toast('Please enter your city', 'error');
        return;
    }
    
    if (!pincode || pincode.length !== 6) {
        toast('Please enter a valid 6-digit pincode', 'error');
        return;
    }
    
    showLoading('Saving your profile...');

    try {
        const user = pendingGoogleUser;
        
        // Phone uniqueness check (exclude current user)
        const phoneExists = await isPhoneAlreadyExists(phone, pendingGoogleUser.uid);
        if (phoneExists) {
            hideLoading();
            toast("This phone number is already registered.", "error");
            return;
        }

        await saveUserToFirestore(user, "google", {
            phone,
            address,
            city,
            state,
            pincode
        });
        
        pendingGoogleUser = null;
        $('completeProfileModal')?.classList.remove('active');
        
        hideLoading();
        toast('Profile completed successfully!', 'success');
        
        setTimeout(() => handleRedirect(), 1000);
        
    } catch (error) {
        hideLoading();
        console.error('Profile completion error:', error);
        toast('Failed to save profile. Please try again.', 'error');
    }
}

// ==================== FORGOT PASSWORD ====================
async function handleForgotPassword(e) {
    e.preventDefault();
    
    const email = $('resetEmail')?.value.trim();
    
    if (!email || !validateEmail(email)) {
        toast('Please enter a valid email address', 'error');
        return;
    }
    
    showLoading('Sending reset link...');
    
    try {
        await auth.sendPasswordResetEmail(email);
        
        hideLoading();
        $('forgotPasswordModal')?.classList.remove('active');
        toast('Password reset link sent to your email!', 'success');
        
    } catch (error) {
        hideLoading();
        handleAuthError(error);
    }
}

// ==================== UTILITIES ====================
function validateEmail(email) {
    const regex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return regex.test(email);
}

function togglePassword(inputId, buttonId, buttonEl) {
    const input = $(inputId);
    const button = buttonId ? $(buttonId) : buttonEl;
    
    if (!input) return;
    
    if (input.type === 'password') {
        input.type = 'text';
        button?.querySelector('i')?.classList.replace('fa-eye', 'fa-eye-slash');
    } else {
        input.type = 'password';
        button?.querySelector('i')?.classList.replace('fa-eye-slash', 'fa-eye');
    }
}

function checkPasswordStrength() {
    const password = $('password')?.value;
    const strengthEl = $('passwordStrength');
    const fillEl = $('strengthFill');
    const textEl = $('strengthText');
    
    if (!strengthEl || !fillEl || !textEl) return;
    
    if (!password) {
        strengthEl.classList.add('hidden');
        return;
    }
    
    strengthEl.classList.remove('hidden');
    
    let strength = 0;
    let label = 'Weak';
    
    if (password.length >= 6) strength++;
    if (password.length >= 8) strength++;
    if (/[a-z]/.test(password) && /[A-Z]/.test(password)) strength++;
    if (/\d/.test(password)) strength++;
    if (/[^a-zA-Z0-9]/.test(password)) strength++;
    
    if (strength <= 2) {
        label = 'Weak';
        fillEl.className = 'strength-fill weak';
        textEl.className = 'strength-text weak';
    } else if (strength === 3) {
        label = 'Fair';
        fillEl.className = 'strength-fill fair';
        textEl.className = 'strength-text fair';
    } else if (strength === 4) {
        label = 'Good';
        fillEl.className = 'strength-fill good';
        textEl.className = 'strength-text good';
    } else {
        label = 'Strong';
        fillEl.className = 'strength-fill strong';
        textEl.className = 'strength-text strong';
    }
    
    textEl.textContent = label;
}

function handleAuthError(error) {
    console.error('Auth error:', error);
    
    let message = 'An error occurred. Please try again.';
    
    switch (error.code) {
        case 'auth/email-already-in-use':
            message = 'This email is already registered. Please login.';
            break;
        case 'auth/invalid-email':
            message = 'Invalid email address.';
            break;
        case 'auth/weak-password':
            message = 'Password is too weak. Use at least 6 characters.';
            break;
        case 'auth/user-not-found':
            message = 'No account found with this email.';
            break;
        case 'auth/wrong-password':
            message = 'Incorrect password. Please try again.';
            break;
        case 'auth/invalid-credential':
            message = 'Invalid email or password. Please try again.';
            break;
        case 'auth/too-many-requests':
            message = 'Too many attempts. Please try again later.';
            break;
        case 'auth/popup-closed-by-user':
            message = 'Sign-in cancelled. Please try again.';
            break;
        case 'auth/network-request-failed':
            message = 'Network error. Check your connection.';
            break;
    }
    
    showMessage(message, 'error');
}

function handleRedirect() {
    if (redirectUrl === 'cart') {
        window.location.href = 'cart.html';
    } else {
        window.location.href = 'index.html';
    }
}

// ==================== UI HELPERS ====================
function showMessage(text, type) {
    const messageEl = $('authMessage');
    const textEl = $('messageText');
    
    if (!messageEl || !textEl) {
        // Fallback to toast if message elements don't exist
        toast(text, type);
        return;
    }
    
    textEl.textContent = text;
    messageEl.className = `auth-message ${type}`;
    messageEl.classList.remove('hidden');
    
    if (type === 'error') {
        setTimeout(() => messageEl.classList.add('hidden'), 5000);
    }
}

function toast(msg, type = 'success') {
    const toastEl = $('toast');
    const msgEl = $('toastMsg');
    const iconEl = $('toastIcon');
    
    if (!toastEl) {
        // Fallback to alert if toast doesn't exist
        console.log(`${type.toUpperCase()}: ${msg}`);
        return;
    }
    
    if (msgEl) msgEl.textContent = msg;
    
    const icons = {
        success: 'fa-check-circle',
        error: 'fa-times-circle',
        warning: 'fa-exclamation-circle',
        info: 'fa-info-circle'
    };
    
    if (iconEl) iconEl.className = `fas ${icons[type] || icons.success}`;
    
    toastEl.className = `toast ${type} show`;
    
    setTimeout(() => toastEl.classList.remove('show'), 4000);
}

function showLoading(text = 'Please wait...') {
    const loadingEl = $('loading');
    const textEl = $('loadingText');
    
    if (textEl) textEl.textContent = text;
    if (loadingEl) loadingEl.classList.remove('hidden');
}

function hideLoading() {
    const loadingEl = $('loading');
    if (loadingEl) loadingEl.classList.add('hidden');
}

// ==================== EXPORTS ====================
window.handleGoogleAuth = handleGoogleAuth;
window.handleCompleteProfile = handleCompleteProfile;

// ==================== CONSOLE ====================
console.log('%c🔐 FreshMart Auth Ready!', 'color:#2e7d32;font-size:16px;font-weight:bold');
console.log('%c📱 Firebase Auth + Firestore', 'color:#666');