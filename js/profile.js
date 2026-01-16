// ==================== PROFILE PAGE JAVASCRIPT ====================
// Complete profile management for FreshMart
// Handles user data, photo upload, edit profile, orders, and settings

// ==================== CONSTANTS ====================

// ==================== STATE VARIABLES ====================
let userData = null;
let editMode = 'all';
let tempPhotoData = null;

// ==================== DOM ELEMENTS ====================
const DOM = {
    // Profile display elements
    profilePhoto: document.getElementById('profilePhoto'),
    photoPlaceholder: document.getElementById('photoPlaceholder'),
    photoInput: document.getElementById('photoInput'),
    username: document.getElementById('username'),
    phone: document.getElementById('phone'),
    email: document.getElementById('email'),
    address: document.getElementById('address'),
    memberSince: document.getElementById('memberSince'),
    profileBadge: document.getElementById('profileBadge'),
    
    // Stats elements
    totalOrders: document.getElementById('totalOrders'),
    wishlistCount: document.getElementById('wishlistCount'),
    totalSavings: document.getElementById('totalSavings'),
    walletBalance: document.getElementById('walletBalance'),
    cartCount: document.getElementById('cartCount'),
    
    // Orders elements
    recentOrders: document.getElementById('recentOrders'),
    noOrders: document.getElementById('noOrders'),
    
    // Modal elements
    editModal: document.getElementById('editModal'),
    modalTitle: document.getElementById('modalTitle'),
    editForm: document.getElementById('editForm'),
    editProfilePhoto: document.getElementById('editProfilePhoto'),
    editPhotoPlaceholder: document.getElementById('editPhotoPlaceholder'),
    editPhotoInput: document.getElementById('editPhotoInput'),
    editName: document.getElementById('editName'),
    editPhone: document.getElementById('editPhone'),
    editEmail: document.getElementById('editEmail'),
    editAddress: document.getElementById('editAddress'),
    
    // Form sections
    photoSection: document.getElementById('photoSection'),
    nameSection: document.getElementById('nameSection'),
    phoneSection: document.getElementById('phoneSection'),
    emailSection: document.getElementById('emailSection'),
    addressSection: document.getElementById('addressSection'),
    
    // Settings elements
    notificationToggle: document.getElementById('notificationToggle'),
    
    // Toast elements
    toast: document.getElementById('toast'),
    toastIcon: document.getElementById('toastIcon'),
    toastMessage: document.getElementById('toastMessage'),
    
    // Loading overlay
    loadingOverlay: document.getElementById('loadingOverlay')
};

// Add Firebase initialization
const firebaseConfig = {
    apiKey: "AIzaSyDf4QSE3kw9HQD_ZWJ-DDZ8yN3hgRp4UaM",
    authDomain: "otp-auth-ff7fb.firebaseapp.com",
    projectId: "otp-auth-ff7fb",
    storageBucket: "otp-auth-ff7fb.firebasestorage.app",
    messagingSenderId: "945314024888",
    appId: "1:945314024888:web:1eb577611a4de09757934d",
    measurementId: "G-6HMXTKV0SQ"
};

if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}
const auth = firebase.auth();
const db = firebase.firestore();


// ==================== AUTH STATE LISTENER ====================
auth.onAuthStateChanged(async (user) => {
    if (!user) {
        window.location.href = 'login.html?redirect=profile';
        return;
    }

    console.log('✅ User authenticated:', user.uid);
    await loadProfileFromFirestore(user.uid);
    updateProfileDisplay();   // 🔥 THIS WAS MISSING
});


// ==================== INITIALIZATION ====================
document.addEventListener('DOMContentLoaded', function() {
    console.log('👤 FreshMart Profile Page Initialized');
    
    // Load user data from localStorage first (for quick display)
    
    
    // Setup all event listeners
    setupEventListeners();
    
    // Update UI with user data
    
   /* updateStats();
    loadRecentOrders();*/
    updateCartCount();
    
    // Check if user is logged in
    //checkLoginStatus();
});

// ==================== SYNC FROM FIREBASE ====================


// ==================== DATA MANAGEMENT ====================

/**
 * Load user data from localStorage
 */
