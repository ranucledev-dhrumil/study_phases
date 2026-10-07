// Express has no built-in validation — req.body is just parsed JSON, anything goes unless you check it yourself. That's what libraries like zod and express-validator solve.

// 2. zod — schema-first validation
// npm install zod

// Define a schema once, reuse it for parsing and validating — closest analog to a Bean Validation DTO, but the schema is defined in code, not annotations:

const { z } = require('zod');

const bookSchema = z.object({
  title: z.string().min(1, "Title is required"),
  author: z.string().min(1, "Author is required"),
  year: z.number().int().positive().optional(),
});

router.post('/books', (req, res, next) => {
  const result = bookSchema.safeParse(req.body);
  if (!result.success) {
    const error = new Error(result.error.issues.map(i => i.message).join(', '));
    error.statusCode = 400;
    return next(error);
  }
  const newBook = { id: nextId(), ...result.data };
  books.push(newBook);
  res.status(201).json(newBook);
});

// safeParse returns { success, data } or { success: false, error } — doesn't throw, so you control the flow. There's also .parse() which throws directly, useful if you want to funnel straight into your error middleware via try/catch.

// As reusable middleware (cleaner, keeps routes thin — closer to how @Valid feels declarative):
function validate(schema) {
  return (req, res, next) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      const error = new Error(result.error.issues.map(i => i.message).join(', '));
      error.statusCode = 400;
      return next(error);
    }
    req.body = result.data; // parsed/coerced data replaces raw body
    next();
  };
}

router.post('/books', validate(bookSchema), (req, res) => {
  // req.body is now guaranteed valid
});

// 3. express-validator — the alternative (chain-based)
// npm install express-validator

const { body, validationResult } = require('express-validator');

router.post('/books',
  body('title').notEmpty().withMessage('Title is required'),
  body('author').notEmpty().withMessage('Author is required'),
  body('year').optional().isInt({ min: 0 }).withMessage('Year must be a positive integer'),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const error = new Error(errors.array().map(e => e.msg).join(', '));
      error.statusCode = 400;
      return next(error);
    }
    // proceed
  }
);

// zod validates against a schema object (you can reuse the same schema for other purposes — e.g. TypeScript inference later); 
// express-validator validates via a chain of middleware per field, more imperative, feels closer to a sequence of individual @AssertTrue-style checks.

// zod has become more popular recently because the schema is a reusable, portable artifact, not tied to Express request objects.

// 4. HTTP status codes:
// Code | Meaning                  | When
// -----|--------------------------|------------------------------------------
// 200  | OK                       | Successful GET / PUT
// 201  | Created                  | Successful POST
// 204  | No Content               | Successful DELETE, no body
// 400  | Bad Request              | Validation failure
// 401  | Unauthorized             | Missing / invalid authentication
// 404  | Not Found                | Resource doesn't exist
// 500  | Internal Server Error    | Uncaught / unexpected error

// 5. Postman basics
// Collections — group related requests (like a folder of .http files or a Postman equivalent of your Swagger UI test set).
// Environments — variables like {{baseUrl}} swapped per environment (local/staging/prod) — same idea as Spring profiles (application-dev.yml vs application-prod.yml), but for request variables instead of app config.
// Request building — set method, URL, headers (e.g. x-api-key, Content-Type: application/json), body (raw JSON).
// Tests tab — write small JS assertions per request (pm.test("Status is 200", () => pm.response.to.have.status(200))) — lightweight version of what you'd do with MockMvc/integration tests in Spring, but manual/exploratory rather than part of your automated test suite.
// Saving responses as examples — documents expected shape, useful for teammates/frontend devs consuming your API (this becomes relevant later when you build the React frontend against this same backend).