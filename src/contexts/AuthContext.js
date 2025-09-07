// AuthContext.js
import React, { createContext, useContext, useEffect, useState } from 'react';
import { initializeAuth, initializeFirestore } from '../config/firebase';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { deleteDoc } from 'firebase/firestore';


const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [auth, setAuth] = useState(null);
  const [db, setDb] = useState(null);
  console.log("DB STATE:", db);

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

  const createMessageDoc = async (userId) => {
    try {
      const firestoreModule = await import('firebase/firestore');
      const { DateTime } = await import('luxon');
      
      const createdAt = DateTime.now().toISO();
      const messageData = {
        userId,
        messages: [],
        createdAt,
        updatedAt: createdAt,
      };
  
      const messageRef = firestoreModule.doc(db, "messages", userId);
      await firestoreModule.setDoc(messageRef, messageData);
      console.log("✅ Message document created for user:", userId);
  
      return messageData;
    } catch (error) {
      console.error("❌ Error creating message document:", error);
      throw error;
    }
  };

  // Helper function to create user document in Firestore
  const createUserDocument = async (user, username, notifications, additionalData = {}) => {
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
          username: username,
          groups: [],
          calendars: [],
          createdAt: now,
          updatedAt: now,
          isActive: true,
          // Additional fields for app functionality
          profilePicture: user.photoURL || null,
          preferences: {
            theme: 'system',
            defaultLoadingPage: 'Calendar',
            defaultCalendarView: 'month',
            defaultTimeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
            weekStartsOn: 'sunday',
            notifications: notifications,
            notifyFor: {
              groupActivity: notifications,
              newTasks: notifications,
              updatedTasks: notifications,
              deleteTasks: notifications,
              newNotes: notifications,
              mentions: notifications,
              reminders: notifications,
              messages: notifications,
            }
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

  const login = async (email, password) => {
    if (!auth) throw new Error('Auth not initialized');
    const authModule = await import('firebase/auth');
    const result = await authModule.signInWithEmailAndPassword(auth, email, password);
    
    // Update user document on login
    //await createUserDocument(result.user);
    
    return result;
  };

  const signup = async (email, password, username, notifications) => {
    if (!auth) throw new Error('Auth not initialized');
    const authModule = await import('firebase/auth');
    
    // Step 1: Create Firebase auth user first (outside the atomic block)
    const result = await authModule.createUserWithEmailAndPassword(auth, email, password);
    
    // ATOMIC OPERATIONS: Create user document and message document
    try {
      // Step 2: Create user document
      await createUserDocument(result.user, username, notifications);
      console.log('✅ User document created');
  
      // Step 3: Create message document
      await createMessageDoc(result.user.uid);
      console.log('✅ Message document created');
  
    } catch (error) {
      console.error('❌ Atomic operation failed:', error);
      
      // Rollback: Delete Firebase auth user if document creation failed
      try {
        await result.user.delete();
        console.log('🔄 Rollback: Firebase auth user deleted');
      } catch (rollbackError) {
        console.error('❌ Rollback failed:', rollbackError);
      }
      
      throw new Error("Failed to create complete user profile");
    }
  
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