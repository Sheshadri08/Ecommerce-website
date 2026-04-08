const CART_KEY = "novacart_cart_v1";
const WISHLIST_KEY = "novacart_wishlist_v1";
const DEMO_PRODUCTS_KEY = "novacart_demo_products_v1";
const CONFIG = window.NOVACART_CONFIG || {};
const API_BASE_URL = (CONFIG.API_BASE_URL || "").replace(/\/$/, "");
const ADMIN_URL = CONFIG.ADMIN_URL || (API_BASE_URL ? `${API_BASE_URL}/admin/` : "/admin/");
const FALLBACK_CATALOG = Array.isArray(window.NOVACART_FALLBACK_CATALOG) ? window.NOVACART_FALLBACK_CATALOG : [];

const state = {
  allProducts: [],
  products: [],
  categories: [],
  activeCategory: "All",
  searchTerm: "",
  sort: "featured",
  minPrice: 0,
  maxPrice: Infinity,
  featuredOnly: false,
  inStockOnly: false,
  selectedProductId: "",
};

let searchTimer = null;

function formatPrice(value) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value);
}

function apiUrl(path) {
  return API_BASE_URL ? `${API_BASE_URL}${path}` : path;
}

function getCart() {
  return JSON.parse(localStorage.getItem(CART_KEY) || "[]");
}

function saveCart(cart) {
  localStorage.setItem(CART_KEY, JSON.stringify(cart));
}

function getWishlist() {
  return JSON.parse(localStorage.getItem(WISHLIST_KEY) || "[]");
}

function saveWishlist(ids) {
  localStorage.setItem(WISHLIST_KEY, JSON.stringify(ids));
}

function isWishlisted(productId) {
  return getWishlist().includes(productId);
}

function getDemoProducts() {
  const storedProducts = JSON.parse(localStorage.getItem(DEMO_PRODUCTS_KEY) || "null");
  if (Array.isArray(storedProducts) && storedProducts.length) {
    return storedProducts;
  }

  const seededProducts = FALLBACK_CATALOG.map((product) => ({
    ...product,
    inventory: Number(product.inventory ?? 12),
    featured: Boolean(product.featured ?? product.badge),
  }));
  localStorage.setItem(DEMO_PRODUCTS_KEY, JSON.stringify(seededProducts));
  return seededProducts;
}

function getDemoCategories(products) {
  return [...new Set(products.map((product) => product.category))].sort((left, right) => left.localeCompare(right));
}

function applyClientFilters(products) {
  let filteredProducts = [...products];

  if (state.searchTerm.trim()) {
    const searchTerm = state.searchTerm.trim().toLowerCase();
    filteredProducts = filteredProducts.filter((product) =>
      [product.name, product.description, product.category].join(" ").toLowerCase().includes(searchTerm)
    );
  }

  if (state.activeCategory !== "All") {
    filteredProducts = filteredProducts.filter((product) => product.category === state.activeCategory);
  }

  filteredProducts = filteredProducts.filter((product) => product.price >= state.minPrice);

  if (Number.isFinite(state.maxPrice)) {
    filteredProducts = filteredProducts.filter((product) => product.price <= state.maxPrice);
  }

  filteredProducts.sort((left, right) => {
    if (state.sort === "price-asc") return left.price - right.price;
    if (state.sort === "price-desc") return right.price - left.price;
    if (state.sort === "rating") return right.rating - left.rating;
    if (state.sort === "name") return left.name.localeCompare(right.name);
    return String(right.id).localeCompare(String(left.id));
  });

  if (state.featuredOnly) {
    filteredProducts = filteredProducts.filter((product) => product.badge || product.rating >= 4.5);
  }

  if (state.inStockOnly) {
    filteredProducts = filteredProducts.filter((product) => product.inventory > 0);
  }

  return filteredProducts;
}

function updateCartCount() {
  const count = getCart().reduce((sum, item) => sum + item.quantity, 0);
  document.getElementById("cartCount").textContent = count;
}

function updateWishlistSummary() {
  const count = getWishlist().length;
  document.getElementById("wishlistSummary").textContent = `Wishlist ${count}`;
}

function setStatusMessage(message, isError = false) {
  const status = document.getElementById("statusMessage");
  status.textContent = message;
  status.classList.toggle("status-error", isError);
}

