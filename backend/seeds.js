const { connectToDatabase } = require("./db");
const Product = require("./models/product");
const User = require("./models/user");
const { catalog } = require("./routes/data/catalog");

async function seedProducts() {
  const existingProducts = await Product.countDocuments({});

  if (existingProducts > 0) {
    console.log(`Skipping product seed. Found ${existingProducts} existing products.`);
    return;
  }

  await Product.insertMany(
    catalog.map((product) => ({
      name: product.name,
      category: product.category,
      price: product.price,
      image: product.image,
      description: product.description,
      rating: product.rating,
      badge: product.badge || "",
      inventory: product.inventory ?? 12,
      featured: Boolean(product.badge),
    }))
  );

  console.log(`Seeded ${catalog.length} products.`);
}

async function seedAdmin() {
  const adminEmail = (process.env.ADMIN_EMAIL || "admin@novacart.local").toLowerCase();
  const adminPassword = process.env.ADMIN_PASSWORD || "Admin@123";
  const adminName = process.env.ADMIN_NAME || "NovaCart Admin";

  const existingAdmin = await User.findOne({ email: adminEmail });
  if (existingAdmin) {
    console.log(`Admin account already exists for ${adminEmail}.`);
    return;
  }

  const admin = new User({
    name: adminName,
    email: adminEmail,
    isAdmin: true,
  });
  admin.setPassword(adminPassword);
  await admin.save();

  console.log(`Created admin account for ${adminEmail}.`);
}

async function runSeed() {
  try {
    await connectToDatabase();
    await seedProducts();
    await seedAdmin();
    console.log("Seed complete.");
    process.exit(0);
  } catch (error) {
    console.error("Seed failed:", error.message);
    process.exit(1);
  }
}

runSeed();
