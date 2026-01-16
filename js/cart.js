// ==================== FRESHMART CART ====================
// Firebase Auth + Razorpay Payment Integration

// ==================== FIREBASE CONFIG ====================
// âš ï¸ Replace with your Firebase config
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

// ==================== RAZORPAY CONFIG ====================
// âš ï¸ Replace with your Razorpay Key
const RAZORPAY_KEY = 'rzp_live_Yjaxr7IV3KhCc2';

// ==================== STORAGE KEYS ====================
const KEYS = {
    CART: 'freshmart_cart',
    USER: 'freshmart_user',
    ADDRESS: 'freshmart_address'
};

// ==================== COUPONS ====================
const COUPONS = {
    'FRESH10': { discount: 10, type: 'percent', min: 200 },
    'SAVE50': { discount: 50, type: 'fixed', min: 500 },
    'FIRST20': { discount: 20, type: 'percent', min: 0 },
    'FREESHIP': { discount: 40, type: 'shipping', min: 300 }
};

// ==================== STATE ====================
let cart = [];
let user = null;
let address = null;
let coupon = null;
let total = 0;
let isLoggedIn = false;

// ==================== DOM HELPERS ====================
const $ = id => document.getElementById(id);
const $$ = sel => document.querySelectorAll(sel);

// ==================== INIT ====================
document.addEventListener('DOMContentLoaded', () => {
    loadLocalData();
    bindEvents();
    
    // Listen for Firebase Auth state
    auth.onAuthStateChanged(handleAuthState);
});

// ==================== AUTH STATE ====================
function handleAuthState(firebaseUser) {
    if (firebaseUser) {
        // User is signed in
        isLoggedIn = true;
        
        // Load user data from localStorage (synced with profile)
        const savedUser = localStorage.getItem(KEYS.USER);
        if (savedUser) {
            user = JSON.parse(savedUser);
        } else {
            // Create basic user from Firebase
            user = {
                uid: firebaseUser.uid,
                name: firebaseUser.displayName || 'User',
                email: firebaseUser.email,
                phone: firebaseUser.phoneNumber || '',
                photo: firebaseUser.photoURL || '',
                orders: []
            };
            localStorage.setItem(KEYS.USER, JSON.stringify(user));
        }
        
        console.log('âœ… User logged in:', user.email);
    } else {
        // User is signed out
        isLoggedIn = false;
        user = null;
        console.log('âŒ User not logged in');
    }
    
    updateAuthUI();
    updateAddressUI();
    renderCart();
}

// ==================== LOAD DATA ====================
function loadLocalData() {
    try {
        cart = JSON.parse(localStorage.getItem(KEYS.CART)) || [];
        address = JSON.parse(localStorage.getItem(KEYS.ADDRESS)) || null;
    } catch (e) {
        console.error('Error loading data:', e);
        cart = [];
    }
}

function saveCart() {
    localStorage.setItem(KEYS.CART, JSON.stringify(cart));
}

function saveUser() {
    localStorage.setItem(KEYS.USER, JSON.stringify(user));
}

function saveAddress() {
    localStorage.setItem(KEYS.ADDRESS, JSON.stringify(address));
}

// ==================== EVENT BINDINGS ====================
function bindEvents() {
    // Clear cart
    $('clearBtn')?.addEventListener('click', clearCart);
    
    // Checkout
    $('checkoutBtn')?.addEventListener('click', handleCheckout);
    
    // Coupon
    $('couponBtn')?.addEventListener('click', applyCoupon);
    $('couponInput')?.addEventListener('keypress', e => {
        if (e.key === 'Enter') applyCoupon();
    });
    
    // Coupon hints
    $$('.hint').forEach(el => {
        el.addEventListener('click', () => {
            $('couponInput').value = el.dataset.code;
            applyCoupon();
        });
    });
    
    // Address button
    $('addressBtn')?.addEventListener('click', handleAddressClick);
    
    // Address modal
    $('closeAddressModal')?.addEventListener('click', closeAddressModal);
    $('cancelAddressBtn')?.addEventListener('click', closeAddressModal);
    $('addressForm')?.addEventListener('submit', saveAddressForm);
    
    // Phone validation
    $('addrPhone')?.addEventListener('input', e => {
        e.target.value = e.target.value.replace(/\D/g, '').slice(0, 10);
    });
    
    // Pincode validation
    $('addrPincode')?.addEventListener('input', e => {
        e.target.value = e.target.value.replace(/\D/g, '').slice(0, 6);
    });
    
    // Modal backdrop close
    $('addressModal')?.addEventListener('click', e => {
        if (e.target.id === 'addressModal') closeAddressModal();
    });
    
    // Toast close
    $('toastClose')?.addEventListener('click', hideToast);
    
    // Keyboard
    document.addEventListener('keydown', e => {
        if (e.key === 'Escape') closeAddressModal();
    });
}

