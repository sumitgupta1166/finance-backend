const request = require("supertest");
const app = require("../src/app");
const db = require("./setup");

let adminToken;
let analystToken;
let viewerToken;

beforeAll(async () => {
  await db.connect();

  // Register all three roles
  const roles = [
    { name: "Admin", email: "admin_dash@test.com", role: "admin" },
    { name: "Analyst", email: "analyst_dash@test.com", role: "analyst" },
    { name: "Viewer", email: "viewer_dash@test.com", role: "viewer" },
  ];

  for (const u of roles) {
    await request(app)
      .post("/api/auth/register")
      .send({ ...u, password: "password123" });
  }

  const adminRes = await request(app)
    .post("/api/auth/login")
    .send({ email: "admin_dash@test.com", password: "password123" });
  adminToken = adminRes.body.token;

  const analystRes = await request(app)
    .post("/api/auth/login")
    .send({ email: "analyst_dash@test.com", password: "password123" });
  analystToken = analystRes.body.token;

  const viewerRes = await request(app)
    .post("/api/auth/login")
    .send({ email: "viewer_dash@test.com", password: "password123" });
  viewerToken = viewerRes.body.token;

  // Seed some transactions
  const transactions = [
    { amount: 50000, type: "income", category: "salary", date: "2024-01-10" },
    { amount: 10000, type: "income", category: "freelance", date: "2024-01-15" },
    { amount: 3000, type: "expense", category: "food", date: "2024-01-20" },
    { amount: 1500, type: "expense", category: "transport", date: "2024-02-05" },
    { amount: 8000, type: "expense", category: "rent", date: "2024-02-10" },
  ];

  for (const tx of transactions) {
    await request(app)
      .post("/api/transactions")
      .set("Authorization", `Bearer ${adminToken}`)
      .send(tx);
  }
});

afterAll(async () => {
  await db.closeDatabase();
});

describe("Dashboard API", () => {
  test("GET /api/dashboard/summary → all roles can access", async () => {
    const res = await request(app)
      .get("/api/dashboard/summary")
      .set("Authorization", `Bearer ${viewerToken}`);
    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveProperty("totalIncome");
    expect(res.body.data).toHaveProperty("totalExpense");
    expect(res.body.data).toHaveProperty("netBalance");
    expect(res.body.data.netBalance).toBe(
      res.body.data.totalIncome - res.body.data.totalExpense
    );
  });

  test("GET /api/dashboard/summary → returns correct totals", async () => {
    const res = await request(app)
      .get("/api/dashboard/summary")
      .set("Authorization", `Bearer ${adminToken}`);
    expect(res.body.data.totalIncome).toBe(60000);
    expect(res.body.data.totalExpense).toBe(12500);
    expect(res.body.data.netBalance).toBe(47500);
  });

  test("GET /api/dashboard/recent → all roles can access", async () => {
    const res = await request(app)
      .get("/api/dashboard/recent")
      .set("Authorization", `Bearer ${viewerToken}`);
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.length).toBeLessThanOrEqual(10);
  });

  test("GET /api/dashboard/by-category → analyst can access", async () => {
    const res = await request(app)
      .get("/api/dashboard/by-category")
      .set("Authorization", `Bearer ${analystToken}`);
    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(typeof res.body.data).toBe("object");
  });

  test("GET /api/dashboard/by-category → viewer is denied", async () => {
    const res = await request(app)
      .get("/api/dashboard/by-category")
      .set("Authorization", `Bearer ${viewerToken}`);
    expect(res.statusCode).toBe(403);
  });

  test("GET /api/dashboard/trends → analyst can access", async () => {
    const res = await request(app)
      .get("/api/dashboard/trends")
      .set("Authorization", `Bearer ${analystToken}`);
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  test("GET /api/dashboard/trends → viewer is denied", async () => {
    const res = await request(app)
      .get("/api/dashboard/trends")
      .set("Authorization", `Bearer ${viewerToken}`);
    expect(res.statusCode).toBe(403);
  });

  test("GET /api/dashboard/summary → unauthenticated request is denied", async () => {
    const res = await request(app).get("/api/dashboard/summary");
    expect(res.statusCode).toBe(401);
  });
});
