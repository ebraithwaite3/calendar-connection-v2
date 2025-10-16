import { useCallback } from "react";
import { useAuth } from "../contexts/AuthContext";
import { useData } from "../contexts/DataContext";
import { doc, getDoc, setDoc, updateDoc, deleteField, arrayUnion } from "firebase/firestore";

export const useGroceryActions = () => {
  const { db } = useAuth();
  const { user } = useData();

  const groceryId = user?.groceryId;

  const updateGroceryBank = useCallback(
    async (newFoodBank) => {
      if (!groceryId) {
        console.error("No groceriesId found for user");
        return;
      }
      try {
        const groceryDocId = `${groceryId}_foodBank`;
        const foodBankRef = doc(db, "groceries", groceryDocId);
        
        // Use setDoc to REPLACE the entire document (not merge)
        await setDoc(foodBankRef, newFoodBank);
        
        console.log("Grocery bank updated successfully");
      } catch (error) {
        console.error("Error updating grocery bank:", error);
        throw error;
      }
    },
    [groceryId, db]
  );

  const updateInventoryItem = useCallback(
    async (itemKey, itemData) => {
      if (!groceryId) {
        console.error("No groceriesId found for user");
        return;
      }
      try {
        const groceryDocId = `${groceryId}_inventory`;
        const inventoryRef = doc(db, "groceries", groceryDocId);
        
        // Use updateDoc with dot notation for partial update
        await updateDoc(inventoryRef, {
          [`inventory.${itemKey}`]: itemData
        });
        
        console.log(`Inventory item ${itemKey} updated successfully`);
      } catch (error) {
        console.error("Error updating inventory item:", error);
        throw error;
      }
    },
    [groceryId, db]
  );

  const removeInventoryItem = useCallback(
    async (itemKey) => {
      if (!groceryId) {
        console.error("No groceriesId found for user");
        return;
      }
      try {
        const groceryDocId = `${groceryId}_inventory`;
        const inventoryRef = doc(db, "groceries", groceryDocId);
        
        // Use deleteField to remove the item
        await updateDoc(inventoryRef, {
          [`inventory.${itemKey}`]: deleteField()
        });
        
        console.log(`Inventory item ${itemKey} removed successfully`);
      } catch (error) {
        console.error("Error removing inventory item:", error);
        throw error;
      }
    },
    [groceryId, db]
  );

  // Add new item to shopping list
const addToShoppingList = useCallback(
    async (newItem) => {
      if (!groceryId) {
        console.error("No groceriesId found for user");
        return;
      }
  
      try {
        const groceryDocId = `${groceryId}_shoppingList`;
        const shoppingListRef = doc(db, "groceries", groceryDocId);
  
        await updateDoc(shoppingListRef, {
          shoppingList: arrayUnion(newItem)
        });
        
        console.log(`Added ${newItem.name} to shopping list`);
      } catch (error) {
        console.error("Error adding to shopping list:", error);
        throw error;
      }
    },
    [groceryId, db]
  );
  
  // Update existing shopping list item
  const updateShoppingListItem = useCallback(
    async (itemId, updatedItem) => {
      if (!groceryId) {
        console.error("No groceriesId found for user");
        return;
      }
  
      try {
        const groceryDocId = `${groceryId}_shoppingList`;
        const shoppingListRef = doc(db, "groceries", groceryDocId);
  
        // Get current shopping list
        const shoppingListSnap = await getDoc(shoppingListRef);
        const currentList = shoppingListSnap.exists() ? shoppingListSnap.data().shoppingList || [] : [];
  
        // Find and update the item
        const itemIndex = currentList.findIndex(item => item.id === itemId);
        if (itemIndex === -1) {
          console.error("Item not found in shopping list");
          return;
        }
  
        const updatedList = [...currentList];
        updatedList[itemIndex] = updatedItem;
  
        await updateDoc(shoppingListRef, {
          shoppingList: updatedList
        });
  
        console.log(`Shopping list item ${itemId} updated successfully`);
      } catch (error) {
        console.error("Error updating shopping list item:", error);
        throw error;
      }
    },
    [groceryId, db]
  );

  return {
    updateGroceryBank,
    updateInventoryItem,
    removeInventoryItem,
    addToShoppingList,
    updateShoppingListItem
  };
};