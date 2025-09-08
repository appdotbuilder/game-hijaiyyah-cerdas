import { db } from '../db';
import { gameLevelsTable } from '../db/schema';
import { type GameLevel } from '../schema';
import { asc } from 'drizzle-orm';

export const getAllLevels = async (): Promise<GameLevel[]> => {
  try {
    // Fetch all game levels ordered by level number
    const results = await db.select()
      .from(gameLevelsTable)
      .orderBy(asc(gameLevelsTable.level_number))
      .execute();

    // Return results with proper type conversion for JSON fields
    return results.map(level => ({
      ...level,
      letters_introduced: level.letters_introduced as number[]
    }));
  } catch (error) {
    console.error('Failed to fetch game levels:', error);
    throw error;
  }
};