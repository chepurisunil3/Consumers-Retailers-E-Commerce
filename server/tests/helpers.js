const request = require("supertest");
const app = require("../app");

let retailerCounter = 0;
let consumerCounter = 0;

const createRetailer = async (overrides = {}) => {
  retailerCounter += 1;
  const payload = {
    companyName: `Test Retailer ${retailerCounter}`,
    contactName: "Owner",
    email: `retailer${retailerCounter}@test.com`,
    password: "password123",
    industry: "electronics",
    gstNumber: "29ABCDE1234F1Z5",
    panNumber: "ABCDE1234F",
    ...overrides,
  };
  const res = await request(app).post("/api/retailers/auth/register").send(payload);
  return { token: res.body.token, retailer: res.body.data };
};

const createStaff = async (ownerToken, overrides = {}) => {
  const payload = {
    name: "Staff Member",
    email: `staff${Date.now()}${Math.random()}@test.com`,
    password: "password123",
    role: "sales",
    ...overrides,
  };
  const res = await request(app)
    .post("/api/retailers/staff")
    .set("Authorization", `Bearer ${ownerToken}`)
    .send(payload);

  const loginRes = await request(app)
    .post("/api/retailers/staff/login")
    .send({ email: payload.email, password: payload.password });

  return { token: loginRes.body.token, staff: res.body.data };
};

const createCategory = async (token, overrides = {}) => {
  const res = await request(app)
    .post("/api/retailers/categories")
    .set("Authorization", `Bearer ${token}`)
    .send({ name: "Phones", ...overrides });
  return res.body.data;
};

const createProduct = async (token, categoryId, overrides = {}) => {
  const res = await request(app)
    .post("/api/retailers/products")
    .set("Authorization", `Bearer ${token}`)
    .send({
      name: "Test Product",
      categoryId,
      mrp: 1000,
      discountPercent: 10,
      inventory: 5,
      ...overrides,
    });
  return res.body.data;
};

const createConsumer = async (overrides = {}) => {
  consumerCounter += 1;
  const payload = {
    name: `Consumer ${consumerCounter}`,
    email: `consumer${consumerCounter}@test.com`,
    password: "password123",
    ...overrides,
  };
  const res = await request(app).post("/api/consumers/auth/register").send(payload);
  return { token: res.body.token, consumer: res.body.data };
};

module.exports = { createRetailer, createStaff, createCategory, createProduct, createConsumer };
