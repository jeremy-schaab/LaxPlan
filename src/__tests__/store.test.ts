import { useAppStore } from "@/store";
import type { Team, Field, ScheduleDate } from "@/types";

// Reset store before each test
beforeEach(() => {
  useAppStore.setState({
    teams: [],
    fields: [],
    scheduleDates: [],
    games: [],
    weeklySchedules: [],
    settings: {
      seasonName: "Spring 2024",
      seasonStartDate: "2024-03-01",
      seasonEndDate: "2024-06-01",
      defaultGameDuration: 60,
      avoidBackToBackGames: true,
      balanceHomeAway: true,
      minGamesBetweenTeams: 2,
    },
    isLoaded: true,
  });
});

// Mock fetch for saveData calls
beforeEach(() => {
  (global.fetch as jest.Mock).mockResolvedValue({
    ok: true,
    json: () => Promise.resolve({ success: true }),
  });
});

describe("Store - Team Management", () => {
  describe("addTeam", () => {
    it("should add a new team with generated id", () => {
      const store = useAppStore.getState();

      store.addTeam({
        name: "Thunder",
        ageGroup: "U10",
        coaches: [],
        color: "#3b82f6",
      });

      const teams = useAppStore.getState().teams;
      expect(teams.length).toBe(1);
      expect(teams[0].name).toBe("Thunder");
      expect(teams[0].ageGroup).toBe("U10");
      expect(teams[0].id).toBeDefined();
      expect(typeof teams[0].id).toBe("string");
    });

    it("should add multiple teams", () => {
      const store = useAppStore.getState();

      store.addTeam({ name: "Team 1", ageGroup: "U10", coaches: [] });
      store.addTeam({ name: "Team 2", ageGroup: "U12", coaches: [] });
      store.addTeam({ name: "Team 3", ageGroup: "U14", coaches: [] });

      const teams = useAppStore.getState().teams;
      expect(teams.length).toBe(3);
    });

    it("should preserve existing teams when adding new one", () => {
      const store = useAppStore.getState();

      store.addTeam({ name: "Team 1", ageGroup: "U10", coaches: [] });
      store.addTeam({ name: "Team 2", ageGroup: "U12", coaches: [] });

      const teams = useAppStore.getState().teams;
      expect(teams[0].name).toBe("Team 1");
      expect(teams[1].name).toBe("Team 2");
    });
  });

  describe("updateTeam", () => {
    it("should update team properties", () => {
      const store = useAppStore.getState();
      store.addTeam({ name: "Original Name", ageGroup: "U10", coaches: [] });

      const teamId = useAppStore.getState().teams[0].id;
      store.updateTeam(teamId, { name: "Updated Name", ageGroup: "U12" });

      const team = useAppStore.getState().teams[0];
      expect(team.name).toBe("Updated Name");
      expect(team.ageGroup).toBe("U12");
    });

    it("should only update specified properties", () => {
      const store = useAppStore.getState();
      store.addTeam({
        name: "Team",
        ageGroup: "U10",
        coaches: [],
        color: "#ff0000",
      });

      const teamId = useAppStore.getState().teams[0].id;
      store.updateTeam(teamId, { name: "New Name" });

      const team = useAppStore.getState().teams[0];
      expect(team.name).toBe("New Name");
      expect(team.ageGroup).toBe("U10");
      expect(team.color).toBe("#ff0000");
    });

    it("should not update other teams", () => {
      const store = useAppStore.getState();
      store.addTeam({ name: "Team 1", ageGroup: "U10", coaches: [] });
      store.addTeam({ name: "Team 2", ageGroup: "U12", coaches: [] });

      const teamId = useAppStore.getState().teams[0].id;
      store.updateTeam(teamId, { name: "Updated Team 1" });

      const teams = useAppStore.getState().teams;
      expect(teams[0].name).toBe("Updated Team 1");
      expect(teams[1].name).toBe("Team 2");
    });
  });

  describe("deleteTeam", () => {
    it("should remove team from store", () => {
      const store = useAppStore.getState();
      store.addTeam({ name: "Team to Delete", ageGroup: "U10", coaches: [] });

      const teamId = useAppStore.getState().teams[0].id;
      store.deleteTeam(teamId);

      expect(useAppStore.getState().teams.length).toBe(0);
    });

    it("should remove associated games when team is deleted", () => {
      const store = useAppStore.getState();
      store.addTeam({ name: "Team 1", ageGroup: "U10", coaches: [] });
      store.addTeam({ name: "Team 2", ageGroup: "U10", coaches: [] });
      store.addField({ name: "Field A", canSplit: false, maxSplits: 1 });
      store.addScheduleDate({
        date: "2024-03-01",
        timeSlots: [{ id: "ts1", startTime: "09:00", endTime: "10:00" }],
        isActive: true,
      });

      const state = useAppStore.getState();
      store.addGame({
        homeTeamId: state.teams[0].id,
        awayTeamId: state.teams[1].id,
        fieldId: state.fields[0].id,
        fieldPortion: "full",
        dateId: state.scheduleDates[0].id,
        timeSlotId: "ts1",
        status: "scheduled",
      });

      expect(useAppStore.getState().games.length).toBe(1);

      store.deleteTeam(state.teams[0].id);

      expect(useAppStore.getState().games.length).toBe(0);
    });

    it("should keep unrelated games when team is deleted", () => {
      const store = useAppStore.getState();
      store.addTeam({ name: "Team 1", ageGroup: "U10", coaches: [] });
      store.addTeam({ name: "Team 2", ageGroup: "U10", coaches: [] });
      store.addTeam({ name: "Team 3", ageGroup: "U10", coaches: [] });
      store.addField({ name: "Field A", canSplit: false, maxSplits: 1 });
      store.addScheduleDate({
        date: "2024-03-01",
        timeSlots: [
          { id: "ts1", startTime: "09:00", endTime: "10:00" },
          { id: "ts2", startTime: "10:00", endTime: "11:00" },
        ],
        isActive: true,
      });

      const state = useAppStore.getState();
      // Game between Team 2 and Team 3
      store.addGame({
        homeTeamId: state.teams[1].id,
        awayTeamId: state.teams[2].id,
        fieldId: state.fields[0].id,
        fieldPortion: "full",
        dateId: state.scheduleDates[0].id,
        timeSlotId: "ts1",
        status: "scheduled",
      });

      // Delete Team 1 (not involved in game)
      store.deleteTeam(state.teams[0].id);

      expect(useAppStore.getState().games.length).toBe(1);
    });
  });

  describe("Coach Management", () => {
    it("should add coach to team", () => {
      const store = useAppStore.getState();
      store.addTeam({ name: "Team", ageGroup: "U10", coaches: [] });

      const teamId = useAppStore.getState().teams[0].id;
      store.addCoachToTeam(teamId, {
        name: "John Doe",
        email: "john@example.com",
        phone: "555-1234",
      });

      const team = useAppStore.getState().teams[0];
      expect(team.coaches.length).toBe(1);
      expect(team.coaches[0].name).toBe("John Doe");
      expect(team.coaches[0].email).toBe("john@example.com");
      expect(team.coaches[0].id).toBeDefined();
    });

    it("should remove coach from team", () => {
      const store = useAppStore.getState();
      store.addTeam({ name: "Team", ageGroup: "U10", coaches: [] });

      const teamId = useAppStore.getState().teams[0].id;
      store.addCoachToTeam(teamId, {
        name: "John Doe",
        email: "john@example.com",
      });

      const coachId = useAppStore.getState().teams[0].coaches[0].id;
      store.removeCoachFromTeam(teamId, coachId);

      expect(useAppStore.getState().teams[0].coaches.length).toBe(0);
    });

    it("should update coach information", () => {
      const store = useAppStore.getState();
      store.addTeam({ name: "Team", ageGroup: "U10", coaches: [] });

      const teamId = useAppStore.getState().teams[0].id;
      store.addCoachToTeam(teamId, {
        name: "John Doe",
        email: "john@example.com",
      });

      const coachId = useAppStore.getState().teams[0].coaches[0].id;
      store.updateCoach(teamId, coachId, {
        email: "newemail@example.com",
      });

      const coach = useAppStore.getState().teams[0].coaches[0];
      expect(coach.name).toBe("John Doe");
      expect(coach.email).toBe("newemail@example.com");
    });
  });
});

