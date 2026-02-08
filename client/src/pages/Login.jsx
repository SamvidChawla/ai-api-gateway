import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./Auth.css";

function Login({ setToken }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  async function handleLogin(e) {
    e.preventDefault();
    try {
      const res = await fetch("http://localhost:3000/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password })
      });

      const data = await res.json();

      if (data.token) {
        localStorage.setItem("token", data.token);
        setToken(data.token);        
        navigate("/dashboard");
        } else {
        alert("Login failed");}
    } catch (err) {
      alert("System Offline: Check server connection.");
    }
  }

  return (
    <div className="auth-wrapper">
      <div className="auth-card">
        <form className="auth-form" onSubmit={handleLogin}>
          <h2>Log In</h2>
          <p>Access your Dashboard</p>
          
          <input
            type="email"
            placeholder="admin@example.com"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
          />

          <input
            placeholder="Password"
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
          />

          <button className="btn-primary" type="submit">
            Login
          </button>
        </form>
      </div>
    </div>
  );
}

export default Login;