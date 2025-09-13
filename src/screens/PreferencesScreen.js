import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, Switch } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../contexts/ThemeContext";
import { useData } from "../contexts/DataContext";
import { useAuth } from "../contexts/AuthContext";
import { updateUserDoc } from "../services/firestoreService";

const PreferencesScreen = () => {
  const { theme, getSpacing, getTypography } = useTheme();
  const { db } = useAuth();
  const { preferences, user } = useData();
  const [updatedPreferences, setUpdatedPreferences] = useState(preferences);
  const [hasChanges, setHasChanges] = useState(false);
  const [notificationDetailsOpen, setNotificationDetailsOpen] = useState(false);

  console.log("DB In preferencesScreen:", db, "User:", user ? user.email || user.username : 'No user', "Preferences:", preferences);

  // This useEffect synchronizes the local state with Firestore data
  useEffect(() => {
    setUpdatedPreferences(preferences);
  }, [preferences]);

  // Effect to check if preferences have been modified
  useEffect(() => {
    const changesMade = JSON.stringify(preferences) !== JSON.stringify(updatedPreferences);
    setHasChanges(changesMade);
  }, [preferences, updatedPreferences]);

  const defaultLoadingPageOptions = [
    { label: "Today", value: "Today" },
    { label: "Calendar", value: "Calendar" },
  ];

  // Handler for radio button selection
  const handleRadioChange = (key, value) => {
    setUpdatedPreferences((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  // Handler for main notifications toggle
  const handleNotificationsToggle = (value) => {
    setUpdatedPreferences((prev) => {
      const newPrefs = {
        ...prev,
        notifications: value,
      };

      if (!value) {
        // If turning notifications off, disable all specific notifications
        newPrefs.notifyFor = {
          ...prev.notifyFor,
          groupActivity: false,
          newAssignments: false,
          updatedAssignments: false,
        };
        setNotificationDetailsOpen(false);
      } else {
        // If turning notifications on, restore to original values from Firestore
        // If original was off, default all to true
        if (preferences.notifications) {
          // Original was on, restore original specific settings
          newPrefs.notifyFor = {
            ...prev.notifyFor,
            groupActivity: preferences.notifyFor?.groupActivity || false,
            newAssignments: preferences.notifyFor?.newAssignments || false,
            updatedAssignments: preferences.notifyFor?.updatedAssignments || false,
          };
        } else {
          // Original was off, default all to true
          newPrefs.notifyFor = {
            ...prev.notifyFor,
            groupActivity: true,
            newAssignments: true,
            updatedAssignments: true,
          };
        }
      }

      return newPrefs;
    });
  };

  // Handler for specific notification toggles
  const handleSpecificNotificationToggle = (key, value) => {
    setUpdatedPreferences((prev) => ({
      ...prev,
      notifyFor: {
        ...prev.notifyFor,
        [key]: value,
      },
    }));
  };

  // Handler for the "Save" button
  const handleSave = async () => {
    if (!db || !user || !hasChanges) {
      console.warn("Cannot save: Database not initialized, no user, or no changes.", db, user, hasChanges);
      return;
    }
    console.log("Saving preferences:", updatedPreferences, "With db and user:", db, user.userId);

    try {
      await updateUserDoc(db, user.userId, { preferences: updatedPreferences });
      console.log("User preferences updated successfully!");
    } catch (error) {
      console.error("Failed to save preferences:", error);
    }
  };

  // Handler for the "Cancel" button
  const handleCancel = () => {
    setUpdatedPreferences(preferences);
    setNotificationDetailsOpen(false);
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.background,
      alignItems: "center",
      padding: getSpacing.md,
      paddingTop: getSpacing.xl,
    },
    title: {
      ...getTypography.h2,
      color: theme.text.primary,
      marginBottom: getSpacing.lg,
    },
    settingContainer: {
      width: "100%",
      paddingHorizontal: getSpacing.md,
      marginBottom: getSpacing.xl,
    },
    settingTitle: {
      ...getTypography.h3,
      color: theme.text.primary,
      marginBottom: getSpacing.sm,
      fontWeight: "bold",
    },
    optionsContainer: {
      flexDirection: "row",
      justifyContent: "flex-start",
      alignItems: "center",
    },
    radioOption: {
      flexDirection: "row",
      alignItems: "center",
      marginRight: getSpacing.lg,
      paddingVertical: getSpacing.sm,
    },
    radioCircle: {
      height: 20,
      width: 20,
      borderRadius: 10,
      borderWidth: 2,
      borderColor: theme.border,
      alignItems: "center",
      justifyContent: "center",
      marginRight: getSpacing.sm,
    },
    selectedRadioCircle: {
      borderColor: theme.primary,
    },
    radioInnerCircle: {
      height: 10,
      width: 10,
      borderRadius: 5,
      backgroundColor: theme.primary,
    },
    radioLabel: {
      ...getTypography.body,
      color: theme.text.primary,
    },
    notificationMainRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      width: "100%",
    },
    notificationDetailsButton: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      width: "100%",
      paddingVertical: getSpacing.sm,
      marginTop: getSpacing.sm,
    },
    notificationDetailsText: {
      ...getTypography.body,
      color: theme.text.secondary,
    },
    notificationDetailsList: {
      marginTop: getSpacing.md,
      paddingLeft: getSpacing.md,
      borderLeftWidth: 2,
      borderLeftColor: theme.border,
    },
    notificationDetailItem: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      paddingVertical: getSpacing.sm,
    },
    notificationDetailLabel: {
      ...getTypography.body,
      color: theme.text.primary,
    },
    buttonContainer: {
      flexDirection: "row",
      width: "100%",
      justifyContent: "space-around",
      marginTop: getSpacing.xxl,
    },
    button: {
      paddingVertical: getSpacing.md,
      paddingHorizontal: getSpacing.xl,
      borderRadius: 25,
      alignItems: "center",
      justifyContent: "center",
    },
    saveButton: {
      backgroundColor: theme.button.primary,
      opacity: hasChanges ? 1 : 0.5,
    },
    cancelButton: {
      borderWidth: 1,
      borderColor: theme.border,
      backgroundColor: theme.background,
    },
    buttonText: {
      ...getTypography.button,
      color: theme.text.inverse,
    },
    cancelButtonText: {
      ...getTypography.button,
      color: theme.text.primary,
    },
  });

  // Reusable RadioButton component
  const RadioButton = ({ label, value, selectedValue, onSelect }) => (
    <TouchableOpacity
      style={styles.radioOption}
      onPress={() => onSelect(value)}
      accessible={true}
      accessibilityLabel={label}
      accessibilityState={{ selected: value === selectedValue }}
    >
      <View
        style={[
          styles.radioCircle,
          value === selectedValue && styles.selectedRadioCircle,
        ]}
      >
        {value === selectedValue && <View style={styles.radioInnerCircle} />}
      </View>
      <Text style={styles.radioLabel}>{label}</Text>
    </TouchableOpacity>
  );

  const notificationDetails = [
    { key: 'groupActivity', label: 'Group Activity' },
    { key: 'newAssignments', label: 'New Assignments' },
    { key: 'updatedAssignments', label: 'Updated Assignments' },
  ];

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Preferences</Text>

      {/* Default Loading Page Setting */}
      <View style={styles.settingContainer}>
        <Text style={styles.settingTitle}>Default Loading Page</Text>
        <View style={styles.optionsContainer}>
          {defaultLoadingPageOptions.map((option) => (
            <RadioButton
              key={option.value}
              label={option.label}
              value={option.value}
              selectedValue={updatedPreferences.defaultLoadingPage}
              onSelect={(val) => handleRadioChange("defaultLoadingPage", val)}
            />
          ))}
        </View>
      </View>

      {/* Notifications Setting */}
      <View style={styles.settingContainer}>
        <View style={styles.notificationMainRow}>
          <Text style={styles.settingTitle}>Notifications</Text>
          <Switch
            onValueChange={handleNotificationsToggle}
            value={updatedPreferences.notifications}
            trackColor={{ false: theme.border, true: theme.primary }}
            thumbColor={
              updatedPreferences.notifications ? theme.text.inverse : theme.border
            }
          />
        </View>

        {/* Notification Details Toggle */}
        {updatedPreferences.notifications && (
          <TouchableOpacity
            style={styles.notificationDetailsButton}
            onPress={() => setNotificationDetailsOpen(!notificationDetailsOpen)}
          >
            <Text style={styles.notificationDetailsText}>
              Edit Specific Notifications
            </Text>
            <Ionicons
              name={notificationDetailsOpen ? "chevron-up" : "chevron-down"}
              size={20}
              color={theme.text.secondary}
            />
          </TouchableOpacity>
        )}

        {/* Expanded Notification Details */}
        {updatedPreferences.notifications && notificationDetailsOpen && (
          <View style={styles.notificationDetailsList}>
            {notificationDetails.map((item) => (
              <View key={item.key} style={styles.notificationDetailItem}>
                <Text style={styles.notificationDetailLabel}>{item.label}</Text>
                <Switch
                  onValueChange={(value) => handleSpecificNotificationToggle(item.key, value)}
                  value={updatedPreferences.notifyFor?.[item.key] || false}
                  trackColor={{ false: theme.border, true: theme.primary }}
                  thumbColor={
                    updatedPreferences.notifyFor?.[item.key] ? theme.text.inverse : theme.border
                  }
                />
              </View>
            ))}
          </View>
        )}
      </View>

      {/* Action Buttons, if there are changes */}
      {hasChanges && (
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={[styles.button, styles.cancelButton]}
            onPress={handleCancel}
            disabled={!hasChanges}
          >
            <Text style={[styles.buttonText, styles.cancelButtonText]}>
              Cancel
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.button, styles.saveButton]}
            onPress={handleSave}
            disabled={!hasChanges}
          >
            <Text style={styles.buttonText}>Save</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

export default PreferencesScreen;