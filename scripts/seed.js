const bcrypt = require("bcrypt");
const mongoose = require("mongoose");
const connectToMongoDB = require("../config/mongo-connection");
const Retailer = require("../server/models/retailers/retailers");
const RetailerStaff = require("../server/models/retailers/retailer-staff");
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

// ---- Retailers: one per industry, India-market fields ----------------------
const retailerSeed = [
  {
    companyName: "TechBazaar India",
    contactName: "Rohan Mehta",
    email: "owner@techbazaar.in",
    contactNumber: "+91 98200 11223",
    industry: "electronics",
    gstNumber: "27AABCT1234C1Z5",
    panNumber: "AABCT1234C",
    companyLogo:
      "https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=400&q=80",
    address: {
      line1: "241 Andheri Industrial Estate",
      city: "Mumbai",
      state: "Maharashtra",
      country: "India",
      postalCode: "400053",
    },
    bankDetails: {
      accountHolderName: "TechBazaar India Pvt Ltd",
      accountNumber: "50100123456789",
      ifscCode: "HDFC0001234",
      bankName: "HDFC Bank",
    },
    onboardingStatus: "verified",
    staff: [
      { name: "Priya Nair", role: "manager" },
      { name: "Karan Shah", role: "sales" },
    ],
    categories: [
      { name: "Audio", description: "Headphones, earbuds and speakers." },
      { name: "Mobile Accessories", description: "Chargers, cases and cables." },
    ],
    products: [
      {
        categoryName: "Audio",
        name: "Nova Wireless ANC Headphones",
        description:
          "Over-ear headphones with active noise cancellation and 30-hour battery life.",
        imageUrl:
          "https://images.unsplash.com/photo-1546435770-a3e426bf472b?auto=format&fit=crop&w=900&q=80",
        sku: "TH-AUD-001",
        mrp: 6999,
        discountPercent: 25,
        inventory: 22,
        isFeatured: true,
        tags: ["wireless", "noise-cancelling", "audio"],
        attributes: { brand: "Nova", warranty: "1 Year", color: "Matte Black" },
      },
      {
        categoryName: "Mobile Accessories",
        name: "Orbit 20W MagSafe Power Bank",
        description: "Compact magnetic power bank for everyday travel.",
        imageUrl:
          "https://images.unsplash.com/photo-1585338447937-7082f8fc763d?auto=format&fit=crop&w=900&q=80",
        sku: "TH-ACC-002",
        mrp: 2499,
        discountPercent: 15,
        inventory: 48,
        isFeatured: false,
        tags: ["charger", "mobile", "travel"],
        attributes: { brand: "Orbit", capacity: "10000mAh", warranty: "6 Months" },
      },
      {
        categoryName: "Mobile Accessories",
        name: "Aura Mechanical Keyboard",
        description: "Low-profile keyboard with tactile switches and RGB underglow.",
        imageUrl:
          "https://images.unsplash.com/photo-1511467687858-23d96c32e4ae?auto=format&fit=crop&w=900&q=80",
        sku: "TH-ACC-003",
        mrp: 4999,
        discountPercent: 10,
        inventory: 12,
        isFeatured: true,
        tags: ["keyboard", "desk-setup", "gaming"],
        attributes: { brand: "Aura", switchType: "Blue", warranty: "1 Year" },
      },
    ],
  },
  {
    companyName: "Desi Threads",
    contactName: "Ananya Kapoor",
    email: "hello@desithreads.in",
    contactNumber: "+91 98100 44556",
    industry: "fashion",
    gstNumber: "07AABCD5678D1Z2",
    panNumber: "AABCD5678D",
    companyLogo:
      "https://images.unsplash.com/photo-1529139574466-a303027c1d8b?auto=format&fit=crop&w=400&q=80",
    address: {
      line1: "52 Karol Bagh Market",
      city: "New Delhi",
      state: "Delhi",
      country: "India",
      postalCode: "110005",
    },
    bankDetails: {
      accountHolderName: "Desi Threads",
      accountNumber: "00461234567890",
      ifscCode: "ICIC0002345",
      bankName: "ICICI Bank",
    },
    onboardingStatus: "verified",
    staff: [{ name: "Vikram Rao", role: "manager" }],
    categories: [
      { name: "Outerwear", description: "Jackets for city travel and weekend wear." },
      { name: "Footwear", description: "Fashion sneakers built for all-day comfort." },
    ],
    products: [
      {
        categoryName: "Outerwear",
        name: "Metro Utility Jacket",
        description: "Water-resistant jacket with lightweight insulation.",
        imageUrl:
          "https://images.unsplash.com/photo-1541099649105-f69ad21f3246?auto=format&fit=crop&w=900&q=80",
        sku: "UT-OUT-001",
        mrp: 3499,
        discountPercent: 30,
        inventory: 18,
        isFeatured: true,
        tags: ["jacket", "streetwear", "utility"],
        attributes: { size: "M/L/XL", material: "Polyester", fit: "Regular" },
      },
      {
        categoryName: "Footwear",
        name: "Pulse Street Sneakers",
        description: "Minimal sneakers with cushioned soles and breathable knit upper.",
        imageUrl:
          "https://images.unsplash.com/photo-1543508282-6319a3e2621f?auto=format&fit=crop&w=900&q=80",
        sku: "UT-FTW-002",
        mrp: 2999,
        discountPercent: 20,
        inventory: 30,
        isFeatured: true,
        tags: ["sneakers", "fashion", "casual"],
        attributes: { size: "6-11 UK", material: "Knit", color: "White" },
      },
      {
        categoryName: "Outerwear",
        name: "Cloud Fleece Overshirt",
        description: "Soft fleece overshirt ideal for layering in transitional weather.",
        imageUrl:
          "https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&w=900&q=80",
        sku: "UT-OUT-003",
        mrp: 1999,
        discountPercent: 10,
        inventory: 26,
        isFeatured: false,
        tags: ["fleece", "overshirt", "layering"],
        attributes: { size: "S/M/L", material: "Fleece" },
      },
    ],
  },
  {
    companyName: "FreshMart Grocers",
    contactName: "Deepa Iyer",
    email: "support@freshmart.in",
    contactNumber: "+91 98450 77889",
    industry: "grocery",
    gstNumber: "29AABCF9012F1Z8",
    panNumber: "AABCF9012F",
    companyLogo:
      "https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=400&q=80",
    address: {
      line1: "18 Indiranagar 100ft Road",
      city: "Bengaluru",
      state: "Karnataka",
      country: "India",
      postalCode: "560038",
    },
    bankDetails: {
      accountHolderName: "FreshMart Grocers",
      accountNumber: "62345678901",
      ifscCode: "SBIN0003456",
      bankName: "State Bank of India",
    },
    onboardingStatus: "verified",
    staff: [
      { name: "Meena Pillai", role: "manager" },
      { name: "Arjun Das", role: "sales" },
    ],
    categories: [
      { name: "Staples", description: "Rice, atta, pulses and cooking essentials." },
      { name: "Snacks & Beverages", description: "Packaged snacks, tea and beverages." },
    ],
    products: [
      {
        categoryName: "Staples",
        name: "India Gate Basmati Rice 5kg",
        description: "Premium aged basmati rice, extra-long grain.",
        imageUrl:
          "https://images.unsplash.com/photo-1586201375761-83865001e31c?auto=format&fit=crop&w=900&q=80",
        sku: "FM-STP-001",
        mrp: 699,
        discountPercent: 12,
        inventory: 60,
        isFeatured: true,
        tags: ["rice", "staples", "grocery"],
        attributes: { weight: "5kg", brand: "India Gate", perishable: "No" },
      },
      {
        categoryName: "Staples",
        name: "Fortune Sunflower Oil 1L",
        description: "Light and healthy refined sunflower oil.",
        imageUrl:
          "https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?auto=format&fit=crop&w=900&q=80",
        sku: "FM-STP-002",
        mrp: 199,
        discountPercent: 5,
        inventory: 80,
        isFeatured: false,
        tags: ["oil", "cooking", "grocery"],
        attributes: { weight: "1L", brand: "Fortune", perishable: "No" },
      },
      {
        categoryName: "Snacks & Beverages",
        name: "Tata Tea Gold 1kg",
        description: "Rich and aromatic blend of the finest tea leaves.",
        imageUrl:
          "https://images.unsplash.com/photo-1564890369478-c89ca6d9cde9?auto=format&fit=crop&w=900&q=80",
        sku: "FM-SNK-003",
        mrp: 549,
        discountPercent: 8,
        inventory: 45,
        isFeatured: true,
        tags: ["tea", "beverages", "grocery"],
        attributes: { weight: "1kg", brand: "Tata", perishable: "No" },
      },
    ],
  },
  {
    companyName: "MediCare Pharmacy",
    contactName: "Dr. Sanjay Kulkarni",
    email: "care@medicarepharmacy.in",
    contactNumber: "+91 98220 99001",
    industry: "pharmacy",
    gstNumber: "27AABCM3456M1Z1",
    panNumber: "AABCM3456M",
    companyLogo:
      "https://images.unsplash.com/photo-1587854692152-cbe660dbde88?auto=format&fit=crop&w=400&q=80",
    address: {
      line1: "78 FC Road",
      city: "Pune",
      state: "Maharashtra",
      country: "India",
      postalCode: "411005",
    },
    bankDetails: {
      accountHolderName: "MediCare Pharmacy",
      accountNumber: "91023456789012",
      ifscCode: "AXIS0004567",
      bankName: "Axis Bank",
    },
    onboardingStatus: "pending",
    staff: [{ name: "Neha Joshi", role: "sales" }],
    categories: [
      { name: "Wellness", description: "Vitamins, supplements and personal care." },
      { name: "Devices", description: "Home healthcare monitoring devices." },
    ],
    products: [
      {
        categoryName: "Wellness",
        name: "Multivitamin Effervescent Tablets (20s)",
        description: "Daily multivitamin with Vitamin C, D3 and Zinc.",
        imageUrl:
          "https://images.unsplash.com/photo-1550572017-edd951b55104?auto=format&fit=crop&w=900&q=80",
        sku: "MC-WEL-001",
        mrp: 399,
        discountPercent: 18,
        inventory: 70,
        isFeatured: true,
        tags: ["wellness", "vitamins", "immunity"],
        attributes: { prescriptionRequired: "No", pack: "20 tablets" },
      },
      {
        categoryName: "Devices",
        name: "Digital Blood Pressure Monitor",
        description: "Automatic upper-arm BP monitor with large LCD display.",
        imageUrl:
          "https://images.unsplash.com/photo-1579154204601-01588f351e67?auto=format&fit=crop&w=900&q=80",
        sku: "MC-DEV-002",
        mrp: 1999,
        discountPercent: 22,
        inventory: 15,
        isFeatured: true,
        tags: ["healthcare", "devices", "bp-monitor"],
        attributes: { prescriptionRequired: "No", warranty: "2 Years" },
      },
    ],
  },
];

