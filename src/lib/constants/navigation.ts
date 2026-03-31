import {
  BarChart3,
  CalendarDays,
  LayoutDashboard,
  PhoneCall,
  Settings,
  Users,
  Workflow
} from "lucide-react";

export const marketingNav = [
  { href: "/", label: "Home" },
  { href: "/demo", label: "Demo" },
  { href: "/book", label: "Book" },
  { href: "/pricing", label: "Pricing" }
];

export const dashboardNav = [
  { href: "/app", label: "Overview", icon: LayoutDashboard },
  { href: "/app/calls", label: "Calls", icon: PhoneCall },
  { href: "/app/appointments", label: "Appointments", icon: CalendarDays },
  { href: "/app/leads", label: "Leads", icon: Users },
  { href: "/app/follow-ups", label: "Follow-Ups", icon: Workflow },
  { href: "/app/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/app/settings", label: "Settings", icon: Settings }
];
