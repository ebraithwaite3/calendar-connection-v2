import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, Switch } from "react-native";
import { useTheme } from "../contexts/ThemeContext";
import { useData } from "../contexts/DataContext";
import { useAuth } from "../contexts/AuthContext";
import { updateUserDoc } from "../services/firestoreService";

const PreferencesScreen = () => {
  const { theme, getSpacing, getTypography } = useTheme();
    const { db } = useAuth(); // Assumed db is available from useAuth
  const { preferences, user } = useData(); // Assumed db and user are available from useData
  const [updatedPreferences, setUpdatedPreferences] = useState(preferences);
  const [hasChanges, setHasChanges] = useState(false);
  console.log("DB In preferencesScreen:", db, "User:", user ? user.email || user.username : 'No user', "Preferences:", preferences);

    // This useEffect synchronizes the local state with Firestore data
    useEffect(() => {
        setUpdatedPreferences(preferences);
      }, [preferences]);

  // Effect to check if preferences have been modified
  useEffect(() => {
    // We use JSON.stringify for a deep comparison of the two objects
    const changesMade =
      JSON.stringify(preferences) !== JSON.stringify(updatedPreferences);
    setHasChanges(changesMade);
  }, [preferences, updatedPreferences]);

  const defaultLoadingPageOptions = [
    { label: "Today", value: "Today" },
    { label: "Calendar", value: "Calendar" },
  ];

  const defaultCalendarViewOptions = [
    { label: "Month", value: "month" },
    { label: "Week", value: "week" },
  ];

  // Handler for radio button selection
  const handleRadioChange = (key, value) => {
    setUpdatedPreferences((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  // Handler for toggle switch
  const handleToggleChange = (value) => {
    setUpdatedPreferences((prev) => ({
      ...prev,
      notifications: value,
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
      // Pass a single object with the key 'preferences' to update the nested map
      await updateUserDoc(db, user.userId, { preferences: updatedPreferences });
      console.log("User preferences updated successfully!");
      // The DataContext will automatically update from the Firestore listener,
      // which will then reset the local state and disable the buttons.
      // So no need to call setHasChanges(false) or setUpdatedPreferences(preferences) here.
    } catch (error) {
      console.error("Failed to save preferences:", error);
      // Optional: Show an error message to the user
    }
  };

  // Handler for the "Cancel" button
  const handleCancel = () => {
    setUpdatedPreferences(preferences);
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

      {/* Default Calendar View Setting */}
      <View style={styles.settingContainer}>
        <Text style={styles.settingTitle}>Default Calendar View</Text>
        <View style={styles.optionsContainer}>
          {defaultCalendarViewOptions.map((option) => (
            <RadioButton
              key={option.value}
              label={option.label}
              value={option.value}
              selectedValue={updatedPreferences.defaultCalendarView}
              onSelect={(val) => handleRadioChange("defaultCalendarView", val)}
            />
          ))}
        </View>
      </View>

      {/* Notifications Setting */}
      <View
        style={[
          styles.settingContainer,
          styles.optionsContainer,
          { justifyContent: "space-between" },
        ]}
      >
        <Text style={styles.settingTitle}>Notifications</Text>
        <Switch
          onValueChange={handleToggleChange}
          value={updatedPreferences.notifications}
          trackColor={{ false: theme.border, true: theme.primary }}
          thumbColor={
            updatedPreferences.notifications ? theme.text.inverse : theme.border
          }
        />
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