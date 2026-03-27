const state = {
  products: [],
  categories: [],
  activeCategory: "All",
  searchTerm: "",
  sort: "featured",
};

const CART_KEY = "novacart_cart_v1";

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

function updateCartCount() {
  const count = getCart().reduce((sum, item) => sum + item.quantity, 0);
  document.getElementById("cartCount").textContent = count;
}

function addToCart(product) {
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
}

function renderProducts(products) {
  const grid = document.getElementById("productGrid");
  const template = document.getElementById("productTemplate");
  const info = document.getElementById("resultsInfo");
  grid.innerHTML = "";

  info.textContent = `Showing ${products.length} product${products.length !== 1 ? "s" : ""}`;

  products.forEach((product) => {
    const clone = template.content.cloneNode(true);
    const badge = clone.querySelector(".badge");
    clone.querySelector("img").src = product.image;
    clone.querySelector("img").alt = product.name;
    clone.querySelector(".category").textContent = product.category;
    clone.querySelector("h3").textContent = product.name;
    clone.querySelector(".description").textContent = product.description;
    clone.querySelector(".rating").textContent = `Rating ${product.rating}`;
    clone.querySelector(".price").textContent = formatPrice(product.price);

    if (product.badge) {
      badge.textContent = product.badge;
    } else {
      badge.style.display = "none";
    }

    clone.querySelector(".add-btn").addEventListener("click", () => {
      addToCart(product);
    });

    grid.appendChild(clone);
  });
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

async function loadProducts() {
  const response = await fetch("/api/products?limit=120");
  const data = await response.json();
  state.products = data.products || [];
  state.categories = data.categories || [];
  renderCategoryChips();
  renderProducts(filteredProducts());
}

function wireEvents() {
  document.getElementById("searchInput").addEventListener("input", (event) => {
    state.searchTerm = event.target.value || "";
    renderProducts(filteredProducts());
  });

  document.getElementById("sortSelect").addEventListener("change", (event) => {
    state.sort = event.target.value;
    renderProducts(filteredProducts());
  });
}

async function init() {
  updateCartCount();
  wireEvents();

  try {
    await loadProducts();
  } catch (error) {
    document.getElementById("resultsInfo").textContent =
      "Unable to load products. Start backend server and refresh.";
  }
}

init();
