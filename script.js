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
        <div class="relative rounded-3xl overflow-hidden w-80 border border-gray-100 shadow-md transition-all hover:-translate-y-1 hover:shadow-xl bg-white group">
            <div class="relative w-full h-[350px] overflow-hidden">
                <img src="${product.thumbnail}" alt="${product.title}" class="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" loading="lazy" decoding="async" />
                <button class="absolute top-4 right-4 bg-accent border-none w-9 h-9 rounded-full cursor-pointer flex items-center justify-center text-white z-10 transition-transform hover:scale-110 shadow-lg">
                    <i class="fa-regular fa-heart"></i>
                </button>
            </div>
            
            <div class=" bottom-0 left-0 right-0 bg-white rounded-2xl pb-2 mx-auto mt-auto shadow-lg h-[40%] ">
                <h3 class="text-base font-semibold text-gray-800 mb-2 truncate">${product.title}</h3>
                <div class="flex justify-between items-center mb-3">
                    <div class="flex flex-col items-end">
                        <span class="text-lg font-extrabold text-gray-900">$${product.price}</span>
                    </div>
                    <div class="bg-green-500 text-white py-1 px-2 rounded-xl text-xs font-semibold flex items-center gap-1">
                        <i class="fa-solid fa-star text-white text-[0.6rem]"></i> ${product.rating}
                    </div>
                </div>
                <button onclick="addToCart(${product.id})" class="w-full bg-primary text-white border-none py-3 px-6 rounded-full text-sm font-medium cursor-pointer transition-all hover:bg-[#0a1e3f] hover:-translate-y-0.5 hover:shadow-lg mt-2.5">
                    <i class="fa-solid fa-cart-plus"></i> Add to Cart
                </button>
            </div>
        </div>
    `).join('');
}

function renderSpecialOffers(products, container) {
    if (!container) return;
    container.innerHTML = products.map(product => `
        <div class="bg-gray-100 rounded-3xl p-8 flex justify-between items-center min-h-[220px] flex-1 flex-[1_1_calc(33.333%-20px)] transition-all hover:-translate-y-1 hover:shadow-xl border border-transparent hover:border-gray-200">
          <div class="flex flex-col items-start gap-3 flex-[0_0_50%] w-1/2">
            <span class="bg-white text-gray-800 py-1.5 px-3.5 text-xs font-semibold rounded shadow-sm mb-1">Big Saving</span>
            <h3 class="text-lg font-semibold text-gray-900 leading-snug w-full">${product.title}</h3>
            <p class="text-sm font-medium text-gray-800">$${product.price}</p>
            <button onclick="addToCart(${product.id})" class="bg-primary text-white border-none py-2.5 px-6 rounded-full text-xs font-medium mt-1 cursor-pointer transition-all hover:bg-[#0a1e3f]">Add to Cart</button>
          </div>
          <div class="flex-1 flex justify-end items-end h-full">
            <img src="${product.thumbnail}" alt="${product.title}" class="max-w-[160px] h-auto object-contain drop-shadow-lg" loading="lazy" decoding="async" />
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
            container.innerHTML = '<p class="text-center text-gray-500 py-10 text-lg">Your cart is empty.</p>';
            if (totalEl) totalEl.innerText = '$0.00';
            return;
        }

        let totalPrice = 0;
        container.innerHTML = cart.map(item => {
            totalPrice += item.price * item.quantity;
            return `
                <div class="flex items-center justify-between p-5 mb-5 bg-white rounded-2xl shadow-md border border-gray-100 transition-transform hover:-translate-y-1">
                    <img src="${item.image}" alt="${item.title}" class="w-20 h-20 rounded-lg object-cover mr-5">
                    <div class="flex-1">
                        <h4 class="text-lg text-primary mb-1">${item.title}</h4>
                        <p class="text-gray-500 font-medium">$${item.price}</p>
                        <div class="flex items-center gap-4 mt-2.5">
                            <button onclick="updateQuantity(${item.id}, -1)" class="bg-gray-100 border-none w-7 h-7 rounded-full cursor-pointer flex items-center justify-center font-bold">-</button>
                            <span class="font-semibold">${item.quantity}</span>
                            <button onclick="updateQuantity(${item.id}, 1)" class="bg-gray-100 border-none w-7 h-7 rounded-full cursor-pointer flex items-center justify-center font-bold">+</button>
                        </div>
                    </div>
                    <button onclick="removeFromCart(${item.id})" class="bg-transparent border-none cursor-pointer">
                        <i class="fa-solid fa-trash text-red-600 text-xl transition-colors hover:text-red-800"></i>
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