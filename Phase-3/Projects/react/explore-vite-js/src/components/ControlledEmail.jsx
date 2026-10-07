import { useState } from "react";

function ControlledEmail() {
  const [email, setEmail] = useState("");

  const handleChange = (e) => {
    setEmail(e.target.value);
    console.log(email);
  };

  return (
    <>
      <input
        type="email"
        value={email}
        onChange={handleChange}
        className="bg-grey border-2"
        placeholder="Enter email"
      ></input>
    </>
  );
}

export default ControlledEmail;
