const express = require("express");
const router = express.Router();
const {
  getSummary,
  getCategoryBreakdown,
  getMonthlyTrends,
  getRecentActivity,
} = require("../controllers/dashboardController");
const { protect } = require("../middleware/auth");
const { restrictTo } = require("../middleware/rbac");

/**
 * @swagger
 * tags:
 *   name: Dashboard
 *   description: Summary and analytics APIs
 */

/**
 * @swagger
 * /api/dashboard/summary:
 *   get:
 *     summary: Get total income, expense, and net balance
 *     tags: [Dashboard]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200: { description: Financial summary }
 */
router.get("/summary", protect, getSummary);

/**
 * @swagger
 * /api/dashboard/recent:
 *   get:
 *     summary: Get 10 most recent transactions
 *     tags: [Dashboard]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200: { description: Recent activity }
 */
router.get("/recent", protect, getRecentActivity);

/**
 * @swagger
 * /api/dashboard/by-category:
 *   get:
 *     summary: Get category-wise income/expense breakdown (Analyst & Admin)
 *     tags: [Dashboard]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200: { description: Category breakdown }
 *       403: { description: Insufficient role }
 */
router.get(
  "/by-category",
  protect,
  restrictTo("analyst", "admin"),
  getCategoryBreakdown
);

/**
 * @swagger
 * /api/dashboard/trends:
 *   get:
 *     summary: Get monthly income/expense trends (last 6 months) (Analyst & Admin)
 *     tags: [Dashboard]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200: { description: Monthly trends }
 */
router.get(
  "/trends",
  protect,
  restrictTo("analyst", "admin"),
  getMonthlyTrends
);

module.exports = router;
