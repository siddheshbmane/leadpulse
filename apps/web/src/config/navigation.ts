import {
  LayoutDashboard,
  Users,
  Search,
  Activity,
  Briefcase,
  Settings,
} from "lucide-react";

export const navigationItems = [
  {
    href: "/dashboard",
    label: "Dashboard",
    icon: LayoutDashboard,
  },
  {
    href: "/leads",
    label: "Leads",
    icon: Users,
  },
  {
    href: "/search-filters",
    label: "Search Filters",
    icon: Search,
  },
  {
    href: "/intelligence",
    label: "Intelligence",
    icon: Activity,
  },
  {
    href: "/jobs",
    label: "Jobs",
    icon: Briefcase,
  },
  {
    href: "/settings",
    label: "Settings",
    icon: Settings,
  },
] as const;
