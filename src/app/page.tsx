"use client";

import { AppLayout } from "@/components/layout/app-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAppStore } from "@/store";
import { Users, MapPin, Calendar, ClipboardList } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function Dashboard() {
  const { teams, fields, scheduleDates, games } = useAppStore();

  const upcomingGames = games.filter((g) => g.status === "scheduled").slice(0, 5);

  const stats = [
    {
      title: "Total Teams",
      value: teams.length,
      icon: Users,
      href: "/teams",
      color: "text-blue-600",
    },
    {
      title: "Fields",
      value: fields.length,
      icon: MapPin,
      href: "/fields",
      color: "text-green-600",
    },
    {
      title: "Game Dates",
      value: scheduleDates.filter((d) => d.isActive).length,
      icon: Calendar,
      href: "/dates",
      color: "text-purple-600",
    },
    {
      title: "Scheduled Games",
      value: games.filter((g) => g.status === "scheduled").length,
      icon: ClipboardList,
      href: "/games",
      color: "text-orange-600",
    },
  ];

  return (
    <AppLayout title="Dashboard">
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat) => (
            <Link key={stat.title} href={stat.href}>
              <Card className="hover:bg-accent/50 transition-colors cursor-pointer">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    {stat.title}
                  </CardTitle>
                  <stat.icon className={`h-5 w-5 ${stat.color}`} />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stat.value}</div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-2">
              <Link href="/teams">
                <Button variant="outline" className="w-full justify-start">
                  <Users className="mr-2 h-4 w-4" />
                  Add New Team
                </Button>
              </Link>
              <Link href="/fields">
                <Button variant="outline" className="w-full justify-start">
                  <MapPin className="mr-2 h-4 w-4" />
                  Add New Field
                </Button>
              </Link>
              <Link href="/dates">
                <Button variant="outline" className="w-full justify-start">
                  <Calendar className="mr-2 h-4 w-4" />
                  Add Game Dates
                </Button>
              </Link>
              <Link href="/games">
                <Button variant="outline" className="w-full justify-start">
                  <ClipboardList className="mr-2 h-4 w-4" />
                  Schedule Games
                </Button>
              </Link>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Getting Started</CardTitle>
            </CardHeader>
            <CardContent>
              <ol className="list-decimal list-inside space-y-2 text-sm text-muted-foreground">
                <li className={teams.length > 0 ? "line-through" : ""}>
                  Add your teams (6-12 recommended)
                </li>
                <li className={fields.length > 0 ? "line-through" : ""}>
                  Configure your fields (2-4 typical)
                </li>
                <li className={scheduleDates.length > 0 ? "line-through" : ""}>
                  Set up game dates and time slots
                </li>
                <li className={games.length > 0 ? "line-through" : ""}>
                  Generate or manually create game schedule
                </li>
                <li>Email schedules to coaches</li>
              </ol>
            </CardContent>
          </Card>
        </div>

        {upcomingGames.length > 0 && (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Upcoming Games</CardTitle>
              <Link href="/schedule">
                <Button variant="outline" size="sm">
                  View All
                </Button>
              </Link>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {upcomingGames.map((game) => {
                  const homeTeam = teams.find((t) => t.id === game.homeTeamId);
                  const awayTeam = teams.find((t) => t.id === game.awayTeamId);
                  const field = fields.find((f) => f.id === game.fieldId);
                  const gameDate = scheduleDates.find((d) => d.id === game.dateId);
                  const timeSlot = gameDate?.timeSlots.find(
                    (ts) => ts.id === game.timeSlotId
                  );

                  return (
                    <div
                      key={game.id}
                      className="flex items-center justify-between p-3 rounded-lg bg-accent/50"
                    >
                      <div>
                        <p className="font-medium">
                          {homeTeam?.name || "TBD"} vs {awayTeam?.name || "TBD"}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {field?.name} - {gameDate?.date} at{" "}
                          {timeSlot?.startTime}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </AppLayout>
  );
}
