# AI API Gateway

A Multi Tenant platform for managing and distributing AI API access via scoped subkeys — without exposing your provider API keys.

**Live:** [https://ai-api-gateway.netlify.app/](https://ai-api-gateway.netlify.app/) · [https://ai-api-gateway.onrender.com/health](https://ai-api-gateway.onrender.com/health)

---

## Use Case

You have an AI provider API key and need to give access to teammates or applications without exposing the original key.

Create named subkeys with token limits, monitor usage, and revoke access instantly. The provider API key stays encrypted on the server and is never returned to clients.

---

## Technical Highlights

### Authentication & Security

- JWT-based authentication with bcrypt password hashing (10 rounds)
- AES-256-CBC encrypted provider API key storage — keys are never returned in API responses
- Parameterized PostgreSQL queries throughout
- `helmet` security headers
- `express-rate-limit` with `trust proxy` for accurate per-IP enforcement on Render
- Provider API keys are supplied by users and stored encrypted

### Subkey System

- Subkeys are stored as bcrypt hashes
- Key-prefix lookup before bcrypt comparison to avoid unnecessary full-table scans
- Token limits enforced before AI generation when token estimation is available
- One-time overflow allowed after generation
- 24-hour rolling usage window with `reset_at` timestamp per subkey
- Revocable subkeys with usage tracking

### Multi-Provider Gateway

- Supports Google Gemini and OpenAI
- Each account configures one provider API key
- Subkeys automatically use the provider configured for their owning account
- Provider API keys are decrypted server-side only
- The client never needs to know or provide the upstream provider key
- Provider-specific API calls are handled internally by the gateway

### Audit Trail

- PostgreSQL enum-typed event log
- Tracks:
  - `created`
  - `updated`
  - `revoked`
  - `key_deleted`
  - `request_success`
  - `request_blocked_limit`
  - `request_failed`
- `performed_by` tracks the user responsible for each event
- Audit logs remain queryable after subkey deletion

### Infrastructure

- Backend: Render (Node.js/Express)
- Database: Neon (serverless PostgreSQL)
- Frontend: Netlify (React/Vite)
- All secrets managed through environment variables

---

## Stack

| Layer | Tech |
|---|---|
| Frontend | React, Vite, React Router |
| Backend | Node.js, Express.js |
| Database | PostgreSQL (Neon) |
| Authentication | JWT, bcrypt |
| Encryption | Node.js `crypto`, AES-256-CBC |
| AI | Google Gemini API, OpenAI API |
| Security | helmet, express-rate-limit, morgan |

---

## Supported AI Providers

The gateway currently supports:

### Google Gemini

Uses Google's Gemini API with `gemini-3.5-flash-lite` for cost-efficient text generation.

### OpenAI

Uses OpenAI's Responses API for text generation.

Provider selection is configured on the account rather than on individual gateway requests.

---

## Local Setup

### 1. Database

Run the following in PostgreSQL:

```sql
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TYPE api_key_event AS ENUM (
  'created',
  'updated',
  'revoked',
  'key_deleted',
  'request_success',
  'request_blocked_limit',
  'request_failed'
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

CREATE TABLE provider_keys (
  user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  provider VARCHAR(20) NOT NULL CHECK (provider IN ('gemini', 'openai')),
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
cd server
npm install
node server.js
```

### 3. Frontend

```env
# client/.env

VITE_API_URL=http://localhost:3000
```

```bash
cd client
npm install
npm run dev
```

---

## Gateway Usage

Create a gateway subkey from the dashboard, then use it to send requests:

```bash
curl -X POST https://your-backend/gateway/generate \
  -H "Authorization: Bearer YOUR_SUBKEY" \
  -H "Content-Type: application/json" \
  -d '{"prompt": "Your prompt here"}'
```

The gateway determines which upstream provider to use from the provider configured for the account that owns the subkey.

The upstream provider API key is never included in the request.

---

## Metrics Query

```sql
SELECT
  (SELECT COUNT(*) FROM users) AS total_users,
  (SELECT COUNT(*) FROM api_keys) AS total_keys,
  (SELECT COUNT(*) FROM api_key_logs
   WHERE event_type = 'request_success') AS successful_requests,
  (SELECT COUNT(*) FROM api_key_logs
   WHERE event_type = 'request_blocked_limit') AS blocked_requests;
```

---

## Known Limitations

* JWT stored in `localStorage` — httpOnly cookie migration planned
* Email not verified — OTP planned
* One provider configuration per account
* Provider selection is account-level rather than subkey-level
* No provider fallback or automatic routing
* No per-model permissions
* No centralized cost tracking
* No provider-specific rate-limit management
* AI provider adapters are intentionally kept simple while only two providers are supported

---

## Disclaimer

> ⚠️ **This is a portfolio/resume project — not intended for production use.**

Reasonable security practices are implemented (AES-256-CBC encryption, bcrypt, JWT, parameterized queries, rate limiting), but **no guarantees are made regarding data security**.

Do not store real or sensitive API keys in this project.

Users are responsible for complying with the terms and policies of the AI providers whose API keys they use.

This platform does not provide AI provider access itself. Users must supply their own supported provider API key.