# Finance Data Processing and Access Control Backend

A production-ready REST API backend for a finance dashboard system, built with Node.js, Express, and MongoDB. Features role-based access control, JWT authentication, aggregated analytics, and comprehensive test coverage.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Runtime | Node.js |
| Framework | Express.js |
| Database | MongoDB (Mongoose ODM) |
| Authentication | JWT (jsonwebtoken + bcryptjs) |
| Validation | express-validator |
| Documentation | Swagger (OpenAPI 3.0) |
| Testing | Jest + Supertest |
| Rate Limiting | express-rate-limit |

---

## Quick Start

### Prerequisites
- Node.js v16+
- MongoDB Atlas account (or local MongoDB)

### Setup

```bash
# 1. Clone and install
git clone https://github.com/YOUR_USERNAME/finance-backend.git
cd finance-backend
npm install

# 2. Configure environment
cp .env.example .env
# Edit .env with your values

# 3. Start server
npm run dev          # development
npm start            # production
```

### Environment Variables

```env
PORT=5000
MONGO_URI=mongodb+srv://<username>:<password>@cluster.mongodb.net/finance_db
JWT_SECRET=your_super_secret_key_here
JWT_EXPIRES_IN=7d
NODE_ENV=development
```

---

## API Documentation

Interactive Swagger docs available at:
```
http://localhost:5000/api/docs
```

Live (Render): `https://your-app.onrender.com/api/docs`

---

## Role System

Three roles with clearly defined permissions:

| Action | Viewer | Analyst | Admin |
|---|:---:|:---:|:---:|
| Login / Register | ✅ | ✅ | ✅ |
| View transactions | ✅ | ✅ | ✅ |
| View dashboard summary | ✅ | ✅ | ✅ |
| View recent activity | ✅ | ✅ | ✅ |
| View category breakdown | ❌ | ✅ | ✅ |
| View monthly trends | ❌ | ✅ | ✅ |
| Create / Update / Delete transactions | ❌ | ❌ | ✅ |
| Manage users | ❌ | ❌ | ✅ |

---

## API Endpoints

### Authentication
| Method | Endpoint | Access | Description |
|---|---|---|---|
| POST | `/api/auth/register` | Public | Register new user |
| POST | `/api/auth/login` | Public | Login, receive JWT |
| GET | `/api/auth/me` | Private | Get logged-in user |

### Users *(Admin only)*
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/users` | List users with pagination & filters |
| GET | `/api/users/:id` | Get user by ID |
| PATCH | `/api/users/:id` | Update user role or status |
| DELETE | `/api/users/:id` | Soft delete user |

### Transactions
| Method | Endpoint | Access | Description |
|---|---|---|---|
| GET | `/api/transactions` | All roles | List with filters + pagination |
| GET | `/api/transactions/:id` | All roles | Get single transaction |
| POST | `/api/transactions` | Admin | Create transaction |
| PUT | `/api/transactions/:id` | Admin | Update transaction |
| DELETE | `/api/transactions/:id` | Admin | Soft delete transaction |

**Available filters for GET /api/transactions:**
- `type` — `income` or `expense`
- `category` — e.g. `salary`, `food`, `rent`
- `startDate` / `endDate` — ISO date range
- `minAmount` / `maxAmount` — amount range
- `page` / `limit` — pagination

### Dashboard
| Method | Endpoint | Access | Description |
|---|---|---|---|
| GET | `/api/dashboard/summary` | All roles | Total income, expense, net balance |
| GET | `/api/dashboard/recent` | All roles | Last 10 transactions |
| GET | `/api/dashboard/by-category` | Analyst + Admin | Category-wise breakdown |
| GET | `/api/dashboard/trends` | Analyst + Admin | Monthly trends (last 6 months) |

---

## Example Requests

### Register & Login
```bash
# Register
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"John","email":"john@example.com","password":"pass123","role":"admin"}'

# Login
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"john@example.com","password":"pass123"}'
```

### Create Transaction *(use token from login)*
```bash
curl -X POST http://localhost:5000/api/transactions \
  -H "Authorization: Bearer <your_token>" \
  -H "Content-Type: application/json" \
  -d '{"amount":5000,"type":"income","category":"salary","date":"2024-01-15","notes":"January salary"}'
```

### Get Dashboard Summary
```bash
curl http://localhost:5000/api/dashboard/summary \
  -H "Authorization: Bearer <your_token>"
