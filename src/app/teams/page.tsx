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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
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
import type { Team, AgeGroup, Coach } from "@/types";
import { Plus, Pencil, Trash2, UserPlus, Mail, Phone, Building2 } from "lucide-react";

const ageGroups: AgeGroup[] = ["U8", "U10", "U12", "U14", "HS", "Adult"];

const teamColors = [
  { name: "Red", value: "#ef4444" },
  { name: "Blue", value: "#3b82f6" },
  { name: "Green", value: "#22c55e" },
  { name: "Yellow", value: "#eab308" },
  { name: "Purple", value: "#a855f7" },
  { name: "Orange", value: "#f97316" },
  { name: "Pink", value: "#ec4899" },
  { name: "Teal", value: "#14b8a6" },
];

export default function TeamsPage() {
  const {
    teams,
    organizations,
    coaches: globalCoaches,
    addTeam,
    updateTeam,
    deleteTeam,
    addCoachToTeam,
    removeCoachFromTeam,
    updateCoach,
  } = useAppStore();
  const { toast } = useToast();

  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isCoachDialogOpen, setIsCoachDialogOpen] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);

  const [formData, setFormData] = useState({
    name: "",
    ageGroup: "U10" as AgeGroup,
    color: "#3b82f6",
    notes: "",
    organizationId: "",
  });

  const [coachFormData, setCoachFormData] = useState({
    name: "",
    email: "",
    phone: "",
  });

  const resetForm = () => {
    setFormData({
      name: "",
      ageGroup: "U10",
      color: "#3b82f6",
      notes: "",
      organizationId: "",
    });
  };

  const getOrganizationName = (orgId?: string) => {
    if (!orgId) return null;
    return organizations.find((o) => o.id === orgId)?.name;
  };

  const getTeamCoaches = (team: Team) => {
    // Get coaches from coachIds (global coach references)
    const linkedCoaches = (team.coachIds || [])
      .map((id) => globalCoaches.find((c) => c.id === id))
      .filter(Boolean) as Coach[];
    // Also include legacy embedded coaches
    return [...team.coaches, ...linkedCoaches];
  };

  const resetCoachForm = () => {
    setCoachFormData({
      name: "",
      email: "",
      phone: "",
    });
  };

  const handleAddTeam = () => {
    if (!formData.name.trim()) {
      toast({
        title: "Error",
        description: "Team name is required",
        variant: "destructive",
      });
      return;
    }

    addTeam({
      name: formData.name,
      ageGroup: formData.ageGroup,
      color: formData.color,
      notes: formData.notes,
      organizationId: formData.organizationId || undefined,
      coaches: [],
      coachIds: [],
    });

    toast({
      title: "Team Added",
      description: `${formData.name} has been added successfully.`,
    });

    resetForm();
    setIsAddDialogOpen(false);
  };

  const handleEditTeam = () => {
    if (!selectedTeam || !formData.name.trim()) return;

    updateTeam(selectedTeam.id, {
      name: formData.name,
      ageGroup: formData.ageGroup,
      color: formData.color,
      notes: formData.notes,
      organizationId: formData.organizationId || undefined,
    });

    toast({
      title: "Team Updated",
      description: `${formData.name} has been updated successfully.`,
    });

    setIsEditDialogOpen(false);
    setSelectedTeam(null);
  };

  const handleDeleteTeam = (id: string) => {
    const team = teams.find((t) => t.id === id);
    deleteTeam(id);
    toast({
      title: "Team Deleted",
      description: `${team?.name} has been deleted.`,
    });
    setDeleteConfirmId(null);
  };

  const openEditDialog = (team: Team) => {
    setSelectedTeam(team);
    setFormData({
      name: team.name,
      ageGroup: team.ageGroup,
      color: team.color || "#3b82f6",
      notes: team.notes || "",
      organizationId: team.organizationId || "",
    });
    setIsEditDialogOpen(true);
  };

  const handleAddCoach = () => {
    if (!selectedTeam || !coachFormData.name.trim() || !coachFormData.email.trim()) {
      toast({
        title: "Error",
        description: "Coach name and email are required",
        variant: "destructive",
      });
      return;
    }

    addCoachToTeam(selectedTeam.id, {
      name: coachFormData.name,
      email: coachFormData.email,
      phone: coachFormData.phone,
    });

    toast({
      title: "Coach Added",
      description: `${coachFormData.name} has been added to ${selectedTeam.name}.`,
    });

    resetCoachForm();
    setIsCoachDialogOpen(false);
  };

  const openCoachDialog = (team: Team) => {
    setSelectedTeam(team);
    resetCoachForm();
    setIsCoachDialogOpen(true);
  };

  return (
    <AppLayout title="Teams">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-medium">Manage Teams</h2>
            <p className="text-sm text-muted-foreground">
              Add and manage teams for your lacrosse league (6-12 teams recommended)
            </p>
          </div>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Add Team
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New Team</DialogTitle>
                <DialogDescription>
                  Enter the team details below.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="name">Team Name</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    placeholder="e.g., Thunder"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="ageGroup">Age Group</Label>
                  <Select
                    value={formData.ageGroup}
                    onValueChange={(value: AgeGroup) =>
                      setFormData({ ...formData, ageGroup: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select age group" />
                    </SelectTrigger>
                    <SelectContent>
                      {ageGroups.map((ag) => (
                        <SelectItem key={ag} value={ag}>
                          {ag}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label>Team Color</Label>
                  <div className="flex gap-2 flex-wrap">
                    {teamColors.map((color) => (
                      <button
                        key={color.value}
                        type="button"
                        className={`w-8 h-8 rounded-full border-2 ${
                          formData.color === color.value
                            ? "border-foreground"
                            : "border-transparent"
                        }`}
                        style={{ backgroundColor: color.value }}
                        onClick={() =>
                          setFormData({ ...formData, color: color.value })
                        }
                        title={color.name}
                      />
                    ))}
                  </div>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="organization">Organization (Optional)</Label>
                  <Select
                    value={formData.organizationId || "none"}
                    onValueChange={(value) =>
                      setFormData({ ...formData, organizationId: value === "none" ? "" : value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select organization" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">No Organization</SelectItem>
                      {organizations.map((org) => (
                        <SelectItem key={org.id} value={org.id}>
                          {org.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
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
                <Button onClick={handleAddTeam}>Add Team</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {teams.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-10">
              <p className="text-muted-foreground mb-4">
                No teams added yet. Add your first team to get started.
              </p>
              <Button onClick={() => setIsAddDialogOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Add First Team
              </Button>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>Teams ({teams.length})</CardTitle>
              <CardDescription>
                Click on a team to manage coaches and details.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Team</TableHead>
                    <TableHead>Organization</TableHead>
                    <TableHead>Age Group</TableHead>
                    <TableHead>Coaches</TableHead>
                    <TableHead>Notes</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {teams.map((team) => {
                    const teamCoaches = getTeamCoaches(team);
                    const orgName = getOrganizationName(team.organizationId);
                    return (
                    <TableRow key={team.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div
                            className="w-4 h-4 rounded-full"
                            style={{ backgroundColor: team.color || "#3b82f6" }}
                          />
                          <span className="font-medium">{team.name}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {orgName ? (
                          <div className="flex items-center gap-1">
                            <Building2 className="h-3 w-3 text-muted-foreground" />
                            <span className="text-sm">{orgName}</span>
                          </div>
                        ) : (
                          <span className="text-muted-foreground text-sm">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">{team.ageGroup}</Badge>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          {teamCoaches.length === 0 ? (
                            <span className="text-muted-foreground text-sm">
                              No coaches
                            </span>
                          ) : (
                            teamCoaches.map((coach) => (
                              <div key={coach.id} className="flex items-center gap-2 text-sm">
                                <span>{coach.name}</span>
                                {coach.email && (
                                  <Mail className="h-3 w-3 text-muted-foreground" />
                                )}
                              </div>
                            ))
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="max-w-[200px] truncate">
                        {team.notes || "-"}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => openCoachDialog(team)}
                            title="Add Coach"
                          >
                            <UserPlus className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => openEditDialog(team)}
                            title="Edit Team"
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setDeleteConfirmId(team.id)}
                            title="Delete Team"
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}

        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Team</DialogTitle>
              <DialogDescription>
                Update the team details below.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="edit-name">Team Name</Label>
                <Input
                  id="edit-name"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-ageGroup">Age Group</Label>
                <Select
                  value={formData.ageGroup}
                  onValueChange={(value: AgeGroup) =>
                    setFormData({ ...formData, ageGroup: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ageGroups.map((ag) => (
                      <SelectItem key={ag} value={ag}>
                        {ag}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label>Team Color</Label>
                <div className="flex gap-2 flex-wrap">
                  {teamColors.map((color) => (
                    <button
                      key={color.value}
                      type="button"
                      className={`w-8 h-8 rounded-full border-2 ${
                        formData.color === color.value
                          ? "border-foreground"
                          : "border-transparent"
                      }`}
                      style={{ backgroundColor: color.value }}
                      onClick={() =>
                        setFormData({ ...formData, color: color.value })
                      }
                      title={color.name}
                    />
                  ))}
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-organization">Organization</Label>
                <Select
                  value={formData.organizationId || "none"}
                  onValueChange={(value) =>
                    setFormData({ ...formData, organizationId: value === "none" ? "" : value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No Organization</SelectItem>
                    {organizations.map((org) => (
                      <SelectItem key={org.id} value={org.id}>
                        {org.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
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

              {selectedTeam && selectedTeam.coaches.length > 0 && (
                <div className="grid gap-2">
                  <Label>Current Coaches</Label>
                  <div className="space-y-2">
                    {selectedTeam.coaches.map((coach) => (
                      <div
                        key={coach.id}
                        className="flex items-center justify-between p-2 bg-accent rounded-md"
                      >
                        <div>
                          <p className="font-medium">{coach.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {coach.email}
                          </p>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            removeCoachFromTeam(selectedTeam.id, coach.id);
                            setSelectedTeam({
                              ...selectedTeam,
                              coaches: selectedTeam.coaches.filter(
                                (c) => c.id !== coach.id
                              ),
                            });
                          }}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleEditTeam}>Save Changes</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={isCoachDialogOpen} onOpenChange={setIsCoachDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Coach to {selectedTeam?.name}</DialogTitle>
              <DialogDescription>
                Enter the coach&apos;s contact information.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="coach-name">Coach Name</Label>
                <Input
                  id="coach-name"
                  value={coachFormData.name}
                  onChange={(e) =>
                    setCoachFormData({ ...coachFormData, name: e.target.value })
                  }
                  placeholder="e.g., John Smith"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="coach-email">Email</Label>
                <Input
                  id="coach-email"
                  type="email"
                  value={coachFormData.email}
                  onChange={(e) =>
                    setCoachFormData({ ...coachFormData, email: e.target.value })
                  }
                  placeholder="coach@example.com"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="coach-phone">Phone (Optional)</Label>
                <Input
                  id="coach-phone"
                  type="tel"
                  value={coachFormData.phone}
                  onChange={(e) =>
                    setCoachFormData({ ...coachFormData, phone: e.target.value })
                  }
                  placeholder="(555) 123-4567"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCoachDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleAddCoach}>Add Coach</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <AlertDialog
          open={deleteConfirmId !== null}
          onOpenChange={() => setDeleteConfirmId(null)}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Team?</AlertDialogTitle>
              <AlertDialogDescription>
                This will permanently delete this team and remove them from any
                scheduled games. This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => deleteConfirmId && handleDeleteTeam(deleteConfirmId)}
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
