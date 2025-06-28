import { collection, doc, onSnapshot, setDoc, deleteDoc, enableNetwork, disableNetwork, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { BaseCollaborationService } from './CollaborationService';
import { DrawingStroke, UserCursor } from './types';

export class FirebaseCollaborationService extends BaseCollaborationService {
  private throttledUpdateLiveStroke: (stroke: DrawingStroke) => void;
  private throttledUpdateCursor: (x: number, y: number) => void;
  private debouncedBatchUpdate: () => void;
  private pendingStrokes: Map<string, DrawingStroke> = new Map();
  private pendingCursor: { x: number; y: number; timestamp: number } | null = null;
  private lastStrokeUpdate = 0;
  private lastCursorUpdate = 0;
  private isOnline = true;

  constructor() {
    super();
    
    // Much more aggressive throttling and batching
    this.throttledUpdateLiveStroke = this.throttle(this.updateLiveStrokeImmediate.bind(this), 16); // ~60fps
    this.throttledUpdateCursor = this.throttle(this.updateCursorImmediate.bind(this), 33); // ~30fps
    this.debouncedBatchUpdate = this.debounce(this.performBatchUpdate.bind(this), 100);

    // Monitor network status
    this.setupNetworkMonitoring();
  }

  private setupNetworkMonitoring(): void {
    if (typeof window !== 'undefined') {
      window.addEventListener('online', () => {
        this.isOnline = true;
        enableNetwork(db);
        this.performBatchUpdate(); // Sync pending changes
      });

      window.addEventListener('offline', () => {
        this.isOnline = false;
        disableNetwork(db);
      });
    }
  }

  private debounce(func: Function, delay: number) {
    let timeoutId: NodeJS.Timeout;
    return (...args: any[]) => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => func(...args), delay);
    };
  }

  async connect(roomId: string, userId?: string): Promise<void> {
    this.roomId = roomId;
    if (userId) {
      this.userId = userId;
      this.userColor = this.generateUserColor();
    }

    await this.setupStrokeSubscription();
    await this.setupCursorSubscription();
  }

  private async setupStrokeSubscription(): Promise<void> {
    const strokesRef = collection(db, 'rooms', this.roomId, 'strokes');
    const unsubscribe = onSnapshot(
      strokesRef,
      (snapshot) => {
        const strokes: DrawingStroke[] = [];
        snapshot.forEach((doc) => {
          const stroke = { id: doc.id, ...doc.data() } as DrawingStroke;
          // Only include strokes from other users to avoid duplicates
          if (stroke.userId !== this.userId) {
            strokes.push(stroke);
          }
        });
        this.callbacks?.onStrokesUpdate(strokes);
      },
      (error) => {
        this.callbacks?.onError(error);
      }
    );

    this.unsubscribeCallbacks.push(unsubscribe);
  }

  private async setupCursorSubscription(): Promise<void> {
    const cursorsRef = collection(db, 'rooms', this.roomId, 'cursors');
    const unsubscribe = onSnapshot(
      cursorsRef,
      (snapshot) => {
        const cursors: UserCursor[] = [];
        snapshot.forEach((doc) => {
          const cursor = { userId: doc.id, ...doc.data() } as UserCursor;
          // Only show cursors from other users and recent ones (last 10 seconds)
          if (cursor.userId !== this.userId && Date.now() - cursor.lastSeen < 10000) {
            cursors.push(cursor);
          }
        });
        this.callbacks?.onCursorsUpdate(cursors);
      },
      (error) => {
        this.callbacks?.onError(error);
      }
    );

    this.unsubscribeCallbacks.push(unsubscribe);
  }

  async addStroke(stroke: DrawingStroke): Promise<void> {
    if (!this.roomId) return;

    try {
      const strokeRef = doc(db, 'rooms', this.roomId, 'strokes', stroke.id);
      await setDoc(strokeRef, {
        points: stroke.points,
        color: stroke.color,
        width: stroke.width,
        userId: this.userId,
        isComplete: true
      });
    } catch (error) {
      this.callbacks?.onError(error as Error);
    }
  }

  async updateLiveStroke(stroke: DrawingStroke): Promise<void> {
    // Store pending stroke for batching
    this.pendingStrokes.set(stroke.id, stroke);
    
    // Only throttle Firebase updates, not local state
    this.throttledUpdateLiveStroke(stroke);
  }

  private async updateLiveStrokeImmediate(stroke: DrawingStroke): Promise<void> {
    if (!this.roomId || !this.isOnline) return;

    const now = Date.now();
    // Skip if too recent (prevents Firebase overload)
    if (now - this.lastStrokeUpdate < 16) return;
    this.lastStrokeUpdate = now;

    try {
      // Get latest stroke from pending (might have been updated)
      const latestStroke = this.pendingStrokes.get(stroke.id) || stroke;
      
      const strokeRef = doc(db, 'rooms', this.roomId, 'strokes', stroke.id);
      
      // Use setDoc with merge to avoid overwriting
      await setDoc(strokeRef, {
        points: latestStroke.points,
        color: latestStroke.color,
        width: latestStroke.width,
        userId: this.userId,
        isComplete: false,
        lastUpdate: now
      }, { merge: true });

    } catch (error) {
      // Silently fail and batch for later
      console.warn('Stroke update failed, will retry:', error);
      this.debouncedBatchUpdate();
    }
  }

  async updateCursor(x: number, y: number): Promise<void> {
    // Store pending cursor for batching
    this.pendingCursor = { x, y, timestamp: Date.now() };
    
    // Use throttled version
    this.throttledUpdateCursor(x, y);
  }

  private async updateCursorImmediate(x: number, y: number): Promise<void> {
    if (!this.roomId || !this.isOnline) return;

    const now = Date.now();
    // Skip if too recent
    if (now - this.lastCursorUpdate < 33) return;
    this.lastCursorUpdate = now;

    try {
      const cursorRef = doc(db, 'rooms', this.roomId, 'cursors', this.userId);
      
      // Get latest cursor position
      const latestCursor = this.pendingCursor || { x, y, timestamp: now };
      
      await setDoc(cursorRef, {
        x: latestCursor.x,
        y: latestCursor.y,
        color: this.userColor,
        lastSeen: now
      }, { merge: true });

    } catch (error) {
      // Silently fail - cursor updates are not critical
      console.warn('Cursor update failed:', error);
    }
  }

  private async performBatchUpdate(): Promise<void> {
    if (!this.roomId || !this.isOnline) return;

    try {
      // Batch update all pending strokes
      const promises: Promise<void>[] = [];

      for (const [id, stroke] of this.pendingStrokes) {
        const strokeRef = doc(db, 'rooms', this.roomId, 'strokes', id);
        promises.push(
          setDoc(strokeRef, {
            points: stroke.points,
            color: stroke.color,
            width: stroke.width,
            userId: this.userId,
            isComplete: false,
            lastUpdate: Date.now()
          }, { merge: true })
        );
      }

      // Update cursor if pending
      if (this.pendingCursor) {
        const cursorRef = doc(db, 'rooms', this.roomId, 'cursors', this.userId);
        promises.push(
          setDoc(cursorRef, {
            x: this.pendingCursor.x,
            y: this.pendingCursor.y,
            color: this.userColor,
            lastSeen: Date.now()
          }, { merge: true })
        );
      }

      await Promise.allSettled(promises);
      
      // Clear pending after successful batch
      this.pendingStrokes.clear();
      this.pendingCursor = null;

    } catch (error) {
      console.warn('Batch update failed:', error);
    }
  }

  async deleteStroke(strokeId: string): Promise<void> {
    if (!this.roomId) return;

    try {
      const strokeRef = doc(db, 'rooms', this.roomId, 'strokes', strokeId);
      await deleteDoc(strokeRef);
    } catch (error) {
      this.callbacks?.onError(error as Error);
    }
  }

  async clearAllStrokes(): Promise<void> {
    if (!this.roomId) return;

    try {
      const strokesRef = collection(db, 'rooms', this.roomId, 'strokes');
      const snapshot = await getDocs(strokesRef);
      
      const deletePromises = snapshot.docs.map(doc => deleteDoc(doc.ref));
      await Promise.all(deletePromises);
    } catch (error) {
      this.callbacks?.onError(error as Error);
    }
  }
}