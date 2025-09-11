import React, { useState, useEffect, useMemo, useCallback, useRef, memo } from 'react';
import { View, Text, TouchableOpacity, Alert, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../contexts/ThemeContext';
import { useData } from '../../contexts/DataContext';

const ListForm = ({ taskData, setTaskData, setErrors }) => {
  const { theme, getSpacing, getTypography } = useTheme();
  const { user } = useData();

  // Convenience access to the checklist items from parent state
  const items = useMemo(() => taskData.checklistData?.items || [], [taskData.checklistData]);
  
  const inputRefs = useRef({});

  // Use useCallback to memoize the update function
  const updateItem = useCallback((id, text) => {
    setTaskData(prev => {
      const currentItems = prev.checklistData?.items || [];
      const newItems = currentItems.map(item =>
        item.id === id ? { ...item, text } : item
      );
      return {
        ...prev,
        checklistData: { ...prev.checklistData, items: newItems }
      };
    });
  }, [setTaskData]);
  
  const addItem = useCallback(() => {
    const newId = String(Date.now());
    const newItem = {
      id: newId,
      text: '',
      completed: false,
      createdBy: user?.userId,
      createdAt: new Date().toISOString()
    };
    
    setTaskData(prev => {
      const currentItems = prev.checklistData?.items || [];
      return {
        ...prev,
        checklistData: { ...prev.checklistData, items: [...currentItems, newItem] }
      };
    });
    
    // We will rely on the parent's KeyboardAvoidingView for scrolling
    // The previous scroll logic was complex and prone to issues.
    // The KeyboardAvoidingView with the correct offset handles this.
    setTimeout(() => {
      inputRefs.current[newId]?.focus();
    }, 100);
  }, [setTaskData, user]);

  const removeItem = useCallback((id) => {
    // If only one item remains, just clear its text instead of removing it
    if (items.length <= 1) {
      updateItem(id, '');
      return;
    }
    setTaskData(prev => {
      const currentItems = prev.checklistData?.items || [];
      const newItems = currentItems.filter(item => item.id !== id);
      return {
        ...prev,
        checklistData: { ...prev.checklistData, items: newItems }
      };
    });
  }, [items, setTaskData, updateItem]);
  
  const handleBlur = useCallback((id) => {
    const item = items.find(i => i.id === id);
    if (item && !item.text.trim() && items.length > 1) {
      removeItem(id);
    }
  }, [items, removeItem]);
  
  // Set initial state for checklist if it doesn't exist
  useEffect(() => {
    setTaskData(prev => {
      const initialItems = (prev.checklistData?.items && prev.checklistData.items.length > 0)
        ? prev.checklistData.items
        : [{
            id: String(Date.now()),
            text: '',
            completed: false,
            createdBy: user?.userId,
            createdAt: new Date().toISOString()
          }];
          
      return {
        ...prev,
        checklistData: { ...prev.checklistData, items: initialItems }
      };
    });
  }, [setTaskData, user]);
  
  // Validation for list items
  useEffect(() => {
    const errors = [];
    const hasValidItem = items.some(item => item.text.trim() !== '');

    if (items.length === 0 || !hasValidItem) {
      errors.push('Checklist must have at least one item.');
    }

    setErrors(errors);
  }, [items, setErrors]);

  return (
    <View style={{ marginBottom: getSpacing.lg }}>
      <Text style={{ 
        fontSize: getTypography.h4.fontSize,
        fontWeight: getTypography.h4.fontWeight,
        color: theme.text.primary,
        marginBottom: getSpacing.md,
      }}>
        Checklist Items
      </Text>
      
      <View style={{ 
        backgroundColor: theme.surface,
        borderRadius: 8,
        padding: getSpacing.md,
      }}>
        {items.map((item, index) => (
          <View 
            key={item.id}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              marginBottom: index === items.length - 1 ? 0 : getSpacing.sm,
            }}
          >
            <Text style={{
              fontSize: getTypography.body.fontSize,
              color: theme.text.secondary,
              width: 30,
            }}>
              {index + 1}.
            </Text>
            
            <TextInput
              ref={ref => inputRefs.current[item.id] = ref}
              style={{
                flex: 1,
                backgroundColor: theme.background,
                borderWidth: 1,
                borderColor: theme.border,
                borderRadius: 6,
                padding: getSpacing.sm,
                fontSize: getTypography.body.fontSize,
                color: theme.text.primary,
                marginRight: getSpacing.sm,
              }}
              placeholder="Enter checklist item..."
              placeholderTextColor={theme.text.tertiary}
              value={item.text}
              onChangeText={(text) => updateItem(item.id, text)}
              onSubmitEditing={addItem}
              returnKeyType="next"
              onBlur={() => handleBlur(item.id)}
              blurOnSubmit={false}
            />
            
            {item.text.trim() && (
              <TouchableOpacity
                onPress={() => removeItem(item.id)}
                style={{ padding: getSpacing.xs }}
              >
                <Ionicons 
                  name="trash-outline" 
                  size={20} 
                  color={theme.error || '#ef4444'} 
                />
              </TouchableOpacity>
            )}
          </View>
        ))}
        
        <TouchableOpacity
          onPress={addItem}
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            paddingVertical: getSpacing.sm,
            marginTop: getSpacing.md,
            backgroundColor: theme.primary + '15',
            borderRadius: 6,
          }}
        >
          <Ionicons name="add" size={20} color={theme.primary} />
          <Text style={{
            fontSize: getTypography.body.fontSize,
            color: theme.primary,
            marginLeft: getSpacing.xs,
            fontWeight: '600',
          }}>
            Add Item
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default memo(ListForm);