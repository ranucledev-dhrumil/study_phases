import { useEffect, useState } from "react";
import { useContext } from "react";
import ThemeContext from "../context/ThemeContext";
import axios from "axios";

const API_BASE = import.meta.env.VITE_API_BASE_URL;

function FetchUsingAxios() {
  const [users, setUsers] = useState([]);
  const { theme, toggle } = useContext(ThemeContext);

  const [editingId, setEditingId] = useState(null);
  const [editName, setEditName] = useState("");
  const [editAge, setEditAge] = useState("");

  const [error, setError] = useState("");

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

  useEffect(() => {
    let shouldBeDark = true;
    if(users.length>0){!shouldBeDark}

    if(shouldBeDark !== theme){
      toggle()
    }
  
  },[theme, toggle, users.length])

  if (!users) {
    toggle();
  }
  function startEditing(user) {
    setEditingId(user.id);
    setEditName(user.name);
    setEditAge(user.age);
  }

  async function handleDelete(userId) {
    try {
      await axios.delete(`${API_BASE}/users/${userId}`);
      setUsers((prev) => prev.filter((user) => user.id !== userId));
    } catch (error) {
      setError(error.message);
    }
  }

  async function handleUpdate(userId) {
    try {
      const resp = await axios.put(`${API_BASE}/users/${userId}`, {
        name: editName,
        age: editAge,
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
      {error && <p className="error">{error}</p>}
      <p>Current theme: {theme ? "dark" : "light"}</p>
      {users.length === 0 ? (
        <p>No Users Found</p>
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
                  <hr />
                  <button onClick={() => handleDelete(user.id)}>Delete</button>
                  <hr />
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
