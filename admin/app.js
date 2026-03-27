const ADMIN_TOKEN_KEY = "novacart_admin_token";

const state = {
  token: localStorage.getItem(ADMIN_TOKEN_KEY) || "",
  products: [],
};

function formatPrice(value) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value || 0);
}

function setMessage(id, message, isError = false) {
  const element = document.getElementById(id);
  element.textContent = message;
  element.classList.toggle("status-error", isError);
}

function adminFetch(url, options = {}) {
  return fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
      Authorization: `Bearer ${state.token}`,
    },
  });
}

function setAuthenticated(isAuthenticated) {
  document.getElementById("loginPanel").classList.toggle("hidden", isAuthenticated);
  document.getElementById("dashboardPanel").classList.toggle("hidden", !isAuthenticated);
  document.getElementById("logoutButton").classList.toggle("hidden", !isAuthenticated);
}

function resetProductForm() {
  document.getElementById("productForm").reset();
  document.getElementById("productId").value = "";
}

function fillProductForm(product) {
  document.getElementById("productId").value = product.id;
  document.getElementById("productName").value = product.name;
  document.getElementById("productCategory").value = product.category;
  document.getElementById("productPrice").value = product.price;
  document.getElementById("productImage").value = product.image;
  document.getElementById("productDescription").value = product.description;
  document.getElementById("productBadge").value = product.badge || "";
  document.getElementById("productRating").value = product.rating;
  document.getElementById("productInventory").value = product.inventory;
  document.getElementById("productFeatured").checked = Boolean(product.featured);
}

function getProductPayload() {
  return {
    name: document.getElementById("productName").value.trim(),
    category: document.getElementById("productCategory").value.trim(),
    price: Number(document.getElementById("productPrice").value),
    image: document.getElementById("productImage").value.trim(),
    description: document.getElementById("productDescription").value.trim(),
    badge: document.getElementById("productBadge").value.trim(),
    rating: Number(document.getElementById("productRating").value || 4),
    inventory: Number(document.getElementById("productInventory").value || 0),
    featured: document.getElementById("productFeatured").checked,
  };
}

function renderProductsTable() {
  const searchValue = document.getElementById("adminSearch").value.trim().toLowerCase();
  const tbody = document.getElementById("productsTableBody");
  tbody.innerHTML = "";

  const filteredProducts = state.products.filter((product) =>
    [product.name, product.category, product.description].join(" ").toLowerCase().includes(searchValue)
  );

  if (!filteredProducts.length) {
    tbody.innerHTML = `<tr><td colspan="5">No products found.</td></tr>`;
    return;
  }

  filteredProducts.forEach((product) => {
    const row = document.createElement("tr");
    row.innerHTML = `
      <td>
        <strong>${product.name}</strong><br />
        <span class="results-info">${product.badge || "Standard listing"}</span>
      </td>
      <td>${product.category}</td>
      <td>${formatPrice(product.price)}</td>
      <td>${product.inventory}</td>
      <td>
        <div class="table-actions">
          <button class="table-action" data-action="edit">Edit</button>
          <button class="table-action danger" data-action="delete">Delete</button>
        </div>
      </td>
    `;

    row.querySelector('[data-action="edit"]').addEventListener("click", () => fillProductForm(product));
    row.querySelector('[data-action="delete"]').addEventListener("click", () => deleteProduct(product.id));
    tbody.appendChild(row);
  });
}

function renderOverview(data) {
  document.getElementById("metricProducts").textContent = data.metrics.products;
  document.getElementById("metricOrders").textContent = data.metrics.orders;
  document.getElementById("metricUsers").textContent = data.metrics.users;
  document.getElementById("metricRevenue").textContent = formatPrice(data.metrics.revenue);

  const ordersBody = document.getElementById("ordersTableBody");
  ordersBody.innerHTML = "";

  if (!data.latestOrders.length) {
    ordersBody.innerHTML = `<tr><td colspan="3">No orders yet.</td></tr>`;
  } else {
    data.latestOrders.forEach((order) => {
      const row = document.createElement("tr");
      row.innerHTML = `
        <td>
          <strong>${order.customerName}</strong><br />
          <span class="results-info">${new Date(order.createdAt).toLocaleString()}</span>
        </td>
        <td>${formatPrice(order.total)}</td>
        <td>${order.status}</td>
      `;
      ordersBody.appendChild(row);
    });
  }

  const lowStockList = document.getElementById("lowStockList");
  lowStockList.innerHTML = "";

  if (!data.lowStockProducts.length) {
    lowStockList.innerHTML = "<li><strong>All good</strong><span>No low-stock products right now.</span></li>";
    return;
  }

  data.lowStockProducts.forEach((product) => {
    const item = document.createElement("li");
    item.innerHTML = `
      <strong>${product.name}</strong>
      <span>${product.category} • ${product.inventory} left</span>
    `;
    lowStockList.appendChild(item);
  });
}

