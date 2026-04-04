const bcrypt = require("bcrypt");
const mongoose = require("mongoose");
const connectToMongoDB = require("../config/mongo-connection");
const Retailer = require("../server/models/retailers/retailers");
const Category = require("../server/models/retailers/categories");
const Product = require("../server/models/retailers/products");
const Consumer = require("../server/models/consumers/consumers");
const Order = require("../server/models/consumers/orders");

const SALT_ROUNDS = Number(process.env.saltRounds || 10);
const DEFAULT_PASSWORD = "Password123";

const slugify = (value = "") =>
  String(value)
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");

const retailerSeed = [
  {
    companyName: "Tech Haven",
    contactName: "Amelia Stone",
    email: "owner@techhaven.com",
    contactNumber: "+1 555 010 1001",
    gstNumber: "GST-TECH-1001",
    panNumber: "PAN-TECH-1001",
    companyLogo:
      "https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=400&q=80",
    address: {
      line1: "241 Silicon Avenue",
      city: "San Francisco",
      state: "California",
      country: "USA",
      postalCode: "94107",
    },
    categories: [
      {
        name: "Audio",
        description: "Headphones, speakers and personal listening devices.",
        imageUrl:
          "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=800&q=80",
      },
      {
        name: "Accessories",
        description: "Smart accessories and desk essentials for modern setups.",
        imageUrl:
          "https://images.unsplash.com/photo-1517336714739-489689fd1ca8?auto=format&fit=crop&w=800&q=80",
      },
    ],
    products: [
      {
        categoryName: "Audio",
        name: "Nova Wireless Headphones",
        description:
          "Premium over-ear headphones with active noise cancellation and 30-hour battery.",
        imageUrl:
          "https://images.unsplash.com/photo-1546435770-a3e426bf472b?auto=format&fit=crop&w=900&q=80",
        sku: "TH-AUD-001",
        price: 189.99,
        inventory: 22,
        isFeatured: true,
        tags: ["wireless", "noise-cancelling", "audio"],
      },
      {
        categoryName: "Accessories",
        name: "Orbit MagSafe Power Bank",
        description:
          "Compact magnetic power bank made for everyday travel and mobile productivity.",
        imageUrl:
          "https://images.unsplash.com/photo-1585338447937-7082f8fc763d?auto=format&fit=crop&w=900&q=80",
        sku: "TH-ACC-002",
        price: 59.99,
        inventory: 48,
        isFeatured: false,
        tags: ["charger", "mobile", "travel"],
      },
      {
        categoryName: "Accessories",
        name: "Aura Mechanical Keyboard",
        description:
          "Low-profile keyboard with tactile switches and RGB underglow.",
        imageUrl:
          "https://images.unsplash.com/photo-1511467687858-23d96c32e4ae?auto=format&fit=crop&w=900&q=80",
        sku: "TH-ACC-003",
        price: 129.99,
        inventory: 12,
        isFeatured: true,
        tags: ["keyboard", "desk-setup", "gaming"],
      },
    ],
  },
  {
    companyName: "Urban Threads",
    contactName: "Jordan Miles",
    email: "hello@urbanthreads.com",
    contactNumber: "+1 555 010 2002",
    gstNumber: "GST-FASH-2002",
    panNumber: "PAN-FASH-2002",
    companyLogo:
      "https://images.unsplash.com/photo-1529139574466-a303027c1d8b?auto=format&fit=crop&w=400&q=80",
    address: {
      line1: "52 Market Street",
      city: "New York",
      state: "New York",
      country: "USA",
      postalCode: "10013",
    },
    categories: [
      {
        name: "Outerwear",
        description: "Layer-ready jackets for city travel and weekend wear.",
        imageUrl:
          "https://images.unsplash.com/photo-1523381210434-271e8be1f52b?auto=format&fit=crop&w=800&q=80",
      },
      {
        name: "Footwear",
        description: "Fashion sneakers built for all-day comfort.",
        imageUrl:
          "https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=800&q=80",
      },
    ],
    products: [
      {
        categoryName: "Outerwear",
        name: "Metro Utility Jacket",
        description:
          "Water-resistant jacket with lightweight insulation and oversized pockets.",
        imageUrl:
          "https://images.unsplash.com/photo-1541099649105-f69ad21f3246?auto=format&fit=crop&w=900&q=80",
        sku: "UT-OUT-001",
        price: 119.0,
        inventory: 18,
        isFeatured: true,
        tags: ["jacket", "streetwear", "utility"],
      },
      {
        categoryName: "Footwear",
        name: "Pulse Street Sneakers",
        description:
          "Minimal sneakers with cushioned soles and breathable knit upper.",
        imageUrl:
          "https://images.unsplash.com/photo-1543508282-6319a3e2621f?auto=format&fit=crop&w=900&q=80",
        sku: "UT-FTW-002",
        price: 89.5,
        inventory: 30,
        isFeatured: true,
        tags: ["sneakers", "fashion", "casual"],
      },
      {
        categoryName: "Outerwear",
        name: "Cloud Fleece Overshirt",
        description:
          "Soft fleece overshirt ideal for layering in transitional weather.",
        imageUrl:
          "https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&w=900&q=80",
        sku: "UT-OUT-003",
        price: 72.0,
        inventory: 26,
        isFeatured: false,
        tags: ["fleece", "overshirt", "layering"],
      },
    ],
  },
  {
    companyName: "Home Nest",
    contactName: "Sophia Bennett",
    email: "care@homenest.com",
    contactNumber: "+1 555 010 3003",
    gstNumber: "GST-HOME-3003",
    panNumber: "PAN-HOME-3003",
    companyLogo:
      "https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=400&q=80",
    address: {
      line1: "78 Willow Park",
      city: "Austin",
      state: "Texas",
      country: "USA",
      postalCode: "73301",
    },
    categories: [
      {
        name: "Decor",
        description: "Tasteful home accents for warm and minimal spaces.",
        imageUrl:
          "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=800&q=80",
      },
      {
        name: "Lighting",
        description:
          "Ambient lighting for workspaces, bedrooms and living rooms.",
        imageUrl:
          "https://images.unsplash.com/photo-1519710164239-da123dc03ef4?auto=format&fit=crop&w=800&q=80",
      },
    ],
    products: [
      {
        categoryName: "Decor",
        name: "Sienna Ceramic Vase",
        description:
          "Matte ceramic vase with sculpted silhouette for shelves and dining tables.",
        imageUrl:
          "https://images.unsplash.com/photo-1517705008128-361805f42e86?auto=format&fit=crop&w=900&q=80",
        sku: "HN-DEC-001",
        price: 44.99,
        inventory: 34,
        isFeatured: true,
        tags: ["vase", "decor", "ceramic"],
      },
      {
        categoryName: "Lighting",
        name: "Luma Table Lamp",
        description:
          "Soft-glow table lamp with fabric shade and brushed metal base.",
        imageUrl:
          "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=900&q=80",
        sku: "HN-LGT-002",
        price: 69.0,
        inventory: 20,
        isFeatured: false,
        tags: ["lamp", "lighting", "bedroom"],
      },
      {
        categoryName: "Decor",
        name: "Woven Throw Blanket",
        description:
          "Textured throw blanket designed for cozy sofas and layered beds.",
        imageUrl:
          "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=900&q=80",
        sku: "HN-DEC-003",
        price: 54.5,
        inventory: 27,
        isFeatured: true,
        tags: ["blanket", "textile", "living-room"],
      },
    ],
  },
];

