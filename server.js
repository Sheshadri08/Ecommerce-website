const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const dotenv = require("dotenv");

dotenv.config();

const app = express();
app.use(express.json());
app.use(cors());

// Routes
app.use("/api/products", require("./routes/productRoutes"));
app.use("/api/users", require("./routes/userRoutes"));

// MongoDB Connection
mongoose.connect(process.env.MONGO_URI)
.then(() => console.log("MongoDB Connected"))
.catch(err => console.log(err));

// Server
app.listen(5000, () => {
  console.log("Server running on port 5000");
});
app.delete("/product/:id", async (req, res) => {
    await Product.findByIdAndDelete(req.params.id);
    res.send("Deleted");
});
<button onclick="deleteProduct('${p._id}')">Delete</button>
async function deleteProduct(id) {
    await fetch("http://localhost:5000/product/" + id, {
        method: "DELETE"
    });
    alert("Deleted");
    location.reload();
}
