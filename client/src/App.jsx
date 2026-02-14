import { BrowserRouter, Routes, Route, Navigate, Outlet } from "react-router-dom";
import { useState } from "react";
import Dashboard from "./pages/Dashboard";
import Log from "./pages/Log";
import Guide from "./pages/Guide";
import Navbar from "./components/Navbar";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Landing from "./pages/Landing";

const ProtectedLayout = ({ setToken }) => {
  return (
    <div className="app-shell">
      <Navbar setToken={setToken} />
      <Outlet /> 
    </div>
  );
};

function App() {
  const [token, setToken] = useState(localStorage.getItem("token"));

  return (
    <BrowserRouter>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<Landing />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/login" element={<Login setToken={setToken} />} />

        {/* Protected Routes */}
        <Route element={token ? <ProtectedLayout setToken={setToken} /> : <Navigate to="/login" />}>
          <Route path="/dashboard" element={<Dashboard setToken={setToken} />} />
          <Route path="/logs" element={<Log />} />
          <Route path="/guide" element={<Guide />} />
        </Route>

        <Route path="*" element={<Navigate to={token ? "/dashboard" : "/"} />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;