// hooks/useTaskActions.js
import React, { useCallback } from "react";
import { createDocument, updateDocument } from "../services/firestoreService";
import { DateTime } from "luxon";

export const useTaskActions = () => {
  const createTaskDoc = useCallback(
    async (groupData, groupId, creatorInfo) => {
      const createdAt = DateTime.now().toISO();
      
      const taskData = {
        groupId,
        name: groupData.groupName || "",
        createdBy: creatorInfo,
        createdDate: createdAt,
        updatedDate: createdAt,
        tasks: [],
      };

      await createDocument("tasks", groupId, taskData);
      console.log("✅ Task document created for group:", groupId);
      
      return taskData;
    },
    []
  );

  // Other task-related functions...
  const addTask = useCallback(async (taskData) => {
    // TODO: Implementation
  }, []);

  return {
    createTaskDoc,
    addTask,
    // ... other task actions
  };
};