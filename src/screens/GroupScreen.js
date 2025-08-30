// src/screens/GroupScreen.js
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { useTheme } from '../contexts/ThemeContext';

const GroupScreen = ({ navigation }) => {
  const { theme, getSpacing, getTypography } = useTheme();

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.background,
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: getSpacing.md,
    },
    title: {
      fontSize: getTypography.h2.fontSize,
      fontWeight: getTypography.h2.fontWeight,
      color: theme.text.primary,
      marginBottom: getSpacing.md,
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

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Groups</Text>
      <Text style={styles.subtitle}>Group calendar sharing coming soon...</Text>
      
      <View style={styles.buttonContainer}>
        <TouchableOpacity 
          style={styles.button}
          onPress={() => navigation.navigate('GroupDetails', { groupId: 'family' })}
        >
          <Text style={styles.buttonText}>View Sample Group</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default GroupScreen;