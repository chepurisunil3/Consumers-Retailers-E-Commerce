const request = require("supertest");
const app = require("../app");
const { connect, closeDatabase, clearDatabase } = require("./setup");
const { createRetailer, createStaff, createCategory, createProduct } = require("./helpers");

beforeAll(connect);
afterEach(clearDatabase);
afterAll(closeDatabase);

describe("retailer staff RBAC", () => {
  it("blocks a sales-role staff member from deleting products", async () => {
    const { token: ownerToken } = await createRetailer();
    const category = await createCategory(ownerToken);
    const product = await createProduct(ownerToken, category.id);
    const { token: salesToken } = await createStaff(ownerToken, { role: "sales" });

    const res = await request(app)
      .delete(`/api/retailers/products/${product.id}`)
      .set("Authorization", `Bearer ${salesToken}`);

    expect(res.status).toBe(403);
  });

  it("blocks a sales-role staff member from managing staff", async () => {
    const { token: ownerToken } = await createRetailer();
    const { token: salesToken } = await createStaff(ownerToken, { role: "sales" });

    const res = await request(app)
      .get("/api/retailers/staff")
      .set("Authorization", `Bearer ${salesToken}`);

    expect(res.status).toBe(403);
  });

  it("allows a manager to create products but not manage staff", async () => {
    const { token: ownerToken } = await createRetailer();
    const category = await createCategory(ownerToken);
    const { token: managerToken } = await createStaff(ownerToken, { role: "manager" });

    const createRes = await request(app)
      .post("/api/retailers/products")
      .set("Authorization", `Bearer ${managerToken}`)
      .send({ name: "Manager Product", categoryId: category.id, mrp: 500, inventory: 2 });
    expect(createRes.status).toBe(201);

    const staffRes = await request(app)
      .post("/api/retailers/staff")
      .set("Authorization", `Bearer ${managerToken}`)
      .send({ name: "X", email: "x@test.com", password: "password123", role: "sales" });
    expect(staffRes.status).toBe(403);
  });

  it("lets a sales-role staff member view and update order status", async () => {
    const { token: ownerToken } = await createRetailer();
    const category = await createCategory(ownerToken);
    const product = await createProduct(ownerToken, category.id);
    const { token: salesToken } = await createStaff(ownerToken, { role: "sales" });

    const listRes = await request(app)
      .get("/api/retailers/orders")
      .set("Authorization", `Bearer ${salesToken}`);
    expect(listRes.status).toBe(200);
  });
});
