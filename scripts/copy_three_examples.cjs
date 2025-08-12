/**
 * Copy selected three.js example scripts into public/legacy/vendor for sandbox use
 */
const fs = require('fs');
const path = require('path');

function ensureDir(p) {
  if (!fs.existsSync(p)) fs.mkdirSync(p, { recursive: true });
}

function copyFile(src, dest) {
  ensureDir(path.dirname(dest));
  fs.copyFileSync(src, dest);
  console.log('Copied', src, '->', dest);
}

(function main() {
  const root = process.cwd();
  const srcBaseJSM = path.join(root, 'node_modules', 'three', 'examples', 'jsm');
  const srcThreeModule = path.join(root, 'node_modules', 'three', 'build', 'three.module.js');
  const vendorBase = path.join(root, 'public', 'legacy', 'vendor');

  // Copy core module
  if (fs.existsSync(srcThreeModule)) {
    copyFile(srcThreeModule, path.join(vendorBase, 'three.module.js'));
  } else {
    console.error('Missing three.module.js at', srcThreeModule);
    process.exitCode = 2;
  }

  // Recursively copy entire jsm directory to ensure all dependencies are present
  function copyDirRecursive(srcDir, destDir) {
    ensureDir(destDir);
    const entries = fs.readdirSync(srcDir, { withFileTypes: true });
    for (const entry of entries) {
      const srcPath = path.join(srcDir, entry.name);
      const destPath = path.join(destDir, entry.name);
      if (entry.isDirectory()) {
        copyDirRecursive(srcPath, destPath);
      } else if (entry.isFile()) {
        copyFile(srcPath, destPath);
      }
    }
  }

  const destJSM = path.join(vendorBase, 'examples', 'jsm');
  if (!fs.existsSync(srcBaseJSM)) {
    console.error('Missing three/examples/jsm at', srcBaseJSM);
    process.exitCode = 2;
  } else {
    copyDirRecursive(srcBaseJSM, destJSM);
  }
})();


