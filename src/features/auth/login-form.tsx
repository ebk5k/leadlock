"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { loginFormSchema, type LoginFormValues } from "@/lib/validators/forms";

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting }
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginFormSchema),
    defaultValues: {
      email: "demo@leadlock.app",
      password: "demo1234"
    }
  });

  const onSubmit = handleSubmit(async ({ email, password }) => {
    setError(null);
    const redirectTo = searchParams.get("redirectTo")?.startsWith("/app")
      ? searchParams.get("redirectTo")
      : "/app";
    const response = await fetch("/api/auth/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ email, password, redirectTo })
    });
    const result = (await response.json()) as {
      success: boolean;
      message?: string;
      redirectTo?: string;
    };

    if (!result.success) {
      setError(result.message ?? "Unable to log in.");
      return;
    }

    router.push(result.redirectTo ?? "/app");
    router.refresh();
  });

  return (
    <form className="space-y-4" onSubmit={onSubmit}>
      <div className="space-y-2">
        <label className="text-sm font-medium">Email</label>
        <Input {...register("email")} />
        {errors.email ? <p className="text-sm text-red-600">{errors.email.message}</p> : null}
      </div>
      <div className="space-y-2">
        <label className="text-sm font-medium">Password</label>
        <Input type="password" {...register("password")} />
        {errors.password ? <p className="text-sm text-red-600">{errors.password.message}</p> : null}
      </div>
      {error ? <p className="text-sm text-red-600">{error}</p> : null}
      <Button className="w-full" disabled={isSubmitting} size="lg" type="submit">
        {isSubmitting ? "Signing in..." : "Enter Dashboard"}
      </Button>
    </form>
  );
}
