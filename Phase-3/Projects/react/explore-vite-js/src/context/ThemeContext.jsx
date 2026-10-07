import { createContext, useState } from "react";

const ThemeContext = createContext();

export function ThemeProvider({ children }) {
    const [theme, setTheme] = useState(() => {
        return localStorage.getItem("theme") === "dark";
    });

    function toggle() {
        setTheme((prevTheme) => {
            const newTheme = !prevTheme;
            localStorage.setItem("theme", newTheme ? "dark" : "light");
            return newTheme;
        });
    }

    return (
        <ThemeContext.Provider value={{ theme, toggle }}>
            {children}
        </ThemeContext.Provider>
    );
}

export default ThemeContext;