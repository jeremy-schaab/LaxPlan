import { useAppStore } from "@/store";
import type { Team, Field, ScheduleDate, Season, Location, FieldAllocation } from "@/types";

// Reset store before each test
beforeEach(() => {
  useAppStore.setState({
    teams: [],
    fields: [],
    scheduleDates: [],
    games: [],
    weeklySchedules: [],
    organizations: [],
    coaches: [],
    seasons: [],
    locations: [],
    fieldAllocations: [],
    currentSeasonId: null,
    settings: {
      seasonName: "Spring 2024",
      seasonStartDate: "2024-03-01",
      seasonEndDate: "2024-06-01",
      defaultGameDuration: 60,
      avoidBackToBackGames: true,
      balanceHomeAway: true,
      minGamesBetweenTeams: 2,
      separateSameOrgTeams: true,
      aiSchedulingEnabled: false,
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

// ============================================================================
// Season Management Tests
// ============================================================================
describe("Store - Season Management", () => {
  describe("addSeason", () => {
    it("should add a new season with generated id and timestamps", () => {
      const store = useAppStore.getState();

      const id = store.addSeason({
        name: "Spring 2026",
        startDate: "2026-03-01",
        endDate: "2026-06-01",
        status: "planning",
        isDefault: false,
      });

      const seasons = useAppStore.getState().seasons;
      expect(seasons.length).toBe(1);
      expect(seasons[0].id).toBe(id);
      expect(seasons[0].name).toBe("Spring 2026");
      expect(seasons[0].status).toBe("planning");
      expect(seasons[0].createdAt).toBeDefined();
      expect(seasons[0].updatedAt).toBeDefined();
    });

    it("should set season as current when isDefault is true", () => {
      const store = useAppStore.getState();

      const id = store.addSeason({
        name: "Spring 2026",
        startDate: "2026-03-01",
        endDate: "2026-06-01",
        status: "active",
        isDefault: true,
      });

      const state = useAppStore.getState();
      expect(state.currentSeasonId).toBe(id);
      expect(state.seasons[0].isDefault).toBe(true);
    });

    it("should remove default from other seasons when adding new default", () => {
      const store = useAppStore.getState();

      store.addSeason({
        name: "Spring 2026",
        startDate: "2026-03-01",
        endDate: "2026-06-01",
        status: "active",
        isDefault: true,
      });

      store.addSeason({
        name: "Fall 2026",
        startDate: "2026-09-01",
        endDate: "2026-12-01",
        status: "planning",
        isDefault: true,
      });

      const seasons = useAppStore.getState().seasons;
      expect(seasons[0].isDefault).toBe(false);
      expect(seasons[1].isDefault).toBe(true);
    });
  });

  describe("updateSeason", () => {
    it("should update season properties", () => {
      const store = useAppStore.getState();
      const id = store.addSeason({
        name: "Spring 2026",
        startDate: "2026-03-01",
        endDate: "2026-06-01",
        status: "planning",
        isDefault: false,
      });

      store.updateSeason(id, { name: "Spring 2026 Updated", status: "active" });

      const season = useAppStore.getState().seasons[0];
      expect(season.name).toBe("Spring 2026 Updated");
      expect(season.status).toBe("active");
    });

    it("should update isDefault and remove from others", () => {
      const store = useAppStore.getState();
      const id1 = store.addSeason({
        name: "Season 1",
        startDate: "2026-03-01",
        endDate: "2026-06-01",
        status: "active",
        isDefault: true,
      });
      const id2 = store.addSeason({
        name: "Season 2",
        startDate: "2026-09-01",
        endDate: "2026-12-01",
        status: "planning",
        isDefault: false,
      });

      store.updateSeason(id2, { isDefault: true });

      const seasons = useAppStore.getState().seasons;
      expect(seasons.find((s) => s.id === id1)?.isDefault).toBe(false);
      expect(seasons.find((s) => s.id === id2)?.isDefault).toBe(true);
    });
  });

  describe("deleteSeason", () => {
    it("should remove season from store", () => {
      const store = useAppStore.getState();
      const id = store.addSeason({
        name: "Spring 2026",
        startDate: "2026-03-01",
        endDate: "2026-06-01",
        status: "planning",
        isDefault: false,
      });

      store.deleteSeason(id);

      expect(useAppStore.getState().seasons.length).toBe(0);
    });

    it("should remove associated field allocations when season is deleted", () => {
      const store = useAppStore.getState();
      const seasonId = store.addSeason({
        name: "Spring 2026",
        startDate: "2026-03-01",
        endDate: "2026-06-01",
        status: "active",
        isDefault: true,
      });
      const locationId = store.addLocation({ name: "Park" });

      store.addFieldAllocation({
        seasonId,
        date: "2026-03-14",
        locationId,
        fieldIds: [],
        organizationIds: [],
        teamIds: [],
        timeSlots: [],
      });

      expect(useAppStore.getState().fieldAllocations.length).toBe(1);

      store.deleteSeason(seasonId);

      expect(useAppStore.getState().fieldAllocations.length).toBe(0);
    });

    it("should make first remaining season default when default is deleted", () => {
      const store = useAppStore.getState();
      const id1 = store.addSeason({
        name: "Season 1",
        startDate: "2026-03-01",
        endDate: "2026-06-01",
        status: "active",
        isDefault: true,
      });
      store.addSeason({
        name: "Season 2",
        startDate: "2026-09-01",
        endDate: "2026-12-01",
        status: "planning",
        isDefault: false,
      });

      store.deleteSeason(id1);

      const seasons = useAppStore.getState().seasons;
      expect(seasons.length).toBe(1);
      expect(seasons[0].isDefault).toBe(true);
    });
  });

  describe("setCurrentSeason", () => {
    it("should set current season id", () => {
      const store = useAppStore.getState();
      const id = store.addSeason({
        name: "Spring 2026",
        startDate: "2026-03-01",
        endDate: "2026-06-01",
        status: "active",
        isDefault: false,
      });

      store.setCurrentSeason(id);

      expect(useAppStore.getState().currentSeasonId).toBe(id);
    });

    it("should allow setting current season to null", () => {
      const store = useAppStore.getState();
      store.addSeason({
        name: "Spring 2026",
        startDate: "2026-03-01",
        endDate: "2026-06-01",
        status: "active",
        isDefault: true,
      });

      store.setCurrentSeason(null);

      expect(useAppStore.getState().currentSeasonId).toBeNull();
    });
  });

  describe("getSeasonById", () => {
    it("should return season by id", () => {
      const store = useAppStore.getState();
      const id = store.addSeason({
        name: "Spring 2026",
        startDate: "2026-03-01",
        endDate: "2026-06-01",
        status: "active",
        isDefault: false,
      });

      const season = store.getSeasonById(id);

      expect(season?.name).toBe("Spring 2026");
    });

    it("should return undefined for non-existent id", () => {
      const store = useAppStore.getState();

      const season = store.getSeasonById("non-existent");

      expect(season).toBeUndefined();
    });
  });

  describe("getDefaultSeason", () => {
    it("should return the default season", () => {
      const store = useAppStore.getState();
      store.addSeason({
        name: "Season 1",
        startDate: "2026-03-01",
        endDate: "2026-06-01",
        status: "planning",
        isDefault: false,
      });
      store.addSeason({
        name: "Season 2",
        startDate: "2026-09-01",
        endDate: "2026-12-01",
        status: "active",
        isDefault: true,
      });

      const defaultSeason = store.getDefaultSeason();

      expect(defaultSeason?.name).toBe("Season 2");
    });

    it("should return first season if no default", () => {
      const store = useAppStore.getState();
      store.addSeason({
        name: "Season 1",
        startDate: "2026-03-01",
        endDate: "2026-06-01",
        status: "planning",
        isDefault: false,
      });

      const defaultSeason = store.getDefaultSeason();

      expect(defaultSeason?.name).toBe("Season 1");
    });
  });
});

// ============================================================================
// Location Management Tests
// ============================================================================
describe("Store - Location Management", () => {
  describe("addLocation", () => {
    it("should add a new location with generated id", () => {
      const store = useAppStore.getState();

      const id = store.addLocation({
        name: "North Collier Regional Park",
        address: "15000 Livingston Rd",
        city: "Naples",
        state: "FL",
        zipCode: "34109",
      });

      const locations = useAppStore.getState().locations;
      expect(locations.length).toBe(1);
      expect(locations[0].id).toBe(id);
      expect(locations[0].name).toBe("North Collier Regional Park");
      expect(locations[0].city).toBe("Naples");
    });

    it("should add location with only required name", () => {
      const store = useAppStore.getState();

      store.addLocation({ name: "Simple Park" });

      const location = useAppStore.getState().locations[0];
      expect(location.name).toBe("Simple Park");
      expect(location.address).toBeUndefined();
    });
  });

  describe("updateLocation", () => {
    it("should update location properties", () => {
      const store = useAppStore.getState();
      const id = store.addLocation({ name: "Original Name" });

      store.updateLocation(id, { name: "Updated Name", city: "Naples" });

      const location = useAppStore.getState().locations[0];
      expect(location.name).toBe("Updated Name");
      expect(location.city).toBe("Naples");
    });
  });

  describe("deleteLocation", () => {
    it("should remove location from store", () => {
      const store = useAppStore.getState();
      const id = store.addLocation({ name: "Park" });

      store.deleteLocation(id);

      expect(useAppStore.getState().locations.length).toBe(0);
    });

    it("should remove locationId from fields at deleted location", () => {
      const store = useAppStore.getState();
      const locationId = store.addLocation({ name: "Park" });
      store.addField({ name: "Field A", locationId, canSplit: false, maxSplits: 1 });

      store.deleteLocation(locationId);

      const field = useAppStore.getState().fields[0];
      expect(field.locationId).toBeUndefined();
    });

    it("should remove field allocations for deleted location", () => {
      const store = useAppStore.getState();
      const seasonId = store.addSeason({
        name: "Season",
        startDate: "2026-03-01",
        endDate: "2026-06-01",
        status: "active",
        isDefault: true,
      });
      const locationId = store.addLocation({ name: "Park" });

      store.addFieldAllocation({
        seasonId,
        date: "2026-03-14",
        locationId,
        fieldIds: [],
        organizationIds: [],
        teamIds: [],
        timeSlots: [],
      });

      expect(useAppStore.getState().fieldAllocations.length).toBe(1);

      store.deleteLocation(locationId);

      expect(useAppStore.getState().fieldAllocations.length).toBe(0);
    });
  });

  describe("getFieldsByLocation", () => {
    it("should return fields at a location", () => {
      const store = useAppStore.getState();
      const locationId = store.addLocation({ name: "Park" });
      store.addField({ name: "Field A", locationId, canSplit: false, maxSplits: 1 });
      store.addField({ name: "Field B", locationId, canSplit: true, maxSplits: 2 });
      store.addField({ name: "Field C", canSplit: false, maxSplits: 1 }); // No location

      const fields = store.getFieldsByLocation(locationId);

      expect(fields.length).toBe(2);
      expect(fields.map((f) => f.name)).toContain("Field A");
      expect(fields.map((f) => f.name)).toContain("Field B");
    });
  });

  describe("getLocationById", () => {
    it("should return location by id", () => {
      const store = useAppStore.getState();
      const id = store.addLocation({ name: "Park" });

      const location = store.getLocationById(id);

      expect(location?.name).toBe("Park");
    });
  });
});

// ============================================================================
// Field Allocation Management Tests
// ============================================================================
describe("Store - Field Allocation Management", () => {
  let seasonId: string;
  let locationId: string;

  beforeEach(() => {
    const store = useAppStore.getState();
    seasonId = store.addSeason({
      name: "Spring 2026",
      startDate: "2026-03-01",
      endDate: "2026-06-01",
      status: "active",
      isDefault: true,
    });
    locationId = store.addLocation({ name: "North Collier Regional Park" });
  });

  describe("addFieldAllocation", () => {
    it("should add a new field allocation with generated id and timestamps", () => {
      const store = useAppStore.getState();

      const id = store.addFieldAllocation({
        seasonId,
        date: "2026-03-14",
        locationId,
        fieldIds: ["field-1", "field-2"],
        organizationIds: ["org-1"],
        teamIds: ["team-1", "team-2"],
        timeSlots: [{ id: "ts-1", startTime: "09:00", endTime: "10:00" }],
        notes: "Weekend games",
      });

      const allocations = useAppStore.getState().fieldAllocations;
      expect(allocations.length).toBe(1);
      expect(allocations[0].id).toBe(id);
      expect(allocations[0].date).toBe("2026-03-14");
      expect(allocations[0].fieldIds).toHaveLength(2);
      expect(allocations[0].createdAt).toBeDefined();
      expect(allocations[0].updatedAt).toBeDefined();
    });
  });

  describe("updateFieldAllocation", () => {
    it("should update allocation properties", () => {
      const store = useAppStore.getState();
      const id = store.addFieldAllocation({
        seasonId,
        date: "2026-03-14",
        locationId,
        fieldIds: ["field-1"],
        organizationIds: ["org-1"],
        teamIds: [],
        timeSlots: [],
      });

      store.updateFieldAllocation(id, {
        fieldIds: ["field-1", "field-2", "field-3"],
        notes: "Updated notes",
      });

      const allocation = useAppStore.getState().fieldAllocations[0];
      expect(allocation.fieldIds).toHaveLength(3);
      expect(allocation.notes).toBe("Updated notes");
    });
  });

  describe("deleteFieldAllocation", () => {
    it("should remove allocation from store", () => {
      const store = useAppStore.getState();
      const id = store.addFieldAllocation({
        seasonId,
        date: "2026-03-14",
        locationId,
        fieldIds: [],
        organizationIds: [],
        teamIds: [],
        timeSlots: [],
      });

      store.deleteFieldAllocation(id);

      expect(useAppStore.getState().fieldAllocations.length).toBe(0);
    });

    it("should remove fieldAllocationId from linked games", () => {
      const store = useAppStore.getState();
      store.addTeam({ name: "Team 1", ageGroup: "U10", coaches: [] });
      store.addTeam({ name: "Team 2", ageGroup: "U10", coaches: [] });
      store.addField({ name: "Field A", locationId, canSplit: false, maxSplits: 1 });
      store.addScheduleDate({
        date: "2026-03-14",
        seasonId,
        timeSlots: [{ id: "ts1", startTime: "09:00", endTime: "10:00" }],
        isActive: true,
      });

      const allocationId = store.addFieldAllocation({
        seasonId,
        date: "2026-03-14",
        locationId,
        fieldIds: [],
        organizationIds: [],
        teamIds: [],
        timeSlots: [],
      });

      const state = useAppStore.getState();
      store.addGame({
        seasonId,
        homeTeamId: state.teams[0].id,
        awayTeamId: state.teams[1].id,
        fieldId: state.fields[0].id,
        fieldPortion: "full",
        dateId: state.scheduleDates[0].id,
        timeSlotId: "ts1",
        fieldAllocationId: allocationId,
        status: "scheduled",
      });

      store.deleteFieldAllocation(allocationId);

      const game = useAppStore.getState().games[0];
      expect(game.fieldAllocationId).toBeUndefined();
    });
  });

  describe("getFieldAllocationsByDate", () => {
    it("should return allocations for a specific date", () => {
      const store = useAppStore.getState();
      store.addFieldAllocation({
        seasonId,
        date: "2026-03-14",
        locationId,
        fieldIds: [],
        organizationIds: [],
        teamIds: [],
        timeSlots: [],
      });
      store.addFieldAllocation({
        seasonId,
        date: "2026-03-15",
        locationId,
        fieldIds: [],
        organizationIds: [],
        teamIds: [],
        timeSlots: [],
      });

      const allocations = store.getFieldAllocationsByDate("2026-03-14");

      expect(allocations.length).toBe(1);
      expect(allocations[0].date).toBe("2026-03-14");
    });

    it("should filter by seasonId when provided", () => {
      const store = useAppStore.getState();
      const season2Id = store.addSeason({
        name: "Fall 2026",
        startDate: "2026-09-01",
        endDate: "2026-12-01",
        status: "planning",
        isDefault: false,
      });

      store.addFieldAllocation({
        seasonId,
        date: "2026-03-14",
        locationId,
        fieldIds: [],
        organizationIds: [],
        teamIds: [],
        timeSlots: [],
      });
      store.addFieldAllocation({
        seasonId: season2Id,
        date: "2026-03-14",
        locationId,
        fieldIds: [],
        organizationIds: [],
        teamIds: [],
        timeSlots: [],
      });

      const allocations = store.getFieldAllocationsByDate("2026-03-14", seasonId);

      expect(allocations.length).toBe(1);
      expect(allocations[0].seasonId).toBe(seasonId);
    });
  });

  describe("getFieldAllocationsByLocation", () => {
    it("should return allocations for a specific location", () => {
      const store = useAppStore.getState();
      const location2Id = store.addLocation({ name: "Other Park" });

      store.addFieldAllocation({
        seasonId,
        date: "2026-03-14",
        locationId,
        fieldIds: [],
        organizationIds: [],
        teamIds: [],
        timeSlots: [],
      });
      store.addFieldAllocation({
        seasonId,
        date: "2026-03-15",
        locationId: location2Id,
        fieldIds: [],
        organizationIds: [],
        teamIds: [],
        timeSlots: [],
      });

      const allocations = store.getFieldAllocationsByLocation(locationId);

      expect(allocations.length).toBe(1);
      expect(allocations[0].locationId).toBe(locationId);
    });
  });
});

// ============================================================================
// Season-aware Filtering Helpers Tests
// ============================================================================
describe("Store - Season-aware Filtering", () => {
  let seasonId: string;

  beforeEach(() => {
    const store = useAppStore.getState();
    seasonId = store.addSeason({
      name: "Spring 2026",
      startDate: "2026-03-01",
      endDate: "2026-06-01",
      status: "active",
      isDefault: true,
    });
  });

  describe("getGamesBySeason", () => {
    it("should return games for a specific season", () => {
      const store = useAppStore.getState();
      store.addTeam({ name: "Team 1", ageGroup: "U10", coaches: [] });
      store.addTeam({ name: "Team 2", ageGroup: "U10", coaches: [] });
      store.addField({ name: "Field A", canSplit: false, maxSplits: 1 });
      store.addScheduleDate({
        date: "2026-03-14",
        seasonId,
        timeSlots: [{ id: "ts1", startTime: "09:00", endTime: "10:00" }],
        isActive: true,
      });

      const state = useAppStore.getState();
      store.addGame({
        seasonId,
        homeTeamId: state.teams[0].id,
        awayTeamId: state.teams[1].id,
        fieldId: state.fields[0].id,
        fieldPortion: "full",
        dateId: state.scheduleDates[0].id,
        timeSlotId: "ts1",
        status: "scheduled",
      });

      const games = store.getGamesBySeason(seasonId);

      expect(games.length).toBe(1);
      expect(games[0].seasonId).toBe(seasonId);
    });
  });

  describe("getScheduleDatesBySeason", () => {
    it("should return schedule dates for a specific season", () => {
      const store = useAppStore.getState();
      store.addScheduleDate({
        date: "2026-03-14",
        seasonId,
        timeSlots: [],
        isActive: true,
      });
      store.addScheduleDate({
        date: "2026-03-15",
        timeSlots: [],
        isActive: true,
      }); // No season

      const dates = store.getScheduleDatesBySeason(seasonId);

      expect(dates.length).toBe(1);
      expect(dates[0].date).toBe("2026-03-14");
    });
  });

  describe("getFieldAllocationsBySeason", () => {
    it("should return allocations for a specific season", () => {
      const store = useAppStore.getState();
      const locationId = store.addLocation({ name: "Park" });

      store.addFieldAllocation({
        seasonId,
        date: "2026-03-14",
        locationId,
        fieldIds: [],
        organizationIds: [],
        teamIds: [],
        timeSlots: [],
      });

      const allocations = store.getFieldAllocationsBySeason(seasonId);

      expect(allocations.length).toBe(1);
    });
  });

  describe("getTeamsByOrganizations", () => {
    it("should return teams for specified organizations", () => {
      const store = useAppStore.getState();
      store.addOrganization({ name: "Org 1" });
      store.addOrganization({ name: "Org 2" });

      const orgs = useAppStore.getState().organizations;
      store.addTeam({ name: "Team 1", ageGroup: "U10", coaches: [], organizationId: orgs[0].id });
      store.addTeam({ name: "Team 2", ageGroup: "U12", coaches: [], organizationId: orgs[0].id });
      store.addTeam({ name: "Team 3", ageGroup: "U10", coaches: [], organizationId: orgs[1].id });
      store.addTeam({ name: "Team 4", ageGroup: "U14", coaches: [] }); // No org

      const teams = store.getTeamsByOrganizations([orgs[0].id]);

      expect(teams.length).toBe(2);
      expect(teams.every((t) => t.organizationId === orgs[0].id)).toBe(true);
    });

    it("should return teams from multiple organizations", () => {
      const store = useAppStore.getState();
      store.addOrganization({ name: "Org 1" });
      store.addOrganization({ name: "Org 2" });

      const orgs = useAppStore.getState().organizations;
      store.addTeam({ name: "Team 1", ageGroup: "U10", coaches: [], organizationId: orgs[0].id });
      store.addTeam({ name: "Team 2", ageGroup: "U10", coaches: [], organizationId: orgs[1].id });

      const teams = store.getTeamsByOrganizations([orgs[0].id, orgs[1].id]);

      expect(teams.length).toBe(2);
    });
  });
});

// ============================================================================
// Data Migration Tests
// ============================================================================
describe("Store - Data Migration", () => {
  describe("migrateToSeasons", () => {
    it("should skip migration if seasons already exist", () => {
      const store = useAppStore.getState();
      store.addSeason({
        name: "Existing Season",
        startDate: "2026-03-01",
        endDate: "2026-06-01",
        status: "active",
        isDefault: true,
      });

      store.migrateToSeasons();

      expect(useAppStore.getState().seasons.length).toBe(1);
      expect(useAppStore.getState().seasons[0].name).toBe("Existing Season");
    });

    it("should create legacy season from settings", () => {
      useAppStore.setState({
        ...useAppStore.getState(),
        seasons: [],
        settings: {
          ...useAppStore.getState().settings,
          seasonName: "Spring 2024",
          seasonStartDate: "2024-03-01",
          seasonEndDate: "2024-06-01",
        },
      });

      const store = useAppStore.getState();
      store.migrateToSeasons();

      const state = useAppStore.getState();
      expect(state.seasons.length).toBe(1);
      expect(state.seasons[0].name).toBe("Spring 2024");
      expect(state.seasons[0].isDefault).toBe(true);
      expect(state.currentSeasonId).toBe(state.seasons[0].id);
    });
  });

  describe("migrateFieldsToLocations", () => {
    it("should skip migration if locations already exist", () => {
      const store = useAppStore.getState();
      store.addLocation({ name: "Existing Location" });
      store.addField({ name: "Field A", location: "Park", canSplit: false, maxSplits: 1 });

      store.migrateFieldsToLocations();

      expect(useAppStore.getState().locations.length).toBe(1);
      expect(useAppStore.getState().locations[0].name).toBe("Existing Location");
    });

    it("should create locations from field location strings", () => {
      useAppStore.setState({
        ...useAppStore.getState(),
        locations: [],
        fields: [
          { id: "f1", name: "Field A", location: "Park 1", canSplit: false, maxSplits: 1 },
          { id: "f2", name: "Field B", location: "Park 1", canSplit: true, maxSplits: 2 },
          { id: "f3", name: "Field C", location: "Park 2", canSplit: false, maxSplits: 1 },
        ],
      });

      const store = useAppStore.getState();
      store.migrateFieldsToLocations();

      const state = useAppStore.getState();
      expect(state.locations.length).toBe(2);
      expect(state.locations.map((l) => l.name)).toContain("Park 1");
      expect(state.locations.map((l) => l.name)).toContain("Park 2");

      // Fields should have locationId set
      const park1Location = state.locations.find((l) => l.name === "Park 1");
      const fieldsAtPark1 = state.fields.filter((f) => f.locationId === park1Location?.id);
      expect(fieldsAtPark1.length).toBe(2);
    });
  });
});