// ---- Consumers: Indian names, addresses, multiple saved addresses ---------
const consumerSeed = [
  {
    name: "Aditi Sharma",
    email: "aditi.sharma@example.com",
    mobileNumber: "+91 98765 43210",
    profilePhoto:
      "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=400&q=80",
    addresses: [
      {
        label: "Home",
        line1: "11 Riverwalk Lane, Koregaon Park",
        city: "Pune",
        state: "Maharashtra",
        postalCode: "411001",
        phone: "+91 98765 43210",
        isDefault: true,
      },
      {
        label: "Office",
        line1: "3rd Floor, Cybercity IT Park",
        city: "Pune",
        state: "Maharashtra",
        postalCode: "411014",
        phone: "+91 98765 43210",
        isDefault: false,
      },
    ],
  },
  {
    name: "Rahul Verma",
    email: "rahul.verma@example.com",
    mobileNumber: "+91 90000 11122",
    profilePhoto:
      "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=400&q=80",
    addresses: [
      {
        label: "Home",
        line1: "844 Marine Drive Apartments",
        city: "Mumbai",
        state: "Maharashtra",
        postalCode: "400020",
        phone: "+91 90000 11122",
        isDefault: true,
      },
    ],
  },
  {
    name: "Sneha Reddy",
    email: "sneha.reddy@example.com",
    mobileNumber: "+91 93000 22233",
    profilePhoto:
      "https://images.unsplash.com/photo-1488426862026-3ee34a7d66df?auto=format&fit=crop&w=400&q=80",
    addresses: [
      {
        label: "Home",
        line1: "92 Jubilee Hills Road No. 3",
        city: "Hyderabad",
        state: "Telangana",
        postalCode: "500033",
        phone: "+91 93000 22233",
        isDefault: true,
      },
    ],
  },
  {
    name: "Arjun Nair",
    email: "arjun.nair@example.com",
    mobileNumber: "+91 95000 33344",
    profilePhoto:
      "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=400&q=80",
    addresses: [
      {
        label: "Home",
        line1: "304 Garden Terrace, Indiranagar",
        city: "Bengaluru",
        state: "Karnataka",
        postalCode: "560038",
        phone: "+91 95000 33344",
        isDefault: true,
      },
    ],
  },
  {
    name: "Kavya Iyer",
    email: "kavya.iyer@example.com",
    mobileNumber: "+91 96000 44455",
    profilePhoto:
      "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=400&q=80",
    addresses: [
      {
        label: "Home",
        line1: "27 T Nagar Main Road",
        city: "Chennai",
        state: "Tamil Nadu",
        postalCode: "600017",
        phone: "+91 96000 44455",
        isDefault: true,
      },
    ],
  },
  {
    name: "Ishaan Gupta",
    email: "ishaan.gupta@example.com",
    mobileNumber: "+91 97000 55566",
    profilePhoto:
      "https://images.unsplash.com/photo-1633332755192-727a05c4013d?auto=format&fit=crop&w=400&q=80",
    addresses: [
      {
        label: "Home",
        line1: "15 Connaught Place",
        city: "New Delhi",
        state: "Delhi",
        postalCode: "110001",
        phone: "+91 97000 55566",
        isDefault: true,
      },
    ],
  },
];

