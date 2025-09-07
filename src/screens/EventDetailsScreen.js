// src/screens/EventDetailsScreen.js
import React, { useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
} from 'react-native';
import { useTheme } from '../contexts/ThemeContext';
import { useData } from '../contexts/DataContext';
import EventHeader from '../components/EventHeader';
import { DateTime } from 'luxon';
import { Ionicons } from '@expo/vector-icons';

const EventDetailsScreen = ({ route, navigation }) => {
  const { theme, getSpacing, getTypography, getBorderRadius } = useTheme();
  const { user, calendars, groups, tasks, currentDate } = useData();
  const { eventId, calendarId } = route.params || { eventId: 'unknown' };
  console.log('EventDetailsScreen rendered with eventId:', eventId, 'calendarId:', calendarId, "For Current Date:", currentDate);

  // Find the calendar that has the calendarId
  const event = useMemo(() => {
    // Check for required data
    if (!calendars || calendars.length === 0 || !calendarId || !eventId) {
      return null;
    }

    // Find the calendar by its ID
    const calendar = calendars.find(cal => cal.id === calendarId);

    // If the calendar is not found or has no events, return null
    if (!calendar || !calendar.events) {
      return null;
    }

    // Create event object and enhance with more data
    console.log("Found calendar for event:", calendar);
    const enhancedEvent = {
      ...calendar.events[eventId],
      eventId: eventId,
      calendarId: calendarId,
      calendarName: calendar.name,
      calendarColor: calendar.color,
    };
    console.log("Enhanced event data:", enhancedEvent);

    // Return the enhanced event
    return enhancedEvent;
  }, [calendars, calendarId, eventId]);

  console.log("Found event:", event);

  // Find which groups this event belongs to (if any)
  const eventGroups = useMemo(() => {
    if (!groups || groups.length === 0 || !calendarId) return [];
    return groups
      .filter(group => group.calendars && group.calendars.some(cal => cal.calendarId === calendarId))
      .map(group => group.groupId);
  }, [groups, calendarId]);
  console.log("Event belongs to groups:", eventGroups, "Groups data:", groups, "CalendarId:", calendarId);

  // If there are eventGroups, use the taskDocs that have a groupId that is in eventGroups
  // Then find any tasks that have a matching calendarId and eventId
  const relatedTasks = useMemo(() => {
    if (!tasks || tasks.length === 0 || eventGroups.length === 0 || !event || !event.eventId) return [];
    return tasks.filter(task => 
      eventGroups.includes(task.groupId) && 
      task.tasks && 
      task.tasks.some(a => a.eventId === event.eventId)
    );
  }, [tasks, eventGroups, event]);
  console.log("Related tasks for event:", relatedTasks);

  // Has the event started?
  const gameTimeInfo = useMemo(() => {
    if (!event || !event.startTime) return { hasStarted: false, isAllDay: false };
    const start = DateTime.fromISO(event.startTime);
    const now = DateTime.now();
    const isAllDay = event.isAllDay || false;
    // Return if the event has started, and if its all day
    return { 
      hasStarted: now >= start, 
      isAllDay: isAllDay 
    };
  }, [event]);
  console.log("Event time info:", gameTimeInfo);

  const handleCreateTask = () => {
    console.log('Create task for event:', eventId, calendarId, eventGroups);
    // TODO: Navigate to task creation screen
    // navigation.navigate('CreateTask', { eventId, calendarId });
  };

  // Go back function that checks 1) can we go back? If so go back
  // 2) if currentDate (in 2025-09-06 format) is today, go to Today tab
  // 3) otherwise go to Calendar tab
  const handleGoBack = () => {
    if (navigation.canGoBack()) {
      navigation.goBack();
    } else {
      const todayISO = DateTime.now().toISODate();
      if (currentDate === todayISO) {
        navigation.navigate('Today', { screen: 'TodayHome' });
      } else {
        navigation.navigate('Calendar', { screen: 'CalendarHome' });
      }
    }
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.background,
    },
    scrollContainer: {
      flex: 1,
    },
    content: {
      paddingHorizontal: getSpacing.md,
      paddingBottom: getSpacing.xl,
    },
    tasksSection: {
      marginTop: getSpacing.lg,
      marginBottom: getSpacing.lg,
    },
    tasksHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: getSpacing.md,
    },
    tasksTitle: {
      fontSize: getTypography.h2.fontSize,
      fontWeight: getTypography.h2.fontWeight,
      color: theme.text.primary,
    },
    taskCount: {
      fontSize: getTypography.body.fontSize,
      color: theme.text.secondary,
      marginLeft: getSpacing.xs,
    },
    addButton: {
      backgroundColor: theme.primary,
      width: 40,
      height: 40,
      borderRadius: 20,
      justifyContent: 'center',
      alignItems: 'center',
      elevation: 2,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
    },
    addButtonFull: {
      backgroundColor: theme.primary,
      paddingVertical: getSpacing.md,
      paddingHorizontal: getSpacing.lg,
      borderRadius: getBorderRadius.lg,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      elevation: 2,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
    },
    addButtonText: {
      fontSize: getTypography.button.fontSize,
      fontWeight: getTypography.button.fontWeight,
      color: theme.text.inverse,
      marginLeft: getSpacing.sm,
    },
    tasksList: {
      backgroundColor: theme.surface,
      borderRadius: getBorderRadius.lg,
      padding: getSpacing.md,
    },
    taskItem: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: getSpacing.sm,
      borderBottomWidth: 1,
      borderBottomColor: theme.border,
    },
    taskIcon: {
      marginRight: getSpacing.md,
    },
    taskText: {
      flex: 1,
      fontSize: getTypography.body.fontSize,
      color: theme.text.primary,
    },
    emptyTasks: {
      backgroundColor: theme.surface,
      borderRadius: getBorderRadius.lg,
      padding: getSpacing.xl,
      alignItems: 'center',
    },
    emptyText: {
      fontSize: getTypography.body.fontSize,
      color: theme.text.secondary,
      textAlign: 'center',
      marginTop: getSpacing.sm,
    },
    backButton: {
      backgroundColor: theme.button.secondary,
      padding: getSpacing.md,
      borderRadius: getBorderRadius.lg,
      alignItems: 'center',
      marginTop: getSpacing.lg,
      flexDirection: 'row',
      justifyContent: 'center',
    },
    backButtonText: {
      fontSize: getTypography.button.fontSize,
      fontWeight: getTypography.button.fontWeight,
      color: theme.button.secondaryText,
      marginLeft: getSpacing.sm,
    },
  });

  if (!event) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={[styles.content, { flex: 1, justifyContent: 'center', alignItems: 'center' }]}>
          <Ionicons name="alert-circle-outline" size={64} color={theme.text.secondary} />
          <Text style={styles.emptyText}>Event not found</Text>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={20} color={theme.button.secondaryText} />
            <Text style={styles.backButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        <EventHeader 
          event={event}
          hideDetails={false}
        />
        
        <View style={styles.content}>
          {/* Tasks Section */}
          <View style={styles.tasksSection}>
            {relatedTasks.length > 0 ? (
              <>
                {/* Header with count and add button */}
                <View style={styles.tasksHeader}>
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <Text style={styles.tasksTitle}>Tasks</Text>
                    <Text style={styles.taskCount}>({relatedTasks.length})</Text>
                  </View>
                  <TouchableOpacity 
                    style={styles.addButton}
                    onPress={handleCreateTask}
                  >
                    <Ionicons name="add" size={24} color={theme.text.inverse} />
                  </TouchableOpacity>
                </View>

                {/* Tasks List */}
                <View style={styles.tasksList}>
                  {relatedTasks.map((task, index) => (
                    <View key={task.id || index} style={styles.taskItem}>
                      <Ionicons 
                        name="clipboard-outline" 
                        size={20} 
                        color={theme.text.secondary} 
                        style={styles.taskIcon}
                      />
                      <Text style={styles.taskText}>
                        {task.title || task.name || `Task ${index + 1}`}
                      </Text>
                    </View>
                  ))}
                </View>
              </>
            ) : (
              <>
                
                <TouchableOpacity 
                  style={styles.addButtonFull}
                  onPress={handleCreateTask}
                >
                  <Ionicons name="add" size={24} color={theme.text.inverse} />
                  <Text style={styles.addButtonText}>Create Task</Text>
                </TouchableOpacity>
              </>
            )}
          </View>

          {/* Back Button */}
          <TouchableOpacity 
            style={styles.backButton}
            onPress={handleGoBack}
          >
            <Ionicons name="arrow-back" size={20} color={theme.button.secondaryText} />
            <Text style={styles.backButtonText}>Back</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default EventDetailsScreen;