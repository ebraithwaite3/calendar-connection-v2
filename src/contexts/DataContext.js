import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import { useAuth } from './AuthContext';
import { DateTime } from 'luxon';
import { 
  setGlobalDb, 
  subscribeToDocument, 
  updateDocument 
} from '../services/firestoreService';
import { 
  removeCalendarFromUser, 
  syncCalendarById 
} from '../services/calendarService';

const DataContext = createContext();

export const useData = () => {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
};

export const DataProvider = ({ children }) => {
  const { user: authUser, db } = useAuth();
  
  // Core states
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentDate, setCurrentDate] = useState(DateTime.local().toISODate());
  
  // Resource states
  const [calendars, setCalendars] = useState([]);
  const [groups, setGroups] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [messages, setMessages] = useState([]);
  
  // Loading states (only needed for initial loads)
  const [calendarsLoading, setCalendarsLoading] = useState(false);
  const [groupsLoading, setGroupsLoading] = useState(false);
  const [tasksLoading, setTasksLoading] = useState(false);
  const [messagesLoading, setMessagesLoading] = useState(false);

  console.log("📊 DataContext State:", { 
    loading, 
    userLoaded: !!user, 
    calendarsCount: calendars?.length,
    groupsCount: groups?.length,
    tasksCount: tasks?.length,
    messagesCount: messages.messages?.length,
    unreadMessagesCount: messages.messages?.filter(m => !m.read).length || 0,
  });

  // ===== USER SUBSCRIPTION =====
  useEffect(() => {
    console.log("🔔 Setting up user subscription...");
    let unsubscribeUser = null;
    
    if (authUser && db) {
      setGlobalDb(db);
      setLoading(true);
      
      unsubscribeUser = subscribeToDocument(
        'users', 
        authUser.uid,
        (userData) => {
          if (userData) {
            console.log("👤 User data updated - userId:", userData.userId);
            setUser(userData);
          } else {
            console.warn("❌ No user document found for Firebase UID:", authUser.uid);
            setUser(null);
          }
          setLoading(false);
        },
        (error) => {
          console.error("❌ User subscription error:", error);
          console.error("❌ Error code:", error.code);
          console.error("❌ Error message:", error.message);
          setLoading(false);
        }
      );
    } else {
      setUser(null);
      setLoading(false);
      setCalendars([]);
      setGroups([]);
      setTasks([]);
      setMessages([]);
    }
    
    return () => {
      if (unsubscribeUser) unsubscribeUser();
    };
  }, [authUser, db]);

  // ===== CALENDARS REAL-TIME SUBSCRIPTION =====
  useEffect(() => {
    // Filter out any calendars with undefined/null calendarId
    const validCalendarRefs = (user?.calendars || []).filter(ref => ref.calendarId);
    
    if (validCalendarRefs.length === 0) {
      console.log("📅 No valid calendar references found");
      setCalendars([]);
      setCalendarsLoading(false);
      return;
    }
    
    console.log("📅 Setting up calendar subscriptions...");
    setCalendarsLoading(true);
    
    const calendarIds = validCalendarRefs.map(ref => ref.calendarId);
    const unsubscribes = [];
    
    console.log("📅 Valid calendar IDs:", calendarIds);
    
    // Initialize calendars array with user ref data
    const initialCalendars = validCalendarRefs.map(ref => ({
      id: ref.calendarId, // Keep 'id' for consistency with your existing code
      calendarId: ref.calendarId, // Also provide calendarId
      name: ref.name,
      color: ref.color,
      description: ref.description,
      calendarAddress: ref.calendarAddress || ref.address,
      type: ref.calendarType || ref.type,
      permissions: ref.permissions,
      isOwner: ref.isOwner,
      // Placeholder until real-time data arrives
      events: {},
      eventsCount: 0,
      syncStatus: 'loading',
      lastSynced: null,
    }));
    
    setCalendars(initialCalendars);
    
    // Subscribe to each calendar document individually
    calendarIds.forEach(calendarId => {
      const unsubscribe = subscribeToDocument(
        'calendars',
        calendarId,
        (calendarDoc) => {
          if (calendarDoc) {
            console.log(`📅 Calendar ${calendarId} updated`);
            setCalendars(prev => prev.map(cal => {
              if (cal.calendarId === calendarId) {
                return {
                  ...cal,
                  ...calendarDoc,
                  // Computed properties
                  eventsCount: Object.keys(calendarDoc.events || {}).length,
                  syncStatus: calendarDoc.sync?.syncStatus || 'unknown',
                  lastSynced: calendarDoc.sync?.lastSyncedAt,
                };
              }
              return cal;
            }));
          } else {
            console.warn(`❌ Calendar document ${calendarId} not found`);
            // Remove from calendars if document doesn't exist
            setCalendars(prev => prev.filter(cal => cal.calendarId !== calendarId));
          }
        },
        (error) => {
          console.error(`❌ Calendar ${calendarId} subscription error:`, error);
        }
      );
      
      unsubscribes.push(unsubscribe);
    });
    
    setCalendarsLoading(false);
    
    return () => {
      console.log("🧹 Cleaning up calendar subscriptions");
      unsubscribes.forEach(unsubscribe => unsubscribe());
    };
  }, [user?.calendars]);

  // ===== GROUPS REAL-TIME SUBSCRIPTION =====
  useEffect(() => {
    const { collection, query, where, documentId, onSnapshot } = require('firebase/firestore');
    
    const validGroupRefs = (user?.groups || []).filter(ref => ref.groupId);
    
    if (validGroupRefs.length === 0) {
      console.log("👥 No valid group references found");
      setGroups([]);
      setGroupsLoading(false);
      return;
    }

    console.log("👥 Setting up group subscriptions...");
    setGroupsLoading(true);
    
    const groupIds = validGroupRefs.map(ref => ref.groupId);
    const unsubscribes = [];
    
    // Initialize groups array with user ref data
    const initialGroups = validGroupRefs.map(ref => ({
      id: ref.groupId,
      groupId: ref.groupId, // Also provide groupId
      name: ref.name,
      role: ref.role,
      joinedAt: ref.joinedAt,
      // Placeholder until real-time data arrives
      members: [],
      calendars: [],
      tasks: [],
    }));
    
    setGroups(initialGroups);
    
    // Split group IDs into chunks of 10 for Firestore 'in' query limit
    const chunks = [];
    for (let i = 0; i < groupIds.length; i += 10) {
      chunks.push(groupIds.slice(i, i + 10));
    }
    
    console.log(`👥 Subscribing to ${chunks.length} group batch(es)`);
    
    // Subscribe to each chunk
    chunks.forEach((chunk, chunkIndex) => {
      const q = query(
        collection(db, 'groups'), 
        where(documentId(), 'in', chunk)
      );
      
      const unsubscribe = onSnapshot(q, (querySnapshot) => {
        console.log(`👥 Group batch ${chunkIndex + 1} updated`);
        
        querySnapshot.docs.forEach(docSnap => {
          const groupId = docSnap.id;
          const groupDoc = docSnap.data();
          
          setGroups(prev => prev.map(group => {
            if (group.groupId === groupId) {
              return {
                ...group,
                ...groupDoc,
              };
            }
            return group;
          }));
        });
      }, (error) => {
        console.error(`❌ Group batch ${chunkIndex + 1} subscription error:`, error);
      });
      
      unsubscribes.push(unsubscribe);
    });
    
    setGroupsLoading(false);
    
    return () => {
      console.log("🧹 Cleaning up group subscriptions");
      unsubscribes.forEach(unsubscribe => unsubscribe());
    };
  }, [user?.groups, db]);

  // ===== ASSIGNMENTS REAL-TIME SUBSCRIPTION =====
  useEffect(() => {
    const validGroupRefs = (user?.groups || []).filter(ref => ref.groupId);
    
    if (validGroupRefs.length === 0) {
      console.log("📝 No valid group references found for tasks");
      setTasks([]);
      setTasksLoading(false);
      return;
    }

    console.log("📝 Setting up task subscriptions...");
    setTasksLoading(true);
    
    const groupIds = validGroupRefs.map(ref => ref.groupId);
    const unsubscribes = [];
    
    // Initialize empty tasks
    setTasks([]);
    
    // Subscribe to each group's tasks document
    groupIds.forEach(groupId => {
      const unsubscribe = subscribeToDocument(
        'tasks',
        groupId,
        (taskDoc) => {
          if (taskDoc) {
            console.log(`📝 Tasks for group ${groupId} updated`);
            setTasks(prev => {
              // Remove old tasks for this group and add new ones
              const filteredTasks = prev.filter(task => task.groupId !== groupId);
              return [...filteredTasks, taskDoc];
            });
          } else {
            console.log(`ℹ️ No tasks document for group ${groupId}`);
            // Remove tasks for this group if document doesn't exist
            setTasks(prev => prev.filter(task => task.groupId !== groupId));
          }
        },
        (error) => {
          console.error(`❌ Tasks ${groupId} subscription error:`, error);
        }
      );
      
      unsubscribes.push(unsubscribe);
    });
    
    setTasksLoading(false);
    
    return () => {
      console.log("🧹 Cleaning up task subscriptions");
      unsubscribes.forEach(unsubscribe => unsubscribe());
    };
  }, [user?.groups]);

  // ===== MESSAGES REAL-TIME SUBSCRIPTION =====
  useEffect(() => {
    if (!user?.userId) {
      setMessages([]);
      setMessagesLoading(false);
      return;
    }

    console.log("💬 Setting up messages subscription...");
    setMessagesLoading(true);
    
    // Messages are stored with document ID = userId
    const unsubscribe = subscribeToDocument(
      'messages',
      user.userId,
      (messageDoc) => {
        if (messageDoc) {
          console.log(`💬 Messages for user ${user.userId} updated`);
          setMessages(messageDoc);
        } else {
          console.log(`ℹ️ No messages document for user ${user.userId}`);
          setMessages([]);
        }
        setMessagesLoading(false);
      },
      (error) => {
        console.error(`❌ Messages subscription error:`, error);
        setMessagesLoading(false);
      }
    );
    
    return () => {
      console.log("🧹 Cleaning up messages subscription");
      unsubscribe();
    };
  }, [user?.userId]);

  // ===== CALENDAR ACTIONS =====
  const removeCalendar = useCallback(async (calendarId) => {
    try {
      console.log("🗑️ Removing calendar:", calendarId);
      await removeCalendarFromUser(authUser.uid, calendarId);
      console.log("✅ Calendar removed");
      // Real-time subscription will handle the UI update
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
      // Real-time subscription will handle the UI update
      return result;
    } catch (error) {
      console.error("❌ Error syncing calendar:", error);
      throw error;
    }
  }, []);

  // ===== HELPER FUNCTIONS =====
  const setWorkingDate = useCallback((date) => {
    setCurrentDate(date);
    console.log("📅 Set working date:", date);
  }, []);

  const getCalendarById = useCallback((calendarId) => {
    return calendars.find(cal => cal.id === calendarId || cal.calendarId === calendarId);
  }, [calendars]);

  const getCalendarsByType = useCallback((type) => {
    return calendars.filter(cal => cal.type === type);
  }, [calendars]);

