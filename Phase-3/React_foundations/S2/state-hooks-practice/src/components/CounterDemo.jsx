import useCounter from "../hooks/useCounter"

function CounterDemo({initial}) {
    const {count, increment, decrement, reset} = useCounter(initial)

    return(
        <>
        <p>The Current Count is {count}</p>
        <button onClick={increment}>Increment the counter</button>
        <button onClick={decrement}>Decrement the counter</button>
        <button onClick={reset}>Reset the counter</button>
        </>
    )
}

export default CounterDemo