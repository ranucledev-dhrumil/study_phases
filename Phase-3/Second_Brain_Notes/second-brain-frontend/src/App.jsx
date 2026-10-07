// App.jsx
import "./App.css";
import AuthContext from "./context/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import VaultLayout from "./components/VaultLayout";

import { Navigate, Route, Routes } from "react-router-dom";
import { useContext } from "react";

import Login from "./pages/Login";
import Register from "./pages/Register";
import Notes from "./pages/Notes";
import ItemDetail from "./pages/ItemDetail";
import GraphView from "./pages/GraphView";

function App() {
  const { isLoggedIn } = useContext(AuthContext);
  return (
    <Routes>
      <Route
        path="/"
        element={<Navigate to={isLoggedIn ? "/notes" : "/login"} replace />}
      />

      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      {/* Vault routes — all wrapped in VaultLayout (sidebar) */}
      <Route
        path="/notes"
        element={
          <ProtectedRoute>
            <VaultLayout>
              <Notes />
            </VaultLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/item/:id"
        element={
          <ProtectedRoute>
            <VaultLayout>
              <ItemDetail />
            </VaultLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/graph"
        element={
          <ProtectedRoute>
            <VaultLayout>
              <GraphView />
            </VaultLayout>
          </ProtectedRoute>
        }
      />
    </Routes>
  );
}

export default App;