function addToCart(product) {
  if (product.inventory <= 0) {
    setStatusMessage("This product is currently out of stock.", true);
    return;
  }

  const cart = getCart();
  const existing = cart.find((item) => item.id === product.id);

  if (existing) {
    existing.quantity += 1;
  } else {
    cart.push({
      id: product.id,
      name: product.name,
      image: product.image,
      price: product.price,
      quantity: 1,
    });
  }

  saveCart(cart);
  updateCartCount();
  setStatusMessage(`${product.name} added to cart.`);
}

function toggleWishlist(productId) {
  const wishlist = getWishlist();
  const exists = wishlist.includes(productId);
  const nextWishlist = exists ? wishlist.filter((id) => id !== productId) : [...wishlist, productId];

  saveWishlist(nextWishlist);
  updateWishlistSummary();
  renderWishlistRail();
  renderProducts(state.products);
  syncModalWishlistButton();
}

function featuredProducts() {
  return [...state.allProducts]
    .filter((product) => product.badge || product.rating >= 4.5)
    .sort((left, right) => right.rating - left.rating)
    .slice(0, 8);
}

function wishlistProducts() {
  const wishlistIds = new Set(getWishlist());
  return state.allProducts.filter((product) => wishlistIds.has(product.id));
}

function renderCategoryChips() {
  const chipWrap = document.getElementById("categoryChips");
  chipWrap.innerHTML = "";

  ["All", ...state.categories].forEach((name) => {
    const button = document.createElement("button");
    button.className = `chip ${name === state.activeCategory ? "active" : ""}`;
    button.textContent = name;
    button.addEventListener("click", async () => {
      state.activeCategory = name;
      renderCategoryChips();
      await loadProducts();
    });
    chipWrap.appendChild(button);
  });
}

function createProductCard(product) {
  const template = document.getElementById("productTemplate");
  const clone = template.content.cloneNode(true);
  const badge = clone.querySelector(".badge");
  const inventoryPill = clone.querySelector(".inventory-pill");
  const button = clone.querySelector(".add-btn");
  const wishlistButton = clone.querySelector(".wishlist-btn");
  const quickViewButton = clone.querySelector(".quick-view-btn");

  clone.querySelector("img").src = product.image;
  clone.querySelector("img").alt = product.name;
  clone.querySelector(".category").textContent = product.category;
  clone.querySelector("h3").textContent = product.name;
  clone.querySelector(".description").textContent = product.description;
  clone.querySelector(".rating").textContent = `Rating ${Number(product.rating).toFixed(1)}`;
  clone.querySelector(".price").textContent = formatPrice(product.price);

  if (product.badge) {
    badge.textContent = product.badge;
  } else {
    badge.style.display = "none";
  }

  inventoryPill.textContent = product.inventory > 0 ? `${product.inventory} in stock` : "Out of stock";
  inventoryPill.classList.toggle("inventory-low", product.inventory > 0 && product.inventory <= 5);
  inventoryPill.classList.toggle("inventory-empty", product.inventory <= 0);

  if (product.inventory <= 0) {
    button.disabled = true;
    button.textContent = "Sold Out";
  }

  wishlistButton.textContent = isWishlisted(product.id) ? "\u2665" : "\u2661";
  wishlistButton.classList.toggle("active", isWishlisted(product.id));

  button.addEventListener("click", () => addToCart(product));
  wishlistButton.addEventListener("click", () => toggleWishlist(product.id));
  quickViewButton.addEventListener("click", () => openProductModal(product.id));

  return clone;
}

function renderProducts(products) {
  const grid = document.getElementById("productGrid");
  const info = document.getElementById("resultsInfo");
  grid.innerHTML = "";

  info.textContent = `Showing ${products.length} product${products.length !== 1 ? "s" : ""}`;

  if (!products.length) {
    grid.innerHTML = `
      <div class="empty-state">
        <h3>No products match this filter</h3>
        <p>Try a different search term or widen your price range.</p>
      </div>
    `;
    return;
  }

  products.forEach((product) => {
    grid.appendChild(createProductCard(product));
  });
}

