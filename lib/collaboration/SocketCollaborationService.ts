import { BaseCollaborationService } from './CollaborationService';
import { DrawingStroke, UserCursor } from './types';

export class SocketCollaborationService extends BaseCollaborationService {
  private socket: any = null; // Would be Socket from socket.io-client
  private throttledUpdateLiveStroke: (stroke: DrawingStroke) => void;
  private throttledUpdateCursor: (x: number, y: number) => void;

  constructor() {
    super();
    
    // Create throttled functions
    this.throttledUpdateLiveStroke = this.throttle(this.updateLiveStrokeImmediate.bind(this), 50);
    this.throttledUpdateCursor = this.throttle(this.updateCursorImmediate.bind(this), 100);
  }

  async connect(roomId: string, userId?: string): Promise<void> {
    this.roomId = roomId;
    if (userId) {
      this.userId = userId;
      this.userColor = this.generateUserColor();
    }

    // Initialize Socket.io connection
    // const { io } = await import('socket.io-client');
    // this.socket = io(process.env.NEXT_PUBLIC_SOCKET_URL || 'ws://localhost:3001');
    
    // Setup event listeners
    this.setupSocketListeners();
    
    // Join room
    // this.socket.emit('join-room', roomId, this.userId);
  }

  private setupSocketListeners(): void {
    if (!this.socket) return;

    // Listen for stroke updates
    this.socket.on('strokes-update', (strokes: DrawingStroke[]) => {
      // Filter out own strokes to avoid duplicates
      const remoteStrokes = strokes.filter(stroke => stroke.userId !== this.userId);
      this.callbacks?.onStrokesUpdate(remoteStrokes);
    });

    // Listen for cursor updates
    this.socket.on('cursors-update', (cursors: UserCursor[]) => {
      // Filter out own cursor and old cursors
      const activeCursors = cursors.filter(cursor => 
        cursor.userId !== this.userId && 
        Date.now() - cursor.lastSeen < 10000
      );
      this.callbacks?.onCursorsUpdate(activeCursors);
    });

    // Handle errors
    this.socket.on('error', (error: Error) => {
      this.callbacks?.onError(error);
    });
  }

  async addStroke(stroke: DrawingStroke): Promise<void> {
    if (!this.socket) return;

    // this.socket.emit('add-stroke', {
    //   ...stroke,
    //   userId: this.userId,
    //   isComplete: true
    // });
  }

  async updateLiveStroke(stroke: DrawingStroke): Promise<void> {
    this.throttledUpdateLiveStroke(stroke);
  }

  private async updateLiveStrokeImmediate(stroke: DrawingStroke): Promise<void> {
    if (!this.socket) return;

    // this.socket.emit('update-live-stroke', {
    //   ...stroke,
    //   userId: this.userId,
    //   isComplete: false
    // });
  }

  async updateCursor(x: number, y: number): Promise<void> {
    this.throttledUpdateCursor(x, y);
  }

  private async updateCursorImmediate(x: number, y: number): Promise<void> {
    if (!this.socket) return;

    // this.socket.emit('update-cursor', {
    //   x,
    //   y,
    //   color: this.userColor,
    //   lastSeen: Date.now()
    // });
  }

  async disconnect(): Promise<void> {
    if (this.socket) {
      // this.socket.emit('leave-room', this.roomId);
      // this.socket.disconnect();
      this.socket = null;
    }
    await super.disconnect();
  }
}