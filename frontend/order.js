const CART_KEY = "novacart_cart_v1";
const WISHLIST_KEY = "novacart_wishlist_v1";

const state = {
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

function formatPrice(value) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value);
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
  renderProducts(filteredProducts());
  syncModalWishlistButton();
}

function featuredProducts() {
  return [...state.products]
    .filter((product) => product.badge || product.rating >= 4.5)
    .sort((left, right) => right.rating - left.rating)
    .slice(0, 8);
}

function wishlistProducts() {
  const wishlistIds = new Set(getWishlist());
  return state.products.filter((product) => wishlistIds.has(product.id));
}

function filteredProducts() {
  let list = [...state.products];
  const search = state.searchTerm.toLowerCase();

  if (state.activeCategory !== "All") {
    list = list.filter((item) => item.category === state.activeCategory);
  }

  if (search) {
    list = list.filter((item) =>
      [item.name, item.description, item.category].join(" ").toLowerCase().includes(search)
    );
  }

  list = list.filter((item) => item.price >= state.minPrice && item.price <= state.maxPrice);

  if (state.featuredOnly) {
    list = list.filter((item) => item.badge || item.rating >= 4.5);
  }

  if (state.inStockOnly) {
    list = list.filter((item) => item.inventory > 0);
  }

  if (state.sort === "price-asc") list.sort((a, b) => a.price - b.price);
  if (state.sort === "price-desc") list.sort((a, b) => b.price - a.price);
  if (state.sort === "rating") list.sort((a, b) => b.rating - a.rating);
  if (state.sort === "name") list.sort((a, b) => a.name.localeCompare(b.name));

  return list;
}

function renderCategoryChips() {
  const chipWrap = document.getElementById("categoryChips");
  chipWrap.innerHTML = "";

  ["All", ...state.categories].forEach((name) => {
    const button = document.createElement("button");
    button.className = `chip ${name === state.activeCategory ? "active" : ""}`;
    button.textContent = name;
    button.addEventListener("click", () => {
      state.activeCategory = name;
      renderCategoryChips();
      renderProducts(filteredProducts());
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

  wishlistButton.textContent = isWishlisted(product.id) ? "♥" : "♡";
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
  return state.products.find((product) => product.id === state.selectedProductId) || null;
}

function syncModalWishlistButton() {
  const button = document.getElementById("modalWishlistButton");
  const product = selectedProduct();
  if (!product) return;
  button.textContent = isWishlisted(product.id) ? "Saved in wishlist" : "Save to wishlist";
}

function openProductModal(productId) {
  const product = state.products.find((entry) => entry.id === productId);
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

function applyFilters() {
  renderProducts(filteredProducts());
}

async function loadProducts() {
  setStatusMessage("Loading products...");
  const response = await fetch("/api/products?limit=120");

  if (!response.ok) {
    throw new Error("Could not load products");
  }

  const data = await response.json();
  state.products = data.products || [];
  state.categories = data.categories || [];

  document.getElementById("heroProductCount").textContent = String(data.total || state.products.length);
  document.getElementById("heroCategoryCount").textContent = String(state.categories.length);
  document.getElementById("heroDealCount").textContent = String(
    state.products.filter((product) => product.badge).length
  );

  renderCategoryChips();
  renderFeaturedRail();
  renderWishlistRail();
  applyFilters();
  updateWishlistSummary();
  setStatusMessage("Catalog synced.");
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
  applyFilters();
}

function wireEvents() {
  document.getElementById("searchInput").addEventListener("input", (event) => {
    state.searchTerm = event.target.value || "";
    applyFilters();
  });

  document.getElementById("sortSelect").addEventListener("change", (event) => {
    state.sort = event.target.value;
    applyFilters();
  });

  document.getElementById("minPriceInput").addEventListener("input", (event) => {
    state.minPrice = Number(event.target.value || 0);
    applyFilters();
  });

  document.getElementById("maxPriceInput").addEventListener("input", (event) => {
    state.maxPrice = event.target.value ? Number(event.target.value) : Infinity;
    applyFilters();
  });

  document.getElementById("featuredOnlyInput").addEventListener("change", (event) => {
    state.featuredOnly = event.target.checked;
    applyFilters();
  });

  document.getElementById("stockOnlyInput").addEventListener("change", (event) => {
    state.inStockOnly = event.target.checked;
    applyFilters();
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
    await loadProducts();
  } catch (error) {
    document.getElementById("resultsInfo").textContent = "Unable to load products.";
    setStatusMessage("Start MongoDB and the backend server, then refresh.", true);
  }
}

init();
