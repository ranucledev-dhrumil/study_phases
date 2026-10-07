// The core problem
// HTTP is stateless — each request has no memory of previous ones. Spring Boot sessions traditionally solved this with a server-side session + a cookie. Modern REST APIs (especially ones with separate frontend/backend, like MERN) usually use tokens instead: the client holds a token and sends it with every request, and the server verifies it without needing to store session state.

// What is a JWT?
// A JSON Web Token is a compact, signed string with three parts, separated by dots:

// header.payload.signature 
// Header — algorithm used (e.g., HS25cry6) and token type.
// Payload — claims: arbitrary data like userId, role, iat (issued at), exp (expiry). Not encrypted — anyone can base64-decode and read it. Never put passwords or sensitive data in it.
// Signature — HMAC-SHA256(base64(header) + "." + base64(payload), SECRET_KEY). This is what makes it tamper-proof: if anyone changes the payload, the signature won't match anymore when the server re-verifies it.

// Key insight: a JWT is not encrypted, it's signed. 
// The server doesn't store anything — it just re-computes the signature on every request and compares. 
// This is what makes JWT auth "stateless.

const jwt = require('jsonwebtoken');

// Issuing a token at login
const token = jwt.sign(
    { userId: user._id, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: '15m' }
);

// Verifying a token
const decoded = jwt.verify(token, process.env.JWT_SECRET);
// decoded = { userId: '...', role: 'admin', iat: ..., exp: ... }

// Where does the token live on the client? - Two common options, each with trade-offs:
// localStorage — simple, survives refresh, but accessible to any JS on the page (XSS risk).
// httpOnly cookie — not accessible to JS at all (safer against XSS), but needs CSRF protection and more setup (SameSite, CORS credentials).

// bcrypt: password hashing:
// Never store plaintext passwords. bcrypt is a one-way hashing algorithm with a built-in salt (random data mixed in so identical passwords don't produce identical hashes) and a configurable cost factor (how slow/expensive the hash is to compute — deliberately slow to resist brute-force).
const bcrypt = require('bcrypt');

// Registering
const hashedPassword = await bcrypt.hash(plainPassword, 10); // 10 = salt rounds
await User.create({ email, password: hashedPassword });

// Logging in
const isMatch = await bcrypt.compare(plainPassword, user.password);
if (!isMatch) throw new Error('Invalid credentials');

// bcrypt.compare re-hashes the input with the same salt (stored inside the hash string itself) and compares — you never "decrypt" a bcrypt hash, ever.
// Spring Security analogy: this is exactly BCryptPasswordEncoder.encode() / .matches(). Same algorithm, same cost-factor concept (strength parameter in Spring).

// The full JWT auth flow
// 1. Register: hash password with bcrypt → save user.
// 2. Login: find user by email → bcrypt.compare() → if valid, jwt.sign() a token → return it to client.
// 3. Client stores token(localStorage) and attaches it to every subsequent request:
//      fetch('/api/tasks', { headers: { Authorization: `Bearer ${token}` } })
// 4. Server middleware on protected routes: extract token from header → jwt.verify() → attach decoded user info to req.user → call next(), or reject with 401 if invalid/missing.

// Role-based access control (RBAC):
// Storing a role field on the user ('user' | 'admin', or an array of permissions) lets you gate routes beyond just "logged in or not."
// Simple role check
function requireRole(role) {
  return (req, res, next) => {
    if (req.user.role !== role) return res.status(403).json({ error: 'Forbidden' });
    next();
  };
}

app.delete('/api/tasks/:id', authenticate, requireRole('admin'), deleteTask);

// For multiple roles / permission-based checks (more depth, as you asked for):
// Permission-based: role maps to a set of allowed actions
const ROLE_PERMISSIONS = {
  user: ['read:own', 'create:own'],
  editor: ['read:own', 'create:own', 'update:any'],
  admin: ['read:any', 'create:any', 'update:any', 'delete:any'],
};

function requirePermission(permission) {
  return (req, res, next) => {
    const allowed = ROLE_PERMISSIONS[req.user.role] || []; // "Get all permissions belonging to this user's role."
    if (!allowed.includes(permission)) return res.status(403).json({ error: 'Forbidden' });
    next();
  };
}

