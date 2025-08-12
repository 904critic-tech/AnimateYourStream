// One-time: create Ed25519 keypair for signing licenses (private stays local)
const { generateKeyPairSync } = require('crypto');
const fs = require('fs');
const path = require('path');

fs.mkdirSync('licenses', { recursive: true });

const { publicKey, privateKey } = generateKeyPairSync('ed25519');

fs.writeFileSync(
  path.join('licenses', 'private_ed25519.pem'),
  privateKey.export({ type: 'pkcs8', format: 'pem' })
);
fs.writeFileSync(
  path.join('licenses', 'public_ed25519.pem'),
  publicKey.export({ type: 'spki', format: 'pem' })
);

console.log('Wrote licenses/private_ed25519.pem and licenses/public_ed25519.pem');
console.log('Keep the private key secret. The public key will be embedded in the app later for verification.');


