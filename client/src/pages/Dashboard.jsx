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

  async function handleModify(id, currentName, currentLimit) {
    const newName = prompt("Enter new name:", currentName);
    const newLimit = prompt("Enter new token limit (0 for unlimited):", currentLimit);
    if (newName === null || newLimit === null) return;

    try {
      const res = await fetch(`http://localhost:3000/subkeys/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ name: newName, token_limit: Number(newLimit) }),
      });
      if (res.ok) loadSubkeys();
    } catch (err) { console.error(err); }
  }

  async function handleSetKey() {
    const apiKey = prompt("Enter your Master Gemini API Key:");
    if (!apiKey) return;

    try {
      const res = await fetch("http://localhost:3000/realkey", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ api_key: apiKey }),
      });
      const data = await res.json();
      if (res.ok) {
        alert("Master key successfully saved!");
      } else {
        alert(data.error || "Failed to save key.");
      }
    } catch (err) { 
      console.error(err);
      alert("Server error while saving key."); 
    }
  }

  async function handleResetKey() {
    if (!window.confirm("Are you sure you want to delete your Master Gemini API Key? Your subkeys will stop working until a new one is set.")) return;

    try {
      const res = await fetch("http://localhost:3000/realkey", {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        alert("Master key successfully removed.");
      } else {
        alert("Failed to remove key.");
      }
    } catch (err) { 
      console.error(err);
      alert("Server error while removing key."); 
    }
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
      {/*Creation Section */}
      <section className="create-card">
        <div className="card-header">
          <h3>Generate New Subkey <span>{subkeys.filter(k=>!k.revoked).length}/10 Active</span></h3>
        </div>
        <div className="create-form-grid">
          <div className="input-box">
            <label>Key Name</label>
            <input placeholder="e.g. Production-App" value={name} onChange={e => setName(e.target.value)} />
          </div>
          <div className="input-box">
            <label>Token Limit (0 for unlimited)</label>
            <input type="number" value={tokenLimit} onChange={e => setTokenLimit(e.target.value)} />
          </div>
          <button className="btn-create" onClick={createSubkey} disabled={subkeys.filter(k=>!k.revoked).length >= 10}>
            Create Key
          </button>
        </div>
        {error && <p className="error-msg">{error}</p>}

        {newKey && (
          <div className="secret-alert">
            <p><b>Secret Key Generated:</b> This will not be shown again.</p>
            <div className="copy-row">
              <code>{newKey}</code>
              <button onClick={() => {navigator.clipboard.writeText(newKey); setCopied(true); setTimeout(()=>setCopied(false), 2000)}} className={copied ? "copied" : ""}>
                {copied ? "Copied!" : "Copy"}
              </button>
            </div>
          </div>
        )}
      </section>

      {/* Keys List Section */}
      <section className="list-card">
        <div className="list-controls">
          <input className="search-input" placeholder="Search by name..." onChange={e => setSearchTerm(e.target.value)} />
          <div className="control-btns">
            <button className="btn-refresh-dashboard" onClick={handleSetKey}>Set Key</button>
            <button className="btn-refresh-dashboard" onClick={handleResetKey}>Reset Key</button>
            <button className="btn-refresh-dashboard" onClick={loadSubkeys}>Refresh</button>
            <button className={`btn-toggle ${hideRevoked ? "active" : ""}`} onClick={() => setHideRevoked(!hideRevoked)}>
              {hideRevoked ? "Show All" : "Hide Revoked"}
            </button>
          </div>
        </div>

        <div className="keys-grid">
          {filteredKeys.map(k => {
            const usagePercent = k.token_limit > 0 ? (k.tokens_used / k.token_limit) * 100 : 0;
            return (
              <div key={k.id} className={`key-card ${k.revoked ? "revoked-card" : ""}`}>
                <div className="key-header">
                  <h4 title={k.name}>{k.name || "Unnamed"}</h4>
                  <span className={`status-pill ${k.revoked ? "revoked" : "active"}`}>
                    {k.revoked ? "Revoked" : "Active"}
                  </span>
                </div>

                <div className="key-stats">
                  <div className="stat-line"><span>Total Calls:</span> <b>{k.usage_count}</b></div>
                  <div className="stat-line"><span>Tokens Used:</span> <b>{k.tokens_used} / {k.token_limit || "∞"}</b></div>
                  {k.token_limit > 0 && (
                    <div className="progress-track">
                      <div className="progress-fill" style={{ width: `${Math.min(usagePercent, 100)}%`, background: usagePercent > 90 ? '#ff4444' : '#ffcc00' }} />
                    </div>
                  )}
                </div>

                <div className="reset-info">
                   <span>Resets (IST):</span> <b>{formatIST(k.reset_at)}</b>
                </div>

                <div className="key-actions">
                  {!k.revoked && (
                    <>
                      <button className="btn-modify-inline" onClick={() => handleModify(k.id, k.name, k.token_limit)}>Modify</button>
                      <button className="btn-revoke-inline" onClick={async () => { if(window.confirm("Revoke key?")) { await fetch(`http://localhost:3000/subkeys/${k.id}/revoke`, { method: "PATCH", headers: { Authorization: `Bearer ${token}` }}); loadSubkeys(); } }}>Revoke</button>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}

export default Dashboard;