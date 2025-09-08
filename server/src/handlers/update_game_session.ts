import { db } from '../db';
import { gameSessionsTable } from '../db/schema';
import { type UpdateGameSessionInput, type GameSession } from '../schema';
import { eq } from 'drizzle-orm';

export const updateGameSession = async (input: UpdateGameSessionInput): Promise<GameSession> => {
  try {
    // First, check if the game session exists
    const existingSession = await db.select()
      .from(gameSessionsTable)
      .where(eq(gameSessionsTable.id, input.id))
      .execute();

    if (existingSession.length === 0) {
      throw new Error(`Game session with id ${input.id} not found`);
    }

    // Prepare update data - only include fields that are provided
    const updateData: Partial<typeof gameSessionsTable.$inferInsert> = {};

    if (input.current_level !== undefined) {
      updateData.current_level = input.current_level;
    }

    if (input.current_score !== undefined) {
      updateData.current_score = input.current_score;
    }

    if (input.lives_remaining !== undefined) {
      updateData.lives_remaining = input.lives_remaining;
    }

    if (input.is_active !== undefined) {
      updateData.is_active = input.is_active;
      
      // If marking session as inactive, set session_end timestamp
      if (!input.is_active) {
        updateData.session_end = new Date();
      }
    }

    // Update the game session
    const result = await db.update(gameSessionsTable)
      .set(updateData)
      .where(eq(gameSessionsTable.id, input.id))
      .returning()
      .execute();

    return result[0];
  } catch (error) {
    console.error('Game session update failed:', error);
    throw error;
  }
};