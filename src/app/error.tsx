"use client";

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="mx-auto max-w-lg px-6 py-16">
      <div className="card p-8">
        <h1 className="display text-2xl">Something went wrong</h1>
        <p className="mt-2 text-sm text-[var(--muted)]">{error.message}</p>
        <button type="button" onClick={reset} className="btn btn-secondary mt-6">
          Try again
        </button>
      </div>
    </main>
  );
}
