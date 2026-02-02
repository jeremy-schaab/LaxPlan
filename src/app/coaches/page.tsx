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
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
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
import type { Coach } from "@/types";
import { Plus, Pencil, Trash2, Mail, Phone, Users } from "lucide-react";

export default function CoachesPage() {
  const {
    coaches,
    organizations,
    teams,
    addCoach,
    updateCoachById,
    deleteCoach,
    assignCoachToTeam,
    removeCoachFromTeamById,
  } = useAppStore();
  const { toast } = useToast();

  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isAssignDialogOpen, setIsAssignDialogOpen] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [selectedCoach, setSelectedCoach] = useState<Coach | null>(null);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    organizationId: "",
  });

  const resetForm = () => {
    setFormData({
      name: "",
      email: "",
      phone: "",
      organizationId: "",
    });
  };

  const handleAddCoach = () => {
    if (!formData.name.trim() || !formData.email.trim()) {
      toast({
        title: "Error",
        description: "Coach name and email are required",
        variant: "destructive",
      });
      return;
    }

    addCoach({
      name: formData.name,
      email: formData.email,
      phone: formData.phone || undefined,
      organizationId: formData.organizationId || undefined,
    });

    toast({
      title: "Coach Added",
      description: `${formData.name} has been added successfully.`,
    });

    resetForm();
    setIsAddDialogOpen(false);
  };

  const handleEditCoach = () => {
    if (!selectedCoach || !formData.name.trim() || !formData.email.trim()) return;

    updateCoachById(selectedCoach.id, {
      name: formData.name,
      email: formData.email,
      phone: formData.phone || undefined,
      organizationId: formData.organizationId || undefined,
    });

    toast({
      title: "Coach Updated",
      description: `${formData.name} has been updated successfully.`,
    });

    setIsEditDialogOpen(false);
    setSelectedCoach(null);
  };

  const handleDeleteCoach = (id: string) => {
    const coach = coaches.find((c) => c.id === id);
    deleteCoach(id);
    toast({
      title: "Coach Deleted",
      description: `${coach?.name} has been deleted.`,
    });
    setDeleteConfirmId(null);
  };

  const openEditDialog = (coach: Coach) => {
    setSelectedCoach(coach);
    setFormData({
      name: coach.name,
      email: coach.email,
      phone: coach.phone || "",
      organizationId: coach.organizationId || "",
    });
    setIsEditDialogOpen(true);
  };

  const openAssignDialog = (coach: Coach) => {
    setSelectedCoach(coach);
    setIsAssignDialogOpen(true);
  };

  const getOrganizationName = (orgId?: string) => {
    if (!orgId) return null;
    return organizations.find((o) => o.id === orgId)?.name;
  };

  const getCoachTeams = (coachId: string) => {
    return teams.filter((t) => t.coachIds?.includes(coachId));
  };

  const toggleTeamAssignment = (teamId: string, coachId: string, isAssigned: boolean) => {
    if (isAssigned) {
      removeCoachFromTeamById(teamId, coachId);
    } else {
      assignCoachToTeam(teamId, coachId);
    }
  };

  // Get teams that match the coach's organization (if any)
  const getEligibleTeams = (coach: Coach) => {
    if (coach.organizationId) {
      return teams.filter((t) => t.organizationId === coach.organizationId);
    }
    return teams;
  };

  return (
    <AppLayout title="Coaches">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-medium">Manage Coaches</h2>
            <p className="text-sm text-muted-foreground">
              Add coaches and assign them to one or more teams. Coaches can be shared across teams.
            </p>
          </div>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Add Coach
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New Coach</DialogTitle>
                <DialogDescription>
                  Enter the coach&apos;s contact information below.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="name">Name</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    placeholder="e.g., John Smith"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) =>
                      setFormData({ ...formData, email: e.target.value })
                    }
                    placeholder="coach@example.com"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="phone">Phone (Optional)</Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={(e) =>
                      setFormData({ ...formData, phone: e.target.value })
                    }
                    placeholder="(555) 123-4567"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="organization">Organization (Optional)</Label>
                  <Select
                    value={formData.organizationId}
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
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleAddCoach}>Add Coach</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {coaches.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-10">
              <p className="text-muted-foreground mb-4">
                No coaches added yet. Add coaches to assign them to teams.
              </p>
              <Button onClick={() => setIsAddDialogOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Add First Coach
              </Button>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>Coaches ({coaches.length})</CardTitle>
              <CardDescription>
                Click the team icon to assign a coach to multiple teams.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Contact</TableHead>
                    <TableHead>Organization</TableHead>
                    <TableHead>Teams</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {coaches.map((coach) => {
                    const coachTeams = getCoachTeams(coach.id);
                    const orgName = getOrganizationName(coach.organizationId);
                    return (
                      <TableRow key={coach.id}>
                        <TableCell className="font-medium">{coach.name}</TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            <div className="flex items-center gap-1 text-sm">
                              <Mail className="h-3 w-3 text-muted-foreground" />
                              <span>{coach.email}</span>
                            </div>
                            {coach.phone && (
                              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                                <Phone className="h-3 w-3" />
                                <span>{coach.phone}</span>
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          {orgName ? (
                            <Badge variant="secondary">{orgName}</Badge>
                          ) : (
                            <span className="text-muted-foreground text-sm">-</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {coachTeams.length === 0 ? (
                            <span className="text-muted-foreground text-sm">
                              Not assigned
                            </span>
                          ) : (
                            <div className="flex flex-wrap gap-1">
                              {coachTeams.map((team) => (
                                <Badge key={team.id} variant="outline">
                                  {team.name}
                                </Badge>
                              ))}
                            </div>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => openAssignDialog(coach)}
                              title="Assign to Teams"
                            >
                              <Users className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => openEditDialog(coach)}
                              title="Edit Coach"
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => setDeleteConfirmId(coach.id)}
                              title="Delete Coach"
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
              <DialogTitle>Edit Coach</DialogTitle>
              <DialogDescription>
                Update the coach&apos;s information below.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="edit-name">Name</Label>
                <Input
                  id="edit-name"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-email">Email</Label>
                <Input
                  id="edit-email"
                  type="email"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-phone">Phone</Label>
                <Input
                  id="edit-phone"
                  type="tel"
                  value={formData.phone}
                  onChange={(e) =>
                    setFormData({ ...formData, phone: e.target.value })
                  }
                />
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
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleEditCoach}>Save Changes</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={isAssignDialogOpen} onOpenChange={setIsAssignDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Assign {selectedCoach?.name} to Teams</DialogTitle>
              <DialogDescription>
                Select the teams this coach will be assigned to.
              </DialogDescription>
            </DialogHeader>
            <div className="py-4">
              {selectedCoach && (
                <div className="space-y-3">
                  {getEligibleTeams(selectedCoach).length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                      No teams available. Create teams first.
                    </p>
                  ) : (
                    getEligibleTeams(selectedCoach).map((team) => {
                      const isAssigned = team.coachIds?.includes(selectedCoach.id) || false;
                      return (
                        <div
                          key={team.id}
                          className="flex items-center space-x-3 p-2 rounded-md hover:bg-accent"
                        >
                          <Checkbox
                            id={`team-${team.id}`}
                            checked={isAssigned}
                            onCheckedChange={() =>
                              toggleTeamAssignment(team.id, selectedCoach.id, isAssigned)
                            }
                          />
                          <label
                            htmlFor={`team-${team.id}`}
                            className="flex-1 flex items-center gap-2 cursor-pointer"
                          >
                            <div
                              className="w-3 h-3 rounded-full"
                              style={{ backgroundColor: team.color || "#3b82f6" }}
                            />
                            <span>{team.name}</span>
                            <Badge variant="secondary" className="ml-auto">
                              {team.ageGroup}
                            </Badge>
                          </label>
                        </div>
                      );
                    })
                  )}
                </div>
              )}
            </div>
            <DialogFooter>
              <Button onClick={() => setIsAssignDialogOpen(false)}>Done</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <AlertDialog
          open={deleteConfirmId !== null}
          onOpenChange={() => setDeleteConfirmId(null)}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Coach?</AlertDialogTitle>
              <AlertDialogDescription>
                This will permanently delete this coach and remove them from all
                team assignments. This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => deleteConfirmId && handleDeleteCoach(deleteConfirmId)}
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
