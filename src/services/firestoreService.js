import { doc, updateDoc } from 'firebase/firestore';

/**
 * Updates a user's document in Firestore.
 * This function can be used to update any top-level field or nested field
 * within the user document.
 *
 * @param {object} db - The Firestore database instance.
 * @param {string} userId - The unique ID of the user.
 * @param {object} updateData - An object containing the keys and their new values to be updated.
 *
 * @returns {Promise<void>} A promise that resolves when the update is complete.
 */
export const updateUserDoc = async (db, userId, updateData) => {
  if (!db || !userId || !updateData) {
    console.error('Update user document failed: Missing db, userId, or data.');
    return;
  }
  console.log('Updating user document for:', userId, 'with data:', updateData, db);

  try {
    const userRef = doc(db, 'users', userId);
    
    // updateDoc can handle nested objects, arrays, etc. directly.
    await updateDoc(userRef, updateData);
    console.log('User document updated successfully.');
  } catch (error) {
    console.error('Error updating user document:', error);
    // You could also re-throw the error or handle it more gracefully
    throw error;
  }
};