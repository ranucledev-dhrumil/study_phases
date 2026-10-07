// prop drilling: passing a value through components that don't need it themselves, just to get it to a descendant that does. It gets worse as the tree grows — every intermediate component has to know about a prop it never actually uses.

// Context API lets you put a value "in the air" at some point in the tree, and any descendant can read it directly — no drilling required.

// Core API: createContext + Provider + useContext

// AuthContext.jsx
import { createContext, useContext, useState } from 'react';

const AuthContext = createContext(null); // default value, used if no Provider is above

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);

  const login = (userData, jwt) => {
    setUser(userData);
    setToken(jwt);
  };

  const logout = () => {
    setUser(null);
    setToken(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

// Custom hook — the conventional way to consume it
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
}

// main.jsx or App.jsx — wrap once, near the root
<AuthProvider>
  <App />
</AuthProvider>

// Any descendant, no matter how deep
function Navbar() {
  const { user, logout } = useAuth();
  return user ? <button onClick={logout}>Logout ({user.email})</button> : <Link to="/login">Login</Link>;
}
// Notice: Navbar never received user/logout as props from its parent. It reached straight into the Provider. This directly replaces your Recipe Box isLoggedIn prop-drilling pattern.

// The custom hook pattern — why bother?
// You could call useContext(AuthContext) directly everywhere, but wrapping it in useAuth() give/s you:

// A single import (useAuth) instead of importing both useContext and AuthContext everywhere.
// A guard clause — if someone uses useAuth() outside the <AuthProvider>, they get a clear error immediately instead of a silent null and a confusing crash three lines later.

// This is a near-universal convention — you'll see useAuth(), useTheme(), useCart() etc. as the idiomatic way any Context gets consumed.

// Multiple contexts, and where to put the Provider
// You're not limited to one Context. A common setup:
<AuthProvider>
  <ThemeProvider>
    <App />
  </ThemeProvider>
</AuthProvider>

// Where you place a Provider matters: it only makes its value available to components below it in the tree. If Navbar is a sibling of AuthProvider rather than a child, it won't have access. This trips people up when they wrap only <Routes> instead of the whole app — anything outside that wrapper (like a top-level layout component) can't consume the context.

// Context + useEffect: syncing to localStorage
// A very common real pattern — persist auth state across page refreshes:
export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem('token')); // lazy init from storage
  const [user, setUser] = useState(() => {
    const stored = localStorage.getItem('user');
    return stored ? JSON.parse(stored) : null;
  });

  const login = (userData, jwt) => {
    setUser(userData);
    setToken(jwt);
    localStorage.setItem('token', jwt);
    localStorage.setItem('user', JSON.stringify(userData));
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
// The lazy initializer (() => localStorage.getItem('token')) means on a fresh page load, React state starts already populated from storage — so a refresh doesn't log the user out, even though all component state was just wiped and rebuilt from scratch.

// Tying it back to ProtectedRoute
// Now your Session 1 ProtectedRoute becomes clean, no prop drilling:
function ProtectedRoute({ children }) {
  const { token } = useAuth();
  if (!token) return <Navigate to="/login" replace />;
  return children;
}

// The performance caveat (important, often missed)

// Every component that consumes a Context re-renders whenever that Context's value changes — even if the component only cares about one field out of several. If your AuthContext value object is { user, token, login, logout }, and login/logout are re-created as new function references on every render of AuthProvider (which happens if they're defined inline in the component body without useCallback), then every consumer re-renders on every AuthProvider re-render, not just when user/token actually change.
// For a project at your current scale (auth state, maybe a theme), this doesn't matter in practice — but it's the reason large apps sometimes split Context into multiple smaller ones (e.g., separate AuthStateContext and AuthActionsContext) or reach for a dedicated state library (Redux, Zustand) once Context updates start causing visible performance issues across a big tree. Good to know the ceiling exists, not urgent to solve yet.

// +-----------------------------------------------+----------------------------------------------+
// | Concept                                       | Purpose                                      |
// +-----------------------------------------------+----------------------------------------------+
// | createContext(default)                        | Defines a container for a shared value       |
// | <Context.Provider value={...}>               | Makes that value available to all descendants|
// | useContext(Context)                           | Reads the value from the nearest Provider    |
// | Custom useX() hook wrapping useContext       | Cleaner imports + guards against missing     |
// |                                               | Provider                                     |
// | lazy useState(() => ...) + localStorage      | Persists state across refreshes               |
// | Provider placement in the tree               | Determines which components can access it    |
// | Re-render on every value change               | Performance ceiling for very large apps      |
// +-----------------------------------------------+----------------------------------------------+

// What's the purpose of useState(() => localStorage.getItem('token')) (a function passed to useState) instead of useState(localStorage.getItem('token'))?
// That’s right. The lazy initializer function runs once during the initial render to read from localStorage, so the state starts already populated — meaning a page refresh (which wipes all in-memory React state) doesn't log the user out, since the token is re-read from storage immediately.

