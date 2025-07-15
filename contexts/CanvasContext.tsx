'use client';

import React, { createContext, useContext, useState, ReactNode } from 'react';

type Tool = 'move' | 'draw' | 'text' | 'shape' | 'datastructures' | 'array' | 'stack' | 'linkedlist';

interface DrawingStroke {
  id: string;
  points: { x: number; y: number }[];
  color: string;
  width: number;
}

interface ArrayElement {
  value: string;
  index: number;
}

interface ArrayDataStructure {
  id: string;
  x: number;
  y: number;
  elements: ArrayElement[];
  width: number;
  height: number;
  cellSize: number;
  style: 'textbook' | 'doodle';
}

type StackElement = { value: string; index: number };
interface StackDataStructure {
  id: string;
  x: number;
  y: number;
  elements: StackElement[];
  width: number;
  height: number;
  cellSize: number;
  style: 'textbook' | 'doodle';
}

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

interface CanvasContextType {
  activeTool: Tool;
  setActiveTool: (tool: Tool) => void;
  zoom: number;
  setZoom: (zoom: number) => void;
  position: { x: number; y: number };
  setPosition: (position: { x: number; y: number }) => void;
  strokes: DrawingStroke[];
  setStrokes: (strokes: DrawingStroke[]) => void;
  addStroke: (stroke: DrawingStroke) => void;
  arrays: ArrayDataStructure[];
  setArrays: (arrays: ArrayDataStructure[]) => void;
  addArray: (array: ArrayDataStructure) => void;
  updateArrayStyle: (id: string, style: 'textbook' | 'doodle') => void;
  stacks: StackDataStructure[];
  setStacks: (stacks: StackDataStructure[]) => void;
  addStack: (stack: StackDataStructure) => void;
  updateStackStyle: (id: string, style: 'textbook' | 'doodle') => void;
  linkedLists: LinkedListDataStructure[];
  setLinkedLists: (linkedLists: LinkedListDataStructure[]) => void;
  addLinkedList: (linkedList: LinkedListDataStructure) => void;
  updateLinkedListStyle: (id: string, style: 'textbook' | 'doodle') => void;
  updateLinkedListNodeShape: (id: string, nodeShape: 'rectangle' | 'circle') => void;
  addLinkedListNode: (linkedListId: string) => void;
  deleteLinkedListNode: (linkedListId: string, nodeId: string) => void;
  updateLinkedListNodeValue: (linkedListId: string, nodeId: string, value: string) => void;
  updateLinkedListNodeConnection: (linkedListId: string, nodeId: string, targetNodeId: string | null) => void;
  updateLinkedListHeadPointer: (linkedListId: string, nodeId: string | null) => void;
}

const CanvasContext = createContext<CanvasContextType | undefined>(undefined);

export const CanvasProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [activeTool, setActiveTool] = useState<Tool>('move');
  const [zoom, setZoom] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [strokes, setStrokes] = useState<DrawingStroke[]>([]);
  const [arrays, setArrays] = useState<ArrayDataStructure[]>([]);
  const [stacks, setStacks] = useState<StackDataStructure[]>([]);
  const [linkedLists, setLinkedLists] = useState<LinkedListDataStructure[]>([]);

  const addStroke = (stroke: DrawingStroke) => {
    setStrokes(prev => [...prev, stroke]);
  };

  const addArray = (array: ArrayDataStructure) => {
    setArrays(prev => [...prev, array]);
  };

  const updateArrayStyle = (id: string, style: 'textbook' | 'doodle') => {
    setArrays(prev => prev.map(arr => arr.id === id ? { ...arr, style } : arr));
  };

  const addStack = (stack: StackDataStructure) => {
    setStacks(prev => [...prev, stack]);
  };

  const updateStackStyle = (id: string, style: 'textbook' | 'doodle') => {
    setStacks(prev => prev.map(stack => stack.id === id ? { ...stack, style } : stack));
  };

  const addLinkedList = (linkedList: LinkedListDataStructure) => {
    setLinkedLists(prev => [...prev, linkedList]);
  };

  const updateLinkedListStyle = (id: string, style: 'textbook' | 'doodle') => {
    setLinkedLists(prev => prev.map(ll => ll.id === id ? { ...ll, style } : ll));
  };

  const updateLinkedListNodeShape = (id: string, nodeShape: 'rectangle' | 'circle') => {
    setLinkedLists(prev => prev.map(ll => ll.id === id ? { ...ll, nodeShape } : ll));
  };

  const addLinkedListNode = (linkedListId: string) => {
    setLinkedLists(prev => prev.map(ll => {
      if (ll.id === linkedListId) {
        const newNode: LinkedListNode = {
          id: `node-${Date.now()}-${Math.random()}`,
          value: '',
          next: null
        };
        return { ...ll, nodes: [...ll.nodes, newNode] };
      }
      return ll;
    }));
  };

  const deleteLinkedListNode = (linkedListId: string, nodeId: string) => {
    setLinkedLists(prev => prev.map(ll => {
      if (ll.id === linkedListId) {
        const updatedNodes = ll.nodes.filter(node => node.id !== nodeId);
        // Update any connections that pointed to the deleted node
        const cleanedNodes = updatedNodes.map(node => 
          node.next === nodeId ? { ...node, next: null } : node
        );
        // If the deleted node was the head, update head pointer
        const newHeadNodeId = ll.headNodeId === nodeId ? 
          (cleanedNodes.length > 0 ? cleanedNodes[0].id : null) : ll.headNodeId;
        return { ...ll, nodes: cleanedNodes, headNodeId: newHeadNodeId };
      }
      return ll;
    }));
  };

  const updateLinkedListNodeValue = (linkedListId: string, nodeId: string, value: string) => {
    setLinkedLists(prev => prev.map(ll => {
      if (ll.id === linkedListId) {
        const updatedNodes = ll.nodes.map(node => 
          node.id === nodeId ? { ...node, value } : node
        );
        return { ...ll, nodes: updatedNodes };
      }
      return ll;
    }));
  };

  const updateLinkedListNodeConnection = (linkedListId: string, nodeId: string, targetNodeId: string | null) => {
    setLinkedLists(prev => prev.map(ll => {
      if (ll.id === linkedListId) {
        const updatedNodes = ll.nodes.map(node => 
          node.id === nodeId ? { ...node, next: targetNodeId } : node
        );
        return { ...ll, nodes: updatedNodes };
      }
      return ll;
    }));
  };

  const updateLinkedListHeadPointer = (linkedListId: string, nodeId: string | null) => {
    setLinkedLists(prev => prev.map(ll => 
      ll.id === linkedListId ? { ...ll, headNodeId: nodeId } : ll
    ));
  };

  return (
    <CanvasContext.Provider
      value={{
        activeTool,
        setActiveTool,
        zoom,
        setZoom,
        position,
        setPosition,
        strokes,
        setStrokes,
        addStroke,
        arrays,
        setArrays,
        addArray,
        updateArrayStyle,
        stacks,
        setStacks,
        addStack,
        updateStackStyle,
        linkedLists,
        setLinkedLists,
        addLinkedList,
        updateLinkedListStyle,
        updateLinkedListNodeShape,
        addLinkedListNode,
        deleteLinkedListNode,
        updateLinkedListNodeValue,
        updateLinkedListNodeConnection,
        updateLinkedListHeadPointer,
      }}
    >
      {children}
    </CanvasContext.Provider>
  );
};

export const useCanvas = () => {
  const context = useContext(CanvasContext);
  if (context === undefined) {
    throw new Error('useCanvas must be used within a CanvasProvider');
  }
  return context;
};