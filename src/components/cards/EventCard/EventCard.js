import React, { useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
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

  // Format the event time
  const startTime = event?.startTime ? DateTime.fromISO(event.startTime) : null;
  const timeText = startTime ? startTime.toLocaleString(DateTime.TIME_SIMPLE) : 'All Day';

  const styles = StyleSheet.create({
    container: {
      width: '100%',                  // <--- makes it take full parent width
      backgroundColor: theme.surface || '#FFFFFF',
      borderRadius: getBorderRadius.md,
      marginHorizontal: getSpacing.lg,
      marginBottom: getSpacing.md,
      padding: getSpacing.md,
      borderLeftWidth: 4,
      borderLeftColor: event.calendarColor || theme.primary,
      flexDirection: 'row',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3,
      ...style,
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
  });

  return (
    <TouchableOpacity onPress={handlePress} activeOpacity={0.7}>
      <View style={styles.container}>
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
    </TouchableOpacity>
  );
};

export default EventCard;
