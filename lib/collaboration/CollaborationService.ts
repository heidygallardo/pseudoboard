import { CollaborationService, CollaborationCallbacks, DrawingStroke, UserCursor } from './types';

export abstract class BaseCollaborationService implements CollaborationService {
  protected userId: string;
  protected userColor: string;
  protected roomId: string = '';
  protected callbacks?: CollaborationCallbacks;
  protected unsubscribeCallbacks: (() => void)[] = [];
  
  protected userColors = ['#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4', '#feca57', '#ff9ff3', '#54a0ff'];

  constructor() {
    this.userId = this.generateUserId();
    this.userColor = this.generateUserColor();
  }

  protected generateUserId(): string {
    return `user-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  protected generateUserColor(): string {
    return this.userColors[parseInt(this.userId.slice(-2), 36) % this.userColors.length];
  }

  protected throttle(func: Function, delay: number) {
    let timeoutId: NodeJS.Timeout;
    let lastExecTime = 0;
    return (...args: any[]) => {
      const currentTime = Date.now();
      
      if (currentTime - lastExecTime > delay) {
        func(...args);
        lastExecTime = currentTime;
      } else {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => {
          func(...args);
          lastExecTime = Date.now();
        }, delay - (currentTime - lastExecTime));
      }
    };
  }

  getUserId(): string {
    return this.userId;
  }

  getUserColor(): string {
    return this.userColor;
  }

  subscribe(callbacks: CollaborationCallbacks): () => void {
    this.callbacks = callbacks;
    return () => {
      this.callbacks = undefined;
    };
  }

  async disconnect(): Promise<void> {
    this.unsubscribeCallbacks.forEach(unsubscribe => unsubscribe());
    this.unsubscribeCallbacks = [];
  }

  // Abstract methods to be implemented by specific services
  abstract connect(roomId: string, userId?: string): Promise<void>;
  abstract addStroke(stroke: DrawingStroke): Promise<void>;
  abstract updateLiveStroke(stroke: DrawingStroke): Promise<void>;
  abstract deleteStroke(strokeId: string): Promise<void>;
  abstract clearAllStrokes(): Promise<void>;
  abstract updateCursor(x: number, y: number): Promise<void>;
}