const consumerSeed = [
  {
    name: "Olivia Parker",
    email: "olivia.parker@example.com",
    mobileNumber: "+1 555 200 1001",
    profilePhoto:
      "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=400&q=80",
    shippingAddress: {
      line1: "11 Riverwalk Lane",
      city: "Seattle",
      state: "Washington",
      country: "USA",
      postalCode: "98101",
    },
  },
  {
    name: "Noah Collins",
    email: "noah.collins@example.com",
    mobileNumber: "+1 555 200 1002",
    profilePhoto:
      "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=400&q=80",
    shippingAddress: {
      line1: "844 Ocean Drive",
      city: "Miami",
      state: "Florida",
      country: "USA",
      postalCode: "33139",
    },
  },
  {
    name: "Mia Thompson",
    email: "mia.thompson@example.com",
    mobileNumber: "+1 555 200 1003",
    profilePhoto:
      "https://images.unsplash.com/photo-1488426862026-3ee34a7d66df?auto=format&fit=crop&w=400&q=80",
    shippingAddress: {
      line1: "92 Maple Street",
      city: "Denver",
      state: "Colorado",
      country: "USA",
      postalCode: "80202",
    },
  },
  {
    name: "Liam Brooks",
    email: "liam.brooks@example.com",
    mobileNumber: "+1 555 200 1004",
    profilePhoto:
      "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=400&q=80",
    shippingAddress: {
      line1: "304 Garden Terrace",
      city: "Chicago",
      state: "Illinois",
      country: "USA",
      postalCode: "60601",
    },
  },
];

const orderSeedBlueprint = [
  {
    consumerEmail: "olivia.parker@example.com",
    paymentMethod: "card",
    itemSpecs: [
      { sku: "TH-AUD-001", quantity: 1 },
      { sku: "HN-DEC-001", quantity: 2 },
    ],
  },
  {
    consumerEmail: "noah.collins@example.com",
    paymentMethod: "card",
    itemSpecs: [
      { sku: "UT-FTW-002", quantity: 1 },
      { sku: "UT-OUT-001", quantity: 1 },
    ],
  },
  {
    consumerEmail: "mia.thompson@example.com",
    paymentMethod: "card",
    itemSpecs: [
      { sku: "TH-ACC-003", quantity: 1 },
      { sku: "TH-ACC-002", quantity: 1 },
      { sku: "HN-LGT-002", quantity: 1 },
    ],
  },
  {
    consumerEmail: "liam.brooks@example.com",
    paymentMethod: "card",
    itemSpecs: [
      { sku: "HN-DEC-003", quantity: 1 },
      { sku: "UT-OUT-003", quantity: 2 },
    ],
  },
];

