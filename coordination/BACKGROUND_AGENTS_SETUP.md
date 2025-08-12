# Background Agents Setup

This project is configured to support Cursor background agents for continuous health monitoring and code-quality checks.

## Prerequisites
- Node.js installed
- PowerShell 7 available as `pwsh` (Windows)

## Builder Service Health
- The local builder service now exposes `GET /health` on the same host/port as `/api/build`.
- Start the builder:
  - `npm run builder:serve`
- Health endpoint:
  - `http://127.0.0.1:${BUILDER_PORT||4001}/health`

## Agent Scripts
- `npm run agent:watch:lint` — runs ESLint in watch-ish mode (cached; prints issues)
- `npm run agent:watch:typecheck` — TypeScript type-check watcher
- `npm run agent:monitor:builder` — polls builder `/health` every 10s and logs status
- `npm run agents:start` — runs all the above concurrently

## Typical Background Profile (Cursor)
Define one or more background agents in Cursor tied to these commands:
- Lint watcher: `npm run agent:watch:lint`
- Typecheck watcher: `npm run agent:watch:typecheck`
- Builder monitor: `npm run agent:monitor:builder`

## Server Status Tracker Protocol
- Before any server interaction, log an entry in `coordination/SERVER_STATUS_TRACKER.md`.
- Include: who, when, purpose, command run, and outcomes.

## Notes
- These agents are read-only and do not restart servers.
- For additional monitors, mirror the pattern in `scripts/server/ping_builder_health.cjs`.


