import { useState } from "react";

function ControlledForm(){
    const [value, setValue] = useState("")

    const handleSubmit = (e) => {
        e.preventDefault()
        console.log(value)
    }

    return(
        <>
            <form onSubmit={handleSubmit}>
                <input type="text" value = {value} onChange={(e) => {setValue(e.target.value)}}></input>
                <button type="submit">Go</button>
            </form>
        </>
    )
}

export default ControlledForm;