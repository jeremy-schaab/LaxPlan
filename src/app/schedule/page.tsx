"use client";

import { useState, useMemo } from "react";
import { AppLayout } from "@/components/layout/app-layout";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAppStore } from "@/store";
import type { Game } from "@/types";
import {
  ChevronLeft,
  ChevronRight,
  Calendar,
  Clock,
  MapPin,
  Users,
  Printer,
} from "lucide-react";
import {
  format,
  startOfWeek,
  endOfWeek,
  addWeeks,
  subWeeks,
  eachDayOfInterval,
  isSameDay,
} from "date-fns";

export default function SchedulePage() {
  const { teams, fields, scheduleDates, games } = useAppStore();

  const [currentWeekStart, setCurrentWeekStart] = useState(() =>
    startOfWeek(new Date(), { weekStartsOn: 0 })
  );
  const [selectedTeamFilter, setSelectedTeamFilter] = useState<string>("all");
  const [selectedAgeFilter, setSelectedAgeFilter] = useState<string>("all");

  const weekEnd = endOfWeek(currentWeekStart, { weekStartsOn: 0 });
  const weekDays = eachDayOfInterval({ start: currentWeekStart, end: weekEnd });

  const filteredGames = useMemo(() => {
    return games.filter((game) => {
      if (selectedTeamFilter !== "all") {
        if (
          game.homeTeamId !== selectedTeamFilter &&
          game.awayTeamId !== selectedTeamFilter
        ) {
          return false;
        }
      }

      if (selectedAgeFilter !== "all") {
        const homeTeam = teams.find((t) => t.id === game.homeTeamId);
        const awayTeam = teams.find((t) => t.id === game.awayTeamId);
        if (
          homeTeam?.ageGroup !== selectedAgeFilter &&
          awayTeam?.ageGroup !== selectedAgeFilter
        ) {
          return false;
        }
      }

      return true;
    });
  }, [games, teams, selectedTeamFilter, selectedAgeFilter]);

  const getGamesForDay = (day: Date): Game[] => {
    return filteredGames.filter((game) => {
      const gameDate = scheduleDates.find((d) => d.id === game.dateId);
      if (!gameDate) return false;
      return isSameDay(new Date(gameDate.date + "T12:00:00"), day);
    });
  };

  const getGameDetails = (game: Game) => {
    const homeTeam = teams.find((t) => t.id === game.homeTeamId);
    const awayTeam = teams.find((t) => t.id === game.awayTeamId);
    const field = fields.find((f) => f.id === game.fieldId);
    const gameDate = scheduleDates.find((d) => d.id === game.dateId);
    const timeSlot = gameDate?.timeSlots.find((ts) => ts.id === game.timeSlotId);

    return { homeTeam, awayTeam, field, gameDate, timeSlot };
  };

  const handlePrint = () => {
    window.print();
  };

  const ageGroups = [...new Set(teams.map((t) => t.ageGroup))];

  const weekGamesCount = weekDays.reduce(
    (acc, day) => acc + getGamesForDay(day).length,
    0
  );

  return (
    <AppLayout title="Weekly Schedule">
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              size="icon"
              onClick={() => setCurrentWeekStart(subWeeks(currentWeekStart, 1))}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <div className="text-center">
              <h2 className="text-lg font-medium">
                {format(currentWeekStart, "MMMM d")} -{" "}
                {format(weekEnd, "MMMM d, yyyy")}
              </h2>
              <p className="text-sm text-muted-foreground">
                {weekGamesCount} games this week
              </p>
            </div>
            <Button
              variant="outline"
              size="icon"
              onClick={() => setCurrentWeekStart(addWeeks(currentWeekStart, 1))}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
          <div className="flex items-center gap-2">
            <Select
              value={selectedAgeFilter}
              onValueChange={setSelectedAgeFilter}
            >
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Age Group" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Ages</SelectItem>
                {ageGroups.map((ag) => (
                  <SelectItem key={ag} value={ag}>
                    {ag}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={selectedTeamFilter}
              onValueChange={setSelectedTeamFilter}
            >
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="Team" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Teams</SelectItem>
                {teams.map((team) => (
                  <SelectItem key={team.id} value={team.id}>
                    {team.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button variant="outline" onClick={handlePrint}>
              <Printer className="mr-2 h-4 w-4" />
              Print
            </Button>
          </div>
        </div>

        <Tabs defaultValue="calendar" className="w-full">
          <TabsList>
            <TabsTrigger value="calendar">Calendar View</TabsTrigger>
            <TabsTrigger value="list">List View</TabsTrigger>
            <TabsTrigger value="byTeam">By Team</TabsTrigger>
          </TabsList>

          <TabsContent value="calendar" className="mt-4">
            <div className="grid grid-cols-7 gap-2">
              {weekDays.map((day) => (
                <div key={day.toISOString()} className="min-h-[200px]">
                  <div className="bg-muted rounded-t-lg p-2 text-center">
                    <p className="text-xs text-muted-foreground">
                      {format(day, "EEE")}
                    </p>
                    <p className="font-medium">{format(day, "d")}</p>
                  </div>
                  <div className="border border-t-0 rounded-b-lg p-1 space-y-1 min-h-[160px]">
                    {getGamesForDay(day).map((game) => {
                      const { homeTeam, awayTeam, field, timeSlot } =
                        getGameDetails(game);
                      return (
                        <div
                          key={game.id}
                          className="p-2 rounded text-xs"
                          style={{
                            backgroundColor: homeTeam?.color
                              ? `${homeTeam.color}20`
                              : "#e5e7eb",
                            borderLeft: `3px solid ${
                              homeTeam?.color || "#6b7280"
                            }`,
                          }}
                        >
                          <p className="font-medium truncate">
                            {homeTeam?.name} vs {awayTeam?.name}
                          </p>
                          <p className="text-muted-foreground">
                            {timeSlot?.startTime}
                          </p>
                          <p className="text-muted-foreground truncate">
                            {field?.name}
                          </p>
                        </div>
                      );
                    })}
                    {getGamesForDay(day).length === 0 && (
                      <p className="text-xs text-muted-foreground text-center py-4">
                        No games
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="list" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle>Games This Week</CardTitle>
                <CardDescription>
                  {weekGamesCount} games scheduled
                </CardDescription>
              </CardHeader>
              <CardContent>
                {weekDays.map((day) => {
                  const dayGames = getGamesForDay(day);
                  if (dayGames.length === 0) return null;

                  return (
                    <div key={day.toISOString()} className="mb-6">
                      <h3 className="font-medium text-lg mb-3 flex items-center gap-2">
                        <Calendar className="h-5 w-5 text-primary" />
                        {format(day, "EEEE, MMMM d")}
                      </h3>
                      <div className="space-y-3">
                        {dayGames
                          .sort((a, b) => {
                            const slotA = scheduleDates
                              .find((d) => d.id === a.dateId)
                              ?.timeSlots.find((ts) => ts.id === a.timeSlotId);
                            const slotB = scheduleDates
                              .find((d) => d.id === b.dateId)
                              ?.timeSlots.find((ts) => ts.id === b.timeSlotId);
                            return (slotA?.startTime || "").localeCompare(
                              slotB?.startTime || ""
                            );
                          })
                          .map((game) => {
                            const { homeTeam, awayTeam, field, timeSlot } =
                              getGameDetails(game);
                            return (
                              <div
                                key={game.id}
                                className="flex items-center justify-between p-4 bg-accent/50 rounded-lg"
                              >
                                <div className="flex items-center gap-4">
                                  <div className="flex items-center gap-2">
                                    <Clock className="h-4 w-4 text-muted-foreground" />
                                    <span className="font-medium">
                                      {timeSlot?.startTime}
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <div
                                      className="w-3 h-3 rounded-full"
                                      style={{
                                        backgroundColor:
                                          homeTeam?.color || "#6b7280",
                                      }}
                                    />
                                    <span className="font-medium">
                                      {homeTeam?.name}
                                    </span>
                                    <span className="text-muted-foreground">
                                      vs
                                    </span>
                                    <div
                                      className="w-3 h-3 rounded-full"
                                      style={{
                                        backgroundColor:
                                          awayTeam?.color || "#6b7280",
                                      }}
                                    />
                                    <span className="font-medium">
                                      {awayTeam?.name}
                                    </span>
                                  </div>
                                </div>
                                <div className="flex items-center gap-4">
                                  <Badge variant="secondary">
                                    {homeTeam?.ageGroup}
                                  </Badge>
                                  <div className="flex items-center gap-2 text-muted-foreground">
                                    <MapPin className="h-4 w-4" />
                                    <span>{field?.name}</span>
                                    {game.fieldPortion !== "full" && (
                                      <span className="text-xs">
                                        ({game.fieldPortion} #{game.fieldSection})
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                      </div>
                    </div>
                  );
                })}
                {weekGamesCount === 0 && (
                  <p className="text-center text-muted-foreground py-8">
                    No games scheduled for this week.
                  </p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="byTeam" className="mt-4">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {teams.map((team) => {
                const teamGames = filteredGames.filter(
                  (g) =>
                    (g.homeTeamId === team.id || g.awayTeamId === team.id) &&
                    weekDays.some((day) => {
                      const gameDate = scheduleDates.find(
                        (d) => d.id === g.dateId
                      );
                      return (
                        gameDate &&
                        isSameDay(new Date(gameDate.date + "T12:00:00"), day)
                      );
                    })
                );

                return (
                  <Card key={team.id}>
                    <CardHeader className="pb-3">
                      <div className="flex items-center gap-2">
                        <div
                          className="w-4 h-4 rounded-full"
                          style={{ backgroundColor: team.color || "#6b7280" }}
                        />
                        <CardTitle className="text-base">{team.name}</CardTitle>
                        <Badge variant="secondary">{team.ageGroup}</Badge>
                      </div>
                      <CardDescription>
                        {teamGames.length} game{teamGames.length !== 1 ? "s" : ""}{" "}
                        this week
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      {teamGames.length === 0 ? (
                        <p className="text-sm text-muted-foreground">
                          No games this week
                        </p>
                      ) : (
                        <div className="space-y-2">
                          {teamGames.map((game) => {
                            const { homeTeam, awayTeam, field, gameDate, timeSlot } =
                              getGameDetails(game);
                            const isHome = game.homeTeamId === team.id;
                            const opponent = isHome ? awayTeam : homeTeam;

                            return (
                              <div
                                key={game.id}
                                className="p-2 bg-accent/50 rounded text-sm"
                              >
                                <div className="flex items-center justify-between">
                                  <span>
                                    {isHome ? "vs" : "@"} {opponent?.name}
                                  </span>
                                  <Badge
                                    variant={isHome ? "default" : "outline"}
                                    className="text-xs"
                                  >
                                    {isHome ? "Home" : "Away"}
                                  </Badge>
                                </div>
                                <div className="text-muted-foreground text-xs mt-1">
                                  {gameDate &&
                                    format(
                                      new Date(gameDate.date + "T12:00:00"),
                                      "EEE, MMM d"
                                    )}{" "}
                                  at {timeSlot?.startTime} - {field?.name}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </TabsContent>
        </Tabs>
      </div>

      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden;
          }
          .print-area,
          .print-area * {
            visibility: visible;
          }
          .print-area {
            position: absolute;
            left: 0;
            top: 0;
          }
        }
      `}</style>
    </AppLayout>
  );
}
