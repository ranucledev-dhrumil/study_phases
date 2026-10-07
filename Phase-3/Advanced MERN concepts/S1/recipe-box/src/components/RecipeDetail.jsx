import { useParams } from "react-router-dom";

function RecipeDetail() {
  const { id } = useParams();

  return (
    <div>
      <h1>Recipe Details</h1>
      <p>Recipe ID: {id}</p>
    </div>
  );
}

export default RecipeDetail;