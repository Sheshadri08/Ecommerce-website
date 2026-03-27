const router = require("express").Router();
const { catalog } = require("../data/catalog");

const productStore = [...catalog];

router.get("/", (req, res) => {
  const q = String(req.query.q || "").toLowerCase().trim();
  const category = String(req.query.category || "").toLowerCase().trim();
  const minPrice = Number(req.query.minPrice || 0);
  const maxPrice = Number(req.query.maxPrice || Number.MAX_SAFE_INTEGER);
  const sort = String(req.query.sort || "featured");
  const limit = Math.max(1, Math.min(120, Number(req.query.limit || 60)));

  let products = productStore.filter((product) => {
    const matchesQuery =
      !q ||
      product.name.toLowerCase().includes(q) ||
      product.description.toLowerCase().includes(q);

    const matchesCategory =
      !category || product.category.toLowerCase() === category;

    const matchesPrice = product.price >= minPrice && product.price <= maxPrice;

    return matchesQuery && matchesCategory && matchesPrice;
  });

  if (sort === "price-asc") products.sort((a, b) => a.price - b.price);
  if (sort === "price-desc") products.sort((a, b) => b.price - a.price);
  if (sort === "rating") products.sort((a, b) => b.rating - a.rating);
  if (sort === "name") products.sort((a, b) => a.name.localeCompare(b.name));

  const categories = [...new Set(productStore.map((p) => p.category))];

  res.json({
    products: products.slice(0, limit),
    total: products.length,
    categories,
  });
});

router.get("/:id", (req, res) => {
  const product = productStore.find((item) => item.id === req.params.id);

  if (!product) {
    return res.status(404).json({ message: "Product not found" });
  }

  return res.json(product);
});

router.post("/", (req, res) => {
  const { name, category, price, image, description } = req.body;

  if (!name || !category || !price || !image || !description) {
    return res.status(400).json({ message: "Missing required product fields" });
  }

  const newProduct = {
    id: `p-${Date.now()}`,
    name,
    category,
    price: Number(price),
    rating: Number(req.body.rating || 4),
    image,
    description,
    badge: req.body.badge || "",
  };

  productStore.unshift(newProduct);
  return res.status(201).json(newProduct);
});

module.exports = router;
