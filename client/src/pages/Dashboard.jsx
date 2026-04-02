import { useEffect, useState, useCallback } from "react";
import Toast from "../components/Toast";
import "./Dashboard.css";
const API = import.meta.env.VITE_API_URL;

function Dashboard({ setToken }) {
  const [subkeys, setSubkeys] = useState([]);
  const [name, setName] = useState("");
  const [tokenLimit, setTokenLimit] = useState(0);
  const [newKey, setNewKey] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [hideRevoked, setHideRevoked] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState("");
  const [loadError, setLoadError] = useState(false);
  const [masterKeyConfigured, setMasterKeyConfigured] = useState(false);
  const [toast, setToast] = useState(null);
  const [creating, setCreating] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [revokingId, setRevokingId] = useState(null);
  const [modifyingId, setModifyingId] = useState(null);

  const showToast = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const token = localStorage.getItem("token");

  const loadSubkeys = useCallback(async () => {
    setLoadError(false);
    try {
      const res = await fetch(`${API}/subkeys`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.status === 401) return setToken(null);
      if (!res.ok) return setLoadError(true);
      const data = await res.json();
      setSubkeys(data);
    } catch (_err) { 
      console.error(err);
      setLoadError(true);
    }
  }, [token, setToken]);

  const checkMasterKeyStatus = useCallback(async () => {
    try {
      const res = await fetch(`${API}/realkey`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setMasterKeyConfigured(data.configured);
      }
    } catch (err) { console.error(err); }
  }, [token]);

  useEffect(() => { 
    loadSubkeys(); 
    checkMasterKeyStatus();
  }, [loadSubkeys, checkMasterKeyStatus]);

  async function createSubkey() {
    setError(""); setNewKey(null);
    if (subkeys.filter(k => !k.revoked).length >= 10) return setError("Maximum 10 active subkeys allowed");
    if (!name.trim()) return setError("Name is required");
    if (name.length > 100) return setError("Name must be 1 to 100 characters long");
    if (Number(tokenLimit) < 0 || !Number.isInteger(Number(tokenLimit))) return setError("Token limit must be a whole number");
    setCreating(true);
    try {
      const res = await fetch(`${API}/subkeys`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ name, token_limit: Number(tokenLimit) }),
      });
      const data = await res.json();
      if (!res.ok) return setError(data.error);
      setNewKey(data.subkey); setName(""); setTokenLimit(0); loadSubkeys();
    } catch (_err) { 
      setError("Server error"); 
    } finally { 
      setCreating(false); 
    }
  }

  async function handleModify(id, currentName, currentLimit) {
    const newName = prompt("Enter new name:", currentName);
    const newLimit = prompt("Enter new token limit (0 for unlimited):", currentLimit);
    if (newName === null || newLimit === null) return;
    if (!newName.trim() || newName.length > 100) return showToast("Name must be 1 to 100 characters long", "error");
    if (Number(newLimit) < 0 || !Number.isInteger(Number(newLimit))) return showToast("Token limit must be a whole number", "error");

    setModifyingId(id);
    try {
      const res = await fetch(`${API}/subkeys/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ name: newName, token_limit: Number(newLimit) }),
      });
      const data = await res.json();
      if (res.ok) {
        showToast("Subkey updated successfully");
        loadSubkeys();
      } else {
        showToast(data.error, "error");
      }
    } catch (_err) { 
      showToast("Server error while updating subkey", "error");
    } finally {
      setModifyingId(null);
    }
  }

  async function handleSetKey() {
    const apiKey = prompt("Enter your Master Gemini API Key:");
    if (!apiKey) return;
    if (!apiKey.trim()) return showToast("API key cannot be empty", "error");

    try {
      const res = await fetch(`${API}/realkey`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ api_key: apiKey }),
      });
      const data = await res.json();
      if (res.ok) {
        showToast("Master key saved successfully");
        setMasterKeyConfigured(true);
      } else {
        showToast(data.error, "error");
      }
    } catch (_err) { 
      showToast("Server error while saving key", "error"); 
    }
  }

  async function handleResetKey() {
    if (!window.confirm("Are you sure you want to delete your Master Gemini API Key? Your subkeys will stop working until a new one is set.")) return;

    try {
      const res = await fetch(`${API}/realkey`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok) {
        showToast("Master key removed");
        setMasterKeyConfigured(false);
      } else {
        showToast(data.error, "error");
      }
    } catch (_err) { 
      showToast("Server error while removing key", "error"); 
    }
  }

  async function handleDeleteSubkey(id) {
    if (!window.confirm("Are you sure you want to permanently delete this subkey? This action cannot be undone.")) return;

    setDeletingId(id);
    try {
      const res = await fetch(`${API}/subkeys/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        showToast("Subkey deleted");
        loadSubkeys();
      } else {
        const data = await res.json();
        showToast(data.error, "error");
      }
    } catch (_err) { 
      showToast("Server error while deleting subkey", "error"); 
    } finally {
      setDeletingId(null);
    }
  }

  async function handleRevokeSubkey(id) {
    if (!window.confirm("Revoke key?")) return;

    setRevokingId(id);
    try {
      const res = await fetch(`${API}/subkeys/${id}/revoke`, { 
        method: "PATCH", 
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) { 
        showToast("Subkey revoked"); 
        loadSubkeys(); 
      } else { 
        const data = await res.json(); 
        showToast(data.error, "error"); 
      }
    } catch (_err) {
      showToast("Server error while revoking subkey", "error");
    } finally {    
      setRevokingId(null);
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
            <input type="number" min="0" step="1" value={tokenLimit} onChange={e => setTokenLimit(e.target.value)} />
          </div>
          <button className="btn-create" onClick={createSubkey} disabled={creating}>
            {creating ? "Creating..." : "Create Key"}
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

      <section className="list-card">
        <div className="list-controls">
          <input className="search-input" placeholder="Search by name..." onChange={e => setSearchTerm(e.target.value)} />
          <div className="control-btns">
            <button className="btn-refresh-dashboard" onClick={handleSetKey}>
              {masterKeyConfigured ? "Update Key" : "Set Key"}
            </button>
            {masterKeyConfigured && (
              <button className="btn-refresh-dashboard" onClick={handleResetKey}>
                Reset Key
              </button>
            )}
            <button className="btn-refresh-dashboard" onClick={loadSubkeys}>Refresh</button>
            <button className={`btn-toggle ${hideRevoked ? "active" : ""}`} onClick={() => setHideRevoked(!hideRevoked)}>
              {hideRevoked ? "Show All" : "Hide Revoked"}
            </button>
          </div>
        </div>

        <div className="keys-grid">
          {loadError ? (
            <div className="empty-state">
              <p>Failed to load subkeys. Try refreshing.</p>
            </div>
          ) : filteredKeys.length === 0 ? (
            <div className="empty-state">
              {searchTerm ? (
                <p>No subkeys match your search.</p>
              ) : (
                <p>No subkeys yet. Create your first one above.</p>
              )}
            </div>
          ) : filteredKeys.map(k => {
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
                      <button 
                        className="btn-modify-inline" 
                        disabled={modifyingId === k.id}
                        onClick={() => handleModify(k.id, k.name, k.token_limit)}
                      >
                        {modifyingId === k.id ? "Saving..." : "Modify"}
                      </button>
                      <button 
                        className="btn-revoke-inline" 
                        disabled={revokingId === k.id}
                        onClick={() => handleRevokeSubkey(k.id)}
                      >
                        {revokingId === k.id ? "Revoking..." : "Revoke"}
                      </button>
                    </>
                  )}
                  <button 
                    className="btn-revoke-inline" 
                    disabled={deletingId === k.id}
                    onClick={() => handleDeleteSubkey(k.id)}
                  >
                    {deletingId === k.id ? "Deleting..." : "Delete"}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </section>
      <Toast toast={toast} />
    </div>
  );
}

export default Dashboard;