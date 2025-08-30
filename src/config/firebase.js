// firebase.js
import { initializeApp } from 'firebase/app';
import AsyncStorage from '@react-native-async-storage/async-storage';

const firebaseConfig = {
  apiKey: "AIzaSyBMxp17cbYykwyv0hqbI_TUHzKo8wTkJ24",
  authDomain: "calendar-connection-v2.firebaseapp.com",
  projectId: "calendar-connection-v2",
  storageBucket: "calendar-connection-v2.firebasestorage.app",
  messagingSenderId: "356362430059",
  appId: "1:356362430059:web:781b123c4f2c73adc4332e",
  measurementId: "G-P3EVZZTNGC"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Auth with AsyncStorage persistence
let auth;
const initializeAuth = async () => {
  try {
    const authModule = await import('firebase/auth');
    
    try {
      auth = authModule.initializeAuth(app, {
        persistence: authModule.getReactNativePersistence(AsyncStorage)
      });
      console.log('✅ Auth initialized with AsyncStorage persistence');
    } catch (persistenceError) {
      console.log('⚠️ Persistence failed, falling back to memory-only auth:', persistenceError.message);
      auth = authModule.getAuth(app);
      console.log('✅ Auth initialized with memory persistence');
    }
    
    return auth;
  } catch (error) {
    console.error('❌ Auth initialization error:', error);
    throw error;
  }
};

// Initialize Firestore
let db;
const initializeFirestore = async () => {
  try {
    const firestoreModule = await import('firebase/firestore');
    db = firestoreModule.getFirestore(app);
    console.log('✅ Firestore initialized');
    return db;
  } catch (error) {
    console.error('❌ Firestore initialization error:', error);
    throw error;
  }
};

// Export the initializers and app
export { initializeAuth, initializeFirestore, app };