import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useTheme } from '../contexts/ThemeContext';
import { useData } from '../contexts/DataContext';
import { useCalendarActions } from '../hooks/useCalendarActions';
import { Ionicons } from '@expo/vector-icons';

const CalendarScreen = ({ navigation }) => {
  const { theme, getSpacing, getTypography, getBorderRadius } = useTheme();
  const { calendars, calendarsLoading } = useData();
  const { syncCalendar } = useCalendarActions();
  const [syncing, setSyncing] = useState(false);
  const [syncingCalendars, setSyncingCalendars] = useState(new Set());

  const handleImportCalendar = () => {
    navigation.navigate('ImportCalendar');
  };

  const handleSyncAllCalendars = async () => {
    if (calendars.length === 0) {
      Alert.alert('No Calendars', 'You need to import calendars before you can sync them.');
      return;
    }

    Alert.alert(
      'Sync All Calendars',
      `Are you sure you want to sync all ${calendars.length} calendar(s)? This may take a moment.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sync All',
          style: 'default',
          onPress: async () => {
            setSyncing(true);
            let successCount = 0;
            let errorCount = 0;
            const errors = [];

            try {
              // Sync all calendars in parallel
              const syncPromises = calendars.map(async (calendar) => {
                const calendarId = calendar.calendarId || calendar.id;
                setSyncingCalendars(prev => new Set([...prev, calendarId]));
                
                try {
                  await syncCalendar(calendarId);
                  successCount++;
                  console.log(`✅ Synced: ${calendar.name}`);
                } catch (error) {
                  errorCount++;
                  errors.push(`${calendar.name}: ${error.message}`);
                  console.error(`❌ Failed to sync ${calendar.name}:`, error);
                } finally {
                  setSyncingCalendars(prev => {
                    const newSet = new Set(prev);
                    newSet.delete(calendarId);
                    return newSet;
                  });
                }
              });

              await Promise.all(syncPromises);

              // Show results
              if (errorCount === 0) {
                Alert.alert(
                  'Sync Complete',
                  `Successfully synced all ${successCount} calendar(s).`
                );
              } else if (successCount === 0) {
                Alert.alert(
                  'Sync Failed',
                  `Failed to sync any calendars:\n\n${errors.join('\n')}`
                );
              } else {
                Alert.alert(
                  'Sync Partially Complete',
                  `Synced ${successCount} calendar(s), ${errorCount} failed:\n\n${errors.join('\n')}`
                );
              }
            } catch (error) {
              console.error('Sync all error:', error);
              Alert.alert('Sync Error', 'An unexpected error occurred while syncing calendars.');
            } finally {
              setSyncing(false);
              setSyncingCalendars(new Set());
            }
          },
        },
      ]
    );
  };

  const handleSyncSingleCalendar = async (calendar) => {
    const calendarId = calendar.calendarId || calendar.id;
    setSyncingCalendars(prev => new Set([...prev, calendarId]));

    try {
      await syncCalendar(calendarId);
      Alert.alert('Sync Complete', `Successfully synced "${calendar.name}".`);
    } catch (error) {
      console.error(`Failed to sync ${calendar.name}:`, error);
      Alert.alert('Sync Failed', `Failed to sync "${calendar.name}": ${error.message}`);
    } finally {
      setSyncingCalendars(prev => {
        const newSet = new Set(prev);
        newSet.delete(calendarId);
        return newSet;
      });
    }
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
      justifyContent: 'space-between',
    },
    headerLeft: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    headerTitle: {
      fontSize: getTypography.h2.fontSize,
      fontWeight: getTypography.h2.fontWeight,
      color: theme.text.primary,
    },
    headerActions: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: getSpacing.sm,
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
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    calendarInfo: {
      flex: 1,
    },
    calendarName: {
      fontSize: getTypography.h4.fontSize,
      fontWeight: getTypography.h4.fontWeight,
      color: theme.text.primary,
      marginBottom: getSpacing.xs,
    },
    calendarDetails: {
      fontSize: getTypography.bodySmall.fontSize,
      color: theme.text.secondary,
      marginBottom: getSpacing.xs,
    },
    syncStatus: {
      fontSize: getTypography.bodySmall.fontSize,
      fontWeight: '600',
      marginTop: getSpacing.xs,
    },
    calendarActions: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: getSpacing.sm,
    },
    fab: {
      backgroundColor: theme.primary,
      width: 40,
      height: 40,
      borderRadius: 20,
      justifyContent: 'center',
      alignItems: 'center',
      elevation: 4,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.25,
      shadowRadius: 4,
    },
    syncButton: {
      backgroundColor: theme.button.secondary,
      width: 40,
      height: 40,
      borderRadius: 20,
      justifyContent: 'center',
      alignItems: 'center',
      elevation: 2,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.2,
      shadowRadius: 2,
    },
    syncButtonActive: {
      backgroundColor: theme.primary,
    },
    syncCalendarButton: {
      backgroundColor: theme.button.secondary,
      width: 32,
      height: 32,
      borderRadius: 16,
      justifyContent: 'center',
      alignItems: 'center',
    },
    syncCalendarButtonActive: {
      backgroundColor: theme.primary,
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
          <View style={styles.headerLeft}>
            <Text style={styles.headerTitle}>
              {calendars?.length > 1 ? 'Calendars' : 'Calendar'}
            </Text>
          </View>

          {/* Header Actions */}
          <View style={styles.headerActions}>
            {/* Sync All Button - only show if we have calendars */}
            {calendars.length > 0 && (
              <TouchableOpacity 
                style={[styles.syncButton, (syncing || syncingCalendars.size > 0) && styles.syncButtonActive]} 
                onPress={handleSyncAllCalendars}
                disabled={syncing || syncingCalendars.size > 0}
              >
                {syncing || syncingCalendars.size > 0 ? (
                  <ActivityIndicator size="small" color={theme.text.inverse} />
                ) : (
                  <Ionicons name="sync" size={20} color={theme.button.secondaryText} />
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
                disabled={syncing}
              >
                <Ionicons name="add" size={20} color={theme.text.inverse} />
                <Text style={styles.importButtonText}>Import Calendar</Text>
              </TouchableOpacity>
            </View>
          ) : (
            // Calendars list
            <View style={styles.calendarsList}>
              {calendars.map((calendar) => {
                const calendarId = calendar.calendarId || calendar.id;
                const isCalendarSyncing = syncingCalendars.has(calendarId);
                
                return (
                  <View 
                    key={calendar.id} 
                    style={[
                      styles.calendarItem, 
                      { borderLeftColor: calendar.color }
                    ]}
                  >
                    <View style={styles.calendarInfo}>
                      <Text style={styles.calendarName}>{calendar.name}</Text>
                      <Text style={styles.calendarDetails}>
                        {calendar.eventsCount || 0} events • {calendar.sourceType || calendar.type}
                      </Text>
                      {calendar.description && (
                        <Text style={styles.calendarDetails}>
                          {calendar.description}
                        </Text>
                      )}
                      <Text 
                        style={[
                          styles.syncStatus, 
                          { color: getSyncStatusColor(calendar.sync?.syncStatus || calendar.syncStatus) }
                        ]}
                      >
                        {isCalendarSyncing ? 'Syncing...' : getSyncStatusText(calendar.sync?.syncStatus || calendar.syncStatus)}
                        {calendar.sync?.lastSyncedAt && calendar.sync.syncStatus === 'success' && 
                          ` • ${new Date(calendar.sync.lastSyncedAt).toLocaleDateString()}`
                        }
                      </Text>
                    </View>

                    {/* Individual Calendar Actions */}
                    <View style={styles.calendarActions}>
                      <TouchableOpacity
                        style={[
                          styles.syncCalendarButton,
                          isCalendarSyncing && styles.syncCalendarButtonActive
                        ]}
                        onPress={() => handleSyncSingleCalendar(calendar)}
                        disabled={isCalendarSyncing || syncing}
                      >
                        {isCalendarSyncing ? (
                          <ActivityIndicator size="small" color={theme.text.inverse} />
                        ) : (
                          <Ionicons 
                            name="sync" 
                            size={16} 
                            color={isCalendarSyncing ? theme.text.inverse : theme.button.secondaryText} 
                          />
                        )}
                      </TouchableOpacity>
                    </View>
                  </View>
                );
              })}
            </View>
          )}
        </View>
      </View>
    </SafeAreaView>
  );
};

export default CalendarScreen;