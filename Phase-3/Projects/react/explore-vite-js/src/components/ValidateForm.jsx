import { useState } from "react";

function ValidateForm() {
  const [error, setError] = useState("");
  const [username, setUsername] = useState("");
  const [number, setNumber] = useState(0);

  function validate(e) {
    e.preventDefault();

    if (!username) {
      setError(error.message);
      return
    }
    if (!number) {
      setError(error.message);
      return
    }

    setError("")
  }
  return (
    <>
      {error && <p className="error">{error}</p>}
      <form onSubmit={validate}>
        <label>Name*</label>
        <input
          type="text"
          name="username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          placeholder="Enter Name"
        />
        <label>Phone*</label>
        <input
          type="number"
          name="phone"
          value={number}
          onChange={(e) => setNumber(e.target.value)}
          placeholder="Enter Number"
        />
        <button type="submit"></button>
      </form>
    </>
  );
}

export default ValidateForm;
