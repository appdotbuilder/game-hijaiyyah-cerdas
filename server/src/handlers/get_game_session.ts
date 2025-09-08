import { db } from '../db';
import { gameSessionsTable } from '../db/schema';
import { type GetGameSessionInput, type GameSession } from '../schema';
import { eq } from 'drizzle-orm';

export const getGameSession = async (input: GetGameSessionInput): Promise<GameSession | null> => {
  try {
    // Query the database for the specific game session
    const results = await db.select()
      .from(gameSessionsTable)
      .where(eq(gameSessionsTable.id, input.session_id))
      .execute();

    // Return null if no session found
    if (results.length === 0) {
      return null;
    }

    // Return the first (and should be only) result
    const session = results[0];
    return {
      id: session.id,
      player_name: session.player_name,
      current_level: session.current_level,
      current_score: session.current_score,
      lives_remaining: session.lives_remaining,
      session_start: session.session_start,
      session_end: session.session_end,
      is_active: session.is_active,
      created_at: session.created_at
    };
  } catch (error) {
    console.error('Game session retrieval failed:', error);
    throw error;
  }
};