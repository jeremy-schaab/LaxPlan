import type {
  AISchedulingRequest,
  AISchedulingResponse,
  Game,
  Team,
  Field,
  TimeSlot,
  SchedulingConstraints,
} from "@/types";

export interface AISchedulerConfig {
  endpoint: string;
  apiKey: string;
  deploymentName: string;
}

/**
 * AI-powered schedule optimizer using Azure OpenAI
 * Generates optimal game schedules based on teams, fields, and constraints
 */
export class AIScheduler {
  private config: AISchedulerConfig | null = null;

  constructor() {
    this.config = this.loadConfig();
  }

  /**
   * Load configuration from environment variables
   */
  private loadConfig(): AISchedulerConfig | null {
    const endpoint = process.env.AZURE_OPENAI_ENDPOINT;
    const apiKey = process.env.AZURE_OPENAI_API_KEY;
    const deploymentName = process.env.AZURE_OPENAI_DEPLOYMENT || "gpt-4";

    if (!endpoint || !apiKey) {
      return null;
    }

    return { endpoint, apiKey, deploymentName };
  }

  /**
   * Check if AI scheduling is enabled (config is available)
   */
  isEnabled(): boolean {
    return this.config !== null;
  }

  /**
   * Get the current configuration status
   */
  getConfigStatus(): { enabled: boolean; endpoint?: string; deployment?: string } {
    if (!this.config) {
      return { enabled: false };
    }
    return {
      enabled: true,
      endpoint: this.config.endpoint.replace(/\/+$/, ""),
      deployment: this.config.deploymentName,
    };
  }

  /**
   * Generate an optimized schedule using AI
   */
  async generateSchedule(request: AISchedulingRequest): Promise<AISchedulingResponse> {
    if (!this.config) {
      return {
        success: false,
        games: [],
        error: "AI Scheduling is not configured. Please set AZURE_OPENAI_ENDPOINT and AZURE_OPENAI_API_KEY environment variables.",
      };
    }

    try {
      const prompt = this.buildPrompt(request);
      const response = await this.callAzureOpenAI(prompt);
      return this.parseResponse(response, request);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
      return {
        success: false,
        games: [],
        error: `AI Scheduling failed: ${errorMessage}`,
      };
    }
  }

  /**
   * Build a structured prompt for the AI model
   */
  private buildPrompt(request: AISchedulingRequest): string {
    const { teams, fields, timeSlots, constraints, existingGames } = request;

    // Group teams by age group
    const teamsByAgeGroup: Record<string, Team[]> = {};
    teams.forEach((team) => {
      if (!teamsByAgeGroup[team.ageGroup]) {
        teamsByAgeGroup[team.ageGroup] = [];
      }
      teamsByAgeGroup[team.ageGroup].push(team);
    });

    // Build field info with split capabilities
    const fieldInfo = fields.map((f) => ({
      id: f.id,
      name: f.name,
      canSplit: f.canSplit,
      maxSplits: f.maxSplits,
      slots: f.canSplit ? f.maxSplits : 1,
    }));

    const prompt = `You are a lacrosse schedule optimizer. Generate an optimal game schedule based on the following inputs.

## Teams by Age Group
${Object.entries(teamsByAgeGroup)
  .map(
    ([ageGroup, ageTeams]) =>
      `### ${ageGroup}\n${ageTeams.map((t) => `- ${t.id}: ${t.name}${t.organizationId ? ` (Org: ${t.organizationId})` : ""}`).join("\n")}`
  )
  .join("\n\n")}

## Available Fields
${fieldInfo.map((f) => `- ${f.id}: ${f.name} (${f.canSplit ? `can split to ${f.maxSplits} sections` : "full field only"})`).join("\n")}

## Time Slots
${timeSlots.map((ts) => `- ${ts.id}: ${ts.startTime} - ${ts.endTime}`).join("\n")}

## Constraints
- Avoid back-to-back games: ${constraints.avoidBackToBack}
- Balance home/away: ${constraints.balanceHomeAway}
- Teams play within age group: ${constraints.prioritizeAgeGroups}
- Separate same-org teams: ${constraints.separateSameOrgTeams}
${constraints.maxGamesPerTeam ? `- Max games per team: ${constraints.maxGamesPerTeam}` : ""}
${constraints.customConstraints?.length ? `- Custom: ${constraints.customConstraints.join(", ")}` : ""}

${existingGames?.length ? `## Existing Games (avoid conflicts)\n${existingGames.map((g) => `- ${g.homeTeamId} vs ${g.awayTeamId} at ${g.fieldId} (${g.timeSlotId})`).join("\n")}` : ""}