describe("Store - Field Management", () => {
  describe("addField", () => {
    it("should add a new field with generated id", () => {
      const store = useAppStore.getState();
      store.addField({
        name: "Field A",
        location: "Main Complex",
        canSplit: false,
        maxSplits: 1,
      });

      const fields = useAppStore.getState().fields;
      expect(fields.length).toBe(1);
      expect(fields[0].name).toBe("Field A");
      expect(fields[0].id).toBeDefined();
    });

    it("should add splittable field", () => {
      const store = useAppStore.getState();
      store.addField({
        name: "Field B",
        canSplit: true,
        maxSplits: 2,
      });

      const field = useAppStore.getState().fields[0];
      expect(field.canSplit).toBe(true);
      expect(field.maxSplits).toBe(2);
    });
  });

  describe("updateField", () => {
    it("should update field properties", () => {
      const store = useAppStore.getState();
      store.addField({ name: "Field A", canSplit: false, maxSplits: 1 });

      const fieldId = useAppStore.getState().fields[0].id;
      store.updateField(fieldId, { name: "Field A Updated", canSplit: true });

      const field = useAppStore.getState().fields[0];
      expect(field.name).toBe("Field A Updated");
      expect(field.canSplit).toBe(true);
    });
  });

  describe("deleteField", () => {
    it("should remove field and associated games", () => {
      const store = useAppStore.getState();
      store.addTeam({ name: "Team 1", ageGroup: "U10", coaches: [] });
      store.addTeam({ name: "Team 2", ageGroup: "U10", coaches: [] });
      store.addField({ name: "Field A", canSplit: false, maxSplits: 1 });
      store.addScheduleDate({
        date: "2024-03-01",
        timeSlots: [{ id: "ts1", startTime: "09:00", endTime: "10:00" }],
        isActive: true,
      });

      const state = useAppStore.getState();
      store.addGame({
        homeTeamId: state.teams[0].id,
        awayTeamId: state.teams[1].id,
        fieldId: state.fields[0].id,
        fieldPortion: "full",
        dateId: state.scheduleDates[0].id,
        timeSlotId: "ts1",
        status: "scheduled",
      });

      store.deleteField(state.fields[0].id);

      expect(useAppStore.getState().fields.length).toBe(0);
      expect(useAppStore.getState().games.length).toBe(0);
    });
  });
});

