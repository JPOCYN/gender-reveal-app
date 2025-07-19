// Firebase Configuration
// Uses environment variables for security in production
// For local development, create a .env file with your Firebase credentials

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyBXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "your-project.firebaseapp.com",
  databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL || "https://your-project-default-rtdb.firebaseio.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "your-project",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "your-project.appspot.com",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "123456789012",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:123456789012:web:abcdef1234567890",
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || "G-XXXXXXXXXX"
};

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
if (import.meta.env.VITE_DEV_MODE === 'true') {
  console.log('Firebase config loaded:', {
    apiKey: firebaseConfig.apiKey !== "AIzaSyBXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX" ? 'Set' : 'Not set',
    databaseURL: firebaseConfig.databaseURL !== "https://your-project-default-rtdb.firebaseio.com" ? 'Set' : 'Not set',
    projectId: firebaseConfig.projectId !== "your-project" ? 'Set' : 'Not set'
  });
}

// Export for use in other modules
export { firebaseConfig };