const DEMO_ORDERS_KEY = "novacart_demo_orders_v1";
const LAST_ORDER_KEY = "novacart_last_order_lookup_v1";
const CONFIG = window.NOVACART_CONFIG || {};
const API_BASE_URL = (CONFIG.API_BASE_URL || "").replace(/\/$/, "");

function formatPrice(value) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value || 0);
}

function apiUrl(path) {
  return API_BASE_URL ? `${API_BASE_URL}${path}` : path;
}

function getDemoOrders() {
  return JSON.parse(localStorage.getItem(DEMO_ORDERS_KEY) || "[]");
}

function setMessage(message, isError = false) {
  const status = document.getElementById("trackMessage");
  status.textContent = message;
  status.classList.toggle("status-error", isError);
}

function saveLastLookup(orderId, customerEmail) {
  localStorage.setItem(LAST_ORDER_KEY, JSON.stringify({ orderId, customerEmail }));
}

function loadLastLookup() {
  return JSON.parse(localStorage.getItem(LAST_ORDER_KEY) || "null");
}

function formatOrderCode(orderId) {
  return String(orderId || "").slice(-6).toUpperCase();
}

function renderOrder(order) {
  document.getElementById("trackResult").classList.remove("hidden");
  document.getElementById("trackStatusPill").textContent = order.status;
  document.getElementById("trackOrderCode").textContent = formatOrderCode(order.id);
  document.getElementById("trackPlacedAt").textContent = new Date(order.createdAt).toLocaleString();
  document.getElementById("trackPayment").textContent = order.paymentMethodLabel;
  document.getElementById("trackTotal").textContent = formatPrice(order.total);
  document.getElementById("trackCustomerName").textContent = order.customerName;
  document.getElementById("trackCustomerPhone").textContent = order.customerPhone;
  document.getElementById("trackAddress").textContent = order.customerAddress;

  const items = document.getElementById("trackItems");
  items.innerHTML = order.items
    .map((item) => `<li>${item.name} x ${item.quantity} = ${formatPrice(item.lineTotal)}</li>`)
    .join("");
}

function findDemoOrder(orderId, customerEmail) {
  return getDemoOrders().find(
    (order) =>
      String(order.id) === String(orderId) &&
      String(order.customerEmail || "").toLowerCase() === String(customerEmail || "").toLowerCase()
  );
}

async function fetchTrackedOrder(orderId, customerEmail) {
  const response = await fetch(
    apiUrl(`/api/orders/track/${encodeURIComponent(orderId)}?email=${encodeURIComponent(customerEmail)}`)
  );

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || "Could not find that order");
  }

  return response.json();
}

async function handleTrackOrder(event) {
  event.preventDefault();

  const orderId = document.getElementById("trackOrderId").value.trim();
  const customerEmail = document.getElementById("trackCustomerEmail").value.trim().toLowerCase();

  if (!orderId || !customerEmail) {
    setMessage("Please enter the order ID and customer email.", true);
    return;
  }

  try {
    setMessage("Checking your order...");
    let order;

    try {
      order = await fetchTrackedOrder(orderId, customerEmail);
    } catch (error) {
      order = findDemoOrder(orderId, customerEmail);
      if (!order) {
        throw error;
      }
    }

    renderOrder(order);
    saveLastLookup(orderId, customerEmail);
    setMessage(`Order ${formatOrderCode(order.id)} is currently ${order.status}.`);
  } catch (error) {
    document.getElementById("trackResult").classList.add("hidden");
    setMessage(error.message || "Could not track that order right now.", true);
  }
}

function prefillLookup() {
  const params = new URLSearchParams(window.location.search);
  const savedLookup = loadLastLookup();
  const orderId = params.get("orderId") || savedLookup?.orderId || "";
  const customerEmail = params.get("email") || savedLookup?.customerEmail || "";

  document.getElementById("trackOrderId").value = orderId;
  document.getElementById("trackCustomerEmail").value = customerEmail;

  if (orderId && customerEmail) {
    document.getElementById("trackOrderForm").requestSubmit();
  }
}

function init() {
  document.getElementById("trackOrderForm").addEventListener("submit", handleTrackOrder);
  prefillLookup();
}

init();
