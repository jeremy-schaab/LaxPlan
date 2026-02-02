/**
 * @jest-environment node
 */

import { GET, POST } from "@/app/api/data/route";
import { NextRequest } from "next/server";
import { promises as fs } from "fs";
import path from "path";

// Mock fs module
jest.mock("fs", () => ({
  promises: {
    readFile: jest.fn(),
    writeFile: jest.fn(),
    access: jest.fn(),
    mkdir: jest.fn(),
  },
}));

const mockFs = fs as jest.Mocked<typeof fs>;

describe("API /api/data", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("GET", () => {
    it("should return stored data when file exists", async () => {
      const mockData = {
        teams: [{ id: "1", name: "Team 1", ageGroup: "U10", coaches: [] }],
        fields: [{ id: "f1", name: "Field A", canSplit: false, maxSplits: 1 }],
        scheduleDates: [],
        games: [],
        weeklySchedules: [],
        settings: {
          seasonName: "Test Season",
          seasonStartDate: "2024-01-01",
          seasonEndDate: "2024-12-31",
          defaultGameDuration: 60,
          avoidBackToBackGames: true,
          balanceHomeAway: true,
          minGamesBetweenTeams: 2,
        },
      };

      mockFs.access.mockResolvedValue(undefined);
      mockFs.readFile.mockResolvedValue(JSON.stringify(mockData));

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.teams).toHaveLength(1);
      expect(data.teams[0].name).toBe("Team 1");
      expect(data.settings.seasonName).toBe("Test Season");
    });

    it("should return default data when file does not exist", async () => {
      const error = new Error("ENOENT") as NodeJS.ErrnoException;
      error.code = "ENOENT";
      mockFs.access.mockResolvedValue(undefined);
      mockFs.readFile.mockRejectedValue(error);

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.teams).toEqual([]);
      expect(data.fields).toEqual([]);
      expect(data.settings).toBeDefined();
      expect(data.settings.seasonName).toBe("Spring 2024");
    });

    it("should return 500 on read error (non-ENOENT)", async () => {
      mockFs.access.mockResolvedValue(undefined);
      mockFs.readFile.mockRejectedValue(new Error("Permission denied"));

      const response = await GET();

      expect(response.status).toBe(500);
    });

    it("should create data directory if it does not exist", async () => {
      const accessError = new Error("ENOENT") as NodeJS.ErrnoException;
      accessError.code = "ENOENT";
      mockFs.access.mockRejectedValue(accessError);
      mockFs.mkdir.mockResolvedValue(undefined);

      const fileError = new Error("ENOENT") as NodeJS.ErrnoException;
      fileError.code = "ENOENT";
      mockFs.readFile.mockRejectedValue(fileError);

      await GET();

      expect(mockFs.mkdir).toHaveBeenCalledWith(
        expect.stringContaining("data"),
        { recursive: true }
      );
    });
  });

  describe("POST", () => {
    it("should save data to file", async () => {
      mockFs.access.mockResolvedValue(undefined);
      mockFs.writeFile.mockResolvedValue(undefined);

      const testData = {
        teams: [{ id: "1", name: "New Team", ageGroup: "U12", coaches: [] }],
        fields: [],
        scheduleDates: [],
        games: [],
        weeklySchedules: [],
        settings: {
          seasonName: "New Season",
          seasonStartDate: "2024-01-01",
          seasonEndDate: "2024-12-31",
          defaultGameDuration: 60,
          avoidBackToBackGames: true,
          balanceHomeAway: true,
          minGamesBetweenTeams: 2,
        },
      };

      const request = new NextRequest("http://localhost/api/data", {
        method: "POST",
        body: JSON.stringify(testData),
        headers: { "Content-Type": "application/json" },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(mockFs.writeFile).toHaveBeenCalledWith(
        expect.stringContaining("laxplan-data.json"),
        expect.any(String),
        "utf-8"
      );
    });

    it("should format JSON with indentation", async () => {
      mockFs.access.mockResolvedValue(undefined);
      mockFs.writeFile.mockResolvedValue(undefined);

      const testData = { teams: [], fields: [] };

      const request = new NextRequest("http://localhost/api/data", {
        method: "POST",
        body: JSON.stringify(testData),
        headers: { "Content-Type": "application/json" },
      });

      await POST(request);

      const writtenContent = mockFs.writeFile.mock.calls[0][1] as string;
      expect(writtenContent).toContain("\n"); // Formatted with newlines
    });

    it("should return 500 on write error", async () => {
      mockFs.access.mockResolvedValue(undefined);
      mockFs.writeFile.mockRejectedValue(new Error("Disk full"));

      const request = new NextRequest("http://localhost/api/data", {
        method: "POST",
        body: JSON.stringify({ teams: [] }),
        headers: { "Content-Type": "application/json" },
      });

      const response = await POST(request);

      expect(response.status).toBe(500);
    });

    it("should create data directory on POST if needed", async () => {
      const accessError = new Error("ENOENT") as NodeJS.ErrnoException;
      accessError.code = "ENOENT";
      mockFs.access.mockRejectedValue(accessError);
      mockFs.mkdir.mockResolvedValue(undefined);
      mockFs.writeFile.mockResolvedValue(undefined);

      const request = new NextRequest("http://localhost/api/data", {
        method: "POST",
        body: JSON.stringify({ teams: [] }),
        headers: { "Content-Type": "application/json" },
      });

      await POST(request);

      expect(mockFs.mkdir).toHaveBeenCalled();
    });
  });
});

