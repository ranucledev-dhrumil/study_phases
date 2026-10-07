frontend:
import { useEffect, useState } from "react";
import axios from "axios";

const API_BASE = import.meta.env.VITE_API_BASE_URL;

function FetchUsingAxios() {
  const [users, setUsers] = useState([]);

  const [editingId, setEditingId] = useState(null);
  const [editName, setEditName] = useState("");
  const [editAge, setEditAge] = useState("");

  useEffect(() => {
    async function fetchData() {
      try {
        const resp = await axios.get(`${API_BASE}/users`);
        setUsers(resp.data);
      } catch (error) {
        console.error(error);
      }
    }
    fetchData();
  }, []);

  function startEditing(user) {
    setEditingId(user.id);
    setEditName(user.name);
    setEditAge(user.age);
  }

  async function handleUpdate(userId) {
    try {
      const resp = await axios.put(`${API_BASE}/users/${userId}`, {
        name: editName,
        age: editAge
      });
      setUsers((prev) =>
        prev.map((user) => (user.id === userId ? resp.data.user : user)),
      );
      setEditingId(null);
      setEditName("");
      setEditAge("");
    } catch (error) {
      console.error(error);
    }
  }

  return (
    <>
      {users.length === 0 ? (
        <p>No Users</p>
      ) : (
        <ul>
          {users.map((user) => (
            <div key={user.id} className=" p-2 ">
              {editingId === user.id ? (
                <>
                  <input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="border-2"
                  />
                  <input
                    type="number"
                    value={editAge}
                    onChange={(e) => setEditAge(e.target.value)}
                    className="border-2"
                  />
                  <button onClick={() => handleUpdate(user.id)}>Save</button>
                  <button onClick={() => setEditingId(null)}> Cancel</button>
                </>
              ) : (
                <div className="border-2 p-4">
                  <li key={user.id}>
                    Name: {user.name}, Age: {user.age}
                  </li>
                  <hr />
                  <button onClick={() => startEditing(user)}>Edit</button>
                </div>
              )}
            </div>
          ))}
        </ul>
      )}
    </>
  );
}

export default FetchUsingAxios;

backend:
import express from "express";

const router = express.Router()
const app = express();
const items= [
    { id: 1, name: "Table" },
    { id: 2, name: "Lamp" },
    { id: 3, name: "Fan" },
];

    
app.use(express.json())

router.get('/api/items', (req, resp) => {
    resp.json(items)
})

// POST REQUEST
router.post('/api/items', (req, resp) => {
    items.push(req.body)
    resp.json(items)
})

// PUT REQUEST
router.put("/users/:id", async (req, resp) => {
    const id = req.params.id
    const { name, age } = req.body

    const foundIndex = users.findIndex(u => u.id == id);
    if (foundIndex === -1) return resp.status(404).json({ message: 'User not found' });
    users[foundIndex].name = name;
    users[foundIndex].age = age;
    resp.json({ user: users[foundIndex] })
})

app.use('/', router)
app.listen(3000, () => console.log("Server Running on 3000"))