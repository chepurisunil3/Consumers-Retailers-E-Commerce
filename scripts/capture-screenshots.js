const fs = require("fs/promises");
const path = require("path");
const { chromium } = require("playwright");

const ROOT = path.resolve(__dirname, "..");
const SCREENSHOTS_DIR = path.join(ROOT, "Screenshots");
const CONSUMER_DIR = path.join(SCREENSHOTS_DIR, "consumers");
const RETAILER_DIR = path.join(SCREENSHOTS_DIR, "retailers");

const RETAILERS_URL = process.env.RETAILERS_URL || "http://localhost:3000";
const CONSUMERS_URL = process.env.CONSUMERS_URL || "http://localhost:3002";

const retailerCredentials = { email: "owner@techbazaar.in", password: "Password123" };
const consumerCredentials = { email: "aditi.sharma@example.com", password: "Password123" };

const VIEWPORT = { width: 1440, height: 960 };

async function ensureDirectories() {
  await Promise.all([
    fs.mkdir(CONSUMER_DIR, { recursive: true }),
    fs.mkdir(RETAILER_DIR, { recursive: true }),
  ]);
}

async function shot(page, filePath) {
  await page.waitForTimeout(400);
  await page.screenshot({ path: filePath, fullPage: true });
}

async function captureRetailerScreenshots(browser) {
  const context = await browser.newContext({ viewport: VIEWPORT });
  const page = await context.newPage();

  await page.goto(RETAILERS_URL, { waitUntil: "networkidle", timeout: 30000 });
  await page.getByText("RetailHub Seller Console").first().waitFor();
  await shot(page, path.join(RETAILER_DIR, "01-landing-page.png"));

  await page.goto(`${RETAILERS_URL}/login`, { waitUntil: "networkidle" });
  await page.getByRole("heading", { name: "Sign in" }).waitFor();
  await shot(page, path.join(RETAILER_DIR, "02-login-page.png"));

  await page.goto(`${RETAILERS_URL}/register`, { waitUntil: "networkidle" });
  await page.locator(".auth-card h2").waitFor();
  await shot(page, path.join(RETAILER_DIR, "03-register-onboarding.png"));

  // Log in as the seeded retailer owner.
  await page.goto(`${RETAILERS_URL}/login`, { waitUntil: "networkidle" });
  await page.locator('input[type="email"]').fill(retailerCredentials.email);
  await page.locator('input[type="password"]').fill(retailerCredentials.password);
  await page.getByRole("button", { name: "Sign in" }).click();
  await page.getByText("Welcome back").waitFor({ timeout: 20000 });
  await shot(page, path.join(RETAILER_DIR, "04-dashboard-overview.png"));

  await page.goto(`${RETAILERS_URL}/dashboard/products`, { waitUntil: "networkidle" });
  // DashboardLayout's topbar <h1> repeats the page's own <h2> text, so scope
  // to the page-header to avoid an ambiguous (strict-mode) match.
  await page.locator(".page-header h2").waitFor();
  await shot(page, path.join(RETAILER_DIR, "05-products-list.png"));

  await page.getByRole("link", { name: "Edit" }).first().click();
  await page.locator(".page-header h2").waitFor();
  await shot(page, path.join(RETAILER_DIR, "06-product-edit-form.png"));

  await page.goto(`${RETAILERS_URL}/dashboard/orders`, { waitUntil: "networkidle" });
  await page.locator(".page-header h2").waitFor();
  await shot(page, path.join(RETAILER_DIR, "07-orders-list.png"));

  await page.getByRole("link", { name: "Manage" }).first().click();
  await page.getByText("Delivery address").waitFor();
  await shot(page, path.join(RETAILER_DIR, "08-order-detail.png"));

  await page.goto(`${RETAILERS_URL}/dashboard/staff`, { waitUntil: "networkidle" });
  await page.getByRole("heading", { name: "Team members" }).waitFor();
  await shot(page, path.join(RETAILER_DIR, "09-team-staff.png"));

  await page.goto(`${RETAILERS_URL}/dashboard/profile`, { waitUntil: "networkidle" });
  await page.locator(".page-header h2").waitFor();
  await shot(page, path.join(RETAILER_DIR, "10-business-profile.png"));

  await context.close();
}

async function captureConsumerScreenshots(browser) {
  const context = await browser.newContext({ viewport: VIEWPORT });
  const page = await context.newPage();

  await page.goto(CONSUMERS_URL, { waitUntil: "networkidle", timeout: 30000 });
  await page.getByText("Today's deals").waitFor({ timeout: 20000 });
  await shot(page, path.join(CONSUMER_DIR, "01-home-page.png"));

  await page.goto(`${CONSUMERS_URL}/products`, { waitUntil: "networkidle" });
  await page.getByRole("heading", { name: "All Products" }).waitFor();
  await shot(page, path.join(CONSUMER_DIR, "02-products-listing.png"));

  await page.locator(".product-card").first().click();
  await page.getByText("Sold by").waitFor({ timeout: 15000 });
  await shot(page, path.join(CONSUMER_DIR, "03-product-detail.png"));

  await page.getByRole("button", { name: "Add to cart" }).click();
  await page.waitForTimeout(300);
  await page.goto(`${CONSUMERS_URL}/cart`, { waitUntil: "networkidle" });
  await page.getByRole("heading", { name: "Your cart" }).waitFor();
  await shot(page, path.join(CONSUMER_DIR, "04-cart-with-item.png"));

  // "Proceed to checkout" while signed out routes through /login.
  await page.getByRole("button", { name: "Proceed to checkout" }).click();
  await page.getByRole("heading", { name: "Sign in" }).waitFor();
  await shot(page, path.join(CONSUMER_DIR, "05-login-page.png"));

  await page.locator('input[type="email"]').fill(consumerCredentials.email);
  await page.locator('input[type="password"]').fill(consumerCredentials.password);
  await page.getByRole("button", { name: "Sign in" }).click();
  await page.getByRole("heading", { name: "Checkout" }).waitFor({ timeout: 20000 });
  await shot(page, path.join(CONSUMER_DIR, "06-checkout.png"));

  await page.goto(`${CONSUMERS_URL}/orders`, { waitUntil: "networkidle" });
  await page.getByRole("heading", { name: "Your orders" }).waitFor();
  await shot(page, path.join(CONSUMER_DIR, "07-orders-list.png"));

  await page.locator(".card").first().click();
  await page.getByText("Delivery address").waitFor({ timeout: 15000 });
  await shot(page, path.join(CONSUMER_DIR, "08-order-tracking.png"));

  await page.goto(`${CONSUMERS_URL}/addresses`, { waitUntil: "networkidle" });
  await page.getByRole("heading", { name: "Your addresses" }).waitFor();
  await shot(page, path.join(CONSUMER_DIR, "09-addresses.png"));

  await page.goto(`${CONSUMERS_URL}/profile`, { waitUntil: "networkidle" });
  await page.getByRole("heading", { name: "Your profile" }).waitFor();
  await shot(page, path.join(CONSUMER_DIR, "10-profile.png"));

  await context.close();
}

async function main() {
  await ensureDirectories();
  const browser = await chromium.launch({ headless: true });

  try {
    await captureRetailerScreenshots(browser);
    await captureConsumerScreenshots(browser);
    console.log("Screenshots captured successfully.");
  } finally {
    await browser.close();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
