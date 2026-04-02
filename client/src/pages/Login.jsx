import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./Auth.css";
const API = import.meta.env.VITE_API_URL;

function Login({ setToken }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  async function handleLogin(e) {
    e.preventDefault();
    setError("");

    if (!email.trim()) return setError("Email is required");
    if (!password) return setError("Password is required");

    setLoading(true); 
    try {
      const res = await fetch(`${API}/auth/login`, {
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
        setError(data.error || "Login failed");
      }
    } catch (_err) {
      setError("Server error");
    } finally {
      setLoading(false); 
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
          <button className="btn-primary" disabled={loading} type="submit">{loading ? "Logging in..." : "Log in"}</button>
        </form>
        {error && <p style={{ color: '#ff4444', fontSize: '13px', marginTop: '10px' }}>{error}</p>}
      </div>
    </div>
  );
}

export default Login;