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
import type { Field } from "@/types";
import { Plus, Pencil, Trash2, MapPin, Layers } from "lucide-react";

export default function FieldsPage() {
  const { fields, addField, updateField, deleteField } = useAppStore();
  const { toast } = useToast();

  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [selectedField, setSelectedField] = useState<Field | null>(null);

  const [formData, setFormData] = useState({
    name: "",
    location: "",
    canSplit: false,
    maxSplits: 2 as 1 | 2 | 3,
    notes: "",
  });

  const resetForm = () => {
    setFormData({
      name: "",
      location: "",
      canSplit: false,
      maxSplits: 2,
      notes: "",
    });
  };

  const handleAddField = () => {
    if (!formData.name.trim()) {
      toast({
        title: "Error",
        description: "Field name is required",
        variant: "destructive",
      });
      return;
    }

    addField({
      name: formData.name,
      location: formData.location,
      canSplit: formData.canSplit,
      maxSplits: formData.canSplit ? formData.maxSplits : 1,
      notes: formData.notes,
    });

    toast({
      title: "Field Added",
      description: `${formData.name} has been added successfully.`,
    });

    resetForm();
    setIsAddDialogOpen(false);
  };

  const handleEditField = () => {
    if (!selectedField || !formData.name.trim()) return;

    updateField(selectedField.id, {
      name: formData.name,
      location: formData.location,
      canSplit: formData.canSplit,
      maxSplits: formData.canSplit ? formData.maxSplits : 1,
      notes: formData.notes,
    });

    toast({
      title: "Field Updated",
      description: `${formData.name} has been updated successfully.`,
    });

    setIsEditDialogOpen(false);
    setSelectedField(null);
  };

  const handleDeleteField = (id: string) => {
    const field = fields.find((f) => f.id === id);
    deleteField(id);
    toast({
      title: "Field Deleted",
      description: `${field?.name} has been deleted.`,
    });
    setDeleteConfirmId(null);
  };

  const openEditDialog = (field: Field) => {
    setSelectedField(field);
    setFormData({
      name: field.name,
      location: field.location || "",
      canSplit: field.canSplit,
      maxSplits: field.maxSplits,
      notes: field.notes || "",
    });
    setIsEditDialogOpen(true);
  };

  const getFieldCapacity = (field: Field) => {
    if (!field.canSplit) return "1 game";
    return `${field.maxSplits} games (split)`;
  };

  return (
    <AppLayout title="Fields">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-medium">Manage Fields</h2>
            <p className="text-sm text-muted-foreground">
              Configure your playing fields. Fields can be split for younger age groups.
            </p>
          </div>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Add Field
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New Field</DialogTitle>
                <DialogDescription>
                  Enter the field details. Enable splitting for younger age groups.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="name">Field Name</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    placeholder="e.g., Field A"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="location">Location (Optional)</Label>
                  <Input
                    id="location"
                    value={formData.location}
                    onChange={(e) =>
                      setFormData({ ...formData, location: e.target.value })
                    }
                    placeholder="e.g., Main Complex - North Side"
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="canSplit">Allow Field Splitting</Label>
                    <p className="text-sm text-muted-foreground">
                      Enable for younger age groups to play 2-3 games on one field
                    </p>
                  </div>
                  <Switch
                    id="canSplit"
                    checked={formData.canSplit}
                    onCheckedChange={(checked) =>
                      setFormData({ ...formData, canSplit: checked })
                    }
                  />
                </div>
                {formData.canSplit && (
                  <div className="grid gap-2">
                    <Label htmlFor="maxSplits">Maximum Splits</Label>
                    <Select
                      value={formData.maxSplits.toString()}
                      onValueChange={(value) =>
                        setFormData({
                          ...formData,
                          maxSplits: parseInt(value) as 1 | 2 | 3,
                        })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="2">
                          2 games (half field each)
                        </SelectItem>
                        <SelectItem value="3">
                          3 games (third field each)
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground">
                      U8 and U10 typically use half or third fields
                    </p>
                  </div>
                )}
                <div className="grid gap-2">
                  <Label htmlFor="notes">Notes</Label>
                  <Textarea
                    id="notes"
                    value={formData.notes}
                    onChange={(e) =>
                      setFormData({ ...formData, notes: e.target.value })
                    }
                    placeholder="Any additional notes about this field..."
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleAddField}>Add Field</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {fields.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-10">
              <MapPin className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground mb-4">
                No fields added yet. Add your first field to get started.
              </p>
              <Button onClick={() => setIsAddDialogOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Add First Field
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {fields.map((field) => (
              <Card key={field.id}>
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <MapPin className="h-5 w-5 text-primary" />
                        {field.name}
                      </CardTitle>
                      {field.location && (
                        <CardDescription>{field.location}</CardDescription>
                      )}
                    </div>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => openEditDialog(field)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setDeleteConfirmId(field.id)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Layers className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">
                        Capacity: {getFieldCapacity(field)}
                      </span>
                    </div>
                    {field.canSplit && (
                      <Badge variant="secondary">
                        Splittable ({field.maxSplits}x)
                      </Badge>
                    )}
                    {field.notes && (
                      <p className="text-sm text-muted-foreground">
                        {field.notes}
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Field Configuration Tips</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="list-disc list-inside space-y-2 text-sm text-muted-foreground">
              <li>
                <strong>Full field games:</strong> Used for U12 and older age groups
              </li>
              <li>
                <strong>Half field (2 games):</strong> Common for U10 age groups
              </li>
              <li>
                <strong>Third field (3 games):</strong> Ideal for U8 age groups
              </li>
              <li>
                Splitting a field allows multiple games to run simultaneously
              </li>
              <li>
                Consider game duration when scheduling split field games
              </li>
            </ul>
          </CardContent>
        </Card>

        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Field</DialogTitle>
              <DialogDescription>
                Update the field details below.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="edit-name">Field Name</Label>
                <Input
                  id="edit-name"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-location">Location</Label>
                <Input
                  id="edit-location"
                  value={formData.location}
                  onChange={(e) =>
                    setFormData({ ...formData, location: e.target.value })
                  }
                />
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="edit-canSplit">Allow Field Splitting</Label>
                  <p className="text-sm text-muted-foreground">
                    Enable for younger age groups
                  </p>
                </div>
                <Switch
                  id="edit-canSplit"
                  checked={formData.canSplit}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, canSplit: checked })
                  }
                />
              </div>
              {formData.canSplit && (
                <div className="grid gap-2">
                  <Label htmlFor="edit-maxSplits">Maximum Splits</Label>
                  <Select
                    value={formData.maxSplits.toString()}
                    onValueChange={(value) =>
                      setFormData({
                        ...formData,
                        maxSplits: parseInt(value) as 1 | 2 | 3,
                      })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="2">2 games (half field)</SelectItem>
                      <SelectItem value="3">3 games (third field)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
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
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleEditField}>Save Changes</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <AlertDialog
          open={deleteConfirmId !== null}
          onOpenChange={() => setDeleteConfirmId(null)}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Field?</AlertDialogTitle>
              <AlertDialogDescription>
                This will permanently delete this field and remove it from any
                scheduled games. This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => deleteConfirmId && handleDeleteField(deleteConfirmId)}
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
