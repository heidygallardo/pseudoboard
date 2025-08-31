'use client';

import React, { useState } from 'react';
import { Box, Text, Input, Button } from '@chakra-ui/react';
import './LinkedList.css';
import LinkedListContextMenu from './LinkedListContextMenu';

interface LinkedListNode {
  id: string;
  value: string;
  next: string | null;
  isDeleted?: boolean;
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

  // Pointer navigation state
  const [currentPointer, setCurrentPointer] = useState<string | null>(null);
  const [showPointerControls, setShowPointerControls] = useState(false);

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

  // Pointer navigation functions
  const initializePointer = () => {
    if (linkedList.nodes.length > 0) {
      setCurrentPointer(linkedList.nodes[0].id);
      setShowPointerControls(true);
    }
  };

  const advancePointer = () => {
    if (!currentPointer) return;
    
    const currentNodeIndex = linkedList.nodes.findIndex(node => node.id === currentPointer);
    if (currentNodeIndex === -1) return;
    
    // For now, advance to next node in array (sequential)
    // TODO: Later we can use actual next pointers when they're properly set
    if (currentNodeIndex < linkedList.nodes.length - 1) {
      setCurrentPointer(linkedList.nodes[currentNodeIndex + 1].id);
    }
  };

  const resetPointer = () => {
    if (linkedList.nodes.length > 0) {
      setCurrentPointer(linkedList.nodes[0].id);
    }
  };

  const hidePointers = () => {
    setCurrentPointer(null);
    setShowPointerControls(false);
  };

  // Effect to handle when the current pointed node gets deleted
  React.useEffect(() => {
    if (currentPointer) {
      const currentNode = linkedList.nodes.find(node => node.id === currentPointer);
      
      // If current node is deleted or doesn't exist
      if (!currentNode || currentNode.isDeleted) {
        console.log('Current node deleted, finding next valid node...');
        
        // Try to find the next valid (non-deleted) node
        let nextValidNode = null;
        
        // First, try to advance to next node in sequence (since we're using sequential for now)
        if (currentNode) {
          const currentIndex = linkedList.nodes.findIndex(node => node.id === currentPointer);
          if (currentIndex !== -1 && currentIndex < linkedList.nodes.length - 1) {
            const nextNode = linkedList.nodes[currentIndex + 1];
            if (nextNode && !nextNode.isDeleted) {
              nextValidNode = nextNode.id;
            }
          }
        }
        
        // If no valid next node, find the first non-deleted node
        if (!nextValidNode) {
          const firstValidNode = linkedList.nodes.find(node => !node.isDeleted);
          nextValidNode = firstValidNode ? firstValidNode.id : null;
        }
        
        console.log('Moving pointer to:', nextValidNode);
        
        // Update pointer or hide if no valid nodes left
        if (nextValidNode) {
          setCurrentPointer(nextValidNode);
        } else {
          hidePointers();
        }
      }
    }
  }, [linkedList.nodes, currentPointer]);

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
    const isDeleted = node.isDeleted || false;

    // Node size
    const nodeWidth = 90;
    const nodeSize = 75; // for circle

