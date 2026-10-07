import "./App.css";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Layout from "./components/Layout";
import Home from "./components/Home";
import RecipeDetail from "./components/RecipeDetail";
import NewRecipe from "./components/NewRecipe";
import NotFound from "./components/NotFound";
import Recipes from "./components/Recipes";
import { useState } from "react";
import ProtectedRoute from "./components/ProtectedRoute";

function App() {
      const [isLoggedIn, setIsLoggedIn] = useState(false)
  return (
    // <BrowserRouter>
    //   <Routes>
    //     <Route path='/' element={<Home />} />
    //     <Route path='/recipes' element={<Recipes />} />
    //     <Route path='/recipes/:id' element={<RecipeDetail />} />
    //     <Route path='/recipes/new' element={<NewRecipe />} />
    //     <Route path='*' element={<NotFound />} />
    //   </Routes>
    // </BrowserRouter>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Home isLoggedIn={isLoggedIn} setIsLoggedIn={setIsLoggedIn} />} />
          <Route path="recipes" element={<Recipes />} />
          <Route path="recipes/:id" element={<RecipeDetail />} />
          <Route path="recipes/new" element={<ProtectedRoute isLoggedIn={isLoggedIn}><NewRecipe /></ProtectedRoute>} />
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
