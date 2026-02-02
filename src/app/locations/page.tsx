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
import type { Location } from "@/types";
import { Plus, Pencil, Trash2, Landmark, MapPin } from "lucide-react";

export default function LocationsPage() {
  const {
    locations,
    fields,
    fieldAllocations,
    addLocation,
    updateLocation,
    deleteLocation,
    getFieldsByLocation,
  } = useAppStore();
  const { toast } = useToast();

  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(null);

  const [formData, setFormData] = useState({
    name: "",
    address: "",
    city: "",
    state: "",
    zipCode: "",
    notes: "",
  });

  const resetForm = () => {
    setFormData({
      name: "",
      address: "",
      city: "",
      state: "",
      zipCode: "",
      notes: "",
    });
  };

  const handleAddLocation = () => {
    if (!formData.name.trim()) {
      toast({
        title: "Error",
        description: "Location name is required",
        variant: "destructive",
      });
      return;
    }

    addLocation({
      name: formData.name,
      address: formData.address || undefined,
      city: formData.city || undefined,
      state: formData.state || undefined,
      zipCode: formData.zipCode || undefined,
      notes: formData.notes || undefined,
    });

    toast({
      title: "Location Added",
      description: `${formData.name} has been added successfully.`,
    });

    resetForm();
    setIsAddDialogOpen(false);
  };

  const handleEditLocation = () => {
    if (!selectedLocation || !formData.name.trim()) return;

    updateLocation(selectedLocation.id, {
      name: formData.name,
      address: formData.address || undefined,
      city: formData.city || undefined,
      state: formData.state || undefined,
      zipCode: formData.zipCode || undefined,
      notes: formData.notes || undefined,
    });

    toast({
      title: "Location Updated",
      description: `${formData.name} has been updated successfully.`,
    });

    setIsEditDialogOpen(false);
    setSelectedLocation(null);
  };

  const handleDeleteLocation = (id: string) => {
    const location = locations.find((l) => l.id === id);
    const fieldCount = getFieldsByLocation(id).length;

    deleteLocation(id);
    toast({
      title: "Location Deleted",
      description: `${location?.name} has been deleted. ${fieldCount} fields have been unlinked.`,
    });
    setDeleteConfirmId(null);
  };

  const openEditDialog = (location: Location) => {
    setSelectedLocation(location);
    setFormData({
      name: location.name,
      address: location.address || "",
      city: location.city || "",
      state: location.state || "",
      zipCode: location.zipCode || "",
      notes: location.notes || "",
    });
    setIsEditDialogOpen(true);
  };

  const getFieldCount = (locationId: string) =>
    fields.filter((f) => f.locationId === locationId).length;

  const getAllocationCount = (locationId: string) =>
    fieldAllocations.filter((fa) => fa.locationId === locationId).length;

  const formatAddress = (location: Location) => {
    const parts = [
      location.address,
      location.city,
      location.state,
      location.zipCode,
    ].filter(Boolean);
    return parts.length > 0 ? parts.join(", ") : "-";
  };

  return (
    <AppLayout title="Locations">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-medium">Manage Locations</h2>
            <p className="text-sm text-muted-foreground">
              Define venues that contain multiple fields (e.g., North Collier Regional Park)
            </p>
          </div>
          <Dialog open={isAddDialogOpen} onOpenChange={(open) => {
            if (open) resetForm();
            setIsAddDialogOpen(open);
          }}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Add Location
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New Location</DialogTitle>
                <DialogDescription>
                  Enter the location/venue details. You can add fields to this location later.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="name">Location Name</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    placeholder="e.g., North Collier Regional Park"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="address">Street Address</Label>
                  <Input
                    id="address"
                    value={formData.address}
                    onChange={(e) =>
                      setFormData({ ...formData, address: e.target.value })
                    }
                    placeholder="e.g., 15000 Livingston Rd"
                  />
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="city">City</Label>
                    <Input
                      id="city"
                      value={formData.city}
                      onChange={(e) =>
                        setFormData({ ...formData, city: e.target.value })
                      }
                      placeholder="Naples"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="state">State</Label>
                    <Input
                      id="state"
                      value={formData.state}
                      onChange={(e) =>
                        setFormData({ ...formData, state: e.target.value })
                      }
                      placeholder="FL"
                      maxLength={2}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="zipCode">ZIP Code</Label>
                    <Input
                      id="zipCode"
                      value={formData.zipCode}
                      onChange={(e) =>
                        setFormData({ ...formData, zipCode: e.target.value })
                      }
                      placeholder="34109"
                      maxLength={10}
                    />
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
                    placeholder="Parking info, special instructions, etc."
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleAddLocation}>Add Location</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {locations.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-10">
              <Landmark className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground mb-4">
                No locations added yet. Create locations to group your fields.
              </p>
              <Button onClick={() => {
                resetForm();
                setIsAddDialogOpen(true);
              }}>
                <Plus className="mr-2 h-4 w-4" />
                Add First Location
              </Button>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>Locations ({locations.length})</CardTitle>
              <CardDescription>
                Each location can have multiple fields. Fields can be assigned on specific dates.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Location</TableHead>
                    <TableHead>Address</TableHead>
                    <TableHead>Fields</TableHead>
                    <TableHead>Allocations</TableHead>
                    <TableHead>Notes</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {locations.map((location) => (
                    <TableRow key={location.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <MapPin className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium">{location.name}</span>
                        </div>
                      </TableCell>
                      <TableCell className="max-w-[200px] truncate">
                        {formatAddress(location)}
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">
                          {getFieldCount(location.id)} fields
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {getAllocationCount(location.id)} allocations
                        </Badge>
                      </TableCell>
                      <TableCell className="max-w-[150px] truncate">
                        {location.notes || "-"}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => openEditDialog(location)}
                            title="Edit Location"
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setDeleteConfirmId(location.id)}
                            title="Delete Location"
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
              <DialogTitle>Edit Location</DialogTitle>
              <DialogDescription>
                Update the location details below.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="edit-name">Location Name</Label>
                <Input
                  id="edit-name"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-address">Street Address</Label>
                <Input
                  id="edit-address"
                  value={formData.address}
                  onChange={(e) =>
                    setFormData({ ...formData, address: e.target.value })
                  }
                />
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="edit-city">City</Label>
                  <Input
                    id="edit-city"
                    value={formData.city}
                    onChange={(e) =>
                      setFormData({ ...formData, city: e.target.value })
                    }
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="edit-state">State</Label>
                  <Input
                    id="edit-state"
                    value={formData.state}
                    onChange={(e) =>
                      setFormData({ ...formData, state: e.target.value })
                    }
                    maxLength={2}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="edit-zipCode">ZIP Code</Label>
                  <Input
                    id="edit-zipCode"
                    value={formData.zipCode}
                    onChange={(e) =>
                      setFormData({ ...formData, zipCode: e.target.value })
                    }
                    maxLength={10}
                  />
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

              {selectedLocation && (
                <div className="mt-2 p-3 bg-accent rounded-md">
                  <p className="text-sm font-medium">Linked Resources</p>
                  <p className="text-sm text-muted-foreground">
                    {getFieldCount(selectedLocation.id)} fields, {getAllocationCount(selectedLocation.id)} allocations
                  </p>
                </div>
              )}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleEditLocation}>Save Changes</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <AlertDialog
          open={deleteConfirmId !== null}
          onOpenChange={() => setDeleteConfirmId(null)}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Location?</AlertDialogTitle>
              <AlertDialogDescription>
                This will remove the location. Fields at this location will be unlinked
                but not deleted. Field allocations for this location will be removed.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => deleteConfirmId && handleDeleteLocation(deleteConfirmId)}
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
