import React, { useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../../contexts/ThemeContext';
import { DateTime } from 'luxon';

const EventCard = ({ 
  event, 
  groups = [],
  calendars = [],
  onPress, 
  showCalendarName = true,
  tasks = [], 
  style = {} 
}) => {
  const { theme, getSpacing, getBorderRadius } = useTheme();
  console.log("EventCard rendered with event:", event, "And Groups:", groups);

  const handlePress = () => {
    if (onPress) {
      onPress(event);
    } else {
      console.log('Event pressed:', event.title);
    }
  };

  // Find which group this event belongs to (if any)
  const eventGroups = useMemo(() => {
    if (!groups || groups.length === 0 || !event || !event.calendarId) return [];
    return groups
      .filter(group => group.calendars && group.calendars.some(cal => cal.calendarId === event.calendarId))
      .map(group => group.groupId || 'Unnamed Group');
  }, [groups, event]);
  console.log("Event belongs to groups:", eventGroups);

  // Get individual tasks that match this event
  const relatedTasksIndividual = useMemo(() => {
    if (!tasks || tasks.length === 0 || eventGroups.length === 0 || !event || !event.eventId) return [];
    
    // Flatten the nested tasks structure and filter for this event
    const allTasks = tasks.flatMap(taskDoc => 
      (taskDoc.tasks || []).map(task => ({
        ...task,
        groupId: taskDoc.groupId
      }))
    );
    
    return allTasks.filter(task => 
      eventGroups.includes(task.groupId) && 
      task.eventId === event.eventId
    );
  }, [tasks, eventGroups, event]);
  console.log("Individual related tasks for event:", relatedTasksIndividual);

  // Format the event time
  const startTime = event?.startTime ? DateTime.fromISO(event.startTime) : null;
  const timeText = startTime ? startTime.toLocaleString(DateTime.TIME_SIMPLE) : 'All Day';

  // Generate yes count for an attendance task
  function getYesCount(responses) {
    if (!Array.isArray(responses)) return 0;
    return responses.filter(r => r.response === 'yes').length;
  }

  // Get drop-off and pick-up count for how many are taken (status !== 'available')
  function getTransportTakenCount(dropOff, pickUp) {
    let count = 0;
    if (dropOff && dropOff.status !== 'available') count++;
    if (pickUp && pickUp.status !== 'available') count++;
    return count;
  }

  // Find out if all checklist items are completed
  function isChecklistComplete(listData) {
    if (!listData || !Array.isArray(listData.items) || listData.items.length === 0) return false;
    return listData.items.every(item => item.completed === true);
  }

  // Get task summaries
  const taskSummary = useMemo(() => {
    const summary = {
      attendance: null,
      transport: null,
      checklist: null
    };

    relatedTasksIndividual.forEach(task => {
      switch (task.taskType) {
        case 'Attendance':
          if (task.attendanceData && task.attendanceData.responses) {
            summary.attendance = getYesCount(task.attendanceData.responses);
          }
          break;
        case 'Transport':
          summary.transport = getTransportTakenCount(task.dropOff, task.pickUp);
          break;
        case 'Checklist':
          if (task.checklistData) {
            summary.checklist = isChecklistComplete(task.checklistData);
          }
          break;
      }
    });

    return summary;
  }, [relatedTasksIndividual]);

  const styles = StyleSheet.create({
    container: {
      width: '100%',
      backgroundColor: theme.surface || '#FFFFFF',
      borderRadius: getBorderRadius.md,
      marginHorizontal: getSpacing.lg,
      marginBottom: getSpacing.md,
      padding: getSpacing.md,
      borderLeftWidth: 4,
      borderLeftColor: event.calendarColor || theme.primary,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3,
      ...style,
    },
    mainContent: {
      flexDirection: 'row',
    },
    timeColumn: {
      width: 80,
      marginRight: getSpacing.md,
      alignItems: 'center',
      justifyContent: 'flex-start'
    },
    timeText: {
      fontSize: 14,
      fontWeight: '600',
      color: theme.text.primary,
      textAlign: 'center',
    },
    durationText: {
      fontSize: 12,
      color: theme.text.secondary,
      textAlign: 'center',
      marginTop: 2,
    },
    contentColumn: {
      flex: 1,
      justifyContent: 'flex-start',
    },
    calendarNameText: {
      fontSize: 20,
      color: theme.text.secondary,
      marginBottom: 4,
      fontWeight: '500',
    },
    titleText: {
      fontSize: 16,
      color: theme.text.primary,
      marginBottom: 4,
      fontWeight: '500',
    },
    locationText: {
      fontSize: 14,
      color: theme.text.secondary,
    },
    taskSummaryRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginTop: getSpacing.sm,
      paddingTop: getSpacing.sm,
      borderTopWidth: 1,
      borderTopColor: theme.border,
      gap: getSpacing.md,
    },
    taskIndicator: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: getSpacing.xs,
    },
    taskText: {
      fontSize: 12,
      color: theme.text.secondary,
      fontWeight: '500',
    },
  });

  const hasAnyTasks = taskSummary.attendance !== null || taskSummary.transport !== null || taskSummary.checklist !== null;

  return (
    <TouchableOpacity onPress={handlePress} activeOpacity={0.7}>
      <View style={styles.container}>
        {/* Main Content Row */}
        <View style={styles.mainContent}>
          {/* Left Column - Time */}
          <View style={styles.timeColumn}>
            <Text style={styles.timeText}>{timeText}</Text>
            <Text style={styles.durationText}>Event</Text>
          </View>
          
          {/* Right Column - Content */}
          <View style={styles.contentColumn}>
            <Text style={styles.calendarNameText}>
              {event.calendarName}
            </Text>
            <Text style={styles.titleText}>{event?.title || 'Untitled Event'}</Text>
            <Text style={styles.locationText}>{event?.location || 'No location'}</Text>
          </View>
        </View>

        {/* Task Summary Row */}
        {hasAnyTasks && (
          <View style={styles.taskSummaryRow}>
            {/* Attendance Indicator */}
            {taskSummary.attendance !== null && (
              <View style={styles.taskIndicator}>
                <Ionicons 
                  name="people-outline" 
                  size={20} 
                  color={theme.text.secondary} 
                />
                <Text style={styles.taskText}>{taskSummary.attendance} Yes</Text>
              </View>
            )}

            {/* Transport Indicator */}
            {taskSummary.transport !== null && (
              <View style={styles.taskIndicator}>
                <Ionicons 
                  name="car-outline" 
                  size={20} 
                  color={theme.text.secondary} 
                />
                <Text style={styles.taskText}>{taskSummary.transport}/2</Text>
              </View>
            )}

            {/* Checklist Indicator */}
            {taskSummary.checklist !== null && (
              <View style={styles.taskIndicator}>
                <Ionicons 
                  name="list-outline" 
                  size={20} 
                  color={taskSummary.checklist ? theme.success : theme.text.secondary} 
                />
                <Ionicons 
                  name={taskSummary.checklist ? "checkmark" : "close"} 
                  size={12} 
                  color={taskSummary.checklist ? theme.success : theme.error} 
                />
              </View>
            )}
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
};

export default EventCard;