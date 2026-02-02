"use client";

import { useState, useEffect } from "react";
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { useAppStore } from "@/store";
import { useToast } from "@/components/ui/use-toast";
import {
  Calendar as CalendarIcon,
  Save,
  Trash2,
  Download,
  Upload,
  AlertTriangle,
  Sparkles,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

export default function SettingsPage() {
  const { settings, updateSettings, clearAllData, teams, fields, scheduleDates, games, seasons, locations, fieldAllocations } =
    useAppStore();
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    seasonName: settings.seasonName,
    seasonStartDate: new Date(settings.seasonStartDate),
    seasonEndDate: new Date(settings.seasonEndDate),
    defaultGameDuration: settings.defaultGameDuration,
    avoidBackToBackGames: settings.avoidBackToBackGames,
    balanceHomeAway: settings.balanceHomeAway,
    minGamesBetweenTeams: settings.minGamesBetweenTeams,
    separateSameOrgTeams: settings.separateSameOrgTeams ?? true,
    aiSchedulingEnabled: settings.aiSchedulingEnabled ?? false,
  });

  const [clearConfirm, setClearConfirm] = useState(false);
  const [aiStatus, setAiStatus] = useState<{ enabled: boolean; endpoint?: string; deployment?: string } | null>(null);
  const [checkingAI, setCheckingAI] = useState(false);

  // Check AI status on mount
  useEffect(() => {
    checkAIStatus();
  }, []);

  const checkAIStatus = async () => {
    setCheckingAI(true);
    try {
      const response = await fetch("/api/ai-schedule");
      if (response.ok) {
        const status = await response.json();
        setAiStatus(status);
      }
    } catch (error) {
      setAiStatus({ enabled: false });
    }
    setCheckingAI(false);
  };

  const handleSave = () => {
    updateSettings({
      seasonName: formData.seasonName,
      seasonStartDate: format(formData.seasonStartDate, "yyyy-MM-dd"),
      seasonEndDate: format(formData.seasonEndDate, "yyyy-MM-dd"),
      defaultGameDuration: formData.defaultGameDuration,
      avoidBackToBackGames: formData.avoidBackToBackGames,
      balanceHomeAway: formData.balanceHomeAway,
      minGamesBetweenTeams: formData.minGamesBetweenTeams,
      separateSameOrgTeams: formData.separateSameOrgTeams,
      aiSchedulingEnabled: formData.aiSchedulingEnabled,
    });

    toast({
      title: "Settings Saved",
      description: "Your settings have been updated.",
    });
  };

  const handleClearAll = () => {
    clearAllData();
    toast({
      title: "Data Cleared",
      description: "All data has been removed.",
    });
    setClearConfirm(false);
  };

  const handleExport = () => {
    const data = {
      teams,
      fields,
      scheduleDates,
      games,
      settings,
      exportedAt: new Date().toISOString(),
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `laxplan-export-${format(new Date(), "yyyy-MM-dd")}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast({
      title: "Data Exported",
      description: "Your data has been exported to a JSON file.",
    });
  };

  const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target?.result as string);

        if (data.teams) {
          data.teams.forEach((team: any) => {
            useAppStore.getState().addTeam(team);
          });
        }
        if (data.fields) {
          data.fields.forEach((field: any) => {
            useAppStore.getState().addField(field);
          });
        }
        if (data.scheduleDates) {
          data.scheduleDates.forEach((date: any) => {
            useAppStore.getState().addScheduleDate(date);
          });
        }
        if (data.games) {
          data.games.forEach((game: any) => {
            useAppStore.getState().addGame(game);
          });
        }
        if (data.settings) {
          useAppStore.getState().updateSettings(data.settings);
        }

        toast({
          title: "Data Imported",
          description: "Your data has been imported successfully.",
        });
      } catch {
        toast({
          title: "Import Failed",
          description: "Failed to parse the import file. Please check the format.",
          variant: "destructive",
        });
      }
    };
    reader.readAsText(file);

    event.target.value = "";
  };

  return (
    <AppLayout title="Settings">
      <div className="space-y-6 max-w-2xl">
        <Card>
          <CardHeader>
            <CardTitle>Season Settings</CardTitle>
            <CardDescription>
              Configure your lacrosse season details
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-2">
              <Label htmlFor="seasonName">Season Name</Label>
              <Input
                id="seasonName"
                value={formData.seasonName}
                onChange={(e) =>
                  setFormData({ ...formData, seasonName: e.target.value })
                }
                placeholder="e.g., Spring 2024"
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="grid gap-2">
                <Label>Season Start Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "justify-start text-left font-normal",
                        !formData.seasonStartDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {formData.seasonStartDate
                        ? format(formData.seasonStartDate, "PPP")
                        : "Pick a date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={formData.seasonStartDate}
                      onSelect={(date) =>
                        date &&
                        setFormData({ ...formData, seasonStartDate: date })
                      }
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div className="grid gap-2">
                <Label>Season End Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "justify-start text-left font-normal",
                        !formData.seasonEndDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {formData.seasonEndDate
                        ? format(formData.seasonEndDate, "PPP")
                        : "Pick a date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={formData.seasonEndDate}
                      onSelect={(date) =>
                        date && setFormData({ ...formData, seasonEndDate: date })
                      }
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="gameDuration">Default Game Duration (minutes)</Label>
              <Input
                id="gameDuration"
                type="number"
                min="15"
                max="120"
                value={formData.defaultGameDuration}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    defaultGameDuration: parseInt(e.target.value) || 60,
                  })
                }
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Scheduling Preferences</CardTitle>
            <CardDescription>
              Configure default options for schedule generation
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Avoid Back-to-Back Games</Label>
                <p className="text-sm text-muted-foreground">
                  Teams won&apos;t be scheduled for consecutive games
                </p>
              </div>
              <Switch
                checked={formData.avoidBackToBackGames}
                onCheckedChange={(checked) =>
                  setFormData({ ...formData, avoidBackToBackGames: checked })
                }
              />
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Balance Home/Away Games</Label>
                <p className="text-sm text-muted-foreground">
                  Distribute home and away games evenly across teams
                </p>
              </div>
              <Switch
                checked={formData.balanceHomeAway}
                onCheckedChange={(checked) =>
                  setFormData({ ...formData, balanceHomeAway: checked })
                }
              />
            </div>

            <Separator />

            <div className="grid gap-2">
              <Label htmlFor="minGames">
                Minimum Weeks Between Rematches
              </Label>
              <Input
                id="minGames"
                type="number"
                min="1"
                max="10"
                value={formData.minGamesBetweenTeams}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    minGamesBetweenTeams: parseInt(e.target.value) || 2,
                  })
                }
              />
              <p className="text-sm text-muted-foreground">
                The minimum number of weeks before two teams play each other again
              </p>
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Separate Same-Organization Teams</Label>
                <p className="text-sm text-muted-foreground">
                  Schedule teams from the same organization at different times when possible
                </p>
              </div>
              <Switch
                checked={formData.separateSameOrgTeams}
                onCheckedChange={(checked) =>
                  setFormData({ ...formData, separateSameOrgTeams: checked })
                }
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5" />
              AI Scheduling
            </CardTitle>
            <CardDescription>
              Use Azure OpenAI to optimize schedule generation
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Enable AI Scheduling</Label>
                <p className="text-sm text-muted-foreground">
                  Use AI to optimize game schedules based on constraints
                </p>
              </div>
              <Switch
                checked={formData.aiSchedulingEnabled}
                onCheckedChange={(checked) =>
                  setFormData({ ...formData, aiSchedulingEnabled: checked })
                }
                disabled={!aiStatus?.enabled}
              />
            </div>

            <Separator />

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>Azure OpenAI Status</Label>
                <Button variant="ghost" size="sm" onClick={checkAIStatus} disabled={checkingAI}>
                  {checkingAI ? "Checking..." : "Refresh"}
                </Button>
              </div>

              {aiStatus ? (
                <div className="bg-accent rounded-lg p-4 space-y-2">
                  <div className="flex items-center gap-2">
                    {aiStatus.enabled ? (
                      <>
                        <CheckCircle2 className="h-5 w-5 text-green-500" />
                        <span className="font-medium text-green-700 dark:text-green-400">Connected</span>
                      </>
                    ) : (
                      <>
                        <XCircle className="h-5 w-5 text-orange-500" />
                        <span className="font-medium text-orange-700 dark:text-orange-400">Not Configured</span>
                      </>
                    )}
                  </div>

                  {aiStatus.enabled ? (
                    <div className="text-sm text-muted-foreground space-y-1">
                      <p>Endpoint: {aiStatus.endpoint}</p>
                      <p>Deployment: {aiStatus.deployment}</p>
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      Set <code className="bg-background px-1 rounded">AZURE_OPENAI_ENDPOINT</code> and{" "}
                      <code className="bg-background px-1 rounded">AZURE_OPENAI_API_KEY</code> environment variables to enable AI scheduling.
                    </p>
                  )}
                </div>
              ) : (
                <div className="bg-accent rounded-lg p-4">
                  <p className="text-sm text-muted-foreground">Checking AI configuration...</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Data Management</CardTitle>
            <CardDescription>
              Export, import, or clear your data
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap gap-4">
              <Button variant="outline" onClick={handleExport}>
                <Download className="mr-2 h-4 w-4" />
                Export Data
              </Button>
              <div className="relative">
                <Button variant="outline" asChild>
                  <label className="cursor-pointer">
                    <Upload className="mr-2 h-4 w-4" />
                    Import Data
                    <input
                      type="file"
                      accept=".json"
                      onChange={handleImport}
                      className="hidden"
                    />
                  </label>
                </Button>
              </div>
            </div>

            <Separator />

            <div className="bg-destructive/10 border border-destructive/50 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-destructive mt-0.5" />
                <div className="flex-1">
                  <h4 className="font-medium text-destructive">Danger Zone</h4>
                  <p className="text-sm text-muted-foreground mt-1">
                    Clear all data including teams, fields, dates, and scheduled
                    games. This action cannot be undone.
                  </p>
                  <Button
                    variant="destructive"
                    className="mt-3"
                    onClick={() => setClearConfirm(true)}
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Clear All Data
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end">
          <Button onClick={handleSave}>
            <Save className="mr-2 h-4 w-4" />
            Save Settings
          </Button>
        </div>

        <AlertDialog open={clearConfirm} onOpenChange={setClearConfirm}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Clear All Data?</AlertDialogTitle>
              <AlertDialogDescription>
                This will permanently delete:
                <ul className="list-disc list-inside mt-2">
                  <li>{seasons.length} seasons</li>
                  <li>{teams.length} teams</li>
                  <li>{locations.length} locations</li>
                  <li>{fields.length} fields</li>
                  <li>{fieldAllocations.length} field allocations</li>
                  <li>{scheduleDates.length} dates</li>
                  <li>{games.length} scheduled games</li>
                </ul>
                <p className="mt-2">This action cannot be undone.</p>
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleClearAll}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                Clear All Data
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </AppLayout>
  );
}
