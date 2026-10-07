// 1. What React actually is:
// React is a JS library for building UI out of components — reusable, self-contained pieces that describe what a chunk of UI should look like given some data. Instead of manually querying and mutating the DOM (like you might with vanilla JS), you describe the desired UI state, and React figures out how to update the actual DOM to match.

// 2. JSX:
// JSX is syntax sugar that lets you write HTML-like markup inside JS:
function Greeting() {
  return <h1>Hello, world</h1>;
}

// This isn't actually HTML — it compiles (via Babel/esbuild) into plain JS function calls:
function Greeting() {
  return React.createElement('h1', null, 'Hello, world');
}

// One root element per return (or use a Fragment <>...</> to avoid an extra wrapper div).
// className not class, htmlFor not for`` — because these are JS objects, and class/for` are reserved words in JS.
// Curly braces {} embed any JS expression: <p>{user.name}</p>, <p>{2 + 2}</p>. You cannot embed statements (no if, no for loops directly) — only expressions. This is why conditional rendering uses ternaries or && rather than if blocks inline (more in Session 3).
// Self-closing tags required for void elements: <img />, <br />, <input />.
// Attributes are camelCase: onClick, tabIndex, readOnly.

// 3. Components
// Two ways to define them - since you know Java/OOP, think of these as two different syntaxes for "a class/function that produces UI," not fundamentally different concepts (yet — hooks will make function components structurally different, covered in Session 2).

// Function component (the modern standard):
function Welcome(props) {
  return <h1>Hello, {props.name}</h1>;
}

// Class component (legacy, you'll see it in older code — we'll go deep on this in Session 2 alongside hooks):
class Welcome extends React.Component {
  render() {
    return <h1>Hello, {this.props.name}</h1>;
  }
}

// Components must be capitalized (Welcome, not welcome) — React uses this convention to distinguish your components from native HTML tags (<div> vs <Welcome>) in JSX.

// 4. Props:
// Props are how data flows into a component from its parent — read-only, analogous to method parameters. A component should never mutate its own props (this is React's version of immutability discipline — similar spirit to why you'd avoid mutating a method argument unexpectedly in Java).

function UserCard({ name, age }) {  // destructuring props directly in the signature
  return (
    <div>
      <p>{name}</p>
      <p>{age}</p>
    </div>
  );
}

// usage
<UserCard name="Priya" age={28} />

// children is a special prop — whatever you nest inside a component's JSX tags:
function Card({ children }) {
  return <div className="card">{children}</div>;
}

<Card><p>This becomes props.children</p></Card>

// 5. Component composition:
// React UIs are trees of components — a top-level App renders child components, which render their own children, etc. Composition (nesting/combining smaller components) is preferred over inheritance-style reuse.
// note: React strongly favors composition over inheritance — you almost never extend a component class to reuse UI logic. Instead you compose smaller components together, or (later) extract shared logic into custom hooks.

// 6. Virtual DOM & reconciliation
// When state/props change, React doesn't directly mutate the real DOM. It builds a lightweight in-memory representation (the virtual DOM), diffs the new version against the previous one, and applies only the minimal set of real DOM updates needed. You don't write this diffing logic — but understanding it explains why React asks you to declare "what UI should look like for this data" rather than imperatively saying "now update this DOM node."

// 7. Project structure conventions (Vite + React)
// src/
//   main.jsx        # entry point, mounts <App /> into index.html's #root
//   App.jsx         # root component
//   components/     # reusable components, often one file per component
//   assets/         # images, static files
// index.html        # has <div id="root"></div>
// Common convention: one component per file, filename matches component name (UserCard.jsx exports UserCard).
