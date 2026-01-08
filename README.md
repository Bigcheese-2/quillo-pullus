# Quillo - Offline-First Note Taking PWA

A progressive web application for note-taking with offline-first capabilities, built with Next.js, TypeScript, and Supabase.

## Overview

Quillo is an offline-first PWA that allows users to create, edit, and delete notes seamlessly, whether online or offline. The application automatically synchronizes data when connectivity is restored.



## Tech Stack

- **Framework**: Next.js 16.1.1 (App Router)
- **Language**: TypeScript 5
- **Styling**: Tailwind CSS 4 + shadcn/ui
- **Data**: @tanstack/react-query, IndexedDB (idb)
- **PWA**: next-pwa 5.6.0
- **Backend**: Supabase REST API

## Features

- ✅ **Offline-First**: All CRUD operations work offline
- ✅ **Background Sync**: Automatic retry with exponential backoff
- ✅ **Optimistic Updates**: Instant UI feedback
- ✅ **Data Persistence**: IndexedDB storage survives browser restarts
- ✅ **Sync Status UI**: Real-time sync state indicators
- ✅ **Conflict Resolution**: Last-Write-Wins strategy for data consistency
- ✅ **Error Handling**: Comprehensive error boundaries and user-friendly messages
- ✅ **Search & Filter**: Real-time search with highlighting (works offline)

## Quick Start

### Prerequisites

- Node.js 20+ 
- Supabase account

### Installation

```bash
# Clone and install
git clone <repository-url>
cd project folder
npm install

# Set up environment variables
cp .env.example .env
```

Update `.env.local`:
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co/rest/v1
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
NEXT_PUBLIC_USER_ID=user@example.com
```

### Development

```bash
npm run dev
```

**Note**: PWA features are only enabled in production builds.

### Production Build

```bash
npm run build
npm start
```

## Testing Offline Functionality

### Setup

1. Build and start in production mode:
```bash
   npm run build
npm start
```

2. Open Chrome/Edge and navigate to `http://localhost:3000`

3. Open DevTools (F12) → Network tab

### Simulate Offline

**Chrome DevTools:**
1. Open DevTools → Network tab
2. Click "No throttling" dropdown
3. Select "Offline"

### Test Scenarios

#### 1. Create Note Offline
- Go offline → Create note
- **Expected**: Note appears immediately, offline indicator shows, sync status shows "Pending"

#### 2. Edit Note Offline
- Go offline → Edit existing note
- **Expected**: Changes appear immediately, operation queued for sync

#### 3. Delete Note Offline
- Go offline → Delete note
- **Expected**: Note disappears immediately, deletion queued

#### 4. Sync When Online
- Go offline → Make changes → Go back online
- **Expected**: Offline indicator shows "Back online. Syncing...", operations sync automatically, toast notification

#### 5. Browser Restart Persistence
- Go offline → Create notes → Close browser → Reopen
- **Expected**: Notes persist (IndexedDB), sync when online

#### 6. Manual Sync
- Go offline → Create note → Go online → Click sync button in header
- **Expected**: Sync status shows "Syncing", then "Synced", pending count goes to 0

### Verify Data

**Check IndexedDB:**
- DevTools → Application → IndexedDB → `notes-db`
- Check `notes` store (all notes) and `sync_operations` store (pending syncs)

**Check Service Worker:**
- DevTools → Application → Service Workers
- Should show "activated and is running"

### Troubleshooting

- **Service Worker not registering**: Make sure you're in production mode (`npm run build && npm start`)
- **Sync not working**: Check Supabase credentials in `.env.local`, check Network tab for errors
- **Data not persisting**: Check IndexedDB in DevTools, verify database version is 2

## Architecture

### Offline-First Flow

```
User Action → IndexedDB (immediate) → UI Update (optimistic)
                ↓
         If Online: Sync to Supabase
         If Offline: Queue for Background Sync
```

### Key Components

- `lib/services/note-service.ts` - Offline-first service layer
- `lib/services/sync-manager.ts` - Background sync with retry logic
- `lib/services/conflict-resolver.ts` - Conflict detection and resolution
- `lib/db/indexeddb.ts` - IndexedDB wrapper for local storage
- `hooks/use-notes.ts` - React Query hooks with optimistic updates

## Conflict Resolution Strategy

### Overview

When the same note is modified both locally (while offline) and on the server (by another device or session), a conflict occurs. Quillo uses a **Last-Write-Wins (LWW)** strategy to automatically resolve these conflicts.

### How It Works

1. **Conflict Detection**: During sync, the system compares the `modified_at` timestamp of local and server versions of each note.

2. **Resolution**: The note with the most recent `modified_at` timestamp is chosen as the winner:
   - If local version is newer → Local version wins
   - If server version is newer → Server version wins
   - If timestamps are equal → Server version wins (default)

3. **Automatic Application**: The winning version is automatically saved to both IndexedDB and synced to the server.

4. **User Notification**: Users receive a toast notification when conflicts are resolved, showing:
   - Which note had a conflict
   - Which version was kept (local or server)
   - The resolution strategy used

### When Conflicts Can Occur

Conflicts can happen in these scenarios:

1. **Multi-Device Editing**: User edits a note on Device A while offline, then edits the same note on Device B (online). When Device A comes online, both versions exist.

2. **Network Interruption**: User starts editing a note online, network drops, user continues editing offline, then network returns while another session modified the same note.

3. **Concurrent Sessions**: Multiple browser tabs/windows editing the same note simultaneously.

### Example Scenario

```
Timeline:
1. 10:00 AM - User edits "Meeting Notes" on laptop (offline)
   → Local version: modified_at = "2024-01-15T10:00:00Z"

2. 10:05 AM - User edits same note on phone (online)
   → Server version: modified_at = "2024-01-15T10:05:00Z"

3. 10:10 AM - Laptop comes online, sync begins
   → Conflict detected: Server version is newer (10:05 > 10:00)
   → Resolution: Server version wins
   → User sees: "Conflict resolved for 'Meeting Notes': Server version was used (Last-Write-Wins)"
```

### Implementation Details

- **Conflict Detection**: Happens automatically during sync operations (`sync-manager.ts`)
- **Resolution Logic**: Implemented in `lib/services/conflict-resolver.ts`
- **User Feedback**: Toast notifications via `formatConflictMessage()`
- **Tracking**: Conflicts are tracked and reported in sync status

