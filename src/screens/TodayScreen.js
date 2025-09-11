// src/screens/TodayScreen.js
import React, { useState, useEffect, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ActivityIndicator,
  Alert,
  FlatList,
} from "react-native";
import { useTheme } from "../contexts/ThemeContext";
import { useData } from "../contexts/DataContext";
import { Ionicons } from "@expo/vector-icons";
import { useCalendarActions } from "../hooks";
import { DateTime } from "luxon";
import EventCard from "../components/cards/EventCard/EventCard";

const TodayScreen = ({ navigation }) => {
  const { theme, getSpacing, getTypography, getBorderRadius } = useTheme();
  const { user, calendars, tasks, groups, currentDate, setWorkingDate } =
    useData();
  const { syncCalendar } = useCalendarActions();
  const [syncing, setSyncing] = useState(false);
  const [syncingCalendars, setSyncingCalendars] = useState(new Set());
  console.log("Tasks in TodayScreen:", tasks);

  // keep currentDate synced with "today"
  useEffect(() => {
    const today = DateTime.now().toISODate();
    if (currentDate !== today) {
      setWorkingDate(today);
    }
  }, []);

  const handleImportCalendar = () => {
    navigation.navigate("ImportCalendar");
  };

  // build today's events
  const todaysEvents = useMemo(() => {
    if (!calendars || calendars.length === 0) return [];

    const events = [];
    const todayISO = currentDate;

    calendars.forEach((calendar) => {
      if (calendar.events && typeof calendar.events === "object") {
        Object.entries(calendar.events).forEach(([eventKey, event]) => {
          const eventStart = DateTime.fromISO(event.startTime);
          const eventEnd = DateTime.fromISO(event.endTime);

          if (!eventStart.isValid || !eventEnd.isValid) return;

          const todayStart = DateTime.fromISO(todayISO).startOf("day");
          const todayEnd = DateTime.fromISO(todayISO).endOf("day");

          if (
            eventStart.toISODate() === todayISO ||
            eventEnd.toISODate() === todayISO ||
            (eventStart <= todayEnd && eventEnd >= todayStart)
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

  // sync handler
  const handleSyncAllCalendars = async () => {
    if (calendars.length === 0) {
      Alert.alert(
        "No Calendars",
        "You need to import calendars before you can sync them."
      );
      return;
    }

    Alert.alert(
      "Sync All Calendars",
      `Are you sure you want to sync all ${calendars.length} calendar(s)?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Sync All",
          onPress: async () => {
            setSyncing(true);
            let successCount = 0;
            let errorCount = 0;
            const errors = [];

            try {
              await Promise.all(
                calendars.map(async (calendar) => {
                  const calendarId = calendar.calendarId || calendar.id;
                  setSyncingCalendars((prev) => new Set([...prev, calendarId]));

                  try {
                    await syncCalendar(calendarId);
                    successCount++;
                  } catch (error) {
                    errorCount++;
                    errors.push(`${calendar.name}: ${error.message}`);
                  } finally {
                    setSyncingCalendars((prev) => {
                      const newSet = new Set(prev);
                      newSet.delete(calendarId);
                      return newSet;
                    });
                  }
                })
              );

              if (errorCount === 0) {
                Alert.alert(
                  "Sync Complete",
                  `Successfully synced all ${successCount} calendar(s).`
                );
              } else if (successCount === 0) {
                Alert.alert(
                  "Sync Failed",
                  `Failed to sync any calendars:\n\n${errors.join("\n")}`
                );
              } else {
                Alert.alert(
                  "Sync Partially Complete",
                  `Synced ${successCount}, ${errorCount} failed:\n\n${errors.join(
                    "\n"
                  )}`
                );
              }
            } finally {
              setSyncing(false);
              setSyncingCalendars(new Set());
            }
          },
        },
      ]
    );
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.background,
    },
    safeArea: {
      flex: 1,
    },
    header: {
      paddingHorizontal: getSpacing.lg,
      paddingVertical: getSpacing.md,
      borderBottomWidth: 1,
      borderBottomColor: theme.border,
      backgroundColor: theme.surface,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
    },
    headerTitle: {
      fontSize: getTypography.h2.fontSize,
      fontWeight: getTypography.h2.fontWeight,
      color: theme.text.primary,
    },
    headerActions: {
      flexDirection: "row",
      alignItems: "center",
      gap: getSpacing.sm,
    },
    syncButton: {
      backgroundColor: theme.button.secondary,
      width: 40,
      height: 40,
      borderRadius: 20,
      justifyContent: "center",
      alignItems: "center",
      elevation: 2,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.2,
      shadowRadius: 2,
    },
    syncButtonActive: {
      backgroundColor: theme.primary,
    },
    content: {
      flex: 1,
      paddingHorizontal: getSpacing.md,
    },
    greeting: {
      fontSize: getTypography.h2.fontSize,
      fontWeight: getTypography.h2.fontWeight,
      color: theme.text.primary,
      marginBottom: getSpacing.md,
      textAlign: "center",
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
    fab: {
      backgroundColor: theme.primary,
      width: 40,
      height: 40,
      borderRadius: 20,
      justifyContent: "center",
      alignItems: "center",
      elevation: 4,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.25,
      shadowRadius: 4,
    },
  });

  const getGreeting = () => {
    const hour = new Date().getHours();
    const firstName = user?.username?.split(" ")[0] || "there";

    if (hour < 12) return `Good morning, ${firstName}!`;
    if (hour < 17) return `Good afternoon, ${firstName}!`;
    return `Good evening, ${firstName}!`;
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.safeArea}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Today</Text>

          <View style={styles.headerActions}>
            {calendars.length > 0 && (
              <TouchableOpacity
                style={[
                  styles.syncButton,
                  (syncing || syncingCalendars.size > 0) &&
                    styles.syncButtonActive,
                ]}
                onPress={handleSyncAllCalendars}
                disabled={syncing || syncingCalendars.size > 0}
              >
                {syncing || syncingCalendars.size > 0 ? (
                  <ActivityIndicator size="small" color={theme.text.inverse} />
                ) : (
                  <Ionicons
                    name="sync"
                    size={20}
                    color={theme.button.secondaryText}
                  />
                )}
              </TouchableOpacity>
            )}

            {/* Add Calendar Button */}
            <TouchableOpacity
              style={styles.fab}
              onPress={handleImportCalendar}
              disabled={syncing}
            >
              <Ionicons name="add" size={24} color={theme.text.inverse} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Content */}
        <View style={styles.content}>
          {/* <Text style={styles.greeting}>{getGreeting()}</Text> */}

          {todaysEvents.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons
                name="calendar-outline"
                size={64}
                color={theme.text.tertiary}
              />
              <Text style={styles.emptyTitle}>No Events Today</Text>
              <Text style={styles.emptySubtitle}>
                Enjoy your free day! Sync your calendars to see upcoming events.
              </Text>
            </View>
          ) : (
            <FlatList
              data={todaysEvents}
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

export default TodayScreen;
