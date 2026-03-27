const router = require("express").Router();
const Product = require("../models/product");
const Order = require("../models/order");
const User = require("../models/user");
const adminAuth = require("../middleware/adminAuth");

router.get("/overview", adminAuth, async (req, res) => {
  try {
    const [productCount, orderCount, userCount, revenueResult, latestOrders, lowStockProducts] =
      await Promise.all([
        Product.countDocuments({}),
        Order.countDocuments({}),
        User.countDocuments({}),
        Order.aggregate([{ $group: { _id: null, revenue: { $sum: "$total" } } }]),
        Order.find({}).sort({ createdAt: -1 }).limit(5),
        Product.find({ inventory: { $lte: 5 } }).sort({ inventory: 1, name: 1 }).limit(5),
      ]);

    return res.json({
      metrics: {
        products: productCount,
        orders: orderCount,
        users: userCount,
        revenue: revenueResult[0]?.revenue || 0,
      },
      latestOrders: latestOrders.map((order) => ({
        id: String(order._id),
        customerName: order.customerName,
        total: order.total,
        status: order.status,
        createdAt: order.createdAt,
      })),
      lowStockProducts: lowStockProducts.map((product) => ({
        id: String(product._id),
        name: product.name,
        inventory: product.inventory,
        category: product.category,
      })),
    });
  } catch (error) {
    return res.status(500).json({ message: "Could not load admin overview" });
  }
});

module.exports = router;
