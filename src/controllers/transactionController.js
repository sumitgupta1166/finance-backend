const Transaction = require("../models/Transaction");

// @desc    Create a transaction
// @route   POST /api/transactions
// @access  Admin only
const createTransaction = async (req, res) => {
  try {
    const { amount, type, category, date, notes } = req.body;

    const transaction = await Transaction.create({
      amount,
      type,
      category,
      date,
      notes,
      createdBy: req.user._id,
    });

    res.status(201).json({
      success: true,
      message: "Transaction created.",
      data: transaction,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get all transactions (with filters + pagination)
// @route   GET /api/transactions
// @access  Viewer, Analyst, Admin
const getTransactions = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const filter = {};

    // Filters
    if (req.query.type) filter.type = req.query.type;
    if (req.query.category) filter.category = req.query.category;

    if (req.query.startDate || req.query.endDate) {
      filter.date = {};
      if (req.query.startDate)
        filter.date.$gte = new Date(req.query.startDate);
      if (req.query.endDate)
        filter.date.$lte = new Date(req.query.endDate);
    }

    if (req.query.minAmount || req.query.maxAmount) {
      filter.amount = {};
      if (req.query.minAmount)
        filter.amount.$gte = parseFloat(req.query.minAmount);
      if (req.query.maxAmount)
        filter.amount.$lte = parseFloat(req.query.maxAmount);
    }

    const total = await Transaction.countDocuments(filter);
    const transactions = await Transaction.find(filter)
      .populate("createdBy", "name email")
      .skip(skip)
      .limit(limit)
      .sort({ date: -1 });

    res.status(200).json({
      success: true,
      total,
      page,
      pages: Math.ceil(total / limit),
      data: transactions,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get single transaction
// @route   GET /api/transactions/:id
// @access  Viewer, Analyst, Admin
const getTransactionById = async (req, res) => {
  try {
    const transaction = await Transaction.findById(req.params.id).populate(
      "createdBy",
      "name email"
    );

    if (!transaction) {
      return res
        .status(404)
        .json({ success: false, message: "Transaction not found." });
    }

    res.status(200).json({ success: true, data: transaction });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update a transaction
// @route   PUT /api/transactions/:id
// @access  Admin only
const updateTransaction = async (req, res) => {
  try {
    const { amount, type, category, date, notes } = req.body;

    const transaction = await Transaction.findByIdAndUpdate(
      req.params.id,
      { amount, type, category, date, notes },
      { new: true, runValidators: true }
    );

    if (!transaction) {
      return res
        .status(404)
        .json({ success: false, message: "Transaction not found." });
    }

    res.status(200).json({
      success: true,
      message: "Transaction updated.",
      data: transaction,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Soft delete a transaction
// @route   DELETE /api/transactions/:id
// @access  Admin only
const deleteTransaction = async (req, res) => {
  try {
    const transaction = await Transaction.findByIdAndUpdate(
      req.params.id,
      {
        isDeleted: true,
        deletedAt: new Date(),
        deletedBy: req.user._id,
      },
      { new: true }
    );

    if (!transaction) {
      return res
        .status(404)
        .json({ success: false, message: "Transaction not found." });
    }

    res
      .status(200)
      .json({ success: true, message: "Transaction deleted successfully." });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  createTransaction,
  getTransactions,
  getTransactionById,
  updateTransaction,
  deleteTransaction,
};
