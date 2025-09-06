import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  SafeAreaView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../contexts/ThemeContext';
import { useData } from '../contexts/DataContext';
import { DateTime } from 'luxon';

const MessagesScreen = ({ navigation }) => {
  const { theme, getSpacing, getTypography, getBorderRadius } = useTheme();
  const { messages, messagesLoading } = useData();
  const [isEditMode, setIsEditMode] = useState(false);
  const [selectedMessages, setSelectedMessages] = useState(new Set());

  // Get messages array from the messages object
  const messagesList = messages?.messages || [];
  const unreadCount = messagesList.filter(m => !m.read).length;

  const formatTimestamp = (timestamp) => {
    const messageTime = DateTime.fromISO(timestamp);
    const now = DateTime.now();
    const diff = now.diff(messageTime, 'days').days;

    if (diff < 1) {
      return messageTime.toFormat('h:mm a'); // Today: "3:45 PM"
    } else if (diff < 7) {
      return messageTime.toFormat('ccc h:mm a'); // This week: "Mon 3:45 PM"
    } else {
      return messageTime.toFormat('MMM d, h:mm a'); // Older: "Sep 5, 3:45 PM"
    }
  };

  const getMessageIcon = (content) => {
    if (content.includes('joined the group')) return 'person-add-outline';
    if (content.includes('removed from the group')) return 'person-remove-outline';
    if (content.includes('added back to the group')) return 'return-up-back-outline';
    if (content.includes('role in the group')) return 'shield-outline';
    if (content.includes('calendar(s) have been added')) return 'calendar-outline';
    if (content.includes('calendar(s) have been removed')) return 'calendar-clear-outline';
    if (content.includes('group') && content.includes('deleted')) return 'trash-outline';
    return 'mail-outline';
  };

  const getMessageColor = (content) => {
    if (content.includes('removed from') || content.includes('deleted')) return theme.error;
    if (content.includes('added') || content.includes('joined')) return theme.success;
    if (content.includes('role')) return theme.warning;
    return theme.primary;
  };

  const toggleMessageSelection = (messageId) => {
    const newSelected = new Set(selectedMessages);
    if (newSelected.has(messageId)) {
      newSelected.delete(messageId);
    } else {
      newSelected.add(messageId);
    }
    setSelectedMessages(newSelected);
  };

  const handleMarkAsRead = (messageId) => {
    console.log('Mark message as read:', messageId);
    // TODO: Implement markMessageAsRead hook
  };

  const handleMarkAllAsRead = () => {
    console.log('Mark all messages as read');
    // TODO: Implement markAllMessagesAsRead hook
  };

  const handleDeleteMessage = (messageId) => {
    Alert.alert(
      'Delete Message',
      'Are you sure you want to delete this message?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            console.log('Delete message:', messageId);
            // TODO: Implement deleteMessage hook
          },
        },
      ]
    );
  };

  const handleDeleteSelected = () => {
    Alert.alert(
      'Delete Messages',
      `Are you sure you want to delete ${selectedMessages.size} message(s)?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            console.log('Delete selected messages:', Array.from(selectedMessages));
            setSelectedMessages(new Set());
            setIsEditMode(false);
            // TODO: Implement deleteMessages hook
          },
        },
      ]
    );
  };

  const handleDeleteAll = () => {
    Alert.alert(
      'Delete All Messages',
      'Are you sure you want to delete ALL messages? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete All',
          style: 'destructive',
          onPress: () => {
            console.log('Delete all messages');
            setSelectedMessages(new Set());
            setIsEditMode(false);
            // TODO: Implement deleteAllMessages hook
          },
        },
      ]
    );
  };

  const handleSelectAll = () => {
    const allMessageIds = new Set(messagesList.map(m => m.messageId));
    setSelectedMessages(allMessageIds);
  };

  const handleDeselectAll = () => {
    setSelectedMessages(new Set());
  };

  const renderMessage = ({ item }) => {
    const isSelected = selectedMessages.has(item.messageId);
    const messageColor = getMessageColor(item.content);
    const iconName = getMessageIcon(item.content);

    return (
      <TouchableOpacity
        style={[
          styles.messageCard,
          !item.read && styles.unreadMessage,
          isSelected && styles.selectedMessage,
        ]}
        onPress={() => {
          if (isEditMode) {
            toggleMessageSelection(item.messageId);
          } else if (!item.read) {
            handleMarkAsRead(item.messageId);
          }
        }}
        onLongPress={() => {
          if (!isEditMode) {
            setIsEditMode(true);
            toggleMessageSelection(item.messageId);
          }
        }}
      >
        <View style={styles.messageHeader}>
          <View style={styles.messageLeft}>
            <View style={[styles.iconContainer, { backgroundColor: messageColor + '20' }]}>
              <Ionicons name={iconName} size={16} color={messageColor} />
            </View>
            <View style={styles.messageInfo}>
              <Text style={styles.senderName}>{item.senderName}</Text>
              <Text style={styles.timestamp}>{formatTimestamp(item.timestamp)}</Text>
            </View>
          </View>
          <View style={styles.messageRight}>
            {!item.read && <View style={styles.unreadDot} />}
            {isEditMode && (
              <View style={[styles.checkbox, isSelected && styles.checkboxSelected]}>
                {isSelected && <Ionicons name="checkmark" size={14} color="white" />}
              </View>
            )}
            {!isEditMode && (
              <TouchableOpacity
                style={styles.deleteButton}
                onPress={() => handleDeleteMessage(item.messageId)}
              >
                <Ionicons name="trash-outline" size={16} color={theme.text.tertiary} />
              </TouchableOpacity>
            )}
          </View>
        </View>
        <Text style={[styles.messageContent, !item.read && styles.unreadText]}>
          {item.content}
        </Text>
      </TouchableOpacity>
    );
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
    },
    backButton: {
      marginRight: getSpacing.md,
      padding: getSpacing.sm,
    },
    headerTitle: {
      fontSize: getTypography.h3.fontSize,
      fontWeight: getTypography.h3.fontWeight,
      color: theme.text.primary,
    },
    unreadBadge: {
      backgroundColor: theme.error,
      borderRadius: 10,
      paddingHorizontal: 6,
      paddingVertical: 2,
      marginLeft: getSpacing.sm,
    },
    unreadBadgeText: {
      color: 'white',
      fontSize: 12,
      fontWeight: 'bold',
    },
    headerActions: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: getSpacing.sm,
    },
    actionButton: {
      padding: getSpacing.sm,
      borderRadius: getBorderRadius.sm,
    },
    editModeActions: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: getSpacing.lg,
      paddingVertical: getSpacing.md,
      backgroundColor: theme.primary + '10',
      borderBottomWidth: 1,
      borderBottomColor: theme.border,
    },
    editModeLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: getSpacing.md,
    },
    editModeText: {
      fontSize: getTypography.body.fontSize,
      color: theme.text.primary,
      fontWeight: '600',
    },
    selectButton: {
      padding: getSpacing.xs,
    },
    selectButtonText: {
      fontSize: getTypography.bodySmall.fontSize,
      color: theme.primary,
      fontWeight: '600',
    },
    editModeRight: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: getSpacing.sm,
    },
    listContainer: {
      flex: 1,
    },
    messageCard: {
      backgroundColor: theme.surface,
      marginHorizontal: getSpacing.md,
      marginVertical: getSpacing.xs,
      padding: getSpacing.md,
      borderRadius: getBorderRadius.md,
      borderWidth: 1,
      borderColor: theme.border,
    },
    unreadMessage: {
      backgroundColor: theme.primary + '05',
      borderColor: theme.primary + '30',
    },
    selectedMessage: {
      backgroundColor: theme.primary + '15',
      borderColor: theme.primary,
    },
    messageHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: getSpacing.sm,
    },
    messageLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      flex: 1,
    },
    iconContainer: {
      width: 32,
      height: 32,
      borderRadius: 16,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: getSpacing.sm,
    },
    messageInfo: {
      flex: 1,
    },
    senderName: {
      fontSize: getTypography.body.fontSize,
      fontWeight: '600',
      color: theme.text.primary,
    },
    timestamp: {
      fontSize: getTypography.caption.fontSize,
      color: theme.text.secondary,
      marginTop: 2,
    },
    messageRight: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: getSpacing.sm,
    },
    unreadDot: {
      width: 8,
      height: 8,
      borderRadius: 4,
      backgroundColor: theme.primary,
    },
    deleteButton: {
      padding: getSpacing.xs,
    },
    checkbox: {
      width: 20,
      height: 20,
      borderWidth: 2,
      borderRadius: getBorderRadius.xs,
      borderColor: theme.border,
      alignItems: 'center',
      justifyContent: 'center',
    },
    checkboxSelected: {
      backgroundColor: theme.primary,
      borderColor: theme.primary,
    },
    messageContent: {
      fontSize: getTypography.body.fontSize,
      color: theme.text.secondary,
      lineHeight: 20,
    },
    unreadText: {
      color: theme.text.primary,
      fontWeight: '500',
    },
    emptyContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: getSpacing.xl,
    },
    emptyText: {
      fontSize: getTypography.body.fontSize,
      color: theme.text.secondary,
      textAlign: 'center',
      marginTop: getSpacing.md,
    },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
  });

  if (messagesLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.primary} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation?.goBack()}>
            <Ionicons name="arrow-back" size={24} color={theme.text.primary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Messages</Text>
          {unreadCount > 0 && (
            <View style={styles.unreadBadge}>
              <Text style={styles.unreadBadgeText}>{unreadCount}</Text>
            </View>
          )}
        </View>
        <View style={styles.headerActions}>
          {!isEditMode && unreadCount > 0 && (
            <TouchableOpacity style={styles.actionButton} onPress={handleMarkAllAsRead}>
              <Ionicons name="checkmark-done-outline" size={20} color={theme.primary} />
            </TouchableOpacity>
          )}
          {!isEditMode && messagesList.length > 0 && (
            <TouchableOpacity 
              style={styles.actionButton} 
              onPress={() => setIsEditMode(true)}
            >
              <Ionicons name="create-outline" size={20} color={theme.text.secondary} />
            </TouchableOpacity>
          )}
          {isEditMode && (
            <TouchableOpacity 
              style={styles.actionButton} 
              onPress={() => {
                setIsEditMode(false);
                setSelectedMessages(new Set());
              }}
            >
              <Ionicons name="close" size={20} color={theme.text.secondary} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Edit Mode Actions */}
      {isEditMode && (
        <View style={styles.editModeActions}>
          <View style={styles.editModeLeft}>
            <Text style={styles.editModeText}>
              {selectedMessages.size} selected
            </Text>
            <TouchableOpacity 
              style={styles.selectButton}
              onPress={selectedMessages.size === messagesList.length ? handleDeselectAll : handleSelectAll}
            >
              <Text style={styles.selectButtonText}>
                {selectedMessages.size === messagesList.length ? 'Deselect All' : 'Select All'}
              </Text>
            </TouchableOpacity>
          </View>
          <View style={styles.editModeRight}>
            {selectedMessages.size > 0 && (
              <TouchableOpacity style={styles.actionButton} onPress={handleDeleteSelected}>
                <Ionicons name="trash-outline" size={20} color={theme.error} />
              </TouchableOpacity>
            )}
          </View>
        </View>
      )}

      {/* Messages List */}
      <View style={styles.listContainer}>
        {messagesList.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="mail-outline" size={64} color={theme.text.tertiary} />
            <Text style={styles.emptyText}>
              No messages yet.{'\n'}You'll receive notifications about group activity here.
            </Text>
          </View>
        ) : (
          <FlatList
            data={messagesList.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))}
            renderItem={renderMessage}
            keyExtractor={(item) => item.messageId}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingVertical: getSpacing.sm }}
          />
        )}
      </View>
    </SafeAreaView>
  );
};

export default MessagesScreen;