import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { useAuth } from './AuthContext';
import { doc, onSnapshot } from 'firebase/firestore';
import { DateTime } from 'luxon';

const DataContext = createContext();

export const useData = () => {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
};

export const DataProvider = ({ children }) => {
  const { user: authUser, db } = useAuth(); // get Firestore instance from AuthContext
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentDate, setCurrentDate] = useState(DateTime.local().toISODate());

  console.log("LOADING STATE:", loading, "Current Date:", currentDate, "User:", user ? user.email || user.username : 'No user');

  useEffect(() => {
    // Set up a real-time listener for the user's document
    let unsubscribe = null;
    
    if (authUser && db) {
      setLoading(true);
      const userRef = doc(db, 'users', authUser.uid);
      
      unsubscribe = onSnapshot(userRef, (snapshot) => {
        if (snapshot.exists()) {
          const userData = snapshot.data();
          setUser(userData);
          console.log("Real-time update: User doc fetched and set.");
        } else {
          console.warn("No user document found for:", authUser.uid);
          setUser(null);
        }
        setLoading(false);
      }, (error) => {
        console.error("Error listening to user document:", error);
        setLoading(false);
      });
    } else {
      setUser(null);
      setLoading(true);
    }
    
    // Cleanup function to detach the listener when the component unmounts
    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [authUser, db]);

  // Helper function to get/set an update date to current date
  const setWorkingDate = (date) => {
    const isoDate = DateTime.fromJSDate(date).toISODate();
    setCurrentDate(isoDate);
    console.log("Set current date to:", isoDate);
  };

  // TO DO: Could be used to allow users to select their timezone, even if they're not in that timezone
  // Helper function to get today in the users timezone
  // const getToday = () => {
  //   return DateTime.local().toISODate();
  // };

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

  const value = useMemo(() => ({
    user,
    loading,
    currentDate,
    setWorkingDate,
    //getToday,
    calendarsInfo: user?.calendars || [],
    groupsInfo: user?.groups || [],
    preferences: user?.preferences || {},
    myUsername: user?.username || '',
    myUserId: user?.userId || '',
    addEvent,
    updateEvent,
    deleteEvent,
    updateUserProfile,
  }), [user, loading, currentDate]);

  return (
    <DataContext.Provider value={value}>
      {children}
    </DataContext.Provider>
  );
};