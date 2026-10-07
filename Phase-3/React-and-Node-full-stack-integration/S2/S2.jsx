// 1. Tracing one request, end to end
// Take a "create note" flow. Here's every hop:

// a. User action — form submit in React, onSubmit handler fires.
// b. Client-side request — axios.post('http://localhost:5000/api/notes', {title, content, tags}). This is an HTTP request leaving the browser, hitting a completely separate process (your Express server) over the network (even if both run on localhost, they're different ports = different origins from the browser's perspective — more on this in CORS below).
// c. Express receives it — hits your route, e.g. router.post('/notes', createNote).
// d. Middleware chain runs first — express.json() parses the raw body into req.body; your zod validation middleware checks shape before the handler even runs; error-handling middleware sits ready to catch anything thrown downstream.
// e. Controller/handler — calls Note.create(req.body) (or new Note(...).save()).
// f. Mongoose — validates against the schema (separate from your zod validation — two layers, and that's intentional defense in depth), then serializes to BSON and sends a driver-level command to MongoDB.
// g. MongoDB — actually writes the document to disk, assigns _id if not provided, returns the inserted document (or an ack + you re-fetch, depending on driver version/method).
// h. Mongoose resolves the promise back in your handler with the saved document (a Mongoose Document instance, not a plain object).
// i. Express sends the response — res.status(201).json(savedNote). Note: res.json() calls JSON.stringify under the hood, which does correctly serialize Mongoose documents into plain JSON (it calls .toJSON() internally), including converting _id (an ObjectId) into a string.
// j. Back in the browser — axios/fetch promise resolves, you get res.data (axios) or call .json() (fetch).
// k. React state update — setNotes(prev => [...prev, newNote]), triggering a re-render.

// 2. Cross-Origin Resource Sharing (CORS) — what it actually is
// CORS is a browser security mechanism, not a Node/Express thing per se. 
// The browser enforces same-origin policy: JS running on http://localhost:5173 (your Vite dev server) is, by default, not allowed to read responses from http://localhost:5000 (your Express server) — different port = different origin, even on the same machine.
// Critical nuance: the request still leaves the browser and your Express server still processes it and sends a response. CORS doesn't block the request from happening — it blocks the browser from letting your JS read the response, unless the server explicitly says "these origins are allowed to read my responses" via the Access-Control-Allow-Origin header.
// This is why people are confused seeing the request succeed (200) in the Network tab but get a CORS error in the console — the server did its job; the browser withheld the response from your code.

// Fix, using the cors package:
import cors from 'cors';

app.use(cors({
  origin: 'http://localhost:5173', // your Vite dev server
  credentials: true, // only if you're sending cookies/auth headers
}));
// Wildcard origin: '*' works for dev but breaks if you ever need credentials: true (browsers reject wildcard + credentials together), and you'd want a specific allowlist in production anyway.

// Preflight requests: for non-simple requests (custom headers like Content-Type: application/json on non-GET, or methods like PUT/DELETE), the browser first sends an OPTIONS request automatically, asking "am I allowed to do this?" before sending the real one. The cors middleware handles responding to these automatically — you don't write OPTIONS handlers yourself, but it's worth knowing they exist so you're not confused seeing two requests per action in the Network tab.

// 3. Environment variables & base URLs — keeping two separate apps talking
// Your backend and frontend are two separate processes/deployables, each with its own env concerns.
// Backend (second-brain-backend/.env, loaded via dotenv) — you already have this pattern from Phase 1:
// MONGO_URI=mongodb://localhost:27017/secondbrain
PORT=5000

// Frontend (second-brain-frontend/.env) — different mechanism. Vite doesn't use process.env / dotenv the way Node does; it has its own convention:
// VITE_API_BASE_URL=http://localhost:5000/api

// Must be prefixed VITE_ or Vite won't expose it to client code (deliberate — anything without the prefix is assumed to be a secret that shouldn't leak into client-side bundle).
// Accessed via import.meta.env.VITE_API_BASE_URL, not process.env.
// Baked in at build time, not read at runtime — if you change .env you need to restart the dev server (or rebuild for prod). This trips people up coming from server-side env vars which are read fresh per-process-start but at least don't require a build step.
const API_BASE = import.meta.env.VITE_API_BASE_URL;
axios.get(`${API_BASE}/notes`);
// or: axios.create({ baseURL: API_BASE })

// 4. Two apps, one conceptual system

// Nothing here is new mechanics — it's Express and React each doing exactly what they did in isolation. 
// What's new is the discipline of thinking in two runtimes: browser JS and Node JS look similar but have different globals (import.meta.env vs process.env), different security models (CORS matters to browsers, not to Postman/curl), and communicate only through HTTP, never direct function calls or shared memory. 
// Every bug in this integration phase is really a "which side of the HTTP boundary is this happening on" question.
