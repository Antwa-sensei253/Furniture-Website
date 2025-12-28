let cart = JSON.parse(localStorage.getItem('furnitureCart')) || [];
let productsData = [];

document.addEventListener('DOMContentLoaded', () => {
    fetchProducts();
    updateCartUI();
    checkUserAuth();

    // Hamburger listener
    document.querySelectorAll('.hamburger').forEach(btn => {
        btn.removeEventListener('click', toggleMenu);
        btn.addEventListener('click', toggleMenu);
    });
});

async function fetchProducts() {
    const bestSellingGrid = document.getElementById('best-selling-grid');
    const newArrivalsGrid = document.getElementById('more-products-grid');
    const specialOffersGrid = document.getElementById('special-offers-grid');

    try {
        // Fetch products from API (Furniture category only)
        const response = await fetch('https://dummyjson.com/products/category/furniture');
        if (!response.ok) throw new Error('Network response was not ok');

        const data = await response.json();
        // DummyJSON returns object with products array
        productsData = data.products;

        // Slice data for different sections (adjusting for potentially fewer items from category API)
        let bestSelling = productsData.slice(0, Math.min(4, productsData.length));
        let newArrivals = productsData.slice(Math.min(4, productsData.length), Math.min(8, productsData.length));
        let specialOffers = productsData.slice(Math.min(8, productsData.length), Math.min(11, productsData.length));

        // Ensure Special Offers has 3 items
        while (specialOffers.length < 3 && productsData.length > 0) {
            // Add random products from the list to fill the gap
            specialOffers.push(productsData[Math.floor(Math.random() * productsData.length)]);
        }

        // Render
        if (bestSellingGrid) renderProducts(bestSelling, bestSellingGrid);
        if (newArrivalsGrid) renderProducts(newArrivals, newArrivalsGrid);
        if (specialOffersGrid) renderSpecialOffers(specialOffers, specialOffersGrid);

    } catch (error) {
        console.error("Error loading products:", error);
        if (specialOffersGrid) specialOffersGrid.innerHTML = `<p class="error-msg">Failed to load offers.</p>`;
    }
}

function renderProducts(products, container) {
    if (!container) return;

    container.innerHTML = products.map(product => `
        <div class="product-card">
            <div class="p-image">
                <img src="${product.thumbnail}" alt="${product.title}" loading="lazy" decoding="async" />
                <button class="like-btn">
                    <i class="fa-regular fa-heart"></i>
                </button>
            </div>
            
            <div class="p-info">
                <h3>${product.title}</h3>
                <div class="info-row">
                    <div class="price-box">
                      <span class="current-price">$${product.price}</span>
                    </div>
                    <div class="rating-badge">
                        <i class="fa-solid fa-star" style="color:#ffffff;font-size:0.6rem"></i> ${product.rating}
                    </div>
                </div>
                <button class="offer-btn" onclick="addToCart(${product.id})" style="width:100%; margin-top:10px;">
                    <i class="fa-solid fa-cart-plus"></i> Add to Cart
                </button>
            </div>
        </div>
    `).join('');
}

function renderSpecialOffers(products, container) {
    if (!container) return;
    container.innerHTML = products.map(product => `
        <div class="offer-card">
          <div class="offer-content">
            <span class="offer-badge">Big Saving</span>
            <h3>${product.title}</h3>
            <p class="offer-price">$${product.price}</p>
            <button class="offer-btn" onclick="addToCart(${product.id})">Add to Cart</button>
          </div>
          <div class="offer-image">
            <img src="${product.thumbnail}" alt="${product.title}" loading="lazy" decoding="async" />
          </div>
        </div>
    `).join('');
}

function addToCart(productId) {
    const product = productsData.find(p => p.id === productId);
    if (!product) return;

    const existingItem = cart.find(item => item.id === productId);
    if (existingItem) {
        existingItem.quantity += 1;
    } else {
        cart.push({
            id: product.id,
            title: product.title,
            price: product.price,
            image: product.thumbnail,
            quantity: 1
        });
    }
    saveCart();
    updateCartUI();

    const drawer = document.getElementById('cart-drawer');
    if (drawer && !drawer.classList.contains('open')) {
        toggleCart();
    } else {
        const badge = document.querySelector('.cart-count');
        if (badge) {
            badge.style.transform = 'scale(1.2)';
            setTimeout(() => badge.style.transform = 'scale(1)', 200);
        }
    }
}

