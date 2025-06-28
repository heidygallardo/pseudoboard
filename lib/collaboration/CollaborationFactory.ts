import { CollaborationService } from './types';
import { FirebaseCollaborationService } from './FirebaseCollaborationService';
import { SocketCollaborationService } from './SocketCollaborationService';
import { LiveblocksCollaborationService } from './LiveblocksCollaborationService';

export type CollaborationProvider = 'firebase' | 'supabase' | 'socket' | 'liveblocks';

export class CollaborationFactory {
  static create(provider: CollaborationProvider = 'firebase'): CollaborationService {
    switch (provider) {
      case 'firebase':
        return new FirebaseCollaborationService();
      
      case 'supabase':
        // Future implementation - would be similar to Firebase
        throw new Error('Supabase collaboration service not yet implemented');
      
      case 'socket':
        return new SocketCollaborationService();
      
      case 'liveblocks':
        return new LiveblocksCollaborationService();
      
      default:
        throw new Error(`Unknown collaboration provider: ${provider}`);
    }
  }
}

// Convenience function for getting the default service
export const createCollaborationService = (provider?: CollaborationProvider): CollaborationService => {
  const selectedProvider = provider || (process.env.NEXT_PUBLIC_COLLABORATION_PROVIDER as CollaborationProvider) || 'firebase';
  return CollaborationFactory.create(selectedProvider);
};