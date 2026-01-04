# Quillo - Offline-First Note Taking PWA

A progressive web application for note-taking with offline-first capabilities, built with Next.js, TypeScript, and Supabase.

## Project Overview

Quillo is an offline-first progressive web app that allows users to create, edit, and delete notes seamlessly, whether online or offline. The application automatically synchronizes data when connectivity is restored, ensuring a smooth user experience regardless of network conditions.

### Current Status: Phase 1 Complete ✅

Phase 1 focused on project initialization, foundation setup, and PWA infrastructure. The application is now ready for feature implementation.

## Technology Stack

- **Framework**: Next.js 16.1.1 (App Router)
- **Language**: TypeScript 5
- **Styling**: Tailwind CSS 4
- **UI Components**: shadcn/ui (Radix UI primitives)
- **Font**: Montserrat (Google Fonts)
- **PWA**: next-pwa 5.6.0
- **Data Fetching**: @tanstack/react-query 5.90.16
- **Offline Storage**: idb 8.0.3 (IndexedDB wrapper)
- **Backend**: Supabase (REST API)
- **Notifications**: Sonner 2.0.7

## Project Structure

```
pullus-assessment-1/
├── app/
│   ├── layout.tsx          # Root layout with font and metadata
│   ├── page.tsx             # Main page (to be implemented)
│   ├── manifest.ts          # PWA manifest route
│   └── globals.css          # Global styles and CSS variables
├── components/
│   └── ui/                  # shadcn/ui components
│       ├── button.tsx
│       ├── card.tsx
│       ├── dialog.tsx
│       ├── input.tsx
│       ├── textarea.tsx
│       └── badge.tsx
├── lib/
│   ├── types/               # TypeScript type definitions
│   │   ├── note.ts          # Note data model
│   │   └── sync.ts          # Sync status and operations
│   ├── utils/               # Utility functions
│   │   └── utils.ts         # cn() class name utility
│   ├── supabase/            # Supabase client (to be implemented)
│   └── db/                  # IndexedDB wrapper (to be implemented)
├── public/
│   ├── manifest.json        # PWA manifest
│   ├── logo.svg             # App logo/favicon
│   └── icons/               # PWA icons (192x192, 512x512)
├── .env.local               # Environment variables (not committed)
├── .env.example             # Environment variables template
├── components.json          # shadcn/ui configuration
├── next.config.ts           # Next.js and PWA configuration
└── package.json             # Dependencies and scripts
```

## Phase 1 Implementation Details

### 1. Project Setup

- ✅ Next.js 16 with TypeScript configured
- ✅ Tailwind CSS 4 with custom theme variables
- ✅ ESLint configuration
- ✅ Path aliases (`@/*`) configured

### 2. UI Component System

- ✅ shadcn/ui configured and initialized
- ✅ Base components installed:
  - Button
  - Card
  - Dialog
  - Input
  - Textarea
  - Badge
- ✅ Utility function `cn()` for class name merging

### 3. Typography & Styling

- ✅ Montserrat font from Google Fonts
- ✅ Dark mode support via CSS variables
- ✅ Responsive design foundation
- ✅ Custom color scheme (background/foreground)

### 4. TypeScript Types

- ✅ `Note` interface matching Supabase schema
- ✅ `CreateNoteInput` and `UpdateNoteInput` types
- ✅ `SyncStatus` type for sync state tracking
- ✅ `SyncOperation` and `SyncState` interfaces

### 5. PWA Configuration

- ✅ next-pwa configured for service worker generation
- ✅ PWA manifest with app metadata
- ✅ Runtime caching strategies:
  - NetworkFirst for Supabase API calls
  - NetworkFirst for same-origin requests
- ✅ Service worker disabled in development (for easier debugging)
- ✅ App icons directory structure

### 6. Environment Configuration

- ✅ Environment variables setup:
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - `NEXT_PUBLIC_USER_ID`
- ✅ `.env.example` template for reference

## Getting Started

### Prerequisites

- Node.js 20+ 
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd pullus-assessment-1
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env.local
```

4. Update `.env.local` with your credentials:
```env
NEXT_PUBLIC_SUPABASE_URL=https://scwaxiuduzyziuyjfwda.supabase.co/rest/v1
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
NEXT_PUBLIC_USER_ID=your_email@example.com
```

5. Add PWA icons:
   - Place `icon-192.png` (192x192) in `public/icons/`
   - Place `icon-512.png` (512x512) in `public/icons/`

### Development

Run the development server:
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the app.

### Build

Build for production:
```bash
npm run build
```

Start production server:
```bash
npm start
```

## Configuration Files

### `next.config.ts`

- React Strict Mode enabled
- PWA configuration (production only)
- Service worker caching strategies
- Supabase API caching (1 hour TTL)

### `components.json`

shadcn/ui configuration:
- Style: default
- Base color: slate
- CSS variables enabled
- Path aliases configured

### `app/layout.tsx`

- Montserrat font configuration
- PWA metadata (title, description, icons)
- Viewport configuration (responsive, theme color)
- Apple Web App configuration

## Type Definitions

### Note Model

```typescript
interface Note {
  id: string;              // UUID (server-generated)
  user_id: string;         // Email address
  title: string;           // Max 100 characters
  content: string;         // Max 5000 characters
  created_at: string;      // ISO 8601 timestamp
  modified_at: string;     // ISO 8601 timestamp
}


interface SyncOperation {
  id: string;
  type: 'create' | 'update' | 'delete';
  noteId?: string;
  noteData?: unknown;
  status: SyncStatus;
  queuedAt: string;
  retryCount: number;
  error?: string;
}