function renderFeaturedRail() {
  const rail = document.getElementById("featuredRail");
  rail.innerHTML = "";

  featuredProducts().forEach((product) => {
    const card = document.createElement("div");
    card.className = "mini-card";
    card.innerHTML = `
      <img src="${product.image}" alt="${product.name}" />
      <div>
        <p class="section-kicker">${product.badge || "Top pick"}</p>
        <h4>${product.name}</h4>
        <p>${formatPrice(product.price)}</p>
      </div>
    `;
    card.addEventListener("click", () => openProductModal(product.id));
    rail.appendChild(card);
  });
}

function renderWishlistRail() {
  const wishlistSection = document.getElementById("wishlistSection");
  const rail = document.getElementById("wishlistRail");
  const products = wishlistProducts();
  rail.innerHTML = "";

  if (!products.length) {
    wishlistSection.classList.add("hidden");
    return;
  }

  wishlistSection.classList.remove("hidden");
  products.forEach((product) => {
    const card = document.createElement("div");
    card.className = "mini-card";
    card.innerHTML = `
      <img src="${product.image}" alt="${product.name}" />
      <div>
        <p class="section-kicker">${product.category}</p>
        <h4>${product.name}</h4>
        <p>${formatPrice(product.price)}</p>
      </div>
    `;
    card.addEventListener("click", () => openProductModal(product.id));
    rail.appendChild(card);
  });
}

function selectedProduct() {
  return state.allProducts.find((product) => product.id === state.selectedProductId) || null;
}

function syncModalWishlistButton() {
  const button = document.getElementById("modalWishlistButton");
  const product = selectedProduct();
  if (!product) return;
  button.textContent = isWishlisted(product.id) ? "Saved in wishlist" : "Save to wishlist";
}

function openProductModal(productId) {
  const product = state.allProducts.find((entry) => entry.id === productId);
  if (!product) return;

  state.selectedProductId = productId;
  document.getElementById("modalImage").src = product.image;
  document.getElementById("modalImage").alt = product.name;
  document.getElementById("modalCategory").textContent = product.category;
  document.getElementById("modalName").textContent = product.name;
  document.getElementById("modalDescription").textContent = product.description;
  document.getElementById("modalPrice").textContent = formatPrice(product.price);
  document.getElementById("modalRating").textContent = `Rating ${Number(product.rating).toFixed(1)}`;
  document.getElementById("modalInventory").textContent =
    product.inventory > 0 ? `${product.inventory} units available` : "Currently out of stock";
  document.getElementById("modalCartButton").disabled = product.inventory <= 0;
  document.getElementById("productModal").showModal();
  syncModalWishlistButton();
}

function closeProductModal() {
  document.getElementById("productModal").close();
}

function buildSearchParams() {
  const params = new URLSearchParams();

  params.set("limit", "120");
  params.set("sort", state.sort);

  if (state.searchTerm.trim()) {
    params.set("q", state.searchTerm.trim());
  }

  if (state.activeCategory !== "All") {
    params.set("category", state.activeCategory);
  }

  if (state.minPrice > 0) {
    params.set("minPrice", String(state.minPrice));
  }

  if (Number.isFinite(state.maxPrice)) {
    params.set("maxPrice", String(state.maxPrice));
  }

  return params;
}

async function loadInitialProducts() {
  try {
    const response = await fetch(apiUrl("/api/products?limit=120"));
    if (!response.ok) {
      throw new Error("Could not load products");
    }

    const data = await response.json();
    state.allProducts = data.products || [];
    state.categories = data.categories || [];
  } catch (error) {
    state.allProducts = getDemoProducts();
    state.categories = getDemoCategories(state.allProducts);
  }
}

