import React, { memo, useState } from 'react';
import { Handle, Position } from 'reactflow';
import { Button } from 'react-bootstrap';

function ConversationNode({ data, isConnectable }) {
  const { question, answer, isSelected, onClick } = data;
  const [expanded, setExpanded] = useState(false);
  
  // Node styling
  const nodeStyle = {
    padding: '10px',
    borderRadius: '8px',
    width: '250px',
    background: isSelected ? '#d2f5ff' : 'white',
    border: isSelected ? '2px solid #0096FF' : '1px solid #ccc',
    boxShadow: isSelected ? '0 0 10px rgba(0, 150, 255, 0.5)' : '0 4px 6px rgba(0, 0, 0, 0.1)',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    fontSize: '14px',
    overflow: 'hidden',
    position: 'relative'
  };

  // Truncate text longer than a certain length
  const truncateText = (text, maxLength = 50) => {
    if (!text) return "";
    return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
  };
  
  // Handle clicks on the node
  const handleNodeClick = (e) => {
    e.stopPropagation();
    if (onClick) onClick();
  };
  
  // Toggle expanded state for the node
  const toggleExpand = (e) => {
    e.stopPropagation();
    setExpanded(!expanded);
  };
  
  return (
    <div style={nodeStyle} onClick={handleNodeClick}>
      {/* Drag handle */}
      <div 
        className="drag-handle" 
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '14px',
          background: isSelected ? '#0096FF' : '#f0f0f0',
          borderTopLeftRadius: '8px',
          borderTopRightRadius: '8px',
          cursor: 'move',
          zIndex: 1
        }}
      />
      
      <Handle
        type="target"
        position={Position.Left}
        isConnectable={isConnectable}
      />
      
      <div style={{ textAlign: 'left', marginTop: '10px' }}>
        {question && (
          <div style={{ 
            background: '#f0f0f0', 
            padding: '8px', 
            borderRadius: '6px',
            marginBottom: '8px'
          }}>
            <strong>User:</strong>
            <p style={{ margin: 0, fontSize: '12px' }}>
              {expanded ? question : truncateText(question, 100)}
            </p>
          </div>
        )}
        
        <div style={{ 
          padding: '8px', 
          background: '#e8f4fd', 
          borderRadius: '6px' 
        }}>
          <strong>Assistant:</strong>
          <p style={{ margin: 0, fontSize: '12px' }}>
            {expanded ? answer : truncateText(answer, 150)}
          </p>
        </div>
        
        {(question?.length > 100 || answer?.length > 150) && (
          <Button 
            size="sm" 
            variant="outline-secondary" 
            onClick={toggleExpand} 
            style={{ marginTop: '8px', width: '100%', fontSize: '10px' }}
          >
            {expanded ? 'Collapse' : 'Expand'}
          </Button>
        )}
      </div>
      
      <Handle
        type="source"
        position={Position.Right}
        isConnectable={isConnectable}
      />
    </div>
  );
}

export default memo(ConversationNode);
