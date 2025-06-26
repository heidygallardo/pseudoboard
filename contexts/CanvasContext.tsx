'use client';

import React, { createContext, useContext, useState, ReactNode } from 'react';

type Tool = 'move' | 'draw' | 'text' | 'shape' | 'datastructures';

interface CanvasContextType {
  activeTool: Tool;
  setActiveTool: (tool: Tool) => void;
  zoom: number;
  setZoom: (zoom: number) => void;
  position: { x: number; y: number };
  setPosition: (position: { x: number; y: number }) => void;
}

const CanvasContext = createContext<CanvasContextType | undefined>(undefined);

export const CanvasProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [activeTool, setActiveTool] = useState<Tool>('move');
  const [zoom, setZoom] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });

  return (
    <CanvasContext.Provider
      value={{
        activeTool,
        setActiveTool,
        zoom,
        setZoom,
        position,
        setPosition,
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