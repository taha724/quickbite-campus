// 1. Food Menu Dataset
const menu = [
  { id: 1, name: "Samosa Pav (2 pcs)", category: "Snacks", price: 30, img: "https://images.unsplash.com/photo-1601050690597-df0568f70950?w=300&auto=format&fit=crop&q=60" },
  { id: 2, name: "Aloo Puff / Patties", category: "Snacks", price: 25, img: "https://images.unsplash.com/photo-1626082927389-6cd097cdc6ec?w=300&auto=format&fit=crop&q=60" },
  { id: 3, name: "Veg Cheese Sandwich", category: "Snacks", price: 50, img: "https://images.unsplash.com/photo-1528735602780-2552fd46c7af?w=300&auto=format&fit=crop&q=60" },
  { id: 4, name: "Vada Pav Combo", category: "Snacks", price: 35, img: "https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=300&auto=format&fit=crop&q=60" },
  { id: 5, name: "Cold Coffee (Thick)", category: "Beverages", price: 40, img: "https://images.unsplash.com/photo-1517256064527-09c73fc73e38?w=300&auto=format&fit=crop&q=60" },
  { id: 6, name: "Masala Chai", category: "Beverages", price: 15, img: "https://images.unsplash.com/photo-1576092768241-dec231879fc3?w=300&auto=format&fit=crop&q=60" },
  { id: 7, name: "Fresh Lemon Ice Tea", category: "Beverages", price: 30, img: "https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=300&auto=format&fit=crop&q=60" },
  { id: 8, name: "Mango Shake", category: "Beverages", price: 45, img: "https://images.unsplash.com/photo-1546173159-315724a31696?w=300&auto=format&fit=crop&q=60" },
  { id: 9, name: "Masala Dosa", category: "Meals", price: 60, img: "https://images.unsplash.com/photo-1668236543090-82eba5ee5976?w=300&auto=format&fit=crop&q=60" },
  { id: 10, name: "Veg Fried Rice", category: "Meals", price: 70, img: "https://images.unsplash.com/photo-1603133872878-684f208fb84b?w=300&auto=format&fit=crop&q=60" },
  { id: 11, name: "Chole Bhature", category: "Meals", price: 75, img: "https://images.unsplash.com/photo-1626777552726-4a6b54c97e46?w=300&auto=format&fit=crop&q=60" },
  { id: 12, name: "Cheese Maggi", category: "Snacks", price: 40, img: "https://images.unsplash.com/photo-1612927601601-6638404737ce?w=300&auto=format&fit=crop&q=60" }
];

// 2. Application Runtime State
let cart = {};
let activeToken = null;
let orders = [
  { token: "T-842", student: "Student #210200107005", avatar: "https://api.dicebear.com/7.x/bottts/svg?seed=stu5", itemsSummary: "Masala Dosa x 1, Cold Coffee x 1", total: 100, paymentMethod: "Google Pay (GPay)", status: "COMPLETED", time: "10:15 AM" },
  { token: "T-912", student: "Student #210200107018", avatar: "https://api.dicebear.com/7.x/bottts/svg?seed=stu18", itemsSummary: "Samosa Pav (2 pcs) x 2", total: 60, paymentMethod: "PhonePe UPI", status: "READY", time: "10:22 AM" }
];
let studentOrderHistory = [];
let currentCategory = 'All';
let pendingOrder = null;
let activeUpiMethod = '';

let currentUser = null;
let userAvatarUrl = '';
let preparationTimerInterval = null;
let secondsLeft = 300;

// Food Community Reviews State
let selectedRating = 5;
let currentUploadedPhotoData = '';
let communityReviews = [
  {
    id: 1,
    student: "Student #210200107005",
    avatar: "https://api.dicebear.com/7.x/bottts/svg?seed=stu5",
    foodName: "Masala Dosa",
    rating: 5,
    photo: "https://images.unsplash.com/photo-1668236543090-82eba5ee5976?w=400&auto=format&fit=crop&q=60",
    comment: "Crispy edges, hot coconut chutney, and ready at counter in 3 minutes flat!",
    date: "Today, 10:25 AM"
  },
  {
    id: 2,
    student: "Student #210200107018",
    avatar: "https://api.dicebear.com/7.x/bottts/svg?seed=stu18",
    foodName: "Cold Coffee (Thick)",
    rating: 4,
    photo: "https://images.unsplash.com/photo-1517256064527-09c73fc73e38?w=400&auto=format&fit=crop&q=60",
    comment: "Great thickness and chilled properly. Best refreshing drink on hot afternoons.",
    date: "Today, 10:40 AM"
  }
];

