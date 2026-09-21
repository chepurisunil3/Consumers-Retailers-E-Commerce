const request = require("supertest");
const app = require("../app");
const { connect, closeDatabase, clearDatabase } = require("./setup");
const { createRetailer, createCategory, createProduct, createConsumer } = require("./helpers");

beforeAll(connect);
afterEach(clearDatabase);
afterAll(closeDatabase);

const placeOrder = async (buyerToken, productId) => {
  const res = await request(app)
    .post("/api/orders")
    .set("Authorization", `Bearer ${buyerToken}`)
    .send({
      items: [{ productId, quantity: 1 }],
      shippingAddress: { line1: "1 Test St", city: "Pune", state: "MH", postalCode: "411001" },
    });
  return res.body.data;
};

describe("order status lifecycle", () => {
  it("walks pending -> accepted -> dispatched -> out_for_delivery -> delivered and rolls up order status", async () => {
    const { token: retailerToken } = await createRetailer();
    const category = await createCategory(retailerToken);
    const product = await createProduct(retailerToken, category.id, { inventory: 3 });
    const { token: buyerToken } = await createConsumer();

    const order = await placeOrder(buyerToken, product.id);
    expect(order.status).toBe("pending");
    const itemId = order.items[0].id;

    const transitions = ["accepted", "dispatched", "out_for_delivery", "delivered"];
    let lastRes;
    for (const status of transitions) {
      lastRes = await request(app)
        .patch(`/api/retailers/orders/${order.id}/items/${itemId}/status`)
        .set("Authorization", `Bearer ${retailerToken}`)
        .send({ status });
      expect(lastRes.status).toBe(200);
    }

    expect(lastRes.body.data.status).toBe("delivered");
    expect(lastRes.body.data.items[0].statusHistory).toHaveLength(5); // pending + 4 transitions
  });

  it("rejects an invalid transition (pending -> delivered)", async () => {
    const { token: retailerToken } = await createRetailer();
    const category = await createCategory(retailerToken);
    const product = await createProduct(retailerToken, category.id);
    const { token: buyerToken } = await createConsumer();

    const order = await placeOrder(buyerToken, product.id);
    const res = await request(app)
      .patch(`/api/retailers/orders/${order.id}/items/${order.items[0].id}/status`)
      .set("Authorization", `Bearer ${retailerToken}`)
      .send({ status: "delivered" });

    expect(res.status).toBe(400);
  });

  it("restores inventory when a retailer declines an item", async () => {
    const { token: retailerToken } = await createRetailer();
    const category = await createCategory(retailerToken);
    const product = await createProduct(retailerToken, category.id, { inventory: 5 });
    const { token: buyerToken } = await createConsumer();

    const order = await placeOrder(buyerToken, product.id);

    await request(app)
      .patch(`/api/retailers/orders/${order.id}/items/${order.items[0].id}/status`)
      .set("Authorization", `Bearer ${retailerToken}`)
      .send({ status: "declined" });

    const productsRes = await request(app)
      .get("/api/retailers/products")
      .set("Authorization", `Bearer ${retailerToken}`);
    expect(productsRes.body.data[0].inventory).toBe(5);
  });

  it("lets a consumer cancel a pending item and restores stock", async () => {
    const { token: retailerToken } = await createRetailer();
    const category = await createCategory(retailerToken);
    const product = await createProduct(retailerToken, category.id, { inventory: 2 });
    const { token: buyerToken } = await createConsumer();

    const order = await placeOrder(buyerToken, product.id);
    const cancelRes = await request(app)
      .post(`/api/orders/${order.id}/items/${order.items[0].id}/cancel`)
      .set("Authorization", `Bearer ${buyerToken}`)
      .send();

    expect(cancelRes.status).toBe(200);
    expect(cancelRes.body.data.status).toBe("cancelled");

    const productsRes = await request(app)
      .get("/api/retailers/products")
      .set("Authorization", `Bearer ${retailerToken}`);
    expect(productsRes.body.data[0].inventory).toBe(2);
  });
});