// ==================== AUTH UI ====================
function updateAuthUI() {
    // Login button
    $('loginBtn')?.classList.toggle('hidden', isLoggedIn);
    
    // User avatar
    $('userAvatar')?.classList.toggle('hidden', !isLoggedIn);
    
    // Login alert
    const showAlert = !isLoggedIn && cart.length > 0;
    $('loginAlert')?.classList.toggle('hidden', !showAlert);
    
    // Login tag on address
    $('loginTag')?.classList.toggle('hidden', isLoggedIn);
    
    // Update avatar image
    if (isLoggedIn && user?.photo) {
        const img = $('avatarImg');
        if (img) img.src = user.photo;
    }
}

// ==================== ADDRESS UI ====================
function updateAddressUI() {
    const body = $('addressBody');
    const btn = $('addressBtnText');
    
    if (!body) return;
    
    if (!isLoggedIn) {
        body.innerHTML = '<p class="no-address">Please login to add address</p>';
        if (btn) btn.textContent = 'Login to Add';
        return;
    }
    
    if (isAddressComplete()) {
        body.innerHTML = `
            <div class="saved-address">
                <div class="addr-name">${address.name}</div>
                <div class="addr-phone">+91 ${address.phone}</div>
                <div class="addr-line">${address.address}, ${address.city} - ${address.pincode}</div>
            </div>
        `;
        if (btn) btn.textContent = 'Change Address';
        $('addressBtn')?.querySelector('i')?.classList.replace('fa-plus', 'fa-edit');
    } else {
        body.innerHTML = '<p class="no-address">Please add your delivery address</p>';
        if (btn) btn.textContent = 'Add Address';
        $('addressBtn')?.querySelector('i')?.classList.replace('fa-edit', 'fa-plus');
    }
}

function isAddressComplete() {
    return address && address.name && address.phone && 
           address.email && address.address && 
           address.city && address.pincode;
}

// ==================== ADDRESS MODAL ====================
function handleAddressClick() {
    if (!isLoggedIn) {
        toast('Please login first', 'warning');
        setTimeout(() => {
            window.location.href = 'login.html?redirect=cart';
        }, 1000);
        return;
    }
    openAddressModal();
}

function openAddressModal() {
    // Pre-fill from existing data
    if (address) {
        $('addrName').value = address.name || '';
        $('addrPhone').value = address.phone || '';
        $('addrEmail').value = address.email || '';
        $('addrLine').value = address.address || '';
        $('addrCity').value = address.city || '';
        $('addrPincode').value = address.pincode || '';
        $('addrState').value = address.state || '';
    } else if (user) {
        // Pre-fill from user profile
        $('addrName').value = user.name || '';
        $('addrPhone').value = user.phone || '';
        $('addrEmail').value = user.email || '';
    }
    
    $('addressModal')?.classList.add('active');
    document.body.style.overflow = 'hidden';
    setTimeout(() => $('addrName')?.focus(), 100);
}

function closeAddressModal() {
    $('addressModal')?.classList.remove('active');
    document.body.style.overflow = '';
}

function saveAddressForm(e) {
    e.preventDefault();
    
    const name = $('addrName')?.value.trim();
    const phone = $('addrPhone')?.value.trim();
    const email = $('addrEmail')?.value.trim();
    const addr = $('addrLine')?.value.trim();
    const city = $('addrCity')?.value.trim();
    const pincode = $('addrPincode')?.value.trim();
    const state = $('addrState')?.value.trim();
    
    // Validate
    if (!name) return toast('Enter your name', 'error');
    if (!phone || phone.length !== 10) return toast('Enter valid 10-digit phone', 'error');
    if (!email || !validateEmail(email)) return toast('Enter valid email', 'error');
    if (!addr) return toast('Enter address', 'error');
    if (!city) return toast('Enter city', 'error');
    if (!pincode || pincode.length !== 6) return toast('Enter valid 6-digit pincode', 'error');
    
    // Save address
    address = { name, phone, email, address: addr, city, pincode, state };
    saveAddress();
    
    // Also update user data
    if (user) {
        user.name = name;
        user.phone = phone;
        saveUser();
    }
    
    closeAddressModal();
    updateAddressUI();
    toast('Address saved!', 'success');
}

function validateEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

// ==================== CART RENDER ====================
function renderCart() {
    const container = $('cartItems');
    const empty = $('emptyCart');
    const sidebar = $('cartSidebar');
    const clearBtn = $('clearBtn');
    const countEl = $('itemsCount');
    
    const totalQty = cart.reduce((s, i) => s + i.quantity, 0);
    if (countEl) countEl.textContent = `${totalQty} item${totalQty !== 1 ? 's' : ''}`;
    
    if (cart.length === 0) {
        if (container) container.innerHTML = '';
        empty?.classList.remove('hidden');
        sidebar?.classList.add('hidden');
        clearBtn?.classList.add('hidden');
        $('loginAlert')?.classList.add('hidden');
        return;
    }
    
    empty?.classList.add('hidden');
    sidebar?.classList.remove('hidden');
    clearBtn?.classList.remove('hidden');
    
    if (!isLoggedIn) {
        $('loginAlert')?.classList.remove('hidden');
    }
    
    if (container) {
        container.innerHTML = cart.map(item => createItemHTML(item)).join('');
        bindItemEvents();
    }
    
    updateSummary();
}

function createItemHTML(item) {
    const itemTotal = item.price * item.quantity;
    const hasDiscount = item.originalPrice && item.originalPrice > item.price;
    const discountPct = hasDiscount 
        ? Math.round((1 - item.price / item.originalPrice) * 100) 
        : 0;
    
    return `
        <div class="cart-item" data-id="${item.id}">
            <div class="item-img-wrap">
                <img src="${item.image}" alt="${item.name}" class="item-img"
                     onerror="this.src='https://via.placeholder.com/80?text=Image'">
                ${hasDiscount ? `<span class="item-badge">${discountPct}% OFF</span>` : ''}
            </div>
            
            <div class="item-details">
                <h4>${item.name}</h4>
                <p class="item-weight"><i class="fas fa-weight-hanging"></i> ${item.weight || 'Standard'}</p>
                <div class="item-prices">
                    <span class="item-price">₹${item.price}</span>
                    ${hasDiscount ? `<span class="item-old-price">₹${item.originalPrice}</span>` : ''}
                </div>
            </div>
            
            <div class="item-actions">
                <div class="qty-control">
                    <button class="qty-btn minus" data-id="${item.id}" ${item.quantity <= 1 ? 'disabled' : ''}>
                        <i class="fas fa-minus"></i>
                    </button>
                    <span class="qty-val">${item.quantity}</span>
                    <button class="qty-btn plus" data-id="${item.id}">
                        <i class="fas fa-plus"></i>
                    </button>
                </div>
                <button class="remove-btn" data-id="${item.id}">
                    <i class="fas fa-trash"></i> Remove
                </button>
            </div>
            
            <div class="item-total">
                <span class="item-total-label">Total</span>
                <span class="item-total-val">₹${itemTotal.toLocaleString('en-IN')}</span>
            </div>
        </div>
    `;
}

function bindItemEvents() {
    $$('.qty-btn.minus').forEach(btn => {
        btn.addEventListener('click', () => changeQty(+btn.dataset.id, -1));
    });
    
    $$('.qty-btn.plus').forEach(btn => {
        btn.addEventListener('click', () => changeQty(+btn.dataset.id, 1));
    });
    
    $$('.remove-btn').forEach(btn => {
        btn.addEventListener('click', () => removeItem(+btn.dataset.id));
    });
}

function changeQty(id, delta) {
    const item = cart.find(i => i.id === id);
    if (!item) return;
    
    item.quantity += delta;
    
    if (item.quantity <= 0) {
        removeItem(id);
    } else {
        saveCart();
        renderCart();
    }
}

