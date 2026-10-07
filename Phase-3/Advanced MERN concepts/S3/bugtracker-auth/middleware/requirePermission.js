import ROLE_PERMISSIONS from "../config/permissions.js";

function requirePermission(permission) {
  return (req, res, next) => {
    const allowed = ROLE_PERMISSIONS[req.user.role] || [];
    if (!allowed.includes(permission)) return res.status(403).json({ error: 'Forbidden' });
    next();
  };
}

export default requirePermission    