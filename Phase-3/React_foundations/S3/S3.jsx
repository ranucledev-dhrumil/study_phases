// 1. Controlled vs Uncontrolled inputs
// You've already used a controlled input in ControlledForm — React state is the single source of truth, and the input's value is always driven from state.
const [value, setValue] = useState("");
<input value={value} onChange={(e) => setValue(e.target.value)} />
// Every keystroke: onChange fires → state updates → component re-renders → input's value reflects the new state. This is a one-way loop, fully React-owned.

// Uncontrolled inputs let the DOM manage its own state, and you read the value only when needed (e.g., on submit), via a ref:
import { useRef } from "react";

function UncontrolledForm() {
  const inputRef = useRef(null);

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log(inputRef.current.value); // read directly from the DOM node
  };

  return (
    <form onSubmit={handleSubmit}>
      <input ref={inputRef} defaultValue="" />
      <button type="submit">Go</button>
    </form>
  );
}
// useRef gives you a mutable object ({ current: ... }) that persists across renders without triggering re-renders when it changes — different from useState, which always re-renders. ref={inputRef} attaches it directly to the DOM node.

// When to use which:
// Controlled: default choice — needed for validation-as-you-type, conditionally disabling submit, syncing multiple inputs, or anything reactive to each keystroke.
// Uncontrolled: simpler for "just grab the value on submit" cases, file inputs (which must be uncontrolled — you can't programmatically set a file input's value), or integrating with non-React code.

// 2. Multi-field forms
// Instead of one useState per field, a common pattern is a single state object:
function NoteForm() {
  const [formData, setFormData] = useState({ title: "", content: "" });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  return (
    <form>
      <input name="title" value={formData.title} onChange={handleChange} />
      <textarea name="content" value={formData.content} onChange={handleChange} />
    </form>
  );
}

// Key ideas:
// name attribute on each input matches a key in formData — lets one handleChange handle every field via computed property name [name]: value.
// { ...prev, [name]: value } — spread the previous object, then overwrite just the changed key. Never mutate formData directly (formData.title = value won't trigger a re-render and breaks React's change-detection, which relies on getting a new object reference).

// 3. List rendering + key (the thing we deferred from Session 1)
{items.map(item => (
  <li key={item.id}>{item.name}</li>
))}
// key tells React which array item is which across re-renders, so it can match old DOM nodes to new ones instead of re-rendering the whole list from scratch. This matters most when the list can reorder, filter, or have items inserted/removed in the middle.

// Rules for keys:
// Must be unique among siblings (doesn't need to be globally unique, just unique in that specific list).
// Must be stable — the same item should get the same key across renders. A database _id or similar stable identifier is ideal.
// Don't use array index as key if the list can reorder, be filtered, or have items inserted/deleted — index-as-key causes React to misattribute state to the wrong item after a reorder (classic bug: an input's typed text "jumps" to a different row after deleting an earlier row, because React matched the wrong DOM node by position). Index-as-key is only safe for static lists that never reorder/filter/change length.

// 4. Conditional rendering (formalizing what you've already used)
// You already used showTimers && (...) in Session 2. The full toolkit:
// && — render or nothing
{isLoggedIn && <p>Welcome back</p>}

// ternary — render A or B
{isLoggedIn ? <Dashboard /> : <LoginForm />}

// early return in the component itself
function UserPanel({ user }) {
  if (!user) return <p>Loading...</p>;
  return <div>{user.name}</div>;
}// && — render or nothing
{isLoggedIn && <p>Welcome back</p>}

// ternary — render A or B
{isLoggedIn ? <Dashboard /> : <LoginForm />}

// early return in the component itself
function UserPanel({ user }) {
  if (!user) return <p>Loading...</p>;
  return <div>{user.name}</div>;
}
// Gotcha with &&: if the left side is 0 (a valid falsy number, not false), React will actually render the literal 0 on the page, since 0 is a "renderable" falsy value unlike false/null/undefined. 
// Common bug: {count && <Badge>{count}</Badge>} renders a stray 0 when count is 0. Fix: {count > 0 && ...} or explicit boolean coercion {!!count && ...}.

// 5. Lifting state up
// When two sibling components need to share/sync state, the fix is to move that state to their closest common parent, and pass it down via props (data down, callbacks up):
function App() {
  const [notes, setNotes] = useState([]);

  const addNote = (note) => setNotes(prev => [...prev, note]);

  return (
    <>
      <NoteForm onAddNote={addNote} />
      <NoteList notes={notes} />
    </>
  );
}

function NoteForm({ onAddNote }) {
  // ...on submit, calls onAddNote(newNote)
}

function NoteList({ notes }) {
  return notes.map(note => <NoteCard key={note.id} note={note} />);
}

// NoteForm and NoteList don't talk to each other directly — they're siblings, each only knows about props passed down from App. App owns the state and passes a setter-wrapping callback (addNote) down to the child that needs to trigger a change, and the data itself down to the child that needs to display it.
// 6. Prop drilling (the pain this sets up)
// If NoteList were deeply nested (e.g., App → Layout → Sidebar → NoteList), passing notes down through Layout and Sidebar — even though neither of them uses notes themselves, just passes it through — is called prop drilling. It works, but becomes unwieldy as the tree gets deep or as more pieces of shared state accumulate. This is the exact pain that the Context API solves (not covered in this phase — that's a later MERN phase) by letting deeply nested components read shared state without every intermediate component manually forwarding it.
// Prop drilling is passing a prop down through multiple layers of components that don't themselves need it, purely to forward it to a deeply nested descendant. The Context API (a later topic) lets deeply nested components read shared state directly without every intermediate component manually forwarding it.