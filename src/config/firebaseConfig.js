// Firebase Configuration
// Uses environment variables for security in production
// For local development, create a .env file with your Firebase credentials

// Safely access environment variables with fallbacks
const getEnvVar = (key, fallback) => {
  try {
    return import.meta.env?.[key] || fallback;
  } catch (error) {
    console.warn(`Could not access environment variable ${key}, using fallback`);
    return fallback;
  }
};

const firebaseConfig = {
  apiKey: getEnvVar('VITE_FIREBASE_API_KEY', "AIzaSyD7TJLAv20tPheXff5o5rXc_aMRSQrYL-g"),
  authDomain: getEnvVar('VITE_FIREBASE_AUTH_DOMAIN', "gender-reveal-app-7dc64.firebaseapp.com"),
  databaseURL: getEnvVar('VITE_FIREBASE_DATABASE_URL', "https://gender-reveal-app-7dc64-default-rtdb.asia-southeast1.firebasedatabase.app"),
  projectId: getEnvVar('VITE_FIREBASE_PROJECT_ID', "gender-reveal-app-7dc64"),
  storageBucket: getEnvVar('VITE_FIREBASE_STORAGE_BUCKET', "gender-reveal-app-7dc64.firebasestorage.app"),
  messagingSenderId: getEnvVar('VITE_FIREBASE_MESSAGING_SENDER_ID', "306658063612"),
  appId: getEnvVar('VITE_FIREBASE_APP_ID', "1:306658063612:web:02554c3599ff65cce0d379"),
  measurementId: getEnvVar('VITE_FIREBASE_MEASUREMENT_ID', "G-ZP2PTQP8Q4")
};

// Log the actual config being used (for debugging)
console.log('Firebase config being used:', {
  apiKey: firebaseConfig.apiKey.substring(0, 10) + '...',
  authDomain: firebaseConfig.authDomain,
  databaseURL: firebaseConfig.databaseURL,
  projectId: firebaseConfig.projectId
});

// Global Firebase ready state
window.firebaseReady = false;
window.firebaseInitPromise = null;

// Initialize Firebase when SDK is available
function initializeFirebase() {
  try {
    console.log('Checking Firebase availability...', {
      firebaseDefined: typeof firebase !== 'undefined',
      firebaseApp: typeof firebase !== 'undefined' ? typeof firebase.app : 'N/A',
      firebaseApps: typeof firebase !== 'undefined' ? typeof firebase.apps : 'N/A',
      appsLength: typeof firebase !== 'undefined' ? firebase.apps.length : 'N/A'
    });
    
    // Check if Firebase SDK is fully loaded
    if (typeof firebase === 'undefined') {
      console.log('Firebase SDK not loaded yet');
      return false;
    }
    
    // Check if Firebase.app is available (indicates SDK is fully loaded)
    if (typeof firebase.app === 'undefined') {
      console.log('Firebase.app not available yet');
      return false;
    }
    
    if (!firebase.apps.length) {
      console.log('Initializing Firebase...');
      firebase.initializeApp(firebaseConfig);
      console.log('Firebase initialized successfully');
      window.firebaseReady = true;
      return true;
    } else {
      console.log('Firebase already initialized');
      window.firebaseReady = true;
      return true;
    }
  } catch (error) {
    console.error('Error initializing Firebase:', error);
    return false;
  }
}

// Create a promise that resolves when Firebase is ready
window.firebaseInitPromise = new Promise((resolve, reject) => {
  console.log('Creating Firebase init promise...');
  
  // Try to initialize immediately
  if (initializeFirebase()) {
    console.log('Firebase initialized immediately');
    resolve();
    return;
  }
  
  // Wait for Firebase to be available
  let attempts = 0;
  const maxAttempts = 100; // 10 seconds
  
  const checkFirebase = setInterval(() => {
    attempts++;
    console.log(`Firebase init attempt ${attempts}/${maxAttempts}...`);
    
    if (initializeFirebase()) {
      clearInterval(checkFirebase);
      console.log('Firebase initialized successfully after waiting');
      resolve();
    } else if (attempts >= maxAttempts) {
      clearInterval(checkFirebase);
      console.error('Firebase SDK failed to load within 10 seconds');
      reject(new Error('Firebase SDK failed to load within 10 seconds'));
    }
  }, 100);
});

// Development mode logging
try {
  if (import.meta.env?.VITE_DEV_MODE === 'true') {
    console.log('Firebase config loaded:', {
      apiKey: firebaseConfig.apiKey !== "AIzaSyBXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX" ? 'Set' : 'Not set',
      databaseURL: firebaseConfig.databaseURL !== "https://your-project-default-rtdb.firebaseio.com" ? 'Set' : 'Not set',
      projectId: firebaseConfig.projectId !== "your-project" ? 'Set' : 'Not set'
    });
  }
} catch (error) {
  console.log('Firebase config loaded (development mode not available)');
}

// Export for use in other modules
export { firebaseConfig };