import { useState } from "react";
import axios from "axios";

function SearchPokemon() {
  const [searchQuery, setSearchQuery] = useState("");
  const [pokemon, setPokemon] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const searchPokemon = async (e) => {
    e.preventDefault();

    if (!searchQuery.trim()) {
      setError("Please enter a Pokémon name or ID.");
      return;
    }

    setLoading(true);
    setError(null);
    setPokemon(null);

    try {
      const controller = new AbortController();
      const res = await axios.get(
        `https://pokeapi.co/api/v2/pokemon/${searchQuery.trim().toLowerCase()}`,
        { signal: controller.signal },
      );

      // Axios already parses the JSON response
      setPokemon(res.data);
      return () => controller.abort();
    } catch (err) {
      if (err.response?.status === 404) {
        setError("Pokémon not found.");
      } else if (err.request) {
        setError("Network error. Please check your connection.");
      } else {
        setError("Something went wrong. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div>
        <form onSubmit={searchPokemon}>
          <input
            type="text"
            name="searchQuery"
            id="searchQuery"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Enter Pokémon name or ID"
          />
          <button type="submit">Search</button>
        </form>
        {loading && <p>Loading...</p>}
        {error && <p>Error: {error}</p>}

        {pokemon && (
          <div>
            {" "}
            <h2>{pokemon.name}</h2>{" "}
            <img src={pokemon.sprites.front_default} alt={pokemon.name} />{" "}
            <h3>Types:</h3>{" "}
            <ul>
              {" "}
              {pokemon.types.map((typeInfo) => (
                <li key={typeInfo.type.name}> {typeInfo.type.name} </li>
              ))}{" "}
            </ul>{" "}
          </div>
        )}
      </div>
    </>
  );
}

export default SearchPokemon;
