import './App.css'
import SearchPokemon from '../components/SearchPokemon'
import SearchPokemonAxios from '../components/SearchPokemonAxios'
import SearchPokemonCustomHook from '../components/SearchPokemonCustomHook'

function App() {

  return (
    <>
    <SearchPokemon />
    <SearchPokemonAxios />
    <SearchPokemonCustomHook />
    </>
  )
}

export default App
