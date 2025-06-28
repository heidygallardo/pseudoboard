# Collaboration Service Architecture

This modular architecture allows you to easily switch between different collaboration backends without changing your application code.

## Quick Start

```typescript
import { createCollaborationService } from '@/lib/collaboration';

// Uses default provider (Firebase)
const service = createCollaborationService();

// Or specify a provider
const service = createCollaborationService('liveblocks');
```

## Switching Providers

### 1. Environment Variable (Recommended)
```bash
# .env.local
NEXT_PUBLIC_COLLABORATION_PROVIDER=firebase  # or 'socket', 'liveblocks', 'supabase'
```

### 2. Programmatically
```typescript
import { CollaborationFactory } from '@/lib/collaboration';

const service = CollaborationFactory.create('socket');
```

## Available Providers

### ✅ Firebase (Ready)
- Real-time database with Firestore
- Built-in scaling and offline support
- Current implementation

### 🚧 Socket.io (Template Ready)
- WebSocket-based real-time communication
- Requires custom backend server
- Template provided for easy implementation

### 🚧 Liveblocks (Template Ready)
- Purpose-built for collaborative apps
- CRDT-based conflict resolution
- Template provided for easy implementation

### 🚧 Supabase (Not Implemented)
- PostgreSQL with real-time subscriptions
- Similar to Firebase but open source

## Adding a New Provider

1. Extend `BaseCollaborationService`:
```typescript
export class MyCollaborationService extends BaseCollaborationService {
  async connect(roomId: string): Promise<void> {
    // Implementation
  }
  
  async addStroke(stroke: DrawingStroke): Promise<void> {
    // Implementation
  }
  
  // ... other methods
}
```

2. Add to factory:
```typescript
case 'my-provider':
  return new MyCollaborationService();
```

3. Update type:
```typescript
export type CollaborationProvider = 'firebase' | 'my-provider' | ...;
```

## Architecture Benefits

- **Decoupled**: Canvas logic is separate from collaboration backend
- **Swappable**: Change providers with one line
- **Testable**: Easy to mock for testing
- **Scalable**: Each provider can be optimized independently
- **Future-proof**: Add new providers without refactoring

## Performance Features

- **Optimistic updates**: Immediate local feedback
- **Throttling**: Reduces network calls (50ms for strokes, 100ms for cursors)
- **Conflict resolution**: Handles concurrent edits gracefully
- **Auto-cleanup**: Removes stale cursors and data