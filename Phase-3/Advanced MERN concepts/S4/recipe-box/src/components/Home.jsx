import { Link } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

function Home() {
  const { isLoggedIn, login, logout } = useAuth();
  return (
    <div>
      <h1>Welcome to Recipe App</h1>
      <Link to="/recipes">View Recipes</Link>
      <hr />
      {isLoggedIn ? (
        <button onClick={logout}>Logout</button>
      ) : (
        <button onClick={login}>Login</button>
      )}
    </div>
  );
}

export default Home;