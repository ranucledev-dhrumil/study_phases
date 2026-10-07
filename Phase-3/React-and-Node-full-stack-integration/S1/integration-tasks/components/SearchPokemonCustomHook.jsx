import usePokemon from "../hooks/SearchPokemonHook";

function SearchPokemon() {
  const {
    searchQuery,
    setSearchQuery,
    pokemon,
    loading,
    error,
    searchPokemon,
  } = usePokemon();

  return (
    <div>
      <form onSubmit={searchPokemon}>
        <input
          type="text"
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
          <h2>{pokemon.name}</h2>

          <img
            src={pokemon.sprites.front_default}
            alt={pokemon.name}
          />

          <h3>Types:</h3>

          <ul>
            {pokemon.types.map((typeInfo) => (
              <li key={typeInfo.type.name}>
                {typeInfo.type.name}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

export default SearchPokemon;