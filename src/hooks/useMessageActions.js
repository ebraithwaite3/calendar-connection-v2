import React, { useCallback } from "react";
import { createDocument, updateDocument } from "../services/firestoreService";
import { DateTime } from "luxon";


export const useMessageActions = () => {

    // Function to create a new message document for a user
    const markMessageAsRead = useCallback(async (userId, messageId) => {
        if (!userId || !messageId) return;
        // TODO: Implement marking a message as read
    }
    , []);

    // Other message-related functions can be added here


    return {
        markMessageAsRead,
    };
};

