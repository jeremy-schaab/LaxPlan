import { AIScheduler, getAIScheduler, resetAIScheduler } from "@/lib/ai-scheduler";
import type { AISchedulingRequest, Team, Field, TimeSlot, SchedulingConstraints } from "@/types";

// Store original env values
const originalEnv = process.env;

// Mock fetch globally
const mockFetch = jest.fn();
global.fetch = mockFetch;

beforeEach(() => {
  // Reset environment for each test
  jest.resetModules();
  process.env = { ...originalEnv };
  resetAIScheduler();
  mockFetch.mockReset();
});

afterAll(() => {
  process.env = originalEnv;
});

describe("AIScheduler", () => {
  describe("Configuration", () => {
    it("should detect when AI is disabled (no config)", () => {
      // No env vars set
      delete process.env.AZURE_OPENAI_ENDPOINT;
      delete process.env.AZURE_OPENAI_API_KEY;

      const scheduler = new AIScheduler();
      expect(scheduler.isEnabled()).toBe(false);
    });

    it("should detect when AI is enabled (config present)", () => {
      process.env.AZURE_OPENAI_ENDPOINT = "https://test.openai.azure.com";
      process.env.AZURE_OPENAI_API_KEY = "test-key";
      process.env.AZURE_OPENAI_DEPLOYMENT = "gpt-4";

      const scheduler = new AIScheduler();
      expect(scheduler.isEnabled()).toBe(true);
    });

    it("should return config status correctly", () => {
      process.env.AZURE_OPENAI_ENDPOINT = "https://test.openai.azure.com/";
      process.env.AZURE_OPENAI_API_KEY = "test-key";
      process.env.AZURE_OPENAI_DEPLOYMENT = "gpt-4-turbo";

      const scheduler = new AIScheduler();
      const status = scheduler.getConfigStatus();

      expect(status.enabled).toBe(true);
      expect(status.endpoint).toBe("https://test.openai.azure.com");
      expect(status.deployment).toBe("gpt-4-turbo");
    });

    it("should use default deployment if not specified", () => {
      process.env.AZURE_OPENAI_ENDPOINT = "https://test.openai.azure.com";
      process.env.AZURE_OPENAI_API_KEY = "test-key";
      delete process.env.AZURE_OPENAI_DEPLOYMENT;

      const scheduler = new AIScheduler();
      const status = scheduler.getConfigStatus();

      expect(status.deployment).toBe("gpt-4");
    });
  });

  describe("Singleton", () => {
    it("should return same instance from getAIScheduler", () => {
      const instance1 = getAIScheduler();
      const instance2 = getAIScheduler();
      expect(instance1).toBe(instance2);
    });

    it("should create new instance after resetAIScheduler", () => {
      const instance1 = getAIScheduler();
      resetAIScheduler();
      const instance2 = getAIScheduler();
      expect(instance1).not.toBe(instance2);
    });
  });

  describe("generateSchedule", () => {
    const mockTeams: Team[] = [
      { id: "t1", name: "Team 1", ageGroup: "U10", coaches: [] },
      { id: "t2", name: "Team 2", ageGroup: "U10", coaches: [] },
      { id: "t3", name: "Team 3", ageGroup: "U10", coaches: [] },
      { id: "t4", name: "Team 4", ageGroup: "U10", coaches: [] },
    ];

    const mockFields: Field[] = [
      { id: "f1", name: "Field A", canSplit: false, maxSplits: 1 },
      { id: "f2", name: "Field B", canSplit: true, maxSplits: 2 },
    ];

    const mockTimeSlots: TimeSlot[] = [
      { id: "ts1", startTime: "09:00", endTime: "10:00" },
      { id: "ts2", startTime: "10:15", endTime: "11:15" },
    ];

    const mockConstraints: SchedulingConstraints = {
      avoidBackToBack: true,
      balanceHomeAway: true,
      prioritizeAgeGroups: true,
      separateSameOrgTeams: false,
    };

    const mockRequest: AISchedulingRequest = {
      seasonId: "season-1",
      date: "2026-03-14",
      fieldAllocationId: "alloc-1",
      teams: mockTeams,
      fields: mockFields,
      timeSlots: mockTimeSlots,
      constraints: mockConstraints,
    };

    it("should return error when not configured", async () => {
      delete process.env.AZURE_OPENAI_ENDPOINT;
      delete process.env.AZURE_OPENAI_API_KEY;

      const scheduler = new AIScheduler();
      const result = await scheduler.generateSchedule(mockRequest);

      expect(result.success).toBe(false);
      expect(result.error).toContain("not configured");
    });

    it("should call Azure OpenAI API with correct parameters", async () => {
      process.env.AZURE_OPENAI_ENDPOINT = "https://test.openai.azure.com";
      process.env.AZURE_OPENAI_API_KEY = "test-api-key";
      process.env.AZURE_OPENAI_DEPLOYMENT = "gpt-4";

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            choices: [
              {
                message: {
                  content: JSON.stringify({
                    games: [
                      {
                        homeTeamId: "t1",
                        awayTeamId: "t2",
                        fieldId: "f1",
                        fieldPortion: "full",
                        timeSlotId: "ts1",
                        status: "scheduled",
                      },
                    ],
                    reasoning: "Optimal schedule",
                    warnings: [],
                  }),
                },
              },
            ],
          }),
      });

      const scheduler = new AIScheduler();
      await scheduler.generateSchedule(mockRequest);

      expect(mockFetch).toHaveBeenCalledTimes(1);
      const [url, options] = mockFetch.mock.calls[0];

      expect(url).toContain("test.openai.azure.com");
      expect(url).toContain("gpt-4");
      expect(options.method).toBe("POST");
      expect(options.headers["api-key"]).toBe("test-api-key");
    });

    it("should parse valid AI response correctly", async () => {
      process.env.AZURE_OPENAI_ENDPOINT = "https://test.openai.azure.com";
      process.env.AZURE_OPENAI_API_KEY = "test-key";

      const mockAIResponse = {
        games: [
          {
            homeTeamId: "t1",
            awayTeamId: "t2",
            fieldId: "f1",
            fieldPortion: "full",
            timeSlotId: "ts1",
            status: "scheduled",
          },
          {
            homeTeamId: "t3",
            awayTeamId: "t4",
            fieldId: "f2",
            fieldPortion: "half",
            fieldSection: 1,
            timeSlotId: "ts1",
            status: "scheduled",
          },
        ],
        reasoning: "Optimized for field utilization",
        warnings: [],
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            choices: [{ message: { content: JSON.stringify(mockAIResponse) } }],
          }),
      });

      const scheduler = new AIScheduler();
      const result = await scheduler.generateSchedule(mockRequest);

      expect(result.success).toBe(true);
      expect(result.games).toHaveLength(2);
      expect(result.games[0].homeTeamId).toBe("t1");
      expect(result.games[0].seasonId).toBe("season-1");
      expect(result.games[1].fieldPortion).toBe("half");
      expect(result.reasoning).toBe("Optimized for field utilization");
    });

    it("should handle API errors gracefully", async () => {
      process.env.AZURE_OPENAI_ENDPOINT = "https://test.openai.azure.com";
      process.env.AZURE_OPENAI_API_KEY = "test-key";

      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        text: () => Promise.resolve("Unauthorized"),
      });

      const scheduler = new AIScheduler();
      const result = await scheduler.generateSchedule(mockRequest);

      expect(result.success).toBe(false);
      expect(result.error).toContain("Azure OpenAI API error");
    });

    it("should handle network errors gracefully", async () => {
      process.env.AZURE_OPENAI_ENDPOINT = "https://test.openai.azure.com";
      process.env.AZURE_OPENAI_API_KEY = "test-key";

      mockFetch.mockRejectedValueOnce(new Error("Network error"));

      const scheduler = new AIScheduler();
      const result = await scheduler.generateSchedule(mockRequest);

      expect(result.success).toBe(false);
      expect(result.error).toContain("Network error");
    });

    it("should validate team IDs in response", async () => {
      process.env.AZURE_OPENAI_ENDPOINT = "https://test.openai.azure.com";
      process.env.AZURE_OPENAI_API_KEY = "test-key";

      const invalidResponse = {
        games: [
          {
            homeTeamId: "invalid-team",
            awayTeamId: "t2",
            fieldId: "f1",
            fieldPortion: "full",
            timeSlotId: "ts1",
            status: "scheduled",
          },
          {
            homeTeamId: "t1",
            awayTeamId: "t2",
            fieldId: "f1",
            fieldPortion: "full",
            timeSlotId: "ts1",
            status: "scheduled",
          },
        ],
        reasoning: "Test",
        warnings: [],
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            choices: [{ message: { content: JSON.stringify(invalidResponse) } }],
          }),
      });

      const scheduler = new AIScheduler();
      const result = await scheduler.generateSchedule(mockRequest);

      expect(result.success).toBe(true);
      expect(result.games).toHaveLength(1);
      expect(result.warnings).toContain("Skipped game with invalid team ID");
    });

    it("should reject games where team plays itself", async () => {
      process.env.AZURE_OPENAI_ENDPOINT = "https://test.openai.azure.com";
      process.env.AZURE_OPENAI_API_KEY = "test-key";

      const selfPlayResponse = {
        games: [
          {
            homeTeamId: "t1",
            awayTeamId: "t1",
            fieldId: "f1",
            fieldPortion: "full",
            timeSlotId: "ts1",
            status: "scheduled",
          },
        ],
        reasoning: "Test",
        warnings: [],
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            choices: [{ message: { content: JSON.stringify(selfPlayResponse) } }],
          }),
      });

      const scheduler = new AIScheduler();
      const result = await scheduler.generateSchedule(mockRequest);

      expect(result.success).toBe(false);
      expect(result.games).toHaveLength(0);
      expect(result.warnings).toContain("Skipped game where team plays itself");
    });

    it("should handle malformed JSON response", async () => {
      process.env.AZURE_OPENAI_ENDPOINT = "https://test.openai.azure.com";
      process.env.AZURE_OPENAI_API_KEY = "test-key";

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            choices: [{ message: { content: "not valid json" } }],
          }),
      });

      const scheduler = new AIScheduler();
      const result = await scheduler.generateSchedule(mockRequest);

      expect(result.success).toBe(false);
      expect(result.error).toContain("Failed to parse AI response");
    });

    it("should handle missing games array in response", async () => {
      process.env.AZURE_OPENAI_ENDPOINT = "https://test.openai.azure.com";
      process.env.AZURE_OPENAI_API_KEY = "test-key";

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            choices: [{ message: { content: JSON.stringify({ reasoning: "oops" }) } }],
          }),
      });

      const scheduler = new AIScheduler();
      const result = await scheduler.generateSchedule(mockRequest);

      expect(result.success).toBe(false);
      expect(result.error).toContain("missing games array");
    });

    it("should set fieldAllocationId from request", async () => {
      process.env.AZURE_OPENAI_ENDPOINT = "https://test.openai.azure.com";
      process.env.AZURE_OPENAI_API_KEY = "test-key";

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            choices: [
              {
                message: {
                  content: JSON.stringify({
                    games: [
                      {
                        homeTeamId: "t1",
                        awayTeamId: "t2",
                        fieldId: "f1",
                        fieldPortion: "full",
                        timeSlotId: "ts1",
                        status: "scheduled",
                      },
                    ],
                    reasoning: "Test",
                  }),
                },
              },
            ],
          }),
      });

      const scheduler = new AIScheduler();
      const result = await scheduler.generateSchedule(mockRequest);

      expect(result.success).toBe(true);
      expect(result.games[0].fieldAllocationId).toBe("alloc-1");
    });
  });
});
