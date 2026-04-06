const request = require("supertest");
const app = require("../src/app");
const db = require("./setup");

beforeAll(async () => {
  await db.connect();
});

afterAll(async () => {
  await db.closeDatabase();
});

describe("Auth API", () => {
  let token;

  test("POST /api/auth/register → should register a new user", async () => {
    const res = await request(app).post("/api/auth/register").send({
      name: "Test Admin",
      email: "admin@test.com",
      password: "password123",
      role: "admin",
    });
    expect(res.statusCode).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.token).toBeDefined();
  });

  test("POST /api/auth/register → should fail on duplicate email", async () => {
    const res = await request(app).post("/api/auth/register").send({
      name: "Duplicate",
      email: "admin@test.com",
      password: "password123",
    });
    expect(res.statusCode).toBe(409);
    expect(res.body.success).toBe(false);
  });

  test("POST /api/auth/register → should fail with invalid email", async () => {
    const res = await request(app).post("/api/auth/register").send({
      name: "Bad User",
      email: "not-an-email",
      password: "password123",
    });
    expect(res.statusCode).toBe(422);
  });

  test("POST /api/auth/login → should login and return token", async () => {
    const res = await request(app).post("/api/auth/login").send({
      email: "admin@test.com",
      password: "password123",
    });
    expect(res.statusCode).toBe(200);
    expect(res.body.token).toBeDefined();
    token = res.body.token;
  });

  test("POST /api/auth/login → should reject wrong password", async () => {
    const res = await request(app).post("/api/auth/login").send({
      email: "admin@test.com",
      password: "wrongpassword",
    });
    expect(res.statusCode).toBe(401);
  });

  test("GET /api/auth/me → should return current user", async () => {
    const res = await request(app)
      .get("/api/auth/me")
      .set("Authorization", `Bearer ${token}`);
    expect(res.statusCode).toBe(200);
    expect(res.body.user.email).toBe("admin@test.com");
  });

  test("GET /api/auth/me → should reject without token", async () => {
    const res = await request(app).get("/api/auth/me");
    expect(res.statusCode).toBe(401);
  });
});
