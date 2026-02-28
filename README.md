# AI API Gateway

A full stack PERN (PostgreSQL, Express, React, Node.js) application for managing and distributing Gemini AI API access via scoped subkeys — without ever exposing your master API key.

---

## The Problem It Solves

You have one Gemini API key and need to give access to multiple team members, applications, or interns — but exposing your master key is a security risk. This platform lets you:

- Create up to **10 named subkeys** per account
- Set **token limits** on each subkey
- **Monitor usage** — token consumption and call count per key
- **Revoke or delete** access instantly without touching your real key
- View a full **audit trail** of all key events and API requests

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React (Vite), React Router |
| Backend | Node.js, Express.js |
| Database | PostgreSQL |
| Auth | JWT (jsonwebtoken), bcrypt |
| Encryption | AES-256-CBC (Node.js crypto) |
| AI Provider | Google Gemini API (@google/genai) |
| Security | helmet, express-rate-limit, morgan |

---

## Features

- **JWT Authentication** — secure login/signup with bcrypt password hashing
- **Master Key Encryption** — Gemini API keys encrypted with AES-256-CBC before storage, never returned in any response
- **Subkey Management** — create, modify, revoke, and delete named API subkeys
- **Token Limit Enforcement** — pre-request token estimation blocks requests before they hit Gemini if limit is exceeded
- **24hr Rolling Reset Window** — usage counters reset every 24 hours per subkey
- **Key Prefix Lookup** — efficient subkey authentication using plaintext prefix index instead of full-table bcrypt scan
- **Audit Logs** — full event history with SET NULL on delete to preserve logs after key deletion
- **Rate Limiting** — global and gateway-specific rate limiting via express-rate-limit
- **Responsive UI** — works across desktop and mobile