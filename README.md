# Quillo - Offline-First Note Taking PWA

A progressive web application for note-taking with offline-first capabilities, built with Next.js, TypeScript, and Supabase.

## Overview

Quillo is an offline-first PWA that allows users to create, edit, and delete notes seamlessly, whether online or offline. The application automatically synchronizes data when connectivity is restored.

**Status**: Phase 3 Complete ✅ (Offline functionality fully implemented)

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

## Quick Start

### Prerequisites

- Node.js 20+
- Supabase account

### Installation

```bash
# Clone and install
git clone <repository-url>
cd pullus-assessment-1
npm install

# Set up environment variables
cp .env.example .env.local
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
- `lib/db/indexeddb.ts` - IndexedDB wrapper for local storage
- `hooks/use-notes.ts` - React Query hooks with optimistic updates

## Project Structure

```
├── app/                    # Next.js app router
├── components/
│   ├── notes/            # Note management UI
│   ├── sync/             # Sync status components
│   └── ui/               # shadcn/ui components
├── lib/
│   ├── services/        # Business logic (note-service, sync-manager)
│   ├── db/              # IndexedDB wrapper
│   └── supabase/        # API client
└── hooks/               # React hooks (use-notes, use-sync-status)
```

## Code Quality

- ✅ TypeScript strict mode
- ✅ JSDoc documentation
- ✅ Comprehensive error handling
- ✅ Production-ready (console statements dev-only)
- ✅ No hardcoded secrets

## License

Private project for assessment purposes.
