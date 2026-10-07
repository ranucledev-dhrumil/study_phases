import ROLE_PERMISSIONS from "../config/permissions.js";

function requirePermission(permission) {
  return (req, res, next) => {
    const allowed = ROLE_PERMISSIONS[req.user.role] || [];
    if (!allowed.includes(permission)) return res.status(403).json({ error: 'Forbidden' });
    next();
  };
}

function requireAnyPermission(permissions) {
  return (req, res, next) => {
    const allowed = ROLE_PERMISSIONS[req.user.role] || [];
    const hasOne = permissions.some((p) => allowed.includes(p));
    if (!hasOne) return res.status(403).json({ error: 'Forbidden' });
    next();
  };
}

export { requirePermission, requireAnyPermission };
export default requirePermission;