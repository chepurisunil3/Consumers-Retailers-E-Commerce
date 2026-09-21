const request = require("supertest");
const app = require("../app");
const { connect, closeDatabase, clearDatabase } = require("./setup");

beforeAll(connect);
afterEach(clearDatabase);
afterAll(closeDatabase);

const validRetailer = {
  companyName: "Sunny Electronics",
  contactName: "Sunny",
  email: "sunny@retailer.test",
  password: "password123",
  industry: "electronics",
  gstNumber: "29ABCDE1234F1Z5",
  panNumber: "ABCDE1234F",
};

describe("retailer auth", () => {
  it("rejects registration missing GST/PAN/industry", async () => {
    const res = await request(app)
      .post("/api/retailers/auth/register")
      .send({ ...validRetailer, gstNumber: "", panNumber: "" });
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it("registers and logs in a retailer, issuing owner-scoped claims", async () => {
    const registerRes = await request(app)
      .post("/api/retailers/auth/register")
      .send(validRetailer);
    expect(registerRes.status).toBe(201);
    expect(registerRes.body.token).toBeDefined();
    expect(registerRes.body.data.industry).toBe("electronics");

    const loginRes = await request(app)
      .post("/api/retailers/auth/login")
      .send({ email: validRetailer.email, password: validRetailer.password });
    expect(loginRes.status).toBe(200);

    const meRes = await request(app)
      .get("/api/retailers/auth/me")
      .set("Authorization", `Bearer ${loginRes.body.token}`);
    expect(meRes.status).toBe(200);
    expect(meRes.body.data.staffRole).toBe("owner");
  });

  it("rejects an invalid GSTIN format", async () => {
    const res = await request(app)
      .post("/api/retailers/auth/register")
      .send({ ...validRetailer, email: "other@retailer.test", gstNumber: "not-a-gstin" });
    expect(res.status).toBe(400);
  });
});

describe("consumer auth", () => {
  const validConsumer = {
    name: "Bob Buyer",
    email: "bob@consumer.test",
    password: "password123",
  };

  it("registers and logs in a consumer", async () => {
    const registerRes = await request(app)
      .post("/api/consumers/auth/register")
      .send(validConsumer);
    expect(registerRes.status).toBe(201);

    const loginRes = await request(app)
      .post("/api/consumers/auth/login")
      .send({ email: validConsumer.email, password: validConsumer.password });
    expect(loginRes.status).toBe(200);
    expect(loginRes.body.token).toBeDefined();
  });

  it("rejects a wrong password", async () => {
    await request(app).post("/api/consumers/auth/register").send(validConsumer);
    const res = await request(app)
      .post("/api/consumers/auth/login")
      .send({ email: validConsumer.email, password: "wrongpass" });
    expect(res.status).toBe(401);
  });
});
