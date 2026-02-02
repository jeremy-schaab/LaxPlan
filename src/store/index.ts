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
} from "@/types";

interface AppState {
  teams: Team[];
  fields: Field[];
  scheduleDates: ScheduleDate[];
  games: Game[];
  weeklySchedules: WeeklySchedule[];
  settings: ScheduleSettings;
  isLoaded: boolean;

  loadData: () => Promise<void>;
  saveData: () => Promise<void>;

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
}

const defaultSettings: ScheduleSettings = {
  seasonName: "Spring 2024",
  seasonStartDate: new Date().toISOString().split("T")[0],
  seasonEndDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
  defaultGameDuration: 60,
  avoidBackToBackGames: true,
  balanceHomeAway: true,
  minGamesBetweenTeams: 2,
};

export const useAppStore = create<AppState>()(
  subscribeWithSelector((set, get) => ({
    teams: [],
    fields: [],
    scheduleDates: [],
    games: [],
    weeklySchedules: [],
    settings: defaultSettings,
    isLoaded: false,

    loadData: async () => {
      try {
        const response = await fetch("/api/data");
        if (response.ok) {
          const data = await response.json();
          set({
            teams: data.teams || [],
            fields: data.fields || [],
            scheduleDates: data.scheduleDates || [],
            games: data.games || [],
            weeklySchedules: data.weeklySchedules || [],
            settings: data.settings || defaultSettings,
            isLoaded: true,
          });
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
            teams: state.teams,
            fields: state.fields,
            scheduleDates: state.scheduleDates,
            games: state.games,
            weeklySchedules: state.weeklySchedules,
            settings: state.settings,
          }),
        });
      } catch (error) {
        console.error("Failed to save data:", error);
      }
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
        teams: [],
        fields: [],
        scheduleDates: [],
        games: [],
        weeklySchedules: [],
        settings: defaultSettings,
      });
      get().saveData();
    },
  }))
);
