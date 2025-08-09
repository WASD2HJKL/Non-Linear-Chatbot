import {
    createConversation as wasp_createConversation,
    getConversations as wasp_getConversations,
    getConversation as wasp_getConversation,
    updateLastActiveNodeId as wasp_updateLastActiveNodeId,
} from "wasp/client/operations";

export const createConversation: typeof wasp_createConversation = wasp_createConversation;
export const getConversations: typeof wasp_getConversations = wasp_getConversations;
export const getConversation: typeof wasp_getConversation = wasp_getConversation;
export const updateLastActiveNodeId: typeof wasp_updateLastActiveNodeId = wasp_updateLastActiveNodeId;