async function clearCollections() {
  await Promise.all([
    Order.deleteMany({}),
    Product.deleteMany({}),
    Category.deleteMany({}),
    Consumer.deleteMany({}),
    Retailer.deleteMany({}),
  ]);
}

async function createRetailersCategoriesProducts(passwordHash) {
  const retailerDocs = [];
  const categoryMap = new Map();
  const productDocs = [];

  for (const retailerData of retailerSeed) {
    const retailer = await Retailer.create({
      companyName: retailerData.companyName,
      contactName: retailerData.contactName,
      email: retailerData.email,
      password: passwordHash,
      contactNumber: retailerData.contactNumber,
      gstNumber: retailerData.gstNumber,
      panNumber: retailerData.panNumber,
      companyLogo: retailerData.companyLogo,
      address: retailerData.address,
    });

    retailerDocs.push(retailer);

    for (const categoryData of retailerData.categories) {
      const category = await Category.create({
        retailer: retailer._id,
        name: categoryData.name,
        slug: slugify(categoryData.name),
        description: categoryData.description,
        imageUrl: categoryData.imageUrl,
      });

      categoryMap.set(`${retailer.email}:${category.name}`, category);
    }

    for (const productData of retailerData.products) {
      const category = categoryMap.get(
        `${retailer.email}:${productData.categoryName}`,
      );
      const product = await Product.create({
        retailer: retailer._id,
        category: category._id,
        name: productData.name,
        slug: slugify(`${productData.name}-${productData.sku}`),
        description: productData.description,
        imageUrl: productData.imageUrl,
        sku: productData.sku,
        price: productData.price,
        inventory: productData.inventory,
        isFeatured: productData.isFeatured,
        isActive: true,
        tags: productData.tags,
      });

      productDocs.push(product);
    }
  }

  return { retailerDocs, productDocs };
}

async function createConsumers(passwordHash) {
  return Consumer.insertMany(
    consumerSeed.map((consumer) => ({
      ...consumer,
      password: passwordHash,
    })),
  );
}

async function createOrders(consumers, products) {
  const consumerMap = new Map(
    consumers.map((consumer) => [consumer.email, consumer]),
  );
  const productMap = new Map(products.map((product) => [product.sku, product]));

  for (const blueprint of orderSeedBlueprint) {
    const consumer = consumerMap.get(blueprint.consumerEmail);
    const items = blueprint.itemSpecs.map((spec) => {
      const product = productMap.get(spec.sku);
      const lineTotal = Number((product.price * spec.quantity).toFixed(2));

      return {
        product: product._id,
        retailer: product.retailer,
        category: product.category,
        name: product.name,
        imageUrl: product.imageUrl,
        quantity: spec.quantity,
        unitPrice: product.price,
        lineTotal,
      };
    });

    const subtotal = Number(
      items.reduce((sum, item) => sum + item.lineTotal, 0).toFixed(2),
    );
    const shippingFee = subtotal > 100 ? 0 : 4.99;
    const total = Number((subtotal + shippingFee).toFixed(2));

    await Order.create({
      consumer: consumer._id,
      items,
      status: "confirmed",
      paymentMethod: blueprint.paymentMethod,
      subtotal,
      shippingFee,
      total,
      shippingAddress: consumer.shippingAddress,
    });

    await Promise.all(
      blueprint.itemSpecs.map(async (spec) => {
        const product = productMap.get(spec.sku);
        product.inventory -= spec.quantity;
        await Product.updateOne(
          { _id: product._id },
          { $inc: { inventory: -spec.quantity } },
        );
      }),
    );
  }
}

async function runSeed() {
  try {
    await connectToMongoDB();
    await clearCollections();

    const passwordHash = await bcrypt.hash(DEFAULT_PASSWORD, SALT_ROUNDS);
    const { retailerDocs, productDocs } =
      await createRetailersCategoriesProducts(passwordHash);
    const consumerDocs = await createConsumers(passwordHash);
    await createOrders(consumerDocs, productDocs);

    const counts = await Promise.all([
      Retailer.countDocuments(),
      Category.countDocuments(),
      Product.countDocuments(),
      Consumer.countDocuments(),
      Order.countDocuments(),
    ]);

    console.log("Seed completed successfully.");
    console.log(`Retailers: ${counts[0]}`);
    console.log(`Categories: ${counts[1]}`);
    console.log(`Products: ${counts[2]}`);
    console.log(`Consumers: ${counts[3]}`);
    console.log(`Orders: ${counts[4]}`);
    console.log(`Default password for all seeded users: ${DEFAULT_PASSWORD}`);
    console.log(
      `Retailer accounts: ${retailerDocs.map((retailer) => retailer.email).join(", ")}`,
    );
    console.log(
      `Consumer accounts: ${consumerDocs.map((consumer) => consumer.email).join(", ")}`,
    );
  } catch (error) {
    console.error("Seed failed.");
    console.error(error);
    process.exitCode = 1;
  } finally {
    await mongoose.connection.close();
  }
}

runSeed();
