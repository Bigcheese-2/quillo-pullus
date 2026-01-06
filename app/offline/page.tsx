import Link from "next/link";

/**
 * Offline fallback page.
 * Shown when the user is offline and tries to access a page that isn't cached.
 */
export default function OfflinePage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="text-center space-y-6 max-w-md">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold text-foreground">You&apos;re Offline</h1>
          <p className="text-muted-foreground">
            It looks like you&apos;re not connected to the internet. Don&apos;t worry,
            you can still access your notes that are stored locally.
          </p>
        </div>

        <div className="space-y-4 pt-4">
          <Link
            href="/"
            className="inline-block px-6 py-3 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors"
          >
            Go to Home
          </Link>
          <p className="text-sm text-muted-foreground">
            Your notes are saved locally and will sync when you&apos;re back online.
          </p>
        </div>
      </div>
    </div>
  );
}

