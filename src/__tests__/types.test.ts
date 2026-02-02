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
      };
      expect(settings.seasonName).toBe("Spring 2024");
      expect(settings.defaultGameDuration).toBe(60);
    });
  });
});
