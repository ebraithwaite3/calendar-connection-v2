// AuthContext.js
import React, { createContext, useContext, useEffect, useState } from 'react';
import { initializeAuth, initializeFirestore } from '../config/firebase';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [auth, setAuth] = useState(null);
  const [db, setDb] = useState(null);

  useEffect(() => {
    const setupAuth = async () => {
      try {
        console.log('Setting up auth...');
        
        // Initialize both auth and firestore
        const [authInstance, dbInstance] = await Promise.all([
          initializeAuth(),
          initializeFirestore()
        ]);
        
        setAuth(authInstance);
        setDb(dbInstance);
        
        // Import auth functions dynamically
        const authModule = await import('firebase/auth');
        
        // Set up auth state listener
        const unsubscribe = authModule.onAuthStateChanged(authInstance, (user) => {
          console.log('Auth state changed:', user ? `User: ${user.email}` : 'No user');
          setUser(user);
          setLoading(false);
        });
        
        return unsubscribe;
      } catch (error) {
        console.error('Auth setup error:', error);
        setLoading(false);
      }
    };

    setupAuth();
  }, []);

  // Helper function to create user document in Firestore
  const createUserDocument = async (user, additionalData = {}) => {
    if (!user || !db) return;
    
    try {
      const firestoreModule = await import('firebase/firestore');
      const { DateTime } = await import('luxon');
      
      const userRef = firestoreModule.doc(db, 'users', user.uid);
      
      // Check if user document already exists
      const userSnapshot = await firestoreModule.getDoc(userRef);
      
      if (!userSnapshot.exists()) {
        const now = DateTime.now().toISO();
        const userData = {
          userId: user.uid,
          email: user.email,
          username: generateUsernameFromEmail(user.email),
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
          groups: [],
          calendars: [],
          subscriptions: [],
          createdAt: now,
          updatedAt: now,
          isActive: true,
          // Additional fields for app functionality
          displayName: user.displayName || generateUsernameFromEmail(user.email),
          profilePicture: user.photoURL || null,
          preferences: {
            theme: 'system',
            defaultView: 'month',
            weekStartsOn: 'sunday',
            notifications: true,
          },
          ...additionalData
        };
        
        await firestoreModule.setDoc(userRef, userData);
        console.log('User document created:', userData);
        return userData;
      } else {
        // Update last login time
        const now = DateTime.now().toISO();
        await firestoreModule.updateDoc(userRef, {
          updatedAt: now
        });
        console.log('User document exists, updated timestamp');
        return userSnapshot.data();
      }
    } catch (error) {
      console.error('Error creating user document:', error);
    }
  };

  // Helper function to generate username from email
  const generateUsernameFromEmail = (email) => {
    if (!email) return 'User';
    const name = email.split('@')[0];
    return name.charAt(0).toUpperCase() + name.slice(1).replace(/[._]/g, ' ');
  };

  const login = async (email, password) => {
    if (!auth) throw new Error('Auth not initialized');
    const authModule = await import('firebase/auth');
    const result = await authModule.signInWithEmailAndPassword(auth, email, password);
    
    // Update user document on login
    await createUserDocument(result.user);
    
    return result;
  };

  const signup = async (email, password) => {
    if (!auth) throw new Error('Auth not initialized');
    const authModule = await import('firebase/auth');
    const result = await authModule.createUserWithEmailAndPassword(auth, email, password);
    
    // Create user document on signup
    await createUserDocument(result.user);
    
    return result;
  };

  const logout = async () => {
    if (!auth) throw new Error('Auth not initialized');
    const authModule = await import('firebase/auth');
    return authModule.signOut(auth);
  };

  const value = {
    user,
    login,
    signup,
    logout,
    loading,
    auth,
    db,
    createUserDocument
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};