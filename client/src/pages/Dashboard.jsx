import { useEffect, useState } from "react";
import "./Dashboard.css";

function Dashboard({ setToken }) {
  const [subkeys, setSubkeys] = useState([]);
  const [name, setName] = useState("");
  const [newKey, setNewKey] = useState(null);
  const token = localStorage.getItem("token");

  function logout() {
    localStorage.removeItem("token");
    setToken(null);        
  }

  useEffect(() => {
    async function loadSubkeys() {
      const res = await fetch("http://localhost:3000/subkeys", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await res.json();
      setSubkeys(data);
    }

    loadSubkeys();
  }, [token]);

  async function createSubkey() {
    setNewKey(null);

    const res = await fetch("http://localhost:3000/subkeys", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ name }),
    });

    const data = await res.json();
    setNewKey(data.subkey);
    setSubkeys(prev => [...prev, data]);
    setName("");
  }

  async function revokeSubkey(id) {
    await fetch(`http://localhost:3000/subkeys/${id}/revoke`, {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    setSubkeys(keys =>
      keys.map(k =>
        k.id === id ? { ...k, revoked: true } : k
      )
    );
  }

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
              <p style={{ margin: 0, fontSize: '14px' }}>
                <b>Copy this key now (shown once):</b>
              </p>
              <code>{newKey}</code>
            </div>
          )}
        </section>

        <section className="keys-list">
          <h2>Your Subkeys</h2>
          {subkeys.length === 0 ? (
            <p style={{ padding: 20, color: '#a0a0a5' }}>No subkeys found. Create one above to get started.</p>
          ) : (
            subkeys.map(k => (
              <div key={k.id} className="key-item">
                <div className="key-info">
                  <span style={{ fontWeight: 600 }}>{k.name || "Unnamed"}</span>
                  <span className={`status-tag ${k.revoked ? 'status-revoked' : 'status-active'}`}>
                    {k.revoked ? "Revoked" : "Active"}
                  </span>
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