async function loadBootstrapHint() {
  try {
    const response = await fetch("/api/users/bootstrap");
    if (!response.ok) return;
    const data = await response.json();
    document.getElementById("credentialHint").textContent = `${data.defaultAdminEmail} / Admin@123`;
  } catch (error) {
    // Non-blocking hint.
  }
}

async function loadProducts() {
  const response = await fetch("/api/products?limit=120");
  if (!response.ok) throw new Error("Could not load products");

  const data = await response.json();
  state.products = data.products || [];
  renderProductsTable();
}

async function loadOverview() {
  const response = await adminFetch("/api/admin/overview");
  if (response.status === 401) {
    logout();
    throw new Error("Your admin session expired. Please sign in again.");
  }
  if (!response.ok) throw new Error("Could not load dashboard");

  const data = await response.json();
  renderOverview(data);
}

async function refreshDashboard() {
  try {
    setMessage("dashboardMessage", "Refreshing dashboard...");
    await Promise.all([loadProducts(), loadOverview()]);
    setMessage("dashboardMessage", "Dashboard synced.");
  } catch (error) {
    setMessage("dashboardMessage", error.message || "Could not refresh dashboard", true);
  }
}

async function handleLogin(event) {
  event.preventDefault();

  try {
    setMessage("loginMessage", "Signing in...");
    const response = await fetch("/api/users/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: document.getElementById("loginEmail").value.trim(),
        password: document.getElementById("loginPassword").value,
      }),
    });

    const data = await response.json();
    if (!response.ok || !data.token) {
      throw new Error(data.message || "Admin login failed");
    }

    state.token = data.token;
    localStorage.setItem(ADMIN_TOKEN_KEY, state.token);
    setAuthenticated(true);
    setMessage("loginMessage", "");
    await refreshDashboard();
  } catch (error) {
    setMessage("loginMessage", error.message || "Could not sign in", true);
  }
}

async function handleProductSubmit(event) {
  event.preventDefault();

  const productId = document.getElementById("productId").value;
  const method = productId ? "PUT" : "POST";
  const url = productId ? `/api/products/${productId}` : "/api/products";

  try {
    setMessage("productMessage", productId ? "Updating product..." : "Creating product...");
    const response = await adminFetch(url, {
      method,
      body: JSON.stringify(getProductPayload()),
    });

    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(data.message || "Could not save product");
    }

    resetProductForm();
    setMessage("productMessage", productId ? "Product updated." : "Product created.");
    await refreshDashboard();
  } catch (error) {
    setMessage("productMessage", error.message || "Could not save product", true);
  }
}

async function deleteProduct(productId) {
  const confirmed = window.confirm("Delete this product?");
  if (!confirmed) return;

  try {
    const response = await adminFetch(`/api/products/${productId}`, {
      method: "DELETE",
    });

    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(data.message || "Could not delete product");
    }

    setMessage("productMessage", "Product deleted.");
    await refreshDashboard();
  } catch (error) {
    setMessage("productMessage", error.message || "Could not delete product", true);
  }
}

function logout() {
  state.token = "";
  localStorage.removeItem(ADMIN_TOKEN_KEY);
  setAuthenticated(false);
}

function wireEvents() {
  document.getElementById("loginForm").addEventListener("submit", handleLogin);
  document.getElementById("productForm").addEventListener("submit", handleProductSubmit);
  document.getElementById("adminSearch").addEventListener("input", renderProductsTable);
  document.getElementById("resetFormButton").addEventListener("click", resetProductForm);
  document.getElementById("refreshOrdersButton").addEventListener("click", refreshDashboard);
  document.getElementById("logoutButton").addEventListener("click", logout);
}

async function init() {
  wireEvents();
  await loadBootstrapHint();

  if (state.token) {
    setAuthenticated(true);
    await refreshDashboard();
  } else {
    setAuthenticated(false);
  }
}

init();
