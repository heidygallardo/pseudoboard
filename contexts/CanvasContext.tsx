'use client';

import React, { createContext, useContext, useState, ReactNode } from 'react';

type Tool = 'move' | 'draw' | 'text' | 'shape' | 'datastructures' | 'array' | 'stack';

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

interface ArrayPointer {
  id: string;
  name: string;
  position: 'left' | 'right';
  x: number;
  y: number;
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
  patternType?: 'none' | 'two-pointers' | 'sliding-window';
  pointers?: ArrayPointer[];
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
  updateArrayPatternType: (id: string, patternType: 'none' | 'two-pointers' | 'sliding-window') => void;
  updateArrayPointer: (arrayId: string, pointerId: string, updates: Partial<ArrayPointer>) => void;
  addArrayPointer: (arrayId: string, pointer: ArrayPointer) => void;
  removeArrayPointer: (arrayId: string, pointerId: string) => void;
  stacks: StackDataStructure[];
  setStacks: (stacks: StackDataStructure[]) => void;
  addStack: (stack: StackDataStructure) => void;
  updateStackStyle: (id: string, style: 'textbook' | 'doodle') => void;
}

const CanvasContext = createContext<CanvasContextType | undefined>(undefined);

export const CanvasProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [activeTool, setActiveTool] = useState<Tool>('move');
  const [zoom, setZoom] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [strokes, setStrokes] = useState<DrawingStroke[]>([]);
  const [arrays, setArrays] = useState<ArrayDataStructure[]>([]);
  const [stacks, setStacks] = useState<StackDataStructure[]>([]);

  const addStroke = (stroke: DrawingStroke) => {
    setStrokes(prev => [...prev, stroke]);
  };

  const addArray = (array: ArrayDataStructure) => {
    setArrays(prev => [...prev, array]);
  };

  const updateArrayStyle = (id: string, style: 'textbook' | 'doodle') => {
    setArrays(prev => prev.map(arr => arr.id === id ? { ...arr, style } : arr));
  };

  const updateArrayPatternType = (id: string, patternType: 'none' | 'two-pointers' | 'sliding-window') => {
    setArrays(prev => prev.map(arr => arr.id === id ? { ...arr, patternType } : arr));
  };

  const updateArrayPointer = (arrayId: string, pointerId: string, updates: Partial<ArrayPointer>) => {
    setArrays(prev => prev.map(arr => {
      if (arr.id !== arrayId || !arr.pointers) return arr;
      return {
        ...arr,
        pointers: arr.pointers.map(ptr => ptr.id === pointerId ? { ...ptr, ...updates } : ptr)
      };
    }));
  };

  const addArrayPointer = (arrayId: string, pointer: ArrayPointer) => {
    setArrays(prev => prev.map(arr => {
      if (arr.id !== arrayId) return arr;
      return {
        ...arr,
        pointers: [...(arr.pointers || []), pointer]
      };
    }));
  };

  const removeArrayPointer = (arrayId: string, pointerId: string) => {
    setArrays(prev => prev.map(arr => {
      if (arr.id !== arrayId || !arr.pointers) return arr;
      return {
        ...arr,
        pointers: arr.pointers.filter(ptr => ptr.id !== pointerId)
      };
    }));
  };

  const addStack = (stack: StackDataStructure) => {
    setStacks(prev => [...prev, stack]);
  };

  const updateStackStyle = (id: string, style: 'textbook' | 'doodle') => {
    setStacks(prev => prev.map(stack => stack.id === id ? { ...stack, style } : stack));
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
        updateArrayPatternType,
        updateArrayPointer,
        addArrayPointer,
        removeArrayPointer,
        stacks,
        setStacks,
        addStack,
        updateStackStyle,
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