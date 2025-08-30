// src/contexts/DataContext.js
import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';

const DataContext = createContext();

export const useData = () => {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
};

export const DataProvider = ({ children }) => {
  const { user: authUser, db } = useAuth();   // get Firestore instance from AuthContext
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchUserDoc = async () => {
      if (!authUser || !db) {
        setUser(null);
        return;
      }

      setLoading(true);
      try {
        const firestoreModule = await import("firebase/firestore");
        const { doc, getDoc } = firestoreModule;

        const userRef = doc(db, "users", authUser.uid);
        const snapshot = await getDoc(userRef);

        if (snapshot.exists()) {
          setUser(snapshot.data());
          console.log("Fetched user doc:", snapshot.data());
        } else {
          console.warn("No user document found for:", authUser.uid);
          setUser(null);
        }
      } catch (error) {
        console.error("Error fetching user document:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchUserDoc();
  }, [authUser, db]);

  // --- event & profile functions ---
  const addEvent = async (eventData) => {
    console.log('TODO: Add event to Firestore', eventData);
    // Firestore logic goes here later
  };

  const updateEvent = async (eventId, eventData) => {
    console.log('TODO: Update event in Firestore', eventId, eventData);
  };

  const deleteEvent = async (eventId) => {
    console.log('TODO: Delete event in Firestore', eventId);
  };

  const updateUserProfile = async (profileData) => {
    console.log('TODO: Update user profile in Firestore', profileData);
  };

  const value = {
    user,
    loading,
    addEvent,
    updateEvent,
    deleteEvent,
    updateUserProfile,
  };

  return (
    <DataContext.Provider value={value}>
      {children}
    </DataContext.Provider>
  );
};
