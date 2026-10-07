import ROLE_PERMISSIONS from "../config/permissions.js";

function requireOwnershipUnless(bypassPermission, getOwnerId) {
  return async (req, res, next) => {
    const allowed = ROLE_PERMISSIONS[req.user.role] || [];
    if (allowed.includes(bypassPermission)) return next(); // maintainer/admin bypass
    try {
      const ownerId = await getOwnerId(req);
      if (String(ownerId) !== String(req.user.userId)) {
        return res.status(403).json({ error: 'Not your resource' });
      }
      next();
    } catch (err) {
      next(err);
    }
  };
}

export default requireOwnershipUnless;