```

---

## Project Structure

```
finance-backend/
├── src/
│   ├── config/
│   │   └── db.js                    # MongoDB connection
│   ├── models/
│   │   ├── User.js                  # User schema with roles & soft delete
│   │   └── Transaction.js           # Transaction schema with indexes
│   ├── middleware/
│   │   ├── auth.js                  # JWT verification
│   │   └── rbac.js                  # Role-based access control
│   ├── controllers/
│   │   ├── authController.js        # Register, login, getMe
│   │   ├── userController.js        # Admin user management
│   │   ├── transactionController.js # CRUD + filters + pagination
│   │   └── dashboardController.js   # Aggregation summary APIs
│   ├── routes/
│   │   ├── auth.js
│   │   ├── users.js
│   │   ├── transactions.js
│   │   └── dashboard.js
│   ├── validators/
│   │   └── validators.js            # Input validation rules
│   └── app.js                       # Express app setup
├── tests/
│   ├── setup.js                     # Shared test DB connection
│   ├── auth.test.js                 # 7 auth tests
│   ├── transactions.test.js         # 14 transaction tests
│   └── dashboard.test.js            # 8 dashboard tests
├── swagger.js                       # Swagger/OpenAPI config
├── server.js                        # Entry point
├── .env.example
└── README.md
```

---

## Running Tests

```bash
npm test
```

**Test Coverage: 29 tests across 3 suites**

| Suite | Tests | Coverage |
|---|---|---|
| `auth.test.js` | 7 | Register, login, duplicate, validation, getMe, token auth |
| `transactions.test.js` | 14 | Full CRUD, role restrictions, filters, soft delete |
| `dashboard.test.js` | 8 | Summary accuracy, role access, unauthenticated block |

---

## Deployment (Render)

1. Push repo to GitHub
2. Go to [render.com](https://render.com) → **New Web Service**
3. Connect your GitHub repo
4. Set build & start commands:
   - **Build:** `npm install`
   - **Start:** `npm start`
5. Add environment variables in Render dashboard:
   - `MONGO_URI`
   - `JWT_SECRET`
   - `JWT_EXPIRES_IN` → `7d`
   - `NODE_ENV` → `production`
6. Deploy ✅

---

## Design Decisions

### Soft Delete
Instead of permanently deleting records, `isDeleted: true` is set and a Mongoose `pre(/^find/)` hook automatically excludes them from all queries. This preserves data integrity and allows potential restore functionality without any extra filtering logic in controllers.

### Aggregation for Dashboard
MongoDB's `$group` pipeline computes totals directly in the database rather than fetching all records and summing in JavaScript. This is significantly more efficient as data grows.

### RBAC via Middleware
Role checks are expressed declaratively on routes (`restrictTo("admin")`), making permissions easy to audit at a glance without scattering auth logic across controllers.

### Mongoose Pre-hook for Reconnection Guard
`db.js` checks `mongoose.connection.readyState` before connecting — this prevents duplicate connection errors during testing where multiple test files share the same process.

### Rate Limiting
100 requests per 15 minutes per IP is applied globally on `/api` routes to protect against abuse without blocking legitimate usage.

---

## Assumptions Made

1. **Role assignment at registration** — Any role can be set during registration for testing convenience. In a real system, only an existing admin should be able to assign the `admin` role.
2. **System-level transactions** — Transactions are not scoped per user; any admin can view, update, or delete any transaction. This fits a shared finance dashboard model.
3. **Predefined categories** — 12 categories are enforced via enum for consistency in analytics. A real system might allow custom categories.
4. **No refresh tokens** — JWT expiry is 7 days for simplicity. A production system would implement refresh token rotation.
5. **Soft delete is permanent from API** — There is no restore endpoint. Deleted records are excluded from all queries automatically.

---

## Tradeoffs Considered

| Decision | Chosen | Alternative | Reason |
|---|---|---|---|
| Auth strategy | JWT stateless | Sessions | Stateless JWT suits REST APIs and scales horizontally |
| DB | MongoDB | PostgreSQL | Flexible schema suits evolving financial record structures |
| Soft delete | Mongoose pre-hook | Manual filter | Hook approach is DRY — filtering happens automatically |
| Test DB | Shared Atlas URI | In-memory server | Avoids binary download issues across environments |
| Validation | express-validator | Joi/Zod | Middleware-based validation integrates cleanly with Express |