/**
 * Normalize user data from different sources
 */
/*function normalizeUserData(rawData) {
    // Build full address if we have components
    let fullAddress = rawData.address || '';
    
    if (!fullAddress && (rawData.streetAddress || rawData.city)) {
        fullAddress = [
            rawData.streetAddress,
            rawData.city,
            rawData.state,
            rawData.pincode
        ].filter(Boolean).join(', ');
    }
    
    return {
        id: rawData.id || rawData.uid || Date.now(),
        uid: rawData.uid || rawData.id || null,
        name: rawData.name || 'Guest User',
        phone: rawData.phone || '',
        email: rawData.email || '',
        address: fullAddress,
        streetAddress: rawData.streetAddress || '',
        city: rawData.city || '',
        state: rawData.state || '',
        pincode: rawData.pincode || '',
        profilePhoto: rawData.profilePhoto || rawData.photo || null,
        provider: rawData.provider || 'email',
        memberSince: rawData.memberSince || rawData.createdAt || new Date().toISOString(),
        notifications: rawData.notifications ?? true,
        wallet: rawData.wallet || 0,
        orders: Array.isArray(rawData.orders) ? rawData.orders : [],
        savedAddresses: rawData.savedAddresses || [],
        paymentMethods: rawData.paymentMethods || []
    };
}
*/
/**
 * Create default user data object
 */
/*function createDefaultUserData() {
    return {
        id: Date.now(),
        uid: null,
        name: 'Guest User',
        phone: '',
        email: '',
        address: '',
        streetAddress: '',
        city: '',
        state: '',
        pincode: '',
        profilePhoto: null,
        provider: null,
        memberSince: new Date().toISOString(),
        notifications: true,
        wallet: 0,
        orders: [],
        savedAddresses: [],
        paymentMethods: []
    };
}*/

/**
 * Save user data to localStorage and Firebase
 */
 

/**
 * Check if user is logged in
 */
function checkLoginStatus() {
    const isLoggedIn = userData && (userData.phone || userData.email);
    
    if (DOM.profileBadge) {
        DOM.profileBadge.style.display = isLoggedIn ? 'flex' : 'none';
    }
    
    return isLoggedIn;
}

// ==================== EVENT LISTENERS ====================

function setupEventListeners() {
    // Main profile photo upload
    if (DOM.photoInput) {
        DOM.photoInput.addEventListener('change', handleMainPhotoUpload);
    }
    
    // Modal photo upload
    if (DOM.editPhotoInput) {
        DOM.editPhotoInput.addEventListener('change', handleModalPhotoUpload);
    }
    
    // Edit form submission
    if (DOM.editForm) {
        DOM.editForm.addEventListener('submit', handleFormSubmit);
    }
    
    // Phone input validation
    if (DOM.editPhone) {
        DOM.editPhone.addEventListener('input', function(e) {
            this.value = this.value.replace(/[^0-9]/g, '').slice(0, 10);
        });
    }
    
    // Notification toggle
    if (DOM.notificationToggle) {
        DOM.notificationToggle.checked = userData?.notifications ?? true;
        DOM.notificationToggle.addEventListener('change', handleNotificationToggle);
    }
    
    // Close modal on backdrop click
    if (DOM.editModal) {
        DOM.editModal.addEventListener('click', function(e) {
            if (e.target === DOM.editModal) {
                closeEditModal();
            }
        });
    }
    
    // Keyboard shortcuts
    document.addEventListener('keydown', handleKeyboard);
    
    console.log('🎯 Event listeners attached');
}

function handleKeyboard(e) {
    if (e.key === 'Escape') {
        if (DOM.editModal?.classList.contains('active')) {
            closeEditModal();
        }
        hideToast();
    }
}

