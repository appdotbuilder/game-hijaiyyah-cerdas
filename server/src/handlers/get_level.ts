import { db } from '../db';
import { gameLevelsTable } from '../db/schema';
import { type GetLevelInput, type GameLevel } from '../schema';
import { eq } from 'drizzle-orm';

export const getLevel = async (input: GetLevelInput): Promise<GameLevel | null> => {
  try {
    // Query the database for the level by level_number
    const results = await db.select()
      .from(gameLevelsTable)
      .where(eq(gameLevelsTable.level_number, input.level_number))
      .execute();

    if (results.length === 0) {
      return null;
    }

    const level = results[0];
    
    // Return the level data (no numeric conversions needed as all fields are integers or other types)
    return {
      id: level.id,
      level_number: level.level_number,
      name: level.name,
      description: level.description,
      questions_required: level.questions_required,
      letters_introduced: level.letters_introduced as number[], // Cast JSON to number array
      is_unlocked: level.is_unlocked,
      created_at: level.created_at
    };
  } catch (error) {
    console.error('Get level failed:', error);
    throw error;
  }
};