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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
import { Switch } from "@/components/ui/switch";
import { useAppStore } from "@/store";
import { useToast } from "@/components/ui/use-toast";
import type { Season, SeasonStatus } from "@/types";
import { Plus, Pencil, Trash2, Calendar, Star, CheckCircle2 } from "lucide-react";
import { format } from "date-fns";

const statusColors: Record<SeasonStatus, string> = {
  planning: "bg-yellow-500",
  active: "bg-green-500",
  completed: "bg-blue-500",
  archived: "bg-gray-500",
};

const statusLabels: Record<SeasonStatus, string> = {
  planning: "Planning",
  active: "Active",
  completed: "Completed",
  archived: "Archived",
};

export default function SeasonsPage() {
  const {
    seasons,
    games,
    fieldAllocations,
    currentSeasonId,
    addSeason,
    updateSeason,
    deleteSeason,
    setCurrentSeason,
  } = useAppStore();
  const { toast } = useToast();

  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [selectedSeason, setSelectedSeason] = useState<Season | null>(null);

  const [formData, setFormData] = useState({
    name: "",
    startDate: "",
    endDate: "",
    status: "planning" as SeasonStatus,
    isDefault: false,
    notes: "",
  });

  const resetForm = () => {
    const today = new Date();
    const threeMonthsLater = new Date(today);
    threeMonthsLater.setMonth(threeMonthsLater.getMonth() + 3);

    setFormData({
      name: "",
      startDate: format(today, "yyyy-MM-dd"),
      endDate: format(threeMonthsLater, "yyyy-MM-dd"),
      status: "planning",
      isDefault: seasons.length === 0,
      notes: "",
    });
  };

  const handleAddSeason = () => {
    if (!formData.name.trim()) {
      toast({
        title: "Error",
        description: "Season name is required",
        variant: "destructive",
      });
      return;
    }

    if (!formData.startDate || !formData.endDate) {
      toast({
        title: "Error",
        description: "Start and end dates are required",
        variant: "destructive",
      });
      return;
    }

    if (new Date(formData.startDate) > new Date(formData.endDate)) {
      toast({
        title: "Error",
        description: "End date must be after start date",
        variant: "destructive",
      });
      return;
    }

    const id = addSeason({
      name: formData.name,
      startDate: formData.startDate,
      endDate: formData.endDate,
      status: formData.status,
      isDefault: formData.isDefault || seasons.length === 0,
      notes: formData.notes || undefined,
    });

    toast({
      title: "Season Created",
      description: `${formData.name} has been created successfully.`,
    });

    resetForm();
    setIsAddDialogOpen(false);
  };

  const handleEditSeason = () => {
    if (!selectedSeason || !formData.name.trim()) return;

    updateSeason(selectedSeason.id, {
      name: formData.name,
      startDate: formData.startDate,
      endDate: formData.endDate,
      status: formData.status,
      isDefault: formData.isDefault,
      notes: formData.notes || undefined,
    });

    toast({
      title: "Season Updated",
      description: `${formData.name} has been updated successfully.`,
    });

    setIsEditDialogOpen(false);
    setSelectedSeason(null);
  };

  const handleDeleteSeason = (id: string) => {
    const season = seasons.find((s) => s.id === id);
    const gamesCount = games.filter((g) => g.seasonId === id).length;

    if (gamesCount > 0) {
      toast({
        title: "Cannot Delete",
        description: `This season has ${gamesCount} games. Archive it instead.`,
        variant: "destructive",
      });
      setDeleteConfirmId(null);
      return;
    }

    deleteSeason(id);
    toast({
      title: "Season Deleted",
      description: `${season?.name} has been deleted.`,
    });
    setDeleteConfirmId(null);
  };

  const openEditDialog = (season: Season) => {
    setSelectedSeason(season);
    setFormData({
      name: season.name,
      startDate: season.startDate,
      endDate: season.endDate,
      status: season.status,
      isDefault: season.isDefault,
      notes: season.notes || "",
    });
    setIsEditDialogOpen(true);
  };

  const getGameCount = (seasonId: string) =>
    games.filter((g) => g.seasonId === seasonId).length;

  const getAllocationCount = (seasonId: string) =>
    fieldAllocations.filter((fa) => fa.seasonId === seasonId).length;

  const handleSetActive = (seasonId: string) => {
    setCurrentSeason(seasonId);
    toast({
      title: "Active Season Changed",
      description: "The working season has been updated.",
    });
  };

  return (
    <AppLayout title="Seasons">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-medium">Manage Seasons</h2>
            <p className="text-sm text-muted-foreground">
              Create and manage scheduling seasons (e.g., Spring 2026, Fall 2026)
            </p>
          </div>
          <Dialog open={isAddDialogOpen} onOpenChange={(open) => {
            if (open) resetForm();
            setIsAddDialogOpen(open);
          }}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Add Season
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Season</DialogTitle>
                <DialogDescription>
                  Define a new scheduling period for games and field allocations.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="name">Season Name</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    placeholder="e.g., Spring 2026"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="startDate">Start Date</Label>
                    <Input
                      id="startDate"
                      type="date"
                      value={formData.startDate}
                      onChange={(e) =>
                        setFormData({ ...formData, startDate: e.target.value })
                      }
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="endDate">End Date</Label>
                    <Input
                      id="endDate"
                      type="date"
                      value={formData.endDate}
                      onChange={(e) =>
                        setFormData({ ...formData, endDate: e.target.value })
                      }
                    />
                  </div>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="status">Status</Label>
                  <Select
                    value={formData.status}
                    onValueChange={(value: SeasonStatus) =>
                      setFormData({ ...formData, status: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="planning">Planning</SelectItem>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                      <SelectItem value="archived">Archived</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Set as Default</Label>
                    <p className="text-sm text-muted-foreground">
                      New games will use this season by default
                    </p>
                  </div>
                  <Switch
                    checked={formData.isDefault}
                    onCheckedChange={(checked) =>
                      setFormData({ ...formData, isDefault: checked })
                    }
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="notes">Notes</Label>
                  <Textarea
                    id="notes"
                    value={formData.notes}
                    onChange={(e) =>
                      setFormData({ ...formData, notes: e.target.value })
                    }
                    placeholder="Any additional notes..."
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleAddSeason}>Create Season</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {seasons.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-10">
              <Calendar className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground mb-4">
                No seasons created yet. Create your first season to start planning.
              </p>
              <Button onClick={() => {
                resetForm();
                setIsAddDialogOpen(true);
              }}>
                <Plus className="mr-2 h-4 w-4" />
                Create First Season
              </Button>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>Seasons ({seasons.length})</CardTitle>
              <CardDescription>
                Manage your scheduling periods. The active season is used for new games and allocations.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Season</TableHead>
                    <TableHead>Dates</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Games</TableHead>
                    <TableHead>Allocations</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {seasons.map((season) => (
                    <TableRow key={season.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{season.name}</span>
                          {season.isDefault && (
                            <Badge variant="secondary" className="flex items-center gap-1">
                              <Star className="h-3 w-3" />
                              Default
                            </Badge>
                          )}
                          {currentSeasonId === season.id && (
                            <Badge variant="outline" className="flex items-center gap-1">
                              <CheckCircle2 className="h-3 w-3" />
                              Active
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm">
                          {format(new Date(season.startDate), "MMM d, yyyy")} - {format(new Date(season.endDate), "MMM d, yyyy")}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="secondary"
                          className={`${statusColors[season.status]} text-white`}
                        >
                          {statusLabels[season.status]}
                        </Badge>
                      </TableCell>
                      <TableCell>{getGameCount(season.id)}</TableCell>
                      <TableCell>{getAllocationCount(season.id)}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          {currentSeasonId !== season.id && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleSetActive(season.id)}
                              title="Set as Active Season"
                            >
                              Set Active
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => openEditDialog(season)}
                            title="Edit Season"
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setDeleteConfirmId(season.id)}
                            title="Delete Season"
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}

        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Season</DialogTitle>
              <DialogDescription>
                Update the season details below.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="edit-name">Season Name</Label>
                <Input
                  id="edit-name"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="edit-startDate">Start Date</Label>
                  <Input
                    id="edit-startDate"
                    type="date"
                    value={formData.startDate}
                    onChange={(e) =>
                      setFormData({ ...formData, startDate: e.target.value })
                    }
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="edit-endDate">End Date</Label>
                  <Input
                    id="edit-endDate"
                    type="date"
                    value={formData.endDate}
                    onChange={(e) =>
                      setFormData({ ...formData, endDate: e.target.value })
                    }
                  />
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-status">Status</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value: SeasonStatus) =>
                    setFormData({ ...formData, status: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="planning">Planning</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="archived">Archived</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Set as Default</Label>
                  <p className="text-sm text-muted-foreground">
                    New games will use this season by default
                  </p>
                </div>
                <Switch
                  checked={formData.isDefault}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, isDefault: checked })
                  }
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-notes">Notes</Label>
                <Textarea
                  id="edit-notes"
                  value={formData.notes}
                  onChange={(e) =>
                    setFormData({ ...formData, notes: e.target.value })
                  }
                />
              </div>

              {selectedSeason && (
                <div className="mt-2 p-3 bg-accent rounded-md">
                  <p className="text-sm font-medium">Season Statistics</p>
                  <p className="text-sm text-muted-foreground">
                    {getGameCount(selectedSeason.id)} games, {getAllocationCount(selectedSeason.id)} field allocations
                  </p>
                </div>
              )}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleEditSeason}>Save Changes</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <AlertDialog
          open={deleteConfirmId !== null}
          onOpenChange={() => setDeleteConfirmId(null)}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Season?</AlertDialogTitle>
              <AlertDialogDescription>
                This will permanently delete the season. Seasons with existing games
                cannot be deleted - archive them instead.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => deleteConfirmId && handleDeleteSeason(deleteConfirmId)}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </AppLayout>
  );
}
