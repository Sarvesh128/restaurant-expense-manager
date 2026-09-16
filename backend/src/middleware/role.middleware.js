/**
 * Role-based Access Control Authorization Middleware.
 * Checks whether the authenticated user has one of the allowed roles.
 *
 * @param {...string} allowedRoles - List of allowed roles (e.g., 'ADMIN', 'MANAGER', 'ACCOUNTANT')
 */
const authorize = (...allowedRoles) => {
  const normalizedRoles = allowedRoles.map((role) => role.toUpperCase());

  return (req, res, next) => {
    if (!req.user || !req.user.role) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required before role verification.'
      });
    }

    const userRole = req.user.role.toUpperCase();

    if (!normalizedRoles.includes(userRole)) {
      return res.status(403).json({
        success: false,
        message: `Forbidden: Insufficient privileges. Required role: [${allowedRoles.join(', ')}].`
      });
    }

    next();
  };
};

module.exports = authorize;
