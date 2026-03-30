const router = require("express").Router();
const Order = require("../models/order");
const Product = require("../models/product");
const adminAuth = require("../middleware/adminAuth");
const mongoose = require("mongoose");

const PAYMENT_METHOD_LABELS = {
  cash_on_delivery: "Cash on Delivery",
  upi: "UPI",
  card: "Debit / Credit Card",
  net_banking: "Net Banking",
};

function normalizeOrder(orderDoc) {
  return {
    id: String(orderDoc._id),
    customerName: orderDoc.customerName,
    customerEmail: orderDoc.customerEmail,
    customerPhone: orderDoc.customerPhone,
    customerAddress: orderDoc.customerAddress,
    paymentMethod: orderDoc.paymentMethod,
    paymentMethodLabel: PAYMENT_METHOD_LABELS[orderDoc.paymentMethod] || orderDoc.paymentMethod,
    items: orderDoc.items.map((item) => ({
      product: String(item.product),
      name: item.name,
      price: item.price,
      quantity: item.quantity,
      lineTotal: item.lineTotal,
    })),
    subtotal: orderDoc.subtotal,
    shipping: orderDoc.shipping,
    tax: orderDoc.tax,
    total: orderDoc.total,
    status: orderDoc.status,
    createdAt: orderDoc.createdAt,
    updatedAt: orderDoc.updatedAt,
  };
}

router.get("/track/:id", async (req, res) => {
  const orderId = String(req.params.id || "").trim();
  const customerEmail = String(req.query.email || "")
    .trim()
    .toLowerCase();

  if (!orderId || !customerEmail) {
    return res.status(400).json({ message: "Order ID and customer email are required" });
  }

  if (!mongoose.isValidObjectId(orderId)) {
    return res.status(404).json({ message: "Order not found" });
  }

  try {
    const order = await Order.findById(orderId);

    if (!order || String(order.customerEmail || "").toLowerCase() !== customerEmail) {
      return res.status(404).json({ message: "Order not found for those details" });
    }

    return res.json(normalizeOrder(order));
  } catch (error) {
    return res.status(500).json({ message: "Could not load order details" });
  }
});

router.get("/", adminAuth, async (req, res) => {
  try {
    const orders = await Order.find({}).sort({ createdAt: -1 }).limit(100);
    return res.json({
      orders: orders.map(normalizeOrder),
      total: orders.length,
    });
  } catch (error) {
    return res.status(500).json({ message: "Could not load orders" });
  }
});

router.post("/", async (req, res) => {
  const { customerName, customerEmail, customerPhone, customerAddress, paymentMethod, items } = req.body;

  if (
    !customerName ||
    !customerEmail ||
    !customerPhone ||
    !customerAddress ||
    !paymentMethod ||
    !Array.isArray(items) ||
    items.length === 0
  ) {
    return res.status(400).json({ message: "Please provide customer details and items" });
  }

  if (!Object.hasOwn(PAYMENT_METHOD_LABELS, paymentMethod)) {
    return res.status(400).json({ message: "Please choose a valid payment option" });
  }

  try {
    const productIds = items.map((item) => item.id);
    const products = await Product.find({ _id: { $in: productIds } });
    const productMap = new Map(products.map((product) => [String(product._id), product]));

    const normalizedItems = items
      .map((item) => {
        const product = productMap.get(String(item.id));
        if (!product) return null;

        const quantity = Math.max(1, Number(item.quantity || 1));
        if (product.inventory < quantity) {
          throw new Error(`Only ${product.inventory} unit(s) left for ${product.name}`);
        }

        return {
          product: product._id,
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

    const order = await Order.create({
      customerName,
      customerEmail,
      customerPhone,
      customerAddress,
      paymentMethod,
      items: normalizedItems,
      subtotal,
      shipping,
      tax,
      total,
      status: "confirmed",
    });

    await Product.bulkWrite(
      normalizedItems.map((item) => ({
        updateOne: {
          filter: { _id: item.product },
          update: { $inc: { inventory: -item.quantity } },
        },
      }))
    );

    return res.status(201).json(normalizeOrder(order));
  } catch (error) {
    return res.status(400).json({ message: error.message || "Could not place order" });
  }
});

router.patch("/:id/status", adminAuth, async (req, res) => {
  try {
    const order = await Order.findByIdAndUpdate(
      req.params.id,
      { status: req.body.status },
      { new: true, runValidators: true }
    );

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    return res.json(normalizeOrder(order));
  } catch (error) {
    return res.status(400).json({ message: "Could not update order status" });
  }
});

module.exports = router;
