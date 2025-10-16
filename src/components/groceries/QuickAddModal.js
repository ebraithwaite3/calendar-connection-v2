import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
} from 'react-native';
import { useTheme } from '../../contexts/ThemeContext';
import QuantityTracker from '../QuantityTracker';
import { DateTime } from 'luxon';

const QuickAddModal = ({ visible, item, shoppingList, restockAmount, onClose, onAddToList }) => {
  const { theme, getSpacing, getTypography, getBorderRadius } = useTheme();
  const [quantity, setQuantity] = useState(restockAmount || 1);
  const greenColor = '#10B981';

  // Reset quantity when modal opens with new item
  useEffect(() => {
    if (visible) {
      setQuantity(restockAmount || 1);
    }
  }, [visible, item, restockAmount]);

  // Is the item already in the shopping list? (Gather the whole object)
  const shoppingListEntry = useMemo(() => {
    return shoppingList?.find(listItem => listItem.id === item?.id) || null;
  }, [shoppingList, item]);
  console.log('Shopping List Entry for', item?.name, ':', shoppingListEntry);

  const handleCancel = () => {
    setQuantity(1);
    onClose();
  };

  const handleAdd = () => {
    if (shoppingListEntry) {
      // Update existing entry
      const updatedItem = {
        ...shoppingListEntry,
        quantity: (shoppingListEntry.quantity || 0) + quantity,
        restockAmount: restockAmount,
        updatedAt: DateTime.now().toISO(),
      };
      delete updatedItem.key;
      delete updatedItem.restockAmount; // Remove restockAmount if it exists
      console.log(`Updating shopping list item:`, updatedItem);
      onAddToList(updatedItem, true); // true = isUpdate
    } else {
      // Create new entry
      const newItem = {
        addedToInventory: false,
        category: item.category || 'Uncategorized',
        checked: false,
        id: item.id,
        name: item.name,
        quantity: quantity,
        updatedAt: DateTime.now().toISO(),
      };
      console.log(`Adding new shopping list item:`, newItem);
      onAddToList(newItem, false); // false = isNew
    }
    setQuantity(1);
    onClose();
  };

  if (!item) return null;

  const styles = StyleSheet.create({
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      justifyContent: 'center',
      alignItems: 'center',
    },
    modalContent: {
      backgroundColor: theme.surface,
      borderRadius: getBorderRadius.lg,
      padding: getSpacing.xl,
      width: '80%',
      maxWidth: 400,
    },
    modalTitle: {
      fontSize: getTypography.h3.fontSize,
      fontWeight: '600',
      color: theme.text.primary,
      marginBottom: getSpacing.sm,
    },
    modalSubtitle: {
      fontSize: getTypography.body.fontSize,
      color: theme.text.secondary,
    },
    quantityContainer: {
      alignItems: 'center',
      marginBottom: getSpacing.lg,
      marginTop: getSpacing.md,
    },
    quantityLabel: {
      fontSize: getTypography.body.fontSize,
      color: theme.text.secondary,
      marginBottom: getSpacing.sm,
    },
    modalButtons: {
      flexDirection: 'row',
      gap: getSpacing.md,
    },
    modalButton: {
      flex: 1,
      padding: getSpacing.md,
      borderRadius: getBorderRadius.md,
      alignItems: 'center',
    },
    cancelButton: {
      backgroundColor: theme.background,
      borderWidth: 1,
      borderColor: theme.border,
    },
    confirmButton: {
      backgroundColor: greenColor,
    },
    buttonText: {
      fontSize: getTypography.body.fontSize,
      fontWeight: '600',
    },
    cancelButtonText: {
      color: theme.text.primary,
    },
    confirmButtonText: {
      color: '#FFFFFF',
    },
  });

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={handleCancel}
    >
      <TouchableOpacity 
        style={styles.modalOverlay} 
        activeOpacity={1}
        onPress={handleCancel}
      >
        <TouchableOpacity activeOpacity={1} onPress={(e) => e.stopPropagation()}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Add to Shopping List</Text>
            <Text style={styles.modalSubtitle}>{item.name}</Text>
            <Text style={styles.modalSubtitle}>Currently Have: {item.quantity || 0}</Text>
            
            <View style={styles.quantityContainer}>
              <Text style={styles.quantityLabel}>Quantity</Text>
              <QuantityTracker
                value={quantity}
                onUpdate={setQuantity}
                min={1}
                size="large"
              />
            </View>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={handleCancel}
              >
                <Text style={[styles.buttonText, styles.cancelButtonText]}>
                  Cancel
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalButton, styles.confirmButton]}
                onPress={handleAdd}
              >
                <Text style={[styles.buttonText, styles.confirmButtonText]}>
                  Add
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
};

export default QuickAddModal;