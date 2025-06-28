import { BaseCollaborationService } from './CollaborationService';
import { DrawingStroke, UserCursor } from './types';

export class LiveblocksCollaborationService extends BaseCollaborationService {
  private room: any = null; // Would be Room from @liveblocks/client
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

    // Initialize Liveblocks room
    // const { createClient } = await import('@liveblocks/client');
    // const client = createClient({
    //   publicApiKey: process.env.NEXT_PUBLIC_LIVEBLOCKS_PUBLIC_KEY!,
    // });
    
    // this.room = client.enter(roomId, {
    //   initialPresence: {
    //     cursor: null,
    //     userId: this.userId,
    //     color: this.userColor
    //   },
    //   initialStorage: {
    //     strokes: new LiveMap()
    //   }
    // });

    this.setupLiveblocksListeners();
  }

  private setupLiveblocksListeners(): void {
    if (!this.room) return;

    // Listen for storage changes (strokes)
    // this.room.subscribe('storage', (root) => {
    //   const strokes = Array.from(root.strokes.values());
    //   const remoteStrokes = strokes.filter(stroke => stroke.userId !== this.userId);
    //   this.callbacks?.onStrokesUpdate(remoteStrokes);
    // });

    // Listen for presence changes (cursors)
    // this.room.subscribe('others', (others) => {
    //   const cursors = others.map(other => ({
    //     userId: other.presence.userId,
    //     x: other.presence.cursor?.x || 0,
    //     y: other.presence.cursor?.y || 0,
    //     color: other.presence.color,
    //     lastSeen: Date.now()
    //   })).filter(cursor => cursor.x !== 0 || cursor.y !== 0);
    //   
    //   this.callbacks?.onCursorsUpdate(cursors);
    // });
  }

  async addStroke(stroke: DrawingStroke): Promise<void> {
    if (!this.room) return;

    // const { storage } = this.room;
    // storage.get('strokes').set(stroke.id, {
    //   ...stroke,
    //   userId: this.userId,
    //   isComplete: true
    // });
  }

  async updateLiveStroke(stroke: DrawingStroke): Promise<void> {
    this.throttledUpdateLiveStroke(stroke);
  }

  private async updateLiveStrokeImmediate(stroke: DrawingStroke): Promise<void> {
    if (!this.room) return;

    // const { storage } = this.room;
    // storage.get('strokes').set(stroke.id, {
    //   ...stroke,
    //   userId: this.userId,
    //   isComplete: false
    // });
  }

  async updateCursor(x: number, y: number): Promise<void> {
    this.throttledUpdateCursor(x, y);
  }

  private async updateCursorImmediate(x: number, y: number): Promise<void> {
    if (!this.room) return;

    // this.room.updatePresence({
    //   cursor: { x, y }
    // });
  }

  async disconnect(): Promise<void> {
    if (this.room) {
      // this.room.leave();
      this.room = null;
    }
    await super.disconnect();
  }
}