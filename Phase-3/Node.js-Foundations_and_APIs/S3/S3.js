// 1. path — safe path handling
// Never concatenate paths with strings directly — OS differences (/ vs \) will bite you, exactly like in Java you'd use Paths.get() instead of manual string concat.

const path = require('path');

path.join(__dirname, 'data', 'file.txt');   // OS-safe join - __dirname = the directory of the current file (CommonJS only — doesn't exist in ESM without a workaround).
path.resolve('data', 'file.txt');            // absolute path from cwd
path.extname('file.txt');                    // '.txt'
path.basename('/a/b/file.txt');              // 'file.txt'


// 2. fs — filesystem, three flavors of the same API
const fs = require('fs');

// 2.1. Callback style (original, error-first callback pattern)
fs.readFile('file.txt', 'utf8', (err, data) => {
  if (err) return console.error(err);
  console.log(data);
});
// Error-first callback is the classic Node pattern: (err, result) => {} — always check err first. This convention predates promises and you'll still see it in older code and some core APIs.

// 2.2. Sync style (blocks the event loop — avoid in servers!)
const data = fs.readFileSync('file.txt', 'utf8');
// Why avoid readFileSync in a server: it blocks the single thread — the entire event loop stalls, so no other requests can be handled while it reads. In Spring Boot with a thread pool, one blocking call only ties up one thread; in Node, it stalls everything. This is the sharpest contrast with what you know from Spring.

// 2.3. Promise style (modern, use this in async code)
const fsPromises = require('fs/promises');
async function read() {
  const data = await fsPromises.readFile('file.txt', 'utf8');
  console.log(data);
}

// 3. http — the module Express is built on
const http = require('http');

const server = http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/plain' });
  res.end('Hello World');
});

server.listen(3000, () => console.log('Server running on port 3000'));
// This is what's happening underneath Express — Express just wraps this with routing, middleware, and conveniences. Worth seeing raw once so Express doesn't feel like magic.

// 4. events — EventEmitter (Node's core pub/sub)
const EventEmitter = require('events');
const emitter = new EventEmitter();

emitter.on('greet', (name) => console.log(`Hello, ${name}`));
emitter.emit('greet', 'Priya'); // triggers the listener synchronously 
// A lot of Node's core APIs are built on this pattern (streams, http requests/responses, process itself). Conceptually similar to the Observer pattern / Spring's ApplicationEventPublisher, but built into the language runtime rather than a framework feature.  

// 5. Streams — conceptual level only
// Instead of loading a whole file into memory (readFile), streams process data in chunks as it arrives — critical for large files or network data.
const readStream = fs.createReadStream('bigfile.txt');
readStream.on('data', (chunk) => console.log('Got chunk:', chunk.length));
readStream.on('end', () => console.log('Done'));
// Think of it like Java's InputStream/BufferedReader — same idea (bounded memory, chunked processing), different API shape. You won't build much with raw streams yet, but Express request bodies and file uploads work this way under the hood.

// 6. Async patterns in practice
// Sequential vs parallel awaits — a common perf mistake:
// Sequential — slower, each waits for the previous
const a = await delay(1000);
const b = await delay(1000);
// Total: ~2000ms

// Parallel — faster, both run at once
// const [a, b] = await Promise.all([delay(1000), delay(1000)]);
// Total: ~1000ms

// Promise.all fails fast — if any promise rejects, the whole thing rejects immediately. Promise.allSettled waits for all, giving you a status for each regardless of success/failure — useful when partial failures are okay.

// Error handling in async/await — always wrap in try/catch, since a rejected promise inside an async function that isn't caught will throw an unhandled promise rejection:
async function getUser(id) {
  try {
    const res = await fetch(`/users/${id}`);
    if (!res.ok) throw new Error(`Status ${res.status}`);
    return await res.json();
  } catch (err) {
    console.error('Failed to fetch user:', err.message);
    throw err; // re-throw if caller needs to know too
  }
}