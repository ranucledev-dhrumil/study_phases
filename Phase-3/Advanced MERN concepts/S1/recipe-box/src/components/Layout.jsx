import { Link, Outlet } from 'react-router-dom';

function Layout() {
    return (
        <div>
            <nav>
                <Link to="/"> Home </Link>
                {" | "}
                <Link to="/recipes"> Recipes </Link>
                {" | "}
                <Link to="/recipes/new"> Add New Recipes </Link>
            </nav>
            <hr />
            <Outlet /> {/* child route renders here */}
        </div>
    );
}

export default Layout