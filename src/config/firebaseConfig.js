// Firebase Configuration
// Uses environment variables for security in production
// For local development, create a .env file with your Firebase credentials

// Safely access environment variables - NO FALLBACKS for security
const getEnvVar = (key) => {
  try {
    const value = import.meta.env?.[key];
    if (!value) {
      throw new Error(`Required environment variable ${key} is not set`);
    }
    return value;
  } catch (error) {
    console.error(`Critical error: Environment variable ${key} is required but not set`);
    throw error;
  }
};

const firebaseConfig = {
  apiKey: getEnvVar('VITE_FIREBASE_API_KEY'),
  authDomain: getEnvVar('VITE_FIREBASE_AUTH_DOMAIN'),
  databaseURL: getEnvVar('VITE_FIREBASE_DATABASE_URL'),
  projectId: getEnvVar('VITE_FIREBASE_PROJECT_ID'),
  storageBucket: getEnvVar('VITE_FIREBASE_STORAGE_BUCKET'),
  messagingSenderId: getEnvVar('VITE_FIREBASE_MESSAGING_SENDER_ID'),
  appId: getEnvVar('VITE_FIREBASE_APP_ID'),
  measurementId: getEnvVar('VITE_FIREBASE_MEASUREMENT_ID')
};

// Log the actual config being used (for debugging)
console.log('Firebase config being used:', {
  apiKey: firebaseConfig.apiKey.substring(0, 10) + '...',
  authDomain: firebaseConfig.authDomain,
  databaseURL: firebaseConfig.databaseURL,
  projectId: firebaseConfig.projectId,
  hasDatabaseURL: !!firebaseConfig.databaseURL,
  databaseURLLength: firebaseConfig.databaseURL ? firebaseConfig.databaseURL.length : 0
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