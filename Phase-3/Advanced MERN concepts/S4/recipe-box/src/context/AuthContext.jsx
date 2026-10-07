import { createContext, useState } from "react";

const   AuthContext = createContext();

export function AuthProvider({ children }) {
  const [isLoggedIn, setIsLoggedIn] = useState(() => {
    return localStorage.getItem("isLoggedIn") === "true";
  });

  function login() {
    setIsLoggedIn(true);
    localStorage.setItem("isLoggedIn", "true");
  }

  function logout() {
    setIsLoggedIn(false);
    localStorage.setItem("isLoggedIn", "false");
  }

  return (
    <AuthContext.Provider value={{ isLoggedIn, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export default AuthContext;