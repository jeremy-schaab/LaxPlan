import type { Team, Field, ScheduleDate, Game, FieldType } from "@/types";
import { v4 as uuidv4 } from "uuid";

interface GeneratorOptions {
  avoidBackToBack: boolean;
  balanceHomeAway: boolean;
  prioritizeAgeGroups: boolean;
}

interface FieldSlot {
  fieldId: string;
  fieldPortion: FieldType;
  fieldSection?: number;
  dateId: string;
  timeSlotId: string;
  isUsed: boolean;
}

interface TeamStats {
  teamId: string;
  gamesPlayed: number;
  homeGames: number;
  awayGames: number;
  opponents: Map<string, number>;
  lastGameSlot?: string;
}

export function generateSchedule(
  teams: Team[],
  fields: Field[],
  scheduleDates: ScheduleDate[],
  existingGames: Game[],
  options: GeneratorOptions
): Game[] {
  if (teams.length < 2 || fields.length === 0 || scheduleDates.length === 0) {
    return [];
  }

  const activeDates = scheduleDates.filter((d) => d.isActive);
  if (activeDates.length === 0) {
    return [];
  }

  const fieldSlots = generateFieldSlots(fields, activeDates);
  const teamStats = initializeTeamStats(teams, existingGames);
  const matchups = generateMatchups(teams, teamStats, options);

  const games: Game[] = [];

  const youngerAgeGroups = ["U8", "U10"];
  const youngerTeamMatchups = matchups.filter(
    (m) =>
      youngerAgeGroups.includes(
        teams.find((t) => t.id === m.homeTeamId)?.ageGroup || ""
      ) &&
      youngerAgeGroups.includes(
        teams.find((t) => t.id === m.awayTeamId)?.ageGroup || ""
      )
  );
  const olderTeamMatchups = matchups.filter(
    (m) => !youngerTeamMatchups.includes(m)
  );

  const splitSlots = fieldSlots.filter((s) => s.fieldPortion !== "full");
  const fullSlots = fieldSlots.filter((s) => s.fieldPortion === "full");

  for (const matchup of youngerTeamMatchups) {
    const availableSlot = findAvailableSlot(
      splitSlots.length > 0 ? splitSlots : fullSlots,
      matchup,
      games,
      teamStats,
      options
    );

    if (availableSlot) {
      const game: Game = {
        id: uuidv4(),
        homeTeamId: matchup.homeTeamId,
        awayTeamId: matchup.awayTeamId,
        fieldId: availableSlot.fieldId,
        fieldPortion: availableSlot.fieldPortion,
        fieldSection: availableSlot.fieldSection,
        dateId: availableSlot.dateId,
        timeSlotId: availableSlot.timeSlotId,
        status: "scheduled",
      };
      games.push(game);
      availableSlot.isUsed = true;
      updateTeamStats(teamStats, game, availableSlot);
    }
  }

  for (const matchup of olderTeamMatchups) {
    const availableSlot = findAvailableSlot(
      fullSlots,
      matchup,
      games,
      teamStats,
      options
    );

    if (availableSlot) {
      const game: Game = {
        id: uuidv4(),
        homeTeamId: matchup.homeTeamId,
        awayTeamId: matchup.awayTeamId,
        fieldId: availableSlot.fieldId,
        fieldPortion: "full",
        dateId: availableSlot.dateId,
        timeSlotId: availableSlot.timeSlotId,
        status: "scheduled",
      };
      games.push(game);
      availableSlot.isUsed = true;
      updateTeamStats(teamStats, game, availableSlot);
    }
  }

  return games;
}

function generateFieldSlots(
  fields: Field[],
  dates: ScheduleDate[]
): FieldSlot[] {
  const slots: FieldSlot[] = [];

  for (const date of dates) {
    for (const timeSlot of date.timeSlots) {
      for (const field of fields) {
        if (field.canSplit && field.maxSplits > 1) {
          for (let section = 1; section <= field.maxSplits; section++) {
            slots.push({
              fieldId: field.id,
              fieldPortion: field.maxSplits === 2 ? "half" : "third",
              fieldSection: section,
              dateId: date.id,
              timeSlotId: timeSlot.id,
              isUsed: false,
            });
          }
        }
        slots.push({
          fieldId: field.id,
          fieldPortion: "full",
          dateId: date.id,
          timeSlotId: timeSlot.id,
          isUsed: false,
        });
      }
    }
  }

  return slots;
}