    // Rectangle node: split into data/next sections
    if (!isCircle) {
      return (
        <Box key={node.id} position="relative" style={{ overflow: 'visible', minWidth: nodeWidth + arrowGap }}>
          {/* Current pointer arrow above this node */}
          {currentPointer === node.id && !isDeleted && (
            <Box
              position="absolute"
              top="-50px"
              left="32.5%"
              transform="translateX(-50%)"
              zIndex="15"
              display="flex"
              alignItems="center"
              flexDirection="column"
            >
              <Text 
                fontSize="9px" 
                fontWeight="600" 
                color="#16a34a" 
                mb="1px"
                fontFamily="'Inter', -apple-system, BlinkMacSystemFont, sans-serif"
                letterSpacing="0.025em"
                textTransform="uppercase"
              >
                Current
              </Text>
              <svg width="20" height="35">
                <defs>
                  <marker id="current-pointer-arrow" markerWidth="5" markerHeight="5" refX="2.5" refY="2.5" orient="90" markerUnits="strokeWidth">
                    <polygon points="0,0 5,2.5 0,5" fill="#16a34a" />
                  </marker>
                </defs>
                <line x1="10" y1="2" x2="10" y2="25" stroke="#16a34a" strokeWidth="2" markerEnd="url(#current-pointer-arrow)" />
              </svg>
            </Box>
          )}
          
          {/* Rectangle node as SVG split into two sections */}
          <Box
            className={`linkedlist-node ${linkedList.style}`}
            data-node-id={node.id}
            data-selected={isSelected}
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
              opacity: isDeleted ? 0.3 : 1,
              transition: 'opacity 0.3s ease',
            }}
            onClick={(e) => {
              e.stopPropagation();
              setSelectedNodeId(node.id);
            }}
            onDoubleClick={() => handleNodeDoubleClick(node.id, node.value)}
          >
            <svg width={nodeWidth} height={nodeHeight} style={{ position: 'absolute', top: 0, left: 0 }}>
              <defs>
                {/* Modern gradient backgrounds */}
                <linearGradient id={`dataGradient-${node.id}`} x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#f8fafc" />
                  <stop offset="100%" stopColor="#e2e8f0" />
                </linearGradient>
                <linearGradient id={`nextGradient-${node.id}`} x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#eff6ff" />
                  <stop offset="100%" stopColor="#dbeafe" />
                </linearGradient>
              </defs>
              {linkedList.style === 'textbook' ? (
                <>
                  {/* Left: Data section with modern styling */}
                  <rect 
                    x="2" y="2" 
                    width={nodeWidth * 0.65 - 4} 
                    height={nodeHeight - 4} 
                    fill={`url(#dataGradient-${node.id})`} 
                    stroke="#64748b" 
                    strokeWidth="1.5" 
                    rx="8"
                  />
                  {/* Right: Next section with modern styling */}
                  <rect 
                    x={nodeWidth * 0.65 + 2} y="2" 
                    width={nodeWidth * 0.35 - 4} 
                    height={nodeHeight - 4} 
                    fill={`url(#nextGradient-${node.id})`} 
                    stroke="#3b82f6" 
                    strokeWidth="1.5" 
                    rx="8"
                  />
                  {/* Divider line between sections */}
                  <line 
                    x1={nodeWidth * 0.65} 
                    y1="6" 
                    x2={nodeWidth * 0.65} 
                    y2={nodeHeight - 6} 
                    stroke="#cbd5e1" 
                    strokeWidth="1"
                    opacity="0.6"
                  />
                </>
              ) : (
                <>
                  {/* Doodle style with modern organic shapes */}
                  <path
                    d={`M8,4 L${nodeWidth * 0.65 - 4},2 Q${nodeWidth * 0.65 + 1},${nodeHeight/2 - 1} ${nodeWidth * 0.65 - 3},${nodeHeight - 6} L6,${nodeHeight - 4} Q1,${nodeHeight/2 + 1} 8,4`}
                    fill={`url(#dataGradient-${node.id})`}
                    stroke="#64748b"
                    strokeWidth="2"
                  />
                  <path
                    d={`M${nodeWidth * 0.65 + 6},4 L${nodeWidth - 6},2 Q${nodeWidth - 1},${nodeHeight/2 - 1} ${nodeWidth - 4},${nodeHeight - 6} L${nodeWidth * 0.65 + 4},${nodeHeight - 4} Q${nodeWidth * 0.65 - 1},${nodeHeight/2 + 1} ${nodeWidth * 0.65 + 6},4`}
                    fill={`url(#nextGradient-${node.id})`}
                    stroke="#3b82f6"
                    strokeWidth="2"
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
                fontSize="14px"
                fontWeight="600"
                color="#334155"
                textAlign="center"
                fontFamily="'Inter', -apple-system, BlinkMacSystemFont, sans-serif"
                letterSpacing="-0.025em"
                style={{ 
                  position: 'absolute', 
                  left: '0', 
                  width: `${nodeWidth * 0.65}px`, 
                  top: '50%', 
                  transform: 'translateY(-50%)', 
                  zIndex: 2,
                  textShadow: '0 1px 2px rgba(0, 0, 0, 0.05)'
                }}
              >
                {node.value || <span style={{ color: '#94a3b8', fontStyle: 'italic', fontWeight: '400' }}>null</span>}
              </Text>
            )}
            {/* Modern delete button: only on hover or selected */}
            {(isHovered || isSelected) && (
              <Box
                display="flex"
                alignItems="center"
                justifyContent="center"
                position="absolute"
                top="-6px"
                right="-6px"
                width="18px"
                height="18px"
                borderRadius="50%"
                bg="rgba(248, 113, 113, 0.9)"
                color="white"
                fontSize="10px"
                cursor="pointer"
                transition="all 0.2s ease"
                _hover={{ 
                  bg: '#ef4444',
                  transform: 'scale(1.1)',
                  boxShadow: '0 2px 8px rgba(239, 68, 68, 0.3)'
                }}
                onClick={(e) => {
                  e.stopPropagation();
                  onDeleteNode(linkedList.id, node.id);
                }}
                style={{ lineHeight: '1' }}
              >
                <svg width="8" height="8" viewBox="0 0 8 8" fill="currentColor">
                  <path d="M1 1l6 6M7 1L1 7" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
                </svg>
              </Box>
            )}
          </Box>
          {/* Arrow to next node: SVG, black, thin, with arrowhead */}
          {!isLastNode && !isDeleted && (() => {
            // Check if the immediately next node in the array is deleted
            const immediateNextNode = linkedList.nodes[index + 1];
            const isImmediateNextDeleted = immediateNextNode?.isDeleted || false;
            
            // Calculate how many consecutive deleted nodes to skip for rerouted arrow
            let deletedNodesCount = 0;
            if (isImmediateNextDeleted) {
              for (let i = index + 1; i < linkedList.nodes.length; i++) {
                if (linkedList.nodes[i].isDeleted) {
                  deletedNodesCount++;
                } else {
                  break;
                }
              }
            }
            
            const arrowWidth = isImmediateNextDeleted ? arrowGap + (deletedNodesCount * (nodeWidth + arrowGap)) : arrowGap;
            const bypassHeight = 40; // Height for the bypass curve
            
            return (
              <Box
                style={{
                  position: 'absolute',
                  top: '50%',
                  left: `${nodeWidth}px`,
                  width: `${arrowWidth}px`,
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
                <svg 
                  width={arrowWidth} 
                  height={isImmediateNextDeleted ? nodeHeight + bypassHeight * 2 : nodeHeight} 
                  style={{ 
                    position: 'absolute', 
                    top: isImmediateNextDeleted ? `-${nodeHeight / 2 + bypassHeight}px` : `-${nodeHeight / 2}px`, 
                    left: 0, 
                    pointerEvents: 'none', 
                    margin: 0, 
                    padding: 0 
                  }}
                >
                  <defs>
                    <marker id="arrowhead-black" markerWidth="8" markerHeight="8" refX="8" refY="4" orient="auto" markerUnits="strokeWidth">
                      <polygon points="0,0 8,4 0,8" fill="#222" />
                    </marker>
                  </defs>
                  
                  {isImmediateNextDeleted ? (
                    // Rerouted arrow: right-down-up-right path
                    <path
                      d={`M 0 ${nodeHeight / 2 + bypassHeight} 
                          L ${arrowGap / 2} ${nodeHeight / 2 + bypassHeight}
                          L ${arrowGap / 2} ${nodeHeight / 2 + bypassHeight + bypassHeight}
                          L ${arrowWidth - arrowGap / 2} ${nodeHeight / 2 + bypassHeight + bypassHeight}
                          L ${arrowWidth - arrowGap / 2} ${nodeHeight / 2 + bypassHeight}
                          L ${arrowWidth} ${nodeHeight / 2 + bypassHeight}`}
                      fill="none"
                      stroke="#222"
                      strokeWidth="1.5"
                      markerEnd="url(#arrowhead-black)"
                    />
                  ) : (
                    // Normal straight arrow
                    <line
                      x1={0}
                      y1={nodeHeight / 2}
                      x2={arrowGap}
                      y2={nodeHeight / 2}
                      stroke="#222"
                      strokeWidth={1.5}
                      markerEnd="url(#arrowhead-black)"
                    />
                  )}
                </svg>
              </Box>
            );
          })()}
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
        {/* Current pointer arrow above this circle node */}
        {currentPointer === node.id && !isDeleted && (
          <Box
            position="absolute"
            top="-50px"
            left="50%"
            transform="translateX(-50%)"
            zIndex="15"
            display="flex"
            alignItems="center"
            flexDirection="column"
          >
            <Text 
              fontSize="9px" 
              fontWeight="600" 
              color="#16a34a" 
              mb="1px"
              fontFamily="'Inter', -apple-system, BlinkMacSystemFont, sans-serif"
              letterSpacing="0.025em"
              textTransform="uppercase"
            >
              Current
            </Text>
            <svg width="20" height="35">
              <defs>
                <marker id="current-pointer-arrow-circle" markerWidth="5" markerHeight="5" refX="2.5" refY="2.5" orient="90" markerUnits="strokeWidth">
                  <polygon points="0,0 5,2.5 0,5" fill="#16a34a" />
                </marker>
              </defs>
              <line x1="10" y1="2" x2="10" y2="25" stroke="#16a34a" strokeWidth="2" markerEnd="url(#current-pointer-arrow-circle)" />
            </svg>
          </Box>
        )}
        
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
            opacity: isDeleted ? 0.3 : 1,
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
          {/* Modern delete button: only on hover or selected */}
          {(isHovered || isSelected) && (
            <Box
              display="flex"
              alignItems="center"
              justifyContent="center"
              position="absolute"
              top="-6px"
              right="-6px"
              width="18px"
              height="18px"
              borderRadius="50%"
              bg="rgba(248, 113, 113, 0.9)"
              color="white"
              fontSize="10px"
              cursor="pointer"
              transition="all 0.2s ease"
              _hover={{ 
                bg: '#ef4444',
                transform: 'scale(1.1)',
                boxShadow: '0 2px 8px rgba(239, 68, 68, 0.3)'
              }}
              onClick={(e) => {
                e.stopPropagation();
                onDeleteNode(linkedList.id, node.id);
              }}
              style={{ lineHeight: '1' }}
            >
              <svg width="8" height="8" viewBox="0 0 8 8" fill="currentColor">
                <path d="M1 1l6 6M7 1L1 7" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
              </svg>
            </Box>
          )}
        </Box>
        {/* Arrow to next node: SVG, black, thin, with arrowhead */}
        {!isLastNode && !isDeleted && (() => {
          // Check if the immediately next node in the array is deleted
          const immediateNextNode = linkedList.nodes[index + 1];
          const isImmediateNextDeleted = immediateNextNode?.isDeleted || false;
          
          // Calculate how many consecutive deleted nodes to skip for rerouted arrow
          let deletedNodesCount = 0;
          if (isImmediateNextDeleted) {
            for (let i = index + 1; i < linkedList.nodes.length; i++) {
              if (linkedList.nodes[i].isDeleted) {
                deletedNodesCount++;
              } else {
                break;
              }
            }
          }
          
          const arrowWidth = isImmediateNextDeleted ? arrowGap + (deletedNodesCount * (nodeSize + 30)) : arrowGap;
          const bypassHeight = 40; // Height for the bypass curve
          
          return (
            <Box
              style={{
                position: 'absolute',
                top: '50%',
                left: `${nodeSize + 2}px`,
                width: `${arrowWidth}px`,
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
              <svg 
                width={arrowWidth} 
                height={isImmediateNextDeleted ? nodeSize + bypassHeight * 2 : nodeSize} 
                style={{ 
                  position: 'absolute', 
                  top: isImmediateNextDeleted ? `-${nodeSize / 2 + bypassHeight}px` : `-${nodeSize / 2}px`, 
                  left: 0, 
                  pointerEvents: 'none' 
                }}
              >
                <defs>
                  <marker id="arrowhead-black" markerWidth="8" markerHeight="8" refX="8" refY="4" orient="auto" markerUnits="strokeWidth">
                    <polygon points="0,0 8,4 0,8" fill="#222" />
                  </marker>
                </defs>
                
                {isImmediateNextDeleted ? (
                  // Rerouted arrow: right-down-up-right path
                  <path
                    d={`M 0 ${nodeSize / 2 + bypassHeight} 
                        L ${arrowGap / 2} ${nodeSize / 2 + bypassHeight}
                        L ${arrowGap / 2} ${nodeSize / 2 + bypassHeight + bypassHeight}
                        L ${arrowWidth - arrowGap / 2} ${nodeSize / 2 + bypassHeight + bypassHeight}
                        L ${arrowWidth - arrowGap / 2} ${nodeSize / 2 + bypassHeight}
                        L ${arrowWidth - 8} ${nodeSize / 2 + bypassHeight}`}
                    fill="none"
                    stroke="#222"
                    strokeWidth="1.5"
                    markerEnd="url(#arrowhead-black)"
                  />
                ) : (
                  // Normal straight arrow
                  <line
                    x1={0}
                    y1={nodeSize / 2}
                    x2={arrowGap - 8}
                    y2={nodeSize / 2}
                    stroke="#222"
                    strokeWidth={1.5}
                    markerEnd="url(#arrowhead-black)"
                  />
                )}
              </svg>
            </Box>
          );
        })()}
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
        {/* Header with label */}
        <Box display="flex" alignItems="center" mb="8px">
          <Text
            fontSize="11px"
            fontWeight="500"
            color="#666"
            letterSpacing="0.5px"
            textTransform="uppercase"
          >
            Linked List
          </Text>
        </Box>

        {/* Nodes */}
        <Box display="flex" alignItems="center" gap={linkedList.nodeShape === 'rectangle' ? 0 : 30} style={{ overflow: 'visible', margin: 0, padding: 0 }}>
          {linkedList.nodes.map((node, index) => renderNode(node, index))}
          
          {/* NULL arrow after last node */}
          {linkedList.nodeShape === 'rectangle' && linkedList.nodes.length > 0 && (() => {
            const nodeWidth = 90; // Same as defined in renderNode
            return (
              <Box
                style={{
                  position: 'relative',
                  width: `${arrowGap}px`,
                  height: `${nodeHeight}px`,
                  margin: 0,
                  padding: 0,
                  marginLeft: `-${arrowGap}px`,
                }}
              >
                <svg width={arrowGap} height={nodeHeight + 40} style={{ position: 'absolute', top: 0, left: 0, pointerEvents: 'none', margin: 0, padding: 0 }}>
                  <defs>
                    <marker id="arrowhead-null" markerWidth="8" markerHeight="8" refX="8" refY="4" orient="auto" markerUnits="strokeWidth">
                      <polygon points="0,0 8,4 0,8" fill="#222" />
                    </marker>
                  </defs>
                  {/* L-shaped arrow: horizontal line then vertical line to NULL */}
                  <line x1={0} y1={nodeHeight / 2} x2={arrowGap / 2} y2={nodeHeight / 2} stroke="#222" strokeWidth="1.5" />
                  <line x1={arrowGap / 2} y1={nodeHeight / 2} x2={arrowGap / 2} y2={nodeHeight + 28} stroke="#222" strokeWidth="1.5" markerEnd="url(#arrowhead-null)" />
                </svg>
                <Text 
                  fontSize="16px" 
                  fontWeight="normal" 
                  fontStyle="italic" 
                  color="#222" 
                  fontFamily="sans-serif" 
                  style={{ 
                    position: 'absolute', 
                    top: `${nodeHeight + 32}px`, 
                    left: '50%', 
                    transform: 'translateX(-50%)',
                    margin: 0, 
                    padding: 0 
                  }}
                >
                  NULL
                </Text>
              </Box>
            );
          })()}
        </Box>
        {/* Data/Next labels under first node */}
        {linkedList.nodeShape === 'rectangle' && linkedList.nodes.length > 0 && (
          <Box display="flex" alignItems="center" gap="0" mt="6px" ml="2px">
            <Text 
              fontSize="11px" 
              color="#64748b" 
              fontWeight="500" 
              fontFamily="'Inter', -apple-system, BlinkMacSystemFont, sans-serif"
              letterSpacing="0.025em"
              style={{ width: '46px', textAlign: 'center', textTransform: 'uppercase' }}
            >
              Data
            </Text>
            <Text 
              fontSize="11px" 
              color="#3b82f6" 
              fontWeight="500"
              fontFamily="'Inter', -apple-system, BlinkMacSystemFont, sans-serif"
              letterSpacing="0.025em"
              style={{ width: '32px', textAlign: 'center', marginLeft: '10px', textTransform: 'uppercase' }}
            >
              Next
            </Text>
          </Box>
        )}
        
        {/* Control buttons below the linked list */}
<Box display="flex" alignItems="center" gap="6px" mt="28px">
          {/* Pointer control buttons */}
          {!showPointerControls ? (
            <>
              <Box
                display="flex"
                alignItems="center"
                justifyContent="center"
                px="8px"
                py="4px"
                borderRadius="4px"
                bg="rgba(34, 197, 94, 0.1)"
                border="1px dashed #22c55e"
                color="#16a34a"
                fontSize="10px"
                fontWeight="500"
                fontFamily="'Inter', -apple-system, BlinkMacSystemFont, sans-serif"
                letterSpacing="0.025em"
                cursor="pointer"
                transition="all 0.2s ease"
                _hover={{ 
                  bg: "#22c55e", 
                  color: "white",
                  borderStyle: "solid",
                  transform: "scale(1.05)"
                }}
                onClick={initializePointer}
                style={{ lineHeight: '1', textTransform: 'uppercase' }}
              >
                Start Pointer
              </Box>
              
              {/* Add Node button next to Start Pointer */}
              <Box
                display="flex"
                alignItems="center"
                justifyContent="center"
                px="8px"
                py="4px"
                borderRadius="4px"
                bg="rgba(59, 130, 246, 0.1)"
                border="1px dashed #3b82f6"
                color="#3b82f6"
                fontSize="10px"
                fontWeight="500"
                fontFamily="'Inter', -apple-system, BlinkMacSystemFont, sans-serif"
                letterSpacing="0.025em"
                cursor="pointer"
                transition="all 0.2s ease"
                _hover={{ 
                  bg: "#3b82f6", 
                  color: "white",
                  borderStyle: "solid",
                  transform: "scale(1.05)"
                }}
                onClick={() => onAddNode(linkedList.id)}
                style={{ lineHeight: '1', textTransform: 'uppercase' }}
              >
                Add Node
              </Box>
            </>
          ) : (
            <>
              <Box
                display="flex"
                alignItems="center"
                justifyContent="center"
                px="6px"
                py="4px"
                borderRadius="4px"
                bg="rgba(34, 197, 94, 0.1)"
                border="1px solid #22c55e"
                color="#16a34a"
                fontSize="10px"
                fontWeight="500"
                fontFamily="'Inter', -apple-system, BlinkMacSystemFont, sans-serif"
                cursor="pointer"
                transition="all 0.2s ease"
                _hover={{ 
                  bg: "#22c55e", 
                  color: "white",
                  transform: "scale(1.05)"
                }}
                onClick={advancePointer}
                style={{ lineHeight: '1' }}
              >
                Next
              </Box>
              <Box
                display="flex"
                alignItems="center"
                justifyContent="center"
                px="6px"
                py="4px"
                borderRadius="4px"
                bg="rgba(251, 146, 60, 0.1)"
                border="1px solid #f59e0b"
                color="#d97706"
                fontSize="10px"
                fontWeight="500"
                fontFamily="'Inter', -apple-system, BlinkMacSystemFont, sans-serif"
                cursor="pointer"
                transition="all 0.2s ease"
                _hover={{ 
                  bg: "#f59e0b", 
                  color: "white",
                  transform: "scale(1.05)"
                }}
                onClick={resetPointer}
                style={{ lineHeight: '1' }}
              >
                Reset
              </Box>
              <Box
                display="flex"
                alignItems="center"
                justifyContent="center"
                px="6px"
                py="4px"
                borderRadius="4px"
                bg="rgba(239, 68, 68, 0.1)"
                border="1px solid #ef4444"
                color="#dc2626"
                fontSize="10px"
                fontWeight="500"
                fontFamily="'Inter', -apple-system, BlinkMacSystemFont, sans-serif"
                cursor="pointer"
                transition="all 0.2s ease"
                _hover={{ 
                  bg: "#ef4444", 
                  color: "white",
                  transform: "scale(1.05)"
                }}
                onClick={hidePointers}
                style={{ lineHeight: '1' }}
              >
                Hide
              </Box>
              
              {/* Add Node button when pointer controls are active */}
              <Box
                display="flex"
                alignItems="center"
                justifyContent="center"
                px="8px"
                py="4px"
                borderRadius="4px"
                bg="rgba(59, 130, 246, 0.1)"
                border="1px dashed #3b82f6"
                color="#3b82f6"
                fontSize="10px"
                fontWeight="500"
                fontFamily="'Inter', -apple-system, BlinkMacSystemFont, sans-serif"
                letterSpacing="0.025em"
                cursor="pointer"
                transition="all 0.2s ease"
                _hover={{ 
                  bg: "#3b82f6", 
                  color: "white",
                  borderStyle: "solid",
                  transform: "scale(1.05)"
                }}
                onClick={() => onAddNode(linkedList.id)}
                style={{ lineHeight: '1', textTransform: 'uppercase' }}
              >
                Add Node
              </Box>
            </>
          )}
        </Box>
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
