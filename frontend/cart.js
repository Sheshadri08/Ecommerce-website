const CART_KEY = "novacart_cart_v1";
const DEMO_PRODUCTS_KEY = "novacart_demo_products_v1";
const DEMO_ORDERS_KEY = "novacart_demo_orders_v1";
const LAST_ORDER_KEY = "novacart_last_order_lookup_v1";
const CONFIG = window.NOVACART_CONFIG || {};
const API_BASE_URL = (CONFIG.API_BASE_URL || "").replace(/\/$/, "");
const ADMIN_URL = CONFIG.ADMIN_URL || (API_BASE_URL ? `${API_BASE_URL}/admin/` : "/admin/");
const FALLBACK_CATALOG = Array.isArray(window.NOVACART_FALLBACK_CATALOG) ? window.NOVACART_FALLBACK_CATALOG : [];

const PAYMENT_METHOD_LABELS = {
  cash_on_delivery: "Cash on Delivery",
  upi: "UPI",
  card: "Debit / Credit Card",
  net_banking: "Net Banking",
};

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

function saveDemoProducts(products) {
  localStorage.setItem(DEMO_PRODUCTS_KEY, JSON.stringify(products));
}

function getDemoOrders() {
  return JSON.parse(localStorage.getItem(DEMO_ORDERS_KEY) || "[]");
}

function saveDemoOrders(orders) {
  localStorage.setItem(DEMO_ORDERS_KEY, JSON.stringify(orders));
}

function saveLastOrderLookup(order) {
  localStorage.setItem(
    LAST_ORDER_KEY,
    JSON.stringify({
      orderId: order.id,
      customerEmail: order.customerEmail,
    })
  );
}

function calculateTotals(cart) {
  const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const shipping = subtotal >= 3999 || subtotal === 0 ? 0 : 149;
  const tax = Math.round(subtotal * 0.05);
  const total = subtotal + shipping + tax;
  return { subtotal, shipping, tax, total };
}

function updateSummary(cart) {
  const totals = calculateTotals(cart);
  document.getElementById("subtotal").textContent = formatPrice(totals.subtotal);
  document.getElementById("shipping").textContent = formatPrice(totals.shipping);
  document.getElementById("tax").textContent = formatPrice(totals.tax);
  document.getElementById("total").textContent = formatPrice(totals.total);
  return totals;
}

function changeQty(id, delta) {
  const cart = getCart();
  const item = cart.find((entry) => entry.id === id);
  if (!item) return;

  item.quantity = Math.max(1, item.quantity + delta);
  saveCart(cart);
  render();
}

function removeItem(id) {
  const cart = getCart().filter((item) => item.id !== id);
  saveCart(cart);
  render();
}

function renderCartList(cart) {
  const list = document.getElementById("cartList");
  list.innerHTML = "";

  if (!cart.length) {
    list.innerHTML = `
      <div class="empty-state">
        <h3>Your cart is empty</h3>
        <p>Add a few products and come back to checkout.</p>
        <a href="index.html" class="cart-link">Shop Products</a>
      </div>
    `;
    return;
  }

  cart.forEach((item) => {
    const card = document.createElement("article");
    card.className = "cart-item";
    card.innerHTML = `
      <img src="${item.image}" alt="${item.name}" />
      <div>
        <h4>${item.name}</h4>
        <p>${formatPrice(item.price)}</p>
        <div class="qty-control">
          <button class="qty-btn" data-action="minus">-</button>
          <strong>${item.quantity}</strong>
          <button class="qty-btn" data-action="plus">+</button>
        </div>
      </div>
      <div>
        <strong>${formatPrice(item.price * item.quantity)}</strong>
        <br />
        <button class="secondary-btn" style="margin-top:8px" data-action="remove">Remove</button>
      </div>
    `;

    card.querySelector('[data-action="minus"]').addEventListener("click", () => changeQty(item.id, -1));
    card.querySelector('[data-action="plus"]').addEventListener("click", () => changeQty(item.id, 1));
    card.querySelector('[data-action="remove"]').addEventListener("click", () => removeItem(item.id));

    list.appendChild(card);
  });
}