describe("Store - Schedule Date Management", () => {
  describe("addScheduleDate", () => {
    it("should add schedule date with time slots", () => {
      const store = useAppStore.getState();
      store.addScheduleDate({
        date: "2024-03-01",
        timeSlots: [
          { id: "ts1", startTime: "09:00", endTime: "10:00" },
          { id: "ts2", startTime: "10:15", endTime: "11:15" },
        ],
        isActive: true,
      });

      const dates = useAppStore.getState().scheduleDates;
      expect(dates.length).toBe(1);
      expect(dates[0].date).toBe("2024-03-01");
      expect(dates[0].timeSlots.length).toBe(2);
    });
  });

  describe("updateScheduleDate", () => {
    it("should toggle isActive status", () => {
      const store = useAppStore.getState();
      store.addScheduleDate({
        date: "2024-03-01",
        timeSlots: [],
        isActive: true,
      });

      const dateId = useAppStore.getState().scheduleDates[0].id;
      store.updateScheduleDate(dateId, { isActive: false });

      expect(useAppStore.getState().scheduleDates[0].isActive).toBe(false);
    });
  });

  describe("Time Slot Management", () => {
    it("should add time slot to date", () => {
      const store = useAppStore.getState();
      store.addScheduleDate({
        date: "2024-03-01",
        timeSlots: [],
        isActive: true,
      });

      const dateId = useAppStore.getState().scheduleDates[0].id;
      store.addTimeSlotToDate(dateId, {
        startTime: "09:00",
        endTime: "10:00",
        label: "Morning",
      });

      const slots = useAppStore.getState().scheduleDates[0].timeSlots;
      expect(slots.length).toBe(1);
      expect(slots[0].startTime).toBe("09:00");
      expect(slots[0].id).toBeDefined();
    });

    it("should remove time slot from date", () => {
      const store = useAppStore.getState();
      store.addScheduleDate({
        date: "2024-03-01",
        timeSlots: [{ id: "ts1", startTime: "09:00", endTime: "10:00" }],
        isActive: true,
      });

      const dateId = useAppStore.getState().scheduleDates[0].id;
      store.removeTimeSlotFromDate(dateId, "ts1");

      expect(useAppStore.getState().scheduleDates[0].timeSlots.length).toBe(0);
    });
  });

  describe("deleteScheduleDate", () => {
    it("should remove date and associated games", () => {
      const store = useAppStore.getState();
      store.addTeam({ name: "Team 1", ageGroup: "U10", coaches: [] });
      store.addTeam({ name: "Team 2", ageGroup: "U10", coaches: [] });
      store.addField({ name: "Field A", canSplit: false, maxSplits: 1 });
      store.addScheduleDate({
        date: "2024-03-01",
        timeSlots: [{ id: "ts1", startTime: "09:00", endTime: "10:00" }],
        isActive: true,
      });

      const state = useAppStore.getState();
      store.addGame({
        homeTeamId: state.teams[0].id,
        awayTeamId: state.teams[1].id,
        fieldId: state.fields[0].id,
        fieldPortion: "full",
        dateId: state.scheduleDates[0].id,
        timeSlotId: "ts1",
        status: "scheduled",
      });

      store.deleteScheduleDate(state.scheduleDates[0].id);

      expect(useAppStore.getState().scheduleDates.length).toBe(0);
      expect(useAppStore.getState().games.length).toBe(0);
    });
  });
});