async function loadProfileFromFirestore(uid) {
    try {
        showLoading();

        const doc = await db.collection("users").doc(uid).get();
        if (!doc.exists) {
            console.warn("No profile data found in Firestore");
            hideLoading();
            return;
        }

        const data = doc.data();

        // Normalize data for UI
        userData = {
            uid,
            name: data.name || 'User',
            email: data.email || '',
            phone: data.phone || '',
            address: [
                data.address,
                data.city,
                data.state,
                data.pincode
            ].filter(Boolean).join(', '),
            streetAddress: data.address || '',
            city: data.city || '',
            state: data.state || '',
            pincode: data.pincode || '',
            profilePhoto: data.photo || '',
            memberSince: data.createdAt?.toDate
                ? data.createdAt.toDate().toISOString()
                : new Date().toISOString(),
            wallet: data.wallet || 0,
            orders: data.orders || [],
            notifications: true
        };

        
        updateStats();
        loadRecentOrders();
        updateProfileDisplay();   // 🔥 REQUIRED

        hideLoading();
    } catch (err) {
        hideLoading();
        console.error("Error loading profile:", err);
    }
}


// ==================== PROFILE DISPLAY ====================

function updateProfileDisplay() {
    if (!userData) {
        console.warn('No user data to display');
        return;
    }
    
    console.log('🔄 Updating profile display with:', userData);
    
    // Update profile photo
    const photoData = userData.profilePhoto || userData.photo || null;
    updatePhotoDisplay(DOM.profilePhoto, DOM.photoPlaceholder, photoData);
    
    // Update username
    if (DOM.username) {
        DOM.username.textContent = userData.name || 'Guest User';
    }
    
    // Update phone
    if (DOM.phone) {
        if (userData.phone) {
            DOM.phone.textContent = `+91 ${formatPhoneNumber(userData.phone)}`;
            DOM.phone.classList.remove('not-set');
        } else {
            DOM.phone.textContent = 'Not set';
            DOM.phone.classList.add('not-set');
        }
    }
    
    // Update email
    if (DOM.email) {
        DOM.email.textContent = userData.email || 'Not set';
        DOM.email.classList.toggle('not-set', !userData.email);
    }
    
    // Update address
    if (DOM.address) {
        let displayAddress = userData.address || '';
        
        if (!displayAddress && (userData.streetAddress || userData.city)) {
            displayAddress = [
                userData.streetAddress,
                userData.city,
                userData.state,
                userData.pincode
            ].filter(Boolean).join(', ');
        }
        
        if (displayAddress) {
            const maxLength = 50;
            DOM.address.textContent = displayAddress.length > maxLength 
                ? displayAddress.substring(0, maxLength) + '...'
                : displayAddress;
            DOM.address.classList.remove('not-set');
        } else {
            DOM.address.textContent = 'Not set';
            DOM.address.classList.add('not-set');
        }
    }
    
    // Update member since
    if (DOM.memberSince) {
        const dateStr = userData.memberSince || userData.createdAt;
        if (dateStr) {
            const date = new Date(dateStr);
            if (!isNaN(date.getTime())) {
                DOM.memberSince.textContent = date.toLocaleDateString('en-IN', {
                    month: 'short',
                    year: 'numeric'
                });
            } else {
                DOM.memberSince.textContent = 'Recently';
            }
        }
    }
    
    console.log('✅ Profile display updated');
}

function updatePhotoDisplay(imgElement, placeholderElement, photoData) {
    if (!imgElement) return;
    
    if (photoData && photoData.trim() !== '') {
        imgElement.src = photoData;
        imgElement.style.display = 'block';
        if (placeholderElement) {
            placeholderElement.style.display = 'none';
        }
    } else {
        imgElement.src = '';
        imgElement.style.display = 'none';
        if (placeholderElement) {
            placeholderElement.style.display = 'flex';
        }
    }
}

function formatPhoneNumber(phone) {
    if (!phone) return '';
    const cleaned = phone.replace(/\D/g, '');
    if (cleaned.length === 10) {
        return `${cleaned.slice(0, 5)} ${cleaned.slice(5)}`;
    }
    return cleaned;
}

// ==================== STATS MANAGEMENT ====================

function updateStats() {
    const orders = userData?.orders || [];
    if (DOM.totalOrders) {
        DOM.totalOrders.textContent = orders.length;
    }
    
    const wishlist = [];

    if (DOM.wishlistCount) {
        DOM.wishlistCount.textContent = wishlist.length;
    }
    
    const savings = calculateTotalSavings(orders);
    if (DOM.totalSavings) {
        DOM.totalSavings.textContent = formatCurrency(savings);
    }
    
    const walletBalance = userData?.wallet || 0;
    if (DOM.walletBalance) {
        DOM.walletBalance.textContent = formatCurrency(walletBalance);
    }
}



