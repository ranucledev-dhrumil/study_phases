// Why routing matters in a SPA
// In your Spring Boot days, routing was server-side: each URL hit a controller method, which returned a view or JSON. 
// In a React SPA, there's only one HTML page — the server sends it once, and JavaScript takes over deciding what to render based on the URL. 
// React Router is the library that makes the URL and the UI stay in sync without a full page reload.

import { BrowserRouter, Routes, Route } from 'react-router-dom';

function App() {
    return (
        <BrowserRouter>
            <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/tasks" element={<TaskList />} />
                <Route path="/tasks/:id" element={<TaskDetail />} />
                <Route path="*" element={<NotFound />} />
            </Routes>
        </BrowserRouter>
    );
}

// BrowserRouter wraps your whole app and uses the HTML5 History API (pushState) to change the URL without a reload.
// Routes picks the first matching Route (v6 changed matching to be more specific-first than v5's top-to-bottom).
// path="*" is your catch-all/404.

// Navigation: Link vs <a>
// Using a plain <a href="/tasks"> triggers a full browser reload — you lose all React state and re-download the JS bundle. 
// Link intercepts the click and updates the URL + renders the new route via JS.

import { Link } from 'react-router-dom';
<Link to="/tasks">View Tasks</Link>

// For programmatic navigation (e.g., after a form submit), use the useNavigate hook:
const handleSubmit = async () => {
    await createTask(data);
    navigate('/tasks'); // like res.redirect() but client-side
};

// Route parameters
// :id in the path becomes accessible via useParams():
function TaskDetail() {
    const { id } = useParams(); // string, from the URL
    useEffect(() => {
        fetchTask(id).then(setTask);
    }, [id]);
  ...
}
// This is the direct analog of @PathVariable in a Spring @GetMapping("/tasks/{id}").

// 'Query parameters
// For things like /tasks?status=done, use useSearchParams:
const [searchParams, setSearchParams] = useSearchParams();
const status = searchParams.get('status'); // "done"
setSearchParams({ status: 'pending' }); // updates URL

//  v6 changed matching from top-to-bottom (v5) to a ranking algorithm where more specific/static segments outrank dynamic params, regardless of order.

// Nested routes & layouts
// A very common pattern: a shared layout (navbar/sidebar) wrapping multiple pages.
<Route path="/" element={<Layout />}>
    <Route path="tasks" element={<TaskList />} />
    <Route path="tasks/:id" element={<TaskDetail />} />
</Route>
// Inside Layout, you render an <Outlet /> where the matched child route should appear:
function Layout() {
    return (
        <div>
            <Navbar />
            <Outlet /> {/* child route renders here */}
        </div>
    );
}
// What does <Outlet /> do?
//  <Outlet /> is basically a placeholder. 
// React Router says:
// "Whatever child route matches the current URL, render that component here."

// Protected routes (preview — ties into Session 2/3)
// You'll often need to gate a route behind "is the user logged in?" This is usually done with a wrapper component:
function ProtectedRoute({ children }) {
    const { token } = useAuth(); // from Context, covered in Session 4
    if (!token) return <Navigate to="/login" replace />;
    return children;
}

{/* <Route path="/tasks" element={<ProtectedRoute><TaskList /></ProtectedRoute>} /> */ }

// <Navigate> is the declarative version of useNavigate() — used when you want to redirect during render rather than in an event handler. 
// replace prevents the redirect from adding a new history entry (so back button doesn't loop back to the protected page).

// Redirects & 404s
{/* <Route path="/old-path" element={<Navigate to="/new-path" replace />} /> */ }
{/* <Route path="*" element={<NotFound />} /> */ }

// Key mental model shift from Spring
// | Spring Boot                                | React Router                                               |
// | ------------------------------------------ | ---------------------------------------------------------- |
// | **Server matches URL → controller method** | **Browser URL → React Router matches → component renders** |
// | `@PathVariable`                            | `useParams()`                                              |
// | `@RequestParam`                            | `useSearchParams()`                                        |
// | `res.redirect()` / `RedirectView`          | `useNavigate()` or `<Navigate>`                            |
// | Server-rendered 404 page                   | Catch-all `<Route path="*">`                               |
// | Filter chain intercepts before controller  | `ProtectedRoute` wrapper intercepts before rendering       |

// <Navigate> is the declarative component form of redirecting, meant to be rendered conditionally during render. useNavigate() is imperative and meant for event handlers/effects, not called bare during render.

// useSearchParams() gives you a URLSearchParams-like object (and a setter) for query string parameters, distinct from path params handled by useParams().

// Given:
<Routes>
    <Route path="/" element={<Layout />}>
        <Route path="tasks" element={<TaskList />} />
    </Route>
</Routes>
// If Layout does NOT render <Outlet />, what happens when the user visits '/tasks'?
// The route still matches correctly (URL updates, no error), but without an <Outlet /> in Layout, there's no place for the matched child element to actually render — so TaskList silently never appears.