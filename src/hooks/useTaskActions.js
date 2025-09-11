// hooks/useTaskActions.js
import React, { useCallback } from "react";
import { createDocument, updateDocument, getDocument, getDocumentsByField } from "../services/firestoreService";
import { addMessageToUser } from "../services/messageService";
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

  const addTask = useCallback(async (taskData, creatorUserId) => {
    console.log("Adding task:", taskData);
    const groupId = taskData.groupId;
    console.log("Group ID for task:", groupId);
    
    if (!groupId) {
      throw new Error("Group ID is required to add a task.");
    }

    if (!taskData.taskId) {
      throw new Error("Task ID is required to add a task.");
    }

    if (!taskData.calendarId) {
      throw new Error("Calendar ID is required to add a task.");
    }

    if (!taskData.eventId) {
      throw new Error("Event ID is required to add a task.");
    }

    if (!creatorUserId) {
      throw new Error("Creator user ID is required to add a task.");
    }

    try {
      // Get the existing task document for this group
      const taskDoc = await getDocument("tasks", groupId);
      
      if (!taskDoc) {
        throw new Error(`No task document found for group ID: ${groupId}`);
      }

      // Check if a task with this ID already exists
      const existingTaskIndex = taskDoc.tasks.findIndex(
        task => task.taskId === taskData.taskId
      );

      if (existingTaskIndex !== -1) {
        console.log("Task with ID", taskData.taskId, "already exists. Skipping addition.");
        return { success: false, message: "Task already exists" };
      }

      // Add the new task to the tasks array
      const updatedTasks = [...taskDoc.tasks, taskData];
      
      // Update the document with the new tasks array and updated timestamp
      const updatedDoc = {
        ...taskDoc,
        tasks: updatedTasks,
        updatedDate: DateTime.now().toISO()
      };

      await updateDocument("tasks", groupId, updatedDoc);
      
      console.log("✅ Task added successfully to group:", groupId);

      // STEP 2: Send notifications to selected members who want newTasks notifications
      try {
        // Get the group document to access member notification preferences
        const groupQuery = await getDocumentsByField("groups", "groupId", groupId);
        
        if (groupQuery.length === 0) {
          console.warn("Group not found for notifications, skipping notifications");
        } else {
          const group = groupQuery[0];
          
          // Find members who:
          // 1. Are in the selectedMembers array for this task
          // 2. Have notifyFor.newTasks = true
          // 3. Are not the creator of the task
          // 4. Are active members
          const membersToNotify = group.members.filter(member => {
            return (
              taskData.selectedMembers?.includes(member.userId) && // Task is visible to them
              member.notifyFor?.newTasks === true && // They want newTask notifications
              member.userId !== creatorUserId && // Not the creator
              member.active === true // Active member
            );
          });

          console.log("Members to notify of new task:", membersToNotify.map(m => ({
            userId: m.userId,
            username: m.username
          })));

          if (membersToNotify.length > 0) {

           // Format the event date if available
let eventDateText = "";
if (taskData.startTime) {
  try {
    const eventDate = DateTime.fromISO(taskData.startTime);
    const day = eventDate.day;
    let suffix = 'th';
    if (day === 1 || day === 21 || day === 31) {
      suffix = 'st';
    } else if (day === 2 || day === 22) {
      suffix = 'nd';
    } else if (day === 3 || day === 23) {
      suffix = 'rd';
    }
    
    eventDateText = ` on ${eventDate.toFormat('ccc, LLL d')}${suffix}`;
  } catch (error) {
    console.warn("Error formatting event date:", error);
  }
}
            // Create notification message
            const taskTypeText = taskData.selectedTaskType || "Task";
            const notificationMessage = `A new ${taskTypeText} task has been created for the event "${taskData.title || 'Unknown Event'}" on ${eventDateText}, in group ${group.name}.`;

            // Send notifications to all relevant members
            const notificationResults = await Promise.allSettled(
              membersToNotify.map(member =>
                addMessageToUser(
                  member.userId,
                  {
                    userId: creatorUserId,
                    username: group.members.find(m => m.userId === creatorUserId)?.username || "Unknown User",
                    groupName: group.name,
                    screenForNavigation: {
                      screen: "EventDetailsScreen", // Adjust based on your navigation structure
                      params: { 
                        taskId: taskData.taskId,
                        groupId: groupId,
                        calendarId: taskData.calendarId,
                        eventId: taskData.eventId
                      },
                    },
                  },
                  notificationMessage
                )
              )
            );

            const successfulNotifications = notificationResults.filter(
              result => result.status === "fulfilled"
            ).length;

            const failedNotifications = notificationResults.filter(
              result => result.status === "rejected"
            );

            console.log(`✅ Sent new task notification to ${successfulNotifications} member(s)`);
            
            if (failedNotifications.length > 0) {
              console.warn(`⚠️ Failed to send ${failedNotifications.length} notification(s)`);
              failedNotifications.forEach((result, index) => {
                console.error(`Notification error for member ${membersToNotify[index]?.userId}:`, result.reason);
              });
            }
          } else {
            console.log("No members to notify for new task");
          }
        }
      } catch (notificationError) {
        console.error("Error sending new task notifications (task creation still successful):", notificationError);
        // Don't throw - notification failures shouldn't fail the task creation
      }

      return { success: true, taskData };

    } catch (error) {
      console.error("Error adding task:", error);
      throw new Error(`Failed to add task: ${error.message}`);
    }
  }, []);


  const updateTask = useCallback(async (groupId, taskId, updates, updaterUserId) => {
    console.log("Updating task:", { groupId, taskId, updates });
    
    if (!groupId || !taskId || !updaterUserId) {
      throw new Error("Group ID, Task ID, and updater user ID are required.");
    }
  
    try {
      // Get the existing task document for this group
      const taskDoc = await getDocument("tasks", groupId);
      
      if (!taskDoc) {
        throw new Error(`No task document found for group ID: ${groupId}`);
      }
  
      // Find the task to update
      const taskIndex = taskDoc.tasks.findIndex(task => task.taskId === taskId);
      
      if (taskIndex === -1) {
        throw new Error(`Task with ID ${taskId} not found in group ${groupId}`);
      }
  
      // Update the specific task with the provided updates
      const updatedTask = {
        ...taskDoc.tasks[taskIndex],
        ...updates,
        updatedAt: DateTime.now().toISO()
      };
  
      // Replace the task in the tasks array
      const updatedTasks = [...taskDoc.tasks];
      updatedTasks[taskIndex] = updatedTask;
      
      // Update the document with the new tasks array and updated timestamp
      const updatedDoc = {
        ...taskDoc,
        tasks: updatedTasks,
        updatedDate: DateTime.now().toISO()
      };
  
      await updateDocument("tasks", groupId, updatedDoc);
      
      console.log("✅ Task updated successfully:", taskId);
      return { success: true, taskData: updatedTask };
  
    } catch (error) {
      console.error("Error updating task:", error);
      throw new Error(`Failed to update task: ${error.message}`);
    }
  }, []);

  const deleteTask = useCallback(async (groupId, taskId, deleterUserId) => {
    console.log("Deleting task:", { groupId, taskId });
    
    if (!groupId || !taskId || !deleterUserId) {
      throw new Error("Group ID, Task ID, and deleter user ID are required.");
    }
  
    try {
      // Get the existing task document for this group
      const taskDoc = await getDocument("tasks", groupId);
      
      if (!taskDoc) {
        throw new Error(`No task document found for group ID: ${groupId}`);
      }
  
      // Find the task to delete
      const taskIndex = taskDoc.tasks.findIndex(task => task.taskId === taskId);
      
      if (taskIndex === -1) {
        throw new Error(`Task with ID ${taskId} not found in group ${groupId}`);
      }
  
      // Get the task data before deletion for notifications
      const taskToDelete = taskDoc.tasks[taskIndex];
      console.log("Task to be deleted:", taskToDelete);
  
      // Remove the task from the tasks array
      const updatedTasks = taskDoc.tasks.filter(task => task.taskId !== taskId);
      
      // Update the document with the new tasks array and updated timestamp
      const updatedDoc = {
        ...taskDoc,
        tasks: updatedTasks,
        updatedDate: DateTime.now().toISO()
      };
  
      await updateDocument("tasks", groupId, updatedDoc);
      
      console.log("✅ Task deleted successfully:", taskId);
  
      // STEP 2: Send notifications to selected members who want taskDeleted notifications
      try {
        // Get the group document to access member notification preferences
        const groupQuery = await getDocumentsByField("groups", "groupId", groupId);
        
        if (groupQuery.length === 0) {
          console.warn("Group not found for notifications, skipping notifications");
        } else {
          const group = groupQuery[0];
          
          // Find members who:
          // 1. Were in the selectedMembers array for this task
          // 2. Have notifyFor.taskDeleted = true (or similar notification preference)
          // 3. Are not the deleter of the task
          // 4. Are active members
          const membersToNotify = group.members.filter(member => {
            console.log("Checking member for notification:", member.userId, {
              isSelected: taskToDelete.selectedMembers?.includes(member.userId),
              wantsNotification: member.notifyFor?.updatedTasks === true,
              isNotDeleter: member.userId !== deleterUserId,
              isActive: member.active === true
            });
            return (
              taskToDelete.selectedMembers?.includes(member.userId) && // Task was visible to them
              member.notifyFor?.updatedTasks === true && // They want task deletion notifications
              member.userId !== deleterUserId && // Not the deleter
              member.active === true // Active member
            );
          });
  
          console.log("Members to notify of deleted task:", membersToNotify.map(m => ({
            userId: m.userId,
            username: m.username
          })));
  
          if (membersToNotify.length > 0) {
            // Format the event date if available
            let eventDateText = "";
            if (taskToDelete.startTime) {
              try {
                const eventDate = DateTime.fromISO(taskToDelete.startTime);
                const day = eventDate.day;
                let suffix = 'th';
                if (day === 1 || day === 21 || day === 31) {
                  suffix = 'st';
                } else if (day === 2 || day === 22) {
                  suffix = 'nd';
                } else if (day === 3 || day === 23) {
                  suffix = 'rd';
                }
                
                eventDateText = ` on ${eventDate.toFormat('ccc, LLL d')}${suffix}`;
              } catch (error) {
                console.warn("Error formatting event date:", error);
              }
            }
  
            // Create notification message
            const taskTypeText = taskToDelete.taskType || "Task";
            const notificationMessage = `A ${taskTypeText} task for the event "${taskToDelete.title || 'Unknown Event'}"${eventDateText} has been deleted from group ${group.name}.`;
  
            // Send notifications to all relevant members
            const notificationResults = await Promise.allSettled(
              membersToNotify.map(member =>
                addMessageToUser(
                  member.userId,
                  {
                    userId: deleterUserId,
                    username: group.members.find(m => m.userId === deleterUserId)?.username || "Unknown User",
                    groupName: group.name,
                    screenForNavigation: {
                      screen: "GroupDetailsScreen", // Navigate back to group since task is deleted
                      params: { 
                        groupId: groupId
                      },
                    },
                  },
                  notificationMessage
                )
              )
            );
  
            const successfulNotifications = notificationResults.filter(
              result => result.status === "fulfilled"
            ).length;
  
            const failedNotifications = notificationResults.filter(
              result => result.status === "rejected"
            );
  
            console.log(`✅ Sent task deletion notification to ${successfulNotifications} member(s)`);
            
            if (failedNotifications.length > 0) {
              console.warn(`⚠️ Failed to send ${failedNotifications.length} notification(s)`);
              failedNotifications.forEach((result, index) => {
                console.error(`Notification error for member ${membersToNotify[index]?.userId}:`, result.reason);
              });
            }
          } else {
            console.log("No members to notify for deleted task");
          }
        }
      } catch (notificationError) {
        console.error("Error sending task deletion notifications (task deletion still successful):", notificationError);
        // Don't throw - notification failures shouldn't fail the task deletion
      }
  
      return { success: true, deletedTask: taskToDelete };
  
    } catch (error) {
      console.error("Error deleting task:", error);
      throw new Error(`Failed to delete task: ${error.message}`);
    }
  }, []);

  return {
    createTaskDoc,
    addTask,
    updateTask,
    deleteTask
  };
};