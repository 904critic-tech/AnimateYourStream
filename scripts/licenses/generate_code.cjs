// Generate a time-limited license code signed with Ed25519
// Usage:
//   node scripts/licenses/generate_code.cjs --plan 7d
//   node scripts/licenses/generate_code.cjs --plan 30d --features viewer,builder,riggingHub --bind domain=localhost --name JohnDoe

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

function parseArgs() {
  const args = process.argv.slice(2);
  const out = {};
  for (let i = 0; i < args.length; i++) {
    const a = args[i];
    if (a === '--plan') out.plan = args[++i];
    else if (a === '--features') out.features = args[++i];
    else if (a === '--bind') out.bind = args[++i];
    else if (a === '--name') out.name = args[++i];
  }
  return out;
}

function base64url(buf) {
  return Buffer.from(buf).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/,'');
}
function groupCode(s, size = 5) {
  const chunks = [];
  for (let i = 0; i < s.length; i += size) chunks.push(s.slice(i, i + size));
  return chunks.join('-');
}

const { plan, features, bind, name } = parseArgs();
if (!plan || !['7d','30d'].includes(plan)) {
  console.error('Provide --plan 7d|30d'); process.exit(2);
}
const durations = { '7d': 7*24*60*60*1000, '30d': 30*24*60*60*1000 };
const now = Date.now();
const exp = now + durations[plan];
const nonce = crypto.randomBytes(16).toString('hex');

const payload = { ver: 1, plan, iat: now, exp, nonce };
if (features) payload.features = String(features).split(',').map(s => s.trim()).filter(Boolean);
if (bind) {
  const [k,v] = String(bind).split('=');
  if (k && v) payload.bind = { [k]: v };
}
if (name) payload.name = name;

// Canonical-ish JSON by stable key order
const ordered = {};
['ver','plan','iat','exp','nonce','features','bind','name'].forEach(k => { if (payload[k] !== undefined) ordered[k] = payload[k]; });
const jsonStr = JSON.stringify(ordered);

// Sign with Ed25519
const privPath = path.join('licenses', 'private_ed25519.pem');
if (!fs.existsSync(privPath)) {
  console.error('Missing licenses/private_ed25519.pem. Run: npm run license:init'); process.exit(3);
}
const privateKey = crypto.createPrivateKey(fs.readFileSync(privPath));
const sig = crypto.sign(null, Buffer.from(jsonStr), privateKey); // Ed25519 ignores digest param

const token = base64url(Buffer.from(jsonStr)) + '.' + base64url(sig);
const pretty = groupCode(token, 5);

fs.mkdirSync('.tmp/licenses', { recursive: true });
const outMeta = {
  code: token,
  pretty,
  plan,
  issuedAt: new Date(now).toISOString(),
  expiresAt: new Date(exp).toISOString(),
  features: payload.features || [],
  bind: payload.bind || null,
  name: payload.name || null,
};
const outPath = path.join('.tmp/licenses', `${plan}_${nonce.slice(0,8)}.json`);
fs.writeFileSync(outPath, JSON.stringify(outMeta, null, 2));

console.log('License code (paste into app):');
console.log(pretty);
console.log('\nSaved metadata:', outPath);


