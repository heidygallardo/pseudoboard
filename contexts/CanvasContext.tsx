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
  roomId: string | null;
  setRoomId: (roomId: string) => void;
  userCursors: UserCursor[];
  updateCursor: (x: number, y: number) => void;
  userId: string;
  clearAll: () => void;
  deleteStroke: (strokeId: string) => void;
  isCollaborative: boolean;
  startCollaboration: () => string;
  joinRoom: (roomId: string) => void;
  leaveRoom: () => void;
}

const CanvasContext = createContext<CanvasContextType | undefined>(undefined);

export const CanvasProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [activeTool, setActiveTool] = useState<Tool>('move');
  const [zoom, setZoom] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [remoteStrokes, setRemoteStrokes] = useState<DrawingStroke[]>([]);
  const [localStrokes, setLocalStrokes] = useState<DrawingStroke[]>([]);
  const [roomId, setRoomIdState] = useState<string | null>(null);
  const [userCursors, setUserCursors] = useState<UserCursor[]>([]);
  const [isCollaborative, setIsCollaborative] = useState(false);
  const [collaborationService] = useState<CollaborationService>(() => createCollaborationService());

  const joinRoom = (newRoomId: string) => {
    setRoomIdState(newRoomId);
    setIsCollaborative(true);
    setLocalStrokes([]); // Clear local strokes when joining
    setRemoteStrokes([]); // Will be loaded from Firebase
    
    // Update URL without reload
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      url.searchParams.set('room', newRoomId);
      window.history.pushState({}, '', url.toString());
    }
  };

  // Check for room parameter in URL on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      const roomParam = urlParams.get('room');
      
      if (roomParam) {
        joinRoom(roomParam);
      }
    }
  }, []);

  // Initialize collaboration service only when collaborative
  useEffect(() => {
    if (!roomId || !isCollaborative) return;

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
  }, [roomId, isCollaborative, collaborationService]);

  const addStroke = async (stroke: DrawingStroke) => {
    const finalStroke = { ...stroke, userId: collaborationService.getUserId(), isComplete: true };
    
    // Always add to local strokes for immediate feedback
    setLocalStrokes(prev => {
      const filtered = prev.filter(s => s.id !== stroke.id);
      return [...filtered, finalStroke];
    });
    
    // Only sync to collaboration service if in collaborative mode
    if (isCollaborative && roomId) {
      try {
        await collaborationService.addStroke(stroke);
        console.log('Stroke synced to collaboration');
      } catch (error) {
        console.error('Error syncing stroke:', error);
      }
    }
  };

  const updateLiveStroke = (stroke: DrawingStroke) => {
    // Always update local strokes for immediate feedback
    setLocalStrokes(prev => {
      const filtered = prev.filter(s => s.id !== stroke.id);
      return [...filtered, stroke];
    });
    
    // Only sync to collaboration service if in collaborative mode
    if (isCollaborative && roomId) {
      collaborationService.updateLiveStroke(stroke);
    }
  };

  const updateCursor = (x: number, y: number) => {
    // Only sync cursor if in collaborative mode
    if (isCollaborative && roomId) {
      collaborationService.updateCursor(x, y);
    }
  };

  const generateRoomId = (): string => {
    return `room-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  };

  const startCollaboration = (): string => {
    const newRoomId = generateRoomId();
    setRoomIdState(newRoomId);
    setIsCollaborative(true);
    
    // Copy current local strokes to the new collaborative session
    const currentStrokes = [...localStrokes];
    setRemoteStrokes([]); // Will be synced from Firebase
    
    // Update URL without reload
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      url.searchParams.set('room', newRoomId);
      window.history.pushState({}, '', url.toString());
    }
    
    return newRoomId;
  };

  const leaveRoom = async () => {
    if (isCollaborative) {
      await collaborationService.disconnect();
    }
    
    setRoomIdState(null);
    setIsCollaborative(false);
    setRemoteStrokes([]);
    setUserCursors([]);
    
    // Remove room from URL
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      url.searchParams.delete('room');
      window.history.pushState({}, '', url.toString());
    }
  };

  const setRoomId = (newRoomId: string) => {
    joinRoom(newRoomId);
  };

  const clearAll = async () => {
    // Clear local strokes immediately
    setLocalStrokes([]);
    setRemoteStrokes([]);
    
    // Clear from collaboration service if collaborative
    if (isCollaborative && roomId) {
      try {
        await collaborationService.clearAllStrokes();
      } catch (error) {
        console.error('Failed to clear all strokes:', error);
      }
    }
  };

  const deleteStroke = async (strokeId: string) => {
    // Remove from local state immediately
    setLocalStrokes(prev => prev.filter(stroke => stroke.id !== strokeId));
    setRemoteStrokes(prev => prev.filter(stroke => stroke.id !== strokeId));
    
    // Remove from collaboration service if collaborative
    if (isCollaborative && roomId) {
      try {
        await collaborationService.deleteStroke(strokeId);
      } catch (error) {
        console.error('Failed to delete stroke:', error);
      }
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
        setRoomId,
        userCursors,
        updateCursor,
        userId: collaborationService.getUserId(),
        clearAll,
        deleteStroke,
        isCollaborative,
        startCollaboration,
        joinRoom,
        leaveRoom,
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