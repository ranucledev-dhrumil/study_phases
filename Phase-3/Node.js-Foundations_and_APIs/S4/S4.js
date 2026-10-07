// 1. Setup
// npm install express

const express = require('express');
const app = express();

app.get('/', (req, res) => {
  res.send('Hello World');
});

app.listen(3000, () => console.log('Server on port 3000'));

// This replaces the raw http.createServer boilerplate from Session 3 — Express gives you routing and a request/response API on top of it.

// 2. Routing
app.get('/users', (req, res) => { /* list users */ });
app.get('/users/:id', (req, res) => {
  const { id } = req.params;       // route params
  res.json({ id });
});
app.post('/users', (req, res) => { /* create */ });
app.put('/users/:id', (req, res) => { /* full update */ });
app.patch('/users/:id', (req, res) => { /* partial update */ });
app.delete('/users/:id', (req, res) => { /* delete */ });

// Directly comparable to @GetMapping, @PostMapping, @PathVariable in Spring — same REST verb mapping concept, different syntax. 
// req.params = @PathVariable, req.query = @RequestParam, req.body = @RequestBody.
// req.params = path segments (:id), req.query = query string (?key=val), req.body = parsed request body

// 3. Middleware — the core Express concept:
// A middleware is a function (req, res, next) => {} that runs in the request pipeline, before the route handler. It can:
// modify req/res
// end the request (res.send())
// pass control onward by calling next()

app.use(express.json()); // parses JSON request bodies into req.body — built-in middleware

function logger(req, res, next) {
  console.log(`${req.method} ${req.url}`);
  next(); // MUST call this or the request hangs forever
}
app.use(logger);

app.get('/users', (req, res) => res.json([]));

// Express middleware is just plain functions in a linear chain — no annotations, no bean lifecycle, no DI container. You explicitly wire the order by where you call app.use(). This is much more manual/explicit than Spring's declarative style — some people find it clearer, some find it more error-prone (forgetting next() is a classic bug — the request just hangs with no error).

// | Express                         | Spring                            | Purpose                                      |
// |---------------------------------|-----------------------------------|----------------------------------------------|
// | app.use(middleware)             | Filter                            | Global middleware; runs for every request    |
// | Route-specific middleware       | HandlerInterceptor                | Runs for specific route/mapping              |
// | app.get('/x', authMiddleware,   | preHandle()                       | Runs before the controller/handler           |
// | handler)                        | postHandle()                      | Runs after controller execution              |
// | next()                          | return true / doFilter()          | Continue to the next middleware/handler      |
// | next(err)                       | Throw exception                   | Pass an error to exception handling          |
// | Error-handling middleware       | @ControllerAdvice                 | Centralized exception/error handling         |
// | Middleware registration order   | @Order / FilterRegistrationBean   | Determines execution order                   |

// 4. Route-specific (scoped) middleware
function requireAuth(req, res, next) {
  if (!req.headers.authorization) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  next();
}

app.get('/profile', requireAuth, (req, res) => res.json({ user: 'me' }));
// Similar in spirit to a Spring interceptor scoped to specific paths.

// 5. express.Router() — modular routes
// routes/users.js
const router = require('express').Router();
router.get('/', (req, res) => res.json([]));
router.get('/:id', (req, res) => res.json({ id: req.params.id }));
module.exports = router;
// express.Router() creates a modular, mountable set of routes — conceptually like splitting REST endpoints into separate @RestController classes, then mounting each at a base path (app.use('/users', router)) similar to a controller's base @RequestMapping.

// app.js
app.use('/users', require('./routes/users'));

// Comparable to splitting @RestController classes by resource, then Spring auto-wiring the @RequestMapping("/users") base path — here you explicitly mount the router at a path prefix.

// 6. Error-handling middleware — special signature
// An error handler has 4 parameters (err, req, res, next) — Express detects this by arity and treats it specially. It must be registered last, after all routes:
app.get('/risky', (req, res, next) => {
  try {
    throw new Error('Something broke');
  } catch (err) {
    next(err); // passes to error-handling middleware
  }
});

// Must be last
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: err.message });
});

// This is your rough equivalent of @ControllerAdvice + @ExceptionHandler — a centralized place to catch errors instead of handling them in every route.

// For async route handlers, errors thrown inside async functions don't automatically get caught by Express (in Express 4 — Express 5 fixes this). You need to catch and forward manually:
app.get('/users/:id', async (req, res, next) => {
  try {
    const user = await getUser(req.params.id);
    res.json(user);
  } catch (err) {
    next(err); // forward to error middleware
  }
});