async function loadProducts() {
  setStatusMessage("Loading products...");

  try {
    const response = await fetch(apiUrl(`/api/products?${buildSearchParams().toString()}`));
    if (!response.ok) {
      throw new Error("Could not load products");
    }

    const data = await response.json();
    state.products = data.products || [];
    state.categories = data.categories || state.categories;

    if (state.featuredOnly) {
      state.products = state.products.filter((product) => product.badge || product.rating >= 4.5);
    }

    if (state.inStockOnly) {
      state.products = state.products.filter((product) => product.inventory > 0);
    }

    document.getElementById("heroProductCount").textContent = String(state.allProducts.length || data.total || 0);
    document.getElementById("heroCategoryCount").textContent = String(state.categories.length);
    document.getElementById("heroDealCount").textContent = String(
      state.allProducts.filter((product) => product.badge).length
    );
    setStatusMessage("Catalog synced.");
  } catch (error) {
    state.allProducts = getDemoProducts();
    state.categories = getDemoCategories(state.allProducts);
    state.products = applyClientFilters(state.allProducts);
    document.getElementById("heroProductCount").textContent = String(state.allProducts.length);
    document.getElementById("heroCategoryCount").textContent = String(state.categories.length);
    document.getElementById("heroDealCount").textContent = String(
      state.allProducts.filter((product) => product.badge).length
    );
    setStatusMessage("Catalog loaded in GitHub demo mode.");
  }

  renderCategoryChips();
  renderFeaturedRail();
  renderWishlistRail();
  renderProducts(state.products);
  updateWishlistSummary();
}

function resetFilters() {
  state.activeCategory = "All";
  state.searchTerm = "";
  state.sort = "featured";
  state.minPrice = 0;
  state.maxPrice = Infinity;
  state.featuredOnly = false;
  state.inStockOnly = false;

  document.getElementById("searchInput").value = "";
  document.getElementById("sortSelect").value = "featured";
  document.getElementById("minPriceInput").value = "";
  document.getElementById("maxPriceInput").value = "";
  document.getElementById("featuredOnlyInput").checked = false;
  document.getElementById("stockOnlyInput").checked = false;

  renderCategoryChips();
  loadProducts().catch(() => {
    document.getElementById("resultsInfo").textContent = "Unable to load products.";
    setStatusMessage("Could not refresh the catalog.", true);
  });
}

function queueProductReload() {
  window.clearTimeout(searchTimer);
  searchTimer = window.setTimeout(() => {
    loadProducts().catch(() => {
      document.getElementById("resultsInfo").textContent = "Unable to load products.";
      setStatusMessage("Could not refresh the catalog.", true);
    });
  }, 180);
}

function wireEvents() {
  document.querySelectorAll("[data-admin-link]").forEach((link) => {
    link.href = ADMIN_URL;
  });

  document.getElementById("searchInput").addEventListener("input", (event) => {
    state.searchTerm = event.target.value || "";
    queueProductReload();
  });

  document.getElementById("sortSelect").addEventListener("change", (event) => {
    state.sort = event.target.value;
    queueProductReload();
  });

  document.getElementById("minPriceInput").addEventListener("input", (event) => {
    state.minPrice = Number(event.target.value || 0);
    queueProductReload();
  });

  document.getElementById("maxPriceInput").addEventListener("input", (event) => {
    state.maxPrice = event.target.value ? Number(event.target.value) : Infinity;
    queueProductReload();
  });

  document.getElementById("featuredOnlyInput").addEventListener("change", (event) => {
    state.featuredOnly = event.target.checked;
    queueProductReload();
  });

  document.getElementById("stockOnlyInput").addEventListener("change", (event) => {
    state.inStockOnly = event.target.checked;
    queueProductReload();
  });

  document.getElementById("resetFiltersButton").addEventListener("click", resetFilters);
  document.getElementById("closeModalButton").addEventListener("click", closeProductModal);
  document.getElementById("modalCartButton").addEventListener("click", () => {
    const product = selectedProduct();
    if (!product) return;
    addToCart(product);
  });
  document.getElementById("modalWishlistButton").addEventListener("click", () => {
    const product = selectedProduct();
    if (!product) return;
    toggleWishlist(product.id);
  });

  document.getElementById("jumpDealsButton").addEventListener("click", () => {
    document.getElementById("featuredSection").scrollIntoView({ behavior: "smooth" });
  });

  document.getElementById("jumpCatalogButton").addEventListener("click", () => {
    document.getElementById("catalogSection").scrollIntoView({ behavior: "smooth" });
  });
}

async function init() {
  updateCartCount();
  updateWishlistSummary();
  wireEvents();

  try {
    await loadInitialProducts();
    await loadProducts();
  } catch (error) {
    document.getElementById("resultsInfo").textContent = "Unable to load products.";
    setStatusMessage("Catalog unavailable.", true);
  }
}

init();