// 3. LocalStorage Persistence (Preserves state across page reloads)
function saveSessionToStorage() {
  const sessionData = {
    currentUser,
    userAvatarUrl,
    studentOrderHistory,
    orders,
    activeToken,
    cart,
    communityReviews
  };
  localStorage.setItem('quickbite_session', JSON.stringify(sessionData));
}

function restoreSessionFromStorage() {
  try {
    const saved = localStorage.getItem('quickbite_session');
    if (saved) {
      const data = JSON.parse(saved);
      if (data.currentUser) {
        currentUser = data.currentUser;
        userAvatarUrl = data.userAvatarUrl || generateRandomAvatar(currentUser);
      }
      if (data.studentOrderHistory) studentOrderHistory = data.studentOrderHistory;
      if (data.orders && data.orders.length > 0) orders = data.orders;
      if (data.cart) cart = data.cart;
      if (data.communityReviews && data.communityReviews.length > 0) communityReviews = data.communityReviews;
      if (data.activeToken) {
        activeToken = data.activeToken;
        const currentActiveOrder = orders.find(o => o.token === activeToken);
        if (currentActiveOrder && currentActiveOrder.status === 'PREPARING') {
          document.getElementById('studentTokenCard').style.display = 'block';
          document.getElementById('displayToken').innerText = '#' + activeToken;
          document.getElementById('displayPaymentTag').innerText = `Paid via ${currentActiveOrder.paymentMethod || 'UPI'}`;
          document.getElementById('tokenCancelBtn').style.display = 'inline-block';
          updateStudentTokenUI('PREPARING');
          startPreparationCountdown();
        } else if (currentActiveOrder && currentActiveOrder.status === 'READY') {
          document.getElementById('studentTokenCard').style.display = 'block';
          document.getElementById('displayToken').innerText = '#' + activeToken;
          document.getElementById('displayPaymentTag').innerText = `Paid via ${currentActiveOrder.paymentMethod || 'UPI'}`;
          document.getElementById('tokenCancelBtn').style.display = 'none';
          updateStudentTokenUI('READY');
        }
      }
    }
  } catch (e) {
    console.error("Could not load local session:", e);
  }
}

// 4. Drawer & Modal Dialogs
function toggleNavDrawer() {
  const drawer = document.getElementById('navDrawer');
  const overlay = document.getElementById('drawerOverlay');
  if (drawer.classList.contains('open')) {
    drawer.classList.remove('open');
    overlay.style.display = 'none';
  } else {
    drawer.classList.add('open');
    overlay.style.display = 'block';
  }
}

