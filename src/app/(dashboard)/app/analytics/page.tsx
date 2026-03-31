import { AnalyticsChart } from "@/features/analytics/analytics-chart";
import { PageHeader } from "@/components/dashboard/page-header";
import { StatCard } from "@/components/dashboard/stat-card";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { analyticsService } from "@/lib/services/analytics-service";
import { cn } from "@/lib/utils";

export default async function AnalyticsPage() {
  const analytics = await analyticsService.getSnapshot();
  const topSource = Math.max(...analytics.sources.map((source) => source.value));

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Reporting"
        title="Analytics"
        description="Core KPI visibility with mock data first, ready for future event pipelines and source attribution."
        action={<Badge>Last 7 days</Badge>}
      />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Leads" value={String(analytics.totalLeads)} change="+18% versus prior period" />
        <StatCard label="Bookings" value={String(analytics.bookedAppointments)} change="+12% versus prior period" />
        <StatCard label="Conversion rate" value={`${analytics.conversionRate}%`} change="+4 points" tone="success" />
        <StatCard label="Response time" value={`${analytics.responseTimeMinutes} min`} change="Improved this week" tone="success" />
      </div>
      <div className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
        <Card className="rounded-3xl p-5">
          <h2 className="text-lg font-semibold text-slate-950">Lead and booking trend</h2>
          <p className="mt-1 text-sm text-muted-foreground">Mock weekly traffic and bookings by day.</p>
          <div className="mt-6">
            <AnalyticsChart data={analytics.series} />
          </div>
        </Card>
        <Card className="rounded-3xl p-5">
          <h2 className="text-lg font-semibold text-slate-950">Lead sources</h2>
          <p className="mt-1 text-sm text-muted-foreground">Which channels are driving the most booked work.</p>
          <div className="mt-5 space-y-4">
            {analytics.sources.map((source) => (
              <div key={source.source}>
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-medium text-slate-950">{source.source}</p>
                  <p className="text-sm text-muted-foreground">{source.value}%</p>
                </div>
                <div className="mt-2 h-2 rounded-full bg-slate-100">
                  <div
                    className={cn("h-2 rounded-full bg-primary")}
                    style={{ width: `${(source.value / topSource) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
