// For Firebase JS SDK v7.20.0 and later, measurementId is optional
// This configuration works with Vercel environment variables
// For local development, you can replace these values directly

// Try to get environment variables from Vercel's build-time injection
// or use fallback values for local development
const firebaseConfig = {
  apiKey: "AIzaSyBXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX", // Replace with your actual API key
  authDomain: "your-project.firebaseapp.com", // Replace with your actual auth domain
  databaseURL: "https://your-project-default-rtdb.firebaseio.com", // Replace with your actual database URL
  projectId: "your-project", // Replace with your actual project ID
  storageBucket: "your-project.appspot.com", // Replace with your actual storage bucket
  messagingSenderId: "123456789012", // Replace with your actual messaging sender ID
  appId: "1:123456789012:web:abcdef1234567890", // Replace with your actual app ID
  measurementId: "G-XXXXXXXXXX" // Replace with your actual measurement ID
};

// For Vercel deployment, you can use build-time environment variable replacement
// by creating a build script that replaces these values during deployment
// 
// Alternative approach: Create a separate config file that gets generated
// during the build process with the actual environment variables

console.log('Firebase config loaded:', {
  apiKey: firebaseConfig.apiKey ? 'Set' : 'Not set',
  databaseURL: firebaseConfig.databaseURL ? 'Set' : 'Not set',
  projectId: firebaseConfig.projectId ? 'Set' : 'Not set'
});