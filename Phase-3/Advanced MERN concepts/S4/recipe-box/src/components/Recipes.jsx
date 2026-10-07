import { useSearchParams } from "react-router-dom";

function Recipes() {
  const [searchParams] = useSearchParams();
  const category = searchParams.get("category");
  const recipes = [
    { id: 1, name: "Chocolate Cake", category: "dessert" },
    { id: 2, name: "Ice Cream", category: "dessert" },
    { id: 3, name: "Pasta", category: "italian" },
    { id: 4, name: "Pizza", category: "italian" },
  ];
  const filteredRecipes = category
    ? recipes.filter((recipe) => recipe.category === category)
    : recipes;

  return (
    <div>
      <h1>Recipes</h1>

      <ul>
        {filteredRecipes.map((recipe) => (
          <li key={recipe.id}>{recipe.name}</li>
        ))}
      </ul>
    </div>
  );
}

export default Recipes;