function removeItem(id) {
    const item = cart.find(i => i.id === id);
    
    const el = document.querySelector(`.cart-item[data-id="${id}"]`);
    if (el) {
        el.style.transform = 'translateX(100%)';
        el.style.opacity = '0';
        el.style.transition = 'all 0.3s ease';
    }
    
    setTimeout(() => {
        cart = cart.filter(i => i.id !== id);
        saveCart();
        renderCart();
        if (item) toast(`${item.name} removed`, 'info');
    }, 300);
}

function clearCart() {
    if (cart.length === 0) return toast('Cart is already empty', 'info');
    
    if (confirm('Clear all items from cart?')) {
        cart = [];
        coupon = null;
        saveCart();
        renderCart();
        toast('Cart cleared', 'success');
    }
}

// ==================== SUMMARY ====================
function updateSummary() {
    const subtotal = cart.reduce((s, i) => s + i.price * i.quantity, 0);
    let delivery = subtotal >= 500 ? 0 : 40;
    
    // Product discount
    let discount = cart.reduce((s, i) => {
        if (i.originalPrice && i.originalPrice > i.price) {
            return s + (i.originalPrice - i.price) * i.quantity;
        }
        return s;
    }, 0);
    
    // Coupon discount
    let couponDiscount = 0;
    if (coupon && COUPONS[coupon]) {
        const c = COUPONS[coupon];
        if (c.type === 'percent') couponDiscount = Math.round(subtotal * c.discount / 100);
        else if (c.type === 'fixed') couponDiscount = c.discount;
        else if (c.type === 'shipping') delivery = 0;
    }
    
    total = subtotal + delivery - couponDiscount;
    const totalSavings = discount + couponDiscount + (delivery === 0 && subtotal >= 500 ? 40 : 0);
    
    // Update DOM
    $('subtotal').textContent = `₹${subtotal.toLocaleString('en-IN')}`;
    
    const delEl = $('delivery');
    if (delEl) {
        delEl.textContent = delivery === 0 ? 'FREE' : `₹${delivery}`;
        delEl.style.color = delivery === 0 ? 'var(--primary)' : '';
    }
    
    $('discount').textContent = (discount + couponDiscount) > 0 
        ? `₹${(discount + couponDiscount).toLocaleString('en-IN')}` 
        : '₹0';
    
    $('total').textContent = `₹${total.toLocaleString('en-IN')}`;
    
    // Savings
    const savingsEl = $('savingsNote');
    if (savingsEl) {
        if (totalSavings > 0) {
            $('savings').textContent = `₹${totalSavings.toLocaleString('en-IN')}`;
            savingsEl.classList.remove('hidden');
        } else {
            savingsEl.classList.add('hidden');
        }
    }
    
    // Checkout button
    const btn = $('checkoutBtn');
    if (btn) {
        btn.disabled = cart.length === 0;
        $('checkoutText').textContent = cart.length === 0 
            ? 'Cart is Empty' 
            : `Pay ₹${total.toLocaleString('en-IN')}`;
    }
}

// ==================== COUPON ====================
function applyCoupon() {
    const input = $('couponInput');
    const code = input?.value.trim().toUpperCase();
    
    if (!code) return showCouponMsg('Enter a coupon code', 'error');
    
    const c = COUPONS[code];
    if (!c) {
        coupon = null;
        updateSummary();
        return showCouponMsg('Invalid coupon code', 'error');
    }
    
    const subtotal = cart.reduce((s, i) => s + i.price * i.quantity, 0);
    if (subtotal < c.min) {
        return showCouponMsg(`Minimum order ₹${c.min} required`, 'error');
    }
    
    coupon = code;
    updateSummary();
    
    let msg = '';
    if (c.type === 'percent') msg = `${c.discount}% off applied!`;
    else if (c.type === 'fixed') msg = `₹,${c.discount} off applied!`;
    else if (c.type === 'shipping') msg = 'Free delivery applied!';
    
    showCouponMsg(msg, 'success');
    toast(`Coupon ${code} applied!`, 'success');
}

function showCouponMsg(msg, type) {
    const el = $('couponMsg');
    if (!el) return;
    
    el.innerHTML = `<i class="fas fa-${type === 'success' ? 'check' : 'exclamation'}-circle"></i> ${msg}`;
    el.className = `coupon-msg ${type}`;
    el.classList.remove('hidden');
    
    if (type === 'error') {
        setTimeout(() => el.classList.add('hidden'), 4000);
    }
}

