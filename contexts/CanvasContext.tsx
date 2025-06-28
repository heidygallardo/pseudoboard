'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { createCollaborationService, CollaborationService, DrawingStroke, UserCursor } from '@/lib/collaboration';

type Tool = 'move' | 'draw' | 'text' | 'shape' | 'datastructures' | 'eraser';

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
  updateLiveStroke: (stroke: DrawingStroke) => void;
  roomId: string;
  setRoomId: (roomId: string) => void;
  userCursors: UserCursor[];
  updateCursor: (x: number, y: number) => void;
  userId: string;
  clearAll: () => void;
  deleteStroke: (strokeId: string) => void;
}

const CanvasContext = createContext<CanvasContextType | undefined>(undefined);

export const CanvasProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [activeTool, setActiveTool] = useState<Tool>('move');
  const [zoom, setZoom] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [remoteStrokes, setRemoteStrokes] = useState<DrawingStroke[]>([]);
  const [localStrokes, setLocalStrokes] = useState<DrawingStroke[]>([]);
  const [roomId, setRoomId] = useState('default-room');
  const [userCursors, setUserCursors] = useState<UserCursor[]>([]);
  const [collaborationService] = useState<CollaborationService>(() => createCollaborationService());

  // Initialize collaboration service
  useEffect(() => {
    if (!roomId) return;

    const initializeCollaboration = async () => {
      try {
        // Subscribe to collaboration events
        const unsubscribe = collaborationService.subscribe({
          onStrokesUpdate: (strokes) => {
            setRemoteStrokes(strokes);
          },
          onCursorsUpdate: (cursors) => {
            setUserCursors(cursors);
          },
          onError: (error) => {
            console.error('Collaboration error:', error);
          }
        });

        // Connect to the room
        await collaborationService.connect(roomId);

        return unsubscribe;
      } catch (error) {
        console.error('Failed to initialize collaboration:', error);
      }
    };

    let cleanup: (() => void) | undefined;
    initializeCollaboration().then((unsubscribe) => {
      cleanup = unsubscribe;
    });

    return () => {
      cleanup?.();
      collaborationService.disconnect();
    };
  }, [roomId, collaborationService]);

  const addStroke = async (stroke: DrawingStroke) => {
    console.log('Adding stroke:', stroke.id, 'to room:', roomId);
    
    // Immediate local update for instant feedback
    const finalStroke = { ...stroke, userId: collaborationService.getUserId(), isComplete: true };
    setLocalStrokes(prev => {
      const filtered = prev.filter(s => s.id !== stroke.id);
      return [...filtered, finalStroke];
    });
    
    // Send to collaboration service
    await collaborationService.addStroke(stroke);
  };

  const updateLiveStroke = (stroke: DrawingStroke) => {
    // Immediate local update for instant feedback
    setLocalStrokes(prev => {
      const filtered = prev.filter(s => s.id !== stroke.id);
      return [...filtered, stroke];
    });
    
    // Send to collaboration service (throttled internally)
    collaborationService.updateLiveStroke(stroke);
  };

  const updateCursor = (x: number, y: number) => {
    // Send to collaboration service (throttled internally)
    collaborationService.updateCursor(x, y);
  };

  const handleRoomChange = async (newRoomId: string) => {
    await collaborationService.disconnect();
    setRoomId(newRoomId);
    setLocalStrokes([]);
    setRemoteStrokes([]);
  };

  const clearAll = async () => {
    // Clear local strokes immediately
    setLocalStrokes([]);
    setRemoteStrokes([]);
    
    // Clear from collaboration service
    try {
      await collaborationService.clearAllStrokes();
    } catch (error) {
      console.error('Failed to clear all strokes:', error);
    }
  };

  const deleteStroke = async (strokeId: string) => {
    // Remove from local state immediately
    setLocalStrokes(prev => prev.filter(stroke => stroke.id !== strokeId));
    setRemoteStrokes(prev => prev.filter(stroke => stroke.id !== strokeId));
    
    // Remove from collaboration service
    try {
      await collaborationService.deleteStroke(strokeId);
    } catch (error) {
      console.error('Failed to delete stroke:', error);
    }
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
        strokes: [...remoteStrokes, ...localStrokes],
        setStrokes: setRemoteStrokes,
        addStroke,
        updateLiveStroke,
        roomId,
        setRoomId: handleRoomChange,
        userCursors,
        updateCursor,
        userId: collaborationService.getUserId(),
        clearAll,
        deleteStroke,
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