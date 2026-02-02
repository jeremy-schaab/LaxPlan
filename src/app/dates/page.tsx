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
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useAppStore } from "@/store";
import { useToast } from "@/components/ui/use-toast";
import type { ScheduleDate, TimeSlot } from "@/types";
import {
  Plus,
  Pencil,
  Trash2,
  Calendar as CalendarIcon,
  Clock,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

export default function DatesPage() {
  const {
    scheduleDates,
    addScheduleDate,
    updateScheduleDate,
    deleteScheduleDate,
    addTimeSlotToDate,
    removeTimeSlotFromDate,
  } = useAppStore();
  const { toast } = useToast();

  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isTimeSlotDialogOpen, setIsTimeSlotDialogOpen] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<ScheduleDate | null>(null);
  const [expandedDates, setExpandedDates] = useState<Set<string>>(new Set());

  const [formData, setFormData] = useState({
    date: new Date(),
    isActive: true,
    notes: "",
  });

  const [timeSlotFormData, setTimeSlotFormData] = useState({
    startTime: "09:00",
    endTime: "10:00",
    label: "",
  });

  const resetForm = () => {
    setFormData({
      date: new Date(),
      isActive: true,
      notes: "",
    });
  };

  const resetTimeSlotForm = () => {
    setTimeSlotFormData({
      startTime: "09:00",
      endTime: "10:00",
      label: "",
    });
  };

  const handleAddDate = () => {
    const dateStr = format(formData.date, "yyyy-MM-dd");

    const exists = scheduleDates.some((d) => d.date === dateStr);
    if (exists) {
      toast({
        title: "Error",
        description: "This date already exists",
        variant: "destructive",
      });
      return;
    }

    addScheduleDate({
      date: dateStr,
      timeSlots: [],
      isActive: formData.isActive,
      notes: formData.notes,
    });

    toast({
      title: "Date Added",
      description: `${format(formData.date, "MMMM d, yyyy")} has been added.`,
    });

    resetForm();
    setIsAddDialogOpen(false);
  };

  const handleAddTimeSlot = () => {
    if (!selectedDate) return;

    if (timeSlotFormData.startTime >= timeSlotFormData.endTime) {
      toast({
        title: "Error",
        description: "End time must be after start time",
        variant: "destructive",
      });
      return;
    }

    addTimeSlotToDate(selectedDate.id, {
      startTime: timeSlotFormData.startTime,
      endTime: timeSlotFormData.endTime,
      label: timeSlotFormData.label || undefined,
    });

    toast({
      title: "Time Slot Added",
      description: `${timeSlotFormData.startTime} - ${timeSlotFormData.endTime} added.`,
    });

    resetTimeSlotForm();
    setIsTimeSlotDialogOpen(false);
  };

  const handleDeleteDate = (id: string) => {
    const date = scheduleDates.find((d) => d.id === id);
    deleteScheduleDate(id);
    toast({
      title: "Date Deleted",
      description: date ? `${format(new Date(date.date), "MMMM d, yyyy")} has been deleted.` : "Date deleted.",
    });
    setDeleteConfirmId(null);
  };

  const toggleExpanded = (id: string) => {
    const newExpanded = new Set(expandedDates);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedDates(newExpanded);
  };

  const openTimeSlotDialog = (date: ScheduleDate) => {
    setSelectedDate(date);
    resetTimeSlotForm();
    setIsTimeSlotDialogOpen(true);
  };

  const sortedDates = [...scheduleDates].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  const addQuickTimeSlots = (dateId: string) => {
    const slots = [
      { startTime: "09:00", endTime: "10:00" },
      { startTime: "10:15", endTime: "11:15" },
      { startTime: "11:30", endTime: "12:30" },
      { startTime: "13:00", endTime: "14:00" },
      { startTime: "14:15", endTime: "15:15" },
    ];

    slots.forEach((slot) => {
      addTimeSlotToDate(dateId, slot);
    });

    toast({
      title: "Time Slots Added",
      description: "5 standard time slots have been added.",
    });
  };

  return (
    <AppLayout title="Dates & Time Slots">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-medium">Manage Game Dates</h2>
            <p className="text-sm text-muted-foreground">
              Add dates and configure time slots for games
            </p>
          </div>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Add Date
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add Game Date</DialogTitle>
                <DialogDescription>
                  Select a date for games and add time slots.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label>Date</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "justify-start text-left font-normal",
                          !formData.date && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {formData.date
                          ? format(formData.date, "PPP")
                          : "Pick a date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={formData.date}
                        onSelect={(date) =>
                          date && setFormData({ ...formData, date })
                        }
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="isActive">Active</Label>
                    <p className="text-sm text-muted-foreground">
                      Inactive dates won&apos;t appear in scheduling
                    </p>
                  </div>
                  <Switch
                    id="isActive"
                    checked={formData.isActive}
                    onCheckedChange={(checked) =>
                      setFormData({ ...formData, isActive: checked })
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
                    placeholder="e.g., Tournament day, Special event..."
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleAddDate}>Add Date</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {sortedDates.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-10">
              <CalendarIcon className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground mb-4">
                No game dates added yet. Add your first date to get started.
              </p>
              <Button onClick={() => setIsAddDialogOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Add First Date
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {sortedDates.map((scheduleDate) => {
              const isExpanded = expandedDates.has(scheduleDate.id);
              const dateObj = new Date(scheduleDate.date + "T12:00:00");

              return (
                <Card key={scheduleDate.id}>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => toggleExpanded(scheduleDate.id)}
                        >
                          {isExpanded ? (
                            <ChevronUp className="h-4 w-4" />
                          ) : (
                            <ChevronDown className="h-4 w-4" />
                          )}
                        </Button>
                        <div>
                          <CardTitle className="flex items-center gap-2">
                            {format(dateObj, "EEEE, MMMM d, yyyy")}
                            {!scheduleDate.isActive && (
                              <Badge variant="secondary">Inactive</Badge>
                            )}
                          </CardTitle>
                          <CardDescription>
                            {scheduleDate.timeSlots.length} time slot
                            {scheduleDate.timeSlots.length !== 1 ? "s" : ""}
                            {scheduleDate.notes && ` - ${scheduleDate.notes}`}
                          </CardDescription>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openTimeSlotDialog(scheduleDate)}
                        >
                          <Clock className="mr-2 h-4 w-4" />
                          Add Time Slot
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() =>
                            updateScheduleDate(scheduleDate.id, {
                              isActive: !scheduleDate.isActive,
                            })
                          }
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setDeleteConfirmId(scheduleDate.id)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  {isExpanded && (
                    <CardContent>
                      {scheduleDate.timeSlots.length === 0 ? (
                        <div className="text-center py-4">
                          <p className="text-muted-foreground mb-3">
                            No time slots yet.
                          </p>
                          <div className="flex gap-2 justify-center">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => openTimeSlotDialog(scheduleDate)}
                            >
                              Add Custom Slot
                            </Button>
                            <Button
                              variant="secondary"
                              size="sm"
                              onClick={() => addQuickTimeSlots(scheduleDate.id)}
                            >
                              Add Standard Slots (9am-3pm)
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          {scheduleDate.timeSlots
                            .sort((a, b) => a.startTime.localeCompare(b.startTime))
                            .map((slot) => (
                              <div
                                key={slot.id}
                                className="flex items-center justify-between p-3 bg-accent/50 rounded-lg"
                              >
                                <div className="flex items-center gap-3">
                                  <Clock className="h-4 w-4 text-muted-foreground" />
                                  <span className="font-medium">
                                    {slot.startTime} - {slot.endTime}
                                  </span>
                                  {slot.label && (
                                    <Badge variant="outline">{slot.label}</Badge>
                                  )}
                                </div>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() =>
                                    removeTimeSlotFromDate(scheduleDate.id, slot.id)
                                  }
                                >
                                  <Trash2 className="h-4 w-4 text-destructive" />
                                </Button>
                              </div>
                            ))}
                        </div>
                      )}
                    </CardContent>
                  )}
                </Card>
              );
            })}
          </div>
        )}

        <Dialog open={isTimeSlotDialogOpen} onOpenChange={setIsTimeSlotDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Time Slot</DialogTitle>
              <DialogDescription>
                {selectedDate &&
                  `Add a time slot for ${format(
                    new Date(selectedDate.date + "T12:00:00"),
                    "MMMM d, yyyy"
                  )}`}
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="startTime">Start Time</Label>
                  <Input
                    id="startTime"
                    type="time"
                    value={timeSlotFormData.startTime}
                    onChange={(e) =>
                      setTimeSlotFormData({
                        ...timeSlotFormData,
                        startTime: e.target.value,
                      })
                    }
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="endTime">End Time</Label>
                  <Input
                    id="endTime"
                    type="time"
                    value={timeSlotFormData.endTime}
                    onChange={(e) =>
                      setTimeSlotFormData({
                        ...timeSlotFormData,
                        endTime: e.target.value,
                      })
                    }
                  />
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="label">Label (Optional)</Label>
                <Input
                  id="label"
                  value={timeSlotFormData.label}
                  onChange={(e) =>
                    setTimeSlotFormData({
                      ...timeSlotFormData,
                      label: e.target.value,
                    })
                  }
                  placeholder="e.g., Morning Session, Playoffs..."
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setIsTimeSlotDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button onClick={handleAddTimeSlot}>Add Time Slot</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <AlertDialog
          open={deleteConfirmId !== null}
          onOpenChange={() => setDeleteConfirmId(null)}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Date?</AlertDialogTitle>
              <AlertDialogDescription>
                This will permanently delete this date and all its time slots.
                Any games scheduled for this date will also be removed.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => deleteConfirmId && handleDeleteDate(deleteConfirmId)}
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