function placeDemoOrder(payload) {
  const products = getDemoProducts();
  const productMap = new Map(products.map((product) => [product.id, product]));
  const items = payload.items.map((item) => {
    const product = productMap.get(item.id);
    if (!product) {
      throw new Error("One or more products are unavailable.");
    }

    const quantity = Math.max(1, Number(item.quantity || 1));
    if (product.inventory < quantity) {
      throw new Error(`Only ${product.inventory} unit(s) left for ${product.name}`);
    }

    return {
      product: product.id,
      name: product.name,
      price: product.price,
      quantity,
      lineTotal: product.price * quantity,
    };
  });

  const subtotal = items.reduce((sum, item) => sum + item.lineTotal, 0);
  const shipping = subtotal >= 3999 ? 0 : 149;
  const tax = Math.round(subtotal * 0.05);
  const total = subtotal + shipping + tax;
  const order = {
    id: `demo-${Date.now()}`,
    customerName: payload.customerName,
    customerEmail: payload.customerEmail,
    customerPhone: payload.customerPhone,
    customerAddress: payload.customerAddress,
    paymentMethod: payload.paymentMethod,
    paymentMethodLabel: PAYMENT_METHOD_LABELS[payload.paymentMethod] || payload.paymentMethod,
    items,
    subtotal,
    shipping,
    tax,
    total,
    status: "confirmed",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  items.forEach((item) => {
    const product = productMap.get(item.product);
    product.inventory = Math.max(0, product.inventory - item.quantity);
  });

  saveDemoProducts(products);
  saveDemoOrders([order, ...getDemoOrders()]);
  return order;
}

async function placeOrder(event) {
  event.preventDefault();

  const cart = getCart();
  const message = document.getElementById("checkoutMessage");
  const checkoutButton = document.getElementById("checkoutButton");

  if (!cart.length) {
    message.textContent = "Your cart is empty.";
    return;
  }

  const customerName = document.getElementById("customerName").value.trim();
  const customerEmail = document.getElementById("customerEmail").value.trim();
  const customerPhone = document.getElementById("customerPhone").value.trim();
  const customerAddress = document.getElementById("customerAddress").value.trim();
  const paymentMethod = document.getElementById("paymentMethod").value;

  if (!customerName || !customerEmail || !customerPhone || !customerAddress || !paymentMethod) {
    message.textContent = "Please complete your contact details, address, and payment option.";
    return;
  }

  try {
    checkoutButton.disabled = true;
    message.textContent = "Submitting your order...";

    const payload = {
      customerName,
      customerEmail,
      customerPhone,
      customerAddress,
      paymentMethod,
      items: cart.map((item) => ({ id: item.id, quantity: item.quantity })),
    };

    let order;

    try {
      const response = await fetch(apiUrl("/api/orders"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || "Order failed");
      }

      order = await response.json();
    } catch (error) {
      order = placeDemoOrder(payload);
    }

    localStorage.removeItem(CART_KEY);
    saveLastOrderLookup(order);
    document.getElementById("checkoutForm").reset();
    render();
    message.innerHTML = `Order ${order.id.slice(-6).toUpperCase()} confirmed via ${order.paymentMethodLabel}. Total ${formatPrice(order.total)}. <a href="track.html?orderId=${encodeURIComponent(order.id)}&email=${encodeURIComponent(order.customerEmail)}">Track this order</a>.`;
  } catch (error) {
    message.textContent = error.message || "Could not place order. Please try again.";
  } finally {
    checkoutButton.disabled = false;
  }
}

function render() {
  const cart = getCart();
  renderCartList(cart);
  updateSummary(cart);
}

function setup() {
  document.querySelectorAll("[data-admin-link]").forEach((link) => {
    link.href = ADMIN_URL;
  });

  render();

  document.getElementById("checkoutForm").addEventListener("submit", placeOrder);
  document.getElementById("clearCartBtn").addEventListener("click", () => {
    localStorage.removeItem(CART_KEY);
    render();
  });
}

setup();
