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
  const { user: authUser } = useAuth();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);

  // Convert Firebase auth user to app user format
  useEffect(() => {
    if (authUser) {
      // Create app user from Firebase auth user
      const appUser = {
        id: authUser.uid,
        email: authUser.email,
        username: generateUsernameFromEmail(authUser.email),
        displayName: authUser.displayName || generateUsernameFromEmail(authUser.email),
        profilePicture: authUser.photoURL || null,
        createdAt: authUser.metadata?.creationTime || new Date().toISOString(),
        lastLoginAt: authUser.metadata?.lastSignInTime || new Date().toISOString(),
        // Dummy calendar data for now
        preferences: {
          theme: 'system',
          defaultView: 'month',
          weekStartsOn: 'sunday',
          notifications: true,
        },
        // Dummy events for testing
        events: generateDummyEvents(),
      };
      setUser(appUser);
    } else {
      setUser(null);
    }
  }, [authUser]);

  // Helper function to generate username from email
  const generateUsernameFromEmail = (email) => {
    if (!email) return 'User';
    const name = email.split('@')[0];
    return name.charAt(0).toUpperCase() + name.slice(1).replace(/[._]/g, ' ');
  };

  // Generate some dummy calendar events
  const generateDummyEvents = () => {
    const today = new Date();
    const events = [];
    
    // Add some sample events
    for (let i = 0; i < 10; i++) {
      const eventDate = new Date(today);
      eventDate.setDate(today.getDate() + (Math.random() * 30 - 15)); // Random dates ±15 days
      
      const eventTypes = [
        { title: 'Team Meeting', color: 'blue' },
        { title: 'Doctor Appointment', color: 'red' },
        { title: 'Lunch with Sarah', color: 'green' },
        { title: 'Gym Session', color: 'purple' },
        { title: 'Project Deadline', color: 'orange' },
        { title: 'Date Night', color: 'pink' },
        { title: 'Family Dinner', color: 'yellow' },
        { title: 'Conference Call', color: 'indigo' }
      ];
      
      const randomEvent = eventTypes[Math.floor(Math.random() * eventTypes.length)];
      
      events.push({
        id: `event_${i}`,
        title: randomEvent.title,
        date: eventDate.toISOString().split('T')[0], // YYYY-MM-DD format
        time: `${Math.floor(Math.random() * 12) + 1}:${Math.random() > 0.5 ? '00' : '30'} ${Math.random() > 0.5 ? 'AM' : 'PM'}`,
        color: randomEvent.color,
        description: `This is a sample event: ${randomEvent.title}`,
        isAllDay: Math.random() > 0.7,
        reminders: ['15min', '1hour'],
        createdAt: new Date().toISOString(),
      });
    }
    
    return events.sort((a, b) => new Date(a.date) - new Date(b.date));
  };

  // Dummy functions for future calendar functionality
  const addEvent = async (eventData) => {
    console.log('Adding event (dummy):', eventData);
    // TODO: Replace with Firebase Firestore call
    const newEvent = {
      ...eventData,
      id: `event_${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    
    setUser(prev => ({
      ...prev,
      events: [...(prev?.events || []), newEvent].sort((a, b) => new Date(a.date) - new Date(b.date))
    }));
    
    return newEvent;
  };

  const updateEvent = async (eventId, eventData) => {
    console.log('Updating event (dummy):', eventId, eventData);
    // TODO: Replace with Firebase Firestore call
    setUser(prev => ({
      ...prev,
      events: prev?.events?.map(event => 
        event.id === eventId 
          ? { ...event, ...eventData, updatedAt: new Date().toISOString() }
          : event
      ) || []
    }));
  };

  const deleteEvent = async (eventId) => {
    console.log('Deleting event (dummy):', eventId);
    // TODO: Replace with Firebase Firestore call
    setUser(prev => ({
      ...prev,
      events: prev?.events?.filter(event => event.id !== eventId) || []
    }));
  };

  const updateUserProfile = async (profileData) => {
    console.log('Updating user profile (dummy):', profileData);
    // TODO: Replace with Firebase Firestore call
    setUser(prev => ({
      ...prev,
      ...profileData,
      updatedAt: new Date().toISOString(),
    }));
  };

  const value = {
    user,
    loading,
    
    // Calendar functions
    addEvent,
    updateEvent,
    deleteEvent,
    
    // User functions
    updateUserProfile,
    
    // Helper functions
    getEventsForDate: (date) => {
      return user?.events?.filter(event => event.date === date) || [];
    },
    
    getEventsForMonth: (year, month) => {
      const monthStr = `${year}-${String(month).padStart(2, '0')}`;
      return user?.events?.filter(event => event.date.startsWith(monthStr)) || [];
    },
  };

  return (
    <DataContext.Provider value={value}>
      {children}
    </DataContext.Provider>
  );
};