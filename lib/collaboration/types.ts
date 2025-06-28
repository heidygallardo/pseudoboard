export interface DrawingStroke {
  id: string;
  points: { x: number; y: number }[];
  color: string;
  width: number;
  userId?: string;
  isComplete?: boolean;
}

export interface UserCursor {
  userId: string;
  x: number;
  y: number;
  color: string;
  lastSeen: number;
}

export interface CollaborationCallbacks {
  onStrokesUpdate: (strokes: DrawingStroke[]) => void;
  onCursorsUpdate: (cursors: UserCursor[]) => void;
  onError: (error: Error) => void;
}

export interface CollaborationService {
  // Connection management
  connect(roomId: string, userId: string): Promise<void>;
  disconnect(): Promise<void>;
  
  // Stroke operations
  addStroke(stroke: DrawingStroke): Promise<void>;
  updateLiveStroke(stroke: DrawingStroke): Promise<void>;
  deleteStroke(strokeId: string): Promise<void>;
  clearAllStrokes(): Promise<void>;
  
  // Cursor operations
  updateCursor(x: number, y: number): Promise<void>;
  
  // Event subscriptions
  subscribe(callbacks: CollaborationCallbacks): () => void;
  
  // User info
  getUserId(): string;
  getUserColor(): string;
}