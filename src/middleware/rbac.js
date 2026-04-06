/**
 * Role Hierarchy:
 *  viewer   → read-only access to dashboard & transactions
 *  analyst  → viewer + can access insights/summaries
 *  admin    → full access (create, update, delete users & transactions)
 */

const ROLE_PERMISSIONS = {
  viewer: ["read:transactions", "read:dashboard"],
  analyst: ["read:transactions", "read:dashboard", "read:insights"],
  admin: [
    "read:transactions",
    "read:dashboard",
    "read:insights",
    "create:transactions",
    "update:transactions",
    "delete:transactions",
    "manage:users",
  ],
};

/**
 * Middleware: restrict access to specified roles only
 * Usage: restrictTo("admin", "analyst")
 */
const restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Access denied. Required role: [${roles.join(" or ")}]. Your role: ${req.user.role}`,
      });
    }
    next();
  };
};

/**
 * Middleware: check specific permission
 * Usage: hasPermission("create:transactions")
 */
const hasPermission = (permission) => {
  return (req, res, next) => {
    const userPermissions = ROLE_PERMISSIONS[req.user.role] || [];
    if (!userPermissions.includes(permission)) {
      return res.status(403).json({
        success: false,
        message: `Access denied. You do not have permission to perform this action.`,
      });
    }
    next();
  };
};

module.exports = { restrictTo, hasPermission, ROLE_PERMISSIONS };