function calculateTotalSavings(orders) {
    if (!orders || !Array.isArray(orders)) return 0;
    return orders.reduce((total, order) => total + (order.discount || 0), 0);
}

function formatCurrency(amount) {
    return `₹${amount.toLocaleString('en-IN')}`;
}

function updateCartCount() {
    try {
        const cartData = localStorage.getItem(STORAGE_KEYS.CART);
        const cart = cartData ? JSON.parse(cartData) : [];
        const totalItems = cart.reduce((sum, item) => sum + (item.quantity || 0), 0);
        
        if (DOM.cartCount) {
            DOM.cartCount.textContent = totalItems;
            DOM.cartCount.style.display = totalItems > 0 ? 'flex' : 'none';
        }
    } catch (error) {
        if (DOM.cartCount) {
            DOM.cartCount.textContent = '0';
            DOM.cartCount.style.display = 'none';
        }
    }
}

// ==================== RECENT ORDERS ====================

function loadRecentOrders() {
    const orders = userData?.orders || [];
    
    if (orders.length === 0) {
        showNoOrders();
        return;
    }
    
    hideNoOrders();
    
    const recentOrders = orders.slice(0, 3);
    
    if (DOM.recentOrders) {
        DOM.recentOrders.innerHTML = recentOrders
            .map(order => createOrderItemHTML(order))
            .join('');
        attachOrderClickListeners();
    }
}

function showNoOrders() {
    if (DOM.recentOrders) DOM.recentOrders.innerHTML = '';
    if (DOM.noOrders) DOM.noOrders.classList.remove('hidden');
}

function hideNoOrders() {
    if (DOM.noOrders) DOM.noOrders.classList.add('hidden');
}

function createOrderItemHTML(order) {
    const statusClass = getStatusClass(order.status);
    const statusText = formatStatus(order.status);
    const orderEmoji = getOrderEmoji(order);
    const formattedDate = formatOrderDate(order.date);
    const formattedTotal = formatCurrency(order.total || 0);
    
    return `
        <div class="order-item" data-order-id="${order.id}" onclick="viewOrderDetails(${order.id})">
            <div class="order-icon">${orderEmoji}</div>
            <div class="order-info">
                <div class="order-id">Order #${order.id}</div>
                <div class="order-date">${formattedDate}</div>
            </div>
            <span class="order-status ${statusClass}">${statusText}</span>
            <span class="order-amount">${formattedTotal}</span>
        </div>
    `;
}

function getStatusClass(status) {
    const statusMap = {
        'delivered': 'delivered',
        'confirmed': 'pending',
        'pending': 'pending',
        'processing': 'pending',
        'shipped': 'pending',
        'cancelled': 'cancelled',
        'refunded': 'cancelled'
    };
    return statusMap[status?.toLowerCase()] || 'pending';
}

function formatStatus(status) {
    if (!status) return 'Pending';
    return status.charAt(0).toUpperCase() + status.slice(1).toLowerCase();
}

function getOrderEmoji(order) {
    const status = order.status?.toLowerCase();
    if (status === 'delivered') return '✅';
    if (status === 'cancelled' || status === 'refunded') return '❌';
    if (status === 'shipped') return '🚚';
    
    const itemCount = order.items?.length || 0;
    if (itemCount === 0) return '📦';
    if (itemCount === 1) return '🛍️';
    if (itemCount <= 3) return '🛒';
    return '📦';
}

function formatOrderDate(dateString) {
    if (!dateString) return 'N/A';
    try {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-IN', {
            day: 'numeric',
            month: 'short',
            year: 'numeric'
        });
    } catch {
        return dateString;
    }
}

function attachOrderClickListeners() {
    document.querySelectorAll('.order-item').forEach(item => {
        item.style.cursor = 'pointer';
    });
}

function viewOrderDetails(orderId) {
    window.location.href = `orders.html?id=${orderId}`;
}

