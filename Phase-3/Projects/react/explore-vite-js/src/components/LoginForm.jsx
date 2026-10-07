import axios from "axios";
import { useState } from "react";

function LoginForm() {
  const [formData, setFormData] = useState({ username: "", pass: "" });
  const [message, setMessage] = useState("");

  const API_BASE = import.meta.env.VITE_API_BASE_URL;

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const resp = await axios.post(`${API_BASE}/login`, formData);
      const data = resp.data;

      if (!resp.ok) {
        setMessage(data.message);
        setMessage("Login successful!");
        return;
      }

      localStorage.setItem("token", data.token);
    } catch (error) {
      console.error(error);
      setMessage("Something went wrong");
    }
  };
  return (
    <>
      <form onSubmit={handleSubmit}>
        <input
          type="email"
          name="email"
          placeholder="Email"
          value={formData.email}
          onChange={handleChange}
        />
        <input
          type="password"
          name="password"
          placeholder="Password"
          value={formData.password}
          onChange={handleChange}
        />
        <button type="submit">Log In</button>
      </form>
      <p>{message}</p>
    </>
  );
}

export default LoginForm;