function openSidebarDialog(feature) {
  toggleNavDrawer();
  const modal = document.getElementById('featureModal');
  const title = document.getElementById('featureModalTitle');
  const body = document.getElementById('featureModalBody');

  if (feature === 'about') {
    title.innerHTML = '<i class="fa-solid fa-circle-info" style="color:var(--accent-blue);"></i> About QuickBite';
    body.innerHTML = `
      <p><strong>QuickBite</strong> is an automated smart campus canteen pre-ordering ecosystem engineered to eliminate congestion during short lecture breaks.</p>
      <ul style="margin: 10px 0 10px 20px; font-size:12px; color:#444;">
        <li>Zero-Queue express counter pickup</li>
        <li>Real-time Kitchen Display System (KDS) synchronization</li>
        <li>Integrated UPI & Campus RFID smart card wallet</li>
        <li>Student Food Reviews with live photo upload verification</li>
      </ul>
      <p style="font-size:11px; color:#666;">Developed for Diploma Engineering Project Demonstration.</p>
    `;
  } else if (feature === 'contact') {
    title.innerHTML = '<i class="fa-solid fa-headset" style="color:var(--accent-green);"></i> Canteen Helpdesk';
    body.innerHTML = `
      <p>Need support regarding your food token or balance refund?</p>
      <div style="background:#F1F5F9; padding:12px; border-radius:8px; margin:10px 0; font-size:12px;">
        <p><strong><i class="fa-solid fa-location-dot"></i> Counter:</strong> Ground Floor Main Canteen Express Desk</p>
        <p><strong><i class="fa-solid fa-envelope"></i> Email:</strong> canteen-support@gmiu.edu.in</p>
        <p style="margin-top: 6px;"><strong><i class="fa-solid fa-phone"></i> Call Us:</strong></p>
        <p style="padding-left: 18px; font-weight: 700; color: var(--secondary);">+91 75749 49494</p>
        <p style="padding-left: 18px; font-weight: 700; color: var(--secondary);">+91 90999 51160</p>
        <p style="margin-top: 6px;"><strong><i class="fa-solid fa-clock"></i> Hours:</strong> 08:30 AM – 05:30 PM (Mon-Sat)</p>
      </div>
    `;
  } else if (feature === 'suggestions') {
    title.innerHTML = '<i class="fa-solid fa-lightbulb" style="color:#EC4899;"></i> Campus Suggestions Box';
    body.innerHTML = `
      <p>Have an idea for a new food item or menu improvement? Let the canteen staff know:</p>
      <div style="margin-top:10px;">
        <label style="font-size:11px; font-weight:bold;">Your Suggestion / Food Request</label>
        <textarea class="custom-textarea" placeholder="e.g., Please add Paneer Roll or Fruit Salads to the afternoon menu..."></textarea>
        <button class="btn-modal-action" style="background:var(--primary); color:white; margin-top:8px;" onclick="submitSuggestion()">Submit Suggestion</button>
      </div>
    `;
  } else if (feature === 'cancellation') {
    title.innerHTML = '<i class="fa-solid fa-ban" style="color:var(--danger);"></i> Cancellation & Refund Policy';
    body.innerHTML = `
      <p><strong>Pre-Order Cancellation Guidelines:</strong></p>
      <ul style="margin: 8px 0 12px 18px; font-size:12px; color:#444;">
        <li>Orders can be cancelled <strong>within 60 seconds</strong> of placing while status is <em>PREPARING</em>.</li>
        <li>Orders marked as <strong>READY FOR PICKUP</strong> cannot be cancelled.</li>
        <li>Refunds for cancelled orders are instantly credited back to your UPI handle or Campus Smart Card wallet.</li>
      </ul>
      <p style="font-size:11px; color:#666;">To cancel an active order, click the <strong>'Cancel Order'</strong> button directly inside your active digital token card.</p>
    `;
  }

  modal.style.display = 'flex';
}

function closeFeatureModal() {
  document.getElementById('featureModal').style.display = 'none';
}

function submitSuggestion() {
  alert("Thank you! Your suggestion has been forwarded to campus canteen management.");
  closeFeatureModal();
}

// 5. 3-Way Global View Switcher
function switchGlobalView(view) {
  const liveView = document.getElementById('liveOperationsView');
  const reviewsView = document.getElementById('reviewsCommunityView');
  const adminView = document.getElementById('adminDashboardView');
  const btnLive = document.getElementById('viewBtnLive');
  const btnReviews = document.getElementById('viewBtnReviews');
  const btnAdmin = document.getElementById('viewBtnAdmin');

  liveView.style.display = 'none';
  reviewsView.style.display = 'none';
  adminView.style.display = 'none';
  btnLive.classList.remove('active');
  btnReviews.classList.remove('active');
  btnAdmin.classList.remove('active');

  if (view === 'live') {
    liveView.style.display = 'flex';
    btnLive.classList.add('active');
  } else if (view === 'reviews') {
    reviewsView.style.display = 'block';
    btnReviews.classList.add('active');
    populateReviewFoodDropdown();
    renderReviewsCommunityFeed();
  } else if (view === 'admin') {
    adminView.style.display = 'block';
    btnAdmin.classList.add('active');
    updateAdminDashboardMetrics();
  }
}

// 6. Food Reviews & Photo Upload Handler
function populateReviewFoodDropdown() {
  const select = document.getElementById('reviewFoodSelect');
  select.innerHTML = menu.map(m => `<option value="${m.name}">${m.name} (₹${m.price})</option>`).join('');
}

function setStarRating(stars) {
  selectedRating = stars;
  const starElements = document.querySelectorAll('#starRatingContainer .star');
  starElements.forEach((el, index) => {
    if (index < stars) {
      el.classList.add('selected');
    } else {
      el.classList.remove('selected');
    }
  });
}

function handleFoodPhotoSelected(event) {
  const file = event.target.files[0];
  if (file) {
    const reader = new FileReader();
    reader.onload = function(e) {
      currentUploadedPhotoData = e.target.result;
      const imgPreview = document.getElementById('reviewImagePreview');
      const placeholder = document.getElementById('photoPlaceholder');
      imgPreview.src = currentUploadedPhotoData;
      imgPreview.style.display = 'block';
      placeholder.style.display = 'none';
    };
    reader.readAsDataURL(file);
  }
}

