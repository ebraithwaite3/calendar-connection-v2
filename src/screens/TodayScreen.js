// src/screens/TodayScreen.js
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { useTheme } from '../contexts/ThemeContext';
import { useData } from '../contexts/DataContext';

const TodayScreen = ({ navigation }) => {
  const { theme, getSpacing, getTypography } = useTheme();
  const { user } = useData();

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.background,
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: getSpacing.md,
    },
    greeting: {
      fontSize: getTypography.h2.fontSize,
      fontWeight: getTypography.h2.fontWeight,
      color: theme.text.primary,
      marginBottom: getSpacing.md,
      textAlign: 'center',
    },
    subtitle: {
      fontSize: getTypography.body.fontSize,
      color: theme.text.secondary,
      textAlign: 'center',
      marginBottom: getSpacing.xl,
    },
    buttonContainer: {
      width: '100%',
      gap: getSpacing.md,
    },
    button: {
      backgroundColor: theme.primary,
      padding: getSpacing.md,
      borderRadius: 12,
      alignItems: 'center',
    },
    secondaryButton: {
      backgroundColor: theme.surface || theme.card,
      borderWidth: 1,
      borderColor: theme.border,
    },
    buttonText: {
      fontSize: getTypography.button.fontSize,
      fontWeight: getTypography.button.fontWeight,
      color: theme.text.inverse,
    },
    secondaryButtonText: {
      color: theme.text.primary,
    },
  });

  const getGreeting = () => {
    const hour = new Date().getHours();
    const firstName = user?.username?.split(' ')[0] || 'there';
    
    if (hour < 12) return `Good morning, ${firstName}!`;
    if (hour < 17) return `Good afternoon, ${firstName}!`;
    return `Good evening, ${firstName}!`;
  };

  return (
    <View style={styles.container}>
      <Text style={styles.greeting}>{getGreeting()}</Text>
      <Text style={styles.subtitle}>Today's schedule coming soon...</Text>
      
      <View style={styles.buttonContainer}>
        <TouchableOpacity 
          style={styles.button}
          onPress={() => navigation.navigate('CreateEvent')}
        >
          <Text style={styles.buttonText}>+ Create Event</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.button, styles.secondaryButton]}
          onPress={() => navigation.navigate('EventDetails', { eventId: '123' })}
        >
          <Text style={[styles.buttonText, styles.secondaryButtonText]}>View Sample Event</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default TodayScreen;