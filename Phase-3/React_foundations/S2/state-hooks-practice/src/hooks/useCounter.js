import { useState } from "react"

function useCounter(initial){
    const [count, setCount] = useState(initial)

    const increment = () => {
        setCount(prevCount => prevCount+1)
    }

    const decrement = () => {
        setCount(prevCount => prevCount-1)
    }

    const reset = () => {
        setCount(initial)
    }

    return { count, increment, decrement, reset };
}

export default useCounter