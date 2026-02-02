"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Users,
  MapPin,
  Calendar,
  CalendarDays,
  Mail,
  Settings,
  ClipboardList,
  Building2,
  UserCog,
  CalendarRange,
  Landmark,
  CalendarCheck,
} from "lucide-react";

const navigation = [
  { name: "Dashboard", href: "/", icon: LayoutDashboard },
  { name: "Seasons", href: "/seasons", icon: CalendarRange },
  { name: "Organizations", href: "/organizations", icon: Building2 },
  { name: "Coaches", href: "/coaches", icon: UserCog },
  { name: "Teams", href: "/teams", icon: Users },
  { name: "Locations", href: "/locations", icon: Landmark },
  { name: "Fields", href: "/fields", icon: MapPin },
  { name: "Field Allocations", href: "/allocations", icon: CalendarCheck },
  { name: "Dates & Times", href: "/dates", icon: Calendar },
  { name: "Games", href: "/games", icon: ClipboardList },
  { name: "Weekly Schedule", href: "/schedule", icon: CalendarDays },
  { name: "Email Coaches", href: "/email", icon: Mail },
  { name: "Settings", href: "/settings", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <div className="flex h-full w-64 flex-col bg-card border-r">
      <div className="flex h-16 items-center border-b px-6">
        <Link href="/" className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold">
            L
          </div>
          <span className="text-xl font-bold">LaxPlan</span>
        </Link>
      </div>
      <nav className="flex-1 space-y-1 px-3 py-4">
        {navigation.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                isActive
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
              )}
            >
              <item.icon className="h-5 w-5" />
              {item.name}
            </Link>
          );
        })}
      </nav>
      <div className="border-t p-4">
        <p className="text-xs text-muted-foreground text-center">
          LaxPlan v1.0
        </p>
      </div>
    </div>
  );
}