// ==================== PHOTO UPLOAD ====================

async function handleMainPhotoUpload(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    const validation = validateImageFile(file);
    if (!validation.valid) {
        showToast(validation.message, 'error');
        return;
    }
    
    try {
        showLoading();
        
        const base64 = await convertFileToBase64(file);
        const compressedBase64 = await compressImage(base64);
        
        userData.profilePhoto = compressedBase64;
        
        
        updateProfileDisplay();
        
        hideLoading();
        showToast('Profile photo updated successfully!', 'success');
        
    } catch (error) {
        hideLoading();
        console.error('Error uploading photo:', error);
        showToast('Failed to upload photo. Please try again.', 'error');
    }
    
    event.target.value = '';
}

async function handleModalPhotoUpload(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    const validation = validateImageFile(file);
    if (!validation.valid) {
        showToast(validation.message, 'error');
        return;
    }
    
    try {
        const base64 = await convertFileToBase64(file);
        const compressedBase64 = await compressImage(base64);
        
        tempPhotoData = compressedBase64;
        updatePhotoDisplay(DOM.editProfilePhoto, DOM.editPhotoPlaceholder, compressedBase64);
        
    } catch (error) {
        console.error('Error uploading photo:', error);
        showToast('Failed to upload photo. Please try again.', 'error');
    }
    
    event.target.value = '';
}

function validateImageFile(file) {
    if (!file.type.startsWith('image/')) {
        return { valid: false, message: 'Please select an image file (JPG, PNG, etc.)' };
    }
    
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
        return { valid: false, message: 'Image size should be less than 5MB' };
    }
    
    return { valid: true };
}

function convertFileToBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = (error) => reject(error);
        reader.readAsDataURL(file);
    });
}

function compressImage(base64) {
    return new Promise((resolve) => {
        const img = new Image();
        img.onload = () => {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            
            const maxWidth = 500;
            const maxHeight = 500;
            
            let { width, height } = img;
            
            if (width > maxWidth || height > maxHeight) {
                const ratio = Math.min(maxWidth / width, maxHeight / height);
                width *= ratio;
                height *= ratio;
            }
            
            canvas.width = width;
            canvas.height = height;
            ctx.drawImage(img, 0, 0, width, height);
            
            const compressed = canvas.toDataURL('image/jpeg', 0.8);
            resolve(compressed);
        };
        
        img.onerror = () => resolve(base64);
        img.src = base64;
    });
}

function removePhoto() {
    tempPhotoData = null;
    updatePhotoDisplay(DOM.editProfilePhoto, DOM.editPhotoPlaceholder, null);
    
    if (DOM.editPhotoInput) {
        DOM.editPhotoInput.value = '';
    }
    
    showToast('Photo removed. Click Save to confirm.', 'info');
}

// ==================== EDIT MODAL ====================

function openEditModal(mode = 'all') {
    editMode = mode;
    tempPhotoData = userData?.profilePhoto || null;
    
    const titles = {
        'all': 'Edit Profile',
        'phone': 'Update Phone Number',
        'email': 'Update Email Address',
        'address': 'Update Delivery Address'
    };
    
    if (DOM.modalTitle) {
        DOM.modalTitle.textContent = titles[mode] || 'Edit Profile';
    }
    
    toggleFormSections(mode);
    populateEditForm();
    
    if (DOM.editModal) {
        DOM.editModal.classList.add('active');
        document.body.style.overflow = 'hidden';
        setTimeout(() => focusFirstInput(mode), 100);
    }
}

function toggleFormSections(mode) {
    const sectionVisibility = {
        'photoSection': mode === 'all',
        'nameSection': mode === 'all',
        'phoneSection': mode === 'all' || mode === 'phone',
        'emailSection': mode === 'all' || mode === 'email',
        'addressSection': mode === 'all' || mode === 'address'
    };
    
    Object.entries(sectionVisibility).forEach(([sectionId, visible]) => {
        const section = DOM[sectionId];
        if (section) {
            section.classList.toggle('hidden', !visible);
        }
    });
}

