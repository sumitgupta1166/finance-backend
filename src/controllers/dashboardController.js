const Transaction = require("../models/Transaction");

// @desc    Get full dashboard summary
// @route   GET /api/dashboard/summary
// @access  Viewer, Analyst, Admin
const getSummary = async (req, res) => {
  try {
    const result = await Transaction.aggregate([
      { $match: { isDeleted: { $ne: true } } },
      {
        $group: {
          _id: "$type",
          total: { $sum: "$amount" },
          count: { $sum: 1 },
        },
      },
    ]);

    let totalIncome = 0;
    let totalExpense = 0;
    let incomeCount = 0;
    let expenseCount = 0;

    result.forEach((r) => {
      if (r._id === "income") {
        totalIncome = r.total;
        incomeCount = r.count;
      } else if (r._id === "expense") {
        totalExpense = r.total;
        expenseCount = r.count;
      }
    });

    res.status(200).json({
      success: true,
      data: {
        totalIncome,
        totalExpense,
        netBalance: totalIncome - totalExpense,
        incomeCount,
        expenseCount,
        totalTransactions: incomeCount + expenseCount,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get category-wise totals
// @route   GET /api/dashboard/by-category
// @access  Analyst, Admin
const getCategoryBreakdown = async (req, res) => {
  try {
    const breakdown = await Transaction.aggregate([
      { $match: { isDeleted: { $ne: true } } },
      {
        $group: {
          _id: { category: "$category", type: "$type" },
          total: { $sum: "$amount" },
          count: { $sum: 1 },
        },
      },
      { $sort: { total: -1 } },
    ]);

    // Restructure for clean frontend consumption
    const formatted = {};
    breakdown.forEach(({ _id, total, count }) => {
      if (!formatted[_id.category]) formatted[_id.category] = {};
      formatted[_id.category][_id.type] = { total, count };
    });

    res.status(200).json({ success: true, data: formatted });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get monthly trends (last 6 months)
// @route   GET /api/dashboard/trends
// @access  Analyst, Admin
const getMonthlyTrends = async (req, res) => {
  try {
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const trends = await Transaction.aggregate([
      {
        $match: {
          isDeleted: { $ne: true },
          date: { $gte: sixMonthsAgo },
        },
      },
      {
        $group: {
          _id: {
            year: { $year: "$date" },
            month: { $month: "$date" },
            type: "$type",
          },
          total: { $sum: "$amount" },
          count: { $sum: 1 },
        },
      },
      { $sort: { "_id.year": 1, "_id.month": 1 } },
    ]);

    res.status(200).json({ success: true, data: trends });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get recent 10 transactions
// @route   GET /api/dashboard/recent
// @access  Viewer, Analyst, Admin
const getRecentActivity = async (req, res) => {
  try {
    const recent = await Transaction.find({})
      .populate("createdBy", "name")
      .sort({ date: -1 })
      .limit(10);

    res.status(200).json({ success: true, data: recent });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getSummary,
  getCategoryBreakdown,
  getMonthlyTrends,
  getRecentActivity,
};
