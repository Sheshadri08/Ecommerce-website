const ADMIN_TOKEN_KEY = "novacart_admin_token";

const state = {
  token: localStorage.getItem(ADMIN_TOKEN_KEY) || "",
  products: [],
  orders: [],
  selectedOrderId: "",
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

function renderSelectedOrder() {
  const card = document.getElementById("selectedOrderCard");
  const order = state.orders.find((entry) => entry.id === state.selectedOrderId);

  if (!order) {
    card.className = "selected-order empty-order";
    card.textContent = "Select an order to review its items and customer details.";
    return;
  }

  card.className = "selected-order";
  card.innerHTML = `
    <strong>${order.customerName}</strong>
    <p class="results-info">${order.customerEmail}</p>
    <p class="results-info">${order.customerPhone}</p>
    <p><strong>Address:</strong> ${order.customerAddress}</p>
    <p><strong>Payment:</strong> ${order.paymentMethodLabel}</p>
    <p class="results-info">Placed ${new Date(order.createdAt).toLocaleString()}</p>
    <p><strong>Total:</strong> ${formatPrice(order.total)}</p>
    <p><strong>Status:</strong> ${order.status}</p>
    <ul class="order-item-list">
      ${order.items
        .map((item) => `<li>${item.name} x ${item.quantity} = ${formatPrice(item.lineTotal)}</li>`)
        .join("")}
    </ul>
  `;
}

function renderOrdersTable() {
  const ordersBody = document.getElementById("ordersTableBody");
  ordersBody.innerHTML = "";

  if (!state.orders.length) {
    ordersBody.innerHTML = `<tr><td colspan="4">No orders yet.</td></tr>`;
    renderSelectedOrder();
    return;
  }

  state.orders.forEach((order) => {
    const row = document.createElement("tr");
    row.innerHTML = `
      <td>
        <strong>${order.customerName}</strong><br />
        <span class="results-info">${new Date(order.createdAt).toLocaleString()}</span>
      </td>
      <td>${order.items.length}</td>
      <td>${formatPrice(order.total)}</td>
      <td></td>
    `;

    row.addEventListener("click", () => {
      state.selectedOrderId = order.id;
      renderSelectedOrder();
    });

    const statusCell = row.lastElementChild;
    const select = document.createElement("select");
    select.className = "status-select";

    ["confirmed", "processing", "shipped", "delivered", "cancelled"].forEach((status) => {
      const option = document.createElement("option");
      option.value = status;
      option.textContent = status;
      option.selected = order.status === status;
      select.appendChild(option);
    });

    select.addEventListener("click", (event) => event.stopPropagation());
    select.addEventListener("change", async (event) => {
      await updateOrderStatus(order.id, event.target.value);
    });

    statusCell.appendChild(select);
    ordersBody.appendChild(row);
  });

  if (!state.selectedOrderId && state.orders[0]) {
    state.selectedOrderId = state.orders[0].id;
  }

  renderSelectedOrder();
}

function renderOverview(data) {
  document.getElementById("metricProducts").textContent = data.metrics.products;
  document.getElementById("metricOrders").textContent = data.metrics.orders;
  document.getElementById("metricUsers").textContent = data.metrics.users;
  document.getElementById("metricRevenue").textContent = formatPrice(data.metrics.revenue);

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
      <span>${product.category} - ${product.inventory} left</span>
    `;
    lowStockList.appendChild(item);
  });
}

async function loadBootstrapHint() {
  try {
    const response = await fetch("/api/users/bootstrap");
    if (!response.ok) return;
    const data = await response.json();
    document.getElementById("credentialHint").textContent =
      `${data.defaultAdminEmail} / ${data.defaultAdminPassword}`;
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

async function loadOrders() {
  const response = await adminFetch("/api/orders");
  if (response.status === 401) {
    logout();
    throw new Error("Your admin session expired. Please sign in again.");
  }
  if (!response.ok) throw new Error("Could not load orders");

  const data = await response.json();
  state.orders = data.orders || [];
  renderOrdersTable();
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
    await Promise.all([loadProducts(), loadOrders(), loadOverview()]);
    setMessage("dashboardMessage", "Dashboard synced.");
  } catch (error) {
    setMessage("dashboardMessage", error.message || "Could not refresh dashboard", true);
  }
}

async function updateOrderStatus(orderId, status) {
  try {
    setMessage("dashboardMessage", `Updating order status to ${status}...`);
    const response = await adminFetch(`/api/orders/${orderId}/status`, {
      method: "PATCH",
      body: JSON.stringify({ status }),
    });

    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(data.message || "Could not update order status");
    }

    state.orders = state.orders.map((order) => (order.id === orderId ? data : order));
    renderOrdersTable();
    renderSelectedOrder();
    setMessage("dashboardMessage", "Order status updated.");
  } catch (error) {
    setMessage("dashboardMessage", error.message || "Could not update order status", true);
    await refreshDashboard();
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
  state.orders = [];
  state.selectedOrderId = "";
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
