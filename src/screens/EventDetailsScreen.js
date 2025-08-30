// src/screens/EventDetailsScreen.js
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { useTheme } from '../contexts/ThemeContext';

const EventDetailsScreen = ({ route, navigation }) => {
  const { theme, getSpacing, getTypography } = useTheme();
  const { eventId } = route.params || { eventId: 'unknown' };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.background,
      paddingHorizontal: getSpacing.md,
      paddingTop: getSpacing.lg,
    },
    header: {
      marginBottom: getSpacing.lg,
    },
    title: {
      fontSize: getTypography.h2.fontSize,
      fontWeight: getTypography.h2.fontWeight,
      color: theme.text.primary,
      marginBottom: getSpacing.sm,
    },
    subtitle: {
      fontSize: getTypography.body.fontSize,
      color: theme.text.secondary,
      marginBottom: getSpacing.lg,
    },
    eventInfo: {
      backgroundColor: theme.card,
      padding: getSpacing.md,
      borderRadius: 12,
      marginBottom: getSpacing.lg,
    },
    infoText: {
      fontSize: getTypography.body.fontSize,
      color: theme.text.primary,
      marginBottom: getSpacing.sm,
    },
    backButton: {
      backgroundColor: theme.primary,
      padding: getSpacing.md,
      borderRadius: 12,
      alignItems: 'center',
      marginTop: getSpacing.lg,
    },
    backButtonText: {
      fontSize: getTypography.button.fontSize,
      fontWeight: getTypography.button.fontWeight,
      color: theme.text.inverse,
    },
  });

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Event Details</Text>
        <Text style={styles.subtitle}>Event ID: {eventId}</Text>
      </View>

      <View style={styles.eventInfo}>
        <Text style={styles.infoText}>Sample Event Title</Text>
        <Text style={styles.infoText}>Date: Today</Text>
        <Text style={styles.infoText}>Time: 2:00 PM</Text>
        <Text style={styles.infoText}>Description: This is a sample event description that would show details about the event.</Text>
      </View>

      <TouchableOpacity 
        style={styles.backButton}
        onPress={() => navigation.goBack()}
      >
        <Text style={styles.backButtonText}>← Back</Text>
      </TouchableOpacity>
    </View>
  );
};

export default EventDetailsScreen;