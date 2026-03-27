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

async function placeOrder(event) {
  event.preventDefault();

  const cart = getCart();
  const message = document.getElementById("checkoutMessage");

  if (!cart.length) {
    message.textContent = "Your cart is empty.";
    return;
  }

  const customerName = document.getElementById("customerName").value.trim();
  const customerEmail = document.getElementById("customerEmail").value.trim();

  if (!customerName || !customerEmail) {
    message.textContent = "Please enter your name and email.";
    return;
  }

  try {
    const response = await fetch("/api/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        customerName,
        customerEmail,
        items: cart.map((item) => ({ id: item.id, quantity: item.quantity })),
      }),
    });

    if (!response.ok) throw new Error("Order failed");

    const order = await response.json();
    localStorage.removeItem(CART_KEY);
    render();
    message.textContent = `Order ${order.id} confirmed. Total ${formatPrice(order.total)}.`;
  } catch (error) {
    message.textContent = "Could not place order. Please try again.";
  }
}

function render() {
  const cart = getCart();
  renderCartList(cart);
  updateSummary(cart);
}

function setup() {
  render();

  document.getElementById("checkoutForm").addEventListener("submit", placeOrder);
  document.getElementById("clearCartBtn").addEventListener("click", () => {
    localStorage.removeItem(CART_KEY);
    render();
  });
}

setup();
