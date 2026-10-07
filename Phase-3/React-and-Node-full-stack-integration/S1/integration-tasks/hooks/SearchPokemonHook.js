import { useRef, useState } from "react";

function usePokemon() {
    const [searchQuery, setSearchQuery] = useState("");
    const [pokemon, setPokemon] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const controllerRef = useRef(null);

    const searchPokemon = async (e) => {
        e.preventDefault();

        if (!searchQuery.trim()) {
            setError("Please enter a Pokémon name or ID.");
            return;
        }

        controllerRef.current?.abort();
        const controller = new AbortController();
        controllerRef.current = controller;

        setLoading(true);
        setError(null);
        setPokemon(null);

        try {
            const res = await fetch(
                `https://pokeapi.co/api/v2/pokemon/${searchQuery.trim().toLowerCase()}`,
                { signal: controller.signal }
            );

            if (!res.ok) {
                if (res.status === 404) {
                    throw new Error("Pokémon not found.");
                }
                throw new Error(`HTTP ${res.status}`);
            }
            const data = await res.json();
            setPokemon(data);
            return () => controller.abort();
        } catch (err) {
            if (err.name === "AbortError") { return; }
            setError(
                err instanceof TypeError
                    ? "Network error. Please check your connection."
                    : err.message,
            );
        } finally {
            setLoading(false);
        }

    };
    return {
        searchQuery, setSearchQuery, pokemon, loading, error, searchPokemon,
    };
}

export default usePokemon;