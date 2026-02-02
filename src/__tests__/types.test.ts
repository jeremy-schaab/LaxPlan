import type {
  Team,
  Field,
  ScheduleDate,
  TimeSlot,
  Game,
  WeeklySchedule,
  ScheduleSettings,
  Coach,
  AgeGroup,
  FieldType,
  Season,
  SeasonStatus,
  Location,
  FieldAllocation,
  AISchedulingConfig,
  AISchedulingRequest,
  AISchedulingResponse,
  SchedulingConstraints,
  DayScheduleOptions,
  ValidationResult,
  FieldAllocationValidation,
  GameStatus,
} from "@/types";

describe("Type Definitions", () => {
  describe("AgeGroup type", () => {
    it("should accept valid age groups", () => {
      const validAgeGroups: AgeGroup[] = ["U8", "U10", "U12", "U14", "MS", "HS", "Adult"];
      expect(validAgeGroups).toHaveLength(7);
    });
  });

  describe("FieldType type", () => {
    it("should accept valid field types", () => {
      const validFieldTypes: FieldType[] = ["full", "half", "third"];
      expect(validFieldTypes).toHaveLength(3);
    });
  });

  describe("Coach interface", () => {
    it("should allow valid coach objects", () => {
      const coach: Coach = {
        id: "coach-1",
        name: "John Doe",
        email: "john@example.com",
        phone: "555-1234",
      };
      expect(coach.id).toBe("coach-1");
      expect(coach.phone).toBe("555-1234");
    });

    it("should allow coach without optional phone", () => {
      const coach: Coach = {
        id: "coach-1",
        name: "Jane Doe",
        email: "jane@example.com",
      };
      expect(coach.phone).toBeUndefined();
    });
  });

  describe("Team interface", () => {
    it("should allow valid team objects", () => {
      const team: Team = {
        id: "team-1",
        name: "Thunder",
        ageGroup: "U10",
        coaches: [],
        color: "#ff0000",
        notes: "Great team",
      };
      expect(team.name).toBe("Thunder");
      expect(team.coaches).toHaveLength(0);
    });

    it("should allow team with coaches", () => {
      const team: Team = {
        id: "team-1",
        name: "Lightning",
        ageGroup: "U12",
        coaches: [
          { id: "c1", name: "Coach 1", email: "c1@test.com" },
          { id: "c2", name: "Coach 2", email: "c2@test.com" },
        ],
      };
      expect(team.coaches).toHaveLength(2);
    });
  });

  describe("Field interface", () => {
    it("should allow non-splittable field", () => {
      const field: Field = {
        id: "field-1",
        name: "Main Field",
        canSplit: false,
        maxSplits: 1,
      };
      expect(field.canSplit).toBe(false);
      expect(field.maxSplits).toBe(1);
    });

    it("should allow splittable field with maxSplits 2 or 3", () => {
      const field2: Field = {
        id: "field-1",
        name: "Field A",
        canSplit: true,
        maxSplits: 2,
      };
      const field3: Field = {
        id: "field-2",
        name: "Field B",
        canSplit: true,
        maxSplits: 3,
      };
      expect(field2.maxSplits).toBe(2);
      expect(field3.maxSplits).toBe(3);
    });
  });

  describe("TimeSlot interface", () => {
    it("should allow valid time slot", () => {
      const slot: TimeSlot = {
        id: "slot-1",
        startTime: "09:00",
        endTime: "10:00",
        label: "Morning Session",
      };
      expect(slot.startTime).toBe("09:00");
      expect(slot.label).toBe("Morning Session");
    });
  });

  describe("ScheduleDate interface", () => {
    it("should allow date with time slots", () => {
      const scheduleDate: ScheduleDate = {
        id: "date-1",
        date: "2024-03-15",
        timeSlots: [
          { id: "ts1", startTime: "09:00", endTime: "10:00" },
          { id: "ts2", startTime: "10:15", endTime: "11:15" },
        ],
        isActive: true,
        notes: "Opening day",
      };
      expect(scheduleDate.timeSlots).toHaveLength(2);
      expect(scheduleDate.isActive).toBe(true);
    });
  });

  describe("Game interface", () => {
    it("should allow valid game object", () => {
      const game: Game = {
        id: "game-1",
        homeTeamId: "team-1",
        awayTeamId: "team-2",
        fieldId: "field-1",
        fieldPortion: "full",
        dateId: "date-1",
        timeSlotId: "slot-1",
        status: "scheduled",
      };
      expect(game.status).toBe("scheduled");
      expect(game.fieldPortion).toBe("full");
    });

    it("should allow game with scores", () => {
      const game: Game = {
        id: "game-1",
        homeTeamId: "team-1",
        awayTeamId: "team-2",
        fieldId: "field-1",
        fieldPortion: "full",
        dateId: "date-1",
        timeSlotId: "slot-1",
        status: "completed",
        homeScore: 5,
        awayScore: 3,
      };
      expect(game.homeScore).toBe(5);
      expect(game.awayScore).toBe(3);
    });

    it("should allow split field game with section", () => {
      const game: Game = {
        id: "game-1",
        homeTeamId: "team-1",
        awayTeamId: "team-2",
        fieldId: "field-1",
        fieldPortion: "half",
        fieldSection: 1,
        dateId: "date-1",
        timeSlotId: "slot-1",
        status: "scheduled",
      };
      expect(game.fieldPortion).toBe("half");
      expect(game.fieldSection).toBe(1);
    });

    it("should support all valid game statuses", () => {
      const statuses: Game["status"][] = [
        "scheduled",
        "completed",
        "cancelled",
        "postponed",
      ];
      expect(statuses).toHaveLength(4);
    });
  });

  describe("WeeklySchedule interface", () => {
    it("should allow valid weekly schedule", () => {
      const schedule: WeeklySchedule = {
        id: "ws-1",
        weekStartDate: "2024-03-11",
        weekEndDate: "2024-03-17",
        games: [],
        isPublished: false,
        createdAt: "2024-03-10T10:00:00Z",
        updatedAt: "2024-03-10T10:00:00Z",
      };
      expect(schedule.isPublished).toBe(false);
    });
  });

  describe("ScheduleSettings interface", () => {
    it("should allow valid settings", () => {
      const settings: ScheduleSettings = {
        seasonName: "Spring 2024",
        seasonStartDate: "2024-03-01",
        seasonEndDate: "2024-06-01",
        defaultGameDuration: 60,
        avoidBackToBackGames: true,
        balanceHomeAway: true,
        minGamesBetweenTeams: 2,
        separateSameOrgTeams: true,
        aiSchedulingEnabled: false,
      };
      expect(settings.seasonName).toBe("Spring 2024");
      expect(settings.defaultGameDuration).toBe(60);
    });

    it("should allow settings with AI scheduling enabled", () => {
      const settings: ScheduleSettings = {
        seasonName: "Fall 2024",
        seasonStartDate: "2024-09-01",
        seasonEndDate: "2024-12-01",
        defaultGameDuration: 50,
        avoidBackToBackGames: true,
        balanceHomeAway: true,
        minGamesBetweenTeams: 2,
        separateSameOrgTeams: false,
        aiSchedulingEnabled: true,
        defaultSeasonId: "season-1",
      };
      expect(settings.aiSchedulingEnabled).toBe(true);
      expect(settings.defaultSeasonId).toBe("season-1");
    });
  });

  describe("SeasonStatus type", () => {
    it("should accept valid season statuses", () => {
      const validStatuses: SeasonStatus[] = ["planning", "active", "completed", "archived"];
      expect(validStatuses).toHaveLength(4);
    });
  });

  describe("GameStatus type", () => {
    it("should accept valid game statuses", () => {
      const validStatuses: GameStatus[] = ["scheduled", "completed", "cancelled", "postponed"];
      expect(validStatuses).toHaveLength(4);
    });
  });

  describe("Season interface", () => {
    it("should allow valid season objects", () => {
      const season: Season = {
        id: "season-1",
        name: "Spring 2026",
        startDate: "2026-03-01",
        endDate: "2026-06-01",
        status: "active",
        isDefault: true,
        notes: "Main spring season",
        createdAt: "2026-01-15T10:00:00Z",
        updatedAt: "2026-01-15T10:00:00Z",
      };
      expect(season.id).toBe("season-1");
      expect(season.status).toBe("active");
      expect(season.isDefault).toBe(true);
    });

    it("should allow season without optional notes", () => {
      const season: Season = {
        id: "season-2",
        name: "Fall 2026",
        startDate: "2026-09-01",
        endDate: "2026-12-01",
        status: "planning",
        isDefault: false,
        createdAt: "2026-08-01T10:00:00Z",
        updatedAt: "2026-08-01T10:00:00Z",
      };
      expect(season.notes).toBeUndefined();
      expect(season.status).toBe("planning");
    });

    it("should support all season statuses", () => {
      const planningStatus: SeasonStatus = "planning";
      const activeStatus: SeasonStatus = "active";
      const completedStatus: SeasonStatus = "completed";
      const archivedStatus: SeasonStatus = "archived";
      expect([planningStatus, activeStatus, completedStatus, archivedStatus]).toHaveLength(4);
    });
  });

  describe("Location interface", () => {
    it("should allow valid location objects", () => {
      const location: Location = {
        id: "loc-1",
        name: "North Collier Regional Park",
        address: "15000 Livingston Rd",
        city: "Naples",
        state: "FL",
        zipCode: "34109",
        notes: "Main park with multiple fields",
      };
      expect(location.id).toBe("loc-1");
      expect(location.name).toBe("North Collier Regional Park");
      expect(location.city).toBe("Naples");
    });

    it("should allow location with only required fields", () => {
      const location: Location = {
        id: "loc-2",
        name: "Veterans Community Park",
      };
      expect(location.address).toBeUndefined();
      expect(location.city).toBeUndefined();
    });
  });

  describe("Field interface with locationId", () => {
    it("should allow field with locationId", () => {
      const field: Field = {
        id: "field-1",
        name: "Field A",
        locationId: "loc-1",
        canSplit: true,
        maxSplits: 2,
        notes: "North side field",
      };
      expect(field.locationId).toBe("loc-1");
    });

    it("should allow field with deprecated location string for backward compatibility", () => {
      const field: Field = {
        id: "field-2",
        name: "Field B",
        location: "North Collier Regional Park",
        canSplit: false,
        maxSplits: 1,
      };
      expect(field.location).toBe("North Collier Regional Park");
      expect(field.locationId).toBeUndefined();
    });
  });

  describe("FieldAllocation interface", () => {
    it("should allow valid field allocation objects", () => {
      const allocation: FieldAllocation = {
        id: "alloc-1",
        seasonId: "season-1",
        date: "2026-03-14",
        locationId: "loc-1",
        fieldIds: ["field-1", "field-2", "field-3"],
        organizationIds: ["org-1", "org-2"],
        teamIds: ["team-1", "team-2", "team-3", "team-4"],
        timeSlots: [
          { id: "ts-1", startTime: "09:00", endTime: "10:00" },
          { id: "ts-2", startTime: "10:15", endTime: "11:15" },
        ],
        notes: "Weekend games",
        createdAt: "2026-03-01T10:00:00Z",
        updatedAt: "2026-03-01T10:00:00Z",
      };
      expect(allocation.fieldIds).toHaveLength(3);
      expect(allocation.organizationIds).toHaveLength(2);
      expect(allocation.timeSlots).toHaveLength(2);
    });

    it("should allow field allocation without optional notes", () => {
      const allocation: FieldAllocation = {
        id: "alloc-2",
        seasonId: "season-1",
        date: "2026-03-15",
        locationId: "loc-2",
        fieldIds: ["field-4"],
        organizationIds: ["org-1"],
        teamIds: [],
        timeSlots: [],
        createdAt: "2026-03-01T10:00:00Z",
        updatedAt: "2026-03-01T10:00:00Z",
      };
      expect(allocation.notes).toBeUndefined();
    });
  });

  describe("ScheduleDate interface with seasonId", () => {
    it("should allow schedule date with seasonId", () => {
      const scheduleDate: ScheduleDate = {
        id: "date-1",
        seasonId: "season-1",
        date: "2026-03-14",
        timeSlots: [
          { id: "ts1", startTime: "09:00", endTime: "10:00" },
        ],
        isActive: true,
      };
      expect(scheduleDate.seasonId).toBe("season-1");
    });
  });

  describe("Game interface with seasonId and fieldAllocationId", () => {
    it("should allow game with season and allocation references", () => {
      const game: Game = {
        id: "game-1",
        seasonId: "season-1",
        homeTeamId: "team-1",
        awayTeamId: "team-2",
        fieldId: "field-1",
        fieldPortion: "full",
        dateId: "date-1",
        timeSlotId: "slot-1",
        fieldAllocationId: "alloc-1",
        status: "scheduled",
      };
      expect(game.seasonId).toBe("season-1");
      expect(game.fieldAllocationId).toBe("alloc-1");
    });
  });

  describe("WeeklySchedule interface with seasonId", () => {
    it("should allow weekly schedule with seasonId", () => {
      const schedule: WeeklySchedule = {
        id: "ws-1",
        seasonId: "season-1",
        weekStartDate: "2026-03-09",
        weekEndDate: "2026-03-15",
        games: [],
        isPublished: true,
        createdAt: "2026-03-08T10:00:00Z",
        updatedAt: "2026-03-08T10:00:00Z",
      };
      expect(schedule.seasonId).toBe("season-1");
    });
  });

  describe("AISchedulingConfig interface", () => {
    it("should allow valid AI config with Azure OpenAI", () => {
      const config: AISchedulingConfig = {
        enabled: true,
        provider: "azure-openai",
        endpoint: "https://my-resource.openai.azure.com",
        model: "gpt-4",
      };
      expect(config.enabled).toBe(true);
      expect(config.provider).toBe("azure-openai");
    });

    it("should allow AI config without optional fields", () => {
      const config: AISchedulingConfig = {
        enabled: false,
        provider: "azure-openai",
      };
      expect(config.endpoint).toBeUndefined();
      expect(config.model).toBeUndefined();
    });
  });

  describe("SchedulingConstraints interface", () => {
    it("should allow valid scheduling constraints", () => {
      const constraints: SchedulingConstraints = {
        avoidBackToBack: true,
        balanceHomeAway: true,
        prioritizeAgeGroups: true,
        separateSameOrgTeams: true,
        maxGamesPerTeam: 3,
        customConstraints: ["No games before 10am", "Prefer morning games for U8"],
      };
      expect(constraints.maxGamesPerTeam).toBe(3);
      expect(constraints.customConstraints).toHaveLength(2);
    });

    it("should allow constraints without optional fields", () => {
      const constraints: SchedulingConstraints = {
        avoidBackToBack: false,
        balanceHomeAway: false,
        prioritizeAgeGroups: true,
        separateSameOrgTeams: false,
      };
      expect(constraints.maxGamesPerTeam).toBeUndefined();
    });
  });

  describe("AISchedulingRequest interface", () => {
    it("should allow valid AI scheduling request", () => {
      const request: AISchedulingRequest = {
        seasonId: "season-1",
        date: "2026-03-14",
        fieldAllocationId: "alloc-1",
        teams: [
          { id: "t1", name: "Team 1", ageGroup: "U10", coaches: [] },
          { id: "t2", name: "Team 2", ageGroup: "U10", coaches: [] },
        ],
        fields: [
          { id: "f1", name: "Field A", canSplit: false, maxSplits: 1 },
        ],
        timeSlots: [
          { id: "ts1", startTime: "09:00", endTime: "10:00" },
        ],
        constraints: {
          avoidBackToBack: true,
          balanceHomeAway: true,
          prioritizeAgeGroups: true,
          separateSameOrgTeams: false,
        },
        existingGames: [],
      };
      expect(request.teams).toHaveLength(2);
      expect(request.fields).toHaveLength(1);
    });
  });

  describe("AISchedulingResponse interface", () => {
    it("should allow successful AI response", () => {
      const response: AISchedulingResponse = {
        success: true,
        games: [
          {
            homeTeamId: "t1",
            awayTeamId: "t2",
            fieldId: "f1",
            fieldPortion: "full",
            dateId: "d1",
            timeSlotId: "ts1",
            status: "scheduled",
          },
        ],
        reasoning: "Optimal schedule based on age groups",
        warnings: [],
      };
      expect(response.success).toBe(true);
      expect(response.games).toHaveLength(1);
    });

    it("should allow failed AI response with error", () => {
      const response: AISchedulingResponse = {
        success: false,
        games: [],
        error: "Not enough fields for all teams",
      };
      expect(response.success).toBe(false);
      expect(response.error).toBeDefined();
    });
  });

  describe("DayScheduleOptions interface", () => {
    it("should allow valid day schedule options", () => {
      const options: DayScheduleOptions = {
        seasonId: "season-1",
        date: "2026-03-14",
        fieldAllocationId: "alloc-1",
        teams: [],
        fields: [],
        timeSlots: [],
        existingGames: [],
        constraints: {
          avoidBackToBack: true,
          balanceHomeAway: true,
          prioritizeAgeGroups: true,
          separateSameOrgTeams: false,
        },
      };
      expect(options.seasonId).toBe("season-1");
      expect(options.fieldAllocationId).toBe("alloc-1");
    });
  });

  describe("ValidationResult interface", () => {
    it("should allow valid validation result", () => {
      const result: ValidationResult = {
        valid: true,
        errors: [],
        warnings: ["Consider adding more time slots"],
      };
      expect(result.valid).toBe(true);
      expect(result.warnings).toHaveLength(1);
    });

    it("should allow validation result with errors", () => {
      const result: ValidationResult = {
        valid: false,
        errors: ["Not enough fields", "Teams list is empty"],
        warnings: [],
      };
      expect(result.valid).toBe(false);
      expect(result.errors).toHaveLength(2);
    });
  });

  describe("FieldAllocationValidation interface", () => {
    it("should allow field allocation validation result", () => {
      const result: FieldAllocationValidation = {
        valid: true,
        errors: [],
        warnings: [],
        teamsCount: 8,
        fieldsCount: 3,
        slotsCount: 5,
        estimatedGamesCapacity: 15,
      };
      expect(result.teamsCount).toBe(8);
      expect(result.estimatedGamesCapacity).toBe(15);
    });
  });
});
