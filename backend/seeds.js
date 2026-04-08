const { connectToDatabase } = require("./db");
const Product = require("./models/product");
const User = require("./models/user");
const { catalog } = require("./routes/data/catalog");

async function seedProducts() {
  const existingProducts = await Product.find({}, { name: 1, category: 1 }).lean();
  const existingKeys = new Set(
    existingProducts.map((product) => `${product.name.toLowerCase()}::${product.category.toLowerCase()}`)
  );

  const productsToInsert = catalog
    .filter((product) => !existingKeys.has(`${product.name.toLowerCase()}::${product.category.toLowerCase()}`))
    .map((product) => ({
      name: product.name,
      category: product.category,
      price: product.price,
      image: product.image,
      description: product.description,
      rating: product.rating,
      badge: product.badge || "",
      inventory: product.inventory ?? 12,
      featured: Boolean(product.badge),
    }));

  if (!productsToInsert.length) {
    console.log(`Catalog already synced. Found ${existingProducts.length} products.`);
    return;
  }

  await Product.insertMany(productsToInsert);
  console.log(
    `Inserted ${productsToInsert.length} new products. Total catalog size: ${
      existingProducts.length + productsToInsert.length
    }.`
  );
}

async function seedAdmin() {
  const adminEmail = (process.env.ADMIN_EMAIL || "admin@gmail.com").toLowerCase();
  const adminPassword = process.env.ADMIN_PASSWORD || "1234567890";
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