function initializeTeamStats(
  teams: Team[],
  existingGames: Game[]
): Map<string, TeamStats> {
  const stats = new Map<string, TeamStats>();

  for (const team of teams) {
    stats.set(team.id, {
      teamId: team.id,
      gamesPlayed: 0,
      homeGames: 0,
      awayGames: 0,
      opponents: new Map(),
    });
  }

  for (const game of existingGames) {
    const homeStats = stats.get(game.homeTeamId);
    const awayStats = stats.get(game.awayTeamId);

    if (homeStats) {
      homeStats.gamesPlayed++;
      homeStats.homeGames++;
      homeStats.opponents.set(
        game.awayTeamId,
        (homeStats.opponents.get(game.awayTeamId) || 0) + 1
      );
    }

    if (awayStats) {
      awayStats.gamesPlayed++;
      awayStats.awayGames++;
      awayStats.opponents.set(
        game.homeTeamId,
        (awayStats.opponents.get(game.homeTeamId) || 0) + 1
      );
    }
  }

  return stats;
}

interface Matchup {
  homeTeamId: string;
  awayTeamId: string;
}

function generateMatchups(
  teams: Team[],
  teamStats: Map<string, TeamStats>,
  options: GeneratorOptions
): Matchup[] {
  const matchups: Matchup[] = [];

  const teamsByAge = new Map<string, Team[]>();
  for (const team of teams) {
    const ageTeams = teamsByAge.get(team.ageGroup) || [];
    ageTeams.push(team);
    teamsByAge.set(team.ageGroup, ageTeams);
  }

  for (const [, ageTeams] of teamsByAge) {
    if (ageTeams.length < 2) continue;

    for (let i = 0; i < ageTeams.length; i++) {
      for (let j = i + 1; j < ageTeams.length; j++) {
        const team1 = ageTeams[i];
        const team2 = ageTeams[j];

        let homeTeam = team1;
        let awayTeam = team2;

        if (options.balanceHomeAway) {
          const stats1 = teamStats.get(team1.id);
          const stats2 = teamStats.get(team2.id);

          if (stats1 && stats2) {
            const homeBalance1 = stats1.homeGames - stats1.awayGames;
            const homeBalance2 = stats2.homeGames - stats2.awayGames;

            if (homeBalance1 > homeBalance2) {
              homeTeam = team2;
              awayTeam = team1;
            }
          }
        }

        matchups.push({
          homeTeamId: homeTeam.id,
          awayTeamId: awayTeam.id,
        });
      }
    }
  }

  return shuffleArray(matchups);
}

function findAvailableSlot(
  slots: FieldSlot[],
  matchup: Matchup,
  scheduledGames: Game[],
  teamStats: Map<string, TeamStats>,
  options: GeneratorOptions
): FieldSlot | null {
  for (const slot of slots) {
    if (slot.isUsed) continue;

    const slotKey = `${slot.dateId}-${slot.timeSlotId}`;
    const homeStats = teamStats.get(matchup.homeTeamId);
    const awayStats = teamStats.get(matchup.awayTeamId);

    if (options.avoidBackToBack) {
      if (homeStats?.lastGameSlot === slotKey) continue;
      if (awayStats?.lastGameSlot === slotKey) continue;
    }

    const conflictingGame = scheduledGames.find(
      (g) =>
        g.dateId === slot.dateId &&
        g.timeSlotId === slot.timeSlotId &&
        (g.homeTeamId === matchup.homeTeamId ||
          g.homeTeamId === matchup.awayTeamId ||
          g.awayTeamId === matchup.homeTeamId ||
          g.awayTeamId === matchup.awayTeamId)
    );

    if (conflictingGame) continue;

    if (slot.fieldPortion !== "full") {
      const fieldConflict = scheduledGames.find(
        (g) =>
          g.dateId === slot.dateId &&
          g.timeSlotId === slot.timeSlotId &&
          g.fieldId === slot.fieldId &&
          g.fieldSection === slot.fieldSection
      );
      if (fieldConflict) continue;
    }

    return slot;
  }

  return null;
}

function updateTeamStats(
  stats: Map<string, TeamStats>,
  game: Game,
  slot: FieldSlot
): void {
  const slotKey = `${slot.dateId}-${slot.timeSlotId}`;

  const homeStats = stats.get(game.homeTeamId);
  if (homeStats) {
    homeStats.gamesPlayed++;
    homeStats.homeGames++;
    homeStats.lastGameSlot = slotKey;
    homeStats.opponents.set(
      game.awayTeamId,
      (homeStats.opponents.get(game.awayTeamId) || 0) + 1
    );
  }

  const awayStats = stats.get(game.awayTeamId);
  if (awayStats) {
    awayStats.gamesPlayed++;
    awayStats.awayGames++;
    awayStats.lastGameSlot = slotKey;
    awayStats.opponents.set(
      game.homeTeamId,
      (awayStats.opponents.get(game.homeTeamId) || 0) + 1
    );
  }
}

function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}
