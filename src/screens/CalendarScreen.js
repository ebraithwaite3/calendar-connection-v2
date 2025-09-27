import React, { useState, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ActivityIndicator,
  Alert,
} from "react-native";
import { useTheme } from "../contexts/ThemeContext";
import { useData } from "../contexts/DataContext";
import { useCalendarActions } from "../hooks/useCalendarActions";
import { Ionicons } from "@expo/vector-icons";
import { DateTime } from "luxon";
import EventCreateEditModal from "../components/modals/EventCreateEditModal";

const CalendarScreen = ({ navigation }) => {
  const { theme, getSpacing, getTypography, getBorderRadius } = useTheme();
  const { user, calendars, groups } = useData();
  const { syncCalendar } = useCalendarActions();
  const [syncing, setSyncing] = useState(false);
  const [syncingCalendars, setSyncingCalendars] = useState(new Set());
  const [createEditModalVisible, setCreateEditModalVisible] = useState(false);
  console.log("Created Edit Modal Visible:", createEditModalVisible);
  
  const today = DateTime.now().setZone("America/New_York"); // EDT for September 2025
  const [currentMonth, setCurrentMonth] = useState(today.startOf("month"));

  const externalCalendars = useMemo(() => {
    return calendars.filter(cal => cal.type !== 'internal');
  }, [calendars]);
  console.log("External calendars:", externalCalendars);

  const editableCalendars = useMemo(() => {
        // Return calendar objects from user.calendars that are internal with write permissions
        if (!user?.calendars || user.calendars.length === 0) return [];
      
        return user.calendars.filter(
          (cal) => cal.permissions === "write" && cal.calendarType === "internal"
        );
      }, [user?.calendars]);
      console.log("Editable calendars:", editableCalendars);

  const handleImportCalendar = () => {
    if (calendars.length < 2) {
      // If its less than 2, that means they only have their internal user calendar
      // So give them the option to import a calendar
      navigation.navigate("ImportCalendar");
    } else {
      // Navigate to the CalendarEdit screen if there are already calendars
      navigation.navigate("CalendarEdit");
    }
  };

  const handleSyncAllCalendars = async () => {
    if (externalCalendars.length === 0) {
      Alert.alert(
        "No Calendars",
        "You need to import calendars before you can sync them."
      );
      return;
    }

    Alert.alert(
      "Sync All Calendars",
      `Are you sure you want to sync all ${externalCalendars.length} calendar(s)? This may take a moment.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Sync All",
          style: "default",
          onPress: async () => {
            setSyncing(true);
            let successCount = 0;
            let errorCount = 0;
            const errors = [];

            try {
              const syncPromises = externalCalendars.map(async (calendar) => {
                const calendarId = calendar.calendarId || calendar.id;
                setSyncingCalendars((prev) => new Set([...prev, calendarId]));

                try {
                  await syncCalendar(calendarId);
                  successCount++;
                  console.log(`✅ Synced: ${calendar.name}`);
                } catch (error) {
                  errorCount++;
                  errors.push(`${calendar.name}: ${error.message}`);
                  console.error(`❌ Failed to sync ${calendar.name}:`, error);
                } finally {
                  setSyncingCalendars((prev) => {
                    const newSet = new Set(prev);
                    newSet.delete(calendarId);
                    return newSet;
                  });
                }
              });

              await Promise.all(syncPromises);

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
                  `Synced ${successCount} calendar(s), ${errorCount} failed:\n\n${errors.join(
                    "\n"
                  )}`
                );
              }
            } catch (error) {
              console.error("Sync all error:", error);
              Alert.alert(
                "Sync Error",
                "An unexpected error occurred while syncing calendars."
              );
            } finally {
              setSyncing(false);
              setSyncingCalendars(new Set());
            }
          },
        },
      ]
    );
  };

  // Helper function to check if an event has been hidden by user
const isEventHidden = (eventId) => {
  return user?.hiddenEvents?.some(hidden => hidden.eventId === eventId) || false;
};

  // Get all events for a specific date
const getEventsForDate = (date) => {
  if (!calendars || calendars.length === 0) return [];

  const dateISO = date.toISODate();
  const events = [];

  calendars.forEach((calendar) => {
    if (calendar.events) {
      // Change from Object.values to Object.entries to get the eventKey
      Object.entries(calendar.events).forEach(([eventKey, event]) => {
        const eventDate = DateTime.fromISO(event.startTime).setZone(
          "America/New_York"
        );
        if (eventDate.toISODate() === dateISO) {
          // Add the hidden event check here
          if (!isEventHidden(eventKey)) {
            events.push({
              ...event,
              eventId: eventKey, // Add this line to include the eventId
              calendarColor: calendar.color,
              calendarName: calendar.name,
            });
          }
        }
      });
    }
  });

  return events;
};

  // Generate calendar days for current month
  const calendarDays = useMemo(() => {
    const startOfMonth = currentMonth
      .startOf("month")
      .setZone("America/New_York");
    const endOfMonth = currentMonth.endOf("month").setZone("America/New_York");

    // Manual calculation for the first day of the calendar grid (the Sunday before the 1st)
    // Luxon's weekday is 1 for Monday, 7 for Sunday.
    // To get to Sunday, we need to subtract the correct number of days.
    const daysToSubtract =
      startOfMonth.weekday === 7 ? 0 : startOfMonth.weekday;
    const startOfGrid = startOfMonth.minus({ days: daysToSubtract });

    const days = [];
    let current = startOfGrid;

    while (current <= endOfMonth.endOf("week")) {
      const events = getEventsForDate(current);
      days.push({
        date: current,
        isCurrentMonth: current.month === currentMonth.month,
        isToday:
          current.setZone("America/New_York").toISODate() === today.toISODate(),
        events: events,
        eventCount: events.length,
      });
      current = current.plus({ days: 1 });
    }

    return days;
  }, [currentMonth, calendars, today]);

  const handleDatePress = (day) => {
    navigation.navigate("DayScreen", { date: day.date.toISODate() });
  };

  const handlePreviousMonth = () => {
    setCurrentMonth((prev) => prev.minus({ months: 1 }));
  };

  const handleNextMonth = () => {
    setCurrentMonth((prev) => prev.plus({ months: 1 }));
  };

  const handleToday = () => {
    setCurrentMonth(today.startOf("month"));
  };

  const renderEventIndicators = (events) => {
    if (events.length === 0) return null;

    const maxIndicators = 3;
    const visibleEvents = events.slice(0, maxIndicators);

    return (
      <View style={styles.eventIndicators}>
        {visibleEvents.map((event, index) => (
          <View
            key={index}
            style={[
              styles.eventBar,
              { backgroundColor: event.calendarColor || theme.primary },
            ]}
          >
            <Text style={styles.eventText} numberOfLines={1}>
              {event.title}
            </Text>
          </View>
        ))}
        {events.length > maxIndicators && (
          <Text style={styles.moreEventsText}>
            +{events.length - maxIndicators}
          </Text>
        )}
      </View>
    );
  };

  // Group days into weeks
  const weeks = [];
  for (let i = 0; i < calendarDays.length; i += 7) {
    weeks.push(calendarDays.slice(i, i + 7));
  }

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.background,
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
    content: {
      flex: 1,
      paddingHorizontal: getSpacing.md,
      paddingTop: getSpacing.lg,
    },
    monthNavigation: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      marginBottom: getSpacing.lg,
    },
    navButton: {
      backgroundColor: theme.button.secondary,
      width: 40,
      height: 40,
      borderRadius: 20,
      justifyContent: "center",
      alignItems: "center",
    },
    monthTitle: {
      fontSize: getTypography.h1.fontSize,
      fontWeight: getTypography.h1.fontWeight,
      color: theme.text.primary,
    },
    todayButtonContainer: {
      height: 40, // keeps space even if button hidden
      justifyContent: "center",
      alignItems: "flex-center",
      // marginBottom: getSpacing.lg,
    },
    todayButton: {
      backgroundColor: theme.primary,
      paddingHorizontal: getSpacing.md,
      paddingVertical: getSpacing.sm,
      borderRadius: getBorderRadius.md,
      alignSelf: "center", // only as wide as text
    },
    todayButtonText: {
      color: theme.text.inverse,
      fontSize: getTypography.bodySmall.fontSize,
      fontWeight: "600",
    },
    weekHeader: {
      flexDirection: "row",
      marginBottom: getSpacing.sm,
    },
    dayHeader: {
      flex: 1,
      alignItems: "center",
      paddingVertical: getSpacing.sm,
    },
    dayHeaderText: {
      fontSize: getTypography.bodySmall.fontSize,
      fontWeight: "600",
      color: theme.text.secondary,
    },
    calendarGrid: {
      backgroundColor: theme.surface,
      borderRadius: getBorderRadius.md,
      padding: getSpacing.xs,
    },
    weekRow: {
      flexDirection: "row",
    },
    dayCell: {
      flex: 1,
      height: 80,
      alignItems: "center",
      justifyContent: "flex-start",
      paddingTop: getSpacing.xs,
      borderRadius: getBorderRadius.sm,
      marginVertical: 1,
    },
    todayCell: {
      backgroundColor: `${theme.primary}60`,
    },
    otherMonthCell: {
      opacity: 0.3,
    },
    dayText: {
      fontSize: getTypography.body.fontSize,
      fontWeight: "500",
      color: theme.text.primary,
      marginBottom: getSpacing.xs,
    },
    todayText: {
      color: theme.primary,
      fontWeight: "700",
    },
    otherMonthText: {
      color: theme.text.tertiary,
    },
    eventIndicators: {
      width: "100%",
      alignItems: "stretch",
      justifyContent: "flex-start",
      marginTop: getSpacing.xs,
      gap: 2,
    },
    eventBar: {
      height: 14,
      borderRadius: 2,
      paddingHorizontal: 3,
      justifyContent: "center",
      alignItems: "flex-start",
    },
    eventText: {
      fontSize: 8,
      color: "white",
      fontWeight: "500",
    },
    moreEventsText: {
      fontSize: 8,
      color: theme.text.secondary,
      fontWeight: "600",
      marginLeft: 2,
    },
  });

  return (
    <SafeAreaView style={styles.container}>
      {/* Header - Just sync and add buttons */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>
          {calendars?.length > 1 ? "Calendars" : "Calendar"}
        </Text>

        <View style={styles.headerActions}>
          {/* Sync All Button - only show if we have calendars */}
          {externalCalendars.length > 0 && (
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
            style={[
              styles.fab,
              externalCalendars?.length === 0 && {
                width: "auto",
                height: "auto",
                paddingHorizontal: getSpacing.sm,
                paddingVertical: getSpacing.md,
                borderRadius: getBorderRadius.lg,
              },
            ]}
            onPress={handleImportCalendar}
            disabled={syncing}
          >
            {externalCalendars?.length === 0 ? (
              <Text
                style={{
                  color: theme.text.inverse,
                  fontSize: getTypography.body.fontSize,
                  fontWeight: "bold",
                }}
              >
                Import a Calendar
              </Text>
            ) : (
              <Ionicons name="calendar" size={24} color={theme.text.inverse} />
            )}
          </TouchableOpacity>
          {/* Add a plus button for adding an event, for now just console log */}
          <TouchableOpacity
            style={styles.fab}
            onPress={() => setCreateEditModalVisible(true)}
          >
            <Ionicons name="add" size={24} color={theme.text.inverse} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Calendar Content */}
      <View style={styles.content}>
        {/* Month Navigation */}
        <View style={styles.monthNavigation}>
          <TouchableOpacity
            style={styles.navButton}
            onPress={handlePreviousMonth}
          >
            <Ionicons
              name="chevron-back"
              size={20}
              color={theme.button.secondaryText}
            />
          </TouchableOpacity>

          <Text style={styles.monthTitle}>
            {currentMonth.toFormat("MMMM yyyy")}
          </Text>

          <TouchableOpacity style={styles.navButton} onPress={handleNextMonth}>
            <Ionicons
              name="chevron-forward"
              size={20}
              color={theme.button.secondaryText}
            />
          </TouchableOpacity>
        </View>

        {/* Today Button Container (always takes space) */}
        <View style={styles.todayButtonContainer}>
          {currentMonth.month !== today.month ||
          currentMonth.year !== today.year ? (
            <TouchableOpacity style={styles.todayButton} onPress={handleToday}>
              <Text style={styles.todayButtonText}>Jump to Today</Text>
            </TouchableOpacity>
          ) : null}
        </View>

        {/* Days of Week Header */}
        <View style={styles.weekHeader}>
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
            <View key={day} style={styles.dayHeader}>
              <Text style={styles.dayHeaderText}>{day}</Text>
            </View>
          ))}
        </View>

        {/* Calendar Grid */}
        <View style={styles.calendarGrid}>
          {weeks.map((week, weekIndex) => (
            <View key={weekIndex} style={styles.weekRow}>
              {week.map((day, dayIndex) => (
                <TouchableOpacity
                  key={dayIndex}
                  style={[
                    styles.dayCell,
                    day.isToday && styles.todayCell,
                    !day.isCurrentMonth && styles.otherMonthCell,
                  ]}
                  onPress={() => handleDatePress(day)}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[
                      styles.dayText,
                      day.isToday && styles.todayText,
                      !day.isCurrentMonth && styles.otherMonthText,
                    ]}
                  >
                    {day.date.day}
                  </Text>
                  {renderEventIndicators(day.events)}
                </TouchableOpacity>
              ))}
            </View>
          ))}
        </View>
      </View>
      <EventCreateEditModal
        isVisible={createEditModalVisible}
        onClose={() => setCreateEditModalVisible(false)}
        availableCalendars={editableCalendars}
        initialDate={today}
        groups={groups}
      />
    </SafeAreaView>
  );
};

export default CalendarScreen;
