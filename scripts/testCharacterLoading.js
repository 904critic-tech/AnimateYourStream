/**
 * Character Loading Test Script - Agent 2
 * 
 * This script tests the character loading functionality to identify
 * why "No character files found" error occurs.
 */

const fs = require('fs');
const path = require('path');

console.log('⚡ Agent 2: Starting character loading diagnostics...');

// Test 1: Check if the file exists
const modelPath = path.join(__dirname, '../public/models/Default_Model.fbx');
console.log('⚡ Agent 2: Checking file path:', modelPath);

if (fs.existsSync(modelPath)) {
  console.log('✅ Agent 2: File EXISTS at path');
  
  const stats = fs.statSync(modelPath);
  console.log('⚡ Agent 2: File size:', (stats.size / (1024 * 1024)).toFixed(2), 'MB');
  console.log('⚡ Agent 2: File permissions:', stats.mode.toString(8));
  
} else {
  console.error('❌ Agent 2: File DOES NOT EXIST at path');
}

// Test 2: Check public directory structure
const publicDir = path.join(__dirname, '../public');
const modelsDir = path.join(publicDir, 'models');

console.log('\n⚡ Agent 2: Checking directory structure...');
console.log('⚡ Agent 2: Public directory exists:', fs.existsSync(publicDir));
console.log('⚡ Agent 2: Models directory exists:', fs.existsSync(modelsDir));

if (fs.existsSync(modelsDir)) {
  const files = fs.readdirSync(modelsDir);
  console.log('⚡ Agent 2: Files in models directory:', files);
}

// Test 3: Check if the file is accessible via HTTP (simulate browser request)
console.log('\n⚡ Agent 2: Testing HTTP accessibility...');

// Create a simple HTTP server to test file access
const http = require('http');
const url = require('url');

const server = http.createServer((req, res) => {
  const parsedUrl = url.parse(req.url, true);
  const pathname = parsedUrl.pathname;
  
  console.log('⚡ Agent 2: HTTP request for:', pathname);
  
  if (pathname === '/models/Default_Model.fbx') {
    const filePath = path.join(__dirname, '../public/models/Default_Model.fbx');
    
    if (fs.existsSync(filePath)) {
      const stat = fs.statSync(filePath);
      res.writeHead(200, {
        'Content-Type': 'application/octet-stream',
        'Content-Length': stat.size
      });
      
      const stream = fs.createReadStream(filePath);
      stream.pipe(res);
      
      console.log('✅ Agent 2: File served successfully via HTTP');
    } else {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('File not found');
      console.log('❌ Agent 2: File not found via HTTP');
    }
  } else {
    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('Not found');
  }
});

server.listen(3002, () => {
  console.log('⚡ Agent 2: Test server running on http://localhost:3002');
  console.log('⚡ Agent 2: Testing file access...');
  
  // Test the file access
  const testUrl = 'http://localhost:3002/models/Default_Model.fbx';
  
  http.get(testUrl, (res) => {
    console.log('⚡ Agent 2: HTTP response status:', res.statusCode);
    console.log('⚡ Agent 2: HTTP response headers:', res.headers);
    
    if (res.statusCode === 200) {
      console.log('✅ Agent 2: File is accessible via HTTP');
    } else {
      console.log('❌ Agent 2: File is not accessible via HTTP');
    }
    
    // Close the server after test
    server.close(() => {
      console.log('⚡ Agent 2: Test server closed');
      console.log('\n⚡ Agent 2: Character loading diagnostics completed');
    });
  }).on('error', (err) => {
    console.error('❌ Agent 2: HTTP test failed:', err.message);
    server.close();
  });
});
