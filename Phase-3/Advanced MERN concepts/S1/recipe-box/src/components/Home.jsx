import { Link } from "react-router-dom";

function Home({ isLoggedIn, setIsLoggedIn }) {

  return (
    <div>
      <h1>Welcome to Recipe App</h1>
      <Link to="/recipes">View Recipes</Link>
      <hr />
      <button onClick={() => setIsLoggedIn(!isLoggedIn)}>{isLoggedIn? "Log Out": "LogIn"}</button>
    </div>
  );
}

export default Home;