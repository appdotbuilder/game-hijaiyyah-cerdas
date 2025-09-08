import { db } from '../db';
import { gameSessionsTable } from '../db/schema';
import { type CreateGameSessionInput, type GameSession } from '../schema';

export async function createGameSession(input: CreateGameSessionInput): Promise<GameSession> {
  try {
    // Insert new game session record
    const result = await db.insert(gameSessionsTable)
      .values({
        player_name: input.player_name,
        current_level: input.current_level,
        lives_remaining: input.lives_remaining,
        current_score: 0, // Always start with 0 score
        is_active: true, // New sessions are always active
      })
      .returning()
      .execute();

    const gameSession = result[0];
    return gameSession;
  } catch (error) {
    console.error('Game session creation failed:', error);
    throw error;
  }
}