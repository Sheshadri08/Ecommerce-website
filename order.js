const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema({
    userId: String,
    items: Array,
    total: Number,
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("Order", orderSchema);
app.post("/order", auth, async (req, res) => {
    const cart = await Cart.findOne({ userId: req.userId });

    const total = cart.items.reduce((sum, i) => sum + i.price * i.qty, 0);

    const order = new Order({
        userId: req.userId,
        items: cart.items,
        total
    });

    await order.save();

    cart.items = [];
    await cart.save();

    res.send("Order placed 🎉");
});

app.get("/orders", auth, async (req, res) => {
    const orders = await Order.find({ userId: req.userId });
    res.json(orders);
});