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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAppStore } from "@/store";
import { useToast } from "@/components/ui/use-toast";
import type { Team, Game } from "@/types";
import { Mail, Send, Copy, Users, Calendar, Check } from "lucide-react";
import { format, startOfWeek, endOfWeek, addWeeks } from "date-fns";

export default function EmailPage() {
  const { teams, fields, scheduleDates, games, settings } = useAppStore();
  const { toast } = useToast();

  const [selectedTeams, setSelectedTeams] = useState<Set<string>>(new Set());
  const [emailSubject, setEmailSubject] = useState(
    `${settings.seasonName} - Weekly Game Schedule`
  );
  const [emailIntro, setEmailIntro] = useState(
    "Hello Coaches,\n\nHere is the upcoming game schedule for your team. Please review and let us know if you have any questions."
  );
  const [selectedWeek, setSelectedWeek] = useState(() =>
    format(startOfWeek(new Date(), { weekStartsOn: 0 }), "yyyy-MM-dd")
  );

  const weekOptions = useMemo(() => {
    const weeks: { value: string; label: string }[] = [];
    let current = startOfWeek(new Date(), { weekStartsOn: 0 });
    for (let i = 0; i < 12; i++) {
      const weekStart = current;
      const weekEnd = endOfWeek(current, { weekStartsOn: 0 });
      weeks.push({
        value: format(weekStart, "yyyy-MM-dd"),
        label: `${format(weekStart, "MMM d")} - ${format(weekEnd, "MMM d, yyyy")}`,
      });
      current = addWeeks(current, 1);
    }
    return weeks;
  }, []);

  const getTeamGamesForWeek = (teamId: string): Game[] => {
    const weekStart = new Date(selectedWeek + "T00:00:00");
    const weekEnd = endOfWeek(weekStart, { weekStartsOn: 0 });

    return games.filter((game) => {
      if (game.homeTeamId !== teamId && game.awayTeamId !== teamId) return false;

      const gameDate = scheduleDates.find((d) => d.id === game.dateId);
      if (!gameDate) return false;

      const gDate = new Date(gameDate.date + "T12:00:00");
      return gDate >= weekStart && gDate <= weekEnd;
    });
  };

  const generateEmailBody = (team: Team): string => {
    const teamGames = getTeamGamesForWeek(team.id);

    let body = `${emailIntro}\n\n`;
    body += `Team: ${team.name} (${team.ageGroup})\n`;
    body += `Week: ${weekOptions.find((w) => w.value === selectedWeek)?.label}\n\n`;

    if (teamGames.length === 0) {
      body += "No games scheduled for this week.\n";
    } else {
      body += "UPCOMING GAMES:\n";
      body += "─".repeat(50) + "\n\n";

      teamGames
        .sort((a, b) => {
          const dateA = scheduleDates.find((d) => d.id === a.dateId)?.date || "";
          const dateB = scheduleDates.find((d) => d.id === b.dateId)?.date || "";
          return dateA.localeCompare(dateB);
        })
        .forEach((game) => {
          const isHome = game.homeTeamId === team.id;
          const opponent = teams.find(
            (t) => t.id === (isHome ? game.awayTeamId : game.homeTeamId)
          );
          const field = fields.find((f) => f.id === game.fieldId);
          const gameDate = scheduleDates.find((d) => d.id === game.dateId);
          const timeSlot = gameDate?.timeSlots.find(
            (ts) => ts.id === game.timeSlotId
          );

          if (gameDate) {
            body += `Date: ${format(new Date(gameDate.date + "T12:00:00"), "EEEE, MMMM d, yyyy")}\n`;
          }
          body += `Time: ${timeSlot?.startTime || "TBD"} - ${timeSlot?.endTime || "TBD"}\n`;
          body += `Opponent: ${opponent?.name || "TBD"}\n`;
          body += `Location: ${field?.name || "TBD"}`;
          if (game.fieldPortion !== "full") {
            body += ` (${game.fieldPortion} field, section ${game.fieldSection})`;
          }
          body += "\n";
          body += `Status: ${isHome ? "HOME" : "AWAY"}\n`;
          body += "\n";
        });
    }

    body += "─".repeat(50) + "\n";
    body += "\nGood luck!\n";
    body += `\n${settings.seasonName} League`;

    return body;
  };

  const handleSelectAll = () => {
    if (selectedTeams.size === teams.length) {
      setSelectedTeams(new Set());
    } else {
      setSelectedTeams(new Set(teams.map((t) => t.id)));
    }
  };

  const handleToggleTeam = (teamId: string) => {
    const newSelected = new Set(selectedTeams);
    if (newSelected.has(teamId)) {
      newSelected.delete(teamId);
    } else {
      newSelected.add(teamId);
    }
    setSelectedTeams(newSelected);
  };

  const getCoachEmails = (team: Team): string[] => {
    return team.coaches.map((c) => c.email).filter(Boolean);
  };

  const getAllSelectedEmails = (): string => {
    const emails: string[] = [];
    selectedTeams.forEach((teamId) => {
      const team = teams.find((t) => t.id === teamId);
      if (team) {
        emails.push(...getCoachEmails(team));
      }
    });
    return [...new Set(emails)].join(", ");
  };

  const handleCopyEmails = () => {
    const emails = getAllSelectedEmails();
    navigator.clipboard.writeText(emails);
    toast({
      title: "Emails Copied",
      description: `${emails.split(",").length} email addresses copied to clipboard.`,
    });
  };

  const handleSendEmail = (team: Team) => {
    const emails = getCoachEmails(team);
    if (emails.length === 0) {
      toast({
        title: "No Email Addresses",
        description: `No coach emails found for ${team.name}. Please add coach contact information.`,
        variant: "destructive",
      });
      return;
    }

    const body = generateEmailBody(team);
    const mailtoLink = `mailto:${emails.join(",")}?subject=${encodeURIComponent(
      emailSubject
    )}&body=${encodeURIComponent(body)}`;

    window.open(mailtoLink, "_blank");

    toast({
      title: "Email Opened",
      description: `Email client opened for ${team.name}.`,
    });
  };

  const handleSendToSelected = () => {
    if (selectedTeams.size === 0) {
      toast({
        title: "No Teams Selected",
        description: "Please select at least one team to email.",
        variant: "destructive",
      });
      return;
    }

    selectedTeams.forEach((teamId) => {
      const team = teams.find((t) => t.id === teamId);
      if (team) {
        const emails = getCoachEmails(team);
        if (emails.length > 0) {
          const body = generateEmailBody(team);
          const mailtoLink = `mailto:${emails.join(",")}?subject=${encodeURIComponent(
            emailSubject
          )}&body=${encodeURIComponent(body)}`;
          window.open(mailtoLink, "_blank");
        }
      }
    });

    toast({
      title: "Emails Initiated",
      description: `Opening email client for ${selectedTeams.size} teams.`,
    });
  };

  const teamsWithCoaches = teams.filter((t) => t.coaches.length > 0);
  const teamsWithoutCoaches = teams.filter((t) => t.coaches.length === 0);

  return (
    <AppLayout title="Email Coaches">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-medium">Send Schedules to Coaches</h2>
            <p className="text-sm text-muted-foreground">
              Email weekly game schedules to team coaches
            </p>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Email Settings</CardTitle>
                <CardDescription>
                  Customize the email subject and introduction
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-2">
                  <Label htmlFor="week">Select Week</Label>
                  <Select value={selectedWeek} onValueChange={setSelectedWeek}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {weekOptions.map((week) => (
                        <SelectItem key={week.value} value={week.value}>
                          {week.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="subject">Email Subject</Label>
                  <Input
                    id="subject"
                    value={emailSubject}
                    onChange={(e) => setEmailSubject(e.target.value)}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="intro">Introduction Message</Label>
                  <Textarea
                    id="intro"
                    value={emailIntro}
                    onChange={(e) => setEmailIntro(e.target.value)}
                    rows={4}
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Select Teams</CardTitle>
                    <CardDescription>
                      Choose which teams to send schedules to
                    </CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={handleSelectAll}>
                      {selectedTeams.size === teams.length
                        ? "Deselect All"
                        : "Select All"}
                    </Button>
                    <Button variant="outline" size="sm" onClick={handleCopyEmails}>
                      <Copy className="mr-2 h-4 w-4" />
                      Copy Emails
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {teams.length === 0 ? (
                  <p className="text-muted-foreground text-center py-4">
                    No teams added yet. Add teams to send schedules.
                  </p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-12"></TableHead>
                        <TableHead>Team</TableHead>
                        <TableHead>Coaches</TableHead>
                        <TableHead>Games This Week</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {teams.map((team) => {
                        const teamGames = getTeamGamesForWeek(team.id);
                        const hasCoaches = team.coaches.length > 0;

                        return (
                          <TableRow key={team.id}>
                            <TableCell>
                              <Checkbox
                                checked={selectedTeams.has(team.id)}
                                onCheckedChange={() => handleToggleTeam(team.id)}
                                disabled={!hasCoaches}
                              />
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <div
                                  className="w-3 h-3 rounded-full"
                                  style={{
                                    backgroundColor: team.color || "#6b7280",
                                  }}
                                />
                                <span className="font-medium">{team.name}</span>
                                <Badge variant="secondary">{team.ageGroup}</Badge>
                              </div>
                            </TableCell>
                            <TableCell>
                              {hasCoaches ? (
                                <div className="space-y-1">
                                  {team.coaches.map((coach) => (
                                    <div
                                      key={coach.id}
                                      className="text-sm flex items-center gap-1"
                                    >
                                      <Mail className="h-3 w-3 text-muted-foreground" />
                                      {coach.email}
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                <span className="text-sm text-muted-foreground">
                                  No coaches added
                                </span>
                              )}
                            </TableCell>
                            <TableCell>
                              <Badge
                                variant={
                                  teamGames.length > 0 ? "default" : "secondary"
                                }
                              >
                                {teamGames.length} game
                                {teamGames.length !== 1 ? "s" : ""}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleSendEmail(team)}
                                disabled={!hasCoaches}
                              >
                                <Send className="h-4 w-4" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Send Emails</CardTitle>
                <CardDescription>
                  {selectedTeams.size} team{selectedTeams.size !== 1 ? "s" : ""}{" "}
                  selected
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button
                  className="w-full"
                  onClick={handleSendToSelected}
                  disabled={selectedTeams.size === 0}
                >
                  <Send className="mr-2 h-4 w-4" />
                  Send to Selected Teams
                </Button>
                <p className="text-xs text-muted-foreground text-center">
                  This will open your default email client for each team
                </p>
              </CardContent>
            </Card>

            {teamsWithoutCoaches.length > 0 && (
              <Card className="border-yellow-500/50 bg-yellow-500/10">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    Missing Coach Info
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-2">
                    These teams don&apos;t have coach emails:
                  </p>
                  <ul className="text-sm space-y-1">
                    {teamsWithoutCoaches.map((team) => (
                      <li key={team.id}>{team.name}</li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Email Preview</CardTitle>
                <CardDescription>
                  Preview for first selected team
                </CardDescription>
              </CardHeader>
              <CardContent>
                {selectedTeams.size > 0 ? (
                  <div className="bg-muted p-4 rounded-lg text-xs font-mono whitespace-pre-wrap max-h-[400px] overflow-auto">
                    {generateEmailBody(
                      teams.find((t) => selectedTeams.has(t.id))!
                    )}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    Select a team to preview email
                  </p>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
