import { NextRequest, NextResponse } from "next/server";
import { getAIScheduler } from "@/lib/ai-scheduler";
import type { AISchedulingRequest } from "@/types";

/**
 * GET /api/ai-schedule
 * Check if AI scheduling is enabled and get configuration status
 */
export async function GET() {
  const aiScheduler = getAIScheduler();
  const status = aiScheduler.getConfigStatus();

  return NextResponse.json(status);
}

/**
 * POST /api/ai-schedule
 * Generate an AI-optimized schedule
 */
export async function POST(request: NextRequest) {
  const aiScheduler = getAIScheduler();

  // Check if AI is enabled
  if (!aiScheduler.isEnabled()) {
    return NextResponse.json(
      {
        success: false,
        error:
          "AI Scheduling is not enabled. Please configure AZURE_OPENAI_ENDPOINT and AZURE_OPENAI_API_KEY environment variables.",
      },
      { status: 503 }
    );
  }

  try {
    // Parse request body
    const body = await request.json();

    // Validate required fields
    if (!body.seasonId) {
      return NextResponse.json(
        { success: false, error: "seasonId is required" },
        { status: 400 }
      );
    }

    if (!body.date) {
      return NextResponse.json(
        { success: false, error: "date is required" },
        { status: 400 }
      );
    }

    if (!body.teams || !Array.isArray(body.teams) || body.teams.length < 2) {
      return NextResponse.json(
        { success: false, error: "At least 2 teams are required" },
        { status: 400 }
      );
    }

    if (!body.fields || !Array.isArray(body.fields) || body.fields.length === 0) {
      return NextResponse.json(
        { success: false, error: "At least 1 field is required" },
        { status: 400 }
      );
    }

    if (!body.timeSlots || !Array.isArray(body.timeSlots) || body.timeSlots.length === 0) {
      return NextResponse.json(
        { success: false, error: "At least 1 time slot is required" },
        { status: 400 }
      );
    }

    if (!body.constraints) {
      return NextResponse.json(
        { success: false, error: "constraints object is required" },
        { status: 400 }
      );
    }

    // Build the AI scheduling request
    const aiRequest: AISchedulingRequest = {
      seasonId: body.seasonId,
      date: body.date,
      fieldAllocationId: body.fieldAllocationId || "",
      teams: body.teams,
      fields: body.fields,
      timeSlots: body.timeSlots,
      constraints: body.constraints,
      existingGames: body.existingGames || [],
    };

    // Generate the schedule using AI
    const result = await aiScheduler.generateSchedule(aiRequest);

    if (!result.success) {
      return NextResponse.json(result, { status: 500 });
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error("AI Schedule API error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to generate AI schedule",
      },
      { status: 500 }
    );
  }
}
