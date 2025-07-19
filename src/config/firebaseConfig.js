// Firebase Configuration
// Uses environment variables for security in production
// For local development, create a .env file with your Firebase credentials

// Safely access environment variables with proper fallbacks
const getEnvVar = (key, fallback = null) => {
  try {
    // Try to get from Vite environment variables
    const value = import.meta.env?.[key];
    if (value && value !== 'undefined') {
      return value;
    }
    
    // Try to get from process.env (Node.js environments)
    if (typeof process !== 'undefined' && process.env?.[key]) {
      return process.env[key];
    }
    
    // Check if we're in development mode (multiple ways to detect)
    const isDev = import.meta.env?.DEV || 
                  import.meta.env?.MODE === 'development' || 
                  window.location.hostname === 'localhost' ||
                  window.location.hostname === '127.0.0.1' ||
                  window.location.port === '3000';
    
    // Use fallback if provided (for both dev and prod to ensure app works)
    if (fallback) {
      if (isDev) {
        console.warn(`⚠️ Using fallback for ${key} in development mode`);
      } else {
        console.warn(`⚠️ Using fallback for ${key} - environment variable not found`);
      }
      return fallback;
    }
    
    // No fallback provided and no environment variable found
    throw new Error(`Required environment variable ${key} is not set. Please configure it in your hosting platform.`);
  } catch (error) {
    console.error(`Environment variable error for ${key}:`, error.message);
    
    // If we have a fallback, use it instead of crashing
    if (fallback) {
      console.warn(`🔄 Falling back to default value for ${key}`);
      return fallback;
    }
    
    throw error;
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

// Environment variable debug information
console.log('🔧 Firebase Environment Debug:', {
  location: {
    hostname: window.location.hostname,
    port: window.location.port,
    protocol: window.location.protocol
  },
  vite: {
    mode: import.meta.env?.MODE || 'unknown',
    dev: import.meta.env?.DEV || false,
    prod: import.meta.env?.PROD || false,
    hasViteEnv: !!import.meta.env,
    viteEnvKeys: import.meta.env ? Object.keys(import.meta.env).filter(k => k.startsWith('VITE_')) : []
  },
  envVars: {
    apiKey: import.meta.env?.VITE_FIREBASE_API_KEY ? '✅ Set' : '❌ Missing',
    authDomain: import.meta.env?.VITE_FIREBASE_AUTH_DOMAIN ? '✅ Set' : '❌ Missing',
    databaseURL: import.meta.env?.VITE_FIREBASE_DATABASE_URL ? '✅ Set' : '❌ Missing',
    projectId: import.meta.env?.VITE_FIREBASE_PROJECT_ID ? '✅ Set' : '❌ Missing'
  }
});

// Additional debug for troubleshooting
if (!import.meta.env?.VITE_FIREBASE_API_KEY) {
  console.log('🔍 Detailed Environment Analysis:', {
    importMetaEnv: import.meta.env,
    allViteVars: import.meta.env ? Object.keys(import.meta.env).filter(k => k.startsWith('VITE_')) : 'No Vite env available',
    nodeProcess: typeof process !== 'undefined' ? 'Available' : 'Not available'
  });
}

// Log the actual config being used (for debugging)
console.log('Firebase config being used:', {
  apiKey: firebaseConfig.apiKey ? firebaseConfig.apiKey.substring(0, 10) + '...' : 'MISSING',
  authDomain: firebaseConfig.authDomain,
  databaseURL: firebaseConfig.databaseURL,
  projectId: firebaseConfig.projectId,
  hasDatabaseURL: !!firebaseConfig.databaseURL,
  configSource: import.meta.env?.VITE_FIREBASE_API_KEY ? 'Environment Variables' : 'Fallback Values'
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