function focusFirstInput(mode) {
    const inputMap = {
        'all': DOM.editName,
        'phone': DOM.editPhone,
        'email': DOM.editEmail,
        'address': DOM.editAddress
    };
    
    const input = inputMap[mode];
    if (input) {
        input.focus();
        input.select();
    }
}

function closeEditModal() {
    if (DOM.editModal) {
        DOM.editModal.classList.remove('active');
        document.body.style.overflow = '';
    }
    
    if (DOM.editForm) {
        DOM.editForm.reset();
    }
    
    tempPhotoData = null;
    editMode = 'all';
}

function populateEditForm() {
    if (!userData) return;
    
    if (DOM.editName) {
        DOM.editName.value = userData.name || '';
    }
    
    if (DOM.editPhone) {
        DOM.editPhone.value = userData.phone || '';
    }
    
    if (DOM.editEmail) {
        DOM.editEmail.value = userData.email || '';
    }
    
    if (DOM.editAddress) {
        // Show full address in the edit field
        DOM.editAddress.value = userData.address || '';
    }
    
    updatePhotoDisplay(
        DOM.editProfilePhoto, 
        DOM.editPhotoPlaceholder, 
        userData.profilePhoto
    );
}

// ==================== FORM SUBMISSION (FIXED) ====================

async function handleFormSubmit(event) {
    event.preventDefault();

    const currentUser = auth.currentUser;
    if (!currentUser) {
        showToast('User not authenticated', 'error');
        return;
    }

    const updatedData = {
        name: DOM.editName?.value.trim() || '',
        phone: DOM.editPhone?.value.trim() || '',
        email: DOM.editEmail?.value.trim() || '',
        address: DOM.editAddress?.value.trim() || '',
        photo: tempPhotoData || userData.profilePhoto || ''
    };

    const validation = validateFormData(updatedData, editMode);
    if (!validation.valid) {
        showToast(validation.message, 'error');
        return;
    }

    showLoading();

    try {
        // 🔒 Phone uniqueness check (only if phone changed)
        if (
            updatedData.phone &&
            editMode !== 'email' &&
            updatedData.phone !== userData.phone
        ) {
            const snapshot = await db
                .collection('users')
                .where('phone', '==', updatedData.phone)
                .get();

            const exists = snapshot.docs.some(doc => doc.id !== currentUser.uid);

        if (exists) {
            hideLoading();
            showToast('This phone number is already registered.', 'error');
            return;
        }

        }

        // 🔥 Build Firestore update payload based on editMode
        const firestoreUpdate = {
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        };

       if (editMode === 'all') {
        firestoreUpdate.name = updatedData.name;
        firestoreUpdate.phone = updatedData.phone;
        firestoreUpdate.address = updatedData.address;
        firestoreUpdate.photo = updatedData.photo;
        } else if (editMode === 'phone') {
            firestoreUpdate.phone = updatedData.phone;
        } else if (editMode === 'email') {
            
        } else if (editMode === 'address') {
            firestoreUpdate.address = updatedData.address;
        }

        // ✅ REAL SAVE TO FIRESTORE
        await db.collection('users').doc(currentUser.uid).update(firestoreUpdate);

        // ✅ Sync local UI state
        userData = {
        ...userData,
        ...updatedData,
        profilePhoto: updatedData.photo
    };


        updateProfileDisplay();
        updateStats();
        closeEditModal();

        hideLoading();
        showToast('Profile updated successfully!', 'success');

    } catch (error) {
        hideLoading();
        console.error('❌ Profile update failed:', error);
        showToast('Failed to update profile. Please try again.', 'error');
    }
}


function validateFormData(data, mode) {
    if (mode === 'all' && !data.name) {
        return { valid: false, message: 'Please enter your name' };
    }
    
    if (mode === 'all' && data.name.length < 2) {
        return { valid: false, message: 'Name must be at least 2 characters' };
    }
    
    if ((mode === 'all' || mode === 'phone') && data.phone) {
        if (!/^\d{10}$/.test(data.phone)) {
            return { valid: false, message: 'Please enter a valid 10-digit phone number' };
        }
    }
    
    if ((mode === 'all' || mode === 'email') && data.email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(data.email)) {
            return { valid: false, message: 'Please enter a valid email address' };
        }
    }
    
    if (mode === 'address' && !data.address) {
        return { valid: false, message: 'Please enter your delivery address' };
    }
    
    return { valid: true };
}