describe("Data Integrity", () => {
  it("should preserve all data fields on round-trip", async () => {
    const originalData = {
      teams: [
        {
          id: "team-1",
          name: "Thunder",
          ageGroup: "U10",
          coaches: [
            { id: "coach-1", name: "John", email: "john@test.com", phone: "555-1234" },
          ],
          color: "#ff0000",
          notes: "Great team",
        },
      ],
      fields: [
        {
          id: "field-1",
          name: "Main Field",
          location: "Park",
          canSplit: true,
          maxSplits: 2,
          notes: "North side",
        },
      ],
      scheduleDates: [
        {
          id: "date-1",
          date: "2024-03-15",
          timeSlots: [
            { id: "slot-1", startTime: "09:00", endTime: "10:00", label: "Morning" },
          ],
          isActive: true,
          notes: "Opening day",
        },
      ],
      games: [
        {
          id: "game-1",
          homeTeamId: "team-1",
          awayTeamId: "team-2",
          fieldId: "field-1",
          fieldPortion: "full",
          dateId: "date-1",
          timeSlotId: "slot-1",
          status: "scheduled",
          notes: "Championship",
        },
      ],
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
    };

    // Simulate write
    mockFs.access.mockResolvedValue(undefined);
    mockFs.writeFile.mockResolvedValue(undefined);

    const writeRequest = new NextRequest("http://localhost/api/data", {
      method: "POST",
      body: JSON.stringify(originalData),
      headers: { "Content-Type": "application/json" },
    });

    await POST(writeRequest);

    // Get what was written
    const writtenContent = mockFs.writeFile.mock.calls[0][1] as string;

    // Simulate read
    mockFs.readFile.mockResolvedValue(writtenContent);

    const response = await GET();
    const readData = await response.json();

    // Compare
    expect(readData.teams[0].name).toBe(originalData.teams[0].name);
    expect(readData.teams[0].coaches[0].email).toBe(originalData.teams[0].coaches[0].email);
    expect(readData.fields[0].canSplit).toBe(originalData.fields[0].canSplit);
    expect(readData.scheduleDates[0].timeSlots[0].startTime).toBe(
      originalData.scheduleDates[0].timeSlots[0].startTime
    );
    expect(readData.games[0].status).toBe(originalData.games[0].status);
    expect(readData.settings.seasonName).toBe(originalData.settings.seasonName);
  });
});
