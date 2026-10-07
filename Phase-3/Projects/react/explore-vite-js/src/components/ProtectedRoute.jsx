import { useState } from 'react';

function ProtectedRoute({children}) {
  const [isAuthenticated, setIsAuthenticated] = useState(true)
    if (!isAuthenticated) {
      return <p>Access denied. Please log in.</p>;
    
  }

  return children;
}

export default ProtectedRoute;   