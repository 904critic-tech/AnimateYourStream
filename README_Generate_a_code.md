# Generate a code (manual, offline)

Quick start

1) One-time key init (creates licenses/private_ed25519.pem locally)
```powershell
npm run license:init
```

2) Generate a 7-day code
```powershell
node scripts/licenses/generate_code.cjs --plan 7d
```

3) Generate a 30-day code
```powershell
node scripts/licenses/generate_code.cjs --plan 30d
```

Optional (features, binding, name)
```powershell
node scripts/licenses/generate_code.cjs --plan 30d --features viewer,builder,riggingHub --bind domain=localhost --name YourName
```

Interactive helper (prompts)
```powershell
pwsh -File scripts/licenses/Generate-Code.ps1
```

Outputs
- Terminal prints an easy-to-type grouped code
- JSON receipt saved under `.tmp/licenses/*.json` (includes expiry)

Notes
- Works fully offline; keep your private key safe at `licenses/private_ed25519.pem`
- Public key will be embedded in the app for verification later
