import { useCallback, useEffect, useState } from "react";
import ReactFlow, { 
  Background, 
  Controls, 
  MiniMap, 
  useNodesState, 
  useEdgesState,
  MarkerType
} from 'reactflow';
import 'reactflow/dist/style.css';
import ConversationNode from "./ConversationNode";
import useTreeLayout from "../hook/useTreeLayout";

// Custom node types
const nodeTypes = {
  conversationNode: ConversationNode,
};

function ConversationCanvas({ 
  conversationTree, 
  activeBranchId, 
  nodePositions,
  onBranchSelect,
  onNodePositionChange 
}) {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const { calculateTreeLayout } = useTreeLayout();
  
  // Calculate better layout when tree changes
  useEffect(() => {
    if (!conversationTree || Object.keys(conversationTree).length === 0) {
      return;
    }
    
    // Only calculate a new layout if there aren't existing positions
    // This prevents positions from getting reset when the user has manually arranged them
    const missingPositions = Object.keys(conversationTree).some(
      id => id !== 'root' && !nodePositions[id]
    );
    
    if (missingPositions) {
      const newLayout = calculateTreeLayout(conversationTree, nodePositions);
      if (onNodePositionChange && Object.keys(newLayout).length > 0) {
        // Update positions for any new nodes
        Object.entries(newLayout).forEach(([nodeId, position]) => {
          if (!nodePositions[nodeId]) {
            onNodePositionChange(nodeId, position);
          }
        });
      }
    }
  }, [conversationTree, nodePositions, calculateTreeLayout, onNodePositionChange]);

  // Convert the conversation tree to ReactFlow nodes and edges
  useEffect(() => {
    if (!conversationTree || Object.keys(conversationTree).length === 0) {
      return;
    }

    const newNodes = [];
    const newEdges = [];
    
    // Create a node for each branch in the tree
    const processNode = (branchId) => {
      const branch = conversationTree[branchId];
      if (!branch) return;
      
      // Skip the root node if it only has the initial developer/assistant messages
      const isRoot = branch.parentId === null;
      if (isRoot && branch.messages.length <= 2) {
        // Process children of root
        branch.children.forEach((childId) => {
          processNode(childId);
        });
        return;
      }
      
      // Get the last user-assistant pair for display
      let nodeContent = { question: "", answer: "" };
      
      if (!isRoot) {
        // For non-root nodes, get the last user-assistant pair
        const messages = branch.messages;
        if (messages.length >= 4) { // At least developer, assistant, user, assistant
          const lastUserIndex = messages.findLastIndex(m => m.role === "user");
          if (lastUserIndex >= 0 && lastUserIndex + 1 < messages.length) {
            nodeContent = {
              question: messages[lastUserIndex].content,
              answer: messages[lastUserIndex + 1].content
            };
          }
        }
      } else {
        // For root with content, just show the assistant's initial message
        nodeContent = {
          question: "",
          answer: branch.messages[1]?.content || ""
        };
      }
      
      // Use stored position if available or create a default
      let position = nodePositions[branchId];
      if (!position) {
        // If no stored position, place relative to parent
        const parentPosition = branch.parentId ? 
          (nodePositions[branch.parentId] || { x: 0, y: 0 }) : 
          { x: 0, y: 0 };
          
        const siblingIndex = branch.parentId ? 
          conversationTree[branch.parentId].children.indexOf(branchId) : 
          0;
          
        position = {
          x: parentPosition.x + 350,
          y: parentPosition.y + (siblingIndex * 200)
        };
      }
      
      // Create node
      newNodes.push({
        id: branch.id,
        type: 'conversationNode',
        position: position,
        dragHandle: '.drag-handle',  // Allow dragging only from designated handle
        data: { 
          question: nodeContent.question,
          answer: nodeContent.answer,
          isSelected: branch.id === activeBranchId,
          onClick: () => onBranchSelect(branch.id)
        }
      });
      
      // Create edge from parent to this node
      if (branch.parentId && branch.parentId !== "root") {
        newEdges.push({
          id: `e-${branch.parentId}-${branch.id}`,
          source: branch.parentId,
          target: branch.id,
          markerEnd: {
            type: MarkerType.ArrowClosed,
          },
          style: { stroke: '#888' },
          animated: branch.id === activeBranchId,
        });
      }
      
      // Process children
      branch.children.forEach((childId) => {
        processNode(childId);
      });
    };
    
    // Start processing from the root
    processNode("root");
    
    setNodes(newNodes);
    setEdges(newEdges);
  }, [conversationTree, activeBranchId, nodePositions, onBranchSelect]);

  // Handle node click
  const onNodeClick = useCallback((event, node) => {
    if (node.data.onClick) {
      node.data.onClick();
    }
  }, []);
  
  // Track node position changes when dragging ends
  const onNodeDragStop = useCallback((event, node) => {
    if (onNodePositionChange) {
      onNodePositionChange(node.id, node.position);
    }
  }, [onNodePositionChange]);

  // Layout the graph automatically
  const handleAutoLayout = useCallback(() => {
    const newLayout = calculateTreeLayout(conversationTree, {});
    if (onNodePositionChange) {
      Object.entries(newLayout).forEach(([nodeId, position]) => {
        onNodePositionChange(nodeId, position);
      });
    }
  }, [conversationTree, calculateTreeLayout, onNodePositionChange]);

  return (
    <div className="conversation-canvas">
      <div className="canvas-toolbar">
        <button 
          className="auto-layout-button" 
          onClick={handleAutoLayout}
          title="Auto-arrange nodes"
        >
          Auto Layout
        </button>
      </div>
      
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeClick={onNodeClick}
        onNodeDragStop={onNodeDragStop}
        nodeTypes={nodeTypes}
        fitView
      >
        <Background />
        <Controls />
        <MiniMap />
      </ReactFlow>
    </div>
  );
}

export default ConversationCanvas;