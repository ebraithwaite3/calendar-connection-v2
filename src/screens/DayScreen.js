import React, { useState, useEffect, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  FlatList,
  Platform,
} from "react-native";
import { useTheme } from "../contexts/ThemeContext";
import { useData } from "../contexts/DataContext";
import { Ionicons } from "@expo/vector-icons";
import { DateTime } from "luxon";
import EventCard from "../components/cards/EventCard/EventCard";

const DayScreen = ({ navigation, route }) => {
  const { theme, getSpacing, getTypography } = useTheme();
  const { user, calendars, tasks, groups, setWorkingDate } = useData();
  const { date: initialDate } = route.params || { date: DateTime.now().toISODate() };
  
  const [currentDate, setCurrentDate] = useState(initialDate);

  console.log("Tasks in DayScreen:", tasks);

  // Update working date when current date changes
  useEffect(() => {
    setWorkingDate(currentDate);
  }, [currentDate, setWorkingDate]);

  // Navigation functions
  const goToPreviousDay = () => {
    const previousDay = DateTime.fromISO(currentDate).minus({ days: 1 }).toISODate();
    setCurrentDate(previousDay);
  };

  const goToNextDay = () => {
    const nextDay = DateTime.fromISO(currentDate).plus({ days: 1 }).toISODate();
    setCurrentDate(nextDay);
  };

  // Format date for header display
  const formatHeaderDate = (dateString) => {
    const date = DateTime.fromISO(dateString);
    return date.toFormat('ccc LLL d'); // e.g., "Wed Sep 10"
  };

  // Build events for the selected date
  const dayEvents = useMemo(() => {
    if (!calendars || calendars.length === 0) return [];

    const events = [];
    const dayISO = currentDate;

    calendars.forEach((calendar) => {
      if (calendar.events && typeof calendar.events === "object") {
        Object.entries(calendar.events).forEach(([eventKey, event]) => {
          const eventStart = DateTime.fromISO(event.startTime);
          const eventEnd = DateTime.fromISO(event.endTime);

          if (!eventStart.isValid || !eventEnd.isValid) return;

          const dayStart = DateTime.fromISO(dayISO).startOf("day");
          const dayEnd = DateTime.fromISO(dayISO).endOf("day");

          if (
            eventStart.toISODate() === dayISO ||
            eventEnd.toISODate() === dayISO ||
            (eventStart <= dayEnd && eventEnd >= dayStart)
          ) {
            events.push({
              ...event,
              eventId: eventKey,
              calendarName: calendar.name,
              calendarColor: calendar.color || theme.primary,
              eventType: event.eventType || "event",
            });
          }
        });
      }
    });

    events.sort(
      (a, b) => DateTime.fromISO(a.startTime) - DateTime.fromISO(b.startTime)
    );
    return events;
  }, [calendars, currentDate, theme.primary]);

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.background,
    },
    safeArea: {
      flex: 1,
      paddingTop: Platform.OS === 'ios' ? 0 : getSpacing.sm, // Adjust for status bar on Android
    },
    header: {
      paddingHorizontal: getSpacing.lg,
      paddingVertical: getSpacing.lg,
      borderBottomWidth: 1,
      borderBottomColor: theme.border,
      backgroundColor: theme.surface,
      flexDirection: "row",
      alignItems: "center",
    },
    dateNavigation: {
      flexDirection: "row",
      alignItems: "center",
      gap: getSpacing.lg,
      flex: 1,
      justifyContent: "center",
    },
    navButton: {
      backgroundColor: theme.button.secondary,
      width: 36,
      height: 36,
      borderRadius: 18,
      justifyContent: "center",
      alignItems: "center",
    },
    headerTitle: {
      fontSize: getTypography.h2.fontSize,
      fontWeight: getTypography.h2.fontWeight,
      color: theme.text.primary,
      textAlign: "center",
      lineHeight: getTypography.h2.fontSize * 1,
      flexShrink: 1,
    },
    content: {
      flex: 1,
      paddingHorizontal: getSpacing.md,
    },
    eventsContainer: {
      paddingVertical: getSpacing.md,
      paddingBottom: getSpacing.lg,
    },
    emptyState: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      padding: getSpacing.lg,
    },
    emptyTitle: {
      fontSize: getTypography.h3.fontSize,
      fontWeight: getTypography.h3.fontWeight,
      color: theme.text.primary,
      marginTop: getSpacing.md,
      marginBottom: getSpacing.sm,
    },
    emptySubtitle: {
      fontSize: getTypography.body.fontSize,
      color: theme.text.secondary,
      textAlign: "center",
    },
  });

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.safeArea}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons
              name="arrow-back"
              size={20}
              color={theme.button.secondaryText}
            />
          </TouchableOpacity>

          <View style={styles.dateNavigation}>
            <TouchableOpacity
              style={styles.navButton}
              onPress={goToPreviousDay}
            >
              <Ionicons
                name="chevron-back"
                size={20}
                color={theme.button.secondaryText}
              />
            </TouchableOpacity>

            <Text
              style={styles.headerTitle}
              numberOfLines={1}
            >
              {formatHeaderDate(currentDate)}
            </Text>

            <TouchableOpacity
              style={styles.navButton}
              onPress={goToNextDay}
            >
              <Ionicons
                name="chevron-forward"
                size={20}
                color={theme.button.secondaryText}
              />
            </TouchableOpacity>
          </View>
        </View>

        {/* Content */}
        <View style={styles.content}>
          {dayEvents.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons
                name="calendar-outline"
                size={64}
                color={theme.text.tertiary}
              />
              <Text style={styles.emptyTitle}>Free Day</Text>
              <Text style={styles.emptySubtitle}>
                No events scheduled for this day.
              </Text>
            </View>
          ) : (
            <FlatList
              data={dayEvents}
              keyExtractor={(event, index) =>
                `${event.calendarId}-${event.eventId}-${index}`
              }
              renderItem={({ item }) => (
                <EventCard
                  event={item}
                  groups={groups}
                  calendars={calendars}
                  showCalendarName
                  tasks={tasks}
                  onPress={(event) =>
                    navigation.navigate("EventDetails", {
                      eventId: event.eventId,
                      calendarId: event.calendarId,
                    })
                  }
                />
              )}
              contentContainerStyle={styles.eventsContainer}
            />
          )}
        </View>
      </View>
    </SafeAreaView>
  );
};

export default DayScreen;