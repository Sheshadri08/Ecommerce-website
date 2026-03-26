const mongoose = require("mongoose");

const cartSchema = new mongoose.Schema({
    userId: String,
    items: [
        {
            productId: String,
            name: String,
            price: Number,
            image: String,
            qty: Number
        }
    ]
});

module.exports = mongoose.model("Cart", cartSchema);
app.post("/cart", auth, async (req, res) => {
    const { productId, name, price, image } = req.body;

    let cart = await Cart.findOne({ userId: req.userId });

    if (!cart) {
        cart = new Cart({ userId: req.userId, items: [] });
    }

    const existing = cart.items.find(i => i.productId === productId);

    if (existing) {
        existing.qty += 1;
    } else {
        cart.items.push({ productId, name, price, image, qty: 1 });
    }

    await cart.save();
    res.send("Added to cart");
});
app.get("/cart", auth, async (req, res) => {
    const cart = await Cart.findOne({ userId: req.userId });
    res.json(cart);
});