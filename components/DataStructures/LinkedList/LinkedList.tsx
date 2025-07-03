'use client';

import React, { useState } from 'react';
import { Box, Text, Input, Button } from '@chakra-ui/react';
import './LinkedList.css';

interface LinkedListNode {
  id: string;
  value: string;
  next: string | null;
}

interface LinkedListDataStructure {
  id: string;
  x: number;
  y: number;
  nodes: LinkedListNode[];
  style: 'textbook' | 'doodle';
}

interface LinkedListProps {
  linkedList: LinkedListDataStructure;
  onAddNode: (linkedListId: string) => void;
  onDeleteNode: (linkedListId: string, nodeId: string) => void;
  onUpdateNodeValue: (linkedListId: string, nodeId: string, value: string) => void;
  onStyleChange: (linkedListId: string, style: 'textbook' | 'doodle') => void;
  isHovered: boolean;
  isDragging: boolean;
  onMouseDown: (e: React.MouseEvent) => void;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
}

const LinkedList: React.FC<LinkedListProps> = ({
  linkedList,
  onAddNode,
  onDeleteNode,
  onUpdateNodeValue,
  onStyleChange,
  isHovered,
  isDragging,
  onMouseDown,
  onMouseEnter,
  onMouseLeave,
}) => {
  const [editingNode, setEditingNode] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');

  const handleNodeDoubleClick = (nodeId: string, currentValue: string) => {
    setEditingNode(nodeId);
    setEditValue(currentValue);
  };

  const handleEditSave = () => {
    if (editingNode) {
      onUpdateNodeValue(linkedList.id, editingNode, editValue);
      setEditingNode(null);
      setEditValue('');
    }
  };

  const handleEditCancel = () => {
    setEditingNode(null);
    setEditValue('');
  };

  const renderNode = (node: LinkedListNode, index: number) => {
    const isEditing = editingNode === node.id;
    const isLastNode = index === linkedList.nodes.length - 1;

    return (
      <Box key={node.id} position="relative">
        <Box
          className={`linkedlist-node ${linkedList.style}`}
          style={{
            width: '80px',
            height: '60px',
            border: linkedList.style === 'textbook' ? '2px solid #333' : '2px solid #666',
            borderRadius: linkedList.style === 'textbook' ? '8px' : '20px',
            backgroundColor: linkedList.style === 'textbook' ? '#fff' : '#f0f0f0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            position: 'relative',
            cursor: 'pointer',
            boxShadow: linkedList.style === 'textbook' ? '0 2px 4px rgba(0,0,0,0.1)' : 'none',
          }}
          onDoubleClick={() => handleNodeDoubleClick(node.id, node.value)}
        >
          {isEditing ? (
            <Input
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              onBlur={handleEditSave}
              onKeyPress={(e) => {
                if (e.key === 'Enter') handleEditSave();
                if (e.key === 'Escape') handleEditCancel();
              }}
              size="sm"
              autoFocus
              style={{
                width: '60px',
                textAlign: 'center',
                border: '1px solid #007bff',
                borderRadius: '4px',
              }}
            />
          ) : (
            <Text
              fontSize="14px"
              fontWeight="medium"
              color={linkedList.style === 'textbook' ? '#333' : '#666'}
              textAlign="center"
            >
              {node.value || 'null'}
            </Text>
          )}
        </Box>
        
        {/* Arrow to next node */}
        {!isLastNode && (
          <Box
            style={{
              position: 'absolute',
              top: '50%',
              right: '-20px',
              width: '20px',
              height: '2px',
              backgroundColor: linkedList.style === 'textbook' ? '#333' : '#666',
              transform: 'translateY(-50%)',
            }}
          >
            <Box
              style={{
                position: 'absolute',
                right: '-4px',
                top: '-3px',
                width: '0',
                height: '0',
                borderLeft: '6px solid',
                borderLeftColor: linkedList.style === 'textbook' ? '#333' : '#666',
                borderTop: '4px solid transparent',
                borderBottom: '4px solid transparent',
              }}
            />
          </Box>
        )}

        {/* Delete button */}
        {isHovered && (
          <Button
            size="xs"
            colorScheme="red"
            position="absolute"
            top="-8px"
            right="-8px"
            onClick={() => onDeleteNode(linkedList.id, node.id)}
            style={{
              width: '20px',
              height: '20px',
              borderRadius: '50%',
              padding: '0',
              fontSize: '12px',
              lineHeight: '1',
            }}
          >
            ×
          </Button>
        )}
      </Box>
    );
  };

  return (
    <Box
      onMouseDown={onMouseDown}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      style={{
        cursor: isDragging ? 'grabbing' : 'grab',
        opacity: isDragging ? 0.8 : 1,
      }}
    >
      <Box display="flex" flexDirection="column" gap="8px">
        {/* Header */}
        <Box display="flex" alignItems="center" gap="8px">
          <Text
            fontSize="12px"
            fontWeight="bold"
            color={linkedList.style === 'textbook' ? '#333' : '#666'}
          >
            Linked List
          </Text>
          
          {/* Style toggle */}
          <Box display="flex" gap="4px">
            <Button
              size="xs"
              variant={linkedList.style === 'textbook' ? 'solid' : 'outline'}
              onClick={() => onStyleChange(linkedList.id, 'textbook')}
              style={{
                width: '24px',
                height: '24px',
                padding: '0',
                fontSize: '10px',
              }}
            >
              T
            </Button>
            <Button
              size="xs"
              variant={linkedList.style === 'doodle' ? 'solid' : 'outline'}
              onClick={() => onStyleChange(linkedList.id, 'doodle')}
              style={{
                width: '24px',
                height: '24px',
                padding: '0',
                fontSize: '10px',
              }}
            >
              D
            </Button>
          </Box>

          {/* Add node button */}
          {isHovered && (
            <Button
              size="xs"
              colorScheme="blue"
              onClick={() => onAddNode(linkedList.id)}
              style={{
                width: '24px',
                height: '24px',
                padding: '0',
                fontSize: '12px',
                lineHeight: '1',
              }}
            >
              +
            </Button>
          )}
        </Box>

        {/* Nodes */}
        <Box display="flex" alignItems="center" gap="20px">
          {linkedList.nodes.map((node, index) => renderNode(node, index))}
        </Box>
      </Box>
    </Box>
  );
};

export default LinkedList;
export type { LinkedListDataStructure, LinkedListNode };
