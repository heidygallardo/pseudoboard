'use client';

import React from 'react';
import { useRef, useState, useEffect } from 'react';
import { useCanvas } from '@/contexts/CanvasContext';
import './Grid.css';

const PALETTE_ICON = (
  <svg width="18" height="18" viewBox="0 0 20 20" fill="none" style={{ display: 'block' }}>
    <circle cx="10" cy="10" r="9" stroke="#888" strokeWidth="1.5" fill="#fff"/>
    <circle cx="7" cy="8" r="1.2" fill="#888"/>
    <circle cx="13" cy="8" r="1.2" fill="#888"/>
    <circle cx="8" cy="13" r="1.2" fill="#888"/>
    <circle cx="12" cy="13" r="1.2" fill="#888"/>
  </svg>
);

// Define a Queue type for better type safety
interface QueueElement {
  value: string;
  index: number;
}
interface Queue {
  id: string;
  x: number;
  y: number;
  elements: QueueElement[];
  width: number;
  height: number;
  cellSize: number;
  style: 'textbook' | 'doodle';
  position: 'front-to-rear' | 'rear-to-front';
  frontLabel?: string;
  rearLabel?: string;
}

// Define types for arrays and stacks
interface ArrayElement {
  value: string;
  index: number;
}
interface ArrayType {
  id: string;
  x: number;
  y: number;
  elements: ArrayElement[];
  width: number;
  height: number;
  cellSize: number;
  style: 'textbook' | 'doodle';
  patternType: 'none' | 'two-pointers' | 'sliding-window';
  pointers?: any[]; // TODO: Define pointer type if needed
}
interface StackElement {
  value: string;
  index: number;
}
interface StackType {
  id: string;
  x: number;
  y: number;
  elements: StackElement[];
  width: number;
  height: number;
  cellSize: number;
  cellWidth: number;
  cellHeight: number;
  style: 'textbook' | 'doodle';
}

