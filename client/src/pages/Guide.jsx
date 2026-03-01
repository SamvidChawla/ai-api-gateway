import "./Guide.css";

const steps = [
  {
    number: "01",
    title: "Create an Account",
    description: "Sign up with your email and password. Once logged in, you'll land on the Dashboard where you can manage everything."
  },
  {
    number: "02",
    title: "Set Your Master Gemini Key",
    description: "Click 'Set Key' on the Dashboard and paste your Gemini API key. This key is AES-256 encrypted before storage. You can update or remove it at any time."
  },
  {
    number: "03",
    title: "Create Subkeys",
    description: "Generate named subkeys to distribute to your team, apps, or interns. You can create up to 10 active subkeys. Each subkey can have an optional token limit — set 0 for unlimited. Usage and token counts reset every 24 hours. Actual Subkey is never stored and only showed Once!"
  },
  {
    number: "04",
    title: "Use a Subkey",
    description: "Make requests to the gateway endpoint using your subkey as a Bearer token. The platform will route the request through your Gemini key, track usage, and enforce limits."
  },
  {
    number: "05",
    title: "Monitor Logs",
    description: "Visit the Logs page to see a full audit trail — key creation, modifications, revocations, deletions, successful requests, blocked requests, and failures."
  }
];

const events = [
  { type: "created", desc: "A new subkey was generated" },
  { type: "updated", desc: "A subkey's name or token limit was modified" },
  { type: "revoked", desc: "A subkey was permanently revoked" },
  { type: "key_deleted", desc: "A subkey was permanently deleted" },
  { type: "request_success", desc: "A gateway request completed successfully" },
  { type: "request_blocked_limit", desc: "Request denied — token limit reached" },
  { type: "request_failed", desc: "Gateway request encountered an error" },
];

const curlExample = `curl -X POST https://ai-api-gateway.onrender.com/gateway/generate \\
  -H "Authorization: Bearer YOUR_SUBKEY" \\
  -H "Content-Type: application/json" \\
  -d '{"prompt": "Explain quantum computing in simple terms"}'`;

const jsExample = `const res = await fetch("https://ai-api-gateway.onrender.com/gateway/generate", {
  method: "POST",
  headers: {
    "Authorization": "Bearer YOUR_SUBKEY",
    "Content-Type": "application/json"
  },
  body: JSON.stringify({ prompt: "Your prompt here" })
});

const data = await res.json();
console.log(data.response);`;

function Guide() {
  return (
    <div className="guide-page">

      {/* Hero */}
      <section className="guide-hero">
        <div className="guide-hero-label">DOCUMENTATION</div>
        <h1 className="guide-hero-title">How It Works</h1>
        <p className="guide-hero-sub">
          A platform for managing and distributing AI API access via scoped subkeys — without ever exposing your master key.
        </p>
      </section>

      {/* Disclaimer */}
      <section className="guide-disclaimer">
        <span className="disclaimer-icon">⚠️</span>
        <div>
          <strong>Demo Project Notice</strong>
          <p>
            This is a portfolio/resume project built for demonstration purposes only. It is not intended for production use.
            While reasonable security practices have been implemented (AES-256 encrypted API keys, bcrypt hashed passwords, JWT auth),
            no guarantees are made regarding data security. Do not store real or sensitive Gemini API keys.
            By using this platform you acknowledge it is a demo project.

            This platform does not provide Gemini API access.
            Users must supply their own Google Gemini API key and are solely responsible for compliance with
            Google's Gemini API Terms of Service and Google APIs Terms of Service.
          </p>
        </div>
      </section>

      {/* Use Case */}
      <section className="guide-section">
        <h2 className="guide-section-title">Use Case</h2>
        <div className="guide-usecase-card">
          <p>
            You have one AI API key and need to give access to two interns, a frontend app, and a backend service —
            but you don't want to expose your master key. Create four named subkeys, set token limits on each,
            and hand them out. Monitor usage and revoke access instantly without touching your real key.
          </p>
        </div>
      </section>

      {/* Steps */}
      <section className="guide-section">
        <h2 className="guide-section-title">Getting Started</h2>
        <div className="guide-steps">
          {steps.map((step) => (
            <div className="guide-step" key={step.number}>
              <div className="step-number">{step.number}</div>
              <div className="step-content">
                <h3>{step.title}</h3>
                <p>{step.description}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* API Usage */}
      <section className="guide-section">
        <h2 className="guide-section-title">Making a Request</h2>
        <p className="guide-section-desc">Use your subkey as a Bearer token in the Authorization header.</p>

        <div className="guide-code-block">
          <div className="code-label">cURL</div>
          <pre><code>{curlExample}</code></pre>
        </div>

        <div className="guide-code-block">
          <div className="code-label">JavaScript</div>
          <pre><code>{jsExample}</code></pre>
        </div>

        <div className="guide-response-card">
          <div className="code-label">Response</div>
          <div className="response-grid">
            <div className="response-field"><span>response</span><p>The Gemini model's output</p></div>
            <div className="response-field"><span>tokensUsed</span><p>Tokens consumed by this request</p></div>
            <div className="response-field"><span>total_used</span><p>Cumulative tokens used in current window</p></div>
            <div className="response-field"><span>reset_at</span><p>When the usage window resets (24hr rolling)</p></div>
          </div>
        </div>
      </section>

      {/* Subkey States */}
      <section className="guide-section">
        <h2 className="guide-section-title">Subkey States</h2>
        <div className="guide-states">
          <div className="state-card">
            <span className="status-pill active">Active</span>
            <p>Key is valid and can be used to make requests.</p>
          </div>
          <div className="state-card">
            <span className="status-pill revoked">Revoked</span>
            <p>Key is disabled but remains visible in your dashboard for reference.</p>
          </div>
          <div className="state-card">
            <span className="status-pill deleted">Deleted</span>
            <p>Key is permanently removed from the system. Logs are preserved with a deleted marker.</p>
          </div>
        </div>
      </section>

      {/* Log Events */}
      <section className="guide-section">
        <h2 className="guide-section-title">Log Events</h2>
        <div className="guide-events">
          {events.map((e) => (
            <div className="event-row" key={e.type}>
              <span className={`event-tag tag-${e.type}`}>{e.type}</span>
              <span className="event-desc">{e.desc}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Token Limits */}
      <section className="guide-section">
        <h2 className="guide-section-title">Token Limits & Reset Window</h2>
        <div className="guide-usecase-card">
          <ul className="guide-list">
            <li>Set token limit to <code>0</code> for unlimited usage.</li>
            <li>The usage window resets every <strong>24 hours</strong> from the time the key was created.</li>
            <li>If a request would exceed the limit, it is blocked before generation — you won't be charged.</li>
            <li>If a request goes slightly over the limit after generation, it is allowed as a one-time overflow and the key is then blocked until reset.</li>
            <li>Each subkey tracks both total calls (<code>usage_count</code>) and total tokens (<code>tokens_used</code>) independently.</li>
          </ul>
        </div>
      </section>

    </div>
  );
}

export default Guide;