// One blueprint per order. `itemStatuses` walks each line item through its
// full statusHistory so the seeded data covers every state the UI needs to
// render (pending, accepted, dispatched, delivered, cancelled, returned...).
const orderBlueprints = [
  {
    consumerEmail: "aditi.sharma@example.com",
    paymentMethod: "cod",
    items: [{ sku: "TH-AUD-001", quantity: 1, path: ["pending"] }],
  },
  {
    consumerEmail: "aditi.sharma@example.com",
    paymentMethod: "mock-online",
    items: [{ sku: "FM-STP-001", quantity: 2, path: ["pending", "accepted"] }],
  },
  {
    consumerEmail: "rahul.verma@example.com",
    paymentMethod: "cod",
    items: [
      { sku: "UT-FTW-002", quantity: 1, path: ["pending", "accepted", "dispatched"] },
    ],
  },
  {
    consumerEmail: "rahul.verma@example.com",
    paymentMethod: "mock-online",
    items: [
      {
        sku: "TH-ACC-003",
        quantity: 1,
        path: ["pending", "accepted", "dispatched", "out_for_delivery"],
      },
    ],
  },
  {
    consumerEmail: "sneha.reddy@example.com",
    paymentMethod: "cod",
    items: [
      {
        sku: "MC-WEL-001",
        quantity: 1,
        path: ["pending", "accepted", "dispatched", "out_for_delivery", "delivered"],
      },
    ],
  },
  {
    consumerEmail: "sneha.reddy@example.com",
    paymentMethod: "cod",
    items: [{ sku: "UT-OUT-001", quantity: 1, path: ["pending", "declined"] }],
  },
  {
    consumerEmail: "arjun.nair@example.com",
    paymentMethod: "cod",
    items: [{ sku: "TH-ACC-002", quantity: 1, path: ["pending", "cancelled"] }],
  },
  {
    consumerEmail: "arjun.nair@example.com",
    paymentMethod: "mock-online",
    items: [
      {
        sku: "MC-DEV-002",
        quantity: 1,
        path: [
          "pending",
          "accepted",
          "dispatched",
          "out_for_delivery",
          "delivered",
          "return_requested",
        ],
      },
    ],
  },
  {
    consumerEmail: "kavya.iyer@example.com",
    paymentMethod: "mock-online",
    items: [
      {
        sku: "FM-SNK-003",
        quantity: 3,
        path: [
          "pending",
          "accepted",
          "dispatched",
          "out_for_delivery",
          "delivered",
          "return_requested",
          "returned",
        ],
      },
    ],
  },
  {
    // A split-shipment order: one retailer's item is delivered while the
    // other retailer's item is still pending -> order rolls up to
    // "partially_fulfilled".
    consumerEmail: "ishaan.gupta@example.com",
    paymentMethod: "cod",
    items: [
      {
        sku: "UT-OUT-003",
        quantity: 1,
        path: ["pending", "accepted", "dispatched", "out_for_delivery", "delivered"],
      },
      { sku: "FM-STP-002", quantity: 2, path: ["pending"] },
    ],
  },
];

