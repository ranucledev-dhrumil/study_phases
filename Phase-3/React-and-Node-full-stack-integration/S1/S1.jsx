// 1. Why useEffect for data fetching?
// You know Spring Boot — think of a React component's render as a stateless HTTP handler that runs every time. useEffect is the escape hatch for anything that isn't pure rendering: side effects like network calls, subscriptions, timers, DOM manipulation.

useEffect(() => {
  // side effect code
}, [dependencies]);

// No dependency array → runs after every render.
// [] → runs once, after the first render (mount).
// [x, y] → runs after mount, and again whenever x or y changes between renders.

// For "fetch data when this component loads," you want [] (or [id] if you're fetching by an id that can change, e.g. a detail page).'
// Common trap: forgetting the dependency array entirely → infinite fetch loop, because setting state after fetch triggers a re-render, which re-runs the effect, which fetches again, forever.

// 2. The basic pattern:
function NoteList() {
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    setLoading(true);
    fetch("/api/notes")
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then((data) => setNotes(data))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p>Loading...</p>;
  if (error) return <p>Error: {error}</p>;
  return (
    <ul>
      {notes.map((n) => (
        <li key={n._id}>{n.title}</li>
      ))}
    </ul>
  );
}
// Note: fetch does not throw on 4xx/5xx — you have to check res.ok yourself and throw manually. This trips up people coming from Spring's RestTemplate/WebClient, which throw on non-2xx by default.

// 3. fetch vs axios — side by side
// fetch (built-in, no install)
async function getNotes() {
  const res = await fetch("/api/notes");
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

async function createNote(note) {
  const res = await fetch("/api/notes", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(note),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

// axios (npm install axios)
import axios from "axios";

async function getNotes() {
  const res = await axios.get("/api/notes");
  return res.data; // already parsed JSON
}

async function createNote(note) {
  const res = await axios.post("/api/notes", note); // auto JSON.stringify + header
  return res.data;
}

// +-----------------------------+-----------------------------------------+------------------------------------------------------------------+
// | Feature                     | fetch                                   | axios                                                            |
// +-----------------------------+-----------------------------------------+------------------------------------------------------------------+
// | Install                     | Built-in                                | npm package                                                      |
// | JSON parsing                | Manual: response.json()                 | Automatic: response.data                                         |
// | Error on 4xx/5xx            | No — must check response.ok             | Yes — throws and can be caught in catch/try-catch                |
// | Request/response intercept. | Not built-in                            | Built-in: axios.interceptors                                     |
// | Cancel requests             | AbortController (native)                | AbortController supported; older CancelToken also available      |
// | Base URL config             | Manual string concat or wrapper         | axios.create({ baseURL: ... })                                   |
// | Timeout                     | Manual: AbortController + setTimeout    | Built-in timeout option                                          |
// | Auto-serialize body         | No — use JSON.stringify() yourself      | Yes — automatically serializes request data                      |
// +-----------------------------+-----------------------------------------+------------------------------------------------------------------+

// Axios throwing on non-2xx is the biggest day-to-day difference — it means your .catch/try-catch block reliably catches all failures (network + HTTP errors), whereas with fetch you have to remember to check res.ok or bugs silently slip through (e.g. a 404 that "succeeds" as far as fetch is concerned and you try to render whatever error JSON came back as if it were data).

// 4. Loading / error / success state — the three-state pattern

// Almost every fetch needs three pieces of state, because a component can be in exactly one of:

// loading: request in flight, show a spinner/skeleton
// error: request failed, show a message (and often a retry button)
// success: data is present, render it

// A subtlety: what happens on a second fetch (e.g., re-fetching after a filter change)? Do you clear old data and show the loading state again, or keep stale data visible while a background refresh happens? Both are legitimate UX choices — libraries like React Query formalize this as "stale-while-revalidate." For now, simplest correct approach: reset error to null and set loading true at the start of every fetch attempt, so a previous error doesn't linger after a retry succeeds.

// 5. AbortController & race conditions
// Here's the bug this solves. Suppose a component fetches based on a prop that can change quickly (e.g., a search box firing a request per keystroke, or navigating quickly between two note IDs):
useEffect(() => {
  fetch(`/api/notes/${id}`)
    .then((res) => res.json())
    .then(setNote);
}, [id]);

// If id changes from 1 to 2 before the fetch for 1 finishes, you get two in-flight requests. If the request for 1 happens to resolve after the request for 2 (network timing is not guaranteed to match request order), you'll overwrite the correct note-2 data with stale note-1 data. This is a race condition.

// Also: if the component unmounts while a fetch is pending (user navigates away) and you then call setNote(...), React warns about setting state on an unmounted component (or in newer React, it's mostly harmless but still wasted work and a smell).

// Fix: AbortController, cleaned up via the effect's cleanup function:
useEffect(() => {
  const controller = new AbortController();

  setLoading(true);
  fetch(`/api/notes/${id}`, { signal: controller.signal })
    .then((res) => {
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return res.json();
    })
    .then((data) => setNote(data))
    .catch((err) => {
      if (err.name === "AbortError") return; // expected, ignore
      setError(err.message);
    })
    .finally(() => setLoading(false));

  return () => controller.abort(); // cleanup: runs before next effect run, and on unmount
}, [id]);

// The cleanup function (the function you return from the effect) runs right before React re-runs the effect (i.e., when id changes again) and when the component unmounts. Calling controller.abort() cancels the in-flight request tied to that effect run, so a stale response can never overwrite newer state.

// With axios, same idea — pass { signal: controller.signal } as part of the config object; axios supports the native AbortSignal too now, so the pattern is identical.

// 6. Putting it together — a small custom hook, This is a common abstraction once you've written this pattern a few times:

function useFetch(url) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError(null);

    fetch(url, { signal: controller.signal })
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then(setData)
      .catch((err) => {
        if (err.name !== "AbortError") setError(err.message);
      })
      .finally(() => setLoading(false));

    return () => controller.abort();
  }, [url]);

  return { data, loading, error };
}
