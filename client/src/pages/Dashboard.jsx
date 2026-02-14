import { useEffect, useState, useCallback } from "react";
import "./Dashboard.css";

function Dashboard({ setToken }) {
  const [subkeys, setSubkeys] = useState([]);
  const [name, setName] = useState("");
  const [newKey, setNewKey] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [copied, setCopied] = useState(false);
  const token = localStorage.getItem("token");

  // --- Auth & Logout Logic ---

  const logout = useCallback(() => {
    localStorage.removeItem("token");
    setToken(null);
  }, [setToken]);

  // Centralized status checker for all API calls
  const checkStatus = useCallback((res) => {
    if (res.status === 401 || res.status === 403) {
      logout();
      return false;
    }
    return true;
  }, [logout]);

  // Initial Guard: If no token exists, log out immediately
  useEffect(() => {
    if (!token) {
      logout();
    }
  }, [token, logout]);

  // --- API Actions ---

  useEffect(() => {
    async function loadSubkeys() {
      if (!token) return;
      try {
        const res = await fetch("http://localhost:3000/subkeys", {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!checkStatus(res)) return;

        const data = await res.json();
        setSubkeys(data);
      } catch (err) {
        console.error("Error loading keys:", err);
      }
    }
    loadSubkeys();
  }, [token, checkStatus]);

  async function createSubkey() {
    if (!name) return;
    setNewKey(null);

    try {
      const res = await fetch("http://localhost:3000/subkeys", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ name }),
      });

      if (!checkStatus(res)) return;

      const data = await res.json();
      setNewKey(data.subkey);
      
      // Update local list: Backend returns full key object (excluding raw key)
      const { subkey, ...keyData } = data;
      setSubkeys(prev => [...prev, keyData]);
      setName("");
    } catch (err) {
      console.error("Create failed:", err);
    }
  }

  async function revokeSubkey(id) {
    if (!window.confirm("Are you sure you want to revoke this key? This cannot be undone.")) return;
    
    try {
      const res = await fetch(`http://localhost:3000/subkeys/${id}/revoke`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!checkStatus(res)) return;

      setSubkeys(keys =>
        keys.map(k => (k.id === id ? { ...k, revoked: true } : k))
      );
    } catch (err) {
      console.error("Revoke failed:", err);
    }
  }

  // --- UI Helpers ---

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(newKey);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy!", err);
    }
  };

  const filteredKeys = subkeys.filter(k => 
    (k.name || "Unnamed").toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="dashboard-container">
      <div className="dashboard-content">
        <header className="dashboard-header">
          <h1>AI API <span>Gateway</span></h1>
          <button className="btn-logout" onClick={logout}>Logout</button>
        </header>

        <section className="create-section">
          <h2>Create Subkey</h2>
          <div className="input-row">
            <input
              placeholder="Key name (e.g. Analytics-App)"
              value={name}
              onChange={e => setName(e.target.value)}
            />
            <button className="btn-create" onClick={createSubkey}>Create</button>
          </div>

          {newKey && (
            <div className="new-key-box">
              <p><b>Copy this key (It's only shown once):</b></p>
              <div className="key-row">
                <code>{newKey}</code>
                <button 
                  className={`btn-copy ${copied ? 'copied' : ''}`} 
                  onClick={handleCopy}
                >
                  {copied ? "Copied!" : "Copy"}
                </button>
              </div>
            </div>
          )}
        </section>

        <section className="keys-list">
          <div className="list-header">
            <h2>Your Subkeys</h2>
            <input 
              className="search-bar"
              placeholder="Search keys..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {filteredKeys.length === 0 ? (
            <p className="empty-msg">
              {searchTerm ? "No keys match your search." : "No subkeys found. Create one above to get started."}
            </p>
          ) : (
            filteredKeys.map(k => (
              <div key={k.id} className="key-item">
                <div className="key-main-info">
                  <div className="key-info-header">
                    <span className="key-name" title={k.name}>
                      {k.name || "Unnamed Key"}
                    </span>
                    <span className={`status-tag ${k.revoked ? 'status-revoked' : 'status-active'}`}>
                      {k.revoked ? "Revoked" : "Active"}
                    </span>
                  </div>
                  <div className="key-stats">
                    <span>Usage: <b>{k.usage_count || 0}</b></span>
                    <span>Limit: <b>{k.token_limit || "None"}</b></span>
                    <span>Created: <b>{new Date(k.created_at).toLocaleDateString('en-GB')}</b></span>
                  </div>
                </div>

                {!k.revoked && (
                  <button className="btn-revoke" onClick={() => revokeSubkey(k.id)}>
                    Revoke
                  </button>
                )}
              </div>
            ))
          )}
        </section>
      </div>
    </div>
  );
}

export default Dashboard;