function submitStudentFoodReview() {
  if (!currentUser) {
    alert("Please sign in with your student enrollment ID first before posting a review.");
    document.getElementById('loginModal').style.display = 'flex';
    return;
  }

  const foodName = document.getElementById('reviewFoodSelect').value;
  const comment = document.getElementById('reviewCommentInput').value.trim();

  if (!comment) {
    alert("Please write a short comment about your food experience.");
    return;
  }

  const menuItem = menu.find(m => m.name === foodName);
  const finalPhoto = currentUploadedPhotoData || (menuItem ? menuItem.img : 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400');

  const newReview = {
    id: Date.now(),
    student: `Student #${currentUser}`,
    avatar: userAvatarUrl || generateRandomAvatar(currentUser),
    foodName: foodName,
    rating: selectedRating,
    photo: finalPhoto,
    comment: comment,
    date: "Just now"
  };

  communityReviews.unshift(newReview);
  saveSessionToStorage();
  renderReviewsCommunityFeed();

  // Reset form
  document.getElementById('reviewCommentInput').value = '';
  document.getElementById('reviewFileInput').value = '';
  currentUploadedPhotoData = '';
  document.getElementById('reviewImagePreview').style.display = 'none';
  document.getElementById('photoPlaceholder').style.display = 'block';
  setStarRating(5);

  alert("Review & food photo posted successfully to the campus community feed!");
}

function renderReviewsCommunityFeed() {
  const container = document.getElementById('reviewsFeedList');
  if (communityReviews.length === 0) {
    container.innerHTML = `<p style="color: var(--text-muted); font-size: 13px;">No food reviews posted yet. Be the first to share a picture!</p>`;
    return;
  }

  container.innerHTML = communityReviews.map(r => `
    <div class="feed-review-card">
      <div class="feed-review-img-box">
        <img src="${r.photo}" alt="${r.foodName}">
      </div>
      <div class="feed-review-body">
        <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 4px;">
          <div>
            <strong style="font-size: 13px; color: var(--secondary);">${r.foodName}</strong>
            <div style="font-size: 10px; color: var(--text-muted);">${r.student} • ${r.date}</div>
          </div>
          <div class="review-stars">${'★'.repeat(r.rating)}${'☆'.repeat(5 - r.rating)}</div>
        </div>
        <p style="font-size: 12px; color: #475569; margin-top: 6px; line-height: 1.4;">"${r.comment}"</p>
      </div>
    </div>
  `).join('');
}

// 7. Admin Dashboard Real-Time Calculations
function updateAdminDashboardMetrics() {
  document.getElementById('adminTotalMenus').innerText = menu.length;
  
  const activeOrCompleted = orders.filter(o => o.status !== 'CANCELLED');
  document.getElementById('adminTotalOrders').innerText = activeOrCompleted.length;
  
  const totalRev = activeOrCompleted.reduce((acc, cur) => acc + cur.total, 0);
  document.getElementById('adminTotalRevenue').innerText = '₹' + totalRev;

  const targetPercent = Math.min(100, Math.round((totalRev / 500) * 100));
  document.getElementById('adminRevProgress').style.width = targetPercent + '%';
  document.getElementById('adminRevTargetText').innerText = targetPercent + '%';

  const dynamicBarHeight = Math.min(125, Math.max(25, Math.round((totalRev / 300) * 100)));
  const liveBar = document.getElementById('realtimeTodayBar');
  if (liveBar) liveBar.style.height = dynamicBarHeight + 'px';

  const ledgerBody = document.getElementById('adminLedgerTableBody');
  ledgerBody.innerHTML = orders.map(o => `
    <tr>
      <td><strong style="color:var(--primary);">#${o.token}</strong></td>
      <td>${o.student}</td>
      <td>${o.itemsSummary}</td>
      <td><strong>₹${o.total}</strong></td>
      <td><span style="font-size:11px; font-weight:600; color:var(--text-muted);">${o.paymentMethod || 'Paid'}</span></td>
      <td>
        <span class="status-badge-table ${o.status === 'READY' ? 'ready' : o.status === 'COMPLETED' ? 'completed' : o.status === 'CANCELLED' ? 'cancelled' : 'prep'}">
          ${o.status}
        </span>
      </td>
      <td>${o.time}</td>
    </tr>
  `).join('');
}

// 8. Identity & Avatar Generation
function generateRandomAvatar(seed) {
  const avatarStyles = ['bottts', 'adventurer', 'fun-emoji', 'pixel-art', 'lorelei'];
  const randomStyle = avatarStyles[Math.floor(Math.random() * avatarStyles.length)];
  return `https://api.dicebear.com/7.x/${randomStyle}/svg?seed=${seed}`;
}

function updateAuthUI() {
  const headerText = document.getElementById('headerEnrollmentText');
  const logoutBtn = document.getElementById('logoutBtn');
  const menuSub = document.getElementById('menuUserSub');
  const avatarImg = document.getElementById('headerAvatarImg');

  if (currentUser) {
    headerText.innerText = `${currentUser}`;
    avatarImg.src = userAvatarUrl;
    avatarImg.style.display = 'inline-block';
    logoutBtn.style.display = 'inline-block';
    menuSub.innerHTML = `Signed in as: <strong>#${currentUser}</strong>`;
  } else {
    headerText.innerText = `Not Signed In`;
    avatarImg.style.display = 'none';
    logoutBtn.style.display = 'none';
    menuSub.innerHTML = `Browsing as: <strong>Guest (Sign in to Order)</strong>`;
  }
}

function logoutUser() {
  currentUser = null;
  userAvatarUrl = '';
  localStorage.removeItem('quickbite_session');
  updateAuthUI();
  renderHistoryUI();
}

function performLogin() {
  const enrollment = document.getElementById('loginEnrollment').value.trim();
  const pass = document.getElementById('loginPassword').value.trim();

  if (!enrollment || !pass) {
    document.getElementById('loginErrorMsg').style.display = 'block';
    return;
  }

  currentUser = enrollment;
  userAvatarUrl = generateRandomAvatar(enrollment + Date.now());
  document.getElementById('loginModal').style.display = 'none';
  document.getElementById('loginErrorMsg').style.display = 'none';
  
  saveSessionToStorage();
  updateAuthUI();
  renderHistoryUI();

  openPaymentModal();
}

function handleCheckoutClick() {
  if (!currentUser) {
    document.getElementById('loginModal').style.display = 'flex';
  } else {
    openPaymentModal();
  }
}

// 9. Sidebar Tabs (Cart vs History)
function switchSidebarTab(tab) {
  const cartView = document.getElementById('sidebarCartView');
  const historyView = document.getElementById('sidebarHistoryView');
  const tabCart = document.getElementById('sideTabCart');
  const tabHistory = document.getElementById('sideTabHistory');

  if (tab === 'cart') {
    cartView.style.display = 'flex';
    historyView.style.display = 'none';
    tabCart.classList.add('active');
    tabHistory.classList.remove('active');
  } else {
    cartView.style.display = 'none';
    historyView.style.display = 'flex';
    tabCart.classList.remove('active');
    tabHistory.classList.add('active');
    renderHistoryUI();
  }
}

function renderHistoryUI() {
  const container = document.getElementById('historyListContainer');
  if (!currentUser || studentOrderHistory.length === 0) {
    container.innerHTML = `
      <div style="text-align: center; color: var(--text-muted); padding-top: 50px;">
        <i class="fa-solid fa-receipt" style="font-size: 32px; color: #CBD5E1; margin-bottom: 8px;"></i>
        <p style="font-size: 13px; font-weight: 600;">No past orders found.</p>
      </div>
    `;
    return;
  }

  container.innerHTML = studentOrderHistory.map(order => `
    <div class="history-card">
      <div class="history-header">
        <span class="history-token">Token #${order.token}</span>
        <span class="history-date">${order.time}</span>
      </div>
      <div class="history-items">${order.itemsSummary}</div>
      <div class="history-footer">
        <span style="color: var(--text-muted); font-size:10px;">Paid via: <strong>${order.paymentMethod}</strong></span>
        <strong style="color: ${order.status === 'CANCELLED' ? 'var(--danger)' : 'var(--accent-green)'}; font-size: 13px;">
          ${order.status === 'CANCELLED' ? 'REFUNDED ₹' + order.total : '₹' + order.total}
        </strong>
      </div>
    </div>
  `).join('');
}

// 10. Menu Catalog Rendering & Filters
function renderMenu() {
  const grid = document.getElementById('menuGrid');
  const filtered = currentCategory === 'All' ? menu : menu.filter(m => m.category === currentCategory);

  grid.innerHTML = filtered.map(item => {
    const count = cart[item.id]?.qty || 0;
    return `
      <div class="food-card">
        <div class="food-img-container">
          <span class="food-cat-tag">${item.category}</span>
          <img src="${item.img}" class="food-img" alt="${item.name}">
        </div>
        <div class="food-info">
          <div class="food-name">${item.name}</div>
          <div class="food-meta">
            <span class="food-price">₹${item.price}</span>
            <div class="qty-box">
              ${count > 0 ? `
                <button class="btn-circle" onclick="updateQty(${item.id}, -1)">-</button>
                <span class="qty-display">${count}</span>
                <button class="btn-circle" onclick="updateQty(${item.id}, 1)">+</button>
              ` : `
                <button class="btn-circle add-initial" onclick="updateQty(${item.id}, 1)">+ Add</button>
              `}
            </div>
          </div>
        </div>
      </div>
    `;
  }).join('');
}

function filterCategory(cat, btn) {
  currentCategory = cat;
  document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  renderMenu();
}

function updateQty(id, delta) {
  const item = menu.find(m => m.id === id);
  if (!cart[id]) {
    if (delta > 0) cart[id] = { ...item, qty: 1 };
  } else {
    cart[id].qty += delta;
    if (cart[id].qty <= 0) delete cart[id];
  }
  saveSessionToStorage();
  renderCart();
  renderMenu();
}

function removeSingleItem(id) {
  if (cart[id]) {
    delete cart[id];
    saveSessionToStorage();
    renderCart();
    renderMenu();
  }
}

function clearCart() {
  cart = {};
  saveSessionToStorage();
  renderCart();
  renderMenu();
}

function renderCart() {
  const container = document.getElementById('cartContainer');
  const items = Object.values(cart);
  const clearBtn = document.getElementById('clearAllBtn');
  const orderBtn = document.getElementById('orderBtn');
  let total = 0;

  if (items.length === 0) {
    container.innerHTML = `
      <div style="text-align: center; color: var(--text-muted); padding-top: 50px;">
        <i class="fa-solid fa-cart-shopping" style="font-size: 32px; color: #CBD5E1; margin-bottom: 8px;"></i>
        <p style="font-size: 13px; font-weight: 600;">Your cart is empty.</p>
        <p style="font-size: 11px; margin-top: 4px;">Add snacks from the menu to pre-order.</p>
      </div>
    `;
    document.getElementById('totalPrice').innerText = '0';
    clearBtn.style.display = 'none';
    orderBtn.disabled = true;
    return;
  }

  clearBtn.style.display = 'inline-block';
  orderBtn.disabled = false;

  container.innerHTML = items.map(item => {
    const itemTotal = item.price * item.qty;
    total += itemTotal;
    return `
      <div class="cart-item-card">
        <div>
          <div class="cart-item-title">${item.name}</div>
          <div class="cart-item-sub">₹${item.price} × ${item.qty} = <strong style="color:var(--primary);">₹${itemTotal}</strong></div>
        </div>
        <div style="display: flex; align-items: center; gap: 6px;">
          <button class="btn-circle" onclick="updateQty(${item.id}, -1)">-</button>
          <span class="qty-display">${item.qty}</span>
          <button class="btn-circle" onclick="updateQty(${item.id}, 1)">+</button>
          <button class="btn-trash" title="Remove Item" onclick="removeSingleItem(${item.id})">
            <i class="fa-solid fa-trash"></i>
          </button>
        </div>
      </div>
    `;
  }).join('');

  document.getElementById('totalPrice').innerText = total;
}

// 11. Checkout & Payment Simulation
function openPaymentModal() {
  const items = Object.values(cart);
  if (items.length === 0) return;

  const total = items.reduce((acc, cur) => acc + (cur.price * cur.qty), 0);
  const summary = items.map(i => `${i.name} × ${i.qty}`).join(', ');

  pendingOrder = {
    token: "T-" + Math.floor(100 + Math.random() * 900),
    student: `Student #${currentUser}`,
    avatar: userAvatarUrl,
    itemsSummary: summary,
    total: total,
    status: "PREPARING",
    time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  };

  document.getElementById('modalPayAmount').innerText = total;
  document.getElementById('upiQrImg').src = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=upi://pay?pa=quickbite@upi%26pn=QuickBite_Canteen%26am=${total}%26cu=INR`;
  document.getElementById('paymentModal').style.display = 'flex';
}

function closeAllModals() {
  document.getElementById('loginModal').style.display = 'none';
  document.getElementById('paymentModal').style.display = 'none';
  document.getElementById('upiPinModal').style.display = 'none';
  document.getElementById('processingModal').style.display = 'none';
  document.getElementById('upiPinInput').value = '';
  document.getElementById('pinErrorMsg').style.display = 'none';
  pendingOrder = null;
}

function initiateUpiPinAuth(methodName) {
  if (!navigator.onLine) {
    alert("Internet connection required for UPI network authentication.");
    return;
  }

  activeUpiMethod = methodName;
  document.getElementById('paymentModal').style.display = 'none';
  document.getElementById('selectedAppBadge').innerText = methodName;
  document.getElementById('pinModalAmount').innerText = pendingOrder.total;
  document.getElementById('upiPinInput').value = '';
  document.getElementById('pinErrorMsg').style.display = 'none';
  
  document.getElementById('upiPinModal').style.display = 'flex';
  setTimeout(() => document.getElementById('upiPinInput').focus(), 100);
}

function backToPaymentSelection() {
  document.getElementById('upiPinModal').style.display = 'none';
  document.getElementById('paymentModal').style.display = 'flex';
}

function verifyAndSubmitUpiPin() {
  const pin = document.getElementById('upiPinInput').value;
  if (pin.length < 4) {
    document.getElementById('pinErrorMsg').style.display = 'block';
    return;
  }

  document.getElementById('upiPinModal').style.display = 'none';
  document.getElementById('processingModal').style.display = 'flex';

  setTimeout(() => {
    document.getElementById('processingModal').style.display = 'none';
    finalizeOrder(activeUpiMethod);
  }, 1500);
}

function confirmDirectCard(methodName) {
  document.getElementById('paymentModal').style.display = 'none';
  finalizeOrder(methodName);
}

function finalizeOrder(paymentMethod) {
  if (!pendingOrder) return;

  pendingOrder.paymentMethod = paymentMethod;
  orders.unshift(pendingOrder);
  studentOrderHistory.unshift({ ...pendingOrder });
  activeToken = pendingOrder.token;

  cart = {};
  saveSessionToStorage();
  renderCart();
  renderMenu();
  renderKitchen();
  updateAdminDashboardMetrics();

  document.getElementById('studentTokenCard').style.display = 'block';
  document.getElementById('displayToken').innerText = '#' + activeToken;
  document.getElementById('displayPaymentTag').innerText = `Paid via ${paymentMethod}`;
  document.getElementById('tokenCancelBtn').style.display = 'inline-block';
  updateStudentTokenUI("PREPARING");

  startPreparationCountdown();
}

// 12. Cancellation Handler
function cancelActiveToken() {
  if (!activeToken) return;

  const order = orders.find(o => o.token === activeToken);
  if (!order) return;

  if (order.status === 'READY') {
    alert("This order is already cooked and ready for pickup. It cannot be cancelled.");
    return;
  }

  if (confirm(`Cancel token #${activeToken} and process instant refund of ₹${order.total}?`)) {
    if (preparationTimerInterval) clearInterval(preparationTimerInterval);
    
    order.status = "CANCELLED";
    const histOrder = studentOrderHistory.find(h => h.token === activeToken);
    if (histOrder) histOrder.status = "CANCELLED";

    updateStudentTokenUI("CANCELLED");
    document.getElementById('tokenCancelBtn').style.display = 'none';
    
    saveSessionToStorage();
    renderKitchen();
    renderHistoryUI();
    updateAdminDashboardMetrics();
    alert(`Order #${activeToken} cancelled. ₹${order.total} has been refunded to your ${order.paymentMethod}.`);
  }
}

// 13. Countdown Timer (5 Minutes)
function startPreparationCountdown() {
  if (preparationTimerInterval) clearInterval(preparationTimerInterval);
  secondsLeft = 300;

  updateTimerDisplay();
  preparationTimerInterval = setInterval(() => {
    secondsLeft--;
    updateTimerDisplay();

    if (secondsLeft <= 0) {
      clearInterval(preparationTimerInterval);
      markReady(activeToken);
    }
  }, 1000);
}

function updateTimerDisplay() {
  const minutes = Math.floor(secondsLeft / 60);
  const secs = secondsLeft % 60;
  const formatted = `${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  const timerElement = document.getElementById('timerCountdown');
  if (timerElement) timerElement.innerText = formatted;
}

// 14. Kitchen State Transitions
function markReady(token) {
  const order = orders.find(o => o.token === token);
  if (order && order.status === 'PREPARING') {
    order.status = "READY";
    saveSessionToStorage();
    renderKitchen();
    updateAdminDashboardMetrics();
    if (activeToken === token) {
      if (preparationTimerInterval) clearInterval(preparationTimerInterval);
      updateStudentTokenUI("READY");
      document.getElementById('tokenCancelBtn').style.display = 'none';
      showPickupNotification(token);
    }
  }
}

function showPickupNotification(token) {
  document.getElementById('popupTokenId').innerText = '#' + token;
  document.getElementById('pickupAlertModal').style.display = 'flex';
}

function dismissPickupAlert() {
  document.getElementById('pickupAlertModal').style.display = 'none';
}

function markComplete(token) {
  const order = orders.find(o => o.token === token);
  if (order) {
    order.status = "COMPLETED";
    saveSessionToStorage();
    renderKitchen();
    updateAdminDashboardMetrics();
    if (activeToken === token) updateStudentTokenUI("COMPLETED");
  }
}

function updateStudentTokenUI(status) {
  const badge = document.getElementById('displayTokenStatus');
  const timerBox = document.getElementById('timerContainer');
  
  if (status === "READY") {
    badge.innerText = "READY FOR PICKUP AT COUNTER";
    badge.className = "status-pill ready";
    if (timerBox) timerBox.style.display = 'none';
  } else if (status === "COMPLETED") {
    badge.innerText = "ORDER COLLECTED";
    badge.className = "status-pill";
    badge.style.background = "#475569";
    badge.style.color = "#FFF";
    if (timerBox) timerBox.style.display = 'none';
  } else if (status === "CANCELLED") {
    badge.innerText = "ORDER CANCELLED (REFUNDED)";
    badge.className = "status-pill cancelled";
    if (timerBox) timerBox.style.display = 'none';
  } else {
    badge.innerText = "PREPARING IN KITCHEN";
    badge.className = "status-pill preparing";
    if (timerBox) timerBox.style.display = 'block';
  }
}

function renderKitchen() {
  const container = document.getElementById('kitchenOrdersList');
  const activeKitchenOrders = orders.filter(o => o.status !== 'CANCELLED');

  if (activeKitchenOrders.length === 0) {
    container.innerHTML = `
      <div style="text-align: center; color: var(--text-muted); padding-top: 50px;">
        <i class="fa-solid fa-clipboard-check" style="font-size: 32px; color: #CBD5E1; margin-bottom: 8px;"></i>
        <p style="font-size: 13px; font-weight: 600;">No active orders in kitchen queue.</p>
      </div>
    `;
    return;
  }

  container.innerHTML = activeKitchenOrders.map(o => `
    <div class="kitchen-card ${o.status === 'READY' ? 'is-ready' : 'is-prep'}">
      <div style="display:flex; align-items:center; gap:10px;">
        <img src="${o.avatar || 'https://api.dicebear.com/7.x/bottts/svg?seed=student'}" class="user-avatar-img" alt="avatar">
        <div>
          <div class="kitchen-meta">${o.student} • ${o.time} • <span style="color:var(--accent-green); font-weight:700;">${o.paymentMethod || 'Paid'}</span></div>
          <div class="kitchen-token">#${o.token}</div>
          <div class="kitchen-items">${o.itemsSummary}</div>
          <div style="color: var(--accent-green); font-size: 13px; font-weight: bold; margin-top: 2px;">Total: ₹${o.total}</div>
        </div>
      </div>
      <div>
        ${o.status === 'PREPARING' ? `<button class="btn-kds btn-kds-ready" onclick="markReady('${o.token}')"><i class="fa-solid fa-bell"></i> Mark Ready</button>` : ''}
        ${o.status === 'READY' ? `<button class="btn-kds btn-kds-complete" onclick="markComplete('${o.token}')"><i class="fa-solid fa-check"></i> Handover</button>` : ''}
        ${o.status === 'COMPLETED' ? `<span style="color: var(--text-muted); font-weight: 700; font-size: 11px;"><i class="fa-solid fa-circle-check"></i> Collected</span>` : ''}
      </div>
    </div>
  `).join('');
}

// 15. App Initialization on Page Load
restoreSessionFromStorage();
renderMenu();
renderCart();
renderKitchen();
updateAuthUI();
updateAdminDashboardMetrics();