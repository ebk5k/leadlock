import { Activity, Award, BriefcaseBusiness, CheckCircle2, Clock3, Wallet } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { StatCard } from "@/components/dashboard/stat-card";
import { formatCurrency, formatMinutes } from "@/lib/utils";
import type { EmployeePerformanceSnapshot } from "@/types/domain";

function formatRevenue(amountCents: number) {
  return formatCurrency(amountCents / 100);
}

export function EmployeePerformanceView({
  performance
}: {
  performance: EmployeePerformanceSnapshot[];
}) {
  const assignedEmployees = performance.filter((snapshot) => snapshot.jobsAssigned > 0).length;
  const totalAssigned = performance.reduce((sum, snapshot) => sum + snapshot.jobsAssigned, 0);
  const totalCompleted = performance.reduce((sum, snapshot) => sum + snapshot.jobsCompleted, 0);
  const totalInProgress = performance.reduce((sum, snapshot) => sum + snapshot.inProgressJobs, 0);
  const totalRevenueCents = performance.reduce((sum, snapshot) => sum + snapshot.paidRevenueCents, 0);
  const durationSamples = performance
    .map((snapshot) => snapshot.averageCompletionDurationMinutes)
    .filter((value): value is number => value !== null);
  const averageDuration =
    durationSamples.length > 0
      ? Math.round(durationSamples.reduce((sum, value) => sum + value, 0) / durationSamples.length)
      : null;
  const topPerformer = performance[0];

  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          eyebrow="Coverage"
          label="Employees with assigned jobs"
          value={String(assignedEmployees)}
          change={`${performance.length} employees tracked`}
          icon={<Award className="h-4 w-4" />}
        />
        <StatCard
          eyebrow="Workload"
          label="Assigned jobs"
          value={String(totalAssigned)}
          change={`${totalCompleted} completed`}
          icon={<BriefcaseBusiness className="h-4 w-4" />}
        />
        <StatCard
          eyebrow="Execution"
          label="Completed jobs"
          value={String(totalCompleted)}
          change={`${totalInProgress} currently in progress`}
          tone="success"
          icon={<CheckCircle2 className="h-4 w-4" />}
        />
        <StatCard
          eyebrow="Revenue"
          label="Paid revenue"
          value={formatRevenue(totalRevenueCents)}
          change={topPerformer ? `${topPerformer.employee.name} is leading` : "No paid jobs yet"}
          tone="success"
          icon={<Wallet className="h-4 w-4" />}
        />
        <StatCard
          eyebrow="Labor"
          label="Average completion duration"
          value={averageDuration !== null ? formatMinutes(averageDuration) : "No data"}
          change="Based on persisted job timestamps"
          icon={<Clock3 className="h-4 w-4" />}
        />
      </div>

      <Card className="rounded-3xl p-5">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-slate-950">Employee performance</h2>
            <p className="text-sm text-muted-foreground">
              Practical MVP metrics from real assignment, completion, and payment records.
            </p>
          </div>
          <Badge>{performance.length} team members</Badge>
        </div>

        <div className="mt-5 hidden overflow-hidden rounded-2xl border border-border md:block">
          <table className="min-w-full text-sm">
            <thead className="bg-slate-50 text-muted-foreground">
              <tr>
                <th className="px-5 py-3 text-left">Employee</th>
                <th className="px-5 py-3 text-left">Assigned</th>
                <th className="px-5 py-3 text-left">Completed</th>
                <th className="px-5 py-3 text-left">In progress</th>
                <th className="px-5 py-3 text-left">Avg duration</th>
                <th className="px-5 py-3 text-left">Utilization</th>
                <th className="px-5 py-3 text-left">Paid revenue</th>
              </tr>
            </thead>
            <tbody>
              {performance.map((snapshot) => (
                <tr className="border-t border-border" key={snapshot.employee.id}>
                  <td className="px-5 py-4">
                    <div>
                      <p className="font-medium text-slate-950">{snapshot.employee.name}</p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {snapshot.employee.role} · {snapshot.employee.active ? "active" : "inactive"}
                      </p>
                    </div>
                  </td>
                  <td className="px-5 py-4 text-slate-950">{snapshot.jobsAssigned}</td>
                  <td className="px-5 py-4 text-slate-950">{snapshot.jobsCompleted}</td>
                  <td className="px-5 py-4">
                    <Badge className={snapshot.inProgressJobs > 0 ? "bg-amber-100 text-amber-800" : ""}>
                      {snapshot.inProgressJobs}
                    </Badge>
                  </td>
                  <td className="px-5 py-4 text-slate-950">
                    {snapshot.averageCompletionDurationMinutes !== null
                      ? formatMinutes(snapshot.averageCompletionDurationMinutes)
                      : "No data"}
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className="h-2 w-20 overflow-hidden rounded-full bg-slate-100">
                        <div
                          className="h-full rounded-full bg-slate-950"
                          style={{ width: `${snapshot.utilizationPercent}%` }}
                        />
                      </div>
                      <span className="text-xs font-medium text-slate-700">
                        {snapshot.utilizationPercent}%
                      </span>
                    </div>
                  </td>
                  <td className="px-5 py-4 font-medium text-slate-950">
                    {formatRevenue(snapshot.paidRevenueCents)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-5 grid gap-3 md:hidden">
          {performance.map((snapshot) => (
            <div className="rounded-2xl border border-border p-4" key={snapshot.employee.id}>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-medium text-slate-950">{snapshot.employee.name}</p>
                  <p className="mt-1 text-sm text-muted-foreground">{snapshot.employee.role}</p>
                </div>
                <Badge className={snapshot.employee.active ? "bg-emerald-100 text-emerald-700" : ""}>
                  {snapshot.employee.active ? "active" : "inactive"}
                </Badge>
              </div>
              <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-muted-foreground">Assigned</p>
                  <p className="font-semibold text-slate-950">{snapshot.jobsAssigned}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Completed</p>
                  <p className="font-semibold text-slate-950">{snapshot.jobsCompleted}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">In progress</p>
                  <p className="font-semibold text-slate-950">{snapshot.inProgressJobs}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Avg duration</p>
                  <p className="font-semibold text-slate-950">
                    {snapshot.averageCompletionDurationMinutes !== null
                      ? formatMinutes(snapshot.averageCompletionDurationMinutes)
                      : "No data"}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Utilization</p>
                  <p className="font-semibold text-slate-950">{snapshot.utilizationPercent}%</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Paid revenue</p>
                  <p className="font-semibold text-slate-950">
                    {formatRevenue(snapshot.paidRevenueCents)}
                  </p>
                </div>
              </div>
              <div className="mt-4 rounded-2xl bg-slate-50 p-3">
                <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground">
                  <Activity className="h-3.5 w-3.5" />
                  Utilization snapshot
                </div>
                <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-200">
                  <div
                    className="h-full rounded-full bg-slate-950"
                    style={{ width: `${snapshot.utilizationPercent}%` }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
