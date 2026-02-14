import { useEffect, useState, useCallback } from "react";
import "./Dashboard.css";

function Dashboard({ setToken }) {
  const [subkeys, setSubkeys] = useState([]);
  const [name, setName] = useState("");
  const [tokenLimit, setTokenLimit] = useState(0);
  const [newKey, setNewKey] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [hideRevoked, setHideRevoked] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState("");
  const token = localStorage.getItem("token");

  const loadSubkeys = useCallback(async () => {
    try {
      const res = await fetch("http://localhost:3000/subkeys", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.status === 401) return setToken(null);
      const data = await res.json();
      setSubkeys(data);
    } catch (err) { console.error(err); }
  }, [token, setToken]);

  useEffect(() => { loadSubkeys(); }, [loadSubkeys]);

  async function createSubkey() {
    setError(""); setNewKey(null);
    if (!name.trim()) return setError("Name is required");

    try {
      const res = await fetch("http://localhost:3000/subkeys", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ name, token_limit: Number(tokenLimit) }),
      });
      const data = await res.json();
      if (!res.ok) return setError(data.error);

      setNewKey(data.subkey); setName(""); setTokenLimit(0); loadSubkeys();
    } catch (err) { setError("Server error"); }
  }

  const formatIST = (date) => new Date(date).toLocaleString("en-IN", {
    timeZone: "Asia/Kolkata", day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit", hour12: true
  });

  const filteredKeys = subkeys.filter(k => {
    const matches = (k.name || "").toLowerCase().includes(searchTerm.toLowerCase());
    return hideRevoked ? matches && !k.revoked : matches;
  });

  return (
    <div className="dashboard-page">
      <section className="create-card">
        <div className="card-header">
          <h3>Create Subkey <span>({subkeys.filter(k=>!k.revoked).length}/10 Active)</span></h3>
        </div>
        <div className="create-form-grid">
          <div className="input-box">
            <label>Name</label>
            <input placeholder="Key Name" value={name} onChange={e => setName(e.target.value)} />
          </div>
          <div className="input-box">
            <label>Token Limit (0 = ∞)</label>
            <input type="number" value={tokenLimit} onChange={e => setTokenLimit(e.target.value)} />
          </div>
          <button className="btn-create" onClick={createSubkey} disabled={subkeys.filter(k=>!k.revoked).length >= 10}>Create</button>
        </div>
        {error && <p className="error-msg" style={{color: '#ff4444', marginTop: '10px'}}>{error}</p>}

        {newKey && (
          <div className="secret-alert">
            <p><b>One-time Secret:</b> Copy this now.</p>
            <div className="copy-row">
              <code>{newKey}</code>
              <button onClick={() => {navigator.clipboard.writeText(newKey); setCopied(true); setTimeout(()=>setCopied(false), 2000)}} className={copied ? "copied" : ""}>
                {copied ? "Copied!" : "Copy"}
              </button>
            </div>
          </div>
        )}
      </section>

      <section className="list-card">
        <div className="list-controls">
          <input className="search-input" placeholder="Search keys..." onChange={e => setSearchTerm(e.target.value)} />
          <button className={`btn-toggle ${hideRevoked ? "active" : ""}`} onClick={() => setHideRevoked(!hideRevoked)}>
            {hideRevoked ? "Active Only" : "Hide Revoked"}
          </button>
        </div>
        <div className="keys-grid">
          {filteredKeys.map(k => (
            <div key={k.id} className={`key-card ${k.revoked ? "revoked-card" : ""}`}>
              <div className="key-header">
                <h4 title={k.name}>{k.name || "Unnamed"}</h4>
                <span className={`status-pill ${k.revoked ? "revoked" : "active"}`}>{k.revoked ? "Revoked" : "Active"}</span>
              </div>
              <div className="usage-wrapper">
                <p style={{fontSize: '13px', color: '#a0a0a5'}}>Tokens: <b>{k.tokens_used}</b> / {k.token_limit || "∞"}</p>
                {k.token_limit > 0 && (
                  <div className="progress-track">
                    <div className="progress-fill" style={{ width: `${Math.min((k.tokens_used/k.token_limit)*100, 100)}%`, background: '#ffcc00' }} />
                  </div>
                )}
              </div>
              <p style={{fontSize: '11px', color: '#666'}}>Resets (IST): {formatIST(k.reset_at)}</p>
              {!k.revoked && <button className="btn-revoke-inline" onClick={async () => { if(window.confirm("Revoke?")) { await fetch(`http://localhost:3000/subkeys/${k.id}/revoke`, { method: "PATCH", headers: { Authorization: `Bearer ${token}` }}); loadSubkeys(); } }}>Revoke</button>}
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

export default Dashboard;