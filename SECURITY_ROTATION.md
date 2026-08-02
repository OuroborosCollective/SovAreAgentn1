# Security Architecture & Token Rotation Guide

## 1. Security Overview

This application enforces zero-trust token isolation and fail-closed security policies:

- **Token Isolation**: All OAuth access tokens and Personal Access Tokens (PATs) are stored strictly in `HttpOnly`, `Secure`, `SameSite: None` signed cookies (`n1_sync_auth` and `n1_google_auth`). Tokens are NEVER returned in API responses, JSON payloads, or client-side JavaScript.
- **CSRF & State Protection**: OAuth authorization flows use cryptographically generated 128-bit random state parameters stored in signed cookies (`nexus_oauth_state`) and verified upon callback.
- **postMessage Origin Isolation**: OAuth popup success messages contain zero credentials and target `window.location.origin` explicitly instead of wildcard (`*`).
- **Secret Management**:
  - `N1_COOKIE_SECRET` is used for cookie signing. In production, if missing, a cryptographically secure random 256-bit runtime secret is generated.
  - Hardcoded token fallbacks (e.g. `DEFAULT_NEXUS_TOKEN`) have been permanently removed.

---

## 2. Token Rotation & Revocation Procedures

### A. Revoking Compromised GitHub Tokens
1. Navigate to **GitHub Settings** -> **Developer Settings** -> **Personal Access Tokens** (or **Authorized OAuth Apps**).
2. Locate the token or app connection (`SovAreAgentn1` / `Nexus VCS`).
3. Click **Revoke** or **Delete**.

### B. Rotating Environment Secret (`N1_SYNC_TOKEN`)
1. Generate a new GitHub Personal Access Token with required `repo` scopes.
2. In your deployment configuration or `.env`:
   ```env
   N1_SYNC_TOKEN=ghp_new_rotated_token_here
   ```
3. Restart the backend service.

### C. Rotating Cookie Signing Secret (`N1_COOKIE_SECRET`)
1. Generate a 256-bit random hex string:
   ```bash
   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
   ```
2. Update `N1_COOKIE_SECRET` in environment settings:
   ```env
   N1_COOKIE_SECRET=your_new_random_32_byte_hex_string
   ```
3. Restart the server. Existing cookie sessions will invalidate automatically, requiring users to re-authenticate cleanly.

---

## 3. Environment Variable Checklist

| Variable | Description |
|---|---|
| `N1_COOKIE_SECRET` | Secret used to sign HttpOnly session cookies |
| `N1_OAUTH_ID` | GitHub OAuth Client ID |
| `N1_OAUTH_SECRET` | GitHub OAuth Client Secret |
| `N1_SYNC_TOKEN` | Server-side master GitHub Personal Access Token (Optional) |
| `ALLOWED_ORIGINS` | Comma-separated list of permitted CORS origins |
