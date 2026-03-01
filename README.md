# AI API Gateway

A PERN stack platform for managing and distributing AI API access via scoped subkeys — without exposing your master key.

**Live:** [frontend-url] · [backend-url/health]

---

## Use Case

You have one AI API key and need to give access to teammates or apps. Create named subkeys with token limits, monitor usage, and revoke access instantly — your real key never leaves the server.

---

## Technical Highlights

**Authentication & Security**
- JWT-based auth with bcrypt password hashing (10 rounds)
- AES-256-CBC encrypted master key storage — never returned in any response
- Parameterized queries throughout — SQL injection prevention
- `helmet` security headers, `express-rate-limit` with trust proxy for accurate per-IP enforcement on Render

**Subkey System**
- Key-prefix VARCHAR(8) index for O(1) row lookup before bcrypt compare — avoids full-table scan
- Pre-request token estimation via Gemini `countTokens` — blocks requests before generation if limit exceeded
- One-time overflow allowed after generation, then blocked until reset
- 24hr rolling usage window with `reset_at` timestamp per key
- Hard deletion with `ON DELETE SET NULL` FK constraint — audit logs preserved after key removal

**Audit Trail**
- PostgreSQL enum-typed event log (`created`, `updated`, `revoked`, `key_deleted`, `request_success`, `request_blocked_limit`, `request_failed`)
- `performed_by` on all events including gateway requests — orphaned logs still queryable after key deletion

**Infrastructure**
- Backend: Render (Node.js/Express)
- Database: Neon (serverless PostgreSQL)
- Frontend: Netlify (React/Vite)
- All secrets via environment variables — no hardcoded values

---

## Stack

| Layer | Tech |
|---|---|
| Frontend | React, Vite, React Router |
| Backend | Node.js, Express.js |
| Database | PostgreSQL (Neon) |
| Auth | JWT, bcrypt |
| Encryption | AES-256-CBC (Node crypto) |
| AI | Google Gemini API |
| Security | helmet, express-rate-limit, morgan |

---

## Local Setup

### 1. Database
Run in PostgreSQL:

```sql
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TYPE api_key_event AS ENUM (
  'created', 'updated', 'revoked', 'key_deleted',
  'request_success', 'request_blocked_limit', 'request_failed'
);

CREATE TABLE api_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  key_hash TEXT NOT NULL,
  key_prefix VARCHAR(8),
  name VARCHAR(100),
  token_limit INT DEFAULT 0,
  usage_count INT DEFAULT 0,
  tokens_used INT DEFAULT 0,
  revoked BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  revoked_at TIMESTAMP WITH TIME ZONE,
  reset_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX idx_api_keys_prefix ON api_keys(key_prefix);

CREATE TABLE api_key_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  api_key_id UUID REFERENCES api_keys(id) ON DELETE SET NULL,
  event_type api_key_event NOT NULL,
  performed_by UUID REFERENCES users(id),
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE gemini_keys (
  user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  key_encrypted TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE
);
```

### 2. Backend
```env
# server/.env
PGHOST=
PGPORT=5432
PGUSER=
PGPASSWORD=
PGDATABASE=
PGSSLMODE=require
JWT_SECRET=
ENCRYPTION_SECRET=
CLIENT=http://localhost:5173
```
```bash
cd server && npm install && node server.js
```

### 3. Frontend
```env
# client/.env
VITE_API_URL=http://localhost:3000
```
```bash
cd client && npm install && npm run dev
```

### 4. Gateway Usage
```bash
curl -X POST https://your-backend/gateway/generate \
  -H "Authorization: Bearer YOUR_SUBKEY" \
  -H "Content-Type: application/json" \
  -d '{"prompt": "Your prompt here"}'
```

---

## Metrics Query
```sql
SELECT
  (SELECT COUNT(*) FROM users) AS total_users,
  (SELECT COUNT(*) FROM api_keys) AS total_keys,
  (SELECT COUNT(*) FROM api_key_logs WHERE event_type = 'request_success') AS successful_requests,
  (SELECT COUNT(*) FROM api_key_logs WHERE event_type = 'request_blocked_limit') AS blocked_requests;
```

---

## Known Limitations

- JWT stored in localStorage — httpOnly cookie migration planned
- Email not verified — OTP planned
- Single AI provider (Gemini) — multi-provider support planned

---

## Disclaimer

> ⚠️ **This is a portfolio/resume project — not intended for production use.**
>
> Reasonable security practices are implemented (AES-256-CBC encryption, bcrypt, JWT, parameterized queries, rate limiting) but **no guarantees are made regarding data security**. Do not store real or sensitive Gemini API keys. Email addresses are not verified. The author accepts no liability for data loss, security breaches, or misuse.
>This platform does not provide Gemini API access. Users must supply their own Google Gemini API key and are solely responsible for compliance with Google's Gemini API Terms of Service and Google APIs Terms of Service.