// ==================== SETTINGS ====================

function handleNotificationToggle(event) {
    const enabled = event.target.checked;
    userData.notifications = enabled;
    showToast(enabled ? 'Notifications enabled' : 'Notifications disabled', 'info');
}

function openNotificationSettings() {
    if (DOM.notificationToggle) {
        DOM.notificationToggle.checked = !DOM.notificationToggle.checked;
        DOM.notificationToggle.dispatchEvent(new Event('change'));
    }
}

function shareApp() {
    const shareData = {
        title: 'FreshMart - Online Grocery Store',
        text: 'Check out FreshMart for fresh groceries delivered to your doorstep!',
        url: window.location.origin
    };
    
    if (navigator.share) {
        navigator.share(shareData)
            .then(() => showToast('Thanks for sharing!', 'success'))
            .catch((error) => {
                if (error.name !== 'AbortError') {
                    fallbackShare(shareData);
                }
            });
    } else {
        fallbackShare(shareData);
    }
}

function fallbackShare(shareData) {
    const shareText = `${shareData.title}\n${shareData.text}\n${shareData.url}`;
    navigator.clipboard.writeText(shareText)
        .then(() => showToast('Link copied to clipboard!', 'success'))
        .catch(() => showToast('Unable to share. Please try again.', 'error'));
}

function rateApp() {
    showToast('Thank you for your feedback! ⭐', 'success');
}

// ==================== LOGOUT ====================

function handleLogout() {
    const confirmed = confirm('Are you sure you want to logout?');
    if (!confirmed) return;
    
    showLoading();
    
    auth.signOut().then(() => {
        
        
        hideLoading();
        showToast('Logged out successfully!', 'success');
        
        setTimeout(() => {
            window.location.href = 'index.html';
        }, 1000);
    }).catch((error) => {
        hideLoading();
        console.error('Logout error:', error);
        showToast('Error logging out', 'error');
    });
}

// ==================== TOAST NOTIFICATIONS ====================

function showToast(message, type = 'success') {
    if (!DOM.toast || !DOM.toastMessage || !DOM.toastIcon) return;
    
    DOM.toastMessage.textContent = message;
    
    const icons = {
        success: 'fa-check-circle',
        error: 'fa-times-circle',
        info: 'fa-info-circle',
        warning: 'fa-exclamation-circle'
    };
    
    DOM.toastIcon.className = `fas ${icons[type] || icons.success}`;
    DOM.toast.className = 'toast';
    DOM.toast.classList.add(type, 'show');
    
    clearTimeout(window.toastTimeout);
    window.toastTimeout = setTimeout(hideToast, 4000);
}

function hideToast() {
    if (DOM.toast) {
        DOM.toast.classList.remove('show');
    }
    clearTimeout(window.toastTimeout);
}

// ==================== LOADING OVERLAY ====================

function showLoading() {
    if (DOM.loadingOverlay) {
        DOM.loadingOverlay.classList.remove('hidden');
    }
}

function hideLoading() {
    if (DOM.loadingOverlay) {
        DOM.loadingOverlay.classList.add('hidden');
    }
}

// ==================== UTILITY FUNCTIONS ====================

function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

function throttle(func, limit) {
    let inThrottle;
    return function executedFunction(...args) {
        if (!inThrottle) {
            func(...args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    };
}

// ==================== GLOBAL EXPORTS ====================

window.openEditModal = openEditModal;
window.closeEditModal = closeEditModal;
window.removePhoto = removePhoto;
window.handleLogout = handleLogout;
window.viewOrderDetails = viewOrderDetails;
window.openNotificationSettings = openNotificationSettings;
window.shareApp = shareApp;
window.rateApp = rateApp;
window.hideToast = hideToast;

// ==================== CONSOLE LOG ====================
console.log('%c👤 FreshMart Profile', 'color: #2e7d32; font-size: 16px; font-weight: bold;');
console.log('%cProfile management ready!', 'color: #666; font-size: 12px;');