describe("Store - Game Management", () => {
  beforeEach(() => {
    const store = useAppStore.getState();
    store.addTeam({ name: "Team 1", ageGroup: "U10", coaches: [] });
    store.addTeam({ name: "Team 2", ageGroup: "U10", coaches: [] });
    store.addField({ name: "Field A", canSplit: false, maxSplits: 1 });
    store.addScheduleDate({
      date: "2024-03-01",
      timeSlots: [{ id: "ts1", startTime: "09:00", endTime: "10:00" }],
      isActive: true,
    });
  });

  describe("addGame", () => {
    it("should add a new game", () => {
      const store = useAppStore.getState();
      const state = useAppStore.getState();

      store.addGame({
        homeTeamId: state.teams[0].id,
        awayTeamId: state.teams[1].id,
        fieldId: state.fields[0].id,
        fieldPortion: "full",
        dateId: state.scheduleDates[0].id,
        timeSlotId: "ts1",
        status: "scheduled",
      });

      const games = useAppStore.getState().games;
      expect(games.length).toBe(1);
      expect(games[0].status).toBe("scheduled");
      expect(games[0].id).toBeDefined();
    });
  });

  describe("updateGame", () => {
    it("should update game status", () => {
      const store = useAppStore.getState();
      const state = useAppStore.getState();

      store.addGame({
        homeTeamId: state.teams[0].id,
        awayTeamId: state.teams[1].id,
        fieldId: state.fields[0].id,
        fieldPortion: "full",
        dateId: state.scheduleDates[0].id,
        timeSlotId: "ts1",
        status: "scheduled",
      });

      const gameId = useAppStore.getState().games[0].id;
      store.updateGame(gameId, {
        status: "completed",
        homeScore: 5,
        awayScore: 3,
      });

      const game = useAppStore.getState().games[0];
      expect(game.status).toBe("completed");
      expect(game.homeScore).toBe(5);
      expect(game.awayScore).toBe(3);
    });
  });

  describe("deleteGame", () => {
    it("should remove game from store", () => {
      const store = useAppStore.getState();
      const state = useAppStore.getState();

      store.addGame({
        homeTeamId: state.teams[0].id,
        awayTeamId: state.teams[1].id,
        fieldId: state.fields[0].id,
        fieldPortion: "full",
        dateId: state.scheduleDates[0].id,
        timeSlotId: "ts1",
        status: "scheduled",
      });

      const gameId = useAppStore.getState().games[0].id;
      store.deleteGame(gameId);

      expect(useAppStore.getState().games.length).toBe(0);
    });
  });
});

