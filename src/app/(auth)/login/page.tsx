import Link from "next/link";

import { Logo } from "@/components/branding/logo";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { LoginForm } from "@/features/auth/login-form";

export default async function LoginPage({
  searchParams
}: {
  searchParams: Promise<{ redirectTo?: string }>;
}) {
  const params = await searchParams;
  const redirectTo = params.redirectTo;

  return (
    <main className="flex min-h-screen items-center justify-center bg-[linear-gradient(180deg,_#eff6ff_0%,_#f8fafc_100%)] px-4 py-10">
      <div className="w-full max-w-md space-y-6">
        <div className="flex justify-center">
          <Logo />
        </div>
        <Card className="p-6 sm:p-8">
          <div className="space-y-2">
            <h1 className="text-2xl font-semibold tracking-tight text-slate-950">Client dashboard login</h1>
            <p className="text-sm text-muted-foreground">
              Use the demo account to preview the MVP dashboard.
            </p>
          </div>
          {redirectTo ? (
            <div className="mt-4">
              <Badge className="bg-primary/10 text-primary">
                Sign in to continue to {redirectTo}
              </Badge>
            </div>
          ) : null}
          <div className="mt-6">
            <LoginForm />
          </div>
          <p className="mt-6 text-sm text-muted-foreground">
            Looking for the public site? <Link className="text-primary" href="/">Go back home</Link>.
          </p>
        </Card>
      </div>
    </main>
  );
}
