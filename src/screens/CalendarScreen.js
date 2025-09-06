import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
} from 'react-native';
import { useTheme } from '../contexts/ThemeContext';
import { useData } from '../contexts/DataContext';
import { Ionicons } from '@expo/vector-icons';

const CalendarScreen = ({ navigation }) => {
  const { theme, getSpacing, getTypography, getBorderRadius } = useTheme();
  const { calendars, calendarsLoading } = useData();

  const handleImportCalendar = () => {
    navigation.navigate('ImportCalendar');
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
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'flex-start', // Changed to keep FAB near title
    },
    headerTitle: {
      fontSize: getTypography.h2.fontSize,
      fontWeight: getTypography.h2.fontWeight,
      color: theme.text.primary,
    },
    content: {
      flex: 1,
      paddingHorizontal: getSpacing.lg,
      paddingTop: getSpacing.xl,
    },
    emptyState: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingBottom: getSpacing.xxl,
    },
    emptyIcon: {
      marginBottom: getSpacing.lg,
    },
    emptyTitle: {
      fontSize: getTypography.h3.fontSize,
      fontWeight: getTypography.h3.fontWeight,
      color: theme.text.primary,
      marginBottom: getSpacing.md,
      textAlign: 'center',
    },
    emptySubtitle: {
      fontSize: getTypography.body.fontSize,
      color: theme.text.secondary,
      textAlign: 'center',
      marginBottom: getSpacing.xl,
      lineHeight: 22,
      paddingHorizontal: getSpacing.md,
    },
    importButton: {
      backgroundColor: theme.primary,
      paddingVertical: getSpacing.md,
      paddingHorizontal: getSpacing.xl,
      borderRadius: getBorderRadius.md,
      flexDirection: 'row',
      alignItems: 'center',
      elevation: 2,
      shadowColor: theme.primary,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.2,
      shadowRadius: 4,
    },
    importButtonText: {
      color: theme.text.inverse,
      fontSize: getTypography.button.fontSize,
      fontWeight: getTypography.button.fontWeight,
      marginLeft: getSpacing.sm,
    },
    calendarsList: {
      paddingTop: getSpacing.md,
    },
    calendarItem: {
      backgroundColor: theme.surface,
      padding: getSpacing.lg,
      borderRadius: getBorderRadius.md,
      marginBottom: getSpacing.md,
      borderLeftWidth: 4,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.1,
      shadowRadius: 2,
      elevation: 1,
    },
    calendarName: {
      fontSize: getTypography.h4.fontSize,
      fontWeight: getTypography.h4.fontWeight,
      color: theme.text.primary,
      marginBottom: getSpacing.xs,
    },
    calendarInfo: {
      fontSize: getTypography.bodySmall.fontSize,
      color: theme.text.secondary,
      marginBottom: getSpacing.xs,
    },
    syncStatus: {
      fontSize: getTypography.bodySmall.fontSize,
      fontWeight: '600',
      marginTop: getSpacing.xs,
    },
    fab: {
      backgroundColor: theme.primary,
      width: 40,
      height: 40,
      borderRadius: 24,
      justifyContent: 'center',
      alignItems: 'center',
      elevation: 4,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.25,
      shadowRadius: 4,
      marginLeft: getSpacing.md, // Margin from title
      marginRight: getSpacing.lg, // Margin from hamburger button
    },
  });

  const getSyncStatusColor = (status) => {
    switch (status) {
      case 'success': return '#10B981';
      case 'syncing': return '#F59E0B';
      case 'error': return '#EF4444';
      default: return theme.text.tertiary;
    }
  };

  const getSyncStatusText = (status) => {
    switch (status) {
      case 'success': return 'Synced';
      case 'syncing': return 'Syncing...';
      case 'error': return 'Sync Error';
      case 'pending': return 'Not Synced';
      default: return 'Unknown';
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.safeArea}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>
            {calendars?.length > 1 ? 'Calendars' : 'Calendar'}
          </Text>
          {calendars.length > 0 && (
            <TouchableOpacity 
              style={styles.fab} 
              onPress={handleImportCalendar}
            >
              <Ionicons name="add" size={24} color={theme.text.inverse} />
            </TouchableOpacity>
          )}
        </View>

        {/* Content */}
        <View style={styles.content}>
          {calendars.length === 0 ? (
            // Empty state
            <View style={styles.emptyState}>
              <View style={styles.emptyIcon}>
                <Ionicons 
                  name="calendar-outline" 
                  size={64} 
                  color={theme.text.tertiary} 
                />
              </View>
              <Text style={styles.emptyTitle}>No Calendars Yet</Text>
              <Text style={styles.emptySubtitle}>
                Import your Google Calendar, iCal feeds, or other calendar sources to get started.
              </Text>
              <TouchableOpacity 
                style={styles.importButton} 
                onPress={handleImportCalendar}
              >
                <Ionicons name="add" size={20} color={theme.text.inverse} />
                <Text style={styles.importButtonText}>Import Calendar</Text>
              </TouchableOpacity>
            </View>
          ) : (
            // Calendars list
            <View style={styles.calendarsList}>
              {calendars.map((calendar) => (
                <View 
                  key={calendar.id} 
                  style={[
                    styles.calendarItem, 
                    { borderLeftColor: calendar.color }
                  ]}
                >
                  <Text style={styles.calendarName}>{calendar.name}</Text>
                  <Text style={styles.calendarInfo}>
                    {calendar.eventsCount} events • {calendar.sourceType}
                  </Text>
                  {calendar.description && (
                    <Text style={styles.calendarInfo}>
                      {calendar.description}
                    </Text>
                  )}
                  <Text 
                    style={[
                      styles.syncStatus, 
                      { color: getSyncStatusColor(calendar.sync?.syncStatus) }
                    ]}
                  >
                    {getSyncStatusText(calendar.sync?.syncStatus)}
                    {calendar.sync?.lastSyncedAt && calendar.sync.syncStatus === 'success' && 
                      ` • ${new Date(calendar.sync.lastSyncedAt).toLocaleDateString()}`
                    }
                  </Text>
                </View>
              ))}
            </View>
          )}
        </View>
      </View>
    </SafeAreaView>
  );
};

export default CalendarScreen;