## Rules
1. Younger teams (U8, U10) should use half or third fields when available
2. Older teams (U14, MS, HS, Adult) should use full fields
3. U12 can use either depending on availability
4. Each game needs: homeTeamId, awayTeamId, fieldId, fieldPortion, fieldSection (if split), timeSlotId
5. Teams should only play teams in their same age group
6. No team should play itself
7. Maximize field utilization

## Output Format
Return a JSON object with this exact structure:
{
  "games": [
    {
      "homeTeamId": "team-id",
      "awayTeamId": "team-id",
      "fieldId": "field-id",
      "fieldPortion": "full" | "half" | "third",
      "fieldSection": 1 | 2 | 3,
      "timeSlotId": "slot-id",
      "status": "scheduled"
    }
  ],
  "reasoning": "Brief explanation of scheduling decisions",
  "warnings": ["Any concerns or limitations"]
}

Generate the optimal schedule now. Return ONLY the JSON object, no other text.`;

    return prompt;
  }

  /**
   * Call Azure OpenAI API
   */
  private async callAzureOpenAI(prompt: string): Promise<string> {
    if (!this.config) {
      throw new Error("AI Scheduler not configured");
    }

    const { endpoint, apiKey, deploymentName } = this.config;
    const apiVersion = "2024-02-15-preview";
    const url = `${endpoint.replace(/\/+$/, "")}/openai/deployments/${deploymentName}/chat/completions?api-version=${apiVersion}`;

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "api-key": apiKey,
      },
      body: JSON.stringify({
        messages: [
          {
            role: "system",
            content:
              "You are a lacrosse schedule optimization assistant. You generate optimal game schedules in JSON format based on teams, fields, and constraints provided.",
          },
          {
            role: "user",
            content: prompt,
          },
        ],
        temperature: 0.3,
        max_tokens: 4000,
        response_format: { type: "json_object" },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Azure OpenAI API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    return data.choices?.[0]?.message?.content || "";
  }

  /**
   * Parse and validate the AI response
   */
  private parseResponse(
    responseText: string,
    request: AISchedulingRequest
  ): AISchedulingResponse {
    try {
      const parsed = JSON.parse(responseText);

      if (!parsed.games || !Array.isArray(parsed.games)) {
        return {
          success: false,
          games: [],
          error: "Invalid response format: missing games array",
        };
      }

      // Validate each game
      const validGames: Omit<Game, "id">[] = [];
      const warnings: string[] = parsed.warnings || [];

      const validTeamIds = new Set(request.teams.map((t) => t.id));
      const validFieldIds = new Set(request.fields.map((f) => f.id));
      const validTimeSlotIds = new Set(request.timeSlots.map((ts) => ts.id));

      for (const game of parsed.games) {
        // Validate required fields
        if (!game.homeTeamId || !game.awayTeamId || !game.fieldId || !game.timeSlotId) {
          warnings.push(`Skipped game with missing required fields`);
          continue;
        }

        // Validate team IDs
        if (!validTeamIds.has(game.homeTeamId) || !validTeamIds.has(game.awayTeamId)) {
          warnings.push(`Skipped game with invalid team ID`);
          continue;
        }

        // Validate field ID
        if (!validFieldIds.has(game.fieldId)) {
          warnings.push(`Skipped game with invalid field ID`);
          continue;
        }

        // Validate time slot ID
        if (!validTimeSlotIds.has(game.timeSlotId)) {
          warnings.push(`Skipped game with invalid time slot ID`);
          continue;
        }

        // Validate no team plays itself
        if (game.homeTeamId === game.awayTeamId) {
          warnings.push(`Skipped game where team plays itself`);
          continue;
        }

        // Build valid game object
        const validGame: Omit<Game, "id"> = {
          seasonId: request.seasonId,
          homeTeamId: game.homeTeamId,
          awayTeamId: game.awayTeamId,
          fieldId: game.fieldId,
          fieldPortion: game.fieldPortion || "full",
          fieldSection: game.fieldSection,
          dateId: "", // Will be set by caller
          timeSlotId: game.timeSlotId,
          fieldAllocationId: request.fieldAllocationId,
          status: "scheduled",
        };

        validGames.push(validGame);
      }

      return {
        success: validGames.length > 0,
        games: validGames,
        reasoning: parsed.reasoning,
        warnings: warnings.length > 0 ? warnings : undefined,
      };
    } catch (error) {
      return {
        success: false,
        games: [],
        error: `Failed to parse AI response: ${error instanceof Error ? error.message : "Unknown error"}`,
      };
    }
  }
}

// Singleton instance
let aiSchedulerInstance: AIScheduler | null = null;

export function getAIScheduler(): AIScheduler {
  if (!aiSchedulerInstance) {
    aiSchedulerInstance = new AIScheduler();
  }
  return aiSchedulerInstance;
}

// For testing - reset the singleton
export function resetAIScheduler(): void {
  aiSchedulerInstance = null;
}
