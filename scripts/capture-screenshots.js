const fs = require("fs/promises");
const path = require("path");
const { chromium } = require("playwright");

const ROOT = path.resolve(__dirname, "..");
const SCREENSHOTS_DIR = path.join(ROOT, "Screenshots");
const CONSUMER_DIR = path.join(SCREENSHOTS_DIR, "consumers");
const RETAILER_DIR = path.join(SCREENSHOTS_DIR, "retailers");
const PORT_CANDIDATES = [
  3010, 3011, 3007, 3008, 3004, 3005, 3000, 3001, 3002, 3003,
];

const consumerCredentials = {
  email: "olivia.parker@example.com",
  password: "Password123",
};

const retailerCredentials = {
  email: "owner@techhaven.com",
  password: "Password123",
};

async function ensureDirectories() {
  await Promise.all([
    fs.mkdir(CONSUMER_DIR, { recursive: true }),
    fs.mkdir(RETAILER_DIR, { recursive: true }),
  ]);
}

async function detectAppUrl(browser, matcher) {
  for (const port of PORT_CANDIDATES) {
    const page = await browser.newPage();
    try {
      await page.goto(`http://localhost:${port}`, {
        waitUntil: "domcontentloaded",
        timeout: 15000,
      });
      await page.waitForTimeout(1500);
      const text = await page
        .locator("body")
        .innerText()
        .catch(() => "");
      if (matcher(text)) {
        await page.close();
        return `http://localhost:${port}`;
      }
    } catch (error) {
      // Ignore unreachable ports and continue searching.
    }
    await page.close();
  }

  throw new Error("Unable to detect the requested application URL.");
}

async function saveFullPage(page, filePath) {
  await page.screenshot({ path: filePath, fullPage: true });
}

async function captureConsumerScreenshots(browser, consumerUrl) {
  const context = await browser.newContext({
    viewport: { width: 1440, height: 2200 },
  });
  const page = await context.newPage();

  await page.goto(consumerUrl, { waitUntil: "networkidle", timeout: 30000 });
  await page.waitForSelector(
    "text=Discover curated products from live retailer catalogs.",
  );
  await saveFullPage(page, path.join(CONSUMER_DIR, "01-dashboard-guest.png"));

  await page.getByRole("button", { name: "Login / Register" }).click();
  await page.getByRole("heading", { name: "Login" }).waitFor();
  await saveFullPage(page, path.join(CONSUMER_DIR, "02-login-modal.png"));

  await page.getByRole("button", { name: /^Register$/ }).click();
  await page.getByRole("heading", { name: "Register" }).waitFor();
  await saveFullPage(page, path.join(CONSUMER_DIR, "03-register-modal.png"));

  await page.getByRole("button", { name: /^Login$/ }).click();
  await page
    .getByPlaceholder("jamie@example.com")
    .fill(consumerCredentials.email);
  await page
    .getByPlaceholder("At least 6 characters")
    .fill(consumerCredentials.password);
  await page.getByRole("button", { name: "Login and continue" }).click();
  await page
    .getByRole("button", { name: "Account" })
    .waitFor({ timeout: 30000 });
  await page.waitForTimeout(2000);
  await saveFullPage(
    page,
    path.join(CONSUMER_DIR, "04-dashboard-authenticated.png"),
  );

  await page.getByRole("button", { name: "Add to cart" }).first().click();
  await page.waitForTimeout(1200);
  await saveFullPage(page, path.join(CONSUMER_DIR, "05-cart-with-product.png"));

  await page.getByRole("button", { name: "Account" }).click();
  await page.locator(".account-dropdown").waitFor({ timeout: 10000 });
  await saveFullPage(page, path.join(CONSUMER_DIR, "06-account-dropdown.png"));

  await page.getByRole("button", { name: "Update account" }).click();
  await page.getByRole("heading", { name: "Update account details" }).waitFor();
  await saveFullPage(page, path.join(CONSUMER_DIR, "07-account-modal.png"));

  await page.getByRole("button", { name: "Close" }).click();
  await page.locator(".orders-panel").scrollIntoViewIfNeeded();
  await page.waitForTimeout(800);
  await page.locator(".orders-panel").screenshot({
    path: path.join(CONSUMER_DIR, "08-recent-orders-section.png"),
  });

  await context.close();
}

async function captureRetailerScreenshots(browser, retailerUrl) {
  const context = await browser.newContext({
    viewport: { width: 1440, height: 2200 },
  });
  const page = await context.newPage();

  await page.goto(retailerUrl, { waitUntil: "networkidle", timeout: 30000 });
  await page
    .getByRole("heading", {
      name: /Login to retailer studio|Register your store/,
    })
    .waitFor();
  await saveFullPage(page, path.join(RETAILER_DIR, "01-login-page.png"));

  await page.getByRole("button", { name: /^Register$/ }).click();
  await page.getByRole("heading", { name: "Register your store" }).waitFor();
  await saveFullPage(page, path.join(RETAILER_DIR, "02-register-page.png"));

  await page.getByRole("button", { name: /^Login$/ }).click();
  await page
    .getByPlaceholder("store@brand.com")
    .fill(retailerCredentials.email);
  await page
    .getByPlaceholder("Enter password")
    .fill(retailerCredentials.password);
  await page.getByRole("button", { name: "Open retailer dashboard" }).click();
  await page
    .getByRole("heading", { name: "Tech Haven" })
    .waitFor({ timeout: 30000 });
  await page.waitForTimeout(2000);
  await saveFullPage(
    page,
    path.join(RETAILER_DIR, "03-dashboard-overview.png"),
  );

  await page.locator(".two-column-grid").first().scrollIntoViewIfNeeded();
  await page.waitForTimeout(800);
  await page
    .locator(".two-column-grid")
    .first()
    .screenshot({
      path: path.join(RETAILER_DIR, "04-catalog-management.png"),
    });

  await page.locator(".lower-grid").scrollIntoViewIfNeeded();
  await page.waitForTimeout(800);
  await page.locator(".lower-grid").screenshot({
    path: path.join(RETAILER_DIR, "05-recent-activity.png"),
  });

  await context.close();
}

async function main() {
  await ensureDirectories();
  const browser = await chromium.launch({ headless: true });

  try {
    const consumerUrl = await detectAppUrl(
      browser,
      (text) =>
        text.includes(
          "Discover curated products from live retailer catalogs",
        ) &&
        text.includes("Your cart") &&
        text.includes("Login / Register"),
    );

    const retailerUrl = await detectAppUrl(
      browser,
      (text) =>
        text.includes("Login to retailer studio") ||
        text.includes("Register your store") ||
        text.includes("Launch a polished catalog"),
    );

    await captureConsumerScreenshots(browser, consumerUrl);
    await captureRetailerScreenshots(browser, retailerUrl);

    console.log(JSON.stringify({ consumerUrl, retailerUrl }, null, 2));
  } finally {
    await browser.close();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
