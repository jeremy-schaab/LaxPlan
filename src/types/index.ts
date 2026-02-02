export type AgeGroup = "U8" | "U10" | "U12" | "U14" | "MS" | "HS" | "Adult";

export type FieldType = "full" | "half" | "third";

export type SeasonStatus = "planning" | "active" | "completed" | "archived";

export type GameStatus = "scheduled" | "completed" | "cancelled" | "postponed";

// ============================================================================
// Season Entity - Manages scheduling periods
// ============================================================================
export interface Season {
  id: string;
  name: string;
  startDate: string; // ISO date string (YYYY-MM-DD)
  endDate: string; // ISO date string (YYYY-MM-DD)
  status: SeasonStatus;
  isDefault: boolean; // Only one season can be default at a time
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

// ============================================================================
// Location Entity - Groups multiple fields at a single venue
// ============================================================================
export interface Location {
  id: string;
  name: string; // e.g., "North Collier Regional Park"
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  notes?: string;
}

// ============================================================================
// Organization Entity - Clubs and teams they manage
// ============================================================================
export interface Organization {
  id: string;
  name: string;
  abbreviation?: string;
  color?: string;
  notes?: string;
}

// ============================================================================
// Coach Entity - Can be assigned to multiple teams
// ============================================================================
export interface Coach {
  id: string;
  name: string;
  email: string;
  phone?: string;
  organizationId?: string;
}

// ============================================================================
// Team Entity - Belongs to organization, has coaches
// ============================================================================
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

// ============================================================================
// Field Entity - Belongs to a Location
// ============================================================================
export interface Field {
  id: string;
  name: string;
  locationId?: string; // Reference to Location entity
  location?: string; // DEPRECATED: Legacy field for backward compatibility
  canSplit: boolean;
  maxSplits: 1 | 2 | 3; // 1=full, 2=half-field, 3=third-field
  notes?: string;
}

// ============================================================================
// Time Slot Entity - Defines a game time window
// ============================================================================
export interface TimeSlot {
  id: string;
  startTime: string; // HH:MM format
  endTime: string; // HH:MM format
  label?: string;
}

// ============================================================================
// Schedule Date Entity - A day that games can be scheduled
// ============================================================================
export interface ScheduleDate {
  id: string;
  seasonId?: string; // Reference to Season entity
  date: string; // ISO date string (YYYY-MM-DD)
  timeSlots: TimeSlot[];
  isActive: boolean;
  notes?: string;
}

// ============================================================================
// Field Allocation Entity - Tracks field availability on specific dates
// ============================================================================
export interface FieldAllocation {
  id: string;
  seasonId: string;
  date: string; // ISO date string (YYYY-MM-DD)
  locationId: string;
  fieldIds: string[]; // Which fields at this location are available
  organizationIds: string[]; // Organizations playing on this date
  teamIds: string[]; // Specific teams assigned (can be derived from organizations)
  timeSlots: TimeSlot[]; // Available time slots for this allocation
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

// ============================================================================
// Game Entity - A scheduled game between two teams
// ============================================================================
export interface Game {
  id: string;
  seasonId?: string; // Reference to Season entity
  homeTeamId: string;
  awayTeamId: string;
  fieldId: string;
  fieldPortion: FieldType;
  fieldSection?: number; // For split fields (1, 2, or 3)
  dateId: string;
  timeSlotId: string;
  fieldAllocationId?: string; // Reference to FieldAllocation
  status: GameStatus;
  homeScore?: number;
  awayScore?: number;
  notes?: string;
}

// ============================================================================
// Weekly Schedule Entity - For publishing schedules
// ============================================================================
export interface WeeklySchedule {
  id: string;
  seasonId?: string; // Reference to Season entity
  weekStartDate: string;
  weekEndDate: string;
  games: Game[];
  isPublished: boolean;
  createdAt: string;
  updatedAt: string;
}

// ============================================================================
// Schedule Settings - Global scheduling preferences
// ============================================================================
export interface ScheduleSettings {
  // Legacy season fields (deprecated - use Season entity instead)
  seasonName: string;
  seasonStartDate: string;
  seasonEndDate: string;
  // Scheduling preferences
  defaultGameDuration: number; // in minutes
  avoidBackToBackGames: boolean;
  balanceHomeAway: boolean;
  minGamesBetweenTeams: number;
  separateSameOrgTeams: boolean;
  // AI Integration
  aiSchedulingEnabled: boolean;
  // Current season reference
  defaultSeasonId?: string;
}

// ============================================================================
// Email Template Entity
// ============================================================================
export interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  body: string;
}

// ============================================================================
// Schedule Conflict Entity - Validation errors
// ============================================================================
export interface ScheduleConflict {
  type: "team_double_booked" | "field_overlap" | "insufficient_rest";
  message: string;
  gameIds: string[];
}

// ============================================================================
// AI Scheduling Types
// ============================================================================
export interface AISchedulingConfig {
  enabled: boolean;
  provider: "azure-openai";
  endpoint?: string;
  model?: string;
}

export interface SchedulingConstraints {
  avoidBackToBack: boolean;
  balanceHomeAway: boolean;
  prioritizeAgeGroups: boolean;
  separateSameOrgTeams: boolean;
  maxGamesPerTeam?: number;
  customConstraints?: string[];
}

export interface AISchedulingRequest {
  seasonId: string;
  date: string;
  fieldAllocationId: string;
  teams: Team[];
  fields: Field[];
  timeSlots: TimeSlot[];
  constraints: SchedulingConstraints;
  existingGames?: Game[];
}

export interface AISchedulingResponse {
  success: boolean;
  games: Omit<Game, "id">[];
  reasoning?: string;
  warnings?: string[];
  error?: string;
}

// ============================================================================
// Day Schedule Options - For generating schedules for a specific day
// ============================================================================
export interface DayScheduleOptions {
  seasonId: string;
  date: string;
  fieldAllocationId?: string;
  teams: Team[];
  fields: Field[];
  timeSlots: TimeSlot[];
  existingGames: Game[];
  constraints: SchedulingConstraints;
}

// ============================================================================
// Validation Types
// ============================================================================
export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

export interface FieldAllocationValidation extends ValidationResult {
  teamsCount: number;
  fieldsCount: number;
  slotsCount: number;
  estimatedGamesCapacity: number;
}
