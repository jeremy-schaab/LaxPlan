import { create } from "zustand";
import { subscribeWithSelector } from "zustand/middleware";
import { v4 as uuidv4 } from "uuid";
import type {
  Team,
  Field,
  ScheduleDate,
  TimeSlot,
  Game,
  WeeklySchedule,
  ScheduleSettings,
  Coach,
  Organization,
  Season,
  Location,
  FieldAllocation,
  SeasonStatus,
} from "@/types";

interface AppState {
  // Existing entities
  organizations: Organization[];
  coaches: Coach[];
  teams: Team[];
  fields: Field[];
  scheduleDates: ScheduleDate[];
  games: Game[];
  weeklySchedules: WeeklySchedule[];
  settings: ScheduleSettings;
  isLoaded: boolean;

  // New entities for multi-field location management
  seasons: Season[];
  locations: Location[];
  fieldAllocations: FieldAllocation[];
  currentSeasonId: string | null;

  loadData: () => Promise<void>;
  saveData: () => Promise<void>;

  // Organization management
  addOrganization: (org: Omit<Organization, "id">) => void;
  updateOrganization: (id: string, org: Partial<Organization>) => void;
  deleteOrganization: (id: string) => void;
  getTeamsByOrganization: (orgId: string) => Team[];
  getCoachesByOrganization: (orgId: string) => Coach[];

  // Global coach management (coaches can belong to orgs and be assigned to multiple teams)
  addCoach: (coach: Omit<Coach, "id">) => void;
  updateCoachById: (coachId: string, coach: Partial<Coach>) => void;
  deleteCoach: (coachId: string) => void;
  assignCoachToTeam: (teamId: string, coachId: string) => void;
  removeCoachFromTeamById: (teamId: string, coachId: string) => void;

  addTeam: (team: Omit<Team, "id">) => void;
  updateTeam: (id: string, team: Partial<Team>) => void;
  deleteTeam: (id: string) => void;
  addCoachToTeam: (teamId: string, coach: Omit<Coach, "id">) => void;
  removeCoachFromTeam: (teamId: string, coachId: string) => void;
  updateCoach: (teamId: string, coachId: string, coach: Partial<Coach>) => void;

  addField: (field: Omit<Field, "id">) => void;
  updateField: (id: string, field: Partial<Field>) => void;
  deleteField: (id: string) => void;

  addScheduleDate: (date: Omit<ScheduleDate, "id">) => void;
  updateScheduleDate: (id: string, date: Partial<ScheduleDate>) => void;
  deleteScheduleDate: (id: string) => void;
  addTimeSlotToDate: (dateId: string, timeSlot: Omit<TimeSlot, "id">) => void;
  removeTimeSlotFromDate: (dateId: string, timeSlotId: string) => void;

  addGame: (game: Omit<Game, "id">) => void;
  updateGame: (id: string, game: Partial<Game>) => void;
  deleteGame: (id: string) => void;

  generateWeeklySchedule: (weekStartDate: string) => WeeklySchedule | null;
  publishSchedule: (scheduleId: string) => void;

  updateSettings: (settings: Partial<ScheduleSettings>) => void;

  clearAllData: () => void;

  // Season management
  addSeason: (season: Omit<Season, "id" | "createdAt" | "updatedAt">) => string;
  updateSeason: (id: string, season: Partial<Season>) => void;
  deleteSeason: (id: string) => void;
  setCurrentSeason: (seasonId: string | null) => void;
  getSeasonById: (id: string) => Season | undefined;
  getDefaultSeason: () => Season | undefined;

  // Location management
  addLocation: (location: Omit<Location, "id">) => string;
  updateLocation: (id: string, location: Partial<Location>) => void;
  deleteLocation: (id: string) => void;
  getFieldsByLocation: (locationId: string) => Field[];
  getLocationById: (id: string) => Location | undefined;

  // Field Allocation management
  addFieldAllocation: (allocation: Omit<FieldAllocation, "id" | "createdAt" | "updatedAt">) => string;
  updateFieldAllocation: (id: string, allocation: Partial<FieldAllocation>) => void;
  deleteFieldAllocation: (id: string) => void;
  getFieldAllocationsByDate: (date: string, seasonId?: string) => FieldAllocation[];
  getFieldAllocationsByLocation: (locationId: string, seasonId?: string) => FieldAllocation[];
  getFieldAllocationById: (id: string) => FieldAllocation | undefined;

