import { hasFeatureAccess, getFeatureScope } from "../config/permissions.js";

/**
 * Middleware to restrict route to specific roles
 * @param  {...string} allowedRoles (e.g. 'ADMIN', 'TEACHER')
 */
export const authorizeRoles = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Not authenticated.",
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Access denied. Role '${req.user.role}' is not authorized to access this resource.`,
      });
    }

    next();
  };
};

/**
 * Middleware to enforce granular module + feature + action permissions
 * synchronized with EduFlow ERP matrix.
 * @param {string} module - ERP module ('students', 'teachers', 'attendance', 'finance', etc.)
 * @param {string} feature - Module feature ('allStudents', 'markAttendance', etc.)
 * @param {string} action - Action ('view', 'create', 'edit', 'delete', 'approve', 'export')
 */
export const authorizePermission = (module, feature, action = "view") => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Not authenticated.",
      });
    }

    const role = req.user.role;
    const allowed = hasFeatureAccess(role, module, feature, action);

    if (!allowed) {
      return res.status(403).json({
        success: false,
        message: `Forbidden: Role '${role}' lacks permission to '${action}' on '${module}.${feature}'.`,
      });
    }

    // Attach data scope ('institution', 'department', 'assigned', 'own') to request
    req.userScope = getFeatureScope(role, module, feature);

    next();
  };
};
