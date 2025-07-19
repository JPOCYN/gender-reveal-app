// Build script for Vercel deployment
// This script replaces placeholder values in firebaseConfig.js with actual environment variables

const fs = require('fs');
const path = require('path');

// Read the current firebaseConfig.js
const configPath = path.join(__dirname, 'firebaseConfig.js');
let configContent = fs.readFileSync(configPath, 'utf8');

// Replace placeholder values with environment variables
const replacements = {
  'AIzaSyBXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX': process.env.VITE_FIREBASE_API_KEY || 'AIzaSyBXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX',
  'your-project.firebaseapp.com': process.env.VITE_FIREBASE_AUTH_DOMAIN || 'your-project.firebaseapp.com',
  'https://your-project-default-rtdb.firebaseio.com': process.env.VITE_FIREBASE_DATABASE_URL || 'https://your-project-default-rtdb.firebaseio.com',
  'your-project': process.env.VITE_FIREBASE_PROJECT_ID || 'your-project',
  'your-project.appspot.com': process.env.VITE_FIREBASE_STORAGE_BUCKET || 'your-project.appspot.com',
  '123456789012': process.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '123456789012',
  '1:123456789012:web:abcdef1234567890': process.env.VITE_FIREBASE_APP_ID || '1:123456789012:web:abcdef1234567890',
  'G-XXXXXXXXXX': process.env.VITE_FIREBASE_MEASUREMENT_ID || 'G-XXXXXXXXXX'
};

// Apply replacements
Object.entries(replacements).forEach(([placeholder, value]) => {
  configContent = configContent.replace(new RegExp(placeholder.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), value);
});

// Write the updated config
fs.writeFileSync(configPath, configContent);

console.log('Firebase config updated with environment variables');
console.log('Environment variables found:', {
  apiKey: process.env.VITE_FIREBASE_API_KEY ? '✓' : '✗',
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN ? '✓' : '✗',
  databaseURL: process.env.VITE_FIREBASE_DATABASE_URL ? '✓' : '✗',
  projectId: process.env.VITE_FIREBASE_PROJECT_ID ? '✓' : '✗',
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET ? '✓' : '✗',
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID ? '✓' : '✗',
  appId: process.env.VITE_FIREBASE_APP_ID ? '✓' : '✗',
  measurementId: process.env.VITE_FIREBASE_MEASUREMENT_ID ? '✓' : '✗'
}); 