function removeFromCart(productId) {
    cart = cart.filter(item => item.id !== productId);
    saveCart();
    updateCartUI();
}

function updateQuantity(productId, change) {
    const item = cart.find(item => item.id === productId);
    if (item) {
        item.quantity += change;
        if (item.quantity <= 0) {
            removeFromCart(productId);
        } else {
            saveCart();
            updateCartUI();
        }
    }
}

function saveCart() {
    localStorage.setItem('furnitureCart', JSON.stringify(cart));
}

function updateCartUI() {
    const container = document.getElementById('cart-items-container');
    const totalEl = document.querySelector('.cart-total-price');
    const countBadge = document.querySelector('.cart-count');

    const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);

    document.querySelectorAll('.cart-count').forEach(badge => {
        badge.innerText = totalItems;
        badge.style.display = totalItems > 0 ? 'flex' : 'none';
    });

    if (container) {
        if (cart.length === 0) {
            container.innerHTML = '<p class="empty-msg">Your cart is empty.</p>';
            if (totalEl) totalEl.innerText = '$0.00';
            return;
        }

        let totalPrice = 0;
        container.innerHTML = cart.map(item => {
            totalPrice += item.price * item.quantity;
            return `
                <div class="cart-item">
                    <img src="${item.image}" alt="${item.title}">
                    <div class="item-details">
                        <h4>${item.title}</h4>
                        <p>$${item.price}</p>
                        <div class="quantity-controls">
                            <button onclick="updateQuantity(${item.id}, -1)">-</button>
                            <span>${item.quantity}</span>
                            <button onclick="updateQuantity(${item.id}, 1)">+</button>
                        </div>
                    </div>
                    <button onclick="removeFromCart(${item.id})" class="remove-btn">
                        <i class="fa-solid fa-trash"></i>
                    </button>
                </div>
            `;
        }).join('');

        if (totalEl) totalEl.innerText = `$${totalPrice.toFixed(2)}`;
    }
}

function toggleMenu() {
    const navLinks = document.querySelector('.nav-links');
    if (!navLinks) return;

    let overlay = document.querySelector('.nav-overlay');
    if (!overlay) {
        overlay = document.createElement('div');
        overlay.className = 'nav-overlay';
        overlay.addEventListener('click', closeMenu);
        document.body.appendChild(overlay);
    }
    const isOpen = navLinks.classList.contains('active');
    if (isOpen) {
        closeMenu();
    } else {
        navLinks.classList.add('active');
        requestAnimationFrame(() => overlay.classList.add('open'));
        document.body.classList.add('menu-open');
    }
}

function closeMenu() {
    const navLinks = document.querySelector('.nav-links');
    const overlay = document.querySelector('.nav-overlay');
    if (navLinks) navLinks.classList.remove('active');
    if (overlay) overlay.classList.remove('open');
    document.body.classList.remove('menu-open');
}

window.addEventListener('resize', () => {
    if (window.innerWidth > 900) closeMenu();
});

function toggleCart() {
    const drawer = document.getElementById('cart-drawer');
    const overlay = document.querySelector('.cart-overlay');
    if (drawer && overlay) {
        drawer.classList.toggle('open');
        overlay.classList.toggle('open');
    }
}

function checkUserAuth() {
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    const authContainer = document.getElementById('auth-btn-container');
    if (currentUser && authContainer) {
        authContainer.innerHTML = `
            <span style="font-size: 0.9rem; margin-right:10px;">Hi, ${currentUser.name || 'User'}</span>
            <button class="sign-in-btn" onclick="logout()" style="background-color: #dc3545;">Logout</button>
        `;
    }
}

function logout() {
    localStorage.removeItem('currentUser');
    window.location.reload();
}