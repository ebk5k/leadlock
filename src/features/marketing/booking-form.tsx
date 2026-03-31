"use client";

import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { bookingFormSchema, type BookingFormValues } from "@/lib/validators/forms";

export function BookingForm() {
  const [submitted, setSubmitted] = useState(false);
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting }
  } = useForm<BookingFormValues>({
    resolver: zodResolver(bookingFormSchema)
  });

  const onSubmit = async (values: BookingFormValues) => {
    const response = await fetch("/api/appointments", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(values)
    });

    if (!response.ok) {
      throw new Error("Unable to save appointment.");
    }

    setSubmitted(true);
    reset();
  };

  return (
    <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <label className="text-sm font-medium">Name</label>
          <Input placeholder="Angela Ruiz" {...register("name")} />
          {errors.name ? <p className="text-sm text-red-600">{errors.name.message}</p> : null}
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">Service</label>
          <Input placeholder="Emergency plumbing" {...register("service")} />
          {errors.service ? <p className="text-sm text-red-600">{errors.service.message}</p> : null}
        </div>
      </div>
      <div className="space-y-2">
        <label className="text-sm font-medium">Preferred date</label>
        <Input type="date" {...register("date")} />
        {errors.date ? <p className="text-sm text-red-600">{errors.date.message}</p> : null}
      </div>
      <div className="space-y-2">
        <label className="text-sm font-medium">Notes</label>
        <Textarea placeholder="Tell us what you need help with..." {...register("notes")} />
      </div>
      <Button disabled={isSubmitting} size="lg" type="submit">
        {isSubmitting ? "Booking..." : "Confirm Booking"}
      </Button>
      {submitted ? (
        <p className="text-sm text-emerald-700">
          Booking saved in LeadLock. Dashboard appointments will now reflect the new record.
        </p>
      ) : null}
    </form>
  );
}
