const { body, validationResult } = require("express-validator");

// Middleware to catch and return validation errors
const handleValidation = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({
      success: false,
      message: "Validation failed.",
      errors: errors.array().map((e) => ({ field: e.path, message: e.msg })),
    });
  }
  next();
};

const validateRegister = [
  body("name").trim().notEmpty().withMessage("Name is required."),
  body("email").isEmail().withMessage("Valid email is required."),
  body("password")
    .isLength({ min: 6 })
    .withMessage("Password must be at least 6 characters."),
  body("role")
    .optional()
    .isIn(["viewer", "analyst", "admin"])
    .withMessage("Role must be viewer, analyst, or admin."),
  handleValidation,
];

const validateLogin = [
  body("email").isEmail().withMessage("Valid email is required."),
  body("password").notEmpty().withMessage("Password is required."),
  handleValidation,
];

const validateTransaction = [
  body("amount")
    .isFloat({ min: 0.01 })
    .withMessage("Amount must be a positive number."),
  body("type")
    .isIn(["income", "expense"])
    .withMessage("Type must be income or expense."),
  body("category")
    .isIn([
      "salary","freelance","investment","food","transport",
      "utilities","healthcare","entertainment","shopping",
      "education","rent","other",
    ])
    .withMessage("Invalid category."),
  body("date").optional().isISO8601().withMessage("Date must be a valid ISO date."),
  body("notes")
    .optional()
    .isLength({ max: 500 })
    .withMessage("Notes cannot exceed 500 characters."),
  handleValidation,
];

module.exports = { validateRegister, validateLogin, validateTransaction };
