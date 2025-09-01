import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
  ActivityIndicator,
  SafeAreaView,
} from 'react-native';
import { useTheme } from '../../contexts/ThemeContext';
import { useData } from '../../contexts/DataContext';
import { addCalendarWithStateUpdate, userHasCalendar } from '../../services/calendarService';
import { useAuth } from '../../contexts/AuthContext';
import ColorSelector from '../common/ColorSelector';
import { Ionicons } from '@expo/vector-icons';

export default function ImportCalendarScreen({ navigation }) {
  const { theme, getSpacing, getTypography, getBorderRadius } = useTheme();
  const { user, loading: userLoading } = useData();
  const { user: authUser } = useAuth();
  
  const [calendarType, setCalendarType] = useState('google'); // 'google' or 'ical'
  const [ownershipType, setOwnershipType] = useState('owned'); // 'owned' or 'subscription'
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [url, setUrl] = useState('');
  const [color, setColor] = useState('#3B82F6');
  const [importing, setImporting] = useState(false);

  // Available colors (same as in ColorSelector)
  const availableColors = [
    '#3B82F6', // Blue
    '#EF4444', // Red
    '#10B981', // Green
    '#F59E0B', // Amber
    '#8B5CF6', // Purple
    '#EC4899', // Pink
    '#6366F1', // Indigo
    '#14B8A6', // Teal
    '#F97316', // Orange
    '#84CC16', // Lime
    '#06B6D4', // Cyan
    '#8B5A2B', // Brown
  ];

  // Get currently used colors from user's calendars
  const usedColors = [
    ...(user?.calendars || []).map(cal => cal.color),
    ...(user?.subscriptions || []).map(sub => sub.color)
  ].filter(Boolean);

  // Auto-select first available color when component mounts or used colors change
  useEffect(() => {
    const firstAvailable = availableColors.find(color => !usedColors.includes(color));
    if (firstAvailable && (usedColors.includes(color) || color === '#3B82F6')) {
      setColor(firstAvailable);
    }
  }, [usedColors]);

  const validateUrl = (url, type) => {
    if (type === 'google') {
      if (url.includes('calendar.google.com/calendar/u/')) {
        Alert.alert(
          'Wrong URL Type', 
          'This looks like a calendar view URL. Please get the iCal feed URL instead:\n\n1. Go to calendar settings\n2. Find "Integrate calendar"\n3. Copy "Secret address in iCal format"'
        );
        return false;
      }
      return url.includes('calendar.google.com/calendar/ical') && url.includes('.ics');
    } else if (type === 'ical') {
      // Accept various iCal URL formats:
      // - Standard .ics files
      // - iCloud published calendars (caldav.icloud.com)
      // - Google Calendar ical exports
      // - Other webcal:// or https:// calendar feeds
      
      const hasValidProtocol = url.startsWith('https://') || 
                              url.startsWith('http://') || 
                              url.startsWith('webcal://');
      
      const hasValidPath = url.includes('.ics') || 
                          url.includes('ical') || 
                          url.includes('caldav.icloud.com') ||
                          url.includes('calendar.google.com/calendar/ical') ||
                          url.includes('/published/') ||
                          url.includes('/calendar/');
      
      return hasValidProtocol && hasValidPath;
    }
    return false;
  };

  const handleImport = async () => {
    if (!name.trim()) {
      Alert.alert('Error', 'Please enter a calendar name');
      return;
    }
  
    if (!url.trim()) {
      Alert.alert('Error', 'Please enter a calendar URL');
      return;
    }
  
    const urlIsValid = validateUrl(url, calendarType);
    if (!urlIsValid) {
      Alert.alert('Error', 'Please enter a valid calendar URL');
      return;
    }

    // Check if user already has this calendar
    const calendarAddress = url.trim();
    if (user && userHasCalendar(user, calendarAddress)) {
      Alert.alert('Duplicate Calendar', 'You have already added this calendar');
      return;
    }
  
    const calendarData = {
      name: name.trim(),
      ...(ownershipType === 'owned' ? {
        calendarAddress: url.trim(),
        calendarType,
        permissions: 'owner'
      } : {
        subscriptionAddress: url.trim(),
        subscriptionType: calendarType,
        permissions: 'read'
      }),
      color,
      description: description.trim(),
    };

    setImporting(true);
    
    try {
      await addCalendarWithStateUpdate(authUser.userId, calendarData);
      
      Alert.alert(
        'Success', 
        `Calendar "${calendarData.name}" has been imported successfully!`,
        [
          {
            text: 'OK',
            onPress: () => navigation.goBack()
          }
        ]
      );
      
    } catch (error) {
      console.error('Import calendar error:', error);
      Alert.alert(
        'Import Failed', 
        error.message || 'Failed to import calendar. Please check your URL and try again.'
      );
    } finally {
      setImporting(false);
    }
  };

  const handleCancel = () => {
    if (importing) return; // Don't allow cancel during import
    
    // Check if user has entered any data
    const hasData = name.trim() || description.trim() || url.trim();
    
    if (hasData) {
      Alert.alert(
        'Discard Changes?',
        'You have unsaved changes. Are you sure you want to go back?',
        [
          { text: 'Keep Editing', style: 'cancel' },
          { 
            text: 'Discard', 
            style: 'destructive',
            onPress: () => navigation.goBack()
          }
        ]
      );
    } else {
      navigation.goBack();
    }
  };

  if (userLoading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.primary} />
          <Text style={[styles.loadingText, { color: theme.text.secondary }]}>
            Loading...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.background,
    },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
    loadingText: {
      marginTop: getSpacing.md,
      fontSize: getTypography.body.fontSize,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: getSpacing.lg,
      paddingVertical: getSpacing.md,
      borderBottomWidth: 1,
      borderBottomColor: theme.border,
    },
    headerLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      flex: 1,
    },
    backButton: {
      marginRight: getSpacing.md,
      padding: getSpacing.sm,
    },
    title: {
      fontSize: getTypography.h3.fontSize,
      fontWeight: getTypography.h3.fontWeight,
      color: theme.text.primary,
    },
    headerRight: {
      width: 40, // Balance the header
    },
    content: {
      flex: 1,
    },
    scrollContent: {
      padding: getSpacing.lg,
    },
    section: {
      marginBottom: getSpacing.lg,
    },
    sectionTitle: {
      fontSize: getTypography.h4.fontSize,
      fontWeight: getTypography.h4.fontWeight,
      color: theme.text.primary,
      marginBottom: getSpacing.md,
    },
    toggleContainer: {
      flexDirection: 'row',
      backgroundColor: theme.surface,
      borderRadius: getBorderRadius.md,
      padding: getSpacing.xs,
      marginBottom: getSpacing.md,
    },
    toggleButton: {
      flex: 1,
      paddingVertical: getSpacing.sm,
      paddingHorizontal: getSpacing.md,
      borderRadius: getBorderRadius.md,
      alignItems: 'center',
    },
    toggleButtonActive: {
      backgroundColor: theme.primary,
    },
    toggleButtonInactive: {
      backgroundColor: 'transparent',
    },
    toggleText: {
      fontSize: getTypography.body.fontSize,
      fontWeight: '600',
    },
    toggleTextActive: {
      color: theme.text.inverse,
    },
    toggleTextInactive: {
      color: theme.text.secondary,
    },
    label: {
      fontSize: getTypography.body.fontSize,
      fontWeight: '600',
      color: theme.text.primary,
      marginBottom: getSpacing.sm,
    },
    input: {
      borderWidth: 1,
      borderColor: theme.border,
      borderRadius: getBorderRadius.md,
      padding: getSpacing.md,
      fontSize: getTypography.body.fontSize,
      color: theme.text.primary,
      backgroundColor: theme.surface,
      marginBottom: getSpacing.md,
    },
    inputMultiline: {
      height: 80,
      textAlignVertical: 'top',
    },
    helpText: {
      fontSize: getTypography.bodySmall.fontSize,
      color: theme.text.tertiary,
      fontStyle: 'italic',
      marginTop: getSpacing.xs,
      lineHeight: 18,
    },
    bottomContainer: {
      padding: getSpacing.lg,
      borderTopWidth: 1,
      borderTopColor: theme.border,
      backgroundColor: theme.surface,
    },
    buttonContainer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
    },
    button: {
      flex: 1,
      paddingVertical: getSpacing.md,
      paddingHorizontal: getSpacing.lg,
      borderRadius: getBorderRadius.md,
      alignItems: 'center',
      marginHorizontal: getSpacing.sm,
    },
    cancelButton: {
      backgroundColor: theme.button.secondary,
    },
    importButton: {
      backgroundColor: theme.primary,
    },
    importButtonDisabled: {
      backgroundColor: theme.text.tertiary,
    },
    buttonText: {
      fontSize: getTypography.button.fontSize,
      fontWeight: getTypography.button.fontWeight,
    },
    cancelButtonText: {
      color: theme.button.secondaryText,
    },
    importButtonText: {
      color: theme.text.inverse,
    },
    importingContainer: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    importingText: {
      marginLeft: getSpacing.sm,
      color: theme.text.inverse,
    },
  });

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={handleCancel}
            disabled={importing}
          >
            <Ionicons 
              name="arrow-back" 
              size={24} 
              color={importing ? theme.text.tertiary : theme.text.primary} 
            />
          </TouchableOpacity>
          <Text style={styles.title}>Import Calendar</Text>
        </View>
        <View style={styles.headerRight} />
      </View>

      {/* Content */}
      <View style={styles.content}>
        <ScrollView 
          style={styles.content}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Calendar Type */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Calendar Type</Text>
            <View style={styles.toggleContainer}>
              <TouchableOpacity
                style={[
                  styles.toggleButton,
                  calendarType === 'google' ? styles.toggleButtonActive : styles.toggleButtonInactive
                ]}
                onPress={() => setCalendarType('google')}
                disabled={importing}
              >
                <Text style={[
                  styles.toggleText,
                  calendarType === 'google' ? styles.toggleTextActive : styles.toggleTextInactive
                ]}>
                  Google Calendar
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.toggleButton,
                  calendarType === 'ical' ? styles.toggleButtonActive : styles.toggleButtonInactive
                ]}
                onPress={() => setCalendarType('ical')}
                disabled={importing}
              >
                <Text style={[
                  styles.toggleText,
                  calendarType === 'ical' ? styles.toggleTextActive : styles.toggleTextInactive
                ]}>
                  iCal/Other
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Ownership Type */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Calendar Ownership</Text>
            <View style={styles.toggleContainer}>
              <TouchableOpacity
                style={[
                  styles.toggleButton,
                  ownershipType === 'owned' ? styles.toggleButtonActive : styles.toggleButtonInactive
                ]}
                onPress={() => setOwnershipType('owned')}
                disabled={importing}
              >
                <Text style={[
                  styles.toggleText,
                  ownershipType === 'owned' ? styles.toggleTextActive : styles.toggleTextInactive
                ]}>
                  My Calendar
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.toggleButton,
                  ownershipType === 'subscription' ? styles.toggleButtonActive : styles.toggleButtonInactive
                ]}
                onPress={() => setOwnershipType('subscription')}
                disabled={importing}
              >
                <Text style={[
                  styles.toggleText,
                  ownershipType === 'subscription' ? styles.toggleTextActive : styles.toggleTextInactive
                ]}>
                  Subscription
                </Text>
              </TouchableOpacity>
            </View>
            <Text style={styles.helpText}>
              {ownershipType === 'owned' 
                ? 'A calendar you own (like your personal Google Calendar)'
                : 'A read-only calendar you subscribe to (like TeamSnap or school schedules)'
              }
            </Text>
          </View>

          {/* Calendar Name */}
          <View style={styles.section}>
            <Text style={styles.label}>Calendar Name</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g., Family Calendar"
              placeholderTextColor={theme.text.tertiary}
              value={name}
              onChangeText={setName}
              editable={!importing}
            />
          </View>

          {/* Description */}
          <View style={styles.section}>
            <Text style={styles.label}>Description (Optional)</Text>
            <TextInput
              style={[styles.input, styles.inputMultiline]}
              placeholder="Brief description of this calendar..."
              placeholderTextColor={theme.text.tertiary}
              value={description}
              onChangeText={setDescription}
              multiline
              numberOfLines={3}
              editable={!importing}
            />
          </View>

          {/* Calendar URL */}
          <View style={styles.section}>
            <Text style={styles.label}>Calendar URL</Text>
            <TextInput
              style={styles.input}
              placeholder={calendarType === 'google' 
                ? 'https://calendar.google.com/calendar/ical/...'
                : 'https://example.com/calendar.ics'
              }
              placeholderTextColor={theme.text.tertiary}
              value={url}
              onChangeText={setUrl}
              keyboardType="url"
              autoCapitalize="none"
              editable={!importing}
            />
            <Text style={styles.helpText}>
              {calendarType === 'google' 
                ? 'Get this from Google Calendar → Settings → Integrate calendar → Secret address in iCal format'
                : 'The iCal (.ics) URL from your calendar provider'
              }
            </Text>
          </View>

          {/* Color Selection */}
          <ColorSelector
            selectedColor={color}
            onColorSelect={setColor}
            usedColors={usedColors}
            disabled={importing}
            label="Display Color"
          />
        </ScrollView>
      </View>

      {/* Bottom Buttons */}
      <View style={styles.bottomContainer}>
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={[styles.button, styles.cancelButton]}
            onPress={handleCancel}
            disabled={importing}
          >
            <Text style={[styles.buttonText, styles.cancelButtonText]}>
              Cancel
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[
              styles.button, 
              importing ? styles.importButtonDisabled : styles.importButton
            ]}
            onPress={handleImport}
            disabled={importing}
          >
            {importing ? (
              <View style={styles.importingContainer}>
                <ActivityIndicator size="small" color="white" />
                <Text style={[styles.buttonText, styles.importingText]}>
                  Importing...
                </Text>
              </View>
            ) : (
              <Text style={[styles.buttonText, styles.importButtonText]}>
                Import Calendar
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}