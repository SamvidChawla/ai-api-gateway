import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./Auth.css";
const API = import.meta.env.VITE_API_URL;

function Signup() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [creating, setCreating] = useState(false);
  const navigate = useNavigate();

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  const handleSignup = async (e) => {
    e.preventDefault();
    setError("");

    if (!email.trim()) return setError("Email is required");
    if (!emailRegex.test(email)) return setError("Invalid email format");
    if (!password) return setError("Password is required");
    if (password.length < 8) return setError("Password must be at least 8 characters long");

    setCreating(true); 
    try {
      const res = await fetch(`${API}/auth/signup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Signup failed");
        return;
      }
      navigate("/login");
    } catch (_err) {
      setError("Server error");
    } finally {
      setCreating(false); 
    }
  };

  return (
    <div className="auth-wrapper">
      <div className="auth-card">
        <form className="auth-form" onSubmit={handleSignup}>
          <h2>Signup</h2>
          <p>Create your account</p>
          
          <input
            type="email"
            placeholder="Email Address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <input
            type="password"
            placeholder="Create Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <button className="btn-primary" disabled={creating} type="submit">{creating ? "Signing up..." : "Sign up"}</button>
        </form>
        {error && <p style={{ color: '#ff4444', fontSize: '13px', marginTop: '10px' }}>{error}</p>}
      </div>
    </div>
  );
}

export default Signup;