async function clearCollections() {
  await Promise.all([
    Order.deleteMany({}),
    Product.deleteMany({}),
    Category.deleteMany({}),
    Consumer.deleteMany({}),
    RetailerStaff.deleteMany({}),
    Retailer.deleteMany({}),
  ]);
}

async function createRetailersCategoriesProducts(passwordHash) {
  const retailerDocs = [];
  const staffDocs = [];
  const categoryMap = new Map();
  const productDocs = [];

  for (const retailerData of retailerSeed) {
    const retailer = await Retailer.create({
      companyName: retailerData.companyName,
      contactName: retailerData.contactName,
      email: retailerData.email,
      password: passwordHash,
      contactNumber: retailerData.contactNumber,
      industry: retailerData.industry,
      gstNumber: retailerData.gstNumber,
      panNumber: retailerData.panNumber,
      companyLogo: retailerData.companyLogo,
      address: retailerData.address,
      bankDetails: retailerData.bankDetails,
      onboardingStatus: retailerData.onboardingStatus,
    });
    retailerDocs.push(retailer);

    for (const staffData of retailerData.staff || []) {
      const email = `${slugify(staffData.name)}@${retailer.email.split("@")[1]}`;
      const staff = await RetailerStaff.create({
        retailer: retailer._id,
        name: staffData.name,
        email,
        password: passwordHash,
        role: staffData.role,
      });
      staffDocs.push(staff);
    }

    for (const categoryData of retailerData.categories) {
      const category = await Category.create({
        retailer: retailer._id,
        name: categoryData.name,
        slug: slugify(categoryData.name),
        description: categoryData.description,
        imageUrl: retailerData.companyLogo,
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
        mrp: productData.mrp,
        discountPercent: productData.discountPercent,
        inventory: productData.inventory,
        isFeatured: productData.isFeatured,
        isActive: true,
        tags: productData.tags,
        attributes: productData.attributes,
      });
      productDocs.push(product);
    }
  }

  return { retailerDocs, staffDocs, productDocs };
}

