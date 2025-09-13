import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  TouchableWithoutFeedback,
  Animated,
} from 'react-native';
import { useTheme } from '../contexts/ThemeContext';
import { useNavigation } from '@react-navigation/native';

const SlideOutMenu = ({ 
  isVisible, 
  onClose, 
  onLogout, 
  isDarkMode, 
  toggleTheme 
}) => {
  const { theme, getSpacing, getTypography, getBorderRadius } = useTheme();
  const navigation = useNavigation();

  const styles = StyleSheet.create({
    overlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      justifyContent: 'flex-end',
      alignItems: 'flex-end',
    },
    menu: {
      backgroundColor: theme.surface,
      width: 250,
      height: '100%',
      paddingTop: 60,
      paddingHorizontal: getSpacing.lg,
      borderLeftWidth: 1,
      borderLeftColor: theme.border,
    },
    menuItem: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: getSpacing.md,
      borderBottomWidth: 1,
      borderBottomColor: theme.divider,
    },
    menuItemText: {
      fontSize: getTypography.body.fontSize,
      color: theme.text.primary,
      marginLeft: getSpacing.sm,
    },
    menuItemIcon: {
      width: 20,
      fontSize: 16,
      color: theme.text.secondary,
    },
    logoutItem: {
      borderBottomColor: theme.error,
    },
    logoutText: {
      color: theme.error,
    },
    closeButton: {
      alignItems: 'flex-end',
      marginBottom: getSpacing.lg,
    },
    closeText: {
      fontSize: 24,
      color: theme.text.primary,
    },
  });

  const handleLogout = () => {
    onClose();
    onLogout();
  };

  const handleMessagesNavigation = () => {
    onClose();
    navigation.navigate('Messages');
  };

  const handlePreferencesNavigation = () => {
    onClose();
    navigation.navigate('Preferences');
  }

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={isVisible}
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.overlay}>
          <TouchableWithoutFeedback onPress={() => {}}>
            <View style={styles.menu}>
              {/* Close Button */}
              <TouchableOpacity style={styles.closeButton} onPress={onClose}>
                <Text style={styles.closeText}>×</Text>
              </TouchableOpacity>

              {/* Messages */}
              <TouchableOpacity style={styles.menuItem} onPress={handleMessagesNavigation}>
                <Text style={styles.menuItemIcon}>💬</Text>
                <Text style={styles.menuItemText}>Messages</Text>
              </TouchableOpacity>

              {/* Theme Toggle */}
              <TouchableOpacity style={styles.menuItem} onPress={toggleTheme}>
                <Text style={styles.menuItemIcon}>
                  {isDarkMode ? '☀️' : '🌙'}
                </Text>
                <Text style={styles.menuItemText}>
                  {isDarkMode ? 'Light Mode' : 'Dark Mode'}
                </Text>
              </TouchableOpacity>

              {/* Settings */}
              <TouchableOpacity style={styles.menuItem} onPress={() => {
                handlePreferencesNavigation();
              }}>
                <Text style={styles.menuItemIcon}>⚙️</Text>
                <Text style={styles.menuItemText}>Preferences</Text>
              </TouchableOpacity>

              {/* Logout */}
              <TouchableOpacity 
                style={[styles.menuItem, styles.logoutItem]} 
                onPress={handleLogout}
              >
                <Text style={styles.menuItemIcon}>🚪</Text>
                <Text style={[styles.menuItemText, styles.logoutText]}>Logout</Text>
              </TouchableOpacity>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

export default SlideOutMenu;