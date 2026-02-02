export type AgeGroup = "U8" | "U10" | "U12" | "U14" | "HS" | "Adult";

export type FieldType = "full" | "half" | "third";

export interface Organization {
  id: string;
  name: string;
  abbreviation?: string;
  color?: string;
  notes?: string;
}

export interface Coach {
  id: string;
  name: string;
  email: string;
  phone?: string;
  organizationId?: string;
}

export interface Team {
  id: string;
  name: string;
  ageGroup: AgeGroup;
  organizationId?: string;
  coaches: Coach[];
  coachIds?: string[];
  color?: string;
  notes?: string;
}

export interface Field {
  id: string;
  name: string;
  location?: string;
  canSplit: boolean;
  maxSplits: 1 | 2 | 3;
  notes?: string;
}

export interface TimeSlot {
  id: string;
  startTime: string;
  endTime: string;
  label?: string;
}

export interface ScheduleDate {
  id: string;
  date: string;
  timeSlots: TimeSlot[];
  isActive: boolean;
  notes?: string;
}

export interface Game {
  id: string;
  homeTeamId: string;
  awayTeamId: string;
  fieldId: string;
  fieldPortion: FieldType;
  fieldSection?: number;
  dateId: string;
  timeSlotId: string;
  status: "scheduled" | "completed" | "cancelled" | "postponed";
  homeScore?: number;
  awayScore?: number;
  notes?: string;
}

export interface WeeklySchedule {
  id: string;
  weekStartDate: string;
  weekEndDate: string;
  games: Game[];
  isPublished: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ScheduleSettings {
  seasonName: string;
  seasonStartDate: string;
  seasonEndDate: string;
  defaultGameDuration: number;
  avoidBackToBackGames: boolean;
  balanceHomeAway: boolean;
  minGamesBetweenTeams: number;
}

export interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  body: string;
}

export interface ScheduleConflict {
  type: "team_double_booked" | "field_overlap" | "insufficient_rest";
  message: string;
  gameIds: string[];
}
