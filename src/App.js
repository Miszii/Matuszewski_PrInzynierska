import React, { useState, useEffect } from "react";
import {
  BrowserRouter as Router,
  Route,
  Routes,
  Navigate,
} from "react-router-dom";
import Navbar from "./components/Navbar";
import Dashboard from "./components/Dashboard";
import Settings from "./components/Settings";
import Sleep from "./components/Sleep";
import Workout from "./components/Workout";
import Meals from "./components/Meals";
import History from "./components/History";
import Login from "./components/Login";

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(
    !!localStorage.getItem("token")
  );

  useEffect(() => {
    const handleStorageChange = () => {
      setIsAuthenticated(!!localStorage.getItem("token"));
    };
    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, []);

  return (
    <div className="App bg-[#f5f5f5] min-h-screen">
      <Router>
        {isAuthenticated && <Navbar setIsAuthenticated={setIsAuthenticated} />}
        <Routes>
          <Route
            path="/"
            element={isAuthenticated ? <Dashboard /> : <Navigate to="/login" />}
          />
          <Route
            path="/settings"
            element={isAuthenticated ? <Settings /> : <Navigate to="/login" />}
          />
          <Route
            path="/sleep"
            element={isAuthenticated ? <Sleep /> : <Navigate to="/login" />}
          />
          <Route
            path="/workout"
            element={isAuthenticated ? <Workout /> : <Navigate to="/login" />}
          />
          <Route
            path="/meals"
            element={isAuthenticated ? <Meals /> : <Navigate to="/login" />}
          />
          <Route
            path="/history"
            element={isAuthenticated ? <History /> : <Navigate to="/login" />}
          />
          <Route
            path="/login"
            element={<Login setIsAuthenticated={setIsAuthenticated} />}
          />
          <Route
            path="*"
            element={<Navigate to={isAuthenticated ? "/" : "/login"} />}
          />
        </Routes>
      </Router>
    </div>
  );
}

export default App;
