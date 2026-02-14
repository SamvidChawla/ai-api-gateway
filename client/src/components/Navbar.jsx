import React, { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import "./Navbar.css";

function Navbar({ setToken }) {
  const location = useLocation();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const token = localStorage.getItem("token");

  const handleLogout = () => {
    localStorage.removeItem("token");
    setToken(null);
    navigate("/");
  };

  const navLinks = [
    { name: "Dashboard", path: "/dashboard", icon: "🔑" },
    { name: "Activity Logs", path: "/logs", icon: "📋" },
    { name: "Guide", path: "/guide", icon: "📖" },
  ];

  return (
    <>
      <div className="mobile-header">
        <div className="brand-logo">
          <div className="logo-box">AI</div>
          <h2>AI API <span>Gateway</span></h2>
        </div>
        <button className="menu-toggle" onClick={() => setIsOpen(!isOpen)}>
          {isOpen ? "✕" : "☰"}
        </button>
      </div>

      <aside className={`app-sidebar ${isOpen ? "open" : ""}`}>
        <div className="sidebar-header desktop-only">
          <div className="brand-logo">
            <div className="logo-box">AI</div>
            <h2>AI API <span>Gateway</span></h2>
          </div>
        </div>

        <nav className="sidebar-nav">
          {navLinks.map((link) => (
            <Link
              key={link.path}
              to={link.path}
              className={`nav-link ${location.pathname === link.path ? "active" : ""}`}
              onClick={() => setIsOpen(false)}
            >
              <span className="nav-icon">{link.icon}</span>
              <span className="nav-text">{link.name}</span>
            </Link>
          ))}
        </nav>

        <div className="sidebar-footer">
          <div className="user-profile">
            <div className={`auth-dot ${token ? "auth-on" : "auth-off"}`} />
            <div className="user-details">
              <span className="user-status-label">Session Status: </span>
              <span className={`user-status-text ${token ? "txt-auth" : "txt-unauth"}`}>
                {token ? "Authorized" : "Unauthorized"}
              </span>
            </div>
          </div>
          <button className="logout-button" onClick={handleLogout}>
            ↪ Logout
          </button>
        </div>
      </aside>
      {isOpen && <div className="menu-overlay" onClick={() => setIsOpen(false)} />}
    </>
  );
}

export default Navbar;