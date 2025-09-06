// hooks/useCalendarActions.js
import { useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useData } from '../contexts/DataContext';
import { 
  addCalendarToUser, 
  removeCalendarFromUser, 
  validateCalendarData,
  validateUniqueCalendar,
  syncCalendarById 
} from '../services/calendarService';
import { updateDocument, getDocument } from '../services/firestoreService';

export const useCalendarActions = () => {
  const { user: authUser } = useAuth();
  const { user } = useData();

  const addCalendar = useCallback(async (calendarData) => {
    try {
      console.log("Adding calendar:", calendarData.name);
      
      if (!authUser?.uid) {
        throw new Error("User not authenticated");
      }
      if (typeof authUser.uid !== 'string') {
        throw new Error(`Invalid user ID: expected string, got ${typeof authUser.uid}`);
      }
      
      // Validate data
      validateCalendarData(calendarData);
      await validateUniqueCalendar(authUser.uid, calendarData.calendarAddress);
      
      // Add calendar
      const calendarRef = await addCalendarToUser(authUser.uid, calendarData);
      
      // Update user document
      const updatedCalendars = [...(user.calendars || []), calendarRef];
      await updateDocument('users', authUser.uid, { calendars: updatedCalendars });
      
      // Auto-sync
      try {
        console.log("🔄 Starting auto-sync for:", calendarRef.calendarId);
        const syncResult = await syncCalendarById(calendarRef.calendarId);
        console.log("✅ Auto-sync completed:", syncResult);
        
      } catch (syncError) {
        console.warn("⚠️ Calendar added but sync failed:", syncError);
      }
      
      return calendarRef;
    } catch (error) {
      console.error("❌ Error adding calendar:", error);
      throw error;
    }
  }, [authUser, user?.calendars]);

  const removeCalendar = useCallback(async (calendarId) => {
    try {
      console.log("🗑️ Removing calendar:", calendarId);
      await removeCalendarFromUser(authUser.uid, calendarId);
      console.log("✅ Calendar removed");
      
      // Refresh will happen automatically via subscription
    } catch (error) {
      console.error("❌ Error removing calendar:", error);
      throw error;
    }
  }, [authUser?.uid]);

  const syncCalendar = useCallback(async (calendarId) => {
    try {
      console.log("🔄 Syncing calendar:", calendarId);
      const result = await syncCalendarById(calendarId);
      console.log("✅ Calendar synced:", result);
      
      return result;
    } catch (error) {
      console.error("❌ Error syncing calendar:", error);
      throw error;
    }
  }, []);

  return {
    addCalendar,
    removeCalendar,
    syncCalendar
  };
};