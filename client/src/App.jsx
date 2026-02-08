import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useState } from "react";
import Landing from "./pages/Landing";
import Signup from "./pages/Signup";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";

function App() {
  const [token, setToken] = useState(
    localStorage.getItem("token")
  );

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/signup" element={<Signup />} />

        <Route
          path="/login"
          element={<Login setToken={setToken} />}
        />

        <Route
          path="/dashboard"
          element={
            token ? (
              <Dashboard setToken={setToken} />
            ) : (
              <Navigate to="/login" />
            )
          }
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