async function createConsumers(passwordHash) {
  const docs = [];
  for (const consumerData of consumerSeed) {
    const consumer = await Consumer.create({
      ...consumerData,
      password: passwordHash,
    });
    docs.push(consumer);
  }
  return docs;
}

async function createOrders(consumers, products) {
  const consumerMap = new Map(consumers.map((c) => [c.email, c]));
  const productMap = new Map(products.map((p) => [p.sku, p]));

  for (const blueprint of orderBlueprints) {
    const consumer = consumerMap.get(blueprint.consumerEmail);
    const orderItems = [];

    for (const itemSpec of blueprint.items) {
      const product = productMap.get(itemSpec.sku);
      const lineTotal = Number((product.finalPrice * itemSpec.quantity).toFixed(2));
      const finalStatus = itemSpec.path[itemSpec.path.length - 1];

      orderItems.push({
        product: product._id,
        retailer: product.retailer,
        category: product.category,
        name: product.name,
        imageUrl: product.imageUrl,
        quantity: itemSpec.quantity,
        unitPrice: product.finalPrice,
        lineTotal,
        status: finalStatus,
        statusHistory: itemSpec.path.map((status, index) => ({
          status,
          note: "",
          at: new Date(Date.now() - (itemSpec.path.length - index) * 86400000),
        })),
      });

      // Stock stays reserved unless the item ended in a state that frees it.
      if (!["declined", "cancelled", "returned"].includes(finalStatus)) {
        await Product.updateOne(
          { _id: product._id },
          { $inc: { inventory: -itemSpec.quantity } },
        );
      }
    }

    const subtotal = Number(
      orderItems.reduce((sum, item) => sum + item.lineTotal, 0).toFixed(2),
    );
    const shippingFee = subtotal > 1000 ? 0 : 49;
    const total = Number((subtotal + shippingFee).toFixed(2));

    const order = new Order({
      consumer: consumer._id,
      items: orderItems,
      paymentMethod: blueprint.paymentMethod,
      paymentStatus: orderItems.some((i) => i.status === "delivered")
        ? "paid"
        : blueprint.paymentMethod === "mock-online"
          ? "paid"
          : "pending",
      subtotal,
      shippingFee,
      total,
      shippingAddress: {
        label: consumer.addresses[0]?.label || "Home",
        line1: consumer.addresses[0]?.line1 || "",
        city: consumer.addresses[0]?.city || "",
        state: consumer.addresses[0]?.state || "",
        country: "India",
        postalCode: consumer.addresses[0]?.postalCode || "",
        phone: consumer.addresses[0]?.phone || "",
      },
    });

    order.recomputeStatus();
    await order.save();
  }
}