describe("Store - Settings Management", () => {
  describe("updateSettings", () => {
    it("should update season name", () => {
      const store = useAppStore.getState();
      store.updateSettings({ seasonName: "Fall 2024" });

      expect(useAppStore.getState().settings.seasonName).toBe("Fall 2024");
    });

    it("should update multiple settings at once", () => {
      const store = useAppStore.getState();
      store.updateSettings({
        seasonName: "Winter 2024",
        defaultGameDuration: 90,
        avoidBackToBackGames: false,
      });

      const settings = useAppStore.getState().settings;
      expect(settings.seasonName).toBe("Winter 2024");
      expect(settings.defaultGameDuration).toBe(90);
      expect(settings.avoidBackToBackGames).toBe(false);
    });

    it("should preserve unmodified settings", () => {
      const store = useAppStore.getState();
      const originalSettings = useAppStore.getState().settings;

      store.updateSettings({ seasonName: "New Season" });

      const settings = useAppStore.getState().settings;
      expect(settings.balanceHomeAway).toBe(originalSettings.balanceHomeAway);
      expect(settings.minGamesBetweenTeams).toBe(
        originalSettings.minGamesBetweenTeams
      );
    });
  });
});

describe("Store - Clear All Data", () => {
  it("should reset all data to defaults", () => {
    const store = useAppStore.getState();

    // Add some data
    store.addTeam({ name: "Team 1", ageGroup: "U10", coaches: [] });
    store.addField({ name: "Field A", canSplit: false, maxSplits: 1 });
    store.addScheduleDate({
      date: "2024-03-01",
      timeSlots: [],
      isActive: true,
    });
    store.updateSettings({ seasonName: "Custom Season" });

    // Clear all
    store.clearAllData();

    const state = useAppStore.getState();
    expect(state.teams.length).toBe(0);
    expect(state.fields.length).toBe(0);
    expect(state.scheduleDates.length).toBe(0);
    expect(state.games.length).toBe(0);
    expect(state.weeklySchedules.length).toBe(0);
    expect(state.settings.seasonName).toBe("Spring 2024"); // Default
  });
});

describe("Store - Data Persistence", () => {
  it("should call saveData after adding team", async () => {
    const store = useAppStore.getState();
    store.addTeam({ name: "Team 1", ageGroup: "U10", coaches: [] });

    // Give time for async saveData
    await new Promise((resolve) => setTimeout(resolve, 10));

    expect(global.fetch).toHaveBeenCalledWith("/api/data", expect.any(Object));
  });

  it("should call saveData after updating settings", async () => {
    const store = useAppStore.getState();
    store.updateSettings({ seasonName: "New Season" });

    await new Promise((resolve) => setTimeout(resolve, 10));

    expect(global.fetch).toHaveBeenCalled();
  });

  it("should load data from server", async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: () =>
        Promise.resolve({
          teams: [{ id: "1", name: "Loaded Team", ageGroup: "U10", coaches: [] }],
          fields: [],
          scheduleDates: [],
          games: [],
          weeklySchedules: [],
          settings: {
            seasonName: "Loaded Season",
            seasonStartDate: "2024-01-01",
            seasonEndDate: "2024-12-31",
            defaultGameDuration: 60,
            avoidBackToBackGames: true,
            balanceHomeAway: true,
            minGamesBetweenTeams: 2,
          },
        }),
    });

    await useAppStore.getState().loadData();

    const state = useAppStore.getState();
    expect(state.teams.length).toBe(1);
    expect(state.teams[0].name).toBe("Loaded Team");
    expect(state.settings.seasonName).toBe("Loaded Season");
  });
});