const unreadMessagesCount = useMemo(() => {
  return messages.messages?.filter(m => !m.read).length || 0;
}, [messages]);

const messagesCount = useMemo(() => {
  return messages.messages?.length || 0;
}, [messages]);

// Gather the last sync times of all calendars (and filter out any that have been synced int he last 24 hours, use Luxon for date handling)
// I need to return enough info to also potentially be able to sync that/those calendars
const calendarsThatNeedToSync = useMemo(() => {
  const now = DateTime.now();
  return calendars
    .map(cal => ({
      calendarId: cal.calendarId,
      name: cal.name,
      lastSynced: cal.lastSynced ? DateTime.fromISO(cal.lastSynced) : null,
    }))
    .filter(cal => cal.lastSynced) // Only keep those with a lastSynced time
    .map(cal => ({
      ...cal,
      hoursSinceLastSync: now.diff(cal.lastSynced, 'hours').hours,
    }))
    .filter(cal => cal.hoursSinceLastSync >= 24) // Only keep those not synced in the last 24 hours
    .sort((a, b) => b.hoursSinceLastSync - a.hoursSinceLastSync); // Sort by longest time since last sync
}, [calendars]);

console.log("⏱️ Calendars Not Synced in last 24 h:", calendarsThatNeedToSync);

  // ===== CONTEXT VALUE =====
  const value = useMemo(() => ({
    // Core data
    user,
    loading,
    currentDate,
    setWorkingDate,

    // Values
    unreadMessagesCount,
    messagesCount,
    
    // Resources (now real-time!)
    calendars,
    groups,
    tasks,
    messages,
    
    // Loading states (only for initial setup)
    calendarsLoading,
    groupsLoading,
    tasksLoading,
    messagesLoading,

    // Computed properties
    isDataLoaded: !loading && !!user,
    hasCalendars: calendars.length > 0,
    hasGroups: groups.length > 0,
    hasTasks: tasks.length > 0,
    
    // Legacy compatibility
    calendarsInfo: user?.calendars || [],
    groupsInfo: user?.groups || [],
    preferences: user?.preferences || {},
    myUsername: user?.username || '',
    myUserId: user?.userId || '',
    
    // Calendar helpers
    getCalendarById,
    getCalendarsByType,
    
    // Actions
    removeCalendar,
    syncCalendar,
    
  }), [
    user,
    loading,
    currentDate,
    calendars,
    groups,
    tasks,
    calendarsLoading,
    groupsLoading,
    tasksLoading,
    messages,
    messagesLoading,
    setWorkingDate,
    getCalendarById,
    getCalendarsByType,
    removeCalendar,
    syncCalendar,
    unreadMessagesCount,
    messagesCount,
  ]);

  return (
    <DataContext.Provider value={value}>
      {children}
    </DataContext.Provider>
  );
};