// ==================== CHECKOUT ====================
function handleCheckout() {
    // Step 1: Check cart
    if (cart.length === 0) {
        return toast('Your cart is empty!', 'error');
    }
    
    // Step 2: Check login
    if (!isLoggedIn) {
        toast('Please login to checkout', 'warning');
        setTimeout(() => {
            window.location.href = 'login.html?redirect=cart';
        }, 1000);
        return;
    }
    
    // Step 3: Check address
    if (!isAddressComplete()) {
        toast('Please add delivery address', 'warning');
        openAddressModal();
        return;
    }
    
    // Step 4: Initialize payment
    initPayment();
}

function initPayment() {
    if (typeof Razorpay === 'undefined') {
        return toast('Payment gateway error. Refresh page.', 'error');
    }
    
    const orderId = 'ORD' + Date.now();
    
    const options = {
        key: RAZORPAY_KEY,
        amount: total * 100, // in paise
        currency: 'INR',
        name: 'FreshMart',
        description: `Order ${orderId}`,
        image: 'https://your-logo-url.com/logo.png',
        handler: response => paymentSuccess(response, orderId),
        prefill: {
            name: address.name,
            email: address.email,
            contact: '+91' + address.phone
        },
        notes: {
            order_id: orderId,
            address: `${address.address}, ${address.city} - ${address.pincode}`
        },
        theme: { color: '#2e7d32' },
        modal: {
            ondismiss: () => toast('Payment cancelled', 'info'),
            confirm_close: true
        }
    };
    
    try {
        const rzp = new Razorpay(options);
        rzp.on('payment.failed', paymentFailed);
        rzp.open();
    } catch (e) {
        console.error('Razorpay error:', e);
        toast('Payment initialization failed', 'error');
    }
}

function paymentSuccess(response, orderId) {
    showLoading('Creating your order...');
    
    setTimeout(() => {
        // Create order
        const order = {
            id: orderId,
            paymentId: response.razorpay_payment_id,
            items: [...cart],
            total,
            address: { ...address },
            status: 'confirmed',
            date: new Date().toLocaleDateString('en-IN', {
                day: 'numeric',
                month: 'short',
                year: 'numeric'
            }),
            timestamp: Date.now()
        };
        
        // Save order to user
        if (user) {
            if (!user.orders) user.orders = [];
            user.orders.unshift(order);
            saveUser();
        }
        
        // Clear cart
        cart = [];
        coupon = null;
        saveCart();
        
        hideLoading();
        showSuccess(order);
    }, 1500);
}

function paymentFailed(response) {
    console.error('Payment failed:', response);
    toast(response.error?.description || 'Payment failed', 'error');
}

function showSuccess(order) {
    $('orderId').textContent = `#${order.id}`;
    $('paidAmount').textContent = `₹${order.total.toLocaleString('en-IN')}`;
    $('paymentMethod').textContent = 'Razorpay';
    $('deliveryTo').textContent = `${order.address.city} - ${order.address.pincode}`;
    
    $('successModal')?.classList.add('active');
    document.body.style.overflow = 'hidden';
    
    renderCart();
}

// ==================== UTILITIES ====================
function toast(msg, type = 'success') {
    const el = $('toast');
    const msgEl = $('toastMsg');
    const iconEl = $('toastIcon');
    
    if (!el || !msgEl) return;
    
    msgEl.textContent = msg;
    
    const icons = {
        success: 'fa-check-circle',
        error: 'fa-times-circle',
        warning: 'fa-exclamation-circle',
        info: 'fa-info-circle'
    };
    
    iconEl.className = `fas ${icons[type] || icons.success}`;
    el.className = `toast ${type} show`;
    
    clearTimeout(window.toastTimer);
    window.toastTimer = setTimeout(hideToast, 4000);
}

function hideToast() {
    $('toast')?.classList.remove('show');
}

function showLoading(text = 'Processing...') {
    $('loadingText').textContent = text;
    $('loading')?.classList.remove('hidden');
}

function hideLoading() {
    $('loading')?.classList.add('hidden');
}

// ==================== CONSOLE ====================
console.log('%cðŸ›’ FreshMart Cart Ready!', 'color:#2e7d32;font-size:16px;font-weight:bold');
console.log('%cðŸ” Firebase Auth + Razorpay Payment', 'color:#666');