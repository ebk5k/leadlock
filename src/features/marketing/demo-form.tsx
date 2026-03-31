"use client";

import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { demoFormSchema, type DemoFormValues } from "@/lib/validators/forms";

export function DemoForm() {
  const [submitted, setSubmitted] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting }
  } = useForm<DemoFormValues>({
    resolver: zodResolver(demoFormSchema)
  });

  const onSubmit = async () => {
    await new Promise((resolve) => setTimeout(resolve, 300));
    setSubmitted(true);
  };

  return (
    <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <label className="text-sm font-medium">Name</label>
          <Input placeholder="Jordan Lee" {...register("name")} />
          {errors.name ? <p className="text-sm text-red-600">{errors.name.message}</p> : null}
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">Business</label>
          <Input placeholder="LeadLock Home Services" {...register("business")} />
          {errors.business ? <p className="text-sm text-red-600">{errors.business.message}</p> : null}
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <label className="text-sm font-medium">Email</label>
          <Input placeholder="owner@business.com" {...register("email")} />
          {errors.email ? <p className="text-sm text-red-600">{errors.email.message}</p> : null}
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">Phone</label>
          <Input placeholder="(323) 555-0184" {...register("phone")} />
          {errors.phone ? <p className="text-sm text-red-600">{errors.phone.message}</p> : null}
        </div>
      </div>
      <Button disabled={isSubmitting} size="lg" type="submit">
        {isSubmitting ? "Submitting..." : "Request My Demo"}
      </Button>
      {submitted ? (
        <p className="text-sm text-emerald-700">Demo request captured. In MVP this stays mocked and local.</p>
      ) : null}
    </form>
  );
}

