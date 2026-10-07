// 1. Node runtime vs Browser JS:
// Same JS language, different host environment. No window, document, or fetch (well, fetch is now built into modern Node too) — instead you get OS-level APIs: filesystem, networking, process control. Node embeds Google's V8 engine (same one Chrome uses) plus its own C++ bindings for these system APIs.

// 2. The global object & process

console.log(process.argv);      // command-line arguments, like Java's `String[] args`
console.log(process.env.PATH);  // environment variables — like System.getenv()
// process.exit(1);                // like System.exit(1)
// process is your main interface to the running Node instance — env vars, argv, exit codes, stdin/stdout.
// global.someVar = "oops"; // avoid — same "implicit global" trap as last session's bug

// 3. package.json — Node's pom.xml/build.gradle
// {
//   "name": "my-app",
//   "version": "1.0.0",
//   "main": "index.js",
//   "scripts": {
//     "start": "node index.js",
//     "dev": "nodemon index.js"
//   },
//   "dependencies": {
//     "express": "^4.19.2"
//   },
//   "devDependencies": {
//     "nodemon": "^3.1.0"
//   }
// }

// Key difference: node_modules is per-project, not a shared global cache like .m2. Every project gets its own full copy of its dependencies (npm does dedupe/hoist where it can, but conceptually think per-project).

// 4. Semantic Versioning (semver) & ^ / ~ : "express": "^4.19.2"
// ^4.19.2 → allow updates that don't change the first non-zero digit (so up to <5.0.0) — matches minor/patch updates. Closest to Maven's version ranges.
// ~4.19.2 → allow only patch updates (<4.20.0).
// Exact 4.19.2 → locked, no range.

// package-lock.json (auto-generated) pins the exact resolved versions actually installed — equivalent in spirit to Gradle's lockfile / Maven's dependency resolution being reproducible. Always commit it.

// 5. npm commands you'll actually use
// npm init -y                  # create package.json (like archetype:generate, but empty)
// npm install express          # add a dependency, updates package.json
// npm install -D nodemon       # devDependency
// npm install                  # install everything from package.json (like mvn install, no args)
// npm uninstall express
// npm run dev                  # run a custom script
// npx <package>                # run a package without installing it globally (like a one-off Maven plugin invocation)

// 6. CommonJS vs ESM in Node specifically:
// You've used CommonJS already (require/module.exports) — it's the Node default. 

// To use ESM import/export syntax, you must either:
// Add "type": "module" to package.json, or
// Name the file .mjs
// Mixing them in the same project without care causes real errors — this trips a lot of people up, so it's worth knowing it's a config switch, not automatic.

// 7. Running & debugging
// node index.js                 # run
// node --watch index.js         # auto-restart on file change (built-in, Node 18+)
// node inspect index.js         # basic debugger
// console.log / console.error / console.table   # your primary debugging tools, like System.out.println but table/dir variants exist
// nodemon (a popular devDependency) does what --watch does but with more configurability — very common in real projects even though --watch is now built-in.