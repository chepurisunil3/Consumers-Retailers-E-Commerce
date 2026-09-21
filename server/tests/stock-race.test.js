const request = require("supertest");
const app = require("../app");
const { connect, closeDatabase, clearDatabase } = require("./setup");
const { createRetailer, createCategory, createProduct, createConsumer } = require("./helpers");

beforeAll(connect);
afterEach(clearDatabase);
afterAll(closeDatabase);

describe("stock reservation race condition", () => {
  it("only lets one of two concurrent orders succeed when inventory is 1", async () => {
    const { token: retailerToken } = await createRetailer();
    const category = await createCategory(retailerToken);
    const product = await createProduct(retailerToken, category.id, { inventory: 1 });

    const buyerA = await createConsumer();
    const buyerB = await createConsumer();

    const orderPayload = {
      items: [{ productId: product.id, quantity: 1 }],
      shippingAddress: { line1: "1 Test St", city: "Pune", state: "MH", postalCode: "411001" },
    };

    const [resA, resB] = await Promise.all([
      request(app)
        .post("/api/orders")
        .set("Authorization", `Bearer ${buyerA.token}`)
        .send(orderPayload),
      request(app)
        .post("/api/orders")
        .set("Authorization", `Bearer ${buyerB.token}`)
        .send(orderPayload),
    ]);

    const statuses = [resA.status, resB.status].sort();
    expect(statuses).toEqual([201, 409]);

    const productsRes = await request(app)
      .get("/api/retailers/products")
      .set("Authorization", `Bearer ${retailerToken}`);
    const updatedProduct = productsRes.body.data.find((p) => p.id === product.id);
    expect(updatedProduct.inventory).toBe(0);
  });
});
