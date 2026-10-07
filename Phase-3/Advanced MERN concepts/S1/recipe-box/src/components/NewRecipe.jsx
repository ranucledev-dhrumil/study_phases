import { useNavigate } from "react-router-dom";

function NewRecipe() {
    const navigate = useNavigate();
    const handleNavigate = () => {
        console.log("Hello")
        navigate('/recipes')
    }
  return (
    <div>
      <h1>Add Recipe</h1>
      <p>This is where you can add a new recipe.</p>
      <button onClick={handleNavigate}>Save</button>
    </div>
  );
}

export default NewRecipe;