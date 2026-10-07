import "./App.css";
import { useEffect, useState } from "react";
import axios from "axios";

const API_BASE = import.meta.env.VITE_API_BASE_URL;

function App() {
  const [bugs, setBugs] = useState([]);
  const [form, setForm] = useState({ title: "", description: "" });
  const [error, setError] = useState("");

  useEffect(() => {
    async function fetchBugs() {
      try {
        const resp = await axios.get(API_BASE);
        setBugs(resp.data);
      } catch (err) {
        setError(err.message);
      }
    }
    fetchBugs();
  }, []);

  async function createBug(event) {
    event.preventDefault();
    setError("");
    try {
      const resp = await axios.post(API_BASE, form);
      const newBug = resp.data;
      setBugs((prev) => [...prev, newBug]);
      setForm({ title: "", description: "" });
    } catch (err) {
      setError(err.message);
    } 
  }

  async function toggleStatus(bug) {
    const newStatus = bug.status === "open" ? "closed" : "open";
    try {
      const resp = await axios.put(`${API_BASE}/${bug._id}`, {status: newStatus});

      const updatedBug = resp.data;
      setBugs((prev) =>
        prev.map((b) => (b._id === updatedBug._id ? updatedBug : b)),
      );
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <main className="container">
      <h1>Bug Tracker</h1>
      <form onSubmit={createBug} className="card form">
        <input
          value={form.title}
          onChange={(e) => setForm({ ...form, title: e.target.value })}
          placeholder="Bug title"
          required
        />
        <textarea
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
          placeholder="Description"
          rows="4"
          required
        />
        <button type="submit">Create bug</button>
      </form>

      {error && <p className="error">{error}</p>}

      <section>
        <h2>Bugs</h2>
        {bugs.length === 0 ? (
          <p>No bugs yet.</p>
        ) : (
          bugs.map((bug) => (
            <article className="card bug" key={bug._id}>
              <div>
                <h3>{bug.title}</h3>
                <p>{bug.description}</p>
              </div>
              <button onClick={() => toggleStatus(bug)}>{bug.status}</button>
            </article>
          ))
        )}
      </section>
    </main>
  );
}

export default App;
