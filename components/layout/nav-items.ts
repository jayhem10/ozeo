import {
  LayoutDashboard,
  ArrowLeftRight,
  PiggyBank,
  Calendar,
  Target,
  Wallet,
  BarChart3,
  Upload,
  Settings,
  RefreshCcw,
  Menu,
} from "lucide-react";

export const NAV_ITEMS = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/transactions", label: "Transactions", icon: ArrowLeftRight },
  { href: "/budgets", label: "Budgets", icon: PiggyBank },
  { href: "/calendar", label: "Calendrier", icon: Calendar },
  { href: "/recurring", label: "Récurrentes", icon: RefreshCcw },
  { href: "/goals", label: "Objectifs", icon: Target },
  { href: "/accounts", label: "Comptes", icon: Wallet },
  { href: "/analytics", label: "Analyses", icon: BarChart3 },
  { href: "/import", label: "Import", icon: Upload },
  { href: "/settings", label: "Paramètres", icon: Settings },
] as const;

// Bottom tab bar only fits a few items; the rest live behind the "Plus" drawer.
export const MOBILE_NAV_ITEMS = [
  NAV_ITEMS[0],
  NAV_ITEMS[1],
  NAV_ITEMS[2],
  NAV_ITEMS[5],
  { href: "__more__", label: "Plus", icon: Menu },
] as const;

export const MOBILE_MORE_ITEMS = [
  NAV_ITEMS[3],
  NAV_ITEMS[4],
  NAV_ITEMS[6],
  NAV_ITEMS[7],
  NAV_ITEMS[8],
  NAV_ITEMS[9],
] as const;
