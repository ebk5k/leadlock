"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import type { Employee, EmployeeRole } from "@/types/domain";

const roles: EmployeeRole[] = ["technician", "dispatcher", "manager"];

export function EmployeeManagement({ employees }: { employees: Employee[] }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: "",
    role: "technician" as EmployeeRole,
    phone: "",
    email: "",
    active: true
  });

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage(null);

    try {
      const response = await fetch("/api/employees", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          ...form,
          active: form.active
        })
      });

      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as { message?: string } | null;
        throw new Error(payload?.message ?? "Unable to create employee.");
      }

      setForm({
        name: "",
        role: "technician",
        phone: "",
        email: "",
        active: true
      });
      startTransition(() => router.refresh());
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Unable to create employee.");
    }
  }

  return (
    <div className="grid gap-4 xl:grid-cols-[0.95fr_1.05fr]">
      <Card className="rounded-3xl p-5">
        <div className="space-y-1">
          <h2 className="text-lg font-semibold text-slate-950">Add employee</h2>
          <p className="text-sm text-muted-foreground">
            Keep this lightweight for MVP. Hours, performance, and payroll can layer on later.
          </p>
        </div>
        <form className="mt-5 space-y-4" onSubmit={handleSubmit}>
          <div className="space-y-2">
            <label className="text-sm font-medium">Name</label>
            <Input
              onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
              value={form.name}
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium">Role</label>
              <Select
                onChange={(event) =>
                  setForm((current) => ({ ...current, role: event.target.value as EmployeeRole }))
                }
                value={form.role}
              >
                {roles.map((role) => (
                  <option key={role} value={role}>
                    {role}
                  </option>
                ))}
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Phone</label>
              <Input
                onChange={(event) => setForm((current) => ({ ...current, phone: event.target.value }))}
                value={form.phone}
              />
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Status</label>
            <Select
              onChange={(event) =>
                setForm((current) => ({ ...current, active: event.target.value === "active" }))
              }
              value={form.active ? "active" : "inactive"}
            >
              <option value="active">active</option>
              <option value="inactive">inactive</option>
            </Select>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Email</label>
            <Input
              onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))}
              type="email"
              value={form.email}
            />
          </div>
          {errorMessage ? <p className="text-sm text-red-700">{errorMessage}</p> : null}
          <Button disabled={isPending} type="submit">
            {isPending ? "Saving..." : "Create employee"}
          </Button>
        </form>
      </Card>

      <Card className="rounded-3xl p-5">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-slate-950">Team roster</h2>
            <p className="text-sm text-muted-foreground">
              Real employee records are now available for dispatch assignment.
            </p>
          </div>
          <Badge>{employees.length} total</Badge>
        </div>
        <div className="mt-5 grid gap-3">
          {employees.map((employee) => (
            <div className="rounded-2xl border border-border p-4" key={employee.id}>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-medium text-slate-950">{employee.name}</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {employee.role} · {employee.phone}
                  </p>
                  {employee.email ? (
                    <p className="mt-1 text-xs text-muted-foreground">{employee.email}</p>
                  ) : null}
                </div>
                <Badge className={employee.active ? "bg-emerald-100 text-emerald-700" : ""}>
                  {employee.active ? "active" : "inactive"}
                </Badge>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
