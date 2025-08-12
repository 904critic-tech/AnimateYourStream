/**
 * Model Rendering Diagnostic Test
 * 
 * Agent 2 - Performance Optimization Team
 * 
 * This script tests the model rendering system to identify
 * why Default_Model.fbx shows as a pill instead of character
 */

const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

console.log('🔍 Agent 2 - Model Rendering Diagnostic Test Starting...');

async function testModelRendering() {
  const browser = await puppeteer.launch({
    headless: false,
    defaultViewport: { width: 1200, height: 800 },
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  
  // Enable console logging
  page.on('console', msg => {
    console.log(`📱 Browser Console: ${msg.type()}: ${msg.text()}`);
  });

  // Enable error logging
  page.on('pageerror', error => {
    console.error(`❌ Browser Error: ${error.message}`);
  });

  try {
    console.log('🔍 Navigating to development server...');
    await page.goto('http://localhost:3001', { waitUntil: 'networkidle0' });
    
    // Wait for the application to load
    await new Promise(r => setTimeout(r, 5000));
    
    console.log('🔍 Checking model loading status...');
    
    // Check if the model is loading
    const loadingStatus = await page.evaluate(() => {
      // Check for loading indicators
      const loadingElements = document.querySelectorAll('[data-testid="loading"]');
      const errorElements = document.querySelectorAll('[data-testid="error"]');
      
      // Check console logs for model loading messages
      const consoleMessages = [];
      
      return {
        loadingElements: loadingElements.length,
        errorElements: errorElements.length,
        consoleMessages
      };
    });
    
    console.log('📊 Loading Status:', loadingStatus);
    
    // Wait for model to load
    console.log('🔍 Waiting for model to load...');
    await new Promise(r => setTimeout(r, 10000));
    
    // Check if placeholder is being shown
    const modelStatus = await page.evaluate(() => {
      // Look for placeholder elements (capsule geometry)
      const placeholderElements = document.querySelectorAll('mesh');
      
      // Check if any 3D objects are present
      const threeObjects = document.querySelectorAll('canvas');
      
      return {
        placeholderElements: placeholderElements.length,
        threeObjects: threeObjects.length,
        pageTitle: document.title,
        url: window.location.href
      };
    });
    
    console.log('📊 Model Status:', modelStatus);
    
    // Take a screenshot for visual verification
    console.log('📸 Taking screenshot for visual verification...');
    await page.screenshot({ 
      path: 'model-rendering-test.png', 
      fullPage: true 
    });
    
    // Check browser console for specific error messages
    console.log('🔍 Checking for specific error messages...');
    const errors = await page.evaluate(() => {
      return {
        hasErrors: window.console.error.called || false,
        modelLoaded: window.modelLoaded || false,
        loadError: window.loadError || null
      };
    });
    
    console.log('📊 Error Status:', errors);
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await browser.close();
  }
}

// Run the test
testModelRendering().then(() => {
  console.log('✅ Model rendering diagnostic test completed');
}).catch(error => {
  console.error('❌ Test failed:', error);
});
