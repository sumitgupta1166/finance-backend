const request = require("supertest");
const app = require("../src/app");
const db = require("./setup");

let adminToken;
let viewerToken;
let transactionId;

beforeAll(async () => {
  await db.connect();

  // Create admin user
  await request(app).post("/api/auth/register").send({
    name: "Admin User",
    email: "admin_tx@test.com",
    password: "password123",
    role: "admin",
  });
  const adminLogin = await request(app).post("/api/auth/login").send({
    email: "admin_tx@test.com",
    password: "password123",
  });
  adminToken = adminLogin.body.token;

  // Create viewer user
  await request(app).post("/api/auth/register").send({
    name: "Viewer User",
    email: "viewer_tx@test.com",
    password: "password123",
    role: "viewer",
  });
  const viewerLogin = await request(app).post("/api/auth/login").send({
    email: "viewer_tx@test.com",
    password: "password123",
  });
  viewerToken = viewerLogin.body.token;
});

afterAll(async () => {
  await db.closeDatabase();
});

describe("Transactions API", () => {
  test("POST /api/transactions → admin can create transaction", async () => {
    const res = await request(app)
      .post("/api/transactions")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        amount: 5000,
        type: "income",
        category: "salary",
        date: "2024-01-15",
        notes: "January salary",
      });
    expect(res.statusCode).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.amount).toBe(5000);
    transactionId = res.body.data._id;
  });

  test("POST /api/transactions → viewer cannot create transaction", async () => {
    const res = await request(app)
      .post("/api/transactions")
      .set("Authorization", `Bearer ${viewerToken}`)
      .send({
        amount: 200,
        type: "expense",
        category: "food",
      });
    expect(res.statusCode).toBe(403);
    expect(res.body.success).toBe(false);
  });

  test("POST /api/transactions → should fail with invalid amount", async () => {
    const res = await request(app)
      .post("/api/transactions")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        amount: -100,
        type: "income",
        category: "salary",
      });
    expect(res.statusCode).toBe(422);
  });

  test("POST /api/transactions → should fail with invalid category", async () => {
    const res = await request(app)
      .post("/api/transactions")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        amount: 100,
        type: "income",
        category: "invalid_category",
      });
    expect(res.statusCode).toBe(422);
  });

  test("GET /api/transactions → viewer can list transactions", async () => {
    const res = await request(app)
      .get("/api/transactions")
      .set("Authorization", `Bearer ${viewerToken}`);
    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  test("GET /api/transactions → supports pagination", async () => {
    const res = await request(app)
      .get("/api/transactions?page=1&limit=5")
      .set("Authorization", `Bearer ${viewerToken}`);
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty("page", 1);
    expect(res.body).toHaveProperty("pages");
    expect(res.body).toHaveProperty("total");
  });

  test("GET /api/transactions → filter by type", async () => {
    const res = await request(app)
      .get("/api/transactions?type=income")
      .set("Authorization", `Bearer ${viewerToken}`);
    expect(res.statusCode).toBe(200);
    res.body.data.forEach((t) => expect(t.type).toBe("income"));
  });

  test("GET /api/transactions/:id → get single transaction", async () => {
    const res = await request(app)
      .get(`/api/transactions/${transactionId}`)
      .set("Authorization", `Bearer ${viewerToken}`);
    expect(res.statusCode).toBe(200);
    expect(res.body.data._id).toBe(transactionId);
  });

  test("GET /api/transactions/:id → returns 404 for invalid id", async () => {
    const res = await request(app)
      .get("/api/transactions/000000000000000000000000")
      .set("Authorization", `Bearer ${adminToken}`);
    expect(res.statusCode).toBe(404);
  });

  test("PUT /api/transactions/:id → admin can update transaction", async () => {
    const res = await request(app)
      .put(`/api/transactions/${transactionId}`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        amount: 6000,
        type: "income",
        category: "salary",
        notes: "Updated salary",
      });
    expect(res.statusCode).toBe(200);
    expect(res.body.data.amount).toBe(6000);
  });

  test("PUT /api/transactions/:id → viewer cannot update transaction", async () => {
    const res = await request(app)
      .put(`/api/transactions/${transactionId}`)
      .set("Authorization", `Bearer ${viewerToken}`)
      .send({ amount: 100, type: "income", category: "salary" });
    expect(res.statusCode).toBe(403);
  });

  test("DELETE /api/transactions/:id → admin can soft delete", async () => {
    const res = await request(app)
      .delete(`/api/transactions/${transactionId}`)
      .set("Authorization", `Bearer ${adminToken}`);
    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
  });

  test("GET /api/transactions/:id → deleted transaction not found", async () => {
    const res = await request(app)
      .get(`/api/transactions/${transactionId}`)
      .set("Authorization", `Bearer ${adminToken}`);
    expect(res.statusCode).toBe(404);
  });

  test("DELETE /api/transactions/:id → viewer cannot delete", async () => {
    const res = await request(app)
      .delete(`/api/transactions/${transactionId}`)
      .set("Authorization", `Bearer ${viewerToken}`);
    expect(res.statusCode).toBe(403);
  });
});
