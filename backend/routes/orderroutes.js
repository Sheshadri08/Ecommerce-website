const router = require("express").Router();
const { catalog } = require("../data/catalog");

const orders = [];

router.get("/", (req, res) => {
  res.json({
    orders,
    total: orders.length,
  });
});

router.post("/", (req, res) => {
  const { customerName, customerEmail, items } = req.body;

  if (!customerName || !customerEmail || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ message: "Please provide customer details and items" });
  }

  const normalizedItems = items
    .map((item) => {
      const product = catalog.find((productItem) => productItem.id === item.id);
      if (!product) return null;

      const quantity = Math.max(1, Number(item.quantity || 1));
      return {
        id: product.id,
        name: product.name,
        price: product.price,
        quantity,
        lineTotal: product.price * quantity,
      };
    })
    .filter(Boolean);

  if (!normalizedItems.length) {
    return res.status(400).json({ message: "No valid products in order" });
  }

  const subtotal = normalizedItems.reduce((sum, item) => sum + item.lineTotal, 0);
  const shipping = subtotal >= 3999 ? 0 : 149;
  const tax = Math.round(subtotal * 0.05);
  const total = subtotal + shipping + tax;

  const order = {
    id: `ord-${Date.now()}`,
    customerName,
    customerEmail,
    items: normalizedItems,
    subtotal,
    shipping,
    tax,
    total,
    status: "confirmed",
    createdAt: new Date().toISOString(),
  };

  orders.unshift(order);
  return res.status(201).json(order);
});

module.exports = router;
