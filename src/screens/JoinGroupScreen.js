import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Alert,
  ActivityIndicator,
  SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../contexts/ThemeContext';
import { useGroupActions } from '../hooks';

const JoinGroupScreen = ({ navigation }) => {
  const { theme, getSpacing, getTypography, getBorderRadius } = useTheme();
  const { joinGroup } = useGroupActions();

  const [groupName, setGroupName] = useState('');
  const [groupCode, setGroupCode] = useState('');
  const [isJoining, setIsJoining] = useState(false);

  const handleJoinGroup = async () => {
    if (!groupCode.trim()) {
      Alert.alert('Error', 'Please enter a valid group code.');
      return;
    }

    setIsJoining(true);

    try {
      console.log('Attempting to join group with ID:', groupName, 'and Code:', groupCode);
      await joinGroup(groupName.trim(), groupCode.trim());

      // Show success alert and navigate back
      Alert.alert(
        'Success',
        'Successfully joined the group!',
        [
          {
            text: 'OK',
            onPress: () => navigation.goBack()
          }
        ]
      );

      // Clear form
      setGroupName('');
      setGroupCode('');

    } catch (err) {
      console.error('Error joining group:', err);
      
      // Show error alert but stay on page
      Alert.alert(
        'Error',
        err.message || 'Failed to join group. Please try again.'
      );
    } finally {
      setIsJoining(false);
    }
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.background,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: getSpacing.lg,
      paddingVertical: getSpacing.md,
      borderBottomWidth: 1,
      borderBottomColor: theme.border,
      backgroundColor: theme.surface,
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
    headerRight: {
      width: 40, // Balance the header
    },
    title: {
      fontSize: getTypography.h3.fontSize,
      fontWeight: getTypography.h3.fontWeight,
      color: theme.text.primary,
    },
    content: {
      flex: 1,
    },
    description: {
      marginBottom: getSpacing.lg,
    },
    subtitle: {
      fontSize: getTypography.body.fontSize,
      color: theme.text.secondary,
      marginBottom: getSpacing.lg,
    },
    form: {
      marginBottom: getSpacing.lg,
    },
    label: {
      fontSize: getTypography.body.fontSize,
      fontWeight: '600',
      color: theme.text.primary,
      marginBottom: getSpacing.sm,
    },
    input: {
      backgroundColor: theme.surface,
      borderWidth: 1,
      borderColor: theme.border,
      borderRadius: getBorderRadius.md,
      paddingHorizontal: getSpacing.md,
      paddingVertical: getSpacing.md,
      fontSize: getTypography.body.fontSize,
      color: theme.text.primary,
      marginBottom: getSpacing.lg,
    },
    button: {
      backgroundColor: isJoining ? theme.text.tertiary : theme.primary,
      padding: getSpacing.md,
      borderRadius: getBorderRadius.md,
      alignItems: 'center',
      flexDirection: 'row',
      justifyContent: 'center',
    },
    buttonText: {
      fontSize: getTypography.button.fontSize,
      fontWeight: getTypography.button.fontWeight,
      color: theme.text.inverse,
      marginLeft: isJoining ? getSpacing.sm : 0,
    },
  });

  return (
    <SafeAreaView style={styles.container}>
      {/* Header with back button */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
            disabled={isJoining}
          >
            <Ionicons 
              name="arrow-back" 
              size={24} 
              color={isJoining ? theme.text.tertiary : theme.text.primary} 
            />
          </TouchableOpacity>
          <Text style={styles.title}>Join a Group</Text>
        </View>
        <View style={styles.headerRight} />
      </View>
      
      <ScrollView style={styles.content} contentContainerStyle={{ flexGrow: 1, padding: getSpacing.lg }}>
        <View style={styles.description}>
          <Text style={styles.subtitle}>Enter the group code to join an existing group.</Text>
        </View>
      
      <View style={styles.form}>
        <Text style={styles.label}>Group Name</Text>
        <TextInput
          style={styles.input}
          placeholder="Enter group name"
          placeholderTextColor={theme.text.secondary}
          value={groupName}
          onChangeText={setGroupName}
          autoCapitalize="none"
          autoCorrect={false}
          editable={!isJoining}
        />
      </View>

      <View style={styles.form}>
        <Text style={styles.label}>Group Code</Text>
        <TextInput
          style={styles.input}
          placeholder="Enter group code"
          placeholderTextColor={theme.text.secondary}
          value={groupCode}
          onChangeText={setGroupCode}
          autoCapitalize="none"
          autoCorrect={false}
          editable={!isJoining}
        />
        </View>
        <TouchableOpacity 
          style={styles.button} 
          onPress={handleJoinGroup} 
          disabled={isJoining}
        >
          {isJoining && <ActivityIndicator size="small" color="white" />}
          <Text style={styles.buttonText}>
            {isJoining ? 'Joining...' : 'Join Group'}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

export default JoinGroupScreen;