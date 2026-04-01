import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
      <h1 className="text-6xl font-bold text-primary mb-4">404</h1>
      <p className="text-lg text-muted-foreground mb-6">This page doesn&apos;t exist</p>
      <Link href="/" className="px-6 py-2.5 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:opacity-90 transition-opacity">
        Back to Dashboard
      </Link>
    </div>
  );
}
