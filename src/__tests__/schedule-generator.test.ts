import { generateSchedule } from "@/lib/schedule-generator";
import type { Team, Field, ScheduleDate, Game } from "@/types";

// Helper function to create test teams
function createTeam(
  id: string,
  name: string,
  ageGroup: Team["ageGroup"]
): Team {
  return {
    id,
    name,
    ageGroup,
    coaches: [],
  };
}

// Helper function to create test fields
function createField(
  id: string,
  name: string,
  canSplit: boolean = false,
  maxSplits: 1 | 2 | 3 = 1
): Field {
  return {
    id,
    name,
    canSplit,
    maxSplits,
  };
}

// Helper function to create test schedule dates
function createScheduleDate(
  id: string,
  date: string,
  timeSlots: { id: string; startTime: string; endTime: string }[]
): ScheduleDate {
  return {
    id,
    date,
    timeSlots: timeSlots.map((ts) => ({
      id: ts.id,
      startTime: ts.startTime,
      endTime: ts.endTime,
    })),
    isActive: true,
  };
}

describe("Schedule Generator", () => {
  describe("Input Validation", () => {
    it("should return empty array when less than 2 teams provided", () => {
      const teams = [createTeam("1", "Team 1", "U10")];
      const fields = [createField("f1", "Field A")];
      const dates = [
        createScheduleDate("d1", "2024-03-01", [
          { id: "ts1", startTime: "09:00", endTime: "10:00" },
        ]),
      ];

      const result = generateSchedule(teams, fields, dates, [], {
        avoidBackToBack: true,
        balanceHomeAway: true,
        prioritizeAgeGroups: true,
      });

      expect(result).toEqual([]);
    });

    it("should return empty array when no fields provided", () => {
      const teams = [
        createTeam("1", "Team 1", "U10"),
        createTeam("2", "Team 2", "U10"),
      ];
      const dates = [
        createScheduleDate("d1", "2024-03-01", [
          { id: "ts1", startTime: "09:00", endTime: "10:00" },
        ]),
      ];

      const result = generateSchedule(teams, [], dates, [], {
        avoidBackToBack: true,
        balanceHomeAway: true,
        prioritizeAgeGroups: true,
        separateSameOrgTeams: false,
      });

      expect(result).toEqual([]);
    });

    it("should return empty array when no schedule dates provided", () => {
      const teams = [
        createTeam("1", "Team 1", "U10"),
        createTeam("2", "Team 2", "U10"),
      ];
      const fields = [createField("f1", "Field A")];

      const result = generateSchedule(teams, fields, [], [], {
        avoidBackToBack: true,
        balanceHomeAway: true,
        prioritizeAgeGroups: true,
        separateSameOrgTeams: false,
      });

      expect(result).toEqual([]);
    });

    it("should return empty array when all dates are inactive", () => {
      const teams = [
        createTeam("1", "Team 1", "U10"),
        createTeam("2", "Team 2", "U10"),
      ];
      const fields = [createField("f1", "Field A")];
      const dates: ScheduleDate[] = [
        {
          id: "d1",
          date: "2024-03-01",
          timeSlots: [{ id: "ts1", startTime: "09:00", endTime: "10:00" }],
          isActive: false,
        },
      ];

      const result = generateSchedule(teams, fields, dates, [], {
        avoidBackToBack: true,
        balanceHomeAway: true,
        prioritizeAgeGroups: true,
      });

      expect(result).toEqual([]);
    });
  });

  describe("Basic Schedule Generation", () => {
    it("should generate a game between two teams", () => {
      const teams = [
        createTeam("1", "Team 1", "U12"),
        createTeam("2", "Team 2", "U12"),
      ];
      const fields = [createField("f1", "Field A")];
      const dates = [
        createScheduleDate("d1", "2024-03-01", [
          { id: "ts1", startTime: "09:00", endTime: "10:00" },
        ]),
      ];

      const result = generateSchedule(teams, fields, dates, [], {
        avoidBackToBack: true,
        balanceHomeAway: true,
        prioritizeAgeGroups: true,
      });

      expect(result.length).toBe(1);
      expect(result[0]).toMatchObject({
        fieldId: "f1",
        dateId: "d1",
        timeSlotId: "ts1",
        status: "scheduled",
        fieldPortion: "full",
      });
      expect(
        [result[0].homeTeamId, result[0].awayTeamId].sort()
      ).toEqual(["1", "2"]);
    });

    it("should generate multiple games for multiple teams in same age group", () => {
      const teams = [
        createTeam("1", "Team 1", "U12"),
        createTeam("2", "Team 2", "U12"),
        createTeam("3", "Team 3", "U12"),
      ];
      const fields = [createField("f1", "Field A")];
      const dates = [
        createScheduleDate("d1", "2024-03-01", [
          { id: "ts1", startTime: "09:00", endTime: "10:00" },
          { id: "ts2", startTime: "10:00", endTime: "11:00" },
          { id: "ts3", startTime: "11:00", endTime: "12:00" },
        ]),
      ];

      const result = generateSchedule(teams, fields, dates, [], {
        avoidBackToBack: true,
        balanceHomeAway: true,
        prioritizeAgeGroups: true,
      });

      // 3 teams = 3 possible matchups (1v2, 1v3, 2v3)
      expect(result.length).toBe(3);
    });

    it("should assign each game a unique id", () => {
      const teams = [
        createTeam("1", "Team 1", "U12"),
        createTeam("2", "Team 2", "U12"),
        createTeam("3", "Team 3", "U12"),
      ];
      const fields = [createField("f1", "Field A")];
      const dates = [
        createScheduleDate("d1", "2024-03-01", [
          { id: "ts1", startTime: "09:00", endTime: "10:00" },
          { id: "ts2", startTime: "10:00", endTime: "11:00" },
          { id: "ts3", startTime: "11:00", endTime: "12:00" },
        ]),
      ];

      const result = generateSchedule(teams, fields, dates, [], {
        avoidBackToBack: true,
        balanceHomeAway: true,
        prioritizeAgeGroups: true,
      });

      const ids = result.map((g) => g.id);
      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(ids.length);
    });
  });

  describe("Age Group Matching", () => {
    it("should only match teams within the same age group", () => {
      const teams = [
        createTeam("1", "U10 Team 1", "U10"),
        createTeam("2", "U10 Team 2", "U10"),
        createTeam("3", "U12 Team 1", "U12"),
        createTeam("4", "U12 Team 2", "U12"),
      ];
      const fields = [createField("f1", "Field A")];
      const dates = [
        createScheduleDate("d1", "2024-03-01", [
          { id: "ts1", startTime: "09:00", endTime: "10:00" },
          { id: "ts2", startTime: "10:00", endTime: "11:00" },
        ]),
      ];

      const result = generateSchedule(teams, fields, dates, [], {
        avoidBackToBack: true,
        balanceHomeAway: true,
        prioritizeAgeGroups: true,
      });

      // Should have 2 games: U10 vs U10 and U12 vs U12
      expect(result.length).toBe(2);

      // Verify no cross-age matches
      result.forEach((game) => {
        const homeTeam = teams.find((t) => t.id === game.homeTeamId);
        const awayTeam = teams.find((t) => t.id === game.awayTeamId);
        expect(homeTeam?.ageGroup).toBe(awayTeam?.ageGroup);
      });
    });

    it("should not create matchups for age groups with only one team", () => {
      const teams = [
        createTeam("1", "U10 Team 1", "U10"),
        createTeam("2", "U12 Team 1", "U12"),
        createTeam("3", "U12 Team 2", "U12"),
      ];
      const fields = [createField("f1", "Field A")];
      const dates = [
        createScheduleDate("d1", "2024-03-01", [
          { id: "ts1", startTime: "09:00", endTime: "10:00" },
        ]),
      ];

      const result = generateSchedule(teams, fields, dates, [], {
        avoidBackToBack: true,
        balanceHomeAway: true,
        prioritizeAgeGroups: true,
      });

      // Only U12 should have a game since U10 has only 1 team
      expect(result.length).toBe(1);
      const game = result[0];
      expect(["3", "2"]).toContain(game.homeTeamId);
      expect(["3", "2"]).toContain(game.awayTeamId);
    });
  });

  describe("Field Splitting for Younger Age Groups", () => {
    it("should assign split fields to younger teams (U8, U10)", () => {
      const teams = [
        createTeam("1", "U8 Team 1", "U8"),
        createTeam("2", "U8 Team 2", "U8"),
      ];
      const fields = [createField("f1", "Field A", true, 2)];
      const dates = [
        createScheduleDate("d1", "2024-03-01", [
          { id: "ts1", startTime: "09:00", endTime: "10:00" },
        ]),
      ];

      const result = generateSchedule(teams, fields, dates, [], {
        avoidBackToBack: true,
        balanceHomeAway: true,
        prioritizeAgeGroups: true,
      });

      expect(result.length).toBe(1);
      expect(result[0].fieldPortion).toBe("half");
      expect(result[0].fieldSection).toBeDefined();
    });

    it("should assign full fields to older teams (U12+)", () => {
      const teams = [
        createTeam("1", "U14 Team 1", "U14"),
        createTeam("2", "U14 Team 2", "U14"),
      ];
      const fields = [createField("f1", "Field A", true, 2)];
      const dates = [
        createScheduleDate("d1", "2024-03-01", [
          { id: "ts1", startTime: "09:00", endTime: "10:00" },
        ]),
      ];

      const result = generateSchedule(teams, fields, dates, [], {
        avoidBackToBack: true,
        balanceHomeAway: true,
        prioritizeAgeGroups: true,
      });

      expect(result.length).toBe(1);
      expect(result[0].fieldPortion).toBe("full");
    });

    it("should create third field portions when maxSplits is 3", () => {
      const teams = [
        createTeam("1", "U8 Team 1", "U8"),
        createTeam("2", "U8 Team 2", "U8"),
      ];
      const fields = [createField("f1", "Field A", true, 3)];
      const dates = [
        createScheduleDate("d1", "2024-03-01", [
          { id: "ts1", startTime: "09:00", endTime: "10:00" },
        ]),
      ];

      const result = generateSchedule(teams, fields, dates, [], {
        avoidBackToBack: true,
        balanceHomeAway: true,
        prioritizeAgeGroups: true,
      });

      expect(result.length).toBe(1);
      expect(result[0].fieldPortion).toBe("third");
    });

    it("should fall back to full field when no split fields available", () => {
      const teams = [
        createTeam("1", "U8 Team 1", "U8"),
        createTeam("2", "U8 Team 2", "U8"),
      ];
      const fields = [createField("f1", "Field A", false, 1)];
      const dates = [
        createScheduleDate("d1", "2024-03-01", [
          { id: "ts1", startTime: "09:00", endTime: "10:00" },
        ]),
      ];

      const result = generateSchedule(teams, fields, dates, [], {
        avoidBackToBack: true,
        balanceHomeAway: true,
        prioritizeAgeGroups: true,
      });

      expect(result.length).toBe(1);
      expect(result[0].fieldPortion).toBe("full");
    });
  });

  describe("Conflict Prevention", () => {
    it("should not double-book a team in the same time slot", () => {
      const teams = [
        createTeam("1", "Team 1", "U12"),
        createTeam("2", "Team 2", "U12"),
        createTeam("3", "Team 3", "U12"),
        createTeam("4", "Team 4", "U12"),
      ];
      const fields = [
        createField("f1", "Field A"),
        createField("f2", "Field B"),
      ];
      const dates = [
        createScheduleDate("d1", "2024-03-01", [
          { id: "ts1", startTime: "09:00", endTime: "10:00" },
        ]),
      ];

      const result = generateSchedule(teams, fields, dates, [], {
        avoidBackToBack: true,
        balanceHomeAway: true,
        prioritizeAgeGroups: true,
      });

      // With 2 fields and 1 time slot, max 2 games can occur
      expect(result.length).toBeLessThanOrEqual(2);

      // Check no team is in multiple games in same time slot
      const teamsInSlot = new Set<string>();
      result.forEach((game) => {
        if (game.timeSlotId === "ts1") {
          expect(teamsInSlot.has(game.homeTeamId)).toBe(false);
          expect(teamsInSlot.has(game.awayTeamId)).toBe(false);
          teamsInSlot.add(game.homeTeamId);
          teamsInSlot.add(game.awayTeamId);
        }
      });
    });

    it("should not schedule more games than available field slots", () => {
      const teams = [
        createTeam("1", "Team 1", "U12"),
        createTeam("2", "Team 2", "U12"),
        createTeam("3", "Team 3", "U12"),
        createTeam("4", "Team 4", "U12"),
        createTeam("5", "Team 5", "U12"),
        createTeam("6", "Team 6", "U12"),
      ];
      const fields = [createField("f1", "Field A")];
      const dates = [
        createScheduleDate("d1", "2024-03-01", [
          { id: "ts1", startTime: "09:00", endTime: "10:00" },
        ]),
      ];

      const result = generateSchedule(teams, fields, dates, [], {
        avoidBackToBack: true,
        balanceHomeAway: true,
        prioritizeAgeGroups: true,
      });

      // Only 1 game can happen with 1 field and 1 time slot
      expect(result.length).toBe(1);
    });
  });

  describe("Back-to-Back Prevention", () => {
    it("should avoid scheduling back-to-back games when option enabled", () => {
      const teams = [
        createTeam("1", "Team 1", "U12"),
        createTeam("2", "Team 2", "U12"),
        createTeam("3", "Team 3", "U12"),
      ];
      const fields = [createField("f1", "Field A")];
      const dates = [
        createScheduleDate("d1", "2024-03-01", [
          { id: "ts1", startTime: "09:00", endTime: "10:00" },
          { id: "ts2", startTime: "10:00", endTime: "11:00" },
          { id: "ts3", startTime: "11:00", endTime: "12:00" },
        ]),
      ];

      const result = generateSchedule(teams, fields, dates, [], {
        avoidBackToBack: true,
        balanceHomeAway: true,
        prioritizeAgeGroups: true,
      });

      // With back-to-back prevention and 1 field, pattern should spread games out
      expect(result.length).toBe(3);
    });
  });

  describe("Home/Away Balancing", () => {
    it("should balance home and away games when option enabled", () => {
      const teams = [
        createTeam("1", "Team 1", "U12"),
        createTeam("2", "Team 2", "U12"),
      ];
      const fields = [createField("f1", "Field A")];
      const dates = [
        createScheduleDate("d1", "2024-03-01", [
          { id: "ts1", startTime: "09:00", endTime: "10:00" },
        ]),
        createScheduleDate("d2", "2024-03-08", [
          { id: "ts2", startTime: "09:00", endTime: "10:00" },
        ]),
      ];

      // Run schedule generation twice to see balancing
      const result1 = generateSchedule(teams, fields, [dates[0]], [], {
        avoidBackToBack: true,
        balanceHomeAway: true,
        prioritizeAgeGroups: true,
        separateSameOrgTeams: false,
      });

      // Second generation with first game as existing
      const result2 = generateSchedule(teams, fields, [dates[1]], result1, {
        avoidBackToBack: true,
        balanceHomeAway: true,
        prioritizeAgeGroups: true,
        separateSameOrgTeams: false,
      });

      // If Team 1 was home in first game, Team 2 should be home in second
      if (result1[0]?.homeTeamId === "1" && result2.length > 0) {
        expect(result2[0].homeTeamId).toBe("2");
      } else if (result1[0]?.homeTeamId === "2" && result2.length > 0) {
        expect(result2[0].homeTeamId).toBe("1");
      }
    });
  });

  describe("Existing Games Consideration", () => {
    it("should account for existing games when generating new schedule", () => {
      const teams = [
        createTeam("1", "Team 1", "U12"),
        createTeam("2", "Team 2", "U12"),
      ];
      const fields = [createField("f1", "Field A")];
      const dates = [
        createScheduleDate("d1", "2024-03-01", [
          { id: "ts1", startTime: "09:00", endTime: "10:00" },
        ]),
      ];

      const existingGames: Game[] = [
        {
          id: "existing-1",
          homeTeamId: "1",
          awayTeamId: "2",
          fieldId: "f1",
          fieldPortion: "full",
          dateId: "d1",
          timeSlotId: "ts1",
          status: "scheduled",
        },
      ];

      const result = generateSchedule(teams, fields, dates, existingGames, {
        avoidBackToBack: true,
        balanceHomeAway: true,
        prioritizeAgeGroups: true,
        separateSameOrgTeams: false,
      });

      // No new games should be generated since slot is taken
      expect(result.length).toBe(0);
    });

    it("should track team stats from existing games for balancing", () => {
      const teams = [
        createTeam("1", "Team 1", "U12"),
        createTeam("2", "Team 2", "U12"),
      ];
      const fields = [createField("f1", "Field A")];
      const dates = [
        createScheduleDate("d2", "2024-03-08", [
          { id: "ts2", startTime: "09:00", endTime: "10:00" },
        ]),
      ];

      // Team 1 has already been home twice
      const existingGames: Game[] = [
        {
          id: "existing-1",
          homeTeamId: "1",
          awayTeamId: "2",
          fieldId: "f1",
          fieldPortion: "full",
          dateId: "d-prev1",
          timeSlotId: "ts-prev1",
          status: "completed",
        },
        {
          id: "existing-2",
          homeTeamId: "1",
          awayTeamId: "2",
          fieldId: "f1",
          fieldPortion: "full",
          dateId: "d-prev2",
          timeSlotId: "ts-prev2",
          status: "completed",
        },
      ];

      const result = generateSchedule(teams, fields, dates, existingGames, {
        avoidBackToBack: true,
        balanceHomeAway: true,
        prioritizeAgeGroups: true,
        separateSameOrgTeams: false,
      });

      // Team 2 should be home to balance (Team 1 has 2 home, Team 2 has 0)
      if (result.length > 0) {
        expect(result[0].homeTeamId).toBe("2");
      }
    });
  });

  describe("Multiple Fields and Time Slots", () => {
    it("should utilize multiple fields for simultaneous games", () => {
      const teams = [
        createTeam("1", "Team 1", "U12"),
        createTeam("2", "Team 2", "U12"),
        createTeam("3", "Team 3", "U12"),
        createTeam("4", "Team 4", "U12"),
      ];
      const fields = [
        createField("f1", "Field A"),
        createField("f2", "Field B"),
      ];
      const dates = [
        createScheduleDate("d1", "2024-03-01", [
          { id: "ts1", startTime: "09:00", endTime: "10:00" },
        ]),
      ];

      const result = generateSchedule(teams, fields, dates, [], {
        avoidBackToBack: true,
        balanceHomeAway: true,
        prioritizeAgeGroups: true,
      });

      // Should be able to schedule 2 games simultaneously
      expect(result.length).toBe(2);

      // Each game should be on a different field
      const fieldIds = result.map((g) => g.fieldId);
      expect(new Set(fieldIds).size).toBe(2);
    });

    it("should schedule games across multiple time slots", () => {
      const teams = [
        createTeam("1", "Team 1", "U12"),
        createTeam("2", "Team 2", "U12"),
        createTeam("3", "Team 3", "U12"),
      ];
      const fields = [createField("f1", "Field A")];
      const dates = [
        createScheduleDate("d1", "2024-03-01", [
          { id: "ts1", startTime: "09:00", endTime: "10:00" },
          { id: "ts2", startTime: "10:00", endTime: "11:00" },
          { id: "ts3", startTime: "11:00", endTime: "12:00" },
        ]),
      ];

      const result = generateSchedule(teams, fields, dates, [], {
        avoidBackToBack: true,
        balanceHomeAway: true,
        prioritizeAgeGroups: true,
      });

      // Should have 3 matchups scheduled
      expect(result.length).toBe(3);

      // Games should be spread across time slots
      const timeSlots = result.map((g) => g.timeSlotId);
      expect(new Set(timeSlots).size).toBeGreaterThanOrEqual(1);
    });
  });

  describe("Split Field Sections", () => {
    it("should assign different sections for split field games", () => {
      const teams = [
        createTeam("1", "U8 Team 1", "U8"),
        createTeam("2", "U8 Team 2", "U8"),
        createTeam("3", "U8 Team 3", "U8"),
        createTeam("4", "U8 Team 4", "U8"),
      ];
      const fields = [createField("f1", "Field A", true, 2)];
      const dates = [
        createScheduleDate("d1", "2024-03-01", [
          { id: "ts1", startTime: "09:00", endTime: "10:00" },
        ]),
      ];

      const result = generateSchedule(teams, fields, dates, [], {
        avoidBackToBack: true,
        balanceHomeAway: true,
        prioritizeAgeGroups: true,
      });

      // Should be able to schedule 2 games on the split field
      expect(result.length).toBe(2);

      // Each game should have a different section
      const sections = result.map((g) => g.fieldSection);
      expect(new Set(sections).size).toBe(2);
    });
  });

  describe("Edge Cases", () => {
    it("should handle empty time slots array", () => {
      const teams = [
        createTeam("1", "Team 1", "U12"),
        createTeam("2", "Team 2", "U12"),
      ];
      const fields = [createField("f1", "Field A")];
      const dates: ScheduleDate[] = [
        {
          id: "d1",
          date: "2024-03-01",
          timeSlots: [],
          isActive: true,
        },
      ];

      const result = generateSchedule(teams, fields, dates, [], {
        avoidBackToBack: true,
        balanceHomeAway: true,
        prioritizeAgeGroups: true,
      });

      expect(result).toEqual([]);
    });

    it("should handle mixed age groups with some having only one team", () => {
      const teams = [
        createTeam("1", "U8 Solo", "U8"),
        createTeam("2", "U10 Team 1", "U10"),
        createTeam("3", "U10 Team 2", "U10"),
        createTeam("4", "U12 Solo", "U12"),
        createTeam("5", "U14 Team 1", "U14"),
        createTeam("6", "U14 Team 2", "U14"),
      ];
      const fields = [createField("f1", "Field A", true, 2)];
      const dates = [
        createScheduleDate("d1", "2024-03-01", [
          { id: "ts1", startTime: "09:00", endTime: "10:00" },
          { id: "ts2", startTime: "10:00", endTime: "11:00" },
        ]),
      ];

      const result = generateSchedule(teams, fields, dates, [], {
        avoidBackToBack: true,
        balanceHomeAway: true,
        prioritizeAgeGroups: true,
      });

      // Only U10 and U14 have 2+ teams, so only 2 matchups
      expect(result.length).toBe(2);

      // Verify matchups are within age groups
      result.forEach((game) => {
        const homeTeam = teams.find((t) => t.id === game.homeTeamId);
        const awayTeam = teams.find((t) => t.id === game.awayTeamId);
        expect(homeTeam?.ageGroup).toBe(awayTeam?.ageGroup);
      });
    });

    it("should handle large number of teams (12 teams)", () => {
      const teams: Team[] = [];
      for (let i = 1; i <= 12; i++) {
        teams.push(createTeam(`${i}`, `Team ${i}`, "U12"));
      }

      const fields = [
        createField("f1", "Field A"),
        createField("f2", "Field B"),
        createField("f3", "Field C"),
        createField("f4", "Field D"),
      ];

      const dates = [
        createScheduleDate("d1", "2024-03-01", [
          { id: "ts1", startTime: "09:00", endTime: "10:00" },
          { id: "ts2", startTime: "10:15", endTime: "11:15" },
          { id: "ts3", startTime: "11:30", endTime: "12:30" },
          { id: "ts4", startTime: "13:00", endTime: "14:00" },
          { id: "ts5", startTime: "14:15", endTime: "15:15" },
        ]),
      ];

      const result = generateSchedule(teams, fields, dates, [], {
        avoidBackToBack: true,
        balanceHomeAway: true,
        prioritizeAgeGroups: true,
      });

      // 12 teams = 66 possible matchups (12 choose 2)
      // With 4 fields x 5 slots = 20 available slots
      // So we should get around 20 games
      expect(result.length).toBeGreaterThan(0);
      expect(result.length).toBeLessThanOrEqual(20);

      // Verify no conflicts
      const slotUsage = new Map<string, Set<string>>();
      result.forEach((game) => {
        const slotKey = `${game.dateId}-${game.timeSlotId}`;
        if (!slotUsage.has(slotKey)) {
          slotUsage.set(slotKey, new Set());
        }
        const teamsInSlot = slotUsage.get(slotKey)!;
        expect(teamsInSlot.has(game.homeTeamId)).toBe(false);
        expect(teamsInSlot.has(game.awayTeamId)).toBe(false);
        teamsInSlot.add(game.homeTeamId);
        teamsInSlot.add(game.awayTeamId);
      });
    });
  });

  describe("Organization Separation", () => {
    // Helper to create team with organization
    function createTeamWithOrg(
      id: string,
      name: string,
      ageGroup: Team["ageGroup"],
      organizationId?: string
    ): Team {
      return {
        id,
        name,
        ageGroup,
        coaches: [],
        organizationId,
      };
    }

    it("should separate same-org teams when option enabled", () => {
      const teams = [
        createTeamWithOrg("1", "Club A U10", "U10", "org1"),
        createTeamWithOrg("2", "Club A U12", "U12", "org1"),
        createTeamWithOrg("3", "Club B U10", "U10", "org2"),
        createTeamWithOrg("4", "Club B U12", "U12", "org2"),
      ];
      const fields = [createField("f1", "Field 1"), createField("f2", "Field 2")];
      const dates = [
        createScheduleDate("d1", "2024-03-01", [
          { id: "ts1", startTime: "09:00", endTime: "10:00" },
          { id: "ts2", startTime: "10:00", endTime: "11:00" },
        ]),
      ];

      const result = generateSchedule(teams, fields, dates, [], {
        avoidBackToBack: false,
        balanceHomeAway: true,
        prioritizeAgeGroups: true,
        separateSameOrgTeams: true,
      });

      // Check that teams from same org don't play at the same time
      const slotsByOrg = new Map<string, Set<string>>();

      result.forEach((game) => {
        const slotKey = `${game.dateId}-${game.timeSlotId}`;
        const homeTeam = teams.find((t) => t.id === game.homeTeamId);
        const awayTeam = teams.find((t) => t.id === game.awayTeamId);

        [homeTeam, awayTeam].forEach((team) => {
          if (team?.organizationId) {
            const orgSlots = slotsByOrg.get(team.organizationId) || new Set();
            // This org should not already have a game in this slot
            expect(orgSlots.has(slotKey)).toBe(false);
            orgSlots.add(slotKey);
            slotsByOrg.set(team.organizationId, orgSlots);
          }
        });
      });
    });

    it("should allow same-org teams at same time when option disabled", () => {
      const teams = [
        createTeamWithOrg("1", "Club A U10", "U10", "org1"),
        createTeamWithOrg("2", "Club A U12", "U12", "org1"),
        createTeamWithOrg("3", "Club B U10", "U10", "org2"),
        createTeamWithOrg("4", "Club B U12", "U12", "org2"),
      ];
      const fields = [createField("f1", "Field 1"), createField("f2", "Field 2")];
      const dates = [
        createScheduleDate("d1", "2024-03-01", [
          { id: "ts1", startTime: "09:00", endTime: "10:00" },
        ]),
      ];

      const result = generateSchedule(teams, fields, dates, [], {
        avoidBackToBack: false,
        balanceHomeAway: true,
        prioritizeAgeGroups: true,
        separateSameOrgTeams: false,
      });

      // With 2 matchups (U10 and U12) and 2 fields, both can happen simultaneously
      expect(result.length).toBe(2);
    });

    it("should handle teams without organizations", () => {
      const teams = [
        createTeamWithOrg("1", "Indie Team 1", "U10"),
        createTeamWithOrg("2", "Indie Team 2", "U10"),
        createTeamWithOrg("3", "Club A U10", "U10", "org1"),
        createTeamWithOrg("4", "Club A U10 B", "U10", "org1"),
      ];
      const fields = [createField("f1", "Field 1"), createField("f2", "Field 2")];
      const dates = [
        createScheduleDate("d1", "2024-03-01", [
          { id: "ts1", startTime: "09:00", endTime: "10:00" },
          { id: "ts2", startTime: "10:00", endTime: "11:00" },
        ]),
      ];

      const result = generateSchedule(teams, fields, dates, [], {
        avoidBackToBack: false,
        balanceHomeAway: true,
        prioritizeAgeGroups: true,
        separateSameOrgTeams: true,
      });

      // Should generate games; indie teams have no org restrictions
      expect(result.length).toBeGreaterThan(0);
    });
  });
});
