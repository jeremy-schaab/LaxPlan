import { create } from "zustand";
import { persist } from "zustand/middleware";
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
  persist(
    (set, get) => ({
      teams: [],
      fields: [],
      scheduleDates: [],
      games: [],
      weeklySchedules: [],
      settings: defaultSettings,

      addTeam: (team) =>
        set((state) => ({
          teams: [...state.teams, { ...team, id: uuidv4() }],
        })),

      updateTeam: (id, updates) =>
        set((state) => ({
          teams: state.teams.map((t) =>
            t.id === id ? { ...t, ...updates } : t
          ),
        })),

      deleteTeam: (id) =>
        set((state) => ({
          teams: state.teams.filter((t) => t.id !== id),
          games: state.games.filter(
            (g) => g.homeTeamId !== id && g.awayTeamId !== id
          ),
        })),

      addCoachToTeam: (teamId, coach) =>
        set((state) => ({
          teams: state.teams.map((t) =>
            t.id === teamId
              ? { ...t, coaches: [...t.coaches, { ...coach, id: uuidv4() }] }
              : t
          ),
        })),

      removeCoachFromTeam: (teamId, coachId) =>
        set((state) => ({
          teams: state.teams.map((t) =>
            t.id === teamId
              ? { ...t, coaches: t.coaches.filter((c) => c.id !== coachId) }
              : t
          ),
        })),

      updateCoach: (teamId, coachId, updates) =>
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
        })),

      addField: (field) =>
        set((state) => ({
          fields: [...state.fields, { ...field, id: uuidv4() }],
        })),

      updateField: (id, updates) =>
        set((state) => ({
          fields: state.fields.map((f) =>
            f.id === id ? { ...f, ...updates } : f
          ),
        })),

      deleteField: (id) =>
        set((state) => ({
          fields: state.fields.filter((f) => f.id !== id),
          games: state.games.filter((g) => g.fieldId !== id),
        })),

      addScheduleDate: (date) =>
        set((state) => ({
          scheduleDates: [...state.scheduleDates, { ...date, id: uuidv4() }],
        })),

      updateScheduleDate: (id, updates) =>
        set((state) => ({
          scheduleDates: state.scheduleDates.map((d) =>
            d.id === id ? { ...d, ...updates } : d
          ),
        })),

      deleteScheduleDate: (id) =>
        set((state) => ({
          scheduleDates: state.scheduleDates.filter((d) => d.id !== id),
          games: state.games.filter((g) => g.dateId !== id),
        })),

      addTimeSlotToDate: (dateId, timeSlot) =>
        set((state) => ({
          scheduleDates: state.scheduleDates.map((d) =>
            d.id === dateId
              ? {
                  ...d,
                  timeSlots: [...d.timeSlots, { ...timeSlot, id: uuidv4() }],
                }
              : d
          ),
        })),

      removeTimeSlotFromDate: (dateId, timeSlotId) =>
        set((state) => ({
          scheduleDates: state.scheduleDates.map((d) =>
            d.id === dateId
              ? {
                  ...d,
                  timeSlots: d.timeSlots.filter((ts) => ts.id !== timeSlotId),
                }
              : d
          ),
        })),

      addGame: (game) =>
        set((state) => ({
          games: [...state.games, { ...game, id: uuidv4() }],
        })),

      updateGame: (id, updates) =>
        set((state) => ({
          games: state.games.map((g) =>
            g.id === id ? { ...g, ...updates } : g
          ),
        })),

      deleteGame: (id) =>
        set((state) => ({
          games: state.games.filter((g) => g.id !== id),
        })),

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

        return schedule;
      },

      publishSchedule: (scheduleId) =>
        set((state) => ({
          weeklySchedules: state.weeklySchedules.map((s) =>
            s.id === scheduleId
              ? { ...s, isPublished: true, updatedAt: new Date().toISOString() }
              : s
          ),
        })),

      updateSettings: (updates) =>
        set((state) => ({
          settings: { ...state.settings, ...updates },
        })),

      clearAllData: () =>
        set({
          teams: [],
          fields: [],
          scheduleDates: [],
          games: [],
          weeklySchedules: [],
          settings: defaultSettings,
        }),
    }),
    {
      name: "laxplan-storage",
    }
  )
);