async function runSeed() {
  try {
    await connectToMongoDB();
    await clearCollections();

    const passwordHash = await bcrypt.hash(DEFAULT_PASSWORD, SALT_ROUNDS);
    const { retailerDocs, staffDocs, productDocs } =
      await createRetailersCategoriesProducts(passwordHash);
    const consumerDocs = await createConsumers(passwordHash);
    await createOrders(consumerDocs, productDocs);

    const counts = await Promise.all([
      Retailer.countDocuments(),
      RetailerStaff.countDocuments(),
      Category.countDocuments(),
      Product.countDocuments(),
      Consumer.countDocuments(),
      Order.countDocuments(),
    ]);

    console.log("Seed completed successfully.");
    console.log(`Retailers: ${counts[0]} | Staff: ${counts[1]} | Categories: ${counts[2]}`);
    console.log(`Products: ${counts[3]} | Consumers: ${counts[4]} | Orders: ${counts[5]}`);
    console.log(`\nDefault password for every seeded account: ${DEFAULT_PASSWORD}\n`);
    console.log("Retailer owner logins:");
    retailerDocs.forEach((r) => console.log(`  ${r.email}  (${r.industry})`));
    console.log("\nRetailer staff logins (use the Team Login):");
    staffDocs.forEach((s) => console.log(`  ${s.email}  (${s.role})`));
    console.log("\nConsumer logins:");
    consumerDocs.forEach((c) => console.log(`  ${c.email}`));
  } catch (error) {
    console.error("Seed failed.");
    console.error(error);
    process.exitCode = 1;
  } finally {
    await mongoose.connection.close();
  }
}

runSeed();
