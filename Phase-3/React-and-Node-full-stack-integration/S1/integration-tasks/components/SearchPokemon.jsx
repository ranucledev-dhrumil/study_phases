import { useState, useRef } from "react";
import "./SearchPokemon.css";

function SearchPokemon() {
  const [searchQuery, setSearchQuery] = useState("");
  const [pokemon, setPokemon] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const controllerRef = useRef(null);

  const searchPokemon = async (e) => {
    e.preventDefault();

    if (!searchQuery.trim()) {
      setError("Please enter a Pokémon name or ID.");
      setPokemon(null);
      return;
    }

    // Cancel any previous request
    controllerRef.current?.abort();

    const controller = new AbortController();
    controllerRef.current = controller;

    setLoading(true);
    setError(null);
    setPokemon(null);

    try {
      const res = await fetch(
        `https://pokeapi.co/api/v2/pokemon/${searchQuery
          .trim()
          .toLowerCase()}`,
        {
          signal: controller.signal,
        }
      );

      if (!res.ok) {
        if (res.status === 404) {
          throw new Error("Pokémon not found.");
        }

        throw new Error(`HTTP ${res.status}`);
      }

      const data = await res.json();

      setPokemon(data);
    } catch (err) {
      if (err.name === "AbortError") return;

      setError(
        err instanceof TypeError
          ? "Network error. Please check your connection."
          : err.message
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="pokemon-page">
      <section className="pokemon-container">

        <header className="pokemon-header">
          <p className="eyebrow">Pokédex</p>
          <h1>Search Pokémon</h1>
          <p className="subtitle">
            Search for a Pokémon by name or ID
          </p>
        </header>

        <form className="search-form" onSubmit={searchPokemon}>
          <div className="input-wrapper">
            <span className="search-icon">⌕</span>

            <input
              type="text"
              name="searchQuery"
              id="searchQuery"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="e.g. pikachu or 25"
              autoComplete="off"
            />
          </div>

          <button
            type="submit"
            className="search-button"
            disabled={loading}
          >
            {loading ? "Searching..." : "Search"}
          </button>
        </form>

        {loading && (
          <div className="status-card loading-card">
            <div className="spinner"></div>
            <p>Searching for Pokémon...</p>
          </div>
        )}

        {error && !loading && (
          <div className="status-card error-card">
            <span className="error-icon">!</span>
            <div>
              <strong>Oops!</strong>
              <p>{error}</p>
            </div>
          </div>
        )}

        {pokemon && !loading && !error && (
          <article className="pokemon-card">

            <div className="pokemon-image-section">
              <span className="pokemon-id">
                #{String(pokemon.id).padStart(3, "0")}
              </span>

              <img
                className="pokemon-image"
                src={pokemon.sprites.front_default}
                alt={pokemon.name}
              />
            </div>

            <div className="pokemon-info">
              <p className="pokemon-label">Pokémon</p>

              <h2>{pokemon.name}</h2>

              <div className="types-section">
                <span className="section-label">Types</span>

                <div className="type-list">
                  {pokemon.types.map((typeInfo) => (
                    <span
                      className={`type-badge type-${typeInfo.type.name}`}
                      key={typeInfo.type.name}
                    >
                      {typeInfo.type.name}
                    </span>
                  ))}
                </div>
              </div>
            </div>

          </article>
        )}

      </section>
    </main>
  );
}

export default SearchPokemon;