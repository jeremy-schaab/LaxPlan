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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useAppStore } from "@/store";
import { useToast } from "@/components/ui/use-toast";
import type { Organization } from "@/types";
import { Plus, Pencil, Trash2, Users, UserCog } from "lucide-react";

const orgColors = [
  { name: "Red", value: "#ef4444" },
  { name: "Blue", value: "#3b82f6" },
  { name: "Green", value: "#22c55e" },
  { name: "Yellow", value: "#eab308" },
  { name: "Purple", value: "#a855f7" },
  { name: "Orange", value: "#f97316" },
  { name: "Pink", value: "#ec4899" },
  { name: "Teal", value: "#14b8a6" },
  { name: "Indigo", value: "#6366f1" },
  { name: "Gray", value: "#6b7280" },
];

export default function OrganizationsPage() {
  const {
    organizations,
    teams,
    coaches,
    addOrganization,
    updateOrganization,
    deleteOrganization,
  } = useAppStore();
  const { toast } = useToast();

  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [selectedOrg, setSelectedOrg] = useState<Organization | null>(null);

  const [formData, setFormData] = useState({
    name: "",
    abbreviation: "",
    color: "#3b82f6",
    notes: "",
  });

  const resetForm = () => {
    setFormData({
      name: "",
      abbreviation: "",
      color: "#3b82f6",
      notes: "",
    });
  };

  const handleAddOrganization = () => {
    if (!formData.name.trim()) {
      toast({
        title: "Error",
        description: "Organization name is required",
        variant: "destructive",
      });
      return;
    }

    addOrganization({
      name: formData.name,
      abbreviation: formData.abbreviation || undefined,
      color: formData.color,
      notes: formData.notes || undefined,
    });

    toast({
      title: "Organization Added",
      description: `${formData.name} has been added successfully.`,
    });

    resetForm();
    setIsAddDialogOpen(false);
  };

  const handleEditOrganization = () => {
    if (!selectedOrg || !formData.name.trim()) return;

    updateOrganization(selectedOrg.id, {
      name: formData.name,
      abbreviation: formData.abbreviation || undefined,
      color: formData.color,
      notes: formData.notes || undefined,
    });

    toast({
      title: "Organization Updated",
      description: `${formData.name} has been updated successfully.`,
    });

    setIsEditDialogOpen(false);
    setSelectedOrg(null);
  };

  const handleDeleteOrganization = (id: string) => {
    const org = organizations.find((o) => o.id === id);
    deleteOrganization(id);
    toast({
      title: "Organization Deleted",
      description: `${org?.name} has been deleted. Teams and coaches have been unlinked.`,
    });
    setDeleteConfirmId(null);
  };

  const openEditDialog = (org: Organization) => {
    setSelectedOrg(org);
    setFormData({
      name: org.name,
      abbreviation: org.abbreviation || "",
      color: org.color || "#3b82f6",
      notes: org.notes || "",
    });
    setIsEditDialogOpen(true);
  };

  const getTeamCount = (orgId: string) =>
    teams.filter((t) => t.organizationId === orgId).length;

  const getCoachCount = (orgId: string) =>
    coaches.filter((c) => c.organizationId === orgId).length;

  return (
    <AppLayout title="Organizations">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-medium">Manage Organizations</h2>
            <p className="text-sm text-muted-foreground">
              Create clubs/organizations that can have multiple teams (e.g., U8, U10, Middle School)
            </p>
          </div>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Add Organization
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New Organization</DialogTitle>
                <DialogDescription>
                  Enter the organization/club details below.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="name">Organization Name</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    placeholder="e.g., Northside Lacrosse Club"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="abbreviation">Abbreviation (Optional)</Label>
                  <Input
                    id="abbreviation"
                    value={formData.abbreviation}
                    onChange={(e) =>
                      setFormData({ ...formData, abbreviation: e.target.value })
                    }
                    placeholder="e.g., NLC"
                    maxLength={6}
                  />
                </div>
                <div className="grid gap-2">
                  <Label>Organization Color</Label>
                  <div className="flex gap-2 flex-wrap">
                    {orgColors.map((color) => (
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
                <Button onClick={handleAddOrganization}>Add Organization</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {organizations.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-10">
              <p className="text-muted-foreground mb-4">
                No organizations added yet. Create your first organization to group teams.
              </p>
              <Button onClick={() => setIsAddDialogOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Add First Organization
              </Button>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>Organizations ({organizations.length})</CardTitle>
              <CardDescription>
                Each organization can have multiple teams at different age levels.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Organization</TableHead>
                    <TableHead>Teams</TableHead>
                    <TableHead>Coaches</TableHead>
                    <TableHead>Notes</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {organizations.map((org) => (
                    <TableRow key={org.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div
                            className="w-4 h-4 rounded-full"
                            style={{ backgroundColor: org.color || "#3b82f6" }}
                          />
                          <div>
                            <span className="font-medium">{org.name}</span>
                            {org.abbreviation && (
                              <Badge variant="outline" className="ml-2">
                                {org.abbreviation}
                              </Badge>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Users className="h-4 w-4 text-muted-foreground" />
                          <span>{getTeamCount(org.id)}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <UserCog className="h-4 w-4 text-muted-foreground" />
                          <span>{getCoachCount(org.id)}</span>
                        </div>
                      </TableCell>
                      <TableCell className="max-w-[200px] truncate">
                        {org.notes || "-"}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => openEditDialog(org)}
                            title="Edit Organization"
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setDeleteConfirmId(org.id)}
                            title="Delete Organization"
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
              <DialogTitle>Edit Organization</DialogTitle>
              <DialogDescription>
                Update the organization details below.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="edit-name">Organization Name</Label>
                <Input
                  id="edit-name"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-abbreviation">Abbreviation</Label>
                <Input
                  id="edit-abbreviation"
                  value={formData.abbreviation}
                  onChange={(e) =>
                    setFormData({ ...formData, abbreviation: e.target.value })
                  }
                  maxLength={6}
                />
              </div>
              <div className="grid gap-2">
                <Label>Organization Color</Label>
                <div className="flex gap-2 flex-wrap">
                  {orgColors.map((color) => (
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
                <Label htmlFor="edit-notes">Notes</Label>
                <Textarea
                  id="edit-notes"
                  value={formData.notes}
                  onChange={(e) =>
                    setFormData({ ...formData, notes: e.target.value })
                  }
                />
              </div>

              {selectedOrg && (
                <div className="mt-2 p-3 bg-accent rounded-md">
                  <p className="text-sm font-medium">Linked Resources</p>
                  <p className="text-sm text-muted-foreground">
                    {getTeamCount(selectedOrg.id)} teams, {getCoachCount(selectedOrg.id)} coaches
                  </p>
                </div>
              )}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleEditOrganization}>Save Changes</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <AlertDialog
          open={deleteConfirmId !== null}
          onOpenChange={() => setDeleteConfirmId(null)}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Organization?</AlertDialogTitle>
              <AlertDialogDescription>
                This will remove the organization. Teams and coaches will be unlinked
                but not deleted. You can reassign them later.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => deleteConfirmId && handleDeleteOrganization(deleteConfirmId)}
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
