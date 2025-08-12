# Time‑Limited License Codes (7/30 days) — Offline Validation

Owner: Coordinator
Status: Planned
Scope: Add a time‑limited access system that accepts codes valid for 7 or 30 days. Codes can be generated manually by the owner or automatically after payment. Validation is fully offline in the app; no third‑party dependency.

## Goals
- Allow activation via a code valid for 7 or 30 days.
- Two issuance paths:
  - Manual: Owner generates a code on demand.
  - Payment: Code issued automatically on successful checkout (e.g., Stripe webhook).
- Offline verification inside the app using public‑key signatures.
- Show remaining days; handle basic clock‑rollbacks defensively.

## Constraints
- Vendor‑agnostic; no references to third‑party brand names in UI or docs.
- Works offline; online features (webhooks/email) are optional and not required to run the app.

## License Format
- Encoded string (Base32 Crockford or Base64url) with short groups for user entry.
- Payload (JSON):
  - `ver`: number (format version)
  - `plan`: "7d" | "30d"
  - `iat`: issued‑at (epoch ms, server time at issuance)
  - `exp`: expiry (epoch ms = iat + duration)
  - `nonce`: random id (prevents code guessing)
  - `features`: optional list (e.g., ["viewer", "builder", "riggingHub"]) 
  - `bind?`: optional binding (e.g., `{ domain:"localhost", }`)
- Signature: Ed25519 over canonical JSON bytes. 
  - Private key kept offline by owner and in the payment webhook backend.
  - Public key embedded in the app for verification.

## Issuance
- Manual CLI (offline):
  - `node scripts/licenses/generate_code.cjs --plan 7d --features viewer,builder --bind domain=localhost`
  - Outputs: license code string + metadata JSON + optional QR.
- Post‑Payment (optional):
  - Webhook (e.g., Stripe `checkout.session.completed`) → calls generator and emails code to buyer.
  - This backend is optional; the app stays offline‑capable.

## Verification (App)
- Implement `verifyLicense(code: string): { ok, plan, exp, daysRemaining }` using WebCrypto (Ed25519) or tweetnacl.
- Checks:
  - Signature is valid against embedded public key.
  - Current time <= `exp`.
  - Optional binding checks (domain, etc.).
- Store locally: `{ code, lastSeenMs }` in `localStorage`.
- Clock rollback guard:
  - Track `maxSeenTimeMs`. If current time < `maxSeenTimeMs - 24h`, flag potential rollback and pause features until user confirms.

## UI/UX
- Activation modal on first launch if no valid license.
- Input field for code with paste support; show days remaining.
- Non‑blocking banner when <3 days remain.
- On expiry, gracefully degrade to free features.

## Integration Points
- Gating: wrap premium routes/features (`/builder`, Rigging Hub advanced steps) behind `hasValidLicense` selector in the store.
- Persist after activation and re‑check on startup.

## Revocation (Optional, Online‑Only)
- A `revocations.json` file hosted with the app can be checked when online.
- Not required for offline use; the signature check remains the primary control.

## Security Notes
- Never ship the private key; keep it only in the CLI and payment webhook host.
- Keep license payload minimal; do not store PII.
- Prefer canonical JSON and stable encoding to avoid signature pitfalls.

## Acceptance Criteria
- Manual path: owner generates a 7‑day and 30‑day code; app accepts both; days remaining are shown.
- Offline validation works; app functions without network.
- After payment path (if configured), webhook emits a valid code and email is sent (out of scope for offline app, but documented).

## Next Steps
- See `coordination/LICENSE_CODES_TASKS.md` for per‑agent tasks and milestones.
