// 1. Centralizing config — never scatter secrets/logic
// You had ACCESS_SECRET/REFRESH_SECRET read from process.env inline in multiple files. In a real project, centralize this:
// config/env.js
export const ACCESS_SECRET = process.env.ACCESS_SECRET;
export const REFRESH_SECRET = process.env.REFRESH_SECRET;
export const ACCESS_EXPIRY = process.env.ACCESS_EXPIRY || '15m';
export const REFRESH_EXPIRY = process.env.REFRESH_EXPIRY || '7d';

if (!ACCESS_SECRET || !REFRESH_SECRET) {
    throw new Error('JWT secrets must be set in environment variables');
}

// Fail fast at startup if secrets are missing — don't let the app boot into a broken state where every login silently fails with a cryptic jwt.sign error.

// 2. Extracting token logic into a service layer
// Don't duplicate jwt.sign(...) calls across register/login/refresh. Extract:
// services/tokenService.js
import jwt from 'jsonwebtoken';
import { ACCESS_SECRET, REFRESH_SECRET, ACCESS_EXPIRY, REFRESH_EXPIRY } from '../config/env.js';

export function signAccessToken(payload) {
    return jwt.sign(payload, ACCESS_SECRET, { expiresIn: ACCESS_EXPIRY });
}
export function signRefreshToken(payload) {
    return jwt.sign(payload, REFRESH_SECRET, { expiresIn: REFRESH_EXPIRY });
}
export function verifyAccessToken(token) {
    return jwt.verify(token, ACCESS_SECRET);
}
export function verifyRefreshToken(token) {
    return jwt.verify(token, REFRESH_SECRET);
}

// This isn't just tidiness — it means if you ever change signing logic (add an issuer, switch algorithms, add token rotation), you change it in one place. Your controllers/routes call the service, they don't know the crypto details.

// 3. What actually goes in the JWT payload — and what doesn't
// Common mistake: putting too much (or too little) in the payload.

// Good — small, stable, enough to authorize without a DB hit for most checks
{ userId: user._id, role: user.role }

// Bad — email/name can change; now your token is stale until re-login
{ userId, email, name, role }

// Bad — no role at all means every request needs a DB lookup just to check permissions
{ userId }

// Rule of thumb: include what you need for authorization decisions on every request (userId + role is the sweet spot), and treat the token as sometimes-stale — if you change a user's role mid-session, their existing access token still has the old role until it expires or they refresh. 
// This is a real design trade-off, not a bug: fully "live" role changes would require checking the DB on every request, defeating the point of a stateless token in the first place.

// 4. Middleware ordering & composition patterns
// You've already seen authenticate → requirePermission. In bigger apps, you'll also want:
// Optional auth — some routes (e.g., "get bug list") behave differently for logged-in vs anonymous users, without requiring auth:
function optionalAuthenticate(req, res, next) {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) return next(); // no token, just continue
    try {
        req.user = verifyAccessToken(authHeader.split(' ')[1]);
    } catch { /* invalid token, treat as anonymous */ }
    next();
}

// Ownership checks — beyond role, you often need "is this your resource?" (e.g., a reporter can update their own bug but not someone else's):
function requireOwnership(getOwnerId) {
    return async (req, res, next) => {
        const ownerId = await getOwnerId(req);
        if (req.user.role === 'admin') return next(); // admins bypass ownership
        if (String(ownerId) !== String(req.user.userId)) {
            return res.status(403).json({ error: 'Not your resource' });
        }
        next();
    };
}

router.delete('/:id', authenticate,
    requireOwnership(async (req) => (await Bug.findById(req.params.id))?.reportedBy),
    deleteBug
);
// This combines RBAC (role-based) with resource-based access control — very common in real apps (you'll actually need this exact pattern for the Second Brain project: notes scoped to the logged-in user).

// 5. Error handling consistency
// You used next(e) correctly in your task — that's the right pattern (let a centralized error handler format the response), but it needs an actual centralized handler to be useful:
// middleware/errorHandler.js
export function errorHandler(err, req, res, next) {
  console.error(err);
  if (err.name === 'ValidationError') return res.status(400).json({ message: err.message });
  if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
    return res.status(401).json({ message: 'Invalid or expired token' });
  }
  res.status(err.statusCode || 500).json({ message: err.message || 'Server error' });
}

// app.js — must be registered LAST, after all routes
app.use(errorHandler);
// Without this, every route's catch block reinvents error formatting inconsistently (some return error, some message, some don't handle it at all).

// 6. Never trust req.body blindly for role assignment
// A subtle security bug worth calling out explicitly, since it's adjacent to what you built: your register route reads role from req.body. In your hands-on task that's fine (learning exercise), but in production, letting a client set their own role at registration is a privilege escalation bug — anyone could POST /register { role: "admin" } and grant themselves admin. Real systems either hardcode role to 'user'/'reporter' at registration and have a separate admin-only endpoint to promote users, or omit role from the public registration schema entirely.

// 7. Testing auth flows without repeating manual Postman clicks
// Manually retesting register→login→protected-route→refresh→logout after every change (like you just did) doesn't scale. Backend devs typically write integration tests for exactly this flow:
// Rough shape (using a test framework like Jest + supertest)
test('protected route rejects request with no token', async () => {
  const res = await request(app).get('/api/bugs');
  expect(res.status).toBe(401);
});

test('reporter cannot delete a bug', async () => {
  const token = await loginAs('reporter');
  const res = await request(app).delete(`/api/bugs/${bugId}`).set('Authorization', `Bearer ${token}`);
  expect(res.status).toBe(403);
});

// | Pattern                              | Why it matters                                                 | Spring analogy                                 |
// | ------------------------------------ | -------------------------------------------------------------- | ---------------------------------------------- |
// | **Centralized env/config**           | Fail fast; maintain a single source of truth                   | `application.yml` + `@ConfigurationProperties` |
// | **Token service layer**              | Avoid duplicated signing logic                                 | `@Service` layer                               |
// | **Minimal, stable JWT payload**      | Avoid staleness and oversized tokens                           | Same trade-off in any stateless token design   |
// | **Optional auth middleware**         | Route can behave differently for logged-in vs. anonymous users | Custom `Filter` with permissive fallback       |
// | **Ownership + role combined checks** | RBAC alone isn't enough for “your own resource”                | `@PreAuthorize` with principal comparison      |
// | **Centralized error handler**        | Maintain a consistent API error shape                          | `@ControllerAdvice`                            |
// | **Never trust client-supplied role** | Prevent privilege escalation                                   | DTO whitelisting / mass-assignment protection  |
// | **Integration tests for auth flows** | Catch silent RBAC bugs, such as duplicate routes               | `@SpringBootTest` + `MockMvc`                  |

// next(e) forwards the error to Express's error-handling middleware chain, but that only produces a consistent response if a centralized error handler middleware is registered (last, after all routes) to actually catch and format it. Without one, Express falls back to its default (often unhelpful/inconsistent) error response.
