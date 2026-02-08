import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./Auth.css";

function Signup() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleSignup = async (e) => {
    e.preventDefault();
    setError("");

    try {
      const res = await fetch("http://localhost:3000/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Provisioning failed");
        return;
      }
      navigate("/login");
    } catch (err) {
      setError("Network timeout: Gateway unreachable");
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
          <button className="btn-primary" type="submit">
            Signup
          </button>
        </form>
        {error && <p style={{ color: '#ff4444', fontSize: '13px', marginTop: '10px' }}>{error}</p>}
      </div>
    </div>
  );
}

export default Signup;