const Canvas: React.FC = () => {
  const canvasRef = useRef<HTMLDivElement>(null);
  const { activeTool, zoom, position, setPosition, strokes, addStroke, arrays, addArray, updateArrayStyle, updateArrayPatternType, updateArrayPointer, addArrayPointer, removeArrayPointer, setActiveTool, setArrays, stacks, addStack, updateStackStyle, setStacks } = useCanvas();
  const [dragging, setDragging] = useState(false);
  const [start, setStart] = useState({ x: 0, y: 0 });
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentStroke, setCurrentStroke] = useState<{ x: number; y: number }[]>([]);
  const [arrayPreview, setArrayPreview] = useState<{ x: number; y: number } | null>(null);
  const [hoveredArrayId, setHoveredArrayId] = useState<string | null>(null);
  const [openPopoverId, setOpenPopoverId] = useState<string | null>(null);
  const [popoverHover, setPopoverHover] = useState<string | null>(null);
  const [draggingArrayId, setDraggingArrayId] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isActuallyDragging, setIsActuallyDragging] = useState(false);
  const [editingCell, setEditingCell] = useState<null | { arrayId: string; cellIndex: number; field: 'value' | 'index'; value: string }> (null);
  const [stackPreview, setStackPreview] = useState<{ x: number; y: number } | null>(null);
  const [hoveredStackId, setHoveredStackId] = useState<string | null>(null);
  const [openStackPopoverId, setOpenStackPopoverId] = useState<string | null>(null);
  const [stackPopoverHover, setStackPopoverHover] = useState<string | null>(null);
  const [draggingStackId, setDraggingStackId] = useState<string | null>(null);
  const [stackDragOffset, setStackDragOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isActuallyDraggingStack, setIsActuallyDraggingStack] = useState(false);
  const [editingStackCell, setEditingStackCell] = useState<null | { stackId: string; cellIndex: number; field: 'value'; value: string }> (null);
  const [queues, setQueues] = useState<Queue[]>([]);
  const [editingQueueCell, setEditingQueueCell] = useState<null | { queueId: string; cellIndex: number; value: string }>(null);
  const [draggingQueueId, setDraggingQueueId] = useState<string | null>(null);
  const [queueDragOffset, setQueueDragOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isActuallyDraggingQueue, setIsActuallyDraggingQueue] = useState(false);
  const [hoveredQueueId, setHoveredQueueId] = useState<string | null>(null);
  const [openQueuePopoverId, setOpenQueuePopoverId] = useState<string | null>(null);
  const [queuePopoverHover, setQueuePopoverHover] = useState<string | null>(null);
  const [draggingPointerId, setDraggingPointerId] = useState<string | null>(null);
  const [pointerDragOffset, setPointerDragOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [editingPointer, setEditingPointer] = useState<null | { arrayId: string; pointerId: string; value: string }> (null);
  const [highlightColor, setHighlightColor] = useState<string>('rgba(37, 99, 235, 0.2)'); // Default blue

  const updateQueueStyle = (id: string, style: 'textbook' | 'doodle') => {
    setQueues(queues.map(q => q.id === id ? { ...q, style } : q));
  };

  const updateQueuePosition = (id: string, position: 'front-to-rear' | 'rear-to-front') => {
    setQueues(queues.map(q => q.id === id ? { ...q, position } : q));
  };

  // Close popover on outside click
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (!(e.target as HTMLElement).closest('.array-style-popover')) {
        setOpenPopoverId(null);
      }
    };
    if (openPopoverId) {
      document.addEventListener('mousedown', handleClick);
      return () => document.removeEventListener('mousedown', handleClick);
    }
  }, [openPopoverId]);

  // Handle array dragging
  useEffect(() => {
    if (!draggingArrayId) return;
    let moved = false;
    const handleMouseMove = (e: MouseEvent) => {
      moved = true;
      setIsActuallyDragging(true);
      const arr = arrays.find(a => a.id === draggingArrayId);
      if (!arr) return;
      const containerRect = canvasRef.current?.getBoundingClientRect();
      if (!containerRect) return;
      const mouseX = e.clientX - containerRect.left;
      const mouseY = e.clientY - containerRect.top;
      const newX = (mouseX - dragOffset.x - position.x) / zoom;
      const newY = (mouseY - dragOffset.y - position.y) / zoom;
      setArrays(arrays.map(a => a.id === draggingArrayId ? { ...a, x: newX, y: newY } : a));
    };
    const handleMouseUp = (e: MouseEvent) => {
      setDraggingArrayId(null);
      setTimeout(() => setIsActuallyDragging(false), 100);
      // Prevent accidental text selection
      if (moved) {
        window.getSelection()?.removeAllRanges();
      }
    };
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [draggingArrayId, dragOffset, arrays, setArrays, position.x, position.y, zoom]);

  // Handle stack dragging
  useEffect(() => {
    if (!draggingStackId) return;
    let moved = false;
    const handleMouseMove = (e: MouseEvent) => {
      moved = true;
      setIsActuallyDraggingStack(true);
      const stack = stacks.find(s => s.id === draggingStackId);
      if (!stack) return;
      const containerRect = canvasRef.current?.getBoundingClientRect();
      if (!containerRect) return;
      const mouseX = e.clientX - containerRect.left;
      const mouseY = e.clientY - containerRect.top;
      const newX = (mouseX - stackDragOffset.x - position.x) / zoom;
      const newY = (mouseY - stackDragOffset.y - position.y) / zoom;
      setStacks(stacks.map(s => s.id === draggingStackId ? { ...s, x: newX, y: newY } : s));
    };
    const handleMouseUp = (e: MouseEvent) => {
      setDraggingStackId(null);
      setTimeout(() => setIsActuallyDraggingStack(false), 100);
      if (moved) {
        window.getSelection()?.removeAllRanges();
      }
    };
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [draggingStackId, stackDragOffset, stacks, setStacks, position.x, position.y, zoom]);

  // Handle queue dragging
  useEffect(() => {
    if (!draggingQueueId) return;
    let moved = false;
    const handleMouseMove = (e: MouseEvent) => {
      moved = true;
      setIsActuallyDraggingQueue(true);
      const queue = queues.find(q => q.id === draggingQueueId);
      if (!queue) return;
      const containerRect = canvasRef.current?.getBoundingClientRect();
      if (!containerRect) return;
      const mouseX = e.clientX - containerRect.left;
      const mouseY = e.clientY - containerRect.top;
      const newX = (mouseX - queueDragOffset.x - position.x) / zoom;
      const newY = (mouseY - queueDragOffset.y - position.y) / zoom;
      setQueues(queues.map(q => q.id === draggingQueueId ? { ...q, x: newX, y: newY } : q));
    };
    const handleMouseUp = (e: MouseEvent) => {
      setDraggingQueueId(null);
      setTimeout(() => setIsActuallyDraggingQueue(false), 100);
      if (moved) {
        window.getSelection()?.removeAllRanges();
      }
    };
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [draggingQueueId, queueDragOffset, queues, position.x, position.y, zoom]);

  // Handle pointer dragging
  useEffect(() => {
    if (!draggingPointerId) return;
    let moved = false;
    const handleMouseMove = (e: MouseEvent) => {
      moved = true;
      const containerRect = canvasRef.current?.getBoundingClientRect();
      if (!containerRect) return;
      const mouseX = e.clientX - containerRect.left;
      const mouseY = e.clientY - containerRect.top;
      const newX = (mouseX - pointerDragOffset.x - position.x) / zoom;
      const newY = (mouseY - pointerDragOffset.y - position.y) / zoom;
      
      // Find the array and pointer
      const array = arrays.find(arr => arr.pointers?.some(ptr => ptr.id === draggingPointerId));
      if (!array || !array.pointers) return;
      const pointer = array.pointers.find(ptr => ptr.id === draggingPointerId);
      if (!pointer) return;
      
      updateArrayPointer(array.id, draggingPointerId, { x: newX, y: newY });
    };
    const handleMouseUp = (e: MouseEvent) => {
      setDraggingPointerId(null);
      if (moved) {
        window.getSelection()?.removeAllRanges();
      }
    };
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [draggingPointerId, pointerDragOffset, arrays, updateArrayPointer, position.x, position.y, zoom]);

  const getRelativePos = (e: React.MouseEvent | MouseEvent) => {
    const containerRect = canvasRef.current?.getBoundingClientRect();
    if (!containerRect) return { x: 0, y: 0 };
    
    // Get mouse position relative to the container
    const containerX = e.clientX - containerRect.left;
    const containerY = e.clientY - containerRect.top;
    
    // Convert to canvas coordinates (accounting for transform)
    return {
      x: (containerX - position.x) / zoom,
      y: (containerY - position.y) / zoom
    };
  };

  const createDefaultArray = (x: number, y: number) => {
    const cellSize = 60;
    const defaultElements = [
      { value: '', index: 0 },
    ];
    return {
      id: Date.now().toString(),
      x,
      y,
      elements: defaultElements,
      width: defaultElements.length * cellSize,
      height: cellSize,
      cellSize,
      style: 'textbook' as 'textbook',
      patternType: 'none' as 'none',
      pointers: [],
    };
  };

  // Add a new cell to an array by id
  const addArrayCell = (arrayId: string) => {
    const arr = arrays.find(a => a.id === arrayId);
    if (!arr) return;
    
    // Find the highest index value among existing cells
    const maxIndex = Math.max(...arr.elements.map(el => el.index), -1);
    const newIndex = maxIndex + 1;
    
    const newElements = [
      ...arr.elements,
      { value: '', index: newIndex },
    ];
    const newWidth = newElements.length * arr.cellSize;
    // Update the array in context
    const updated = arrays.map(a => a.id === arrayId ? { ...a, elements: newElements, width: newWidth } : a);
    setArrays(updated);
  };

  // Delete a cell from an array by id and index
  const deleteArrayCell = (arrayId: string, cellIndex: number) => {
    const arr = arrays.find(a => a.id === arrayId);
    if (!arr || arr.elements.length <= 1) return; // Don't delete if only one cell remains
    
    const newElements = arr.elements.filter((_, index) => index !== cellIndex);
    // Update indices for remaining elements
    const updatedElements = newElements.map((el, index) => ({ ...el, index }));
    const newWidth = updatedElements.length * arr.cellSize;
    
    // Update the array in context
    const updated = arrays.map(a => a.id === arrayId ? { ...a, elements: updatedElements, width: newWidth } : a);
    setArrays(updated);
  };

  // Update cell value or index
  const updateCell = (arrayId: string, cellIndex: number, field: 'value' | 'index', newValue: string) => {
    setArrays(arrays.map(arr => {
      if (arr.id !== arrayId) return arr;
      const newElements = arr.elements.map((el, idx) => {
        if (idx !== cellIndex) return el;
        if (field === 'value') {
          return { ...el, value: newValue };
        } else {
          // For index, update index (as number if possible)
          const idxNum = parseInt(newValue, 10);
          return { ...el, index: isNaN(idxNum) ? el.index : idxNum };
        }
      });
      return { ...arr, elements: newElements };
    }));
  };

  const handlePatternTypeChange = (arrayId: string, patternType: 'none' | 'two-pointers' | 'sliding-window') => {
    const array = arrays.find(arr => arr.id === arrayId);
    if (!array) return;

    updateArrayPatternType(arrayId, patternType);

    if (patternType === 'two-pointers' || patternType === 'sliding-window') {
      // Remove existing pointers
      if (array.pointers) {
        array.pointers.forEach(ptr => removeArrayPointer(arrayId, ptr.id));
      }

      // Create left pointer
      const leftPointer = {
        id: `left-${Date.now()}`,
        name: 'L',
        position: 'left' as const,
        x: array.x + 20, // Center over first cell
        y: array.y - 60  // Position above array
      };
      addArrayPointer(arrayId, leftPointer);

      // Create right pointer
      const rightPointer = {
        id: `right-${Date.now()}`,
        name: 'R',
        position: 'right' as const,
        x: array.x + array.width - 40, // Center over last cell
        y: array.y - 60  // Position above array
      };
      addArrayPointer(arrayId, rightPointer);
    } else {
      // Remove all pointers for other pattern types
      if (array.pointers) {
        array.pointers.forEach(ptr => removeArrayPointer(arrayId, ptr.id));
      }
    }
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (activeTool === 'move') {
      setDragging(true);
      setStart({ x: e.clientX - position.x, y: e.clientY - position.y });
    } else if (activeTool === 'draw') {
      setIsDrawing(true);
      const pos = getRelativePos(e);
      setCurrentStroke([pos]);
    } else if (activeTool === 'array') {
      const pos = getRelativePos(e);
      const newArray = createDefaultArray(pos.x, pos.y);
      addArray(newArray);
      setActiveTool('move');
    } else if (activeTool === 'stack') {
      const pos = getRelativePos(e);
      const newStack = createDefaultStack(pos.x, pos.y);
      addStack(newStack);
      setActiveTool('move');
    } else if (activeTool === 'queue') {
      const pos = getRelativePos(e);
      const newQueue = createDefaultQueue(pos.x, pos.y);
      addQueue(newQueue);
      setActiveTool('move');
    }
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (activeTool === 'move' && dragging) {
      setPosition({ x: e.clientX - start.x, y: e.clientY - start.y });
    } else if (activeTool === 'draw' && isDrawing) {
      const pos = getRelativePos(e);
      setCurrentStroke(prev => [...prev, pos]);
    } else if (activeTool === 'array') {
      const pos = getRelativePos(e);
      setArrayPreview(pos);
    } else if (activeTool === 'stack') {
      const pos = getRelativePos(e);
      setStackPreview(pos);
    } else if (activeTool === 'queue') {
      const pos = getRelativePos(e);
      setArrayPreview(pos);
    }
  };

  const handleMouseUp = () => {
    if (activeTool === 'move') {
      setDragging(false);
    } else if (activeTool === 'draw' && isDrawing) {
      setIsDrawing(false);
      if (currentStroke.length > 1) {
        addStroke({
          id: Date.now().toString(),
          points: currentStroke,
          color: '#000000',
          width: 2
        });
      }
      setCurrentStroke([]);
    }
  };

  useEffect(() => {
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [dragging, start, activeTool, isDrawing, currentStroke]);

  const createPath = (points: { x: number; y: number }[]) => {
    if (points.length < 2) return '';
    
    let path = `M ${points[0].x} ${points[0].y}`;
    for (let i = 1; i < points.length; i++) {
      path += ` L ${points[i].x} ${points[i].y}`;
    }
    return path;
  };

  // Helper to render a 3D sketch rectangle (now takes optional color overrides)
  function Sketch3DRect({x, y, w, h, seed, mainStroke, sideStroke}: {x: number, y: number, w: number, h: number, seed: number, mainStroke?: string, sideStroke?: string}) {
    function wobblyRectPath(x: number, y: number, w: number, h: number, seed: number, offset = 0) {
      function rand(n: number, scale = 2.5) {
        return Math.sin(seed * 999 + n * 77 + offset * 13) * scale;
      }
      return [
        `M${x+rand(1)},${y+rand(2)}`,
        `L${x+w+rand(3)},${y+rand(4)}`,
        `L${x+w+rand(5)},${y+h+rand(6)}`,
        `L${x+rand(7)},${y+h+rand(8)}`,
        'Z'
      ].join(' ');
    }
    function wobbly3DSidePath(x: number, y: number, w: number, h: number, seed: number, offset = 0, depth = 8) {
      function rand(n: number, scale = 2) {
        return Math.sin(seed * 555 + n * 33 + offset * 17) * scale;
      }
      return [
        `M${x+w+rand(1)},${y+rand(2)}`,
        `L${x+w+depth+rand(3)},${y+depth+rand(4)}`,
        `L${x+w+depth+rand(5)},${y+h+depth+rand(6)}`,
        `L${x+w+rand(7)},${y+h+rand(8)}`,
        `M${x+rand(9)},${y+h+rand(10)}`,
        `L${x+w+rand(11)},${y+h+rand(12)}`,
        `L${x+w+depth+rand(13)},${y+h+depth+rand(14)}`,
        `L${x+depth+rand(15)},${y+h+depth+rand(16)}`
      ].join(' ');
    }
    return (
      <g>
        {/* Main face (optionally gray border) */}
        <path d={wobblyRectPath(x, y, w, h, seed, 0)} fill="none" stroke={mainStroke || '#222'} strokeWidth="1.3" />
        {/* 3D right and bottom sides (optionally lighter gray) */}
        <path d={wobbly3DSidePath(x, y, w, h, seed, 0, 8)} fill="none" stroke={sideStroke || '#888'} strokeWidth="1.1" opacity="0.7" />
      </g>
    );
  }

  // Render sliding window highlight
  const renderSlidingWindowHighlight = (array: any) => {
    const { id, pointers, patternType, x, y, cellSize, elements } = array;
    if (patternType !== 'sliding-window' || !pointers || pointers.length < 2) return null;
    
    const leftPointer = pointers.find((p: any) => p.position === 'left');
    const rightPointer = pointers.find((p: any) => p.position === 'right');
    
    if (!leftPointer || !rightPointer) return null;
    
    // Calculate which cells are between the pointers
    const leftCellIndex = Math.floor((leftPointer.x - x) / cellSize);
    const rightCellIndex = Math.floor((rightPointer.x - x) / cellSize);
    
    // Ensure valid indices
    const startIndex = Math.max(0, Math.min(leftCellIndex, rightCellIndex));
    const endIndex = Math.min(elements.length - 1, Math.max(leftCellIndex, rightCellIndex));
    
    // Render highlight for cells between pointers
    return elements.map((element: any, index: number) => {
      if (index < startIndex || index > endIndex) return null;
      
      const cellX = x + index * cellSize;
      const cellY = y;
      
      return (
        <rect
          key={`highlight-${index}`}
          x={cellX}
          y={cellY}
          width={cellSize}
          height={cellSize}
          fill={highlightColor}
          stroke="none"
          style={{ pointerEvents: 'none' }}
        />
      );
    });
  };

  // Render pointers for arrays
  const renderArrayPointers = (array: any) => {
    const { id, pointers } = array;
    if (!pointers || pointers.length === 0) return null;
    
    return pointers.map((pointer: any) => {
      const isEditingPointer = editingPointer && editingPointer.arrayId === id && editingPointer.pointerId === pointer.id;
      
      const handlePointerMouseDown = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (activeTool !== 'move') return;
        if (e.button !== 0) return;
        
        const containerRect = canvasRef.current?.getBoundingClientRect();
        if (!containerRect) return;
        const mouseX = e.clientX - containerRect.left;
        const mouseY = e.clientY - containerRect.top;
        setDraggingPointerId(pointer.id);
        setPointerDragOffset({ x: mouseX - (pointer.x * zoom + position.x), y: mouseY - (pointer.y * zoom + position.y) });
      };

      return (
        <g key={pointer.id} onMouseDown={handlePointerMouseDown}>
          {/* Pointer name above arrow */}
          {isEditingPointer ? (
            <foreignObject x={pointer.x - 5} y={pointer.y - 5} width={30} height={20}>
                              <input
                  type="text"
                  value={editingPointer.value}
                  autoFocus
                  style={{ 
                    width: '100%', 
                    height: '100%', 
                    fontSize: 12, 
                    fontWeight: 'bold',
                    textAlign: 'center', 
                    border: '1px solid #000000', 
                    outline: 'none', 
                    background: '#fff', 
                    color: '#000000', 
                    fontFamily: 'sans-serif',
                    borderRadius: '3px'
                  }}
                onChange={e => setEditingPointer({ ...editingPointer, value: e.target.value })}
                onBlur={() => { 
                  updateArrayPointer(id, pointer.id, { name: editingPointer.value }); 
                  setEditingPointer(null); 
                }}
                onKeyDown={e => { 
                  if (e.key === 'Enter') { 
                    updateArrayPointer(id, pointer.id, { name: editingPointer.value }); 
                    setEditingPointer(null); 
                  } 
                }}
              />
            </foreignObject>
          ) : (
            <text
              x={pointer.x + 10}
              y={pointer.y + 5}
              textAnchor="middle"
              dominantBaseline="middle"
              fontSize="12"
              fontWeight="bold"
              fill="#000000"
              fontFamily="sans-serif"
              style={{ cursor: 'pointer' }}
              onClick={e => { 
                e.stopPropagation(); 
                setEditingPointer({ arrayId: id, pointerId: pointer.id, value: pointer.name }); 
              }}
            >
              {pointer.name}
            </text>
          )}
          
          {/* Minimalistic arrow pointing down to cell */}
          {/* Arrow shaft */}
          <line
            x1={pointer.x + 10}
            y1={pointer.y + 15}
            x2={pointer.x + 10}
            y2={pointer.y + 35}
            stroke="#000000"
            strokeWidth="1.5"
            style={{ cursor: 'move' }}
          />
          {/* Minimalistic arrow head pointing down */}
          <line
            x1={pointer.x + 10}
            y1={pointer.y + 35}
            x2={pointer.x + 5}
            y2={pointer.y + 30}
            stroke="#000000"
            strokeWidth="1.5"
            style={{ cursor: 'move' }}
          />
          <line
            x1={pointer.x + 10}
            y1={pointer.y + 35}
            x2={pointer.x + 15}
            y2={pointer.y + 30}
            stroke="#000000"
            strokeWidth="1.5"
            style={{ cursor: 'move' }}
          />
        </g>
      );
    });
  };

  const renderArray = (array: any) => {
    const { x, y, elements, cellSize, width, height, style, id, pointers } = array;
    // Palette icon position (to the right of the ghost cell)
    const ghostCellX = x + elements.length * cellSize;
    const ghostCellY = y;
    const iconX = ghostCellX + cellSize + 8;
    const iconY = y + cellSize / 2 - 12; // vertically centered with cells
    // Popover position
    const popoverX = iconX + 28;
    const popoverY = iconY - 8;
    // Show palette icon only on hover
    const showPalette = hoveredArrayId === id;
    // Show popover if openPopoverId === id
    const showPopover = openPopoverId === id;
    // Palette icon button (show popover on hover)
    const paletteButton = (
      <foreignObject x={iconX} y={iconY} width={24} height={24} style={{ overflow: 'visible', cursor: 'pointer' }}>
        <div
          style={{ width: 24, height: 24, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 12, background: '#fff', boxShadow: '0 1px 4px rgba(0,0,0,0.10)', border: '1px solid #eee' }}
          onMouseEnter={() => setOpenPopoverId(id)}
          onMouseLeave={() => setTimeout(() => { if (!popoverHover) setOpenPopoverId(null); }, 100) }
        >
          {PALETTE_ICON}
        </div>
      </foreignObject>
    );
    // Popover with style options (show on hover)
    const stylePopover = openPopoverId === id && (
      <foreignObject x={popoverX} y={popoverY} width={170} height={240} className="array-style-popover" style={{ overflow: 'visible', zIndex: 10 }}>
        <div
          style={{ minWidth: 150, background: '#fff', borderRadius: 10, boxShadow: '0 4px 16px rgba(0,0,0,0.13)', border: '1px solid #eee', padding: '12px 16px', fontSize: 14 }}
          onMouseEnter={() => setPopoverHover(id)}
          onMouseLeave={() => { setPopoverHover(null); setOpenPopoverId(null); }}
        >
          <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 10, color: '#222' }}>Array Style</div>
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6, cursor: 'pointer', borderRadius: 6, padding: '3px 4px', background: style === 'textbook' ? '#f3f4f6' : 'transparent' }}>
            <input type="radio" name={`array-style-${id}`} value="textbook" checked={style === 'textbook'} onChange={() => updateArrayStyle(id, 'textbook')} style={{ accentColor: '#2563eb' }} />
            <span style={{ fontWeight: 500, color: '#222' }}>Textbook Style</span>
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6, cursor: 'pointer', borderRadius: 6, padding: '3px 4px', background: style === 'doodle' ? '#f3f4f6' : 'transparent' }}>
            <input type="radio" name={`array-style-${id}`} value="doodle" checked={style === 'doodle'} onChange={() => updateArrayStyle(id, 'doodle')} style={{ accentColor: '#2563eb' }} />
            <span style={{ fontWeight: 500, color: '#222' }}>Doodle Style</span>
          </label>
          
          <div style={{ borderTop: '1px solid #eee', marginTop: 10, paddingTop: 10, fontWeight: 600, fontSize: 14, marginBottom: 10, color: '#222' }}>Pattern Visualization</div>
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6, cursor: 'pointer', borderRadius: 6, padding: '3px 4px', background: (array.patternType || 'none') === 'two-pointers' ? '#f3f4f6' : 'transparent' }}>
            <input type="radio" name={`array-pattern-${id}`} value="two-pointers" checked={(array.patternType || 'none') === 'two-pointers'} onChange={() => handlePatternTypeChange(id, 'two-pointers')} style={{ accentColor: '#2563eb' }} />
            <span style={{ fontWeight: 500, color: '#222' }}>Two Pointers</span>
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', borderRadius: 6, padding: '3px 4px', background: (array.patternType || 'none') === 'sliding-window' ? '#f3f4f6' : 'transparent' }}>
            <input type="radio" name={`array-pattern-${id}`} value="sliding-window" checked={(array.patternType || 'none') === 'sliding-window'} onChange={() => handlePatternTypeChange(id, 'sliding-window')} style={{ accentColor: '#2563eb' }} />
            <span style={{ fontWeight: 500, color: '#222' }}>Sliding Window</span>
          </label>
          
          {/* Color picker for sliding window highlight */}
          {(array.patternType === 'sliding-window') && (
            <>
              <div style={{ borderTop: '1px solid #eee', marginTop: 10, paddingTop: 10, fontWeight: 600, fontSize: 14, marginBottom: 8, color: '#222' }}>Highlight Color</div>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {[
                  { color: 'rgba(37, 99, 235, 0.2)', name: 'Blue' },
                  { color: 'rgba(239, 68, 68, 0.2)', name: 'Red' },
                  { color: 'rgba(34, 197, 94, 0.2)', name: 'Green' },
                  { color: 'rgba(245, 158, 11, 0.2)', name: 'Orange' },
                  { color: 'rgba(168, 85, 247, 0.2)', name: 'Purple' },
                  { color: 'rgba(236, 72, 153, 0.2)', name: 'Pink' },
                  { color: 'rgba(6, 182, 212, 0.2)', name: 'Cyan' },
                  { color: 'rgba(132, 204, 22, 0.2)', name: 'Lime' },
                  { color: 'rgba(15, 23, 42, 0.2)', name: 'Dark Blue' },
                  { color: 'rgba(127, 29, 29, 0.2)', name: 'Dark Red' },
                  { color: 'rgba(21, 128, 61, 0.2)', name: 'Dark Green' },
                  { color: 'rgba(154, 52, 18, 0.2)', name: 'Dark Orange' },
                  { color: 'rgba(88, 28, 135, 0.2)', name: 'Dark Purple' },
                  { color: 'rgba(157, 23, 77, 0.2)', name: 'Dark Pink' },
                  { color: 'rgba(14, 116, 144, 0.2)', name: 'Dark Cyan' }
                ].map((colorOption) => (
                  <div
                    key={colorOption.color}
                    style={{
                      width: 20,
                      height: 20,
                      borderRadius: '50%',
                      background: colorOption.color,
                      border: highlightColor === colorOption.color ? '2px solid #2563eb' : '1px solid #ddd',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                    onClick={() => setHighlightColor(colorOption.color)}
                    title={colorOption.name}
                  />
                ))}
              </div>
            </>
          )}
        </div>
      </foreignObject>
    );
    // Mouse event handlers for hover
    const handleGroupMouseEnter = () => setHoveredArrayId(id);
    const handleGroupMouseLeave = () => setHoveredArrayId(current => (current === id ? null : current));
    // Ghost cell (for adding new cells)
    const ghostCell = (
      <g
        style={{ cursor: 'pointer' }}
        onClick={e => { e.stopPropagation(); addArrayCell(id); }}
      >
        <rect
          x={ghostCellX}
          y={ghostCellY}
          width={cellSize}
          height={cellSize}
          fill="transparent"
          stroke="#999"
          strokeWidth="1"
          rx="4"
        />
        <text
          x={ghostCellX + cellSize / 2}
          y={ghostCellY + cellSize / 2 + 4}
          textAnchor="middle"
          dominantBaseline="middle"
          fontSize="24"
          fill="#999"
          fontFamily="sans-serif"
          fontStyle="italic"
        >
          +
        </text>
      </g>
    );
    // Drag handlers
    const handleArrayMouseDown = (e: React.MouseEvent) => {
      // Prevent drag if clicking ghost cell or palette/popover or text
      const target = e.target as HTMLElement;
      if (
        target.closest('.array-style-popover') ||
        (target.tagName === 'text') ||
        (target.tagName === 'tspan') ||
        (target.tagName === 'INPUT') ||
        (target.closest('foreignObject'))
      ) {
        return;
      }
      // Only allow dragging in move mode
      if (activeTool !== 'move') {
        return;
      }
      // Only left mouse button
      if (e.button !== 0) return;
      const containerRect = canvasRef.current?.getBoundingClientRect();
      if (!containerRect) return;
      const mouseX = e.clientX - containerRect.left;
      const mouseY = e.clientY - containerRect.top;
      setDraggingArrayId(id);
      setDragOffset({ x: mouseX - (x * zoom + position.x), y: mouseY - (y * zoom + position.y) });
    };
    // Drag shadow/highlight
    const dragging = draggingArrayId === id && isActuallyDragging;
    const groupStyle: React.CSSProperties = {
      pointerEvents: 'auto',
      cursor: 'move',
      filter: dragging ? 'drop-shadow(0 4px 16px rgba(0,0,0,0.18))' : undefined,
      transition: dragging ? 'none' : 'filter 0.18s',
      zIndex: dragging ? 10 : undefined,
      userSelect: dragging ? 'none' : undefined,
    };
    if (style === 'doodle') {
      return (
        <g key={id} onMouseEnter={handleGroupMouseEnter} onMouseLeave={handleGroupMouseLeave} style={groupStyle} onMouseDown={handleArrayMouseDown}>
          {ghostCell}
          {paletteButton}
          {stylePopover}
          {/* Transparent background for dragging */}
          <rect
            x={x}
            y={y}
            width={width}
            height={height}
            fill="transparent"
            stroke="none"
          />
          {/* Minimalistic doodle-style container (slightly wavy rectangle, no fill) */}
          <path
            d={`M${x+4},${y+2} L${x+width-4},${y-2} Q${x+width+2},${y+height/2} ${x+width-2},${y+height-4} L${x+4},${y+height-2} Q${x-2},${y+height/2} ${x+4},${y+2}`}
            fill="none"
            stroke="#222"
            strokeWidth="1.2"
          />
          {/* Minimalistic doodle-style cells (no fill) */}
          {elements.map((element: any, index: number) => {
            const cellX = x + index * cellSize;
            const cellY = y;
            // Editing value
            const isEditingValue = editingCell && editingCell.arrayId === id && editingCell.cellIndex === index && editingCell.field === 'value';
            // Editing index
            const isEditingIndex = editingCell && editingCell.arrayId === id && editingCell.cellIndex === index && editingCell.field === 'index';
            return (
              <g key={index}>
                {/* Slightly wavy cell border */}
                <path
                  d={`M${cellX+4},${cellY+2} L${cellX+cellSize-4},${cellY-2} Q${cellX+cellSize+2},${cellY+cellSize/2} ${cellX+cellSize-2},${cellY+cellSize-4} L${cellX+4},${cellY+cellSize-2} Q${cellX-2},${cellY+cellSize/2} ${cellX+4},${cellY+2}`}
                  fill="none"
                  stroke="#222"
                  strokeWidth="1"
                />
                {/* Editable value */}
                {isEditingValue ? (
                  <foreignObject x={cellX + cellSize * 0.1} y={cellY + cellSize * 0.25} width={cellSize * 0.8} height={cellSize * 0.5}>
                    <input
                      type="text"
                      value={editingCell.value}
                      autoFocus
                      style={{ width: '100%', fontSize: 16, fontStyle: 'italic', textAlign: 'center', border: '1px solid #bbb', borderRadius: 4, outline: 'none', background: '#fff', color: '#222', fontFamily: 'sans-serif' }}
                      onChange={e => setEditingCell({ ...editingCell, value: e.target.value })}
                      onBlur={() => { updateCell(id, index, 'value', editingCell.value); setEditingCell(null); }}
                      onKeyDown={e => { if (e.key === 'Enter') { updateCell(id, index, 'value', editingCell.value); setEditingCell(null); } }}
                    />
                  </foreignObject>
                ) : (
                  <>
                    {/* Transparent background for easier clicking */}
                    <rect
                      x={cellX + cellSize * 0.1}
                      y={cellY + cellSize * 0.1}
                      width={cellSize * 0.8}
                      height={cellSize * 0.8}
                      fill="transparent"
                      stroke="none"
                      style={{ cursor: 'pointer' }}
                      onClick={e => { 
                        e.stopPropagation(); 
                        console.log('Cell value background clicked:', { arrayId: id, cellIndex: index, value: element.value });
                        setEditingCell({ arrayId: id, cellIndex: index, field: 'value', value: element.value }); 
                      }}
                    />
                    <text
                      x={cellX + cellSize / 2}
                      y={cellY + cellSize / 2 + 5}
                      textAnchor="middle"
                      dominantBaseline="middle"
                      fontSize="16"
                      fontStyle="italic"
                      fill="#222"
                      fontFamily="sans-serif"
                      style={{ cursor: 'pointer', pointerEvents: 'none' }}
                      onMouseEnter={e => { e.currentTarget.style.fill = '#0066cc'; e.currentTarget.style.textDecoration = 'underline'; }}
                      onMouseLeave={e => { e.currentTarget.style.fill = '#222'; e.currentTarget.style.textDecoration = 'none'; }}
                    >
                      {element.value}
                    </text>
                  </>
                )}
                {/* Editable index */}
                {isEditingIndex ? (
                  <foreignObject x={cellX + cellSize * 0.25} y={cellY + cellSize + 2} width={cellSize * 0.5} height={18}>
                    <input
                      type="text"
                      value={editingCell.value}
                      autoFocus
                      style={{ width: '100%', fontSize: 12, fontStyle: 'italic', textAlign: 'center', border: '1px solid #bbb', borderRadius: 4, outline: 'none', background: '#fff', color: '#222', fontFamily: 'sans-serif' }}
                      onChange={e => setEditingCell({ ...editingCell, value: e.target.value })}
                      onBlur={() => { updateCell(id, index, 'index', editingCell.value); setEditingCell(null); }}
                      onKeyDown={e => { if (e.key === 'Enter') { updateCell(id, index, 'index', editingCell.value); setEditingCell(null); } }}
                    />
                  </foreignObject>
                ) : (
                  <text
                    x={cellX + cellSize / 2}
                    y={cellY + cellSize + 15}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    fontSize="12"
                    fill="#222"
                    fontFamily="sans-serif"
                    fontStyle="italic"
                    style={{ cursor: 'pointer' }}
                    onMouseEnter={e => { e.currentTarget.style.fill = '#0066cc'; e.currentTarget.style.textDecoration = 'underline'; }}
                    onMouseLeave={e => { e.currentTarget.style.fill = '#222'; e.currentTarget.style.textDecoration = 'none'; }}
                    onClick={e => { 
                      e.stopPropagation(); 
                      console.log('Cell index clicked:', { arrayId: id, cellIndex: index, index: element.index });
                      setEditingCell({ arrayId: id, cellIndex: index, field: 'index', value: element.index.toString() }); 
                    }}
                  >
                    {element.index}
                  </text>
                )}
                {/* Delete button (minus sign) - only show if more than 1 cell */}
                {elements.length > 1 && (
                  <g
                    style={{ cursor: 'pointer' }}
                    onClick={e => { 
                      e.stopPropagation(); 
                      console.log('Delete cell clicked:', { arrayId: id, cellIndex: index });
                      deleteArrayCell(id, index); 
                    }}
                  >
                    <circle
                      cx={cellX + cellSize - 6}
                      cy={cellY + 6}
                      r="6"
                      fill="transparent"
                      stroke="#999"
                      strokeWidth="1"
                    />
                    <text
                      x={cellX + cellSize - 6}
                      y={cellY + 6}
                      textAnchor="middle"
                      dominantBaseline="middle"
                      fontSize="10"
                      fill="#999"
                      style={{ pointerEvents: 'none' }}
                    >
                      −
                    </text>
                  </g>
                )}
              </g>
            );
          })}
          {/* Minimalistic ghost cell (no fill, just border) */}
          {(() => {
            const ghostCellX = x + elements.length * cellSize;
            const ghostCellY = y;
            return (
              <g
                style={{ cursor: 'pointer' }}
                onClick={e => { e.stopPropagation(); addArrayCell(id); }}
              >
                <path
                  d={`M${ghostCellX+4},${ghostCellY+2} L${ghostCellX+cellSize-4},${ghostCellY-2} Q${ghostCellX+cellSize+2},${ghostCellY+cellSize/2} ${ghostCellX+cellSize-2},${ghostCellY+cellSize-4} L${ghostCellX+4},${ghostCellY+cellSize-2} Q${ghostCellX-2},${ghostCellY+cellSize/2} ${ghostCellX+4},${ghostCellY+2}`}
                  fill="none"
                  stroke="#999"
                  strokeWidth="1"
                />
                <text
                  x={ghostCellX + cellSize / 2}
                  y={ghostCellY + cellSize / 2 + 4}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fontSize="24"
                  fill="#999"
                  fontFamily="sans-serif"
                  fontStyle="italic"
                >
                  +
                </text>
              </g>
            );
          })()}
          {/* Render sliding window highlight */}
          {renderSlidingWindowHighlight(array)}
          {/* Render pointers */}
          {renderArrayPointers(array)}
        </g>
      );
    }
    // Textbook style (default)
    return (
      <g key={id} onMouseEnter={handleGroupMouseEnter} onMouseLeave={handleGroupMouseLeave} style={groupStyle} onMouseDown={handleArrayMouseDown}>
        {ghostCell}
        {paletteButton}
        {stylePopover}
        {/* Array container */}
        <rect
          x={x}
          y={y}
          width={width}
          height={height}
          fill="white"
          stroke="#222"
          strokeWidth="2"
          rx="4"
        />
        {/* Array elements */}
        {elements.map((element: any, index: number) => {
          const cellX = x + index * cellSize;
          const cellY = y;
          // Editing value
          const isEditingValue = editingCell && editingCell.arrayId === id && editingCell.cellIndex === index && editingCell.field === 'value';
          // Editing index
          const isEditingIndex = editingCell && editingCell.arrayId === id && editingCell.cellIndex === index && editingCell.field === 'index';
          return (
            <g key={index}>
              {/* Cell border */}
              <rect
                x={cellX}
                y={cellY}
                width={cellSize}
                height={cellSize}
                fill="white"
                stroke="#222"
                strokeWidth="1"
              />
              {/* Editable value */}
              {isEditingValue ? (
                <foreignObject x={cellX + cellSize * 0.1} y={cellY + cellSize * 0.25} width={cellSize * 0.8} height={cellSize * 0.5}>
                  <input
                    type="text"
                    value={editingCell.value}
                    autoFocus
                    style={{ width: '100%', fontSize: 16, fontStyle: 'italic', textAlign: 'center', border: '1px solid #bbb', borderRadius: 4, outline: 'none', background: '#fff', color: '#222', fontFamily: 'sans-serif' }}
                    onChange={e => setEditingCell({ ...editingCell, value: e.target.value })}
                    onBlur={() => { updateCell(id, index, 'value', editingCell.value); setEditingCell(null); }}
                    onKeyDown={e => { if (e.key === 'Enter') { updateCell(id, index, 'value', editingCell.value); setEditingCell(null); } }}
                  />
                </foreignObject>
              ) : (
                <>
                  {/* Transparent background for easier clicking */}
                  <rect
                    x={cellX + cellSize * 0.1}
                    y={cellY + cellSize * 0.1}
                    width={cellSize * 0.8}
                    height={cellSize * 0.8}
                    fill="transparent"
                    stroke="none"
                    style={{ cursor: 'pointer' }}
                    onClick={e => { 
                      e.stopPropagation(); 
                      console.log('Cell value background clicked:', { arrayId: id, cellIndex: index, value: element.value });
                      setEditingCell({ arrayId: id, cellIndex: index, field: 'value', value: element.value }); 
                    }}
                  />
                  <text
                    x={cellX + cellSize / 2}
                    y={cellY + cellSize / 2 + 5}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    fontSize="16"
                    fontStyle="italic"
                    fill="#222"
                    fontFamily="sans-serif"
                    style={{ cursor: 'pointer', pointerEvents: 'none' }}
                    onMouseEnter={e => { e.currentTarget.style.fill = '#0066cc'; e.currentTarget.style.textDecoration = 'underline'; }}
                    onMouseLeave={e => { e.currentTarget.style.fill = '#222'; e.currentTarget.style.textDecoration = 'none'; }}
                  >
                    {element.value}
                  </text>
                </>
              )}
              {/* Editable index */}
              {isEditingIndex ? (
                <foreignObject x={cellX + cellSize * 0.25} y={cellY + cellSize + 2} width={cellSize * 0.5} height={18}>
                  <input
                    type="text"
                    value={editingCell.value}
                    autoFocus
                    style={{ width: '100%', fontSize: 12, fontStyle: 'italic', textAlign: 'center', border: '1px solid #bbb', borderRadius: 4, outline: 'none', background: '#fff', color: '#222', fontFamily: 'sans-serif' }}
                    onChange={e => setEditingCell({ ...editingCell, value: e.target.value })}
                    onBlur={() => { updateCell(id, index, 'index', editingCell.value); setEditingCell(null); }}
                    onKeyDown={e => { if (e.key === 'Enter') { updateCell(id, index, 'index', editingCell.value); setEditingCell(null); } }}
                  />
                </foreignObject>
              ) : (
                <text
                  x={cellX + cellSize / 2}
                  y={cellY + cellSize + 15}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fontSize="12"
                  fill="#222"
                  fontFamily="sans-serif"
                  fontStyle="italic"
                  style={{ cursor: 'pointer' }}
                  onMouseEnter={e => { e.currentTarget.style.fill = '#0066cc'; e.currentTarget.style.textDecoration = 'underline'; }}
                  onMouseLeave={e => { e.currentTarget.style.fill = '#222'; e.currentTarget.style.textDecoration = 'none'; }}
                  onClick={e => { 
                    e.stopPropagation(); 
                    console.log('Cell index clicked:', { arrayId: id, cellIndex: index, index: element.index });
                    setEditingCell({ arrayId: id, cellIndex: index, field: 'index', value: element.index.toString() }); 
                  }}
                >
                  {element.index}
                </text>
              )}
              {/* Delete button (minus sign) - only show if more than 1 cell */}
              {elements.length > 1 && (
                <g
                  style={{ cursor: 'pointer' }}
                  onClick={e => { 
                    e.stopPropagation(); 
                    console.log('Delete cell clicked:', { arrayId: id, cellIndex: index });
                    deleteArrayCell(id, index); 
                  }}
                >
                  <circle
                    cx={cellX + cellSize - 6}
                    cy={cellY + 6}
                    r="6"
                    fill="transparent"
                    stroke="#999"
                    strokeWidth="1"
                  />
                  <text
                    x={cellX + cellSize - 6}
                    y={cellY + 6}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    fontSize="10"
                    fill="#999"
                    style={{ pointerEvents: 'none' }}
                  >
                    −
                  </text>
                </g>
              )}
            </g>
          );
        })}
        {/* Render sliding window highlight */}
        {renderSlidingWindowHighlight(array)}
        {/* Render pointers */}
        {renderArrayPointers(array)}
      </g>
    );
  };

  const createDefaultStack = (x: number, y: number) => {
    const cellWidth = 100; // wider for rectangular look
    const cellHeight = 60;
    const defaultElements = [
      { value: '', index: 0 },
    ];
    return {
      id: Date.now().toString() + '-stack',
      x,
      y,
      elements: defaultElements,
      width: cellWidth,
      height: defaultElements.length * cellHeight,
      cellSize: cellWidth, // for compatibility with rest of code
      cellWidth,
      cellHeight,
      style: 'textbook' as 'textbook',
    };
  };

  const addStackCell = (stackId: string) => {
    const stack = stacks.find(s => s.id === stackId);
    if (!stack) return;
    const maxIndex = Math.max(...stack.elements.map(el => el.index), -1);
    const newIndex = maxIndex + 1;
    const newElements = [
      ...stack.elements,
      { value: '', index: newIndex },
    ];
    const newHeight = newElements.length * stack.cellSize;
    const updated = stacks.map(s => s.id === stackId ? { ...s, elements: newElements, height: newHeight } : s);
    setStacks(updated);
  };

  const deleteStackCell = (stackId: string, cellIndex: number) => {
    const stack = stacks.find(s => s.id === stackId);
    if (!stack) return;
    // Allow deleting even if only one cell remains
    const newElements = stack.elements.filter((_, index) => index !== cellIndex);
    // Update indices for remaining elements
    const updatedElements = newElements.map((el, index) => ({ ...el, index }));
    const newHeight = updatedElements.length * (typeof (stack as any).cellHeight === 'number' ? (stack as any).cellHeight : stack.cellSize);
    const updated = stacks.map(s => s.id === stackId ? { ...s, elements: updatedElements, height: newHeight } : s);
    setStacks(updated);
  };

  const updateStackCell = (stackId: string, cellIndex: number, newValue: string) => {
    setStacks(stacks.map(stack => {
      if (stack.id !== stackId) return stack;
      const newElements = stack.elements.map((el, idx) => {
        if (idx !== cellIndex) return el;
        return { ...el, value: newValue };
      });
      return { ...stack, elements: newElements };
    }));
  };

  // Stack rendering (copied from array, but vertical and minimalistic)
  const renderStack = (stack: any, stackIdx: number, stacksArr: any[]) => {
    const { x, y, elements, cellWidth, cellHeight, style, id } = stack;
    // Place ghost cell and palette at the top
    const ghostCellX = x;
    const ghostCellY = y - cellHeight;
    const iconX = x + cellWidth / 2 - 12;
    const iconY = ghostCellY - 32; // above the ghost cell
    const popoverX = iconX + 28;
    const popoverY = iconY - 8;
    const showPalette = hoveredStackId === id;
    const showPopover = openStackPopoverId === id;
    const paletteButton = (
      <foreignObject x={iconX} y={iconY} width={24} height={24} style={{ overflow: 'visible', cursor: 'pointer' }}>
        <div
          style={{ width: 24, height: 24, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 12, background: '#fff', boxShadow: '0 1px 4px rgba(0,0,0,0.10)', border: '1px solid #eee' }}
          onMouseEnter={() => setOpenStackPopoverId(id)}
          onMouseLeave={() => setTimeout(() => { if (!stackPopoverHover) setOpenStackPopoverId(null); }, 100) }
        >
          {PALETTE_ICON}
        </div>
      </foreignObject>
    );
    const stylePopover = openStackPopoverId === id && (
      <foreignObject x={popoverX} y={popoverY} width={170} height={90} className="array-style-popover" style={{ overflow: 'visible', zIndex: 10 }}>
        <div
          style={{ minWidth: 150, background: '#fff', borderRadius: 10, boxShadow: '0 4px 16px rgba(0,0,0,0.13)', border: '1px solid #eee', padding: '12px 16px', fontSize: 14 }}
          onMouseEnter={() => setStackPopoverHover(id)}
          onMouseLeave={() => { setStackPopoverHover(null); setOpenStackPopoverId(null); }}
        >
          <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 10, color: '#222' }}>Stack Style</div>
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6, cursor: 'pointer', borderRadius: 6, padding: '3px 4px', background: style === 'textbook' ? '#f3f4f6' : 'transparent' }}>
            <input type="radio" name={`stack-style-${id}`} value="textbook" checked={style === 'textbook'} onChange={() => updateStackStyle(id, 'textbook')} style={{ accentColor: '#2563eb' }} />
            <span style={{ fontWeight: 500, color: '#222' }}>Textbook Style</span>
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', borderRadius: 6, padding: '3px 4px', background: style === 'doodle' ? '#f3f4f6' : 'transparent' }}>
            <input type="radio" name={`stack-style-${id}`} value="doodle" checked={style === 'doodle'} onChange={() => updateStackStyle(id, 'doodle')} style={{ accentColor: '#2563eb' }} />
            <span style={{ fontWeight: 500, color: '#222' }}>Doodle Style</span>
          </label>
        </div>
      </foreignObject>
    );
    const handleGroupMouseEnter = () => setHoveredStackId(id);
    const handleGroupMouseLeave = () => setHoveredStackId(current => (current === id ? null : current));
    const ghostCell = (
      <g
        style={{ cursor: 'pointer' }}
        onClick={e => { e.stopPropagation(); addStackCell(id); }}
      >
        {style === 'doodle' ? (
          <>
            {/* 3D hand-drawn ghost cell box with gray fill and gray border to match textbook style */}
            <g>
              <rect
                x={ghostCellX}
                y={ghostCellY}
                width={cellWidth}
                height={cellHeight}
                fill="#f3f4f6"
                stroke="none"
                rx="6"
              />
              <Sketch3DRect x={ghostCellX} y={ghostCellY} w={cellWidth} h={cellHeight} seed={-1} mainStroke="#bbb" sideStroke="#d1d5db" />
            </g>
            {/* 3D hand-drawn plus sign (smaller, gray) */}
            <g>
              <path d={`M${ghostCellX + cellWidth/2},${ghostCellY + cellHeight/2 - 5} L${ghostCellX + cellWidth/2},${ghostCellY + cellHeight/2 + 5}`} stroke="#bbb" strokeWidth="2.2" strokeLinecap="round" />
              <path d={`M${ghostCellX + cellWidth/2 - 5},${ghostCellY + cellHeight/2} L${ghostCellX + cellWidth/2 + 5},${ghostCellY + cellHeight/2}`} stroke="#bbb" strokeWidth="2.2" strokeLinecap="round" />
              <path d={`M${ghostCellX + cellWidth/2 + 2},${ghostCellY + cellHeight/2 - 3} L${ghostCellX + cellWidth/2 + 2},${ghostCellY + cellHeight/2 + 7}`} stroke="#e5e7eb" strokeWidth="1.2" strokeLinecap="round" opacity="0.7" />
              <path d={`M${ghostCellX + cellWidth/2 - 3},${ghostCellY + cellHeight/2 + 2} L${ghostCellX + cellWidth/2 + 7},${ghostCellY + cellHeight/2 + 2}`} stroke="#e5e7eb" strokeWidth="1.2" strokeLinecap="round" opacity="0.7" />
            </g>
          </>
        ) : (
          <rect
            x={ghostCellX}
            y={ghostCellY}
            width={cellWidth}
            height={cellHeight}
            fill="white"
            stroke="#999"
            strokeWidth="1"
            rx="4"
          />
        )}
        {style !== 'doodle' && (
          <text
            x={ghostCellX + cellWidth / 2}
            y={ghostCellY + cellHeight / 2 + 4}
            textAnchor="middle"
            dominantBaseline="middle"
            fontSize="24"
            fill="#999"
            fontFamily="sans-serif"
            fontStyle="italic"
          >
            +
          </text>
        )}
      </g>
    );
    const handleStackMouseDown = (e: React.MouseEvent) => {
      const target = e.target as HTMLElement;
      if (
        target.closest('.array-style-popover') ||
        (target.tagName === 'text') ||
        (target.tagName === 'tspan') ||
        (target.tagName === 'INPUT') ||
        (target.closest('foreignObject'))
      ) {
        return;
      }
      if (activeTool !== 'move') {
        return;
      }
      if (e.button !== 0) return;
      const containerRect = canvasRef.current?.getBoundingClientRect();
      if (!containerRect) return;
      const mouseX = e.clientX - containerRect.left;
      const mouseY = e.clientY - containerRect.top;
      setDraggingStackId(id);
      setStackDragOffset({ x: mouseX - (x * zoom + position.x), y: mouseY - (y * zoom + position.y) });
    };
    const dragging = draggingStackId === id && isActuallyDraggingStack;
    const groupStyle: React.CSSProperties = {
      pointerEvents: 'auto',
      cursor: 'move',
      filter: dragging ? 'drop-shadow(0 4px 16px rgba(0,0,0,0.18))' : undefined,
      transition: dragging ? 'none' : 'filter 0.18s',
      zIndex: dragging ? 10 : undefined,
      userSelect: dragging ? 'none' : undefined,
    };
    if (style === 'doodle') {
      if (elements.length === 0) {
        return (
          <g key={id} onMouseEnter={handleGroupMouseEnter} onMouseLeave={handleGroupMouseLeave} style={groupStyle} onMouseDown={handleStackMouseDown}>
            {ghostCell}
            {paletteButton}
            {stylePopover}
          </g>
        );
      }
      return (
        <g key={id} onMouseEnter={handleGroupMouseEnter} onMouseLeave={handleGroupMouseLeave} style={groupStyle} onMouseDown={handleStackMouseDown}>
          {ghostCell}
          {paletteButton}
          {stylePopover}
          {/* 3D hand-drawn sketch effect rectangle container */}
          <Sketch3DRect x={x} y={y} w={cellWidth} h={cellHeight} seed={0} />
          {/* 3D hand-drawn sketch effect rectangle cells */}
          {elements.map((element: any, index: number) => {
            const cellX = x;
            const cellY = y + (elements.length - 1 - index) * cellHeight;
            const isEditingValue = editingStackCell && editingStackCell.stackId === id && editingStackCell.cellIndex === index && editingStackCell.field === 'value';
            const maxIndex = Math.max(-1, ...elements.map((el: any) => el.index));
            return (
              <g key={index}>
                <Sketch3DRect x={cellX} y={cellY} w={cellWidth} h={cellHeight} seed={index+1} />
                {isEditingValue ? (
                  <foreignObject x={cellX + cellWidth * 0.1} y={cellY + cellHeight * 0.25} width={cellWidth * 0.8} height={cellHeight * 0.5}>
                    <input
                      type="text"
                      value={editingStackCell.value}
                      autoFocus
                      style={{ width: '100%', fontSize: 16, fontStyle: 'italic', textAlign: 'center', border: '1px solid #bbb', borderRadius: 4, outline: 'none', background: '#fff', color: '#222', fontFamily: 'sans-serif' }}
                      onChange={e => setEditingStackCell({ ...editingStackCell, value: e.target.value })}
                      onBlur={() => { updateStackCell(id, index, editingStackCell.value); setEditingStackCell(null); }}
                      onKeyDown={e => { if (e.key === 'Enter') { updateStackCell(id, index, editingStackCell.value); setEditingStackCell(null); } }}
                    />
                  </foreignObject>
                ) : (
                  <>
                    <rect
                      x={cellX + cellWidth * 0.1}
                      y={cellY + cellHeight * 0.1}
                      width={cellWidth * 0.8}
                      height={cellHeight * 0.8}
                      fill="transparent"
                      stroke="none"
                      style={{ cursor: 'pointer' }}
                      onClick={e => { 
                        e.stopPropagation(); 
                        setEditingStackCell({ stackId: id, cellIndex: index, field: 'value', value: element.value }); 
                      }}
                    />
                    <text
                      x={cellX + cellWidth / 2}
                      y={cellY + cellHeight / 2 + 5}
                      textAnchor="middle"
                      dominantBaseline="middle"
                      fontSize="16"
                      fontStyle="italic"
                      fill="#222"
                      fontFamily="sans-serif"
                      style={{ cursor: 'pointer', pointerEvents: 'none' }}
                    >
                      {element.value}
                    </text>
                  </>
                )}
                {element.index === maxIndex && (
                  <g
                    style={{ cursor: 'pointer' }}
                    onClick={e => { 
                      e.stopPropagation(); 
                      deleteStackCell(id, index); 
                    }}
                  >
                    <circle
                      cx={cellX + cellWidth - 6}
                      cy={cellY + 6}
                      r="6"
                      fill="transparent"
                      stroke="#999"
                      strokeWidth="1"
                    />
                    <text
                      x={cellX + cellWidth - 6}
                      y={cellY + 6}
                      textAnchor="middle"
                      dominantBaseline="middle"
                      fontSize="10"
                      fill="#999"
                      style={{ pointerEvents: 'none' }}
                    >
                      −
                    </text>
                  </g>
                )}
              </g>
            );
          })}
        </g>
      );
    }
    return (
      <g key={id} onMouseEnter={handleGroupMouseEnter} onMouseLeave={handleGroupMouseLeave} style={groupStyle} onMouseDown={handleStackMouseDown}>
        {/* Place ghost cell and palette at the top */}
        {ghostCell}
        {paletteButton}
        {stylePopover}
        {/* Stack container */}
        <rect
          x={x}
          y={y}
          width={cellWidth}
          height={cellHeight}
          fill="white"
          stroke="#222"
          strokeWidth="2"
          rx="4"
        />
        {/* Stack elements (vertical) */}
        {elements.map((element: any, index: number) => {
          const cellX = x;
          const cellY = y + (elements.length - 1 - index) * cellHeight;
          const isEditingValue = editingStackCell && editingStackCell.stackId === id && editingStackCell.cellIndex === index && editingStackCell.field === 'value';
          // Before elements.map for textbook style
          const maxIndex = Math.max(-1, ...elements.map((el: any) => el.index));
          return (
            <g key={index}>
              {/* Cell border */}
              <rect
                x={cellX}
                y={cellY}
                width={cellWidth}
                height={cellHeight}
                fill="white"
                stroke="#222"
                strokeWidth="1"
              />
              {/* Editable value */}
              {isEditingValue ? (
                <foreignObject x={cellX + cellWidth * 0.1} y={cellY + cellHeight * 0.25} width={cellWidth * 0.8} height={cellHeight * 0.5}>
                  <input
                    type="text"
                    value={editingStackCell.value}
                    autoFocus
                    style={{ width: '100%', fontSize: 16, fontStyle: 'italic', textAlign: 'center', border: '1px solid #bbb', borderRadius: 4, outline: 'none', background: '#fff', color: '#222', fontFamily: 'sans-serif' }}
                    onChange={e => setEditingStackCell({ ...editingStackCell, value: e.target.value })}
                    onBlur={() => { updateStackCell(id, index, editingStackCell.value); setEditingStackCell(null); }}
                    onKeyDown={e => { if (e.key === 'Enter') { updateStackCell(id, index, editingStackCell.value); setEditingStackCell(null); } }}
                  />
                </foreignObject>
              ) : (
                <>
                  {/* Transparent background for easier clicking */}
                  <rect
                    x={cellX + cellWidth * 0.1}
                    y={cellY + cellHeight * 0.1}
                    width={cellWidth * 0.8}
                    height={cellHeight * 0.8}
                    fill="transparent"
                    stroke="none"
                    style={{ cursor: 'pointer' }}
                    onClick={e => { 
                      e.stopPropagation(); 
                      setEditingStackCell({ stackId: id, cellIndex: index, field: 'value', value: element.value }); 
                    }}
                  />
                  <text
                    x={cellX + cellWidth / 2}
                    y={cellY + cellHeight / 2 + 5}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    fontSize="16"
                    fontStyle="italic"
                    fill="#222"
                    fontFamily="sans-serif"
                    style={{ cursor: 'pointer', pointerEvents: 'none' }}
                  >
                    {element.value}
                  </text>
                </>
              )}
              {/* Delete button (minus sign) - only show if more than 1 cell and this is the topmost cell */}
              {element.index === maxIndex && (
                <g
                  style={{ cursor: 'pointer' }}
                  onClick={e => { 
                    e.stopPropagation(); 
                    deleteStackCell(id, index); 
                  }}
                >
                  <circle
                    cx={cellX + cellWidth - 6}
                    cy={cellY + 6}
                    r="6"
                    fill="transparent"
                    stroke="#999"
                    strokeWidth="1"
                  />
                  <text
                    x={cellX + cellWidth - 6}
                    y={cellY + 6}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    fontSize="10"
                    fill="#999"
                    style={{ pointerEvents: 'none' }}
                  >
                    −
                  </text>
                </g>
              )}
            </g>
          );
        })}
      </g>
    );
  };

  const createDefaultQueue = (x: number, y: number) => {
    const cellSize = 60;
    const defaultElements = [
      { value: '', index: 0 },
    ];
    return {
      id: Date.now().toString() + '-queue',
      x,
      y,
      elements: defaultElements,
      width: defaultElements.length * cellSize,
      height: cellSize,
      cellSize,
      style: 'textbook' as 'textbook',
      position: 'front-to-rear' as 'front-to-rear',
    };
  };

  const addQueue = (queue: any) => {
    setQueues(prev => [...prev, queue]);
  };

  const addQueueCell = (queueId: string) => {
    const queue = queues.find(q => q.id === queueId);
    if (!queue) return;
    const minIndex = Math.min(...queue.elements.map((el: any) => el.index), 0);
    const newIndex = minIndex - 1;
    const newElements = [
      { value: '', index: newIndex },
      ...queue.elements,
    ];
    const newWidth = newElements.length * queue.cellSize;
    setQueues(queues.map(q => q.id === queueId ? { ...q, elements: newElements, width: newWidth } : q));
  };

  const deleteQueueCell = (queueId: string, cellIndex: number) => {
    const queue = queues.find(q => q.id === queueId);
    if (!queue) return;
    const newElements = queue.elements.filter((_: any, idx: number) => idx !== cellIndex);
    // Update indices for remaining elements
    const updatedElements = newElements.map((el: any, idx: number) => ({ ...el, index: idx }));
    const newWidth = updatedElements.length * queue.cellSize;
    setQueues(queues.map(q => q.id === queueId ? { ...q, elements: updatedElements, width: newWidth } : q));
  };

  const updateQueueCell = (queueId: string, cellIndex: number, newValue: string) => {
    setQueues(queues.map(queue => {
      if (queue.id !== queueId) return queue;
      
      // Handle special cases for labels (cellIndex -1 for rear, -2 for front)
      if (cellIndex === -1) {
        // Determine which label to update based on position
        const isRearToFront = queue.position === 'rear-to-front';
        if (isRearToFront) {
          return { ...queue, rearLabel: newValue };
        } else {
          return { ...queue, frontLabel: newValue };
        }
      } else if (cellIndex === -2) {
        // Determine which label to update based on position
        const isRearToFront = queue.position === 'rear-to-front';
        if (isRearToFront) {
          return { ...queue, frontLabel: newValue };
        } else {
          return { ...queue, rearLabel: newValue };
        }
      }
      
      // Handle regular cell updates
      const newElements = queue.elements.map((el: any, idx: number) => idx === cellIndex ? { ...el, value: newValue } : el);
      return { ...queue, elements: newElements };
    }));
  };

  const renderQueue = (queue: any) => {
    const { x, y, elements, cellSize, width, height, style, id } = queue;
    
    // Get queue position setting from the current queue being rendered
    const queuePosition = queue.position || 'front-to-rear';
    
    // Calculate ghost cell and palette positions based on queue direction
    let ghostCellX, ghostCellY, iconX, iconY, popoverX, popoverY;
    if (queuePosition === 'rear-to-front') {
      // Rear-to-front: ghost cell and palette to the left of the first cell
      ghostCellX = x - cellSize;
      ghostCellY = y;
      iconX = ghostCellX - 8 - 24; // 8px gap, 24px icon width
      iconY = y + cellSize / 2 - 12;
      popoverX = iconX + 28;
      popoverY = iconY - 8;
    } else {
      // Front-to-rear: ghost cell and palette to the right of the last cell
      ghostCellX = x + elements.length * cellSize;
      ghostCellY = y;
      iconX = ghostCellX + cellSize + 8; // move palette to the right of the ghost cell
      iconY = y + cellSize / 2 - 12;
      popoverX = iconX + 28;
      popoverY = iconY - 8;
    }
    
    // Show palette icon only on hover
    const showPalette = hoveredQueueId === id;
    // Show popover if openQueuePopoverId === id
    const showPopover = openQueuePopoverId === id;
    // Palette icon button (show popover on hover)
    const paletteButton = (
      <foreignObject x={iconX} y={iconY} width={24} height={24} style={{ overflow: 'visible', cursor: 'pointer' }}>
        <div
          style={{ width: 24, height: 24, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 12, background: '#fff', boxShadow: '0 1px 4px rgba(0,0,0,0.10)', border: '1px solid #eee' }}
          onMouseEnter={() => setOpenQueuePopoverId(id)}
          onMouseLeave={() => setTimeout(() => { if (!queuePopoverHover) setOpenQueuePopoverId(null); }, 100) }
        >
          {PALETTE_ICON}
        </div>
      </foreignObject>
    );
    // Popover with style options (show on hover)
    const stylePopover = showPopover && (
      <foreignObject x={popoverX} y={popoverY} width={170} height={140} className="array-style-popover" style={{ overflow: 'visible', zIndex: 10 }}>
        <div
          style={{ minWidth: 150, background: '#fff', borderRadius: 10, boxShadow: '0 4px 16px rgba(0,0,0,0.13)', border: '1px solid #eee', padding: '12px 16px', fontSize: 14 }}
          onMouseEnter={() => setQueuePopoverHover(id)}
          onMouseLeave={() => { setQueuePopoverHover(null); setOpenQueuePopoverId(null); }}
        >
          <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 10, color: '#222' }}>Queue Style</div>
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6, cursor: 'pointer', borderRadius: 6, padding: '3px 4px', background: style === 'textbook' ? '#f3f4f6' : 'transparent' }}>
            <input type="radio" name={`queue-style-${id}`} value="textbook" checked={style === 'textbook'} onChange={() => updateQueueStyle(id, 'textbook')} style={{ accentColor: '#2563eb' }} />
            <span style={{ fontWeight: 500, color: '#222' }}>Textbook Style</span>
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16, cursor: 'pointer', borderRadius: 6, padding: '3px 4px', background: style === 'doodle' ? '#f3f4f6' : 'transparent' }}>
            <input type="radio" name={`queue-style-${id}`} value="doodle" checked={style === 'doodle'} onChange={() => updateQueueStyle(id, 'doodle')} style={{ accentColor: '#2563eb' }} />
            <span style={{ fontWeight: 500, color: '#222' }}>Doodle Style</span>
          </label>
          
          <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 10, color: '#222', marginTop: 8 }}>Queue Position</div>
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6, cursor: 'pointer', borderRadius: 6, padding: '3px 4px', background: (queue.position || 'front-to-rear') === 'front-to-rear' ? '#f3f4f6' : 'transparent' }}>
            <input type="radio" name={`queue-position-${id}`} value="front-to-rear" checked={(queue.position || 'front-to-rear') === 'front-to-rear'} onChange={() => updateQueuePosition(id, 'front-to-rear')} style={{ accentColor: '#2563eb' }} />
            <span style={{ fontWeight: 500, color: '#222' }}>Front-to-Rear</span>
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', borderRadius: 6, padding: '3px 4px', background: (queue.position || 'front-to-rear') === 'rear-to-front' ? '#f3f4f6' : 'transparent' }}>
            <input type="radio" name={`queue-position-${id}`} value="rear-to-front" checked={(queue.position || 'front-to-rear') === 'rear-to-front'} onChange={() => updateQueuePosition(id, 'rear-to-front')} style={{ accentColor: '#2563eb' }} />
            <span style={{ fontWeight: 500, color: '#222' }}>Rear-to-Front</span>
          </label>
        </div>
      </foreignObject>
    );
    // Mouse event handlers for hover
    const handleGroupMouseEnter = () => setHoveredQueueId(id);
    const handleGroupMouseLeave = () => setHoveredQueueId(current => (current === id ? null : current));
    
    // Check if there's only one cell (rear and front would overlap)
    const hasOnlyOneCell = elements.length === 1;
    
    // Only show labels if there are cells in the queue
    const hasCells = elements.length > 0;
    
    // Determine label positions based on queue position setting
    const isRearToFront = queuePosition === 'rear-to-front';
    

    
    // For rear-to-front: Rear on first cell, Front on last cell
    // For front-to-rear: Front on first cell, Rear on last cell
    const firstCellX = x;
    const lastCellX = x + (elements.length - 1) * cellSize;
    // Keep labels in their original positions, just change the text
    const rearLabelX = firstCellX;
    const frontLabelX = lastCellX;
    const rearLabelY = isRearToFront ? 16 : (hasOnlyOneCell ? 44 : 16);
    const frontLabelY = isRearToFront ? (hasOnlyOneCell ? 44 : 16) : 16;
    
    // For front-to-rear: swap the label texts to match the flipped layout
    const rearLabelText = isRearToFront ? (queue.rearLabel || 'Rear') : (queue.frontLabel || 'Front');
    const frontLabelText = isRearToFront ? (queue.frontLabel || 'Front') : (queue.rearLabel || 'Rear');
    
    // Editable label state
    const isEditingRear = editingQueueCell && editingQueueCell.queueId === id && editingQueueCell.cellIndex === -1;
    const isEditingFront = editingQueueCell && editingQueueCell.queueId === id && editingQueueCell.cellIndex === -2;
    
    // Common input styles for both labels
    const inputStyle = {
      width: '100%',
      fontSize: 16,
      fontWeight: 600,
      color: '#111',
      border: '1.5px solid #111',
      borderRadius: 5,
      textAlign: 'center' as const,
      background: '#fff',
      outline: 'none',
      fontFamily: 'sans-serif',
      padding: '2px 4px'
    };
    
    // Common text styles for both labels
    const textStyle = {
      cursor: 'pointer' as const,
      userSelect: 'none' as const,
      fontSize: 16,
      fontWeight: 600
    };
    
    // Create rear label
    const rearLabel = hasCells ? (isEditingRear ? (
      <foreignObject x={rearLabelX} y={y - (rearLabelY + 22)} width={cellSize} height={28}>
        <input
          type="text"
          value={editingQueueCell.value}
          autoFocus
          style={inputStyle}
          onChange={e => setEditingQueueCell({ ...editingQueueCell, value: e.target.value })}
          onBlur={() => { updateQueueCell(id, -1, editingQueueCell.value); setEditingQueueCell(null); }}
          onKeyDown={e => { if (e.key === 'Enter') { updateQueueCell(id, -1, editingQueueCell.value); setEditingQueueCell(null); } }}
        />
      </foreignObject>
    ) : (
      <text
        x={rearLabelX + cellSize / 2}
        y={y - rearLabelY}
        textAnchor="middle"
        fontSize="16"
        fontWeight="600"
        fill="#111"
        style={textStyle}
        onClick={e => { e.stopPropagation(); setEditingQueueCell({ queueId: id, cellIndex: -1, value: rearLabelText }); }}
      >
        {rearLabelText}
      </text>
    )) : null;
    
    // Create front label
    const frontLabel = hasCells ? (isEditingFront ? (
      <foreignObject x={frontLabelX} y={y - (frontLabelY + 22)} width={cellSize} height={28}>
        <input
          type="text"
          value={editingQueueCell.value}
          autoFocus
          style={inputStyle}
          onChange={e => setEditingQueueCell({ ...editingQueueCell, value: e.target.value })}
          onBlur={() => { updateQueueCell(id, -2, editingQueueCell.value); setEditingQueueCell(null); }}
          onKeyDown={e => { if (e.key === 'Enter') { updateQueueCell(id, -2, editingQueueCell.value); setEditingQueueCell(null); } }}
        />
      </foreignObject>
    ) : (
      <text
        x={frontLabelX + cellSize / 2}
        y={y - frontLabelY}
        textAnchor="middle"
        fontSize="16"
        fontWeight="600"
        fill="#111"
        style={textStyle}
        onClick={e => { e.stopPropagation(); setEditingQueueCell({ queueId: id, cellIndex: -2, value: frontLabelText }); }}
      >
        {frontLabelText}
      </text>
    )) : null;
    // Ghost cell (for adding new cells)
    let ghostCell;
    if (style === 'doodle') {
      ghostCell = (
        <g
          style={{ cursor: 'pointer' }}
          onClick={e => { e.stopPropagation(); addQueueCell(id); }}
        >
          {/* Doodle-style wavy rectangle for ghost cell, matching array doodle ghost cell */}
          <path
            d={`M${ghostCellX+4},${ghostCellY+2} L${ghostCellX+cellSize-4},${ghostCellY-2} Q${ghostCellX+cellSize+2},${ghostCellY+cellSize/2} ${ghostCellX+cellSize-2},${ghostCellY+cellSize-4} L${ghostCellX+4},${ghostCellY+cellSize-2} Q${ghostCellX-2},${ghostCellY+cellSize/2} ${ghostCellX+4},${ghostCellY+2}`}
            fill="none"
            stroke="#999"
            strokeWidth="1"
          />
          <text
            x={ghostCellX + cellSize / 2}
            y={ghostCellY + cellSize / 2 + 4}
            textAnchor="middle"
            dominantBaseline="middle"
            fontSize="24"
            fill="#999"
            fontFamily="sans-serif"
            fontStyle="italic"
          >
            +
          </text>
        </g>
      );
    } else {
      ghostCell = (
        <g
          style={{ cursor: 'pointer' }}
          onClick={e => { e.stopPropagation(); addQueueCell(id); }}
        >
          <rect
            x={ghostCellX}
            y={ghostCellY}
            width={cellSize}
            height={cellSize}
            fill="transparent"
            stroke="#999"
            strokeWidth="1"
            rx="4"
          />
          <text
            x={ghostCellX + cellSize / 2}
            y={ghostCellY + cellSize / 2 + 4}
            textAnchor="middle"
            dominantBaseline="middle"
            fontSize="24"
            fill="#999"
            fontFamily="sans-serif"
            fontStyle="italic"
          >
            +
          </text>
        </g>
      );
    }
    // Render order for ghost cell and palette button
    // For front-to-rear: + then palette; for rear-to-front: palette then +
    const ghostAndPalette = queuePosition === 'front-to-rear'
      ? (<React.Fragment>{ghostCell}{paletteButton}{stylePopover}</React.Fragment>)
      : (<React.Fragment>{paletteButton}{stylePopover}{ghostCell}</React.Fragment>);
    // Drag handlers
    const handleQueueMouseDown = (e: React.MouseEvent) => {
      // Prevent drag if clicking ghost cell or palette/popover or text
      const target = e.target as HTMLElement;
      if (
        target.closest('.array-style-popover') ||
        (target.tagName === 'text') ||
        (target.tagName === 'tspan') ||
        (target.tagName === 'INPUT') ||
        (target.closest('foreignObject'))
      ) {
        return;
      }
      // Only allow dragging in move mode
      if (activeTool !== 'move') {
        return;
      }
      // Only left mouse button
      if (e.button !== 0) return;
      const containerRect = canvasRef.current?.getBoundingClientRect();
      if (!containerRect) return;
      const mouseX = e.clientX - containerRect.left;
      const mouseY = e.clientY - containerRect.top;
      setDraggingQueueId(id);
      setQueueDragOffset({ x: mouseX - (x * zoom + position.x), y: mouseY - (y * zoom + position.y) });
    };
    // Drag shadow/highlight
    const dragging = draggingQueueId === id && isActuallyDraggingQueue;
    const groupStyle: React.CSSProperties = {
      pointerEvents: 'auto',
      cursor: 'move',
      filter: dragging ? 'drop-shadow(0 4px 16px rgba(0,0,0,0.18))' : undefined,
      transition: dragging ? 'none' : 'filter 0.18s',
      zIndex: dragging ? 10 : undefined,
      userSelect: dragging ? 'none' : undefined,
    };
    if (style === 'doodle') {
      if (elements.length === 0) {
        // Always show paletteButton and stylePopover to the left of the ghost cell
        return (
          <g key={id} style={{ pointerEvents: 'all' }}>
            {ghostAndPalette}
          </g>
        );
      }
      return (
        <g key={id} onMouseEnter={handleGroupMouseEnter} onMouseLeave={handleGroupMouseLeave} style={groupStyle} onMouseDown={handleQueueMouseDown}>
          {rearLabel}
          {frontLabel}
          {/* For rear-to-front, ghost+palette go before cells; for front-to-rear, after cells */}
          {isRearToFront && ghostAndPalette}
          {/* Transparent background for dragging */}
          <rect
            x={x}
            y={y}
            width={width}
            height={height}
            fill="transparent"
            stroke="none"
          />
          {/* Minimalistic doodle-style container (slightly wavy rectangle, no fill) */}
          <path
            d={`M${x+4},${y+2} L${x+width-4},${y-2} Q${x+width+2},${y+height/2} ${x+width-2},${y+height-4} L${x+4},${y+height-2} Q${x-2},${y+height/2} ${x+4},${y+2}`}
            fill="none"
            stroke="#222"
            strokeWidth="1.2"
          />
          {/* Minimalistic doodle-style cells (no fill) */}
          {elements.map((element: any, index: number) => {
            // For front-to-rear: flip the queue layout
            const actualIndex = isRearToFront ? index : (elements.length - 1 - index);
            const cellX = x + actualIndex * cellSize;
            const cellY = y;
            const isEditingValue = editingQueueCell && editingQueueCell.queueId === id && editingQueueCell.cellIndex === index;
            return (
              <g key={index}>
                {/* Slightly wavy cell border */}
                <path
                  d={`M${cellX+4},${cellY+2} L${cellX+cellSize-4},${cellY-2} Q${cellX+cellSize+2},${cellY+cellSize/2} ${cellX+cellSize-2},${cellY+cellSize-4} L${cellX+4},${cellY+cellSize-2} Q${cellX-2},${cellY+cellSize/2} ${cellX+4},${cellY+2}`}
                  fill="none"
                  stroke="#222"
                  strokeWidth="1"
                />
                {/* Editable value */}
                {isEditingValue ? (
                  <foreignObject x={cellX + cellSize * 0.1} y={cellY + cellSize * 0.25} width={cellSize * 0.8} height={cellSize * 0.5}>
                    <input
                      type="text"
                      value={editingQueueCell.value}
                      autoFocus
                      style={{ width: '100%', fontSize: 16, fontStyle: 'italic', textAlign: 'center', border: '1px solid #bbb', borderRadius: 4, outline: 'none', background: '#fff', color: '#222', fontFamily: 'sans-serif' }}
                      onChange={e => setEditingQueueCell({ ...editingQueueCell, value: e.target.value })}
                      onBlur={() => { updateQueueCell(id, index, editingQueueCell.value); setEditingQueueCell(null); }}
                      onKeyDown={e => { if (e.key === 'Enter') { updateQueueCell(id, index, editingQueueCell.value); setEditingQueueCell(null); } }}
                    />
                  </foreignObject>
                ) : (
                  <>
                    {/* Transparent background for easier clicking */}
                    <rect
                      x={cellX + cellSize * 0.1}
                      y={cellY + cellSize * 0.1}
                      width={cellSize * 0.8}
                      height={cellSize * 0.8}
                      fill="transparent"
                      stroke="none"
                      style={{ cursor: 'pointer' }}
                      onClick={e => { 
                        e.stopPropagation(); 
                        setEditingQueueCell({ queueId: id, cellIndex: index, value: element.value }); 
                      }}
                    />
                    <text
                      x={cellX + cellSize / 2}
                      y={cellY + cellSize / 2 + 5}
                      textAnchor="middle"
                      dominantBaseline="middle"
                      fontSize="16"
                      fontStyle="italic"
                      fill="#222"
                      fontFamily="sans-serif"
                      style={{ cursor: 'pointer', pointerEvents: 'none' }}
                    >
                      {element.value}
                    </text>
                  </>
                )}
                {index === elements.length - 1 && (
                  <g
                    style={{ cursor: 'pointer' }}
                    onClick={e => { e.stopPropagation(); deleteQueueCell(id, index); }}
                  >
                    <circle
                      cx={cellX + cellSize - 6}
                      cy={cellY + 6}
                      r="6"
                      fill="transparent"
                      stroke="#999"
                      strokeWidth="1"
                    />
                    <text
                      x={cellX + cellSize - 6}
                      y={cellY + 6}
                      textAnchor="middle"
                      dominantBaseline="middle"
                      fontSize="10"
                      fill="#999"
                      style={{ pointerEvents: 'none' }}
                    >
                      −
                    </text>
                  </g>
                )}
              </g>
            );
          })}
          {!isRearToFront && ghostAndPalette}
        </g>
      );
    }
    // Textbook style (default)
    return (
      <g key={id} onMouseEnter={handleGroupMouseEnter} onMouseLeave={handleGroupMouseLeave} style={groupStyle} onMouseDown={handleQueueMouseDown}>
        {rearLabel}
        {frontLabel}
        {/* For rear-to-front, ghost+palette go before cells; for front-to-rear, after cells */}
        {isRearToFront && ghostAndPalette}
        {/* Queue container */}
        <rect
          x={x}
          y={y}
          width={width}
          height={height}
          fill="white"
          stroke="#222"
          strokeWidth="2"
          rx="4"
        />
        {/* Queue elements */}
        {elements.map((element: any, index: number) => {
          // For front-to-rear: flip the queue layout
          const actualIndex = isRearToFront ? index : (elements.length - 1 - index);
          const cellX = x + actualIndex * cellSize;
          const cellY = y;
          const isEditingValue = editingQueueCell && editingQueueCell.queueId === id && editingQueueCell.cellIndex === index;
          return (
            <g key={index}>
              {/* Cell border */}
              <rect
                x={cellX}
                y={cellY}
                width={cellSize}
                height={cellSize}
                fill="white"
                stroke="#222"
                strokeWidth="1"
              />
              {/* Editable value */}
              {isEditingValue ? (
                <foreignObject x={cellX + cellSize * 0.1} y={cellY + cellSize * 0.25} width={cellSize * 0.8} height={cellSize * 0.5}>
                  <input
                    type="text"
                    value={editingQueueCell.value}
                    autoFocus
                    style={{ width: '100%', fontSize: 16, fontStyle: 'italic', textAlign: 'center', border: '1px solid #bbb', borderRadius: 4, outline: 'none', background: '#fff', color: '#222', fontFamily: 'sans-serif' }}
                    onChange={e => setEditingQueueCell({ ...editingQueueCell, value: e.target.value })}
                    onBlur={() => { updateQueueCell(id, index, editingQueueCell.value); setEditingQueueCell(null); }}
                    onKeyDown={e => { if (e.key === 'Enter') { updateQueueCell(id, index, editingQueueCell.value); setEditingQueueCell(null); } }}
                  />
                </foreignObject>
              ) : (
                <>
                  {/* Transparent background for easier clicking */}
                  <rect
                    x={cellX + cellSize * 0.1}
                    y={cellY + cellSize * 0.1}
                    width={cellSize * 0.8}
                    height={cellSize * 0.8}
                    fill="transparent"
                    stroke="none"
                    style={{ cursor: 'pointer' }}
                    onClick={e => { 
                      e.stopPropagation(); 
                      setEditingQueueCell({ queueId: id, cellIndex: index, value: element.value }); 
                    }}
                  />
                  <text
                    x={cellX + cellSize / 2}
                    y={cellY + cellSize / 2 + 5}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    fontSize="16"
                    fontStyle="italic"
                    fill="#222"
                    fontFamily="sans-serif"
                    style={{ cursor: 'pointer', pointerEvents: 'none' }}
                  >
                    {element.value}
                  </text>
                </>
              )}
              {index === elements.length - 1 && (
                <g
                  style={{ cursor: 'pointer' }}
                  onClick={e => { e.stopPropagation(); deleteQueueCell(id, index); }}
                >
                  <circle
                    cx={cellX + cellSize - 6}
                    cy={cellY + 6}
                    r="6"
                    fill="transparent"
                    stroke="#999"
                    strokeWidth="1"
                  />
                  <text
                    x={cellX + cellSize - 6}
                    y={cellY + 6}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    fontSize="10"
                    fill="#999"
                    style={{ pointerEvents: 'none' }}
                  >
                    −
                  </text>
                </g>
              )}
            </g>
          );
        })}
        {!isRearToFront && ghostAndPalette}
      </g>
    );
  };



  return (
    <div>
      {/* Canvas and SVG */}
      <div 
        ref={canvasRef}
        className="canvas-container"
        onMouseDown={handleMouseDown}
        style={{
          cursor: activeTool === 'move' ? (dragging ? 'grabbing' : 'grab') : 
                  activeTool === 'draw' ? 'crosshair' : 
                  activeTool === 'array' ? 'crosshair' : 
                  activeTool === 'stack' ? 'crosshair' : 
                  activeTool === 'queue' ? 'crosshair' : 'default',
        }}
      >
        <div
          className="canvas-background"
          style={{
            backgroundPosition: `${position.x}px ${position.y}px`,
            backgroundSize: `${40 * zoom}px ${40 * zoom}px`,
          }}
        />
        <div
          className="canvas-content"
          style={{
            transform: `translate(${position.x}px, ${position.y}px) scale(${zoom})`,
          }}
        >
          {/* Future content like shapes, text, etc. will go here */}
        </div>
        
        {/* SVG layer for drawings and arrays - positioned absolutely in container coordinates */}
        <svg
          width="100%"
          height="100%"
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            pointerEvents: 'none',
            overflow: 'visible'
          }}
        >
          <g transform={`translate(${position.x}, ${position.y}) scale(${zoom})`}>
            {/* Render completed strokes */}
            {strokes.map((stroke) => (
              <path
                key={stroke.id}
                d={createPath(stroke.points)}
                stroke={stroke.color}
                strokeWidth={stroke.width / zoom}
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            ))}
            
            {/* Render current stroke being drawn */}
            {isDrawing && currentStroke.length > 1 && (
              <path
                d={createPath(currentStroke)}
                stroke="#000000"
                strokeWidth={2 / zoom}
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            )}
            
            {/* Render arrays */}
            {arrays.map(renderArray)}
            {/* Render stacks */}
            {stacks.map((stack, idx) => renderStack(stack, idx, stacks))}
            
            {/* Render array preview when hovering */}
            {activeTool === 'array' && arrayPreview && (
              <g opacity="0.6">
                {renderArray(createDefaultArray(arrayPreview.x, arrayPreview.y))}
              </g>
            )}
            {/* Render stack preview when hovering */}
            {activeTool === 'stack' && stackPreview && (
              <g opacity="0.6">
                {renderStack(createDefaultStack(stackPreview.x, stackPreview.y), 0, stacks)}
              </g>
            )}
            {/* Render queues */}
            {queues.map(renderQueue)}
          </g>
        </svg>
      </div>
    </div>
  );
};

export default Canvas;
