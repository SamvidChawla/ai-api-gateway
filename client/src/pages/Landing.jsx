import { useNavigate } from "react-router-dom";
import "./Auth.css";

function Landing() {
  const navigate = useNavigate();

  return (
    <div className="auth-wrapper">
      <div className="hero-content">
        <h1>AI API <span>Gateway</span></h1>
        <p>Manage your AI API keys. Control Limits & Access , Monitor Stats & Logs</p>
        
        <div className="btn-group">
          <button className="btn-primary" onClick={() => navigate("/login")}>
            Login
          </button>
          <button className="btn-outline" onClick={() => navigate("/signup")}>
            Signup
          </button>
        </div>
      </div>
    </div>
  );
}

export default Landing;