'use client';

import React, { useState } from 'react';
import { Box, Text, Input, Button } from '@chakra-ui/react';
import './LinkedList.css';
import LinkedListContextMenu from './LinkedListContextMenu';

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
  nodeShape: 'rectangle' | 'circle';
  headNodeId?: string | null;
}

interface LinkedListProps {
  linkedList: LinkedListDataStructure;
  onAddNode: (linkedListId: string) => void;
  onDeleteNode: (linkedListId: string, nodeId: string) => void;
  onUpdateNodeValue: (linkedListId: string, nodeId: string, value: string) => void;
  onUpdateNodeConnection: (linkedListId: string, nodeId: string, targetNodeId: string | null) => void;
  onUpdateHeadPointer: (linkedListId: string, nodeId: string | null) => void;
  onStyleChange: (linkedListId: string, style: 'textbook' | 'doodle') => void;
  onNodeShapeChange: (linkedListId: string, nodeShape: 'rectangle' | 'circle') => void;
  isHovered: boolean;
  isDragging: boolean;
  onMouseDown: (e: React.MouseEvent) => void;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
  canvasPosition: { x: number; y: number };
  canvasZoom: number;
}

const LinkedList: React.FC<LinkedListProps> = ({
  linkedList,
  onAddNode,
  onDeleteNode,
  onUpdateNodeValue,
  onUpdateNodeConnection,
  onUpdateHeadPointer,
  onStyleChange,
  onNodeShapeChange,
  isHovered,
  isDragging,
  onMouseDown,
  onMouseEnter,
  onMouseLeave,
  canvasPosition,
  canvasZoom,
}) => {
  // Shared constants for node and arrow dimensions
  const nodeHeight = 48;
  const arrowGap = 40;
  const [editingNode, setEditingNode] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');
  const [showContextMenu, setShowContextMenu] = useState(false);
  const [contextMenuPosition, setContextMenuPosition] = useState({ x: 0, y: 0 });
  const [draggingArrow, setDraggingArrow] = useState<string | null>(null);
  const [dragStartPos, setDragStartPos] = useState({ x: 0, y: 0 });
  const [dragCurrentPos, setDragCurrentPos] = useState({ x: 0, y: 0 });
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [draggingHead, setDraggingHead] = useState(false);
  const [headDragPos, setHeadDragPos] = useState({ x: 0, y: 0 });
  const containerRef = React.useRef<HTMLDivElement>(null);

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

  const handleRightClick = (e: React.MouseEvent) => {
    e.preventDefault();
    // Get the relative position within the LinkedList container
    const rect = e.currentTarget.getBoundingClientRect();
    const relativeX = e.clientX - rect.left;
    const relativeY = e.clientY - rect.top;
    
    // Position menu to the right of the LinkedList
    setContextMenuPosition({
      x: 120, // 120px to the right of the LinkedList container
      y: relativeY - 50, // Align with the click position, offset by 50px
    });
    setShowContextMenu(true);
  };

  const handleContextMenuClose = () => {
    setShowContextMenu(false);
  };

  // Close context menu when clicking outside
  React.useEffect(() => {
    const handleClickOutside = () => {
      setShowContextMenu(false);
    };

    if (showContextMenu) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [showContextMenu]);

  // Handle arrow dragging
  React.useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (draggingArrow && containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        setDragCurrentPos({
          x: e.clientX - rect.left,
          y: e.clientY - rect.top,
        });
      }
      if (draggingHead && containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        setHeadDragPos({
          x: e.clientX - rect.left,
          y: e.clientY - rect.top,
        });
      }
    };

    const handleMouseUp = () => {
      if (draggingArrow) {
        // Find the closest node to drop on
        const closestNode = findClosestNode(dragCurrentPos);
        if (closestNode && closestNode !== draggingArrow) {
          onUpdateNodeConnection(linkedList.id, draggingArrow, closestNode);
        }
        setDraggingArrow(null);
      }
      if (draggingHead) {
        // Find the closest node to point head to
        const closestNode = findClosestNode(headDragPos);
        if (closestNode) {
          onUpdateHeadPointer(linkedList.id, closestNode);
        }
        setDraggingHead(false);
      }
    };

    if (draggingArrow || draggingHead) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [draggingArrow, dragCurrentPos, draggingHead, headDragPos, linkedList.id, onUpdateNodeConnection, onUpdateHeadPointer]);

  const findClosestNode = (pos: { x: number; y: number }) => {
    if (!containerRef.current) return null;
    
    const nodes = containerRef.current.querySelectorAll('.linkedlist-node');
    let closestNode = null;
    let minDistance = Infinity;

    nodes.forEach((nodeElement) => {
      const rect = nodeElement.getBoundingClientRect();
      const containerRect = containerRef.current!.getBoundingClientRect();
      const nodeCenter = {
        x: rect.left + rect.width / 2 - containerRect.left,
        y: rect.top + rect.height / 2 - containerRect.top,
      };
      
      const distance = Math.sqrt(
        Math.pow(pos.x - nodeCenter.x, 2) + Math.pow(pos.y - nodeCenter.y, 2)
      );
      
      if (distance < minDistance && distance < 50) { // 50px threshold
        minDistance = distance;
        closestNode = nodeElement.getAttribute('data-node-id');
      }
    });

    return closestNode;
  };


  // Deselect node when clicking outside
  React.useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (!containerRef.current) return;
      if (!(e.target instanceof Node)) return;
      if (!containerRef.current.contains(e.target)) {
        setSelectedNodeId(null);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const renderNode = (node: LinkedListNode, index: number) => {
    const isEditing = editingNode === node.id;
    const isLastNode = index === linkedList.nodes.length - 1;
    const isCircle = linkedList.nodeShape === 'circle';
    const isSelected = selectedNodeId === node.id;

    // Node size
    const nodeWidth = 90;
    const nodeSize = 75; // for circle

    // Rectangle node: split into data/next sections
    if (!isCircle) {
      return (
        <Box key={node.id} position="relative" style={{ overflow: 'visible', minWidth: nodeWidth + arrowGap }}>
          {/* Rectangle node as SVG split into two sections */}
          <Box
            className={`linkedlist-node ${linkedList.style}`}
            data-node-id={node.id}
            style={{
              width: `${nodeWidth}px`,
              height: `${nodeHeight}px`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              position: 'relative',
              cursor: 'pointer',
              background: 'none',
              boxShadow: 'none',
              fontFamily: 'monospace',
              marginRight: 0,
              boxSizing: 'border-box',
            }}
            onClick={(e) => {
              e.stopPropagation();
              setSelectedNodeId(node.id);
            }}
            onDoubleClick={() => handleNodeDoubleClick(node.id, node.value)}
          >
            <svg width={nodeWidth} height={nodeHeight} style={{ position: 'absolute', top: 0, left: 0 }}>
              {linkedList.style === 'textbook' ? (
                <>
                  {/* Left: Data section */}
                  <rect x="0" y="0" width={nodeWidth * 0.65} height={nodeHeight} fill="white" stroke="#222" strokeWidth="1" rx="4" />
                  {/* Right: Next section */}
                  <rect x={nodeWidth * 0.65} y="0" width={nodeWidth * 0.35} height={nodeHeight} fill="white" stroke="#222" strokeWidth="1" rx="4" />
                </>
              ) : (
                <>
                  {/* Doodle style - wavy hand-drawn rectangles */}
                  <path
                    d={`M4,2 L${nodeWidth * 0.65 - 4},-2 Q${nodeWidth * 0.65 + 2},${nodeHeight/2} ${nodeWidth * 0.65 - 2},${nodeHeight - 4} L4,${nodeHeight - 2} Q-2,${nodeHeight/2} 4,2`}
                    fill="none"
                    stroke="#222"
                    strokeWidth="1.2"
                  />
                  <path
                    d={`M${nodeWidth * 0.65 + 4},2 L${nodeWidth - 4},-2 Q${nodeWidth + 2},${nodeHeight/2} ${nodeWidth - 2},${nodeHeight - 4} L${nodeWidth * 0.65 + 4},${nodeHeight - 2} Q${nodeWidth * 0.65 - 2},${nodeHeight/2} ${nodeWidth * 0.65 + 4},2`}
                    fill="none"
                    stroke="#222"
                    strokeWidth="1.2"
                  />
                </>
              )}
            </svg>
            {/* Node value in left section */}
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
                  width: '36px',
                  textAlign: 'center',
                  border: '1px solid #007bff',
                  borderRadius: '4px',
                  position: 'absolute',
                  left: '8px',
                  top: '6px',
                  zIndex: 2,
                  background: 'white',
                }}
              />
            ) : (
              <Text
                fontSize="16px"
                fontWeight="normal"
                fontStyle="italic"
                color="#222"
                textAlign="center"
                fontFamily="sans-serif"
                style={{ position: 'absolute', left: '0', width: `${nodeWidth * 0.65}px`, top: '50%', transform: 'translateY(-50%)', zIndex: 2 }}
              >
                {node.value || 'null'}
              </Text>
            )}
            {/* Delete button: only on hover or selected */}
            {(isHovered || isSelected) && (
              <Box
                display="flex"
                alignItems="center"
                justifyContent="center"
                position="absolute"
                top="-8px"
                right="-8px"
                width="20px"
                height="20px"
                borderRadius="50%"
                bg="#ff4757"
                color="white"
                fontSize="12px"
                cursor="pointer"
                _hover={{ bg: '#ff3742' }}
                onClick={() => onDeleteNode(linkedList.id, node.id)}
                style={{ lineHeight: '1' }}
              >
                ×
              </Box>
            )}
          </Box>
          {/* Arrow to next node: SVG, black, thin, with arrowhead */}
          {!isLastNode && (
            <Box
              style={{
                position: 'absolute',
                top: '50%',
                left: `${nodeWidth}px`, // exactly at the right edge
                width: `${arrowGap}px`,
                height: '0',
                pointerEvents: 'auto',
                margin: 0,
                padding: 0,
              }}
              onMouseDown={(e) => {
                e.stopPropagation();
                setDraggingArrow(node.id);
                const rect = e.currentTarget.getBoundingClientRect();
                const containerRect = containerRef.current!.getBoundingClientRect();
                setDragStartPos({
                  x: rect.left - containerRect.left,
                  y: rect.top - containerRect.top + nodeHeight / 2,
                });
                setDragCurrentPos({
                  x: rect.left - containerRect.left,
                  y: rect.top - containerRect.top + nodeHeight / 2,
                });
              }}
            >
              <svg width={arrowGap} height={nodeHeight} style={{ position: 'absolute', top: `-${nodeHeight / 2}px`, left: 0, pointerEvents: 'none', margin: 0, padding: 0 }}>
                <defs>
                  <marker id="arrowhead-black" markerWidth="8" markerHeight="8" refX="8" refY="4" orient="auto" markerUnits="strokeWidth">
                    <polygon points="0,0 8,4 0,8" fill="#222" />
                  </marker>
                </defs>
                <line
                  x1={0}
                  y1={nodeHeight / 2}
                  x2={arrowGap}
                  y2={nodeHeight / 2}
                  stroke="#222"
                  strokeWidth={1.5}
                  markerEnd="url(#arrowhead-black)"
                />
              </svg>
            </Box>
          )}
          {/* Menu Icon: only on hover or selected, right of node */}
          {(isHovered || isSelected) && isLastNode && (
            <Box
              display="flex"
              alignItems="center"
              justifyContent="center"
              width="24px"
              height="24px"
              borderRadius="50%"
              bg="#f0f0f0"
              border="1px solid #ccc"
              cursor="pointer"
              _hover={{ bg: '#e0e0e0' }}
              onClick={(e) => {
                e.stopPropagation();
                setContextMenuPosition({
                  x: 120, // 120px to the right of the LinkedList container
                  y: 20,  // 20px from the top
                });
                setShowContextMenu(true);
              }}
              style={{
                fontSize: '14px',
                color: '#666',
                position: 'absolute',
                left: `${nodeWidth + arrowGap - 10}px`,
                top: '50%',
                transform: 'translateY(-50%)',
              }}
            >
              ⋮
            </Box>
          )}
        </Box>
      );
    }
    // Circle node rendering
    return (
      <Box key={node.id} position="relative" style={{ overflow: 'visible', minWidth: nodeSize + arrowGap }}>
        <Box
          className={`linkedlist-node ${linkedList.style}`}
          data-node-id={node.id}
          style={{
            width: `${nodeSize}px`,
            height: `${nodeSize}px`,
            border: 'none',
            borderRadius: '0',
            backgroundColor: 'transparent',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            position: 'relative',
            cursor: 'pointer',
            boxShadow: 'none',
            transition: 'all 0.2s ease',
            fontFamily: 'sans-serif',
          }}
          onClick={(e) => {
            e.stopPropagation();
            setSelectedNodeId(node.id);
          }}
          onDoubleClick={() => handleNodeDoubleClick(node.id, node.value)}
        >
          {/* Circle node background */}
          <svg width={nodeSize} height={nodeSize} style={{ position: 'absolute', top: 0, left: 0 }}>
            {linkedList.style === 'textbook' ? (
              <rect x="2" y="2" width={nodeSize - 4} height={nodeSize - 4} fill="white" stroke="#222" strokeWidth="2" rx="4" />
            ) : (
              <path
                d={`M${nodeSize/2 + 4},4 Q${nodeSize - 4},2 ${nodeSize - 6},${nodeSize/2 + 2} Q${nodeSize - 2},${nodeSize - 4} ${nodeSize/2 - 2},${nodeSize - 6} Q4,${nodeSize - 2} 6,${nodeSize/2 - 2} Q2,4 ${nodeSize/2 + 4},4`}
                fill="none"
                stroke="#222"
                strokeWidth="1.2"
              />
            )}
          </svg>
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
              fontSize="16px"
              fontWeight="normal"
              fontStyle="italic"
              color="#222"
              textAlign="center"
              fontFamily="sans-serif"
            >
              {node.value || 'null'}
            </Text>
          )}
          {/* Delete button: only on hover or selected */}
          {(isHovered || isSelected) && (
            <Box
              display="flex"
              alignItems="center"
              justifyContent="center"
              position="absolute"
              top="-8px"
              right="-8px"
              width="20px"
              height="20px"
              borderRadius="50%"
              bg="#ff4757"
              color="white"
              fontSize="12px"
              cursor="pointer"
              _hover={{ bg: '#ff3742' }}
              onClick={() => onDeleteNode(linkedList.id, node.id)}
              style={{ lineHeight: '1' }}
            >
              ×
            </Box>
          )}
        </Box>
        {/* Arrow to next node: SVG, black, thin, with arrowhead */}
        {!isLastNode && (
          <Box
            style={{
              position: 'absolute',
              top: '50%',
              left: `${nodeSize + 2}px`,
              width: `${arrowGap}px`,
              height: '0',
              pointerEvents: 'auto',
            }}
            onMouseDown={(e) => {
              e.stopPropagation();
              setDraggingArrow(node.id);
              const rect = e.currentTarget.getBoundingClientRect();
              const containerRect = containerRef.current!.getBoundingClientRect();
              setDragStartPos({
                x: rect.left - containerRect.left,
                y: rect.top - containerRect.top + nodeSize / 2,
              });
              setDragCurrentPos({
                x: rect.left - containerRect.left,
                y: rect.top - containerRect.top + nodeSize / 2,
              });
            }}
          >
            <svg width={arrowGap} height={nodeSize} style={{ position: 'absolute', top: `-${nodeSize / 2}px`, left: 0, pointerEvents: 'none' }}>
              <defs>
                <marker id="arrowhead-black" markerWidth="8" markerHeight="8" refX="8" refY="4" orient="auto" markerUnits="strokeWidth">
                  <polygon points="0,0 8,4 0,8" fill="#222" />
                </marker>
              </defs>
              <line
                x1={0}
                y1={nodeSize / 2}
                x2={arrowGap - 8}
                y2={nodeSize / 2}
                stroke="#222"
                strokeWidth={1.5}
                markerEnd="url(#arrowhead-black)"
              />
            </svg>
          </Box>
        )}
        {/* Menu Icon: only on hover or selected, right of node */}
        {(isHovered || isSelected) && isLastNode && (
          <Box
            display="flex"
            alignItems="center"
            justifyContent="center"
            width="24px"
            height="24px"
            borderRadius="50%"
            bg="#f0f0f0"
            border="1px solid #ccc"
            cursor="pointer"
            _hover={{ bg: '#e0e0e0' }}
            onClick={(e) => {
              e.stopPropagation();
              setContextMenuPosition({
                x: 120, // 120px to the right of the LinkedList container
                y: 20,  // 20px from the top
              });
              setShowContextMenu(true);
            }}
            style={{
              fontSize: '14px',
              color: '#666',
              position: 'absolute',
              left: `${nodeSize + arrowGap - 10}px`,
              top: '50%',
              transform: 'translateY(-50%)',
            }}
          >
            ⋮
          </Box>
        )}
      </Box>
    );
  };

  return (
    <Box
      ref={containerRef}
      onMouseDown={onMouseDown}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      onContextMenu={handleRightClick}
      style={{
        cursor: isDragging ? 'grabbing' : 'grab',
        opacity: isDragging ? 0.8 : 1,
        overflow: 'visible',
      }}
    >
      <Box display="flex" flexDirection="column" gap="6px">
        {/* Header with label and add button */}
        <Box display="flex" alignItems="center" gap="6px" mb="8px">
          <Text
            fontSize="11px"
            fontWeight="500"
            color="#666"
            letterSpacing="0.5px"
            textTransform="uppercase"
          >
            Linked List
          </Text>
          {/* Add node button */}
          {isHovered && (
            <Box
              display="flex"
              alignItems="center"
              justifyContent="center"
              width="16px"
              height="16px"
              borderRadius="50%"
              bg="#007bff"
              color="white"
              fontSize="10px"
              cursor="pointer"
              _hover={{ bg: '#0056b3' }}
              onClick={() => onAddNode(linkedList.id)}
              style={{ lineHeight: '1' }}
            >
              +
            </Box>
          )}
        </Box>
        {/* Head pointer under the label */}
        {linkedList.nodes.length > 0 && (
          <Box display="flex" flexDirection="column" alignItems="flex-start" mb="4px" position="relative">
            <Text fontSize="13px" fontWeight="600" color="#222" mb="2px">Head</Text>
            {/* Position Head pointer above the target node */}
            {(() => {
              const targetNodeId = linkedList.headNodeId || linkedList.nodes[0]?.id;
              const targetNodeIndex = linkedList.nodes.findIndex(node => node.id === targetNodeId);
              const nodeWidth = linkedList.nodeShape === 'rectangle' ? 90 : 75;
              const arrowGap = linkedList.nodeShape === 'rectangle' ? 0 : 30;
              const leftOffset = targetNodeIndex * (nodeWidth + arrowGap) + (nodeWidth / 2) - 10;
              
              return (
                <Box
                  position="absolute"
                  left={`${leftOffset}px`}
                  top="20px"
                  cursor="pointer"
                  onMouseDown={(e) => {
                    e.stopPropagation();
                    setDraggingHead(true);
                    const rect = e.currentTarget.getBoundingClientRect();
                    const containerRect = containerRef.current!.getBoundingClientRect();
                    setHeadDragPos({
                      x: rect.left - containerRect.left + 10,
                      y: rect.top - containerRect.top + 15,
                    });
                  }}
                >
                  <svg width="20" height="35">
                    <defs>
                      <marker id="arrowhead-head-down" markerWidth="8" markerHeight="8" refX="4" refY="4" orient="90" markerUnits="strokeWidth">
                        <polygon points="0,0 8,4 0,8" fill="#007bff" />
                      </marker>
                    </defs>
                    <line x1="10" y1="0" x2="10" y2="30" stroke="#007bff" strokeWidth="1.5" markerEnd="url(#arrowhead-head-down)" />
                  </svg>
                </Box>
              );
            })()}
          </Box>
        )}
        {/* Nodes */}
        <Box display="flex" alignItems="center" gap={linkedList.nodeShape === 'rectangle' ? 0 : 30} style={{ overflow: 'visible', margin: 0, padding: 0 }}>
          {linkedList.nodes.map((node, index) => renderNode(node, index))}
          {/* NULL label after last node */}
          {linkedList.nodeShape === 'rectangle' && linkedList.nodes.length > 0 && (() => {
            const nodeWidth = 90; // Same as defined in renderNode
            return (
              <Box display="flex" flexDirection="column" alignItems="center" style={{ margin: 0, padding: 0, marginLeft: 0 }}>
                <svg width={arrowGap + 10} height={nodeHeight / 2 + 34} style={{ margin: 0, padding: 0, display: 'block' }}>
                  <defs>
                    <marker id="arrowhead-null" markerWidth="8" markerHeight="8" refX="4" refY="4" orient="90" markerUnits="strokeWidth">
                      <polygon points="0,0 8,4 0,8" fill="#222" />
                    </marker>
                  </defs>
                  {/* L-shaped arrow: starts from center of last node's next section, then down */}
                  <line x1={-(arrowGap + 10) + (nodeWidth * 0.35 / 2)} y1={nodeHeight / 2} x2={arrowGap} y2={nodeHeight / 2} stroke="#222" strokeWidth="1.5" />
                  <line x1={arrowGap} y1={nodeHeight / 2} x2={arrowGap} y2={nodeHeight / 2 + 28} stroke="#222" strokeWidth="1.5" markerEnd="url(#arrowhead-null)" />
                </svg>
                <Text fontSize="16px" fontWeight="normal" fontStyle="italic" color="#222" fontFamily="sans-serif" style={{ margin: 0, padding: 0, marginTop: '-2px' }}>NULL</Text>
              </Box>
            );
          })()}
        </Box>
        {/* Data/Next labels under first node */}
        {linkedList.nodeShape === 'rectangle' && linkedList.nodes.length > 0 && (
          <Box display="flex" alignItems="center" gap="0" mt="2px" ml="2px">
            <Text fontSize="10px" color="#888" style={{ width: '46px', textAlign: 'center' }}>Data</Text>
            <Text fontSize="10px" color="#888" style={{ width: '24px', textAlign: 'center', marginLeft: '0px' }}>Next</Text>
          </Box>
        )}
      </Box>
      {/* Context Menu */}
      {showContextMenu && (
        <LinkedListContextMenu
          x={contextMenuPosition.x}
          y={contextMenuPosition.y}
          currentStyle={linkedList.style}
          currentNodeShape={linkedList.nodeShape}
          onStyleChange={(style) => {
            onStyleChange(linkedList.id, style);
            setShowContextMenu(false);
          }}
          onNodeShapeChange={(nodeShape) => {
            onNodeShapeChange(linkedList.id, nodeShape);
            setShowContextMenu(false);
          }}
          onClose={handleContextMenuClose}
        />
      )}
      {/* Dragging Arrow Visual Feedback */}
      {draggingArrow && (
        <Box
          position="absolute"
          top="0"
          left="0"
          width="100%"
          height="100%"
          pointerEvents="none"
          zIndex="1000"
        >
          <svg
            width="100%"
            height="100%"
            style={{ position: 'absolute', top: 0, left: 0 }}
          >
            <defs>
              <marker
                id="arrowhead"
                markerWidth="16"
                markerHeight="12"
                refX="14"
                refY="6"
                orient="auto"
              >
                <polygon
                  points="0 0, 16 6, 0 12"
                  fill="#007bff"
                  filter="drop-shadow(1px 1px 2px rgba(0,123,255,0.4))"
                />
              </marker>
            </defs>
            <line
              x1={dragStartPos.x}
              y1={dragStartPos.y}
              x2={dragCurrentPos.x}
              y2={dragCurrentPos.y}
              stroke="#007bff"
              strokeWidth="4"
              markerEnd="url(#arrowhead)"
              strokeDasharray="8,6"
              filter="drop-shadow(2px 2px 4px rgba(0,123,255,0.4))"
            />
          </svg>
        </Box>
      )}
      {/* Dragging Head Pointer Visual Feedback */}
      {draggingHead && (
        <Box
          position="absolute"
          top="0"
          left="0"
          width="100%"
          height="100%"
          pointerEvents="none"
          zIndex="1000"
        >
          <svg
            width="100%"
            height="100%"
            style={{ position: 'absolute', top: 0, left: 0 }}
          >
            <defs>
              <marker
                id="arrowhead-head-drag"
                markerWidth="16"
                markerHeight="12"
                refX="14"
                refY="6"
                orient="auto"
              >
                <polygon
                  points="0 0, 16 6, 0 12"
                  fill="#007bff"
                  filter="drop-shadow(1px 1px 2px rgba(0,123,255,0.4))"
                />
              </marker>
            </defs>
            <line
              x1="25"
              y1="75"
              x2={headDragPos.x}
              y2={headDragPos.y}
              stroke="#007bff"
              strokeWidth="3"
              markerEnd="url(#arrowhead-head-drag)"
              strokeDasharray="6,4"
              filter="drop-shadow(2px 2px 4px rgba(0,123,255,0.4))"
            />
          </svg>
        </Box>
      )}
    </Box>
  );
};

export default LinkedList;
export type { LinkedListDataStructure, LinkedListNode };
