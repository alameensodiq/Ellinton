import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { initializeAuth, Auth } from 'firebase/auth';
import Constants from 'expo-constants';
import { Platform } from 'react-native';

interface FirebaseConfig {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket: string;
  messagingSenderId: string;
  appId: string;
}

// Get Firebase config from app.json extra
const firebaseConfig: FirebaseConfig = {
  apiKey: "AIzaSyAbAm5STH39OovJFMHQJziwBBueHlMuU2I",
  authDomain: "ellingtonmfbpersonal.firebaseapp.com", 
  projectId: "ellingtonmfbpersonal",
  storageBucket: "ellingtonmfbpersonal.firebasestorage.app",
  messagingSenderId: "292793727527",
  appId: "1:292793727527:ios:1a224ad5a3aa253ff96c02"
};

console.log('🔥 Firebase Config:', {
  projectId: firebaseConfig.projectId,
  authDomain: firebaseConfig.authDomain,
  hasApiKey: !!firebaseConfig.apiKey
});

// Validate config
const requiredConfigs: (keyof FirebaseConfig)[] = [
  'apiKey', 'authDomain', 'projectId', 
  'storageBucket', 'messagingSenderId', 'appId'
];

requiredConfigs.forEach(key => {
  if (!firebaseConfig[key]) {
    throw new Error(`Missing Firebase configuration: ${key}. Check your app.json extra.firebase section.`);
  }
});

// Initialize Firebase
let app: FirebaseApp;
let auth: Auth;

if (!getApps().length) {
  app = initializeApp(firebaseConfig);
  
  // Initialize auth based on platform
  if (Platform.OS !== 'web') {
    auth = initializeAuth(app);
  } else {
    const { getAuth } = require('firebase/auth');
    auth = getAuth(app);
  }
} else {
  app = getApp();
  const { getAuth } = require('firebase/auth');
  auth = getAuth(app);
}

export { app, auth };