app.delete('/api/tasks/:id', authenticate, requirePermission('delete:any'), deleteTask);
// This is closer to how larger systems actually do it — roles are just named bundles of permissions, and your middleware checks the permission, not the role name directly. Easier to extend (add a role without touching every route).

// Spring Security analogy: this maps directly to @PreAuthorize("hasRole('ADMIN')") (simple role check) vs @PreAuthorize("hasAuthority('delete:any')") (permission-based, closer to Spring's GrantedAuthority model, which was always permission-based under the hood even when you used role names).

// 401 vs 403 — know the difference
// 401 Unauthorized — you're not authenticated at all (missing/invalid/expired token).
// 403 Forbidden — you are authenticated, but you don't have permission for this specific action.

// Refresh tokens & token expiry (as requested)
// A JWT with a long expiry (expiresIn: '7d') is convenient but risky — if it's stolen, it's valid for a week. The standard pattern is two tokens:
// Access token — short-lived (e.g., 15 min), sent with every API request, used for actual authorization.
// Refresh token — long-lived (e.g., 7 days), used only to get a new access token, typically stored more securely (httpOnly cookie) and often stored server-side too (in the DB) so it can be revoked.

// Flow:

// Login issues both an access token and a refresh token.
// Client uses the access token normally. When it expires, API calls start returning 401.
// Client calls a /refresh endpoint, sending the refresh token.
// Server verifies the refresh token (and checks it against a stored/allowed list — this is how you can "log out" or revoke access even though JWTs are otherwise stateless), issues a new access token.
// If the refresh token itself is invalid/expired/revoked → force full re-login.

// Issuing both at login
const accessToken = jwt.sign({ userId }, ACCESS_SECRET, { expiresIn: '15m' });
const refreshToken = jwt.sign({ userId }, REFRESH_SECRET, { expiresIn: '7d' });
// Store refreshToken in DB against the user, so it can be invalidated on logout

// Refresh endpoint
app.post('/api/refresh', async (req, res) => {
  const { refreshToken } = req.body; // or from httpOnly cookie
  const stored = await RefreshToken.findOne({ token: refreshToken });
  if (!stored) return res.status(401).json({ error: 'Invalid refresh token' });

  try {
    const decoded = jwt.verify(refreshToken, REFRESH_SECRET);
    const newAccessToken = jwt.sign({ userId: decoded.userId }, ACCESS_SECRET, { expiresIn: '15m' });
    res.json({ accessToken: newAccessToken });
  } catch {
    res.status(401).json({ error: 'Refresh token expired' });
  }
});
// Why bother with two tokens instead of one long-lived one? Blast radius. If an access token leaks, it's only useful for 15 minutes. The refresh token is used rarely (only to mint new access tokens) and can be revoked server-side (delete it from the DB) — which a pure stateless JWT can't be, short of waiting out its expiry or maintaining a blocklist.

// | Concept                    | Purpose                                  | Spring Security equivalent                           |
// | -------------------------- | ---------------------------------------- | ---------------------------------------------------- |
// | **bcrypt hash**            | One-way password storage                 | `BCryptPasswordEncoder`                              |
// | **JWT access token**       | Stateless per-request identity           | Signed JWT in `Authorization` header, same idea      |
// | **JWT verify middleware**  | Gatekeeper before route handler          | `JwtAuthenticationFilter` in filter chain            |
// | **`req.user.role` check**  | RBAC                                     | `@PreAuthorize("hasRole(...)")`                      |
// | **Permission-based check** | Fine-grained RBAC                        | `GrantedAuthority` / `hasAuthority(...)`             |
// | **Refresh token**          | Renew access without re-login, revocable | OAuth2 refresh token flow                            |
// | **401 vs 403**             | Not authenticated vs not authorized      | `AuthenticationException` vs `AccessDeniedException` |

// httpOnly Cookie Approach for Production
// Why localStorage is the weaker option
// If your app has any XSS vulnerability (a malicious script injected via unsanitized user input, a compromised npm package, etc.), that script can run localStorage.getItem('token') and exfiltrate it instantly.
// There's no browser-level protection — any JS on the page has full access to localStorage.

// How httpOnly cookies fix this
// An httpOnly cookie is invisible to JavaScript entirely — document.cookie won't show it, no script can read or steal it.
// The browser attaches it automatically to requests to the matching domain. This closes the XSS-token-theft vector completely (though XSS is still bad for other reasons — it just can't steal your token this way).

// Setting it up on the backend (Express)
// Instead of returning the token in the JSON response body, the server sets it directly as a cookie:
const cookieOptions = {
  httpOnly: true,       // JS can't access it
  secure: true,         // only sent over HTTPS
  sameSite: 'strict',   // or 'lax' — controls cross-site sending (see CSRF below)
  maxAge: 15 * 60 * 1000, // 15 min, matches access token expiry
};

app.post('/api/login', async (req, res) => {
  // ...validate credentials...
  const token = jwt.sign({ userId: user._id }, JWT_SECRET, { expiresIn: '15m' });
  res.cookie('token', token, cookieOptions);
  res.json({ user: { id: user._id, email: user.email } }); // no token in body
});

// You'll need the cookie-parser middleware to read cookies on incoming requests:
const cookieParser = require('cookie-parser');
app.use(cookieParser());

function authenticate(req, res, next) {
  const token = req.cookies.token; // instead of reading Authorization header
  if (!token) return res.status(401).json({ error: 'No token' });
  try {
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch {
    res.status(401).json({ error: 'Invalid or expired token' });
  }
}

// The CORS/credentials catch
// Cookies aren't sent cross-origin by default. Since your React dev server (:5173) and Express API (:5000 or wherever) are different origins, you need both sides to explicitly opt in:

app.use(cors({
  origin: 'http://localhost:5173', // must be explicit, NOT '*', when using credentials
  credentials: true,
}));

// Frontend (every fetch/axios call):
fetch('/api/tasks', { credentials: 'include' }); // fetch
// or with axios:
axios.defaults.withCredentials = true;
// If you forget either side, the cookie silently won't be sent/set, and you'll get confusing 401s that look like an auth bug but are actually a CORS config miss. This is one of the most common real-world debugging traps with this approach.

// Now — the trade-off: CSRF
// httpOnly cookies solve XSS-token-theft, but reintroduce a different old problem: CSRF (Cross-Site Request Forgery). 
// Because the browser auto-attaches cookies to matching-domain requests, a malicious site can trigger a request to your API (e.g., a hidden auto-submitting form) and the browser will happily attach your auth cookie — even though the request didn't originate from your app.

// Mitigations:
// 1. sameSite cookie attribute — this is your first line of defense:
// strict: cookie never sent on cross-site requests (safest, but breaks things like clicking a link from an email into your app while logged in).
// lax: cookie sent on top-level navigation (clicking a link) but not on cross-site POSTs triggered by forms/scripts on other sites — good default for most apps.
// none: sent everywhere (only makes sense if you need true cross-site cookies, and requires secure: true).
// 2. CSRF tokens — for extra safety (especially for state-changing requests like POST/DELETE), issue a random token, embed it in the page, require the client to send it back in a header (not a cookie) on mutating requests.
// The server checks it matches. 
// Because it's not auto-attached like a cookie, an attacker's forged request can't include it.

// | `localStorage` + Bearer header | `httpOnly` cookie                               |                                                                  |
// | ------------------------------ | ----------------------------------------------- | ---------------------------------------------------------------- |
// | **XSS token theft**            | Vulnerable                                      | Protected                                                        |
// | **CSRF**                       | Not a concern (no auto-attach)                  | Needs mitigation (`SameSite` / CSRF token)                       |
// | **Cross-origin setup**         | Simple — just send the header                   | Needs CORS `credentials: true` + matching cookie domain rules    |
// | **Mobile/non-browser clients** | Easy — send the header manually                 | Awkward — cookies are primarily a browser mechanism              |
// | **Common in**                  | Bootcamp projects, SPAs talking to same-org API | Production apps, especially with SSR or first-party-only clients |

//  Permission-based checks decouple 'what a role can do' from 'what the code checks.' Adding a new role or changing what an existing role can do only requires updating the ROLE_PERMISSIONS mapping, not touching every route handler that does string-compares against role names.

