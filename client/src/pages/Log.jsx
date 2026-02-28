import React, { useEffect, useState, useCallback } from "react";
import "./Log.css";
const API = import.meta.env.VITE_API_URL;

function Log({ setToken }) {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const token = localStorage.getItem("token");

  const fetchLogs = useCallback(async () => {
    try {
      const res = await fetch(`${API}/subkeys/logs`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.status === 401) return setToken(null);
      const data = await res.json();
      if (!res.ok) return;
      setLogs(data);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  }, [token, setToken]);

  useEffect(() => { fetchLogs(); }, [fetchLogs]);

  const formatIST = (d) => new Date(d).toLocaleString("en-IN", {
    timeZone: "Asia/Kolkata", day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit", hour12: true
  });

  return (
    <div className="log-container">
      <div className="log-header">
        <h2 style={{color: '#fff'}}>Activity Logs</h2>
        <button className="btn-refresh" onClick={() => { setLoading(true); fetchLogs(); }}>Refresh</button>
      </div>
      <div className="log-card">
        {loading ? <p style={{color: '#a0a0a5'}}>Syncing audit trail...</p> : (
          <div className="log-table-wrapper">
            <table className="log-table">
              <thead>
                <tr>
                  <th>Event</th>
                  <th>Key Name</th>
                  <th>Email</th>
                  <th>Time (IST)</th>
                </tr>
              </thead>
              <tbody>
                {logs.map(l => (
                  <tr key={l.id}>
                    <td><span className={`event-tag tag-${l.event_type}`}>{l.event_type}</span></td>
                    <td>{l.subkey_name}</td>
                    <td>{l.performed_by_email}</td>
                    <td style={{color: '#666'}}>{formatIST(l.timestamp)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export default Log;