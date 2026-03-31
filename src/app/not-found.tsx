import Link from "next/link";

import { buttonVariants } from "@/components/ui/button";

export default function NotFound() {
  return (
    <main className="flex min-h-screen items-center justify-center px-4">
      <div className="space-y-4 text-center">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-primary">404</p>
        <h1 className="text-3xl font-semibold tracking-tight text-slate-950">Page not found</h1>
        <p className="text-sm text-muted-foreground">Let’s get you back to a live route.</p>
        <Link className={buttonVariants()} href="/">
          Return Home
        </Link>
      </div>
    </main>
  );
}
