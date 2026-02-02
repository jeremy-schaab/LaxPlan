import { NextRequest, NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";

const DATA_FILE = path.join(process.cwd(), "data", "laxplan-data.json");

async function ensureDataDir() {
  const dataDir = path.dirname(DATA_FILE);
  try {
    await fs.access(dataDir);
  } catch {
    await fs.mkdir(dataDir, { recursive: true });
  }
}

export async function GET() {
  try {
    await ensureDataDir();
    const data = await fs.readFile(DATA_FILE, "utf-8");
    return NextResponse.json(JSON.parse(data));
  } catch (error: any) {
    if (error.code === "ENOENT") {
      // File doesn't exist yet, return empty state
      return NextResponse.json({
        teams: [],
        fields: [],
        scheduleDates: [],
        games: [],
        weeklySchedules: [],
        settings: {
          seasonName: "Spring 2024",
          seasonStartDate: new Date().toISOString().split("T")[0],
          seasonEndDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
          defaultGameDuration: 60,
          avoidBackToBackGames: true,
          balanceHomeAway: true,
          minGamesBetweenTeams: 2,
        },
      });
    }
    return NextResponse.json({ error: "Failed to read data" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    await ensureDataDir();
    const data = await request.json();
    await fs.writeFile(DATA_FILE, JSON.stringify(data, null, 2), "utf-8");
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to save data:", error);
    return NextResponse.json({ error: "Failed to save data" }, { status: 500 });
  }
}
