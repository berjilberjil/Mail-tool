import Link from "next/link";
import { Mail } from "lucide-react";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-8 bg-background px-6 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-primary text-primary-foreground">
        <Mail className="h-7 w-7" />
      </div>

      <div className="space-y-2">
        <h1 className="text-6xl font-bold tracking-tight">404</h1>
        <h2 className="text-xl font-semibold">Page not found</h2>
        <p className="mx-auto max-w-sm text-muted-foreground">
          The page you are looking for does not exist or has been moved.
        </p>
      </div>

      <Link
        href="/dashboard"
        className="inline-flex items-center gap-2 rounded-md bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground shadow hover:bg-primary/90 transition-colors"
      >
        Back to Dashboard
      </Link>
    </div>
  );
}
