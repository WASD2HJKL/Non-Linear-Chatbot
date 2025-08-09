import {
    createNode as wasp_createNode,
    updateNodePositions as wasp_updateNodePositions,
    updateNodeWidth as wasp_updateNodeWidth,
    getConversationNodes as wasp_getConversationNodes,
} from "wasp/client/operations";

export const createNode: typeof wasp_createNode = wasp_createNode;
export const updateNodePositions: typeof wasp_updateNodePositions = wasp_updateNodePositions;
export const updateNodeWidth: typeof wasp_updateNodeWidth = wasp_updateNodeWidth;
export const getConversationNodes: typeof wasp_getConversationNodes = wasp_getConversationNodes;
