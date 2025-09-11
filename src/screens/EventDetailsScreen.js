// src/screens/EventDetailsScreen.js
import React, { useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  Alert,
} from 'react-native';
import { useTheme } from '../contexts/ThemeContext';
import { useData } from '../contexts/DataContext';
import EventHeader from '../components/EventHeader';
import AttendanceCard from '../components/cards/TaskCards/Attendance/AttendanceCard';
import TransportCard from '../components/cards/TaskCards/Transport/TransportCard';
import ChecklistCard from '../components/cards/TaskCards/Checklist/ChecklistCard';
import { DateTime } from 'luxon';
import { Ionicons } from '@expo/vector-icons';
import { useTaskActions } from '../hooks';

const EventDetailsScreen = ({ route, navigation }) => {
  const { theme, getSpacing, getTypography, getBorderRadius } = useTheme();
  const { user, calendars, groups, tasks, currentDate } = useData();
  const { updateTask, deleteTask } = useTaskActions();
  const { eventId, calendarId, taskId } = route.params || { eventId: 'unknown' };
  console.log('EventDetailsScreen rendered with eventId:', eventId, 'calendarId:', calendarId, "taskId", taskId , "For Current Date:", currentDate);

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

  // Find tasks that match this event
  const relatedTasks = useMemo(() => {
    if (!tasks || tasks.length === 0 || eventGroups.length === 0 || !event || !event.eventId) return [];
    
    // Flatten the nested tasks structure
    const allTasks = tasks.flatMap(group => 
      (group.tasks || []).map(task => ({
        ...task,
        groupId: group.groupId, // Ensure groupId is available on each task
        groupName: group.name
      }))
    );
    
    console.log("All flattened tasks:", allTasks);
    
    return allTasks.filter(task => 
      eventGroups.includes(task.groupId) && 
      task.eventId === event.eventId
    );
  }, [tasks, eventGroups, event]);
  console.log("Related tasks for event:", relatedTasks);

  // Get the group that these tasks belong to
  const thisGroup = useMemo(() => {
    if (!groups || groups.length === 0 || eventGroups.length === 0) return null;
    return groups.find(group => eventGroups.includes(group.groupId));
  }, [groups, eventGroups]);

  // Check if user is admin of this group, using thisGroup.members and finding my then checking my role
  const amIAdminOfThisGroup = useMemo(() => {
    if (!thisGroup || !thisGroup.members || !Array.isArray(thisGroup.members) || !user) return false;
    const me = thisGroup.members.find(member => member.userId === user.userId);
    return me?.role === 'admin' || false;
  }, [thisGroup, user]);

  // Has the event started?
  const eventTimeInfo = useMemo(() => {
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
  console.log("Event time info:", eventTimeInfo);

  const handleCreateTask = () => {
    console.log('Create task for event:', eventId, calendarId, eventGroups);
    // TODO: Navigate to task creation screen
    navigation.navigate('CreateTask', { eventId, calendarId });
  };

  // Handle task updates using the new updateTask function
  const handleTaskUpdate = async (updatedTask) => {
    console.log('Task updated:', updatedTask);
    try {
      await updateTask(
        updatedTask.groupId,
        updatedTask.taskId,
        updatedTask,
        user?.userId
      );
      console.log('✅ Task successfully updated in database');
    } catch (error) {
      console.error('❌ Error updating task:', error);
      // You might want to show an error message to the user here
    }
  };

  const handleDeleteTask = async (taskId, groupId) => {
    // Show confirmation alert first
    Alert.alert(
      "Delete Assignment",
      "Are you sure you want to delete this assignment? This action cannot be undone.",
      [
        {
          text: "Cancel",
          style: "cancel"
        },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await deleteTask(groupId, taskId, user?.userId);
              
              console.log('✅ Task deleted successfully');
              
              // Optionally refresh your tasks list or remove from local state
              // You might want to call a function here to update your UI
              
            } catch (error) {
              console.error('❌ Error deleting task:', error);
              Alert.alert('Error', 'Failed to delete task. Please try again.');
            } 
          }
        }
      ]
    );
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

  // Render task card based on type
  const renderTaskCard = (task, index) => {
    const commonProps = {
      assignment: task,
      groupId: task.groupId,
      onAssignmentUpdate: handleTaskUpdate,
      isEventPast: false, // You can enhance this later
      thisGroup: thisGroup,
      amIAdminOfThisGroup: amIAdminOfThisGroup,
      eventDate: event?.startTime,
      onDeleteAssignment: () => handleDeleteTask(task.taskId, task.groupId),
      isDeleting: false, // You can add loading state later
    };
    const taskKey = task.taskId || index;

    switch (task.taskType) {
      case 'Attendance':
        return <AttendanceCard key={taskKey} {...commonProps} />;
      case 'Transport':
        return <TransportCard key={taskKey} {...commonProps} />;
      case 'Checklist':
        return <ChecklistCard key={taskKey} {...commonProps} />;
      default:
        console.warn('Unknown task type:', task.taskType);
        return null;
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

                {/* Render all task cards */}
                {relatedTasks.map((task, index) => renderTaskCard(task, index))}
              </>
            ) : (
              <>
                {/* No tasks - show create button */}
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