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

// Initialize Firebase when SDK is available
function initializeFirebase() {
  if (typeof firebase !== 'undefined' && !firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
    console.log('Firebase initialized successfully');
    return true;
  } else if (typeof firebase !== 'undefined') {
    console.log('Firebase already initialized');
    return true;
  } else {
    console.log('Firebase SDK not yet loaded, waiting...');
    return false;
  }
}

// Try to initialize immediately, or wait for Firebase to load
if (!initializeFirebase()) {
  // Wait for Firebase to be available
  const checkFirebase = setInterval(() => {
    if (initializeFirebase()) {
      clearInterval(checkFirebase);
    }
  }, 100);
  
  // Timeout after 5 seconds
  setTimeout(() => {
    clearInterval(checkFirebase);
    console.error('Firebase SDK failed to load within 5 seconds');
  }, 5000);
}

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