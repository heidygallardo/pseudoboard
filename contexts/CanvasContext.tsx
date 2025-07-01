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