const router = require("express").Router();
const Product = require("../models/product");
const adminAuth = require("../middleware/adminAuth");

function buildFilters(query) {
  const filters = {};

  if (query.q) {
    filters.$or = [
      { name: { $regex: query.q, $options: "i" } },
      { description: { $regex: query.q, $options: "i" } },
      { category: { $regex: query.q, $options: "i" } },
    ];
  }

  if (query.category) {
    filters.category = query.category;
  }

  const minPrice = Number(query.minPrice || 0);
  const maxPrice = Number(query.maxPrice || Number.MAX_SAFE_INTEGER);

  filters.price = { $gte: minPrice, $lte: maxPrice };

  return filters;
}

function buildSort(sortKey) {
  if (sortKey === "price-asc") return { price: 1, createdAt: -1 };
  if (sortKey === "price-desc") return { price: -1, createdAt: -1 };
  if (sortKey === "rating") return { rating: -1, createdAt: -1 };
  if (sortKey === "name") return { name: 1 };
  return { createdAt: -1 };
}

function normalizeProduct(productDoc) {
  return {
    id: String(productDoc._id),
    name: productDoc.name,
    category: productDoc.category,
    price: productDoc.price,
    image: productDoc.image,
    description: productDoc.description,
    rating: productDoc.rating,
    badge: productDoc.badge,
    inventory: productDoc.inventory,
    featured: productDoc.featured,
    createdAt: productDoc.createdAt,
    updatedAt: productDoc.updatedAt,
  };
}

router.get("/", async (req, res) => {
  try {
    const limit = Math.max(1, Math.min(120, Number(req.query.limit || 60)));
    const filters = buildFilters(req.query);
    const sort = buildSort(String(req.query.sort || "featured"));

    const [products, total, categories] = await Promise.all([
      Product.find(filters).sort(sort).limit(limit),
      Product.countDocuments(filters),
      Product.distinct("category"),
    ]);

    return res.json({
      products: products.map(normalizeProduct),
      total,
      categories: categories.sort((left, right) => left.localeCompare(right)),
    });
  } catch (error) {
    return res.status(500).json({ message: "Could not load products" });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    return res.json(normalizeProduct(product));
  } catch (error) {
    return res.status(404).json({ message: "Product not found" });
  }
});

router.post("/", adminAuth, async (req, res) => {
  try {
    const product = await Product.create({
      name: req.body.name,
      category: req.body.category,
      price: Number(req.body.price),
      image: req.body.image,
      description: req.body.description,
      rating: Number(req.body.rating || 4),
      badge: req.body.badge || "",
      inventory: Math.max(0, Number(req.body.inventory ?? 0)),
      featured: Boolean(req.body.featured),
    });

    return res.status(201).json(normalizeProduct(product));
  } catch (error) {
    return res.status(400).json({ message: "Invalid product data" });
  }
});

router.put("/:id", adminAuth, async (req, res) => {
  try {
    const product = await Product.findByIdAndUpdate(
      req.params.id,
      {
        name: req.body.name,
        category: req.body.category,
        price: Number(req.body.price),
        image: req.body.image,
        description: req.body.description,
        rating: Number(req.body.rating || 4),
        badge: req.body.badge || "",
        inventory: Math.max(0, Number(req.body.inventory ?? 0)),
        featured: Boolean(req.body.featured),
      },
      { new: true, runValidators: true }
    );

    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    return res.json(normalizeProduct(product));
  } catch (error) {
    return res.status(400).json({ message: "Could not update product" });
  }
});

router.delete("/:id", adminAuth, async (req, res) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);

    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    return res.json({ message: "Product deleted" });
  } catch (error) {
    return res.status(400).json({ message: "Could not delete product" });
  }
});

module.exports = router;