  // Season-aware filtering helpers
  getGamesBySeason: (seasonId: string) => Game[];
  getScheduleDatesBySeason: (seasonId: string) => ScheduleDate[];
  getFieldAllocationsBySeason: (seasonId: string) => FieldAllocation[];
  getTeamsByOrganizations: (organizationIds: string[]) => Team[];

  // Data migration helpers
  migrateToSeasons: () => void;
  migrateFieldsToLocations: () => void;
}

const defaultSettings: ScheduleSettings = {
  seasonName: "Spring 2024",
  seasonStartDate: new Date().toISOString().split("T")[0],
  seasonEndDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
  defaultGameDuration: 60,
  avoidBackToBackGames: true,
  balanceHomeAway: true,
  minGamesBetweenTeams: 2,
  separateSameOrgTeams: true,
  aiSchedulingEnabled: false,
};

export const useAppStore = create<AppState>()(
  subscribeWithSelector((set, get) => ({
    // Existing entities
    organizations: [],
    coaches: [],
    teams: [],
    fields: [],
    scheduleDates: [],
    games: [],
    weeklySchedules: [],
    settings: defaultSettings,
    isLoaded: false,

    // New entities
    seasons: [],
    locations: [],
    fieldAllocations: [],
    currentSeasonId: null,

    loadData: async () => {
      try {
        const response = await fetch("/api/data");
        if (response.ok) {
          const data = await response.json();
          const loadedSettings = data.settings || defaultSettings;
          // Ensure new settings fields have defaults
          const mergedSettings: ScheduleSettings = {
            ...defaultSettings,
            ...loadedSettings,
            separateSameOrgTeams: loadedSettings.separateSameOrgTeams ?? true,
            aiSchedulingEnabled: loadedSettings.aiSchedulingEnabled ?? false,
          };

          set({
            organizations: data.organizations || [],
            coaches: data.coaches || [],
            teams: data.teams || [],
            fields: data.fields || [],
            scheduleDates: data.scheduleDates || [],
            games: data.games || [],
            weeklySchedules: data.weeklySchedules || [],
            settings: mergedSettings,
            seasons: data.seasons || [],
            locations: data.locations || [],
            fieldAllocations: data.fieldAllocations || [],
            currentSeasonId: data.currentSeasonId || mergedSettings.defaultSeasonId || null,
            isLoaded: true,
          });

          // Run migrations after loading
          const store = get();
          store.migrateToSeasons();
          store.migrateFieldsToLocations();
        }
      } catch (error) {
        console.error("Failed to load data:", error);
        set({ isLoaded: true });
      }
    },

    saveData: async () => {
      const state = get();
      try {
        await fetch("/api/data", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            organizations: state.organizations,
            coaches: state.coaches,
            teams: state.teams,
            fields: state.fields,
            scheduleDates: state.scheduleDates,
            games: state.games,
            weeklySchedules: state.weeklySchedules,
            settings: state.settings,
            seasons: state.seasons,
            locations: state.locations,
            fieldAllocations: state.fieldAllocations,
            currentSeasonId: state.currentSeasonId,
          }),
        });
      } catch (error) {
        console.error("Failed to save data:", error);
      }
    },

    // Organization management
    addOrganization: (org) => {
      set((state) => ({
        organizations: [...state.organizations, { ...org, id: uuidv4() }],
      }));
      get().saveData();
    },

    updateOrganization: (id, updates) => {
      set((state) => ({
        organizations: state.organizations.map((o) =>
          o.id === id ? { ...o, ...updates } : o
        ),
      }));
      get().saveData();
    },

    deleteOrganization: (id) => {
      set((state) => ({
        organizations: state.organizations.filter((o) => o.id !== id),
        // Remove org reference from teams and coaches but don't delete them
        teams: state.teams.map((t) =>
          t.organizationId === id ? { ...t, organizationId: undefined } : t
        ),
        coaches: state.coaches.map((c) =>
          c.organizationId === id ? { ...c, organizationId: undefined } : c
        ),
      }));
      get().saveData();
    },

    getTeamsByOrganization: (orgId) => {
      return get().teams.filter((t) => t.organizationId === orgId);
    },

    getCoachesByOrganization: (orgId) => {
      return get().coaches.filter((c) => c.organizationId === orgId);
    },

    // Global coach management
    addCoach: (coach) => {
      set((state) => ({
        coaches: [...state.coaches, { ...coach, id: uuidv4() }],
      }));
      get().saveData();
    },

    updateCoachById: (coachId, updates) => {
      set((state) => ({
        coaches: state.coaches.map((c) =>
          c.id === coachId ? { ...c, ...updates } : c
        ),
      }));
      get().saveData();
    },

    deleteCoach: (coachId) => {
      set((state) => ({
        coaches: state.coaches.filter((c) => c.id !== coachId),
        // Remove coach from all teams' coachIds arrays
        teams: state.teams.map((t) => ({
          ...t,
          coachIds: t.coachIds?.filter((id) => id !== coachId) || [],
        })),
      }));
      get().saveData();
    },

    assignCoachToTeam: (teamId, coachId) => {
      set((state) => ({
        teams: state.teams.map((t) =>
          t.id === teamId
            ? {
                ...t,
                coachIds: [...(t.coachIds || []), coachId].filter(
                  (id, index, arr) => arr.indexOf(id) === index
                ),
              }
            : t
        ),
      }));
      get().saveData();
    },

    removeCoachFromTeamById: (teamId, coachId) => {
      set((state) => ({
        teams: state.teams.map((t) =>
          t.id === teamId
            ? {
                ...t,
                coachIds: t.coachIds?.filter((id) => id !== coachId) || [],
              }
            : t
        ),
      }));
      get().saveData();
    },

    addTeam: (team) => {
      set((state) => ({
        teams: [...state.teams, { ...team, id: uuidv4() }],
      }));
      get().saveData();
    },

    updateTeam: (id, updates) => {
      set((state) => ({
        teams: state.teams.map((t) =>
          t.id === id ? { ...t, ...updates } : t
        ),
      }));
      get().saveData();
    },

    deleteTeam: (id) => {
      set((state) => ({
        teams: state.teams.filter((t) => t.id !== id),
        games: state.games.filter(
          (g) => g.homeTeamId !== id && g.awayTeamId !== id
        ),
      }));
      get().saveData();
    },

    addCoachToTeam: (teamId, coach) => {
      set((state) => ({
        teams: state.teams.map((t) =>
          t.id === teamId
            ? { ...t, coaches: [...t.coaches, { ...coach, id: uuidv4() }] }
            : t
        ),
      }));
      get().saveData();
    },

    removeCoachFromTeam: (teamId, coachId) => {
      set((state) => ({
        teams: state.teams.map((t) =>
          t.id === teamId
            ? { ...t, coaches: t.coaches.filter((c) => c.id !== coachId) }
            : t
        ),
      }));
      get().saveData();
    },

    updateCoach: (teamId, coachId, updates) => {
      set((state) => ({
        teams: state.teams.map((t) =>
          t.id === teamId
            ? {
                ...t,
                coaches: t.coaches.map((c) =>
                  c.id === coachId ? { ...c, ...updates } : c
                ),
              }
            : t
        ),
      }));
      get().saveData();
    },

    addField: (field) => {
      set((state) => ({
        fields: [...state.fields, { ...field, id: uuidv4() }],
      }));
      get().saveData();
    },

    updateField: (id, updates) => {
      set((state) => ({
        fields: state.fields.map((f) =>
          f.id === id ? { ...f, ...updates } : f
        ),
      }));
      get().saveData();
    },

    deleteField: (id) => {
      set((state) => ({
        fields: state.fields.filter((f) => f.id !== id),
        games: state.games.filter((g) => g.fieldId !== id),
      }));
      get().saveData();
    },

    addScheduleDate: (date) => {
      set((state) => ({
        scheduleDates: [...state.scheduleDates, { ...date, id: uuidv4() }],
      }));
      get().saveData();
    },

    updateScheduleDate: (id, updates) => {
      set((state) => ({
        scheduleDates: state.scheduleDates.map((d) =>
          d.id === id ? { ...d, ...updates } : d
        ),
      }));
      get().saveData();
    },

    deleteScheduleDate: (id) => {
      set((state) => ({
        scheduleDates: state.scheduleDates.filter((d) => d.id !== id),
        games: state.games.filter((g) => g.dateId !== id),
      }));
      get().saveData();
    },

    addTimeSlotToDate: (dateId, timeSlot) => {
      set((state) => ({
        scheduleDates: state.scheduleDates.map((d) =>
          d.id === dateId
            ? {
                ...d,
                timeSlots: [...d.timeSlots, { ...timeSlot, id: uuidv4() }],
              }
            : d
        ),
      }));
      get().saveData();
    },

    removeTimeSlotFromDate: (dateId, timeSlotId) => {
      set((state) => ({
        scheduleDates: state.scheduleDates.map((d) =>
          d.id === dateId
            ? {
                ...d,
                timeSlots: d.timeSlots.filter((ts) => ts.id !== timeSlotId),
              }
            : d
        ),
      }));
      get().saveData();
    },

    addGame: (game) => {
      set((state) => ({
        games: [...state.games, { ...game, id: uuidv4() }],
      }));
      get().saveData();
    },

    updateGame: (id, updates) => {
      set((state) => ({
        games: state.games.map((g) =>
          g.id === id ? { ...g, ...updates } : g
        ),
      }));
      get().saveData();
    },

    deleteGame: (id) => {
      set((state) => ({
        games: state.games.filter((g) => g.id !== id),
      }));
      get().saveData();
    },

    generateWeeklySchedule: (weekStartDate) => {
      const state = get();
      const startDate = new Date(weekStartDate);
      const endDate = new Date(startDate);
      endDate.setDate(endDate.getDate() + 6);

      const weekGames = state.games.filter((g) => {
        const gameDate = state.scheduleDates.find((d) => d.id === g.dateId);
        if (!gameDate) return false;
        const gDate = new Date(gameDate.date);
        return gDate >= startDate && gDate <= endDate;
      });

      if (weekGames.length === 0) return null;

      const schedule: WeeklySchedule = {
        id: uuidv4(),
        weekStartDate: startDate.toISOString().split("T")[0],
        weekEndDate: endDate.toISOString().split("T")[0],
        games: weekGames,
        isPublished: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      set((state) => ({
        weeklySchedules: [...state.weeklySchedules, schedule],
      }));
      get().saveData();

      return schedule;
    },

    publishSchedule: (scheduleId) => {
      set((state) => ({
        weeklySchedules: state.weeklySchedules.map((s) =>
          s.id === scheduleId
            ? { ...s, isPublished: true, updatedAt: new Date().toISOString() }
            : s
        ),
      }));
      get().saveData();
    },

    updateSettings: (updates) => {
      set((state) => ({
        settings: { ...state.settings, ...updates },
      }));
      get().saveData();
    },

    clearAllData: () => {
      set({
        organizations: [],
        coaches: [],
        teams: [],
        fields: [],
        scheduleDates: [],
        games: [],
        weeklySchedules: [],
        settings: defaultSettings,
        seasons: [],
        locations: [],
        fieldAllocations: [],
        currentSeasonId: null,
      });
      get().saveData();
    },

    // =========================================================================
    // Season Management
    // =========================================================================
    addSeason: (season) => {
      const id = uuidv4();
      const now = new Date().toISOString();
      const newSeason: Season = {
        ...season,
        id,
        createdAt: now,
        updatedAt: now,
      };

      set((state) => {
        // If this is the first season or it's marked as default, make it the only default
        const updatedSeasons = season.isDefault
          ? state.seasons.map((s) => ({ ...s, isDefault: false }))
          : state.seasons;

        return {
          seasons: [...updatedSeasons, newSeason],
          currentSeasonId: season.isDefault ? id : state.currentSeasonId,
        };
      });
      get().saveData();
      return id;
    },

    updateSeason: (id, updates) => {
      set((state) => {
        let updatedSeasons = state.seasons.map((s) =>
          s.id === id ? { ...s, ...updates, updatedAt: new Date().toISOString() } : s
        );

        // If setting this season as default, remove default from others
        if (updates.isDefault) {
          updatedSeasons = updatedSeasons.map((s) =>
            s.id !== id ? { ...s, isDefault: false } : s
          );
        }

        return {
          seasons: updatedSeasons,
          // Update settings with new default season if needed
          settings: updates.isDefault
            ? { ...state.settings, defaultSeasonId: id }
            : state.settings,
        };
      });
      get().saveData();
    },

    deleteSeason: (id) => {
      set((state) => {
        const deletedSeason = state.seasons.find((s) => s.id === id);
        const remainingSeasons = state.seasons.filter((s) => s.id !== id);

        // If deleting the default season, make the first remaining one default
        let newSeasons = remainingSeasons;
        if (deletedSeason?.isDefault && remainingSeasons.length > 0) {
          newSeasons = remainingSeasons.map((s, i) =>
            i === 0 ? { ...s, isDefault: true } : s
          );
        }

        return {
          seasons: newSeasons,
          // Clear currentSeasonId if we're deleting the current season
          currentSeasonId:
            state.currentSeasonId === id
              ? newSeasons.length > 0
                ? newSeasons[0].id
                : null
              : state.currentSeasonId,
          // Update settings if we deleted the default
          settings:
            state.settings.defaultSeasonId === id
              ? {
                  ...state.settings,
                  defaultSeasonId: newSeasons.length > 0 ? newSeasons[0].id : undefined,
                }
              : state.settings,
          // Remove field allocations for this season
          fieldAllocations: state.fieldAllocations.filter((fa) => fa.seasonId !== id),
        };
      });
      get().saveData();
    },

    setCurrentSeason: (seasonId) => {
      set({ currentSeasonId: seasonId });
      get().saveData();
    },

    getSeasonById: (id) => {
      return get().seasons.find((s) => s.id === id);
    },

    getDefaultSeason: () => {
      const state = get();
      return state.seasons.find((s) => s.isDefault) || state.seasons[0];
    },

    // =========================================================================
    // Location Management
    // =========================================================================
    addLocation: (location) => {
      const id = uuidv4();
      set((state) => ({
        locations: [...state.locations, { ...location, id }],
      }));
      get().saveData();
      return id;
    },

    updateLocation: (id, updates) => {
      set((state) => ({
        locations: state.locations.map((l) =>
          l.id === id ? { ...l, ...updates } : l
        ),
      }));
      get().saveData();
    },

    deleteLocation: (id) => {
      set((state) => ({
        locations: state.locations.filter((l) => l.id !== id),
        // Remove locationId from fields at this location
        fields: state.fields.map((f) =>
          f.locationId === id ? { ...f, locationId: undefined } : f
        ),
        // Remove field allocations for this location
        fieldAllocations: state.fieldAllocations.filter((fa) => fa.locationId !== id),
      }));
      get().saveData();
    },

    getFieldsByLocation: (locationId) => {
      return get().fields.filter((f) => f.locationId === locationId);
    },

    getLocationById: (id) => {
      return get().locations.find((l) => l.id === id);
    },

    // =========================================================================
    // Field Allocation Management
    // =========================================================================
    addFieldAllocation: (allocation) => {
      const id = uuidv4();
      const now = new Date().toISOString();
      const newAllocation: FieldAllocation = {
        ...allocation,
        id,
        createdAt: now,
        updatedAt: now,
      };

      set((state) => ({
        fieldAllocations: [...state.fieldAllocations, newAllocation],
      }));
      get().saveData();
      return id;
    },

    updateFieldAllocation: (id, updates) => {
      set((state) => ({
        fieldAllocations: state.fieldAllocations.map((fa) =>
          fa.id === id
            ? { ...fa, ...updates, updatedAt: new Date().toISOString() }
            : fa
        ),
      }));
      get().saveData();
    },

    deleteFieldAllocation: (id) => {
      set((state) => ({
        fieldAllocations: state.fieldAllocations.filter((fa) => fa.id !== id),
        // Remove fieldAllocationId from games linked to this allocation
        games: state.games.map((g) =>
          g.fieldAllocationId === id ? { ...g, fieldAllocationId: undefined } : g
        ),
      }));
      get().saveData();
    },

    getFieldAllocationsByDate: (date, seasonId) => {
      const state = get();
      return state.fieldAllocations.filter(
        (fa) => fa.date === date && (!seasonId || fa.seasonId === seasonId)
      );
    },

    getFieldAllocationsByLocation: (locationId, seasonId) => {
      const state = get();
      return state.fieldAllocations.filter(
        (fa) => fa.locationId === locationId && (!seasonId || fa.seasonId === seasonId)
      );
    },

    getFieldAllocationById: (id) => {
      return get().fieldAllocations.find((fa) => fa.id === id);
    },

    // =========================================================================
    // Season-aware Filtering Helpers
    // =========================================================================
    getGamesBySeason: (seasonId) => {
      return get().games.filter((g) => g.seasonId === seasonId);
    },

    getScheduleDatesBySeason: (seasonId) => {
      return get().scheduleDates.filter((d) => d.seasonId === seasonId);
    },

    getFieldAllocationsBySeason: (seasonId) => {
      return get().fieldAllocations.filter((fa) => fa.seasonId === seasonId);
    },

    getTeamsByOrganizations: (organizationIds) => {
      return get().teams.filter(
        (t) => t.organizationId && organizationIds.includes(t.organizationId)
      );
    },

    // =========================================================================
    // Data Migration Helpers
    // =========================================================================
    migrateToSeasons: () => {
      const state = get();

      // Skip if seasons already exist
      if (state.seasons.length > 0) return;

      // Skip if there's no legacy season data
      if (!state.settings.seasonName) return;

      // Create a legacy season from settings
      const now = new Date().toISOString();
      const legacySeasonId = uuidv4();
      const legacySeason: Season = {
        id: legacySeasonId,
        name: state.settings.seasonName || "Legacy Season",
        startDate: state.settings.seasonStartDate,
        endDate: state.settings.seasonEndDate,
        status: "active" as SeasonStatus,
        isDefault: true,
        notes: "Migrated from legacy settings",
        createdAt: now,
        updatedAt: now,
      };

      // Update games and schedule dates with the legacy season ID
      const updatedGames = state.games.map((g) => ({
        ...g,
        seasonId: g.seasonId || legacySeasonId,
      }));

      const updatedScheduleDates = state.scheduleDates.map((d) => ({
        ...d,
        seasonId: d.seasonId || legacySeasonId,
      }));

      const updatedWeeklySchedules = state.weeklySchedules.map((ws) => ({
        ...ws,
        seasonId: ws.seasonId || legacySeasonId,
      }));

      set({
        seasons: [legacySeason],
        games: updatedGames,
        scheduleDates: updatedScheduleDates,
        weeklySchedules: updatedWeeklySchedules,
        currentSeasonId: legacySeasonId,
        settings: {
          ...state.settings,
          defaultSeasonId: legacySeasonId,
        },
      });

      get().saveData();
    },

    migrateFieldsToLocations: () => {
      const state = get();

      // Skip if locations already exist
      if (state.locations.length > 0) return;

      // Skip if there are no fields with location strings
      const fieldsWithLocation = state.fields.filter((f) => f.location && !f.locationId);
      if (fieldsWithLocation.length === 0) return;

      // Group fields by their location string
      const locationGroups = new Map<string, Field[]>();
      state.fields.forEach((field) => {
        if (field.location && !field.locationId) {
          const locName = field.location;
          const existing = locationGroups.get(locName) || [];
          existing.push(field);
          locationGroups.set(locName, existing);
        }
      });

      // Create Location entities and update fields
      const newLocations: Location[] = [];
      const fieldUpdates: { id: string; locationId: string }[] = [];

      locationGroups.forEach((fields, locName) => {
        const locationId = uuidv4();
        newLocations.push({
          id: locationId,
          name: locName,
        });
        fields.forEach((f) => {
          fieldUpdates.push({ id: f.id, locationId });
        });
      });

      // Apply updates
      set((state) => ({
        locations: newLocations,
        fields: state.fields.map((f) => {
          const update = fieldUpdates.find((u) => u.id === f.id);
          return update ? { ...f, locationId: update.locationId } : f;
        }),
      }));

      get().saveData();
    },
  }))
);
