"use client";

import { useState } from "react";
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useAppStore } from "@/store";
import { useToast } from "@/components/ui/use-toast";
import { generateSchedule } from "@/lib/schedule-generator";
import type { Game, FieldType } from "@/types";
import {
  Plus,
  Trash2,
  Wand2,
  Calendar,
  MapPin,
  Users,
  AlertTriangle,
} from "lucide-react";
import { format } from "date-fns";

export default function GamesPage() {
  const {
    teams,
    fields,
    scheduleDates,
    games,
    addGame,
    deleteGame,
    settings,
  } = useAppStore();
  const { toast } = useToast();

  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isGenerateDialogOpen, setIsGenerateDialogOpen] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [clearAllConfirm, setClearAllConfirm] = useState(false);

  const [formData, setFormData] = useState({
    homeTeamId: "",
    awayTeamId: "",
    fieldId: "",
    fieldPortion: "full" as FieldType,
    fieldSection: 1,
    dateId: "",
    timeSlotId: "",
  });

  const [generateOptions, setGenerateOptions] = useState({
    avoidBackToBack: true,
    balanceHomeAway: true,
    prioritizeAgeGroups: true,
    separateSameOrgTeams: true,
  });

  const resetForm = () => {
    setFormData({
      homeTeamId: "",
      awayTeamId: "",
      fieldId: "",
      fieldPortion: "full",
      fieldSection: 1,
      dateId: "",
      timeSlotId: "",
    });
  };

  const handleAddGame = () => {
    if (
      !formData.homeTeamId ||
      !formData.awayTeamId ||
      !formData.fieldId ||
      !formData.dateId ||
      !formData.timeSlotId
    ) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    if (formData.homeTeamId === formData.awayTeamId) {
      toast({
        title: "Error",
        description: "Home and away teams must be different",
        variant: "destructive",
      });
      return;
    }

    addGame({
      homeTeamId: formData.homeTeamId,
      awayTeamId: formData.awayTeamId,
      fieldId: formData.fieldId,
      fieldPortion: formData.fieldPortion,
      fieldSection:
        formData.fieldPortion !== "full" ? formData.fieldSection : undefined,
      dateId: formData.dateId,
      timeSlotId: formData.timeSlotId,
      status: "scheduled",
    });

    toast({
      title: "Game Added",
      description: "Game has been scheduled successfully.",
    });

    resetForm();
    setIsAddDialogOpen(false);
  };

  const handleGenerateSchedule = () => {
    const newGames = generateSchedule(
      teams,
      fields,
      scheduleDates,
      games,
      generateOptions
    );

    if (newGames.length === 0) {
      toast({
        title: "No Games Generated",
        description:
          "Unable to generate games. Make sure you have teams, fields, and active dates with time slots.",
        variant: "destructive",
      });
      return;
    }

    newGames.forEach((game) => {
      addGame({
        homeTeamId: game.homeTeamId,
        awayTeamId: game.awayTeamId,
        fieldId: game.fieldId,
        fieldPortion: game.fieldPortion,
        fieldSection: game.fieldSection,
        dateId: game.dateId,
        timeSlotId: game.timeSlotId,
        status: "scheduled",
      });
    });

    toast({
      title: "Schedule Generated",
      description: `${newGames.length} games have been scheduled.`,
    });

    setIsGenerateDialogOpen(false);
  };

  const handleDeleteGame = (id: string) => {
    deleteGame(id);
    toast({
      title: "Game Deleted",
      description: "Game has been removed from the schedule.",
    });
    setDeleteConfirmId(null);
  };

  const handleClearAll = () => {
    games.forEach((g) => deleteGame(g.id));
    toast({
      title: "All Games Cleared",
      description: "All scheduled games have been removed.",
    });
    setClearAllConfirm(false);
  };

  const selectedDate = scheduleDates.find((d) => d.id === formData.dateId);
  const selectedField = fields.find((f) => f.id === formData.fieldId);

  const getGameDetails = (game: Game) => {
    const homeTeam = teams.find((t) => t.id === game.homeTeamId);
    const awayTeam = teams.find((t) => t.id === game.awayTeamId);
    const field = fields.find((f) => f.id === game.fieldId);
    const gameDate = scheduleDates.find((d) => d.id === game.dateId);
    const timeSlot = gameDate?.timeSlots.find((ts) => ts.id === game.timeSlotId);

    return { homeTeam, awayTeam, field, gameDate, timeSlot };
  };

  const sortedGames = [...games].sort((a, b) => {
    const dateA = scheduleDates.find((d) => d.id === a.dateId)?.date || "";
    const dateB = scheduleDates.find((d) => d.id === b.dateId)?.date || "";
    if (dateA !== dateB) return dateA.localeCompare(dateB);

    const slotA = scheduleDates
      .find((d) => d.id === a.dateId)
      ?.timeSlots.find((ts) => ts.id === a.timeSlotId)?.startTime || "";
    const slotB = scheduleDates
      .find((d) => d.id === b.dateId)
      ?.timeSlots.find((ts) => ts.id === b.timeSlotId)?.startTime || "";
    return slotA.localeCompare(slotB);
  });

  const canGenerate =
    teams.length >= 2 &&
    fields.length >= 1 &&
    scheduleDates.some((d) => d.isActive && d.timeSlots.length > 0);

  return (
    <AppLayout title="Games">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-medium">Manage Games</h2>
            <p className="text-sm text-muted-foreground">
              Schedule games manually or generate a full schedule automatically
            </p>
          </div>
          <div className="flex gap-2">
            {games.length > 0 && (
              <Button variant="outline" onClick={() => setClearAllConfirm(true)}>
                <Trash2 className="mr-2 h-4 w-4" />
                Clear All
              </Button>
            )}
            <Dialog
              open={isGenerateDialogOpen}
              onOpenChange={setIsGenerateDialogOpen}
            >
              <DialogTrigger asChild>
                <Button variant="secondary" disabled={!canGenerate}>
                  <Wand2 className="mr-2 h-4 w-4" />
                  Auto Generate
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Generate Schedule</DialogTitle>
                  <DialogDescription>
                    Automatically generate games based on your teams, fields, and
                    dates.
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Avoid Back-to-Back Games</Label>
                      <p className="text-sm text-muted-foreground">
                        Teams won&apos;t play consecutive games
                      </p>
                    </div>
                    <Switch
                      checked={generateOptions.avoidBackToBack}
                      onCheckedChange={(checked) =>
                        setGenerateOptions({
                          ...generateOptions,
                          avoidBackToBack: checked,
                        })
                      }
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Balance Home/Away</Label>
                      <p className="text-sm text-muted-foreground">
                        Distribute home and away games evenly
                      </p>
                    </div>
                    <Switch
                      checked={generateOptions.balanceHomeAway}
                      onCheckedChange={(checked) =>
                        setGenerateOptions({
                          ...generateOptions,
                          balanceHomeAway: checked,
                        })
                      }
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Match by Age Group</Label>
                      <p className="text-sm text-muted-foreground">
                        Teams only play within their age group
                      </p>
                    </div>
                    <Switch
                      checked={generateOptions.prioritizeAgeGroups}
                      onCheckedChange={(checked) =>
                        setGenerateOptions({
                          ...generateOptions,
                          prioritizeAgeGroups: checked,
                        })
                      }
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Separate Same-Org Teams</Label>
                      <p className="text-sm text-muted-foreground">
                        Teams from the same organization play at different times
                      </p>
                    </div>
                    <Switch
                      checked={generateOptions.separateSameOrgTeams}
                      onCheckedChange={(checked) =>
                        setGenerateOptions({
                          ...generateOptions,
                          separateSameOrgTeams: checked,
                        })
                      }
                    />
                  </div>

                  <div className="bg-accent/50 p-4 rounded-lg space-y-2">
                    <p className="text-sm font-medium">Current Setup:</p>
                    <ul className="text-sm text-muted-foreground space-y-1">
                      <li>
                        {teams.length} teams across{" "}
                        {new Set(teams.map((t) => t.ageGroup)).size} age groups
                      </li>
                      <li>{fields.length} fields available</li>
                      <li>
                        {scheduleDates.filter((d) => d.isActive).length} active
                        dates
                      </li>
                      <li>
                        {scheduleDates.reduce(
                          (acc, d) => acc + d.timeSlots.length,
                          0
                        )}{" "}
                        total time slots
                      </li>
                    </ul>
                  </div>
                </div>
                <DialogFooter>
                  <Button
                    variant="outline"
                    onClick={() => setIsGenerateDialogOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button onClick={handleGenerateSchedule}>
                    <Wand2 className="mr-2 h-4 w-4" />
                    Generate Schedule
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Game
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Schedule Game</DialogTitle>
                  <DialogDescription>
                    Manually schedule a game between two teams.
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label>Home Team</Label>
                    <Select
                      value={formData.homeTeamId}
                      onValueChange={(value) =>
                        setFormData({ ...formData, homeTeamId: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select home team" />
                      </SelectTrigger>
                      <SelectContent>
                        {teams.map((team) => (
                          <SelectItem key={team.id} value={team.id}>
                            {team.name} ({team.ageGroup})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-2">
                    <Label>Away Team</Label>
                    <Select
                      value={formData.awayTeamId}
                      onValueChange={(value) =>
                        setFormData({ ...formData, awayTeamId: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select away team" />
                      </SelectTrigger>
                      <SelectContent>
                        {teams
                          .filter((t) => t.id !== formData.homeTeamId)
                          .map((team) => (
                            <SelectItem key={team.id} value={team.id}>
                              {team.name} ({team.ageGroup})
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-2">
                    <Label>Date</Label>
                    <Select
                      value={formData.dateId}
                      onValueChange={(value) =>
                        setFormData({ ...formData, dateId: value, timeSlotId: "" })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select date" />
                      </SelectTrigger>
                      <SelectContent>
                        {scheduleDates
                          .filter((d) => d.isActive)
                          .map((date) => (
                            <SelectItem key={date.id} value={date.id}>
                              {format(new Date(date.date + "T12:00:00"), "MMM d, yyyy")}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                  </div>
                  {selectedDate && (
                    <div className="grid gap-2">
                      <Label>Time Slot</Label>
                      <Select
                        value={formData.timeSlotId}
                        onValueChange={(value) =>
                          setFormData({ ...formData, timeSlotId: value })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select time slot" />
                        </SelectTrigger>
                        <SelectContent>
                          {selectedDate.timeSlots.map((slot) => (
                            <SelectItem key={slot.id} value={slot.id}>
                              {slot.startTime} - {slot.endTime}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                  <div className="grid gap-2">
                    <Label>Field</Label>
                    <Select
                      value={formData.fieldId}
                      onValueChange={(value) =>
                        setFormData({ ...formData, fieldId: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select field" />
                      </SelectTrigger>
                      <SelectContent>
                        {fields.map((field) => (
                          <SelectItem key={field.id} value={field.id}>
                            {field.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  {selectedField?.canSplit && (
                    <>
                      <div className="grid gap-2">
                        <Label>Field Portion</Label>
                        <Select
                          value={formData.fieldPortion}
                          onValueChange={(value: FieldType) =>
                            setFormData({ ...formData, fieldPortion: value })
                          }
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="full">Full Field</SelectItem>
                            <SelectItem value="half">Half Field</SelectItem>
                            {selectedField.maxSplits === 3 && (
                              <SelectItem value="third">Third Field</SelectItem>
                            )}
                          </SelectContent>
                        </Select>
                      </div>
                      {formData.fieldPortion !== "full" && (
                        <div className="grid gap-2">
                          <Label>Field Section</Label>
                          <Select
                            value={formData.fieldSection.toString()}
                            onValueChange={(value) =>
                              setFormData({
                                ...formData,
                                fieldSection: parseInt(value),
                              })
                            }
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {Array.from(
                                { length: selectedField.maxSplits },
                                (_, i) => i + 1
                              ).map((section) => (
                                <SelectItem
                                  key={section}
                                  value={section.toString()}
                                >
                                  Section {section}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      )}
                    </>
                  )}
                </div>
                <DialogFooter>
                  <Button
                    variant="outline"
                    onClick={() => setIsAddDialogOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button onClick={handleAddGame}>Schedule Game</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {!canGenerate && (
          <Card className="border-yellow-500/50 bg-yellow-500/10">
            <CardContent className="flex items-center gap-3 py-4">
              <AlertTriangle className="h-5 w-5 text-yellow-600" />
              <div>
                <p className="font-medium">Setup Required</p>
                <p className="text-sm text-muted-foreground">
                  To generate a schedule, you need at least 2 teams, 1 field, and
                  active dates with time slots.
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {sortedGames.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-10">
              <Calendar className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground mb-4">
                No games scheduled yet.
              </p>
              <div className="flex gap-2">
                <Button
                  variant="secondary"
                  onClick={() => setIsGenerateDialogOpen(true)}
                  disabled={!canGenerate}
                >
                  <Wand2 className="mr-2 h-4 w-4" />
                  Auto Generate
                </Button>
                <Button onClick={() => setIsAddDialogOpen(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Manually
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>Scheduled Games ({games.length})</CardTitle>
              <CardDescription>
                All scheduled games sorted by date and time
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date & Time</TableHead>
                    <TableHead>Matchup</TableHead>
                    <TableHead>Field</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sortedGames.map((game) => {
                    const { homeTeam, awayTeam, field, gameDate, timeSlot } =
                      getGameDetails(game);

                    return (
                      <TableRow key={game.id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                            <div>
                              <p className="font-medium">
                                {gameDate
                                  ? format(
                                      new Date(gameDate.date + "T12:00:00"),
                                      "MMM d, yyyy"
                                    )
                                  : "N/A"}
                              </p>
                              <p className="text-sm text-muted-foreground">
                                {timeSlot
                                  ? `${timeSlot.startTime} - ${timeSlot.endTime}`
                                  : "N/A"}
                              </p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Users className="h-4 w-4 text-muted-foreground" />
                            <div>
                              <p>
                                <span className="font-medium">
                                  {homeTeam?.name || "TBD"}
                                </span>
                                <span className="text-muted-foreground">
                                  {" "}
                                  vs{" "}
                                </span>
                                <span className="font-medium">
                                  {awayTeam?.name || "TBD"}
                                </span>
                              </p>
                              <p className="text-sm text-muted-foreground">
                                {homeTeam?.ageGroup || ""}
                              </p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <MapPin className="h-4 w-4 text-muted-foreground" />
                            <div>
                              <p>{field?.name || "TBD"}</p>
                              {game.fieldPortion !== "full" && (
                                <p className="text-sm text-muted-foreground">
                                  {game.fieldPortion} - Section{" "}
                                  {game.fieldSection}
                                </p>
                              )}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              game.status === "scheduled"
                                ? "default"
                                : game.status === "completed"
                                ? "secondary"
                                : "destructive"
                            }
                          >
                            {game.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setDeleteConfirmId(game.id)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}

        <AlertDialog
          open={deleteConfirmId !== null}
          onOpenChange={() => setDeleteConfirmId(null)}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Game?</AlertDialogTitle>
              <AlertDialogDescription>
                This will remove this game from the schedule. This action cannot
                be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => deleteConfirmId && handleDeleteGame(deleteConfirmId)}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        <AlertDialog open={clearAllConfirm} onOpenChange={setClearAllConfirm}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Clear All Games?</AlertDialogTitle>
              <AlertDialogDescription>
                This will remove all {games.length} scheduled games. This action
                cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleClearAll}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                Clear All
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </AppLayout>
  );
}
