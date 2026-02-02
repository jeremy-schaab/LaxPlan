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
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAppStore } from "@/store";
import { useToast } from "@/components/ui/use-toast";
import type { FieldAllocation, TimeSlot } from "@/types";
import { Plus, Pencil, Trash2, Calendar, MapPin, Users, Clock, Zap } from "lucide-react";
import { format } from "date-fns";
import { v4 as uuidv4 } from "uuid";

export default function AllocationsPage() {
  const {
    seasons,
    locations,
    fields,
    organizations,
    teams,
    fieldAllocations,
    currentSeasonId,
    addFieldAllocation,
    updateFieldAllocation,
    deleteFieldAllocation,
    getFieldsByLocation,
    getTeamsByOrganizations,
  } = useAppStore();
  const { toast } = useToast();

  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [selectedAllocation, setSelectedAllocation] = useState<FieldAllocation | null>(null);
  const [filterSeasonId, setFilterSeasonId] = useState<string>(currentSeasonId || "all");

  const [formData, setFormData] = useState({
    seasonId: currentSeasonId || "",
    date: "",
    locationId: "",
    fieldIds: [] as string[],
    organizationIds: [] as string[],
    teamIds: [] as string[],
    timeSlots: [] as TimeSlot[],
    notes: "",
  });

  const [newTimeSlot, setNewTimeSlot] = useState({ startTime: "", endTime: "" });

  const availableFieldsForLocation = useMemo(() => {
    if (!formData.locationId) return [];
    return getFieldsByLocation(formData.locationId);
  }, [formData.locationId, getFieldsByLocation]);

  const availableTeamsForOrgs = useMemo(() => {
    if (formData.organizationIds.length === 0) return [];
    return getTeamsByOrganizations(formData.organizationIds);
  }, [formData.organizationIds, getTeamsByOrganizations]);

  const filteredAllocations = useMemo(() => {
    if (filterSeasonId === "all") return fieldAllocations;
    return fieldAllocations.filter((fa) => fa.seasonId === filterSeasonId);
  }, [fieldAllocations, filterSeasonId]);

  const groupedAllocations = useMemo(() => {
    const grouped: Record<string, FieldAllocation[]> = {};
    filteredAllocations.forEach((allocation) => {
      if (!grouped[allocation.date]) {
        grouped[allocation.date] = [];
      }
      grouped[allocation.date].push(allocation);
    });
    return Object.entries(grouped).sort(([a], [b]) => a.localeCompare(b));
  }, [filteredAllocations]);

  const resetForm = () => {
    setFormData({
      seasonId: currentSeasonId || (seasons.length > 0 ? seasons[0].id : ""),
      date: format(new Date(), "yyyy-MM-dd"),
      locationId: "",
      fieldIds: [],
      organizationIds: [],
      teamIds: [],
      timeSlots: [],
      notes: "",
    });
    setNewTimeSlot({ startTime: "", endTime: "" });
  };

  const handleAddTimeSlot = () => {
    if (!newTimeSlot.startTime || !newTimeSlot.endTime) return;
    if (newTimeSlot.startTime >= newTimeSlot.endTime) {
      toast({
        title: "Invalid Time Slot",
        description: "End time must be after start time",
        variant: "destructive",
      });
      return;
    }

    const slot: TimeSlot = {
      id: uuidv4(),
      startTime: newTimeSlot.startTime,
      endTime: newTimeSlot.endTime,
    };
    setFormData({
      ...formData,
      timeSlots: [...formData.timeSlots, slot],
    });
    setNewTimeSlot({ startTime: "", endTime: "" });
  };

  const handleRemoveTimeSlot = (slotId: string) => {
    setFormData({
      ...formData,
      timeSlots: formData.timeSlots.filter((s) => s.id !== slotId),
    });
  };

  const handleAddAllocation = () => {
    if (!formData.seasonId) {
      toast({ title: "Error", description: "Please select a season", variant: "destructive" });
      return;
    }
    if (!formData.date) {
      toast({ title: "Error", description: "Please select a date", variant: "destructive" });
      return;
    }
    if (!formData.locationId) {
      toast({ title: "Error", description: "Please select a location", variant: "destructive" });
      return;
    }
    if (formData.fieldIds.length === 0) {
      toast({ title: "Error", description: "Please select at least one field", variant: "destructive" });
      return;
    }
    if (formData.timeSlots.length === 0) {
      toast({ title: "Error", description: "Please add at least one time slot", variant: "destructive" });
      return;
    }

    addFieldAllocation({
      seasonId: formData.seasonId,
      date: formData.date,
      locationId: formData.locationId,
      fieldIds: formData.fieldIds,
      organizationIds: formData.organizationIds,
      teamIds: formData.teamIds,
      timeSlots: formData.timeSlots,
      notes: formData.notes || undefined,
    });

    toast({
      title: "Allocation Created",
      description: `Field allocation for ${format(new Date(formData.date), "MMM d, yyyy")} has been created.`,
    });

    resetForm();
    setIsAddDialogOpen(false);
  };

  const handleEditAllocation = () => {
    if (!selectedAllocation) return;

    updateFieldAllocation(selectedAllocation.id, {
      seasonId: formData.seasonId,
      date: formData.date,
      locationId: formData.locationId,
      fieldIds: formData.fieldIds,
      organizationIds: formData.organizationIds,
      teamIds: formData.teamIds,
      timeSlots: formData.timeSlots,
      notes: formData.notes || undefined,
    });

    toast({
      title: "Allocation Updated",
      description: `Field allocation has been updated successfully.`,
    });

    setIsEditDialogOpen(false);
    setSelectedAllocation(null);
  };

  const handleDeleteAllocation = (id: string) => {
    deleteFieldAllocation(id);
    toast({
      title: "Allocation Deleted",
      description: "Field allocation has been deleted.",
    });
    setDeleteConfirmId(null);
  };

  const openEditDialog = (allocation: FieldAllocation) => {
    setSelectedAllocation(allocation);
    setFormData({
      seasonId: allocation.seasonId,
      date: allocation.date,
      locationId: allocation.locationId,
      fieldIds: allocation.fieldIds,
      organizationIds: allocation.organizationIds,
      teamIds: allocation.teamIds,
      timeSlots: allocation.timeSlots,
      notes: allocation.notes || "",
    });
    setIsEditDialogOpen(true);
  };

  const getLocationName = (locationId: string) =>
    locations.find((l) => l.id === locationId)?.name || "Unknown";

  const getSeasonName = (seasonId: string) =>
    seasons.find((s) => s.id === seasonId)?.name || "Unknown";

  const getFieldNames = (fieldIds: string[]) =>
    fieldIds.map((id) => fields.find((f) => f.id === id)?.name || "Unknown").join(", ");

  const getOrgNames = (orgIds: string[]) =>
    orgIds.map((id) => organizations.find((o) => o.id === id)?.name || "Unknown").join(", ");

  const quickAddTimeSlots = () => {
    const slots: TimeSlot[] = [
      { id: uuidv4(), startTime: "09:00", endTime: "10:00" },
      { id: uuidv4(), startTime: "10:15", endTime: "11:15" },
      { id: uuidv4(), startTime: "11:30", endTime: "12:30" },
      { id: uuidv4(), startTime: "12:45", endTime: "13:45" },
      { id: uuidv4(), startTime: "14:00", endTime: "15:00" },
    ];
    setFormData({ ...formData, timeSlots: slots });
  };

  const AllocationForm = () => (
    <div className="grid gap-4 py-4 max-h-[60vh] overflow-y-auto">
      <div className="grid grid-cols-2 gap-4">
        <div className="grid gap-2">
          <Label htmlFor="season">Season</Label>
          <Select
            value={formData.seasonId}
            onValueChange={(value) => setFormData({ ...formData, seasonId: value })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select season" />
            </SelectTrigger>
            <SelectContent>
              {seasons.map((season) => (
                <SelectItem key={season.id} value={season.id}>
                  {season.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="grid gap-2">
          <Label htmlFor="date">Date</Label>
          <Input
            id="date"
            type="date"
            value={formData.date}
            onChange={(e) => setFormData({ ...formData, date: e.target.value })}
          />
        </div>
      </div>

      <div className="grid gap-2">
        <Label htmlFor="location">Location</Label>
        <Select
          value={formData.locationId}
          onValueChange={(value) =>
            setFormData({ ...formData, locationId: value, fieldIds: [] })
          }
        >
          <SelectTrigger>
            <SelectValue placeholder="Select location" />
          </SelectTrigger>
          <SelectContent>
            {locations.map((location) => (
              <SelectItem key={location.id} value={location.id}>
                {location.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {formData.locationId && (
        <div className="grid gap-2">
          <Label>Available Fields at {getLocationName(formData.locationId)}</Label>
          <div className="border rounded-md p-3 space-y-2 max-h-32 overflow-y-auto">
            {availableFieldsForLocation.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No fields at this location. Add fields first.
              </p>
            ) : (
              availableFieldsForLocation.map((field) => (
                <div key={field.id} className="flex items-center space-x-2">
                  <Checkbox
                    id={`field-${field.id}`}
                    checked={formData.fieldIds.includes(field.id)}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        setFormData({
                          ...formData,
                          fieldIds: [...formData.fieldIds, field.id],
                        });
                      } else {
                        setFormData({
                          ...formData,
                          fieldIds: formData.fieldIds.filter((id) => id !== field.id),
                        });
                      }
                    }}
                  />
                  <label htmlFor={`field-${field.id}`} className="text-sm">
                    {field.name}
                    {field.canSplit && (
                      <span className="text-muted-foreground ml-1">
                        (can split to {field.maxSplits})
                      </span>
                    )}
                  </label>
                </div>
              ))
            )}
          </div>
          {formData.fieldIds.length > 0 && (
            <p className="text-sm text-muted-foreground">
              {formData.fieldIds.length} field(s) selected
            </p>
          )}
        </div>
      )}

      <div className="grid gap-2">
        <Label>Organizations Playing</Label>
        <div className="border rounded-md p-3 space-y-2 max-h-32 overflow-y-auto">
          {organizations.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No organizations available. Add organizations first.
            </p>
          ) : (
            organizations.map((org) => (
              <div key={org.id} className="flex items-center space-x-2">
                <Checkbox
                  id={`org-${org.id}`}
                  checked={formData.organizationIds.includes(org.id)}
                  onCheckedChange={(checked) => {
                    if (checked) {
                      setFormData({
                        ...formData,
                        organizationIds: [...formData.organizationIds, org.id],
                        teamIds: [],
                      });
                    } else {
                      setFormData({
                        ...formData,
                        organizationIds: formData.organizationIds.filter((id) => id !== org.id),
                        teamIds: [],
                      });
                    }
                  }}
                />
                <label htmlFor={`org-${org.id}`} className="text-sm flex items-center gap-2">
                  {org.color && (
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: org.color }}
                    />
                  )}
                  {org.name}
                </label>
              </div>
            ))
          )}
        </div>
      </div>

      {availableTeamsForOrgs.length > 0 && (
        <div className="grid gap-2">
          <Label>Specific Teams (Optional)</Label>
          <div className="border rounded-md p-3 space-y-2 max-h-32 overflow-y-auto">
            {availableTeamsForOrgs.map((team) => (
              <div key={team.id} className="flex items-center space-x-2">
                <Checkbox
                  id={`team-${team.id}`}
                  checked={formData.teamIds.includes(team.id)}
                  onCheckedChange={(checked) => {
                    if (checked) {
                      setFormData({
                        ...formData,
                        teamIds: [...formData.teamIds, team.id],
                      });
                    } else {
                      setFormData({
                        ...formData,
                        teamIds: formData.teamIds.filter((id) => id !== team.id),
                      });
                    }
                  }}
                />
                <label htmlFor={`team-${team.id}`} className="text-sm">
                  {team.name}
                  <Badge variant="outline" className="ml-2">{team.ageGroup}</Badge>
                </label>
              </div>
            ))}
          </div>
          <p className="text-sm text-muted-foreground">
            Leave empty to include all teams from selected organizations
          </p>
        </div>
      )}

      <div className="grid gap-2">
        <div className="flex items-center justify-between">
          <Label>Time Slots</Label>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={quickAddTimeSlots}
          >
            <Zap className="h-4 w-4 mr-1" />
            Quick Add (9am-3pm)
          </Button>
        </div>
        <div className="flex gap-2">
          <Input
            type="time"
            value={newTimeSlot.startTime}
            onChange={(e) =>
              setNewTimeSlot({ ...newTimeSlot, startTime: e.target.value })
            }
            placeholder="Start"
          />
          <Input
            type="time"
            value={newTimeSlot.endTime}
            onChange={(e) =>
              setNewTimeSlot({ ...newTimeSlot, endTime: e.target.value })
            }
            placeholder="End"
          />
          <Button type="button" variant="outline" onClick={handleAddTimeSlot}>
            Add
          </Button>
        </div>
        {formData.timeSlots.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-2">
            {formData.timeSlots.map((slot) => (
              <Badge
                key={slot.id}
                variant="secondary"
                className="cursor-pointer"
                onClick={() => handleRemoveTimeSlot(slot.id)}
              >
                {slot.startTime} - {slot.endTime} ×
              </Badge>
            ))}
          </div>
        )}
      </div>

      <div className="grid gap-2">
        <Label htmlFor="notes">Notes</Label>
        <Textarea
          id="notes"
          value={formData.notes}
          onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
          placeholder="Any additional notes..."
        />
      </div>
    </div>
  );

  return (
    <AppLayout title="Field Allocations">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-medium">Field Allocations</h2>
            <p className="text-sm text-muted-foreground">
              Define which fields are available on specific dates for organizations/teams
            </p>
          </div>
          <div className="flex gap-2">
            <Select value={filterSeasonId} onValueChange={setFilterSeasonId}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by season" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Seasons</SelectItem>
                {seasons.map((season) => (
                  <SelectItem key={season.id} value={season.id}>
                    {season.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Dialog open={isAddDialogOpen} onOpenChange={(open) => {
              if (open) resetForm();
              setIsAddDialogOpen(open);
            }}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Allocation
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Create Field Allocation</DialogTitle>
                  <DialogDescription>
                    Define which fields are available on a specific date and who can play.
                  </DialogDescription>
                </DialogHeader>
                <AllocationForm />
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleAddAllocation}>Create Allocation</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {filteredAllocations.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-10">
              <Calendar className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground mb-4">
                No field allocations yet. Create one to define field availability.
              </p>
              <Button onClick={() => {
                resetForm();
                setIsAddDialogOpen(true);
              }}>
                <Plus className="mr-2 h-4 w-4" />
                Create First Allocation
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {groupedAllocations.map(([date, allocations]) => (
              <Card key={date}>
                <CardHeader className="py-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    {format(new Date(date), "EEEE, MMMM d, yyyy")}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {allocations.map((allocation) => (
                    <div
                      key={allocation.id}
                      className="border rounded-lg p-4 space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <MapPin className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium">
                            {getLocationName(allocation.locationId)}
                          </span>
                          <Badge variant="outline">
                            {allocation.fieldIds.length} fields
                          </Badge>
                        </div>
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => openEditDialog(allocation)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setDeleteConfirmId(allocation.id)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                        <div>
                          <span className="text-muted-foreground">Fields: </span>
                          <span>{getFieldNames(allocation.fieldIds)}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Organizations: </span>
                          <span>
                            {allocation.organizationIds.length > 0
                              ? getOrgNames(allocation.organizationIds)
                              : "All"}
                          </span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Season: </span>
                          <span>{getSeasonName(allocation.seasonId)}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        <div className="flex flex-wrap gap-1">
                          {allocation.timeSlots.map((slot) => (
                            <Badge key={slot.id} variant="secondary">
                              {slot.startTime} - {slot.endTime}
                            </Badge>
                          ))}
                        </div>
                      </div>

                      {allocation.notes && (
                        <p className="text-sm text-muted-foreground">
                          Note: {allocation.notes}
                        </p>
                      )}
                    </div>
                  ))}
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Edit Field Allocation</DialogTitle>
              <DialogDescription>
                Update the field allocation details below.
              </DialogDescription>
            </DialogHeader>
            <AllocationForm />
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleEditAllocation}>Save Changes</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <AlertDialog
          open={deleteConfirmId !== null}
          onOpenChange={() => setDeleteConfirmId(null)}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Field Allocation?</AlertDialogTitle>
              <AlertDialogDescription>
                This will remove the field allocation. Games linked to this allocation
                will be unlinked but not deleted.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => deleteConfirmId && handleDeleteAllocation